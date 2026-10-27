"""Vues API pour la Galerie des innovations (P6)."""
from django.db import models
from django.db.models import F, Q, Sum
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import Role

from .models import FicheInnovation
from .exports_pdf import generer_fiche_promotionnelle_pdf
from .qr import generer_qr_code_png
from .serializers import (
    FicheInnovationCreateSerializer,
    FicheInnovationSerializer,
    StatistiquesGallerySerializer,
)


def _est_equipe_ciat(user) -> bool:
    """Vérifie si l'utilisateur appartient à l'équipe CIAT (admin ou coordonnateur)."""
    if not user or not user.is_authenticated:
        return False
    return (
        getattr(user, "role", None) in (Role.ADMIN, Role.COORDONNATEUR)
        or user.is_staff
        or user.is_superuser
    )


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


@extend_schema_view(
    get=extend_schema(
        summary="Lister les fiches d'innovation publiées (Public)",
        parameters=[
            OpenApiParameter(name="domaine", description="ID, slug ou nom du domaine", required=False, type=str),
            OpenApiParameter(name="cohorte", description="ID, année ou nom de la cohorte", required=False, type=str),
            OpenApiParameter(name="avancement", description="Niveau d'avancement du projet", required=False, type=str),
            OpenApiParameter(name="search", description="Recherche textuelle libre", required=False, type=str),
        ],
        responses={200: FicheInnovationSerializer(many=True)},
    ),
    post=extend_schema(
        summary="Créer une fiche d'innovation pour son projet (Porteur)",
        request=FicheInnovationCreateSerializer,
        responses={201: FicheInnovationSerializer, 400: dict, 403: dict},
    ),
)
class FicheListCreateView(APIView):
    """Consultation publique des fiches publiées et création par un porteur."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        # Point d'attention absolu : SEULES les fiches au statut 'publie' sont visibles publiquement.
        # Les utilisateurs authentifiés autorisés peuvent consulter leurs propres fiches ou les fiches en validation.
        mes_fiches = request.query_params.get("mes_fiches") == "1"
        en_validation = request.query_params.get("en_validation") == "1"

        if en_validation and _est_equipe_ciat(request.user):
            queryset = (
                FicheInnovation.objects.filter(statut=FicheInnovation.Statut.EN_VALIDATION)
                .select_related("projet", "projet__domaine", "projet__cohorte")
                .order_by("-cree_le")
            )
        elif mes_fiches and request.user.is_authenticated:
            queryset = (
                FicheInnovation.objects.filter(projet__porteur_id=request.user.id)
                .select_related("projet", "projet__domaine", "projet__cohorte")
                .order_by("-cree_le")
            )
        else:
            queryset = (
                FicheInnovation.objects.filter(statut=FicheInnovation.Statut.PUBLIE)
                .select_related("projet", "projet__domaine", "projet__cohorte")
                .order_by("-cree_le")
            )

        # Filtre domaine
        domaine = request.query_params.get("domaine")
        if domaine:
            if domaine.isdigit():
                queryset = queryset.filter(projet__domaine_id=int(domaine))
            else:
                queryset = queryset.filter(
                    Q(projet__domaine__slug=domaine) | Q(projet__domaine__nom__icontains=domaine)
                )

        # Filtre cohorte
        cohorte = request.query_params.get("cohorte")
        if cohorte:
            if cohorte.isdigit():
                queryset = queryset.filter(
                    Q(projet__cohorte_id=int(cohorte)) | Q(projet__cohorte__annee=int(cohorte))
                )
            else:
                queryset = queryset.filter(projet__cohorte__nom__icontains=cohorte)

        # Filtre avancement
        avancement = request.query_params.get("avancement")
        if avancement:
            queryset = queryset.filter(avancement__icontains=avancement)

        # Recherche textuelle
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(titre__icontains=search)
                | Q(probleme__icontains=search)
                | Q(solution__icontains=search)
                | Q(equipe__icontains=search)
                | Q(projet__titre__icontains=search)
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = FicheInnovationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = FicheInnovationSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FicheInnovationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        projet = serializer.validated_data["projet"]

        # Droits : seul le porteur du projet ou l'équipe CIAT peut créer la fiche
        is_owner = projet.porteur_id == request.user.id
        if not is_owner and not _est_equipe_ciat(request.user):
            return Response(
                {"detail": "Vous ne pouvez créer une fiche que pour un projet dont vous êtes le porteur."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Statut initial toujours 'brouillon' et 0 vues
        fiche = serializer.save(statut=FicheInnovation.Statut.BROUILLON, vues=0)
        return Response(
            FicheInnovationSerializer(fiche).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(
        summary="Détail d'une fiche d'innovation publiée (Public)",
        responses={200: FicheInnovationSerializer, 404: dict},
    )
)
class FicheDetailView(APIView):
    """Consultation publique du détail d'une fiche publiée avec incrémentation du compteur de vues."""

    permission_classes = [AllowAny]

    def get(self, request, slug):
        fiche = get_object_or_404(
            FicheInnovation.objects.select_related("projet", "projet__domaine", "projet__cohorte"),
            slug=slug,
        )

        # Une fiche non publiée n'est jamais visible publiquement
        if fiche.statut != FicheInnovation.Statut.PUBLIE:
            is_owner = request.user.is_authenticated and fiche.projet.porteur_id == request.user.id
            if not is_owner and not _est_equipe_ciat(request.user):
                return Response(
                    {"detail": "Cette fiche d'innovation n'est pas encore publiée."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Incrémentation atomique du compteur de vues
        FicheInnovation.objects.filter(pk=fiche.pk).update(vues=F("vues") + 1)
        fiche.refresh_from_db()

        serializer = FicheInnovationSerializer(fiche)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Obtenir le QR code PNG d'une fiche publiée (Public)",
    responses={(200, "image/png"): bytes, 404: dict},
)
class FicheQRCodeView(APIView):
    """Renvoie une image PNG du QR code menant à la fiche d'innovation."""

    permission_classes = [AllowAny]

    def get(self, request, slug):
        fiche = get_object_or_404(FicheInnovation, slug=slug)

        # Une fiche non publiée n'est pas accessible au public
        if fiche.statut != FicheInnovation.Statut.PUBLIE:
            is_owner = request.user.is_authenticated and fiche.projet.porteur_id == request.user.id
            if not is_owner and not _est_equipe_ciat(request.user):
                return Response(
                    {"detail": "Cette fiche d'innovation n'est pas encore publiée."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        url_fiche = f"{settings.SITE_URL.rstrip('/')}/galerie/{fiche.slug}"
        png_bytes = generer_qr_code_png(url_fiche)

        response = HttpResponse(png_bytes, content_type="image/png")
        response["Content-Disposition"] = f'inline; filename="qr_{fiche.slug}.png"'
        return response


@extend_schema(
    summary="Télécharger la fiche promotionnelle PDF d'une innovation publiée (Public)",
    description=(
        "Génère un document PDF officiel d'une page A4 aux couleurs du CIAT, "
        "comprenant le titre, le problème, la solution innovante, l'équipe et le QR code officiel."
    ),
    responses={(200, "application/pdf"): bytes, 404: dict},
)
class FichePDFView(APIView):
    """Génération et téléchargement de la fiche promotionnelle PDF officielle."""

    permission_classes = [AllowAny]

    def get(self, request, slug):
        fiche = get_object_or_404(
            FicheInnovation.objects.select_related("projet", "projet__domaine", "projet__cohorte"),
            slug=slug,
        )

        # Une fiche non publiée n'est pas accessible au public
        if fiche.statut != FicheInnovation.Statut.PUBLIE:
            is_owner = request.user.is_authenticated and fiche.projet.porteur_id == request.user.id
            if not is_owner and not _est_equipe_ciat(request.user):
                return Response(
                    {"detail": "Cette fiche d'innovation n'est pas encore publiée."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        pdf_buffer = generer_fiche_promotionnelle_pdf(fiche, base_url=settings.SITE_URL)

        response = HttpResponse(pdf_buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="fiche_{fiche.slug}.pdf"'
        return response


@extend_schema(
    summary="Soumettre une fiche d'innovation pour validation (Porteur)",
    request=None,
    responses={200: FicheInnovationSerializer, 400: dict, 403: dict},
)
class FicheSoumettreView(APIView):
    """Workflow : passe une fiche de 'brouillon' à 'en_validation'."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        fiche = get_object_or_404(FicheInnovation, pk=pk)

        # Droits : porteur du projet ou équipe CIAT
        is_owner = fiche.projet.porteur_id == request.user.id
        if not is_owner and not _est_equipe_ciat(request.user):
            return Response(
                {"detail": "Seul le porteur du projet peut soumettre cette fiche."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if fiche.statut not in (FicheInnovation.Statut.BROUILLON, FicheInnovation.Statut.REFUSE):
            return Response(
                {
                    "detail": (
                        f"Seule une fiche au statut 'brouillon' ou 'refuse' peut être soumise "
                        f"(statut actuel : '{fiche.statut}')."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        fiche.statut = FicheInnovation.Statut.EN_VALIDATION
        fiche.save(update_fields=["statut", "modifie_le"])

        return Response(FicheInnovationSerializer(fiche).data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Valider et publier une fiche d'innovation (Coordonnateur ou Administrateur)",
    request=None,
    responses={200: FicheInnovationSerializer, 403: dict},
)
class FicheValiderView(APIView):
    """Workflow : valide une fiche en la passant au statut 'publie'."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not _est_equipe_ciat(request.user):
            return Response(
                {"detail": "Seuls un coordonnateur ou un administrateur peuvent valider une fiche."},
                status=status.HTTP_403_FORBIDDEN,
            )

        fiche = get_object_or_404(FicheInnovation, pk=pk)
        fiche.statut = FicheInnovation.Statut.PUBLIE
        fiche.save(update_fields=["statut", "modifie_le"])

        return Response(FicheInnovationSerializer(fiche).data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Refuser une fiche d'innovation (Coordonnateur ou Administrateur)",
    request=None,
    responses={200: FicheInnovationSerializer, 403: dict},
)
class FicheRefuserView(APIView):
    """Workflow : refuse une fiche en la passant au statut 'refuse'."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not _est_equipe_ciat(request.user):
            return Response(
                {"detail": "Seuls un coordonnateur ou un administrateur peuvent refuser une fiche."},
                status=status.HTTP_403_FORBIDDEN,
            )

        fiche = get_object_or_404(FicheInnovation, pk=pk)
        fiche.statut = FicheInnovation.Statut.REFUSE
        fiche.save(update_fields=["statut", "modifie_le"])

        return Response(FicheInnovationSerializer(fiche).data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Consulter les statistiques des fiches (Équipe CIAT)",
    responses={200: StatistiquesGallerySerializer, 403: dict},
)
class StatistiquesGalleryView(APIView):
    """Statistiques de consultation : total des vues et répartition par fiche."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _est_equipe_ciat(request.user):
            return Response(
                {"detail": "Accès réservé à l'équipe CIAT."},
                status=status.HTTP_403_FORBIDDEN,
            )

        total_vues = FicheInnovation.objects.aggregate(total=Sum("vues"))["total"] or 0
        par_fiche = list(
            FicheInnovation.objects.values("slug", "titre", "vues").order_by("-vues")
        )

        data = {
            "total_vues": total_vues,
            "par_fiche": par_fiche,
        }
        return Response(data, status=status.HTTP_200_OK)
