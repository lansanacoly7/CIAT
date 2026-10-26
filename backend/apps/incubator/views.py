"""Vues DRF pour le module P2 - Gestion de l'incubateur."""
from django.db import transaction
from django.db.models import Avg
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import Role
from apps.core.permissions import HasRole, IsEquipeCIAT
from .models import (
    Critere,
    Decision,
    Dossier,
    Evaluation,
    Grille,
    Piece,
    StatutDossier,
)
from .serializers import (
    DecisionSerializer,
    DossierSerializer,
    EvaluationCreateSerializer,
    EvaluationSerializer,
    GrilleSerializer,
    PieceSerializer,
)


def can_access_dossier(user, dossier):
    """Vérifie si l'utilisateur a le droit de consulter ce dossier."""
    if not user or not user.is_authenticated:
        return False
    if user.role in (Role.ADMIN, Role.COORDONNATEUR, Role.COMITE, Role.MENTOR):
        return True
    if user.role == Role.PORTEUR:
        return dossier.projet.porteur_id == user.id
    return False


class DossierListCreateView(generics.ListCreateAPIView):
    """Liste les dossiers selon le rôle de l'utilisateur et permet au porteur autorisé d'en créer un."""

    serializer_class = DossierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Dossier.objects.select_related("projet", "projet__porteur").prefetch_related("pieces")
        if user.role == Role.PORTEUR:
            return qs.filter(projet__porteur=user)
        if user.role in (Role.ADMIN, Role.COORDONNATEUR, Role.COMITE, Role.MENTOR):
            return qs.all()
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in (Role.PORTEUR, Role.ADMIN, Role.COORDONNATEUR):
            raise PermissionDenied("Votre rôle ne vous permet pas de créer un dossier de candidature.")
        serializer.save()


class DossierDetailView(generics.RetrieveUpdateAPIView):
    """Consultation et modification sécurisée d'un dossier."""

    serializer_class = DossierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Dossier.objects.select_related("projet", "projet__porteur").prefetch_related("pieces")

    def get_object(self):
        obj = super().get_object()
        if not can_access_dossier(self.request.user, obj):
            raise PermissionDenied("Vous n'avez pas accès à ce dossier de candidature.")
        return obj

    def perform_update(self, serializer):
        dossier = self.get_object()
        user = self.request.user

        # Seul le propriétaire ou l'équipe CIAT peut modifier un dossier
        if not (user.is_equipe or (user.role == Role.PORTEUR and dossier.projet.porteur_id == user.id)):
            raise PermissionDenied("Vous n'êtes pas autorisé à modifier ce dossier.")

        if user.role == Role.PORTEUR and dossier.statut != StatutDossier.BROUILLON:
            raise ValidationError("Un dossier déjà soumis ne peut plus être modifié.")

        serializer.save()


class PieceCreateView(APIView):
    """Dépôt sécurisé d'une pièce jointe en multipart/form-data."""

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        dossier = get_object_or_404(Dossier, pk=pk)

        # Contrôle strict : seul le porteur propriétaire ou l'équipe CIAT peut déposer des pièces
        if not (request.user.is_equipe or (request.user.role == Role.PORTEUR and dossier.projet.porteur_id == request.user.id)):
            raise PermissionDenied("Seul le porteur du projet ou l'équipe CIAT peut déposer des pièces.")

        if dossier.statut != StatutDossier.BROUILLON and not request.user.is_equipe:
            raise ValidationError("Impossible d'ajouter des pièces à un dossier déjà soumis.")

        serializer = PieceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        piece = serializer.save(dossier=dossier)
        return Response(PieceSerializer(piece).data, status=status.HTTP_201_CREATED)


