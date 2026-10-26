"""Modèles du module P2 - Gestion de l'incubateur.

Gère les dossiers de candidature, le dépôt des pièces jointes, la complétude,
les grilles et évaluations du comité, ainsi que les décisions motivées.
"""
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone

from apps.core.models import Projet, Role, User


def piece_upload_path(instance, filename):
    return f"incubator/pieces/{instance.dossier_id}/{filename}"


def validate_file_size(value):
    max_size = 10 * 1024 * 1024  # 10 Mo
    if value.size > max_size:
        raise ValidationError("Le fichier ne doit pas dépasser 10 Mo.")


ALLOWED_PIECE_EXTENSIONS = ["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"]


class StatutDossier(models.TextChoices):
    BROUILLON = "brouillon", "Brouillon"
    SOUMIS = "soumis", "Soumis"
    COMPLET = "complet", "Complet"
    EN_EVALUATION = "en_evaluation", "En évaluation"
    ACCEPTE = "accepte", "Accepté"
    REFUSE = "refuse", "Refusé"


class TypePiece(models.TextChoices):
    FICHE_PROJET = "fiche_projet", "Fiche de projet"
    PRESENTATION_EQUIPE = "presentation_equipe", "Présentation de l'équipe"
    BUDGET_PREVISIONNEL = "budget_previsionnel", "Budget prévisionnel"
    AUTRE = "autre", "Autre pièce"


PIECES_OBLIGATOIRES = [
    TypePiece.FICHE_PROJET,
    TypePiece.PRESENTATION_EQUIPE,
    TypePiece.BUDGET_PREVISIONNEL,
]


