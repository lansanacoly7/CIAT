import json

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import connection
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Cohorte, Domaine, JournalAudit, Notification, Projet, Role, User
from .permissions import HasRole, IsEquipeCIAT, ReadOnlyOrRole
from .serializers import (
    CohorteSerializer,
    DomaineSerializer,
    JournalAuditSerializer,
    MotDePasseOublieSerializer,
    MotDePasseReinitialiserSerializer,
    NotificationSerializer,
    ProjetSerializer,
    RegisterSerializer,
    UserRoleUpdateSerializer,
    UserSerializer,
)
from .services import enregistrer_audit, tracer_changement_role
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


@extend_schema(
    summary="Demande de réinitialisation de mot de passe (Public)",
    description=(
        "Envoie un lien contenant un jeton sécurisé à usage unique expiré au bout de 1 heure. "
        "Pour des raisons strictes de sécurité (anti-énumération de comptes), cette route renvoie "
        "toujours un statut 200 avec le même message, que l'adresse email existe ou non."
    ),
    request=MotDePasseOublieSerializer,
    responses={
        200: OpenApiResponse(
            description="Demande prise en compte (message générique systématique)."
        ),
        400: OpenApiResponse(description="Format d'adresse email invalide."),
    },
)
class MotDePasseOublieView(APIView):
    """POST /api/auth/mot-de-passe/oublie/ : Demande de réinitialisation sécurisée."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = MotDePasseOublieSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()

        # Message générique systématique pour contrer toute tentative d'énumération de comptes
        message_reponse = (
            "Si cette adresse email correspond à un compte actif sur la plateforme, "
            "un lien de réinitialisation valable 1 heure vous a été envoyé par email."
        )

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            # Génération du jeton sécurisé signé avec horodatage
            inner_token = default_token_generator.make_token(user)
            jeton = signing.dumps(
                {"uid": user.pk, "tok": inner_token},
                salt="ciat.password_reset",
            )

            site_url = getattr(settings, "SITE_URL", "http://localhost:3000").rstrip("/")
            lien_reinitialisation = f"{site_url}/reinitialiser-mot-de-passe?jeton={jeton}"

            sujet = "[CIAT] Réinitialisation de votre mot de passe"
            corps = (
                f"Bonjour {user.get_full_name() or user.email},\n\n"
                f"Une demande de réinitialisation de mot de passe a été initiée pour votre compte "
                f"sur la plateforme du Centre d'Innovation, d'Application et de Transfert (CIAT).\n\n"
                f"Pour définir un nouveau mot de passe, veuillez cliquer sur le lien suivant (valable 1 heure) :\n"
                f"{lien_reinitialisation}\n\n"
                f"Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité : "
                f"votre mot de passe actuel reste inchangé.\n\n"
                f"Cordialement,\n"
                f"L'équipe du CIAT"
            )

            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "CIAT <contact@ciat.sn>")
            try:
                send_mail(
                    subject=sujet,
                    message=corps,
                    from_email=from_email,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                pass

            enregistrer_audit(
                acteur=None,
                action="demande_reinitialisation_mdp",
                objet=f"Utilisateur {user.email}",
                avant=None,
                apres={"email": user.email},
            )

        return Response({"detail": message_reponse}, status=status.HTTP_200_OK)


@extend_schema(
    summary="Définition d'un nouveau mot de passe via jeton sécurisé (Public)",
    description=(
        "Valide le jeton à usage unique (durée de validité : 1 heure), vérifie les contraintes "
        "de robustesse du nouveau mot de passe selon la politique de sécurité du CIAT, "
        "et invalide immédiatement le jeton pour prévenir toute réutilisation."
    ),
    request=MotDePasseReinitialiserSerializer,
    responses={
        200: OpenApiResponse(description="Mot de passe modifié avec succès."),
        400: OpenApiResponse(description="Jeton expiré, déjà utilisé ou mot de passe non conforme."),
    },
)
class MotDePasseReinitialiserView(APIView):
    """POST /api/auth/mot-de-passe/reinitialiser/ : Réinitialisation effective du mot de passe."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = MotDePasseReinitialiserSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        jeton = serializer.validated_data["jeton"].strip()
        nouveau_mdp = serializer.validated_data["mot_de_passe"]

        # 1. Validation de la signature et de la durée d'expiration (1 heure = 3600 secondes)
        try:
            payload = signing.loads(jeton, salt="ciat.password_reset", max_age=3600)
        except signing.SignatureExpired:
            return Response(
                {"detail": "Le jeton de réinitialisation a expiré (durée de validité : 1 heure). Veuillez effectuer une nouvelle demande."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except signing.BadSignature:
            return Response(
                {"detail": "Le jeton de réinitialisation est invalide ou corrompu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(payload, dict) or "uid" not in payload or "tok" not in payload:
            return Response(
                {"detail": "Structure de jeton non reconnue."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(pk=payload["uid"], is_active=True).first()
        if not user:
            return Response(
                {"detail": "Compte utilisateur introuvable ou désactivé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Vérification que le jeton n'a pas déjà été consommé (invalidation automatique)
        if not default_token_generator.check_token(user, payload["tok"]):
            return Response(
                {"detail": "Ce jeton a déjà été utilisé ou n'est plus valide. Veuillez renouveler votre demande."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Validation de la robustesse du mot de passe selon les règles Django
        try:
            validate_password(nouveau_mdp, user=user)
        except DjangoValidationError as err:
            return Response(
                {"detail": list(err.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Modification atomique du mot de passe (invalide automatiquement tout usage futur du token)
        user.set_password(nouveau_mdp)
        user.save(update_fields=["password"])

        enregistrer_audit(
            acteur=user,
            action="reinitialisation_mdp_succes",
            objet=f"Utilisateur {user.email}",
            avant=None,
            apres={"email": user.email, "statut": "succes"},
        )

        return Response(
            {"detail": "Votre mot de passe a été réinitialisé avec succès. Vous pouvez désormais vous connecter."},
            status=status.HTTP_200_OK,
        )


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
        # Un projet retiré par son porteur n'apparaît plus dans son espace.
        return qs.filter(porteur=user).exclude(statut=Projet.Statut.RETIRE)

    def perform_create(self, serializer):
        serializer.save(porteur=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Suppression encadrée.

        - Porteur, projet au stade « idée » (brouillon) : suppression définitive.
        - Porteur, dossier déposé : retrait (suppression douce, trace conservée pour le comité).
        - Porteur, projet sélectionné / en incubation ou au-delà : refusé.
        - Admin / coordonnateur : suppression définitive.
        """
        projet = self.get_object()
        role = getattr(request.user, "role", None)

        if role == Role.PORTEUR:
            if projet.statut == Projet.Statut.IDEE:
                return super().destroy(request, *args, **kwargs)
            if projet.statut == Projet.Statut.DEPOSE:
                projet.statut = Projet.Statut.RETIRE
                projet.save(update_fields=["statut", "modifie_le"])
                return Response({"statut": projet.statut}, status=status.HTTP_200_OK)
            return Response(
                {"detail": "Ce projet ne peut plus être supprimé depuis votre espace. "
                           "Contactez l'équipe CIAT pour toute demande de clôture."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)


@extend_schema(
    summary="Journal d'audit des actions sensibles",
    description="Consultation en lecture seule du journal d'audit, filtrable par acteur, action et date.",
    responses={
        200: JournalAuditSerializer(many=True),
        403: OpenApiResponse(description="Accès réservé à l'équipe CIAT"),
    },
)
class JournalAuditListView(generics.ListAPIView):
    """GET /api/audit/ : Consultation du journal d'audit en lecture seule pour l'administrateur et le coordonnateur."""

    serializer_class = JournalAuditSerializer
    permission_classes = [IsAuthenticated, IsEquipeCIAT]
    queryset = JournalAudit.objects.none()

    def get_queryset(self):
        user = self.request.user
        if getattr(self, "swagger_fake_view", False) or not user or not user.is_authenticated:
            return JournalAudit.objects.none()
        qs = JournalAudit.objects.select_related("acteur").order_by("-date")
        acteur = self.request.query_params.get("acteur")
        if acteur:
            if acteur.isdigit():
                qs = qs.filter(acteur_id=int(acteur))
            else:
                qs = qs.filter(acteur__email__icontains=acteur)

        action = self.request.query_params.get("action")
        if action:
            qs = qs.filter(action=action)

        date_val = self.request.query_params.get("date")
        if date_val:
            qs = qs.filter(date__date=date_val)

        date_debut = self.request.query_params.get("date_debut")
        if date_debut:
            qs = qs.filter(date__date__gte=date_debut)

        date_fin = self.request.query_params.get("date_fin")
        if date_fin:
            qs = qs.filter(date__date__lte=date_fin)

        return qs


@extend_schema(
    summary="Liste des notifications de l'utilisateur",
    description="Renvoie les notifications de l'utilisateur connecté avec filtre optionnel ?non_lues=1.",
    responses={200: NotificationSerializer(many=True)},
)
class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ : Consultation des notifications internes de l'utilisateur connecté."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.none()

    def get_queryset(self):
        user = self.request.user
        if getattr(self, "swagger_fake_view", False) or not user or not user.is_authenticated:
            return Notification.objects.none()
        qs = Notification.objects.filter(destinataire=user).order_by("-date")
        non_lues = self.request.query_params.get("non_lues")
        if non_lues in ("1", "true", "True", True):
            qs = qs.filter(lue=False)
        return qs


@extend_schema(
    summary="Marquer une notification comme lue",
    description="Passe la notification spécifiée au statut lu pour l'utilisateur connecté.",
    request=None,
    responses={
        200: NotificationSerializer,
        404: OpenApiResponse(description="Notification introuvable"),
    },
)
class NotificationMarquerLueView(APIView):
    """POST /api/notifications/{id}/lue/ : Marquer une notification comme lue."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, destinataire=request.user)
        notification.lue = True
        notification.save(update_fields=["lue"])
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Marquer toutes les notifications comme lues",
    description="Marque l'intégralité des notifications non lues de l'utilisateur connecté comme lues.",
    request=None,
    responses={200: OpenApiResponse(description="Notifications marquées comme lues")},
)
class NotificationToutLireView(APIView):
    """POST /api/notifications/tout-lire/ : Marquer toutes les notifications comme lues."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        nb = Notification.objects.filter(destinataire=request.user, lue=False).update(lue=True)
        return Response(
            {"detail": "Toutes vos notifications sont marquées comme lues.", "modifiees": nb},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    summary="Modifier le rôle d'un utilisateur (Administrateur)",
    description="Permet à un administrateur de modifier le rôle d'un utilisateur.",
    request=UserRoleUpdateSerializer,
    responses={
        200: UserSerializer,
        403: OpenApiResponse(description="Accès réservé aux administrateurs"),
    },
)
class UserRoleUpdateView(APIView):
    """PATCH /api/users/{id}/role/ : Modification du rôle d'un utilisateur par un administrateur."""

    permission_classes = [IsAuthenticated, HasRole(Role.ADMIN)]

    def patch(self, request, pk):
        user_cible = get_object_or_404(User, pk=pk)
        serializer = UserRoleUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role_avant = user_cible.role
        role_apres = serializer.validated_data["role"]
        user_cible.role = role_apres
        user_cible.save(update_fields=["role"])
        tracer_changement_role(request.user, user_cible, role_avant, role_apres)
        return Response(UserSerializer(user_cible).data, status=status.HTTP_200_OK)