class PieceDeleteView(APIView):
    """Suppression sécurisée d'une pièce d'un dossier non soumis."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, piece_id):
        dossier = get_object_or_404(Dossier, pk=pk)

        # Contrôle strict : seul le porteur propriétaire ou l'équipe CIAT peut supprimer des pièces
        if not (request.user.is_equipe or (request.user.role == Role.PORTEUR and dossier.projet.porteur_id == request.user.id)):
            raise PermissionDenied("Seul le porteur du projet ou l'équipe CIAT peut supprimer des pièces.")

        if dossier.statut != StatutDossier.BROUILLON and not request.user.is_equipe:
            raise ValidationError("Impossible de supprimer une pièce d'un dossier déjà soumis.")

        piece = get_object_or_404(Piece, pk=piece_id, dossier=dossier)
        piece.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DossierSoumettreView(APIView):
    """Soumission officielle d'un dossier avec verrouillage transactionnel anti-concurrence."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            dossier = get_object_or_404(
                Dossier.objects.select_for_update().select_related("projet"), pk=pk
            )

            # Contrôle strict d'autorisation
            if not (request.user.is_equipe or (request.user.role == Role.PORTEUR and dossier.projet.porteur_id == request.user.id)):
                raise PermissionDenied("Seul le porteur du projet ou l'équipe CIAT peut soumettre ce dossier.")

            if dossier.statut != StatutDossier.BROUILLON:
                return Response(
                    {"detail": f"Ce dossier a déjà été soumis (statut : {dossier.statut})."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not dossier.est_complet:
                return Response(
                    {
                        "detail": "Le dossier est incomplet. Toutes les pièces obligatoires doivent être fournies.",
                        "pieces_manquantes": dossier.pieces_manquantes,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            dossier.soumettre()
            return Response(DossierSerializer(dossier).data, status=status.HTTP_200_OK)


class GrilleActuelleView(APIView):
    """Retourne la grille d'évaluation actuellement active avec ses critères."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        grille = Grille.objects.filter(active=True).prefetch_related("criteres").first()
        if not grille:
            return Response(
                {"detail": "Aucune grille d'évaluation active configurée."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = GrilleSerializer(grille)
        return Response(serializer.data)


class DossierEvaluationListCreateView(APIView):
    """Consultation et saisie des évaluations avec verrouillage transactionnel."""

    permission_classes = [HasRole(Role.ADMIN, Role.COORDONNATEUR, Role.COMITE, Role.MENTOR)]

    def get(self, request, pk):
        dossier = get_object_or_404(Dossier, pk=pk)
        evaluations = (
            Evaluation.objects.filter(dossier=dossier)
            .select_related("evaluateur")
            .prefetch_related("notes__critere")
        )
        scores = [e.score for e in evaluations]
        score_moyen = round(sum(scores) / len(scores), 2) if scores else None

        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(
            {
                "score_moyen": score_moyen,
                "total_evaluations": len(evaluations),
                "evaluations": serializer.data,
            }
        )

    def post(self, request, pk):
        if request.user.role not in (Role.ADMIN, Role.COORDONNATEUR, Role.COMITE):
            raise PermissionDenied("Seuls les membres du comité peuvent évaluer un dossier.")

        with transaction.atomic():
            dossier = get_object_or_404(
                Dossier.objects.select_for_update().select_related("projet"), pk=pk
            )
            serializer = EvaluationCreateSerializer(
                data=request.data,
                context={"request": request, "dossier": dossier},
            )
            serializer.is_valid(raise_exception=True)
            evaluation = serializer.save()
            return Response(EvaluationSerializer(evaluation).data, status=status.HTTP_201_CREATED)


class DossierDecisionView(APIView):
    """Décision motivée du comité avec verrouillage transactionnel et validation des statuts."""

    permission_classes = [HasRole(Role.ADMIN, Role.COORDONNATEUR)]

    def post(self, request, pk):
        with transaction.atomic():
            dossier = get_object_or_404(
                Dossier.objects.select_for_update().select_related("projet"), pk=pk
            )
            serializer = DecisionSerializer(
                data=request.data,
                context={"request": request, "dossier": dossier},
            )
            serializer.is_valid(raise_exception=True)
            decision = serializer.save()
            return Response(DecisionSerializer(decision).data, status=status.HTTP_201_CREATED)