class Dossier(models.Model):
    """Dossier de candidature associé à un projet."""

    projet = models.OneToOneField(
        Projet, on_delete=models.CASCADE, related_name="dossier"
    )
    statut = models.CharField(
        max_length=20, choices=StatutDossier.choices, default=StatutDossier.BROUILLON
    )
    soumis_le = models.DateTimeField(null=True, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-cree_le"]
        verbose_name = "Dossier de candidature"
        verbose_name_plural = "Dossiers de candidature"

    def __str__(self):
        return f"Dossier {self.id} - {self.projet.titre}"

    @property
    def pieces_manquantes(self):
        """Liste des types de pièces obligatoires non encore déposés."""
        types_deposes = set(self.pieces.values_list("type", flat=True))
        return [p.value for p in PIECES_OBLIGATOIRES if p.value not in types_deposes]

    @property
    def completude(self):
        """Pourcentage de complétude basé sur les pièces obligatoires fournies."""
        manquantes = len(self.pieces_manquantes)
        total = len(PIECES_OBLIGATOIRES)
        if total == 0:
            return 100
        presentes = total - manquantes
        return int((presentes / total) * 100)

    @property
    def est_complet(self):
        return len(self.pieces_manquantes) == 0

    def soumettre(self):
        """Valide et soumet le dossier."""
        if not self.est_complet:
            raise ValidationError(
                {
                    "pieces_manquantes": (
                        f"Le dossier est incomplet. Pièces manquantes : {', '.join(self.pieces_manquantes)}"
                    )
                }
            )
        self.statut = StatutDossier.SOUMIS
        self.soumis_le = timezone.now()
        self.save()
        # Met à jour le statut du projet associé si encore à l'état idée
        if self.projet.statut == Projet.Statut.IDEE:
            self.projet.statut = Projet.Statut.DEPOSE
            self.projet.save(update_fields=["statut", "modifie_le"])


class Piece(models.Model):
    """Pièce jointe associée à un dossier de candidature."""

    dossier = models.ForeignKey(
        Dossier, on_delete=models.CASCADE, related_name="pieces"
    )
    type = models.CharField(max_length=50, choices=TypePiece.choices)
    nom = models.CharField(max_length=255, blank=True)
    fichier = models.FileField(
        upload_to=piece_upload_path,
        validators=[
            validate_file_size,
            FileExtensionValidator(allowed_extensions=ALLOWED_PIECE_EXTENSIONS),
        ],
    )
    depose_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-depose_le"]
        verbose_name = "Pièce jointe"
        verbose_name_plural = "Pièces jointes"

    def __str__(self):
        return f"{self.get_type_display()} - {self.nom or self.fichier.name}"

    def save(self, *args, **kwargs):
        if not self.nom and self.fichier:
            self.nom = self.fichier.name.split("/")[-1]
        super().save(*args, **kwargs)


class Grille(models.Model):
    """Grille d'évaluation du comité."""

    nom = models.CharField(max_length=150)
    active = models.BooleanField(default=True)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-cree_le"]

    def __str__(self):
        return self.nom


class Critere(models.Model):
    """Critère d'évaluation d'une grille."""

    grille = models.ForeignKey(
        Grille, on_delete=models.CASCADE, related_name="criteres"
    )
    libelle = models.CharField(max_length=200)
    poids = models.PositiveSmallIntegerField(default=1)
    note_max = models.PositiveSmallIntegerField(default=20)
    ordre = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["ordre", "id"]

    def __str__(self):
        return f"{self.libelle} (max {self.note_max}, poids {self.poids})"


class Evaluation(models.Model):
    """Évaluation d'un dossier par un membre du comité."""

    dossier = models.ForeignKey(
        Dossier, on_delete=models.CASCADE, related_name="evaluations"
    )
    evaluateur = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="evaluations_incubateur"
    )
    avis = models.TextField(blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-cree_le"]
        constraints = [
            models.UniqueConstraint(
                fields=["dossier", "evaluateur"],
                name="unique_evaluation_par_evaluateur",
            )
        ]

    def __str__(self):
        return f"Évaluation de {self.evaluateur} pour {self.dossier}"

    @property
    def score(self):
        """Calcule la note moyenne pondérée sur 20."""
        notes = self.notes.select_related("critere").all()
        if not notes:
            return 0.0
        total_points = 0.0
        total_poids = 0
        for n in notes:
            # Ramène chaque note sur 20 selon la note_max du critère
            note_sur_20 = (float(n.note) / n.critere.note_max) * 20
            total_points += note_sur_20 * n.critere.poids
            total_poids += n.critere.poids
        return round(total_points / total_poids, 2) if total_poids > 0 else 0.0


class Note(models.Model):
    """Note attribuée à un critère lors d'une évaluation."""

    evaluation = models.ForeignKey(
        Evaluation, on_delete=models.CASCADE, related_name="notes"
    )
    critere = models.ForeignKey(
        Critere, on_delete=models.PROTECT, related_name="notes"
    )
    note = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["evaluation", "critere"],
                name="unique_note_par_critere",
            )
        ]

    def __str__(self):
        return f"{self.critere.libelle}: {self.note}"


class DecisionType(models.TextChoices):
    ACCEPTE = "accepte", "Accepté"
    REFUSE = "refuse", "Refusé"


class Decision(models.Model):
    """Décision finale prise sur un dossier de candidature."""

    dossier = models.OneToOneField(
        Dossier, on_delete=models.CASCADE, related_name="decision"
    )
    decision = models.CharField(max_length=20, choices=DecisionType.choices)
    motif = models.TextField()
    decide_par = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="decisions_incubateur"
    )
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-cree_le"]

    def __str__(self):
        return f"Décision {self.decision} pour {self.dossier}"

    def appliquer(self):
        """Met à jour le statut du dossier et du projet associé."""
        if self.decision == DecisionType.ACCEPTE:
            self.dossier.statut = StatutDossier.ACCEPTE
            self.dossier.projet.statut = Projet.Statut.SELECTIONNE
        else:
            self.dossier.statut = StatutDossier.REFUSE
            self.dossier.projet.statut = Projet.Statut.REJETE

        self.dossier.save(update_fields=["statut", "modifie_le"])
        self.dossier.projet.save(update_fields=["statut", "modifie_le"])
