"""Vues du module Portail (apps.portal) — Phase 1 (T1, T2, T3).

Endpoints :
- T1 :
  - /api/portal/actualites/
  - /api/portal/evenements/ (supporte ?a_venir=1)
  - /api/portal/appels/ (statut dynamique selon date_limite)
- T2 :
  - /api/portal/partenaires/ (sans pagination)
  - /api/portal/documents/
  - /api/portal/contact/ (POST public limité, GET réservé à l'équipe)
- T3 :
  - /api/portal/projets-incubes/ (public, statut incube|prototype|termine, filtres et recherche)
"""
from django.db.models import Count, F, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import filters, mixins, status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.core.models import Projet, Role
from apps.core.permissions import IsEquipeCIAT, ReadOnlyOrRole

from .models import (
    Actualite,
    AppelProjet,
    DocumentPublic,
    Evenement,
    MessageContact,
    Partenaire,
)
from .serializers import (
    ActualiteSerializer,
    AppelProjetSerializer,
    DocumentPublicSerializer,
    EvenementSerializer,
    MessageContactSerializer,
    PartenaireSerializer,
    ProjetIncubeSerializer,
)

# ==============================================================================
# T1 — Contenus institutionnels
# ==============================================================================

@extend_schema_view(
    list=extend_schema(summary="Lister les actualités publiques"),
    retrieve=extend_schema(summary="Détail d'une actualité"),
    create=extend_schema(summary="Créer une actualité (Admin / Coordonnateur)"),
    update=extend_schema(summary="Modifier une actualité (Admin / Coordonnateur)"),
    partial_update=extend_schema(summary="Modifier partiellement une actualité"),
    destroy=extend_schema(summary="Supprimer une actualité (Admin / Coordonnateur)"),
)
class ActualiteViewSet(viewsets.ModelViewSet):
    """Actualités du CIAT.

    Lecture publique. Création, modification et suppression réservées aux
    administrateurs et coordonnateurs.
    """

    queryset = Actualite.objects.all()
    serializer_class = ActualiteSerializer
    permission_classes = [ReadOnlyOrRole(Role.ADMIN, Role.COORDONNATEUR)]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["titre", "resume", "contenu"]
    ordering_fields = ["publie_le", "cree_le", "titre", "vues"]
    ordering = ["-publie_le"]

    def get_queryset(self):
        user = getattr(self.request, "user", None)
        is_equipe = bool(
            user and user.is_authenticated and (
                getattr(user, "is_superuser", False)
                or getattr(user, "role", None) in (Role.ADMIN, Role.COORDONNATEUR)
            )
        )
        if is_equipe:
            return Actualite.objects.all()
        return Actualite.objects.filter(publie=True)

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs.get(lookup_url_kwarg)

        obj = None
        if lookup_val is not None:
            if str(lookup_val).isdigit():
                obj = queryset.filter(Q(pk=int(lookup_val)) | Q(slug=lookup_val)).first()
            else:
                obj = queryset.filter(slug=lookup_val).first()

        if not obj:
            raise NotFound("Aucune actualité trouvée correspondant à cet identifiant ou slug.")

        self.check_object_permissions(self.request, obj)
        return obj

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Actualite.objects.filter(pk=instance.pk).update(vues=F("vues") + 1)
        instance.refresh_from_db(fields=["vues"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Lister les événements publics",
        parameters=[
            OpenApiParameter(
                name="a_venir",
                description="Filtrer uniquement les événements à venir (1 ou true)",
                required=False,
                type=int,
            )
        ],
    ),
    retrieve=extend_schema(summary="Détail d'un événement"),
    create=extend_schema(summary="Créer un événement (Admin / Coordonnateur)"),
    update=extend_schema(summary="Modifier un événement (Admin / Coordonnateur)"),
    partial_update=extend_schema(summary="Modifier partiellement un événement"),
    destroy=extend_schema(summary="Supprimer un événement (Admin / Coordonnateur)"),
)
class EvenementViewSet(viewsets.ModelViewSet):
    """Événements organisés par le CIAT.

    Supporte le filtre `?a_venir=1` pour récupérer uniquement les événements futurs.
    """

    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    permission_classes = [ReadOnlyOrRole(Role.ADMIN, Role.COORDONNATEUR)]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["titre", "description", "lieu"]
    ordering_fields = ["debut", "fin", "titre"]
    ordering = ["debut"]

    def get_queryset(self):
        queryset = super().get_queryset()
        a_venir = self.request.query_params.get("a_venir")
        if a_venir in ("1", "true", "True"):
            now = timezone.now()
            queryset = queryset.filter(
                Q(fin__gte=now) | Q(fin__isnull=True, debut__gte=now)
            )
        return queryset


