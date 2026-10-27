import json
from django.db import connection
from django.http import HttpResponse
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView


from .models import Cohorte, Domaine, Projet, Role
from .permissions import ReadOnlyOrRole
from .serializers import (
    CohorteSerializer, DomaineSerializer, ProjetSerializer,
    RegisterSerializer, UserSerializer,
)
from .throttling import AuthRateThrottle


@extend_schema(
    summary="État de santé de l'API et de la base de données",
    description="Route publique sans authentification ni donnée sensible renvoyant l'état de fonctionnement de l'API et de la connexion à la base de données.",
    responses={
        200: OpenApiResponse(
            description="L'API et la base de données sont opérationnelles.",
            response={
                "type": "object",
                "properties": {
                    "status": {"type": "string", "example": "ok"},
                    "database": {"type": "string", "example": "connected"},
                },
            },
        ),
        503: OpenApiResponse(
            description="La base de données ne répond pas ou est dégradée.",
            response={
                "type": "object",
                "properties": {
                    "status": {"type": "string", "example": "degraded"},
                    "database": {"type": "string", "example": "disconnected"},
                },
            },
        ),
    },
)
class HealthView(APIView):
    """Vérifie que l'API et la base répondent. Sert à la supervision et au déploiement."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            with connection.cursor() as cur:
                cur.execute("SELECT 1")
            return Response(
                {"status": "ok", "database": "connected"},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"status": "degraded", "database": "disconnected"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class CiatTokenObtainPairView(TokenObtainPairView):
    """Obtention du JWT protégé par limitation de débit anti force-brute."""

    throttle_classes = [AuthRateThrottle]


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]


@extend_schema_view(
    get=extend_schema(summary="Consulter mon profil utilisateur", responses={200: UserSerializer}),
    put=extend_schema(summary="Modifier l'ensemble de mon profil", responses={200: UserSerializer}),
    patch=extend_schema(summary="Modifier partiellement mon profil", responses={200: UserSerializer}),
    delete=extend_schema(
        summary="Supprimer ou anonymiser mon compte (Droit à l'effacement RGPD)",
        description="Exige le mot de passe actuel pour confirmation. Supprime les conversations privées de l'assistant et anonymise les données personnelles en conservant l'intégrité des projets.",
        request={"application/json": {"type": "object", "properties": {"password": {"type": "string"}}, "required": ["password"]}},
        responses={204: None, 400: dict, 401: dict},
    ),
)
class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def delete(self, request, *args, **kwargs):
        """Suppression ou anonymisation du compte avec confirmation par mot de passe."""
        password = request.data.get("password") if isinstance(request.data, dict) else None
        if not password or not str(password).strip():
            return Response(
                {"detail": "Le mot de passe actuel est requis pour confirmer la suppression ou l'anonymisation du compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.check_password(str(password)):
            return Response(
                {"detail": "Mot de passe incorrect. Impossible de supprimer le compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        user_id = user.id

        # 1. Suppression des conversations privées de l'assistant IA
        from apps.assistant.models import Conversation
        Conversation.objects.filter(utilisateur=user).delete()

        # 2. Anonymisation des données personnelles pour préserver l'intégrité des projets et décisions
        user.first_name = "Utilisateur"
        user.last_name = "Anonymisé"
        user.email = f"anonymise_{user_id}@ciat.sn"
        user.telephone = ""
        user.genre = ""
        user.organisation = ""
        user.is_active = False
        user.set_unusable_password()
        user.save(update_fields=[
            "first_name", "last_name", "email", "telephone",
            "genre", "organisation", "is_active", "password",
        ])

        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    summary="Exporter l'ensemble de mes données personnelles en JSON (Portabilité RGPD)",
    description="Télécharge un fichier JSON structuré reprenant profil, projets, dossiers, documents, conversations assistant et interactions.",
    responses={
        200: {
            "type": "string",
            "format": "binary",
            "description": "Fichier JSON exporté",
        }
    },
)
class MeExportView(APIView):
    """Exportation intégrale des données personnelles d'un utilisateur conformément au RGPD."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Profil utilisateur
        profil = {
            "id": user.id,
            "email": user.email,
            "nom": user.last_name,
            "prenom": user.first_name,
            "role": user.role,
            "genre": user.genre,
            "telephone": user.telephone,
            "organisation": user.organisation,
            "date_inscription": user.date_joined.isoformat() if user.date_joined else None,
            "dernier_acces": user.last_login.isoformat() if user.last_login else None,
        }

        # 2. Projets portés
        projets = [
            {
                "id": p.id,
                "titre": p.titre,
                "resume": p.resume,
                "probleme": p.probleme,
                "solution": p.solution,
                "domaine": p.domaine.nom if p.domaine else None,
                "cohorte": p.cohorte.nom if p.cohorte else None,
                "statut": p.statut,
                "vues": p.vues,
                "cree_le": p.cree_le.isoformat() if p.cree_le else None,
            }
            for p in user.projets_portes.select_related("domaine", "cohorte").all()
        ]

        # 3. Dossiers de candidature
        from apps.incubator.models import Dossier
        dossiers = []
        for d in Dossier.objects.filter(projet__porteur=user).prefetch_related("pieces").select_related("projet"):
            dossiers.append({
                "id": d.id,
                "projet_id": d.projet_id,
                "projet_titre": d.projet.titre,
                "statut": d.statut,
                "completude": d.completude,
                "soumis_le": d.soumis_le.isoformat() if d.soumis_le else None,
                "cree_le": d.cree_le.isoformat() if d.cree_le else None,
                "pieces": [
                    {
                        "id": piece.id,
                        "type": piece.type,
                        "nom": piece.nom,
                        "depose_le": piece.depose_le.isoformat() if piece.depose_le else None,
                    }
                    for piece in d.pieces.all()
                ],
            })

        # 4. Documents rédigés
        from apps.documents.models import Document
        documents = []
        for doc in Document.objects.filter(auteur=user).select_related("modele", "projet").prefetch_related("versions"):
            documents.append({
                "id": doc.id,
                "titre": doc.titre,
                "modele": doc.modele.nom if doc.modele else None,
                "projet_id": doc.projet_id,
                "statut": doc.statut,
                "cree_le": doc.cree_le.isoformat() if doc.cree_le else None,
                "modifie_le": doc.modifie_le.isoformat() if doc.modifie_le else None,
                "versions": [
                    {
                        "numero": v.numero,
                        "date": v.date.isoformat() if v.date else None,
                        "sections": v.sections,
                    }
                    for v in doc.versions.all()
                ],
            })

        # 5. Conversations assistant IA
        from apps.assistant.models import Conversation
        conversations = []
        for c in Conversation.objects.filter(utilisateur=user).prefetch_related("messages"):
            conversations.append({
                "id": c.id,
                "titre": c.titre,
                "cree_le": c.cree_le.isoformat() if c.cree_le else None,
                "modifie_le": c.modifie_le.isoformat() if c.modifie_le else None,
                "messages": [
                    {
                        "id": m.id,
                        "role": m.role,
                        "contenu": m.contenu,
                        "mode": m.mode,
                        "cree_le": m.cree_le.isoformat() if m.cree_le else None,
                    }
                    for m in c.messages.all()
                ],
            })

        # 6. Interactions (manifestations d'intérêt et messages de contact)
        from apps.gallery.models import ManifestationInteret
        from apps.portal.models import MessageContact

        interets = [
            {
                "id": mi.id,
                "fiche_id": mi.fiche_id,
                "fiche_titre": mi.fiche.titre if mi.fiche else None,
                "organisation": mi.organisation,
                "message": mi.message,
                "cree_le": mi.cree_le.isoformat() if mi.cree_le else None,
            }
            for mi in ManifestationInteret.objects.filter(email__iexact=user.email).select_related("fiche")
        ]

        messages_contact = [
            {
                "id": mc.id,
                "sujet": mc.sujet,
                "message": mc.message,
                "traite": mc.traite,
                "cree_le": mc.cree_le.isoformat() if mc.cree_le else None,
            }
            for mc in MessageContact.objects.filter(email__iexact=user.email)
        ]

        export_data = {
            "export_le": timezone.now().isoformat(),
            "profil": profil,
            "projets": projets,
            "dossiers": dossiers,
            "documents": documents,
            "conversations_assistant": conversations,
            "interactions": {
                "manifestations_interet": interets,
                "messages_contact": messages_contact,
            },
        }

        content = json.dumps(export_data, indent=2, ensure_ascii=False)
        response = HttpResponse(content, content_type="application/json; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="donnees_personnelles_{user.id}.json"'
        return response



class DomaineViewSet(viewsets.ModelViewSet):
    queryset = Domaine.objects.all()
    serializer_class = DomaineSerializer
    permission_classes = [ReadOnlyOrRole(Role.ADMIN, Role.COORDONNATEUR)]
    pagination_class = None


class CohorteViewSet(viewsets.ModelViewSet):
    queryset = Cohorte.objects.all()
    serializer_class = CohorteSerializer
    permission_classes = [ReadOnlyOrRole(Role.ADMIN, Role.COORDONNATEUR)]
    pagination_class = None


from rest_framework.permissions import AllowAny, IsAuthenticated

class ProjetViewSet(viewsets.ModelViewSet):
    """Un porteur voit et modifie ses projets. L'équipe CIAT, le comité et les mentors les voient tous."""

    serializer_class = ProjetSerializer
    permission_classes = [
        IsAuthenticated,
        ReadOnlyOrRole(Role.PORTEUR, Role.ADMIN, Role.COORDONNATEUR),
    ]
    filterset_fields = ["domaine", "cohorte", "statut"]
    search_fields = ["titre", "resume"]
    ordering_fields = ["cree_le", "titre"]

    def get_queryset(self):
        qs = Projet.objects.select_related("domaine", "cohorte", "porteur")
        user = self.request.user
        if not user or not user.is_authenticated:
            return Projet.objects.none()
        role = getattr(user, "role", None)
        if role in (Role.ADMIN, Role.COORDONNATEUR, Role.COMITE):
            return qs
        if role == Role.MENTOR:
            return qs.filter(affectation_mentor__mentor=user)
        return qs.filter(porteur=user)

    def perform_create(self, serializer):
        serializer.save(porteur=self.request.user)
