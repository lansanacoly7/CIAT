"""Vues DRF pour le module P2 - Gestion de l'incubateur."""
import io
from django.db import transaction
from django.db.models import Avg
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import Projet, Role, User
from apps.core.permissions import HasRole, IsEquipeCIAT
from .models import (
    AffectationMentor,
    CommentaireJalon,
    Critere,
    Decision,
    Dossier,
    EcheanceSuivi,
    Evaluation,
    Grille,
    Jalon,
    Objectif,
    Piece,
    PreuveJalon,
    StatutDossier,
    StatutJalon,
    SuiviProjet,
)
from .serializers import (
    AffectationMentorSerializer,
    AlerteJalonSerializer,
    CommentaireJalonSerializer,
    DecisionSerializer,
    DossierSerializer,
    EvaluationCreateSerializer,
    EvaluationSerializer,
    GrilleSerializer,
    JalonSerializer,
    MentorUserSerializer,
    ObjectifSerializer,
    PieceSerializer,
    PreuveJalonSerializer,
    SuiviProjetSerializer,
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


class MentorListView(generics.ListAPIView):
    """Liste de tous les mentors disponibles."""

    permission_classes = [HasRole(Role.ADMIN, Role.COORDONNATEUR)]
    serializer_class = MentorUserSerializer
    queryset = User.objects.filter(role=Role.MENTOR).order_by("last_name", "first_name")


class ProjetMentorView(APIView):
    """Affectation ou modification du mentor d'un projet."""

    permission_classes = [HasRole(Role.ADMIN, Role.COORDONNATEUR)]

    def post(self, request, pk):
        projet = get_object_or_404(Projet, pk=pk)
        serializer = AffectationMentorSerializer(
            data=request.data,
            context={"request": request, "projet": projet},
        )
        serializer.is_valid(raise_exception=True)
        affectation = serializer.save()
        return Response(AffectationMentorSerializer(affectation).data, status=status.HTTP_200_OK)


class ProjetObjectifListCreateView(APIView):
    """Consultation et création des objectifs d'accompagnement d'un projet."""

    permission_classes = [permissions.IsAuthenticated]

    def _check_access(self, user, projet, write=False):
        if user.is_equipe:
            return True

        is_mentor = hasattr(projet, "affectation_mentor") and projet.affectation_mentor.mentor_id == user.id

        if user.role == Role.MENTOR:
            if not is_mentor:
                raise PermissionDenied("Vous n'êtes pas le mentor affecté à ce projet.")
            return True

        if user.role == Role.PORTEUR and projet.porteur_id == user.id:
            if write:
                raise PermissionDenied("Les porteurs de projet ne peuvent pas définir ou modifier les objectifs.")
            return True

        raise PermissionDenied("Vous n'avez pas accès aux objectifs de ce projet.")

    def get(self, request, pk):
        projet = get_object_or_404(Projet, pk=pk)
        self._check_access(request.user, projet, write=False)
        objectifs = Objectif.objects.filter(projet=projet).select_related("cree_par")
        return Response(ObjectifSerializer(objectifs, many=True).data)

    def post(self, request, pk):
        projet = get_object_or_404(Projet, pk=pk)
        self._check_access(request.user, projet, write=True)
        serializer = ObjectifSerializer(
            data=request.data,
            context={"request": request, "projet": projet},
        )
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(ObjectifSerializer(obj).data, status=status.HTTP_201_CREATED)


class ObjectifDetailView(APIView):
    """Mise à jour d'un objectif d'accompagnement."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        objectif = get_object_or_404(Objectif.objects.select_related("projet__affectation_mentor"), pk=pk)
        user = request.user
        projet = objectif.projet
        is_mentor = hasattr(projet, "affectation_mentor") and projet.affectation_mentor.mentor_id == user.id

        if not (user.is_equipe or (user.role == Role.MENTOR and is_mentor)):
            raise PermissionDenied("Seul le mentor affecté ou l'équipe CIAT peut modifier un objectif.")

        serializer = ObjectifSerializer(objectif, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ProjetJalonListCreateView(APIView):
    """Consultation et création des jalons d'un projet."""

    permission_classes = [permissions.IsAuthenticated]

    def _check_access(self, user, projet, write=False):
        if user.is_equipe:
            return True

        is_mentor = hasattr(projet, "affectation_mentor") and projet.affectation_mentor.mentor_id == user.id

        if user.role == Role.MENTOR:
            if not is_mentor:
                raise PermissionDenied("Vous n'êtes pas le mentor affecté à ce projet.")
            return True

        if user.role == Role.PORTEUR and projet.porteur_id == user.id:
            if write:
                raise PermissionDenied("Les porteurs de projet ne peuvent pas créer de jalons.")
            return True

        raise PermissionDenied("Vous n'avez pas accès aux jalons de ce projet.")

    def get(self, request, pk):
        projet = get_object_or_404(Projet, pk=pk)
        self._check_access(request.user, projet, write=False)
        jalons = (
            Jalon.objects.filter(projet=projet)
            .prefetch_related("preuves__depose_par", "commentaires__auteur")
            .select_related("cree_par")
        )
        return Response(JalonSerializer(jalons, many=True).data)

    def post(self, request, pk):
        projet = get_object_or_404(Projet, pk=pk)
        self._check_access(request.user, projet, write=True)
        serializer = JalonSerializer(
            data=request.data,
            context={"request": request, "projet": projet},
        )
        serializer.is_valid(raise_exception=True)
        jalon = serializer.save()
        return Response(JalonSerializer(jalon).data, status=status.HTTP_201_CREATED)


class JalonDetailView(APIView):
    """Mise à jour d'un jalon."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        jalon = get_object_or_404(Jalon.objects.select_related("projet__affectation_mentor"), pk=pk)
        user = request.user
        is_mentor = hasattr(jalon.projet, "affectation_mentor") and jalon.projet.affectation_mentor.mentor_id == user.id

        if not (user.is_equipe or (user.role == Role.MENTOR and is_mentor)):
            raise PermissionDenied("Seul le mentor affecté ou l'équipe CIAT peut modifier un jalon.")

        serializer = JalonSerializer(jalon, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class JalonPreuveCreateView(APIView):
    """Dépôt d'une preuve de réalisation sur un jalon."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        jalon = get_object_or_404(Jalon.objects.select_related("projet__affectation_mentor"), pk=pk)
        user = request.user
        is_mentor = hasattr(jalon.projet, "affectation_mentor") and jalon.projet.affectation_mentor.mentor_id == user.id
        is_porteur = (user.role == Role.PORTEUR and jalon.projet.porteur_id == user.id)

        if not (user.is_equipe or (user.role == Role.MENTOR and is_mentor) or is_porteur):
            raise PermissionDenied("Vous n'êtes pas autorisé à déposer une preuve sur ce jalon.")

        serializer = PreuveJalonSerializer(
            data=request.data,
            context={"request": request, "jalon": jalon},
        )
        serializer.is_valid(raise_exception=True)
        preuve = serializer.save()
        return Response(PreuveJalonSerializer(preuve).data, status=status.HTTP_201_CREATED)


class JalonCommentaireCreateView(APIView):
    """Ajout d'un commentaire sur un jalon."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        jalon = get_object_or_404(Jalon.objects.select_related("projet__affectation_mentor"), pk=pk)
        user = request.user
        is_mentor = hasattr(jalon.projet, "affectation_mentor") and jalon.projet.affectation_mentor.mentor_id == user.id
        is_porteur = (user.role == Role.PORTEUR and jalon.projet.porteur_id == user.id)

        if not (user.is_equipe or (user.role == Role.MENTOR and is_mentor) or is_porteur):
            raise PermissionDenied("Vous n'êtes pas autorisé à commenter ce jalon.")

        serializer = CommentaireJalonSerializer(
            data=request.data,
            context={"request": request, "jalon": jalon},
        )
        serializer.is_valid(raise_exception=True)
        com = serializer.save()
        return Response(CommentaireJalonSerializer(com).data, status=status.HTTP_201_CREATED)


class AlerteJalonListView(APIView):
    """Liste des jalons en retard visibles pour l'utilisateur connecté selon son rôle."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        base_qs = Jalon.objects.filter(echeance__lt=today).exclude(statut=StatutJalon.FAIT).select_related("projet")

        if user.is_equipe:
            qs = base_qs
        elif user.role == Role.MENTOR:
            qs = base_qs.filter(projet__affectation_mentor__mentor=user)
        elif user.role == Role.PORTEUR:
            qs = base_qs.filter(projet__porteur=user)
        else:
            qs = Jalon.objects.none()

        serializer = AlerteJalonSerializer(qs.order_by("echeance"), many=True)
        return Response(serializer.data)


class ProjetSuiviListCreateView(APIView):
    """Consultation et saisie des bilans de suivi à 3 et 6 mois."""

    permission_classes = [permissions.IsAuthenticated]

    def _check_access(self, user, projet, write=False):
        if user.is_equipe:
            return True

        is_mentor = hasattr(projet, "affectation_mentor") and projet.affectation_mentor.mentor_id == user.id

        if user.role == Role.MENTOR:
            if not is_mentor:
                raise PermissionDenied("Vous n'êtes pas le mentor affecté à ce projet.")
            return True

        if user.role == Role.PORTEUR and projet.porteur_id == user.id:
            if write:
                raise PermissionDenied("Les porteurs de projet ne peuvent pas saisir de bilans de suivi.")
            return True

        raise PermissionDenied("Vous n'avez pas accès aux bilans de suivi de ce projet.")

    def get(self, request, pk):
        projet = get_object_or_404(Projet, pk=pk)
        self._check_access(request.user, projet, write=False)
        suivis = SuiviProjet.objects.filter(projet=projet).select_related("redige_par")
        return Response(SuiviProjetSerializer(suivis, many=True).data)

    def post(self, request, pk):
        projet = get_object_or_404(Projet, pk=pk)
        self._check_access(request.user, projet, write=True)
        serializer = SuiviProjetSerializer(
            data=request.data,
            context={"request": request, "projet": projet},
        )
        serializer.is_valid(raise_exception=True)
        suivi = serializer.save()
        return Response(SuiviProjetSerializer(suivi).data, status=status.HTTP_201_CREATED)


class ProjetCompteRenduExportView(APIView):
    """Génération du compte rendu complet d'un projet incubé au format Excel (.xlsx)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        projet = get_object_or_404(
            Projet.objects.select_related("porteur", "domaine", "cohorte", "affectation_mentor__mentor"),
            pk=pk,
        )
        user = request.user
        is_mentor = hasattr(projet, "affectation_mentor") and projet.affectation_mentor.mentor_id == user.id

        # Contrôle strict d'accès : porteur du projet, mentor affecté ou équipe CIAT
        if not (user.is_equipe or (user.role == Role.PORTEUR and projet.porteur_id == user.id) or (user.role == Role.MENTOR and is_mentor)):
            raise PermissionDenied("Vous n'avez pas accès au compte rendu de ce projet.")

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Compte Rendu Incubation"

        # Styles
        font_titre_doc = Font(name="Calibri", size=16, bold=True, color="1E3A8A")
        font_section = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
        fill_section = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")

        font_header_table = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        fill_header_table = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")

        font_label = Font(name="Calibri", size=11, bold=True, color="1F2937")
        font_data = Font(name="Calibri", size=11, color="111827")

        border_thin = Side(border_style="thin", color="D1D5DB")
        border_all = Border(left=border_thin, right=border_thin, top=border_thin, bottom=border_thin)

        row_idx = 1

        # Titre général
        ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=6)
        cell_title = ws.cell(row=row_idx, column=1, value=f"CIAT — COMPTE RENDU D'INCUBATION : {projet.titre.upper()}")
        cell_title.font = font_titre_doc
        cell_title.alignment = Alignment(vertical="center")
        row_idx += 2

        # --- BLOC 1 : INFORMATIONS DU PROJET ---
        ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=6)
        cell_sec1 = ws.cell(row=row_idx, column=1, value="1. INFORMATIONS DU PROJET")
        cell_sec1.font = font_section
        cell_sec1.fill = fill_section
        cell_sec1.alignment = Alignment(vertical="center", indent=1)
        row_idx += 1

        infos = [
            ("Titre du projet", projet.titre),
            ("Domaine", projet.domaine.nom if projet.domaine else "—"),
            ("Cohorte", str(projet.cohorte) if projet.cohorte else "—"),
            ("Statut du projet", projet.get_statut_display()),
            ("Porteur de projet", f"{projet.porteur.get_full_name()} ({projet.porteur.email})"),
            ("Mentor référent", f"{projet.affectation_mentor.mentor.get_full_name()} ({projet.affectation_mentor.mentor.email})" if hasattr(projet, "affectation_mentor") else "Non affecté"),
            ("Date d'extraction", timezone.now().strftime("%d/%m/%Y %H:%M")),
        ]

        for label, val in infos:
            c_lbl = ws.cell(row=row_idx, column=1, value=label)
            c_lbl.font = font_label
            c_lbl.border = border_all
            ws.merge_cells(start_row=row_idx, start_column=2, end_row=row_idx, end_column=6)
            c_val = ws.cell(row=row_idx, column=2, value=val)
            c_val.font = font_data
            for col in range(2, 7):
                ws.cell(row=row_idx, column=col).border = border_all
            row_idx += 1

        row_idx += 2

        # --- BLOC 2 : OBJECTIFS D'ACCOMPAGNEMENT ---
        ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=6)
        cell_sec2 = ws.cell(row=row_idx, column=1, value="2. OBJECTIFS D'ACCOMPAGNEMENT")
        cell_sec2.font = font_section
        cell_sec2.fill = fill_section
        cell_sec2.alignment = Alignment(vertical="center", indent=1)
        row_idx += 1

        headers_obj = ["N°", "Libellé de l'objectif", "Échéance", "Statut", "Créé par", "Créé le"]
        for col_idx, h in enumerate(headers_obj, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=h)
            cell.font = font_header_table
            cell.fill = fill_header_table
            cell.border = border_all
            cell.alignment = Alignment(horizontal="center")
        row_idx += 1

        objectifs = Objectif.objects.filter(projet=projet).select_related("cree_par").order_by("echeance", "cree_le")
        if objectifs.exists():
            for idx, obj in enumerate(objectifs, start=1):
                ws.cell(row=row_idx, column=1, value=idx).border = border_all
                ws.cell(row=row_idx, column=2, value=obj.libelle).border = border_all
                ws.cell(row=row_idx, column=3, value=obj.echeance.strftime("%d/%m/%Y") if obj.echeance else "—").border = border_all
                ws.cell(row=row_idx, column=4, value=obj.get_statut_display()).border = border_all
                ws.cell(row=row_idx, column=5, value=obj.cree_par.get_full_name() or obj.cree_par.email).border = border_all
                ws.cell(row=row_idx, column=6, value=obj.cree_le.strftime("%d/%m/%Y")).border = border_all
                row_idx += 1
        else:
            ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=6)
            c = ws.cell(row=row_idx, column=1, value="Aucun objectif d'accompagnement défini pour le moment.")
            c.font = font_data
            for col in range(1, 7):
                ws.cell(row=row_idx, column=col).border = border_all
            row_idx += 1

        row_idx += 2

        # --- BLOC 3 : JALONS ET RÉALISATIONS ---
        ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=6)
        cell_sec3 = ws.cell(row=row_idx, column=1, value="3. JALONS ET RÉALISATIONS")
        cell_sec3.font = font_section
        cell_sec3.fill = fill_section
        cell_sec3.alignment = Alignment(vertical="center", indent=1)
        row_idx += 1

        headers_jalons = ["N°", "Titre du jalon", "Échéance", "Statut", "En retard", "Preuves (nb)"]
        for col_idx, h in enumerate(headers_jalons, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=h)
            cell.font = font_header_table
            cell.fill = fill_header_table
            cell.border = border_all
            cell.alignment = Alignment(horizontal="center")
        row_idx += 1

        jalons = Jalon.objects.filter(projet=projet).prefetch_related("preuves").order_by("echeance", "cree_le")
        if jalons.exists():
            for idx, j in enumerate(jalons, start=1):
                ws.cell(row=row_idx, column=1, value=idx).border = border_all
                ws.cell(row=row_idx, column=2, value=j.titre).border = border_all
                ws.cell(row=row_idx, column=3, value=j.echeance.strftime("%d/%m/%Y")).border = border_all
                ws.cell(row=row_idx, column=4, value=j.get_statut_display()).border = border_all
                ws.cell(row=row_idx, column=5, value="Oui" if j.en_retard else "Non").border = border_all
                ws.cell(row=row_idx, column=6, value=j.preuves.count()).border = border_all
                row_idx += 1
        else:
            ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=6)
            c = ws.cell(row=row_idx, column=1, value="Aucun jalon défini pour le moment.")
            c.font = font_data
            for col in range(1, 7):
                ws.cell(row=row_idx, column=col).border = border_all
            row_idx += 1

        row_idx += 2

        # --- BLOC 4 : BILANS DE SUIVI (3 ET 6 MOIS) ---
        ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=6)
        cell_sec4 = ws.cell(row=row_idx, column=1, value="4. BILANS DE SUIVI PÉRIODIQUE (3 ET 6 MOIS)")
        cell_sec4.font = font_section
        cell_sec4.fill = fill_section
        cell_sec4.alignment = Alignment(vertical="center", indent=1)
        row_idx += 1

        suivis = SuiviProjet.objects.filter(projet=projet).select_related("redige_par").order_by("echeance")
        if suivis.exists():
            for s in suivis:
                ws.cell(row=row_idx, column=1, value=f"Échéance : {s.get_echeance_display()}").font = font_label
                ws.cell(row=row_idx, column=1).border = border_all
                ws.merge_cells(start_row=row_idx, start_column=2, end_row=row_idx, end_column=6)
                c_s = ws.cell(row=row_idx, column=2, value=f"Rédigé par {s.redige_par.get_full_name()} le {s.cree_le.strftime('%d/%m/%Y')}")
                c_s.font = font_data
                for col in range(2, 7):
                    ws.cell(row=row_idx, column=col).border = border_all
                row_idx += 1

                ws.cell(row=row_idx, column=1, value="Bilan écrit").font = font_label
                ws.cell(row=row_idx, column=1).border = border_all
                ws.merge_cells(start_row=row_idx, start_column=2, end_row=row_idx, end_column=6)
                c_b = ws.cell(row=row_idx, column=2, value=s.bilan)
                c_b.font = font_data
                for col in range(2, 7):
                    ws.cell(row=row_idx, column=col).border = border_all
                row_idx += 1

                if s.indicateurs:
                    ws.cell(row=row_idx, column=1, value="Indicateurs").font = font_label
                    ws.cell(row=row_idx, column=1).border = border_all
                    ws.merge_cells(start_row=row_idx, start_column=2, end_row=row_idx, end_column=6)
                    ind_text = ", ".join(f"{k}: {v}" for k, v in s.indicateurs.items())
                    c_i = ws.cell(row=row_idx, column=2, value=ind_text)
                    c_i.font = font_data
                    for col in range(2, 7):
                        ws.cell(row=row_idx, column=col).border = border_all
                    row_idx += 1
                row_idx += 1
        else:
            ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=6)
            c = ws.cell(row=row_idx, column=1, value="Aucun bilan de suivi enregistré pour ce projet.")
            c.font = font_data
            for col in range(1, 7):
                ws.cell(row=row_idx, column=col).border = border_all
            row_idx += 1

        # Ajustement des largeurs de colonnes
        column_widths = {1: 20, 2: 40, 3: 18, 4: 18, 5: 25, 6: 18}
        for col_idx, width in column_widths.items():
            ws.column_dimensions[get_column_letter(col_idx)].width = width

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="compte_rendu_projet_{projet.id}.xlsx"'
        return response