@extend_schema_view(
    list=extend_schema(
        summary="Lister les appels à projets",
        parameters=[
            OpenApiParameter(
                name="statut",
                description="Filtrer par statut ('ouvert' ou 'clos')",
                required=False,
                type=str,
            )
        ],
    ),
    retrieve=extend_schema(summary="Détail d'un appel à projets"),
    create=extend_schema(summary="Créer un appel à projets (Admin / Coordonnateur)"),
    update=extend_schema(summary="Modifier un appel à projets (Admin / Coordonnateur)"),
    partial_update=extend_schema(summary="Modifier partiellement un appel"),
    destroy=extend_schema(summary="Supprimer un appel à projets (Admin / Coordonnateur)"),
)
class AppelProjetViewSet(viewsets.ModelViewSet):
    """Appels à projets du CIAT.

    Le champ `statut` est calculé dynamiquement selon la date limite ('ouvert' ou 'clos').
    """

    queryset = AppelProjet.objects.all()
    serializer_class = AppelProjetSerializer
    permission_classes = [ReadOnlyOrRole(Role.ADMIN, Role.COORDONNATEUR)]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["titre", "description"]
    ordering_fields = ["date_limite", "cree_le", "titre"]
    ordering = ["-date_limite"]

    def get_queryset(self):
        queryset = super().get_queryset()
        statut = self.request.query_params.get("statut")
        if statut == "ouvert":
            queryset = queryset.filter(date_limite__gte=timezone.now())
        elif statut == "clos":
            queryset = queryset.filter(date_limite__lt=timezone.now())
        return queryset


# ==============================================================================
# T2 — Partenaires, documents publics et formulaire de contact
# ==============================================================================

@extend_schema_view(
    list=extend_schema(summary="Lister les partenaires (sans pagination)"),
    retrieve=extend_schema(summary="Détail d'un partenaire"),
    create=extend_schema(summary="Ajouter un partenaire (Admin / Coordonnateur)"),
    update=extend_schema(summary="Modifier un partenaire (Admin / Coordonnateur)"),
    partial_update=extend_schema(summary="Modifier partiellement un partenaire"),
    destroy=extend_schema(summary="Supprimer un partenaire (Admin / Coordonnateur)"),
)
class PartenaireViewSet(viewsets.ModelViewSet):
    """Partenaires du CIAT.

    Lecture publique sans pagination, modification réservée à l'équipe.
    """

    queryset = Partenaire.objects.all()
    serializer_class = PartenaireSerializer
    permission_classes = [ReadOnlyOrRole(Role.ADMIN, Role.COORDONNATEUR)]
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nom", "description"]
    ordering = ["ordre", "nom"]


@extend_schema_view(
    list=extend_schema(summary="Lister les documents publics téléchargeables"),
    retrieve=extend_schema(summary="Détail d'un document public"),
    create=extend_schema(summary="Ajouter un document public (Admin / Coordonnateur)"),
    update=extend_schema(summary="Modifier un document (Admin / Coordonnateur)"),
    partial_update=extend_schema(summary="Modifier partiellement un document"),
    destroy=extend_schema(summary="Supprimer un document (Admin / Coordonnateur)"),
)
class DocumentPublicViewSet(viewsets.ModelViewSet):
    """Documents publics (guides, chartes, rapports)."""

    queryset = DocumentPublic.objects.all()
    serializer_class = DocumentPublicSerializer
    permission_classes = [ReadOnlyOrRole(Role.ADMIN, Role.COORDONNATEUR)]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["titre", "categorie"]
    ordering = ["categorie", "titre"]

    def get_queryset(self):
        qs = super().get_queryset()
        categorie = self.request.query_params.get("categorie")
        if categorie and categorie != "tous":
            cat_lower = categorie.lower()
            if "candidature" in cat_lower or "formulaire" in cat_lower:
                qs = qs.filter(models.Q(categorie__icontains="candidature") | models.Q(categorie__icontains="formulaire"))
            elif "reglement" in cat_lower or "règlement" in cat_lower or "charte" in cat_lower:
                qs = qs.filter(models.Q(categorie__icontains="règlement") | models.Q(categorie__icontains="reglement") | models.Q(categorie__icontains="charte"))
            elif "guide" in cat_lower or "méthodologique" in cat_lower or "methodologique" in cat_lower:
                qs = qs.filter(models.Q(categorie__icontains="guide") | models.Q(categorie__icontains="méthodologique") | models.Q(categorie__icontains="methodologique"))
            elif "rapport" in cat_lower or "activité" in cat_lower or "activite" in cat_lower:
                qs = qs.filter(models.Q(categorie__icontains="rapport") | models.Q(categorie__icontains="activité") | models.Q(categorie__icontains="activite"))
            else:
                qs = qs.filter(categorie__icontains=categorie)
        return qs


