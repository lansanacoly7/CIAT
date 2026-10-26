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
from django.db.models import F, Q, Sum
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
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
