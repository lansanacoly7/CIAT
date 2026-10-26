"""Vues du module Portail (apps.portal) — Phase 1.

Endpoints :
- /api/portal/actualites/
- /api/portal/evenements/ (supporte ?a_venir=1)
- /api/portal/appels/ (statut dynamique selon date_limite)
"""
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import filters, viewsets
from rest_framework.permissions import SAFE_METHODS

from apps.core.models import Role
from apps.core.permissions import ReadOnlyOrRole

from .models import Actualite, AppelProjet, Evenement
from .serializers import (
    ActualiteSerializer,
    AppelProjetSerializer,
    EvenementSerializer,
)


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
    ordering_fields = ["publie_le", "cree_le", "titre"]
    ordering = ["-publie_le"]


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