class ContactAnonRateThrottle(AnonRateThrottle):
    """Protection anti-spam pour le formulaire de contact public."""

    rate = "10/minute"
    scope = "contact"


@extend_schema_view(
    create=extend_schema(
        summary="Envoyer un message de contact (Public, avec anti-spam)",
        responses={201: MessageContactSerializer},
    ),
    list=extend_schema(summary="Consulter les messages de contact (Équipe CIAT uniquement)"),
    retrieve=extend_schema(summary="Détail d'un message de contact (Équipe CIAT uniquement)"),
)
class MessageContactViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Formulaire de contact public et consultation par l'équipe CIAT."""

    queryset = MessageContact.objects.all()
    serializer_class = MessageContactSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsEquipeCIAT()]

    def get_throttles(self):
        if self.action == "create":
            return [ContactAnonRateThrottle()]
        return []


# ==============================================================================
# T3 — Annuaire public des projets incubés
# ==============================================================================

@extend_schema_view(
    list=extend_schema(
        summary="Annuaire public des projets incubés",
        description="Ne renvoie que les projets aux statuts `incube`, `prototype` ou `termine`. Aucune donnée personnelle exposée.",
        parameters=[
            OpenApiParameter(name="domaine", description="Filtre par nom, slug ou ID de domaine", required=False, type=str),
            OpenApiParameter(name="cohorte", description="Filtre par nom ou ID de cohorte", required=False, type=str),
            OpenApiParameter(name="statut", description="Filtre par statut (incube, prototype, termine)", required=False, type=str),
            OpenApiParameter(name="search", description="Recherche plein texte dans le titre et le résumé", required=False, type=str),
        ],
    ),
    retrieve=extend_schema(summary="Détail public d'un projet incubé"),
)
class ProjetIncubeViewSet(viewsets.ReadOnlyModelViewSet):
    """Annuaire public des projets incubés.

    Seuls les projets aux statuts `incube`, `prototype` ou `termine` sont exposés.
    """

    permission_classes = [AllowAny]
    serializer_class = ProjetIncubeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["titre", "resume"]
    ordering_fields = ["cree_le", "titre"]
    ordering = ["-cree_le"]

    def get_queryset(self):
        # Restriction stricte aux 3 statuts publics
        statuts_autorises = [
            Projet.Statut.INCUBE,
            Projet.Statut.PROTOTYPE,
            Projet.Statut.TERMINE,
        ]
        queryset = (
            Projet.objects.filter(statut__in=statuts_autorises)
            .select_related("domaine", "cohorte")
        )

        # Filtre domaine (?domaine=...)
        domaine_param = self.request.query_params.get("domaine")
        if domaine_param:
            if domaine_param.isdigit():
                queryset = queryset.filter(domaine_id=int(domaine_param))
            else:
                queryset = queryset.filter(
                    Q(domaine__nom__iexact=domaine_param)
                    | Q(domaine__slug__iexact=domaine_param)
                )

        # Filtre cohorte (?cohorte=...)
        cohorte_param = self.request.query_params.get("cohorte")
        if cohorte_param:
            if cohorte_param.isdigit():
                queryset = queryset.filter(cohorte_id=int(cohorte_param))
            else:
                queryset = queryset.filter(cohorte__nom__iexact=cohorte_param)

        # Filtre statut (?statut=...)
        statut_param = self.request.query_params.get("statut")
        if statut_param:
            # Ne filtre que si le statut demandé fait partie des statuts autorisés
            if statut_param in statuts_autorises:
                queryset = queryset.filter(statut=statut_param)
            else:
                queryset = queryset.none()

        return queryset

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs.get(lookup_url_kwarg)

        obj = None
        if lookup_val is not None:
            if str(lookup_val).isdigit():
                obj = queryset.filter(pk=int(lookup_val)).first()
            else:
                obj = queryset.filter(Q(domaine__slug=lookup_val) | Q(titre__iexact=lookup_val)).first()

        if not obj:
            raise NotFound("Aucun projet incubé trouvé correspondant à cet identifiant.")

        self.check_object_permissions(self.request, obj)
        return obj

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Projet.objects.filter(pk=instance.pk).update(vues=F("vues") + 1)
        instance.refresh_from_db(fields=["vues"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# ==============================================================================
# Phase 3 — T2 : Statistiques de consultation du portail
# ==============================================================================

class StatistiquesPortailView(APIView):
    """GET /api/portal/statistiques/ : Réservé à l'équipe CIAT.

    Renvoie le total des vues du portail ainsi que le détail des vues par
    actualité et par projet incubé.
    Format : {
        "total_vues": int,
        "actualites": [{"slug": str, "titre": str, "vues": int}],
        "projets": [{"id": int, "titre": str, "vues": int}]
    }
    """

    permission_classes = [IsAuthenticated, IsEquipeCIAT]

    def get(self, request):
        actualites = list(
            Actualite.objects.values("slug", "titre", "vues").order_by("-vues", "titre")
        )

        statuts_autorises = [
            Projet.Statut.INCUBE,
            Projet.Statut.PROTOTYPE,
            Projet.Statut.TERMINE,
        ]
        projets = list(
            Projet.objects.filter(statut__in=statuts_autorises)
            .values("id", "titre", "vues")
            .order_by("-vues", "titre")
        )

        total_actu = sum(a["vues"] for a in actualites)
        total_proj = sum(p["vues"] for p in projets)
        total_vues = total_actu + total_proj

        return Response(
            {
                "total_vues": total_vues,
                "actualites": actualites,
                "projets": projets,
            },
            status=status.HTTP_200_OK,
        )


# ==============================================================================
# Phase 4 — T3 : Export iCalendar (.ics) des événements du CIAT
# ==============================================================================

@extend_schema(
    summary="Flux calendrier iCalendar (.ics) des événements du CIAT",
    description="Génère un flux d'agenda iCalendar conforme RFC 5545 contenant les événements officiels du CIAT, directement importable dans Google Agenda, Outlook ou Apple Calendar.",
    parameters=[
        OpenApiParameter(
            name="a_venir",
            type=int,
            location=OpenApiParameter.QUERY,
            description="Filtrer uniquement les événements à venir (1 pour oui, 0 ou absent pour tous)",
            required=False,
            enum=[0, 1],
        ),
    ],
    responses={
        200: OpenApiResponse(description="Flux d'événements iCalendar (text/calendar)"),
    },
    tags=["Portail — Événements"],
)
class EvenementCalendrierICSView(APIView):
    """GET /api/portal/evenements/calendrier.ics : Flux iCalendar RFC 5545 public.

    Renvoie tous les événements du CIAT (avec option ?a_venir=1 pour filtrer les événements futurs)
    au format standard iCalendar (.ics) importable dans Google Agenda ou Outlook.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Evenement.objects.all().order_by("debut")
        a_venir = request.query_params.get("a_venir")
        if a_venir in ("1", "true", "True"):
            now = timezone.now()
            queryset = queryset.filter(
                Q(fin__gte=now) | Q(fin__isnull=True, debut__gte=now)
            )

        from .calendrier import generer_calendrier_ics

        ics_content = generer_calendrier_ics(queryset)
        response = HttpResponse(ics_content, content_type="text/calendar; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="evenements_ciat.ics"'
        return response


# ==============================================================================
# Phase 9 — T1 : Lettre d'information avec double opt-in
# ==============================================================================

import secrets
import unicodedata
from django.core.cache import cache
from apps.core.models import Cohorte, Domaine, User
from apps.gallery.models import FicheInnovation
from .emails import (
    envoyer_email_bienvenue_lettre,
    envoyer_email_confirmation_lettre,
    verifier_jeton_signe,
)
from .models import AbonnementLettre
from .serializers import (
    AbonnementLettreAdminSerializer,
    AbonnementLettreDemandeSerializer,
    AbonnementLettreJetonSerializer,
    ChiffresClesSerializer,
    RechercheResultatItemSerializer,
)
from .throttling import PortalLettreAnonRateThrottle, PortalRechercheAnonRateThrottle


@extend_schema(
    summary="Demande d'abonnement à la lettre d'information (Public, double opt-in)",
    description=(
        "Enregistre la demande d'abonnement et envoie un courriel de confirmation avec un jeton sécurisé signé. "
        "Pour des motifs stricts de sécurité et de confidentialité (anti-énumération), la réponse est rigoureusement "
        "identique que l'adresse email existe déjà ou non."
    ),
    request=AbonnementLettreDemandeSerializer,
    responses={
        200: OpenApiResponse(
            description="Demande d'abonnement prise en compte. Courriel envoyé si l'adresse est valide."
        ),
        400: OpenApiResponse(description="Adresse email invalide ou manquante."),
    },
    tags=["Portail — Lettre d'information"],
)
class AbonnementLettreAbonnerView(APIView):
    """POST /api/portal/lettre/abonner/ : Inscription avec double opt-in sécurisé."""

    permission_classes = [AllowAny]
    throttle_classes = [PortalLettreAnonRateThrottle]

    def post(self, request):
        serializer = AbonnementLettreDemandeSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        # Réponse générique systématique contre toute énumération d'adresses
        reponse_identique = {
            "detail": (
                "Si cette adresse est valide, un email de confirmation vient d'être envoyé. "
                "Veuillez cliquer sur le lien reçu pour confirmer votre abonnement."
            ),
            "statut": AbonnementLettre.Statut.EN_ATTENTE,
        }

        abonnement = AbonnementLettre.objects.filter(email__iexact=email).first()
        raw_token = secrets.token_urlsafe(32)

        if not abonnement:
            abonnement = AbonnementLettre.objects.create(
                email=email,
                statut=AbonnementLettre.Statut.EN_ATTENTE,
                jeton=raw_token,
            )
            envoyer_email_confirmation_lettre(abonnement, raw_token)
        elif abonnement.statut != AbonnementLettre.Statut.CONFIRME:
            # En attente ou désabonné : renouvellement de la demande avec nouveau jeton
            abonnement.statut = AbonnementLettre.Statut.EN_ATTENTE
            abonnement.jeton = raw_token
            abonnement.save(update_fields=["statut", "jeton"])
            envoyer_email_confirmation_lettre(abonnement, raw_token)
        else:
            # Déjà confirmé : anti-énumération, aucune divulgation
            pass

        return Response(reponse_identique, status=status.HTTP_200_OK)


@extend_schema(
    summary="Confirmation d'abonnement à la lettre d'information (Public)",
    description=(
        "Valide l'abonnement via le jeton signé à usage unique reçu par courriel. "
        "Renvoie HTTP 400 clair si le jeton est expiré, rejoué, révoqué ou corrompu."
    ),
    request=AbonnementLettreJetonSerializer,
    responses={
        200: OpenApiResponse(description="Abonnement confirmé avec succès."),
        400: OpenApiResponse(description="Jeton expiré, déjà utilisé ou invalide."),
    },
    tags=["Portail — Lettre d'information"],
)
class AbonnementLettreConfirmerView(APIView):
    """POST /api/portal/lettre/confirmer/ : Confirmation double opt-in."""

    permission_classes = [AllowAny]
    throttle_classes = [PortalLettreAnonRateThrottle]

    def post(self, request):
        serializer = AbonnementLettreJetonSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        jeton_signe = serializer.validated_data["jeton"].strip()

        from django.core import signing

        try:
            payload = verifier_jeton_signe(jeton_signe, action_attendue="confirmer", max_age=86400 * 3)
        except signing.SignatureExpired:
            return Response(
                {"detail": "Le jeton de confirmation a expiré. Veuillez renouveler votre inscription."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (signing.BadSignature, Exception):
            return Response(
                {"detail": "Le jeton de confirmation est invalide ou corrompu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payload.get("action") != "confirmer":
            return Response(
                {"detail": "Type de jeton incompatible avec la confirmation d'abonnement."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub_id = payload.get("sub_id")
        email = payload.get("email")
        raw_token = payload.get("raw")

        abonnement = AbonnementLettre.objects.filter(pk=sub_id, email__iexact=email).first()
        if not abonnement:
            return Response(
                {"detail": "Abonnement introuvable pour ce jeton."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérification d'usage unique et détection de rejeu
        if abonnement.jeton != raw_token or abonnement.statut == AbonnementLettre.Statut.CONFIRME:
            return Response(
                {"detail": "Ce jeton a déjà été utilisé ou rejoué."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Passage à l'état confirmé et rotation du jeton vers le jeton de désabonnement
        raw_unsub = secrets.token_urlsafe(32)
        abonnement.statut = AbonnementLettre.Statut.CONFIRME
        abonnement.confirme_le = timezone.now()
        abonnement.jeton = raw_unsub
        abonnement.save(update_fields=["statut", "confirme_le", "jeton"])

        # Envoi du message de bienvenue avec lien de désabonnement
        envoyer_email_bienvenue_lettre(abonnement, raw_unsub)

        return Response(
            {
                "detail": "Votre abonnement à la lettre d'information a été confirmé avec succès.",
                "statut": AbonnementLettre.Statut.CONFIRME,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    summary="Désabonnement de la lettre d'information (Public)",
    description=(
        "Résiliation de l'abonnement via le jeton signé à usage unique présent dans chaque courriel. "
        "Renvoie HTTP 400 clair si le jeton est déjà utilisé, expiré ou invalide."
    ),
    request=AbonnementLettreJetonSerializer,
    responses={
        200: OpenApiResponse(description="Désabonnement effectué avec succès."),
        400: OpenApiResponse(description="Jeton expiré, déjà utilisé ou invalide."),
    },
    tags=["Portail — Lettre d'information"],
)
class AbonnementLettreDesabonnerView(APIView):
    """POST /api/portal/lettre/desabonner/ : Désabonnement sécurisé à usage unique."""

    permission_classes = [AllowAny]
    throttle_classes = [PortalLettreAnonRateThrottle]

    def post(self, request):
        serializer = AbonnementLettreJetonSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        jeton_signe = serializer.validated_data["jeton"].strip()

        from django.core import signing

        try:
            payload = verifier_jeton_signe(jeton_signe, action_attendue="desabonner", max_age=86400 * 365)
        except signing.SignatureExpired:
            return Response(
                {"detail": "Le jeton de désabonnement a expiré."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (signing.BadSignature, Exception):
            return Response(
                {"detail": "Le jeton de désabonnement est invalide ou corrompu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payload.get("action") != "desabonner":
            return Response(
                {"detail": "Type de jeton incompatible avec le désabonnement."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub_id = payload.get("sub_id")
        email = payload.get("email")
        raw_token = payload.get("raw")

        abonnement = AbonnementLettre.objects.filter(pk=sub_id, email__iexact=email).first()
        if not abonnement:
            return Response(
                {"detail": "Abonnement introuvable pour ce jeton."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Détection de rejeu
        if abonnement.jeton != raw_token or abonnement.statut == AbonnementLettre.Statut.DESABONNE:
            return Response(
                {"detail": "Ce jeton a déjà été utilisé ou l'abonnement est déjà résilié (rejeu détecté)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        abonnement.statut = AbonnementLettre.Statut.DESABONNE
        abonnement.desabonne_le = timezone.now()
        abonnement.jeton = ""
        abonnement.save(update_fields=["statut", "desabonne_le", "jeton"])

        return Response(
            {
                "detail": "Vous avez été désabonné avec succès de la lettre d'information.",
                "statut": AbonnementLettre.Statut.DESABONNE,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    list=extend_schema(summary="Lister les abonnés à la lettre d'information (Équipe CIAT)"),
    retrieve=extend_schema(summary="Détail d'un abonnement (Équipe CIAT)"),
)
class AbonnementLettreAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Consultation et filtrage des abonnés pour l'administration CIAT."""

    permission_classes = [IsEquipeCIAT]
    queryset = AbonnementLettre.objects.all()
    serializer_class = AbonnementLettreAdminSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["email"]
    ordering_fields = ["cree_le", "confirme_le", "statut"]
    ordering = ["-cree_le"]

    def get_queryset(self):
        qs = super().get_queryset()
        statut = self.request.query_params.get("statut")
        if statut in [AbonnementLettre.Statut.EN_ATTENTE, AbonnementLettre.Statut.CONFIRME, AbonnementLettre.Statut.DESABONNE]:
            qs = qs.filter(statut=statut)
        return qs


# ==============================================================================
# Phase 9 — T2 : Recherche globale des contenus publics
# ==============================================================================

def normaliser_recherche(chaine: str) -> str:
    """Normalise un texte : suppression des accents, passage en minuscules et nettoyage."""
    if not chaine:
        return ""
    nfkd = unicodedata.normalize("NFKD", str(chaine))
    sans_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
    return sans_accents.lower().strip()


def generer_extrait(texte: str, terme_norm: str, max_longueur: int = 150) -> str:
    """Génère un extrait pertinent autour du terme recherché."""
    if not texte:
        return ""
    compact = " ".join(str(texte).split())
    compact_norm = normaliser_recherche(compact)
    idx = compact_norm.find(terme_norm)
    if idx == -1:
        return (compact[:max_longueur] + "...") if len(compact) > max_longueur else compact

    start = max(0, idx - 35)
    end = min(len(compact), idx + len(terme_norm) + 80)
    extrait = compact[start:end]
    if start > 0:
        extrait = "..." + extrait
    if end < len(compact):
        extrait = extrait + "..."
    return extrait


def evaluer_pertinence(titre_norm: str, corps_norm: str, q_norm: str) -> int:
    """Calcule un score de pertinence numérique."""
    if not q_norm:
        return 0
    score = 0
    if titre_norm == q_norm:
        score += 100
    elif titre_norm.startswith(q_norm):
        score += 60
    elif q_norm in titre_norm:
        score += 40

    if q_norm in corps_norm:
        score += 20
        occurrences = corps_norm.count(q_norm)
        score += min(occurrences * 5, 25)

    return score


@extend_schema(
    summary="Recherche globale dans les contenus publics du site",
    description=(
        "Recherche plein-texte insensible à la casse et aux accents dans l'ensemble des contenus publics : "
        "actualités publiées, événements, appels à projets, projets incubés validés, fiches de galerie publiées, "
        "documents publics et partenaires. Jamais de contenu non publié, de brouillon, de fiche refusée ni de donnée personnelle."
    ),
    parameters=[
        OpenApiParameter(
            name="q",
            type=str,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Terme recherché (au moins 2 caractères requis).",
        ),
    ],
    responses={
        200: OpenApiResponse(description="Résultats groupés par type ordonnés par pertinence."),
        400: OpenApiResponse(description="Requête invalide (terme q manquant ou inférieur à 2 caractères)."),
    },
    tags=["Portail — Recherche"],
)
class RechercheGlobaleView(APIView):
    """GET /api/portal/recherche/?q= : Moteur de recherche public multi-contenus."""

    permission_classes = [AllowAny]
    throttle_classes = [PortalRechercheAnonRateThrottle]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response(
                {"detail": "Le terme de recherche doit comporter au moins 2 caractères."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        q_norm = normaliser_recherche(q)

        # Contenus strictement publics
        groupes = {
            "actualite": [],
            "evenement": [],
            "appel": [],
            "projet": [],
            "fiche": [],
            "document": [],
            "partenaire": [],
        }

        # 1. Actualités publiées
        for act in Actualite.objects.filter(publie=True):
            t_norm = normaliser_recherche(act.titre)
            c_norm = normaliser_recherche(f"{act.resume} {act.contenu}")
            score = evaluer_pertinence(t_norm, c_norm, q_norm)
            if score > 0:
                groupes["actualite"].append({
                    "type": "actualite",
                    "titre": act.titre,
                    "extrait": generer_extrait(act.resume or act.contenu, q_norm),
                    "url_interne": f"/portail/actualites/{act.slug or act.id}",
                    "score": score,
                })

        # 2. Événements
        for ev in Evenement.objects.all():
            t_norm = normaliser_recherche(ev.titre)
            c_norm = normaliser_recherche(f"{ev.description} {ev.lieu}")
            score = evaluer_pertinence(t_norm, c_norm, q_norm)
            if score > 0:
                groupes["evenement"].append({
                    "type": "evenement",
                    "titre": ev.titre,
                    "extrait": generer_extrait(ev.description, q_norm),
                    "url_interne": f"/portail/evenements/{ev.id}",
                    "score": score,
                })

        # 3. Appels à projets
        for ap in AppelProjet.objects.all():
            t_norm = normaliser_recherche(ap.titre)
            c_norm = normaliser_recherche(ap.description)
            score = evaluer_pertinence(t_norm, c_norm, q_norm)
            if score > 0:
                groupes["appel"].append({
                    "type": "appel",
                    "titre": ap.titre,
                    "extrait": generer_extrait(ap.description, q_norm),
                    "url_interne": f"/portail/appels/{ap.id}",
                    "score": score,
                })

        # 4. Projets incubés (uniquement incube, prototype, termine)
        statuts_publics = [Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        for pr in Projet.objects.filter(statut__in=statuts_publics):
            t_norm = normaliser_recherche(pr.titre)
            c_norm = normaliser_recherche(f"{pr.resume} {pr.probleme} {pr.solution}")
            score = evaluer_pertinence(t_norm, c_norm, q_norm)
            if score > 0:
                groupes["projet"].append({
                    "type": "projet",
                    "titre": pr.titre,
                    "extrait": generer_extrait(pr.resume or pr.solution, q_norm),
                    "url_interne": f"/portail/projets-incubes/{pr.id}",
                    "score": score,
                })

        # 5. Fiches d'innovation (uniquement statut publié)
        for fi in FicheInnovation.objects.filter(statut=FicheInnovation.Statut.PUBLIE):
            t_norm = normaliser_recherche(fi.titre)
            c_norm = normaliser_recherche(f"{fi.probleme} {fi.solution} {fi.avancement}")
            score = evaluer_pertinence(t_norm, c_norm, q_norm)
            if score > 0:
                groupes["fiche"].append({
                    "type": "fiche",
                    "titre": fi.titre,
                    "extrait": generer_extrait(fi.solution or fi.probleme, q_norm),
                    "url_interne": f"/galerie/{fi.slug or fi.id}",
                    "score": score,
                })

        # 6. Documents publics
        for doc in DocumentPublic.objects.all():
            t_norm = normaliser_recherche(doc.titre)
            c_norm = normaliser_recherche(doc.categorie)
            score = evaluer_pertinence(t_norm, c_norm, q_norm)
            if score > 0:
                fichier_url = doc.fichier.url if doc.fichier else "/portail/documents"
                groupes["document"].append({
                    "type": "document",
                    "titre": doc.titre,
                    "extrait": f"Document public [{doc.categorie}]",
                    "url_interne": fichier_url,
                    "score": score,
                })

        # 7. Partenaires
        for part in Partenaire.objects.all():
            t_norm = normaliser_recherche(part.nom)
            c_norm = normaliser_recherche(part.description)
            score = evaluer_pertinence(t_norm, c_norm, q_norm)
            if score > 0:
                groupes["partenaire"].append({
                    "type": "partenaire",
                    "titre": part.nom,
                    "extrait": generer_extrait(part.description, q_norm) if part.description else "Partenaire officiel du CIAT",
                    "url_interne": "/portail/partenaires",
                    "score": score,
                })

        # Tri et limitation (5 maximum par type)
        total_trouve = 0
        groupes_limites = {}
        tous_resultats = []

        for type_nom, items in groupes.items():
            items.sort(key=lambda x: x["score"], reverse=True)
            total_trouve += len(items)
            limites = items[:5]
            groupes_limites[type_nom] = limites
            tous_resultats.extend(limites)

        tous_resultats.sort(key=lambda x: x["score"], reverse=True)

        return Response(
            {
                "q": q,
                "total": total_trouve,
                "groupes": groupes_limites,
                "resultats": tous_resultats[:25],
                "actualites": groupes_limites["actualite"],
                "evenements": groupes_limites["evenement"],
                "appels": groupes_limites["appel"],
                "projets": groupes_limites["projet"],
                "fiches": groupes_limites["fiche"],
                "documents": groupes_limites["document"],
                "partenaires": groupes_limites["partenaire"],
            },
            status=status.HTTP_200_OK,
        )


# ==============================================================================
# Phase 9 — T3 : Chiffres clés réels calculés depuis la base
# ==============================================================================

CACHE_CHIFFRES_CLES_KEY = "ciat_portal_chiffres_cles"
CACHE_CHIFFRES_CLES_TTL = 60  # Cache court de 60 secondes


@extend_schema(
    summary="Chiffres clés publics réels calculés depuis la base de données",
    description=(
        "Renvoie les comptages réels consolidés du CIAT pour la page d'accueil et les filières : "
        "projets incubés, prototypes réalisés, porteurs accompagnés, partenaires, domaines d'intervention "
        "avec leur volume de projets, et cohortes. Aucune donnée personnelle exposée. Cache court de 60 secondes."
    ),
    responses={
        200: OpenApiResponse(response=ChiffresClesSerializer, description="Chiffres consolidés exacts."),
    },
    tags=["Portail — Chiffres Clés"],
)
class ChiffresClesView(APIView):
    """GET /api/portal/chiffres-cles/ : Chiffres clés publics réels."""

    permission_classes = [AllowAny]

    def get(self, request):
        # Support de bypass cache pour les tests ou la synchronisation
        nocache = request.query_params.get("nocache") in ("1", "true", "True")
        if not nocache:
            donnees_cache = cache.get(CACHE_CHIFFRES_CLES_KEY)
            if donnees_cache is not None:
                return Response(donnees_cache, status=status.HTTP_200_OK)

        statuts_incubation = [
            Projet.Statut.INCUBE,
            Projet.Statut.PROTOTYPE,
            Projet.Statut.TERMINE,
        ]
        statuts_prototypes = [
            Projet.Statut.PROTOTYPE,
            Projet.Statut.TERMINE,
        ]

        projets_incubes_total = Projet.objects.filter(statut__in=statuts_incubation).count()
        prototypes_total = Projet.objects.filter(statut__in=statuts_prototypes).count()

        # Porteurs accompagnés : nombre distinct d'utilisateurs porteurs de projets incubés
        porteurs_accompagnes = (
            User.objects.filter(projets_portes__statut__in=statuts_incubation)
            .distinct()
            .count()
        )

        partenaires_total = Partenaire.objects.count()
        cohortes_total = Cohorte.objects.count()

        # Domaines avec leur nombre de projets
        domaines_qs = (
            Domaine.objects.annotate(
                nombre_projets=Count("projets"),
                projets_incubes=Count(
                    "projets",
                    filter=Q(projets__statut__in=statuts_incubation),
                ),
            )
            .order_by("id")
        )

        domaines_data = [
            {
                "id": d.id,
                "nom": d.nom,
                "slug": d.slug,
                "nombre_projets": d.nombre_projets,
                "projets_incubes": d.projets_incubes,
            }
            for d in domaines_qs
        ]

        reponse = {
            "projets_incubes": projets_incubes_total,
            "prototypes": prototypes_total,
            "porteurs_accompagnes": porteurs_accompagnes,
            "partenaires": partenaires_total,
            "cohortes": cohortes_total,
            "domaines": domaines_data,
        }

        cache.set(CACHE_CHIFFRES_CLES_KEY, reponse, timeout=CACHE_CHIFFRES_CLES_TTL)
        return Response(reponse, status=status.HTTP_200_OK)
