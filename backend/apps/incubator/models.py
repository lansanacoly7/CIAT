"""Modèles du module P2 - Gestion de l'incubateur.

Gère les dossiers de candidature, le dépôt des pièces jointes, la complétude,
les grilles et évaluations du comité, ainsi que les décisions motivées.
"""
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone

import os
import re
from django.utils.text import slugify

from apps.core.models import Projet, Role, User


def sanitize_filename(filename):
    """Nettoie le nom de fichier pour éviter les attaques de path traversal et caractères dangereux."""
    basename = os.path.basename(filename)
    name, ext = os.path.splitext(basename)
    clean_name = slugify(name) or "piece"
    clean_ext = re.sub(r"[^a-zA-Z0-9]", "", ext.lower())
    return f"{clean_name}.{clean_ext}" if clean_ext else clean_name


def piece_upload_path(instance, filename):
    clean_file = sanitize_filename(filename)
    return f"incubator/pieces/{instance.dossier_id}/{clean_file}"


def preuve_upload_path(instance, filename):
    clean_file = sanitize_filename(filename)
    return f"incubator/preuves/{instance.jalon.projet_id}/{clean_file}"



def validate_file_size(value):
    max_size = 10 * 1024 * 1024  # 10 Mo
    if value.size == 0:
        raise ValidationError("Le fichier est vide (0 octet).")
    if value.size > max_size:
        raise ValidationError("Le fichier ne doit pas dépasser 10 Mo.")


def validate_file_content(file):
    """Vérifie la signature binaire (magic bytes) du fichier pour éviter le spoofing d'extension."""
    if file.size == 0:
        raise ValidationError("Le fichier est vide (0 octet).")

    pos = file.tell() if hasattr(file, "tell") else 0
    file.seek(0)
    header = file.read(16)
    file.seek(pos)

    ext = file.name.split(".")[-1].lower() if "." in file.name else ""

    if ext == "pdf" and not header.startswith(b"%PDF-"):
        raise ValidationError("Le fichier n'est pas un document PDF valide (signature invalide).")
    elif ext == "png" and not header.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValidationError("Le fichier n'est pas une image PNG valide.")
    elif ext in ("jpg", "jpeg") and not header.startswith(b"\xff\xd8\xff"):
        raise ValidationError("Le fichier n'est pas une image JPEG valide.")
    elif ext == "webp" and (not header.startswith(b"RIFF") or b"WEBP" not in header[:16]):
        raise ValidationError("Le fichier n'est pas une image WEBP valide.")
    elif ext == "docx" and not header.startswith(b"PK\x03\x04"):
        raise ValidationError("Le fichier n'est pas un document Word DOCX valide.")
    elif ext == "doc" and not header.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"):
        raise ValidationError("Le fichier n'est pas un document Word DOC valide.")


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
        """Valide et soumet officiellement le dossier."""
        if self.statut != StatutDossier.BROUILLON:
            raise ValidationError(
                f"Ce dossier a déjà été soumis (statut actuel : {self.statut})."
            )
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
        self.save(update_fields=["statut", "soumis_le", "modifie_le"])

        # Met à jour le statut du projet associé si encore à l'état idée
        if self.projet.statut == Projet.Statut.IDEE:
            self.projet.statut = Projet.Statut.DEPOSE
            self.projet.save(update_fields=["statut", "modifie_le"])

    def commencer_evaluation(self):
        """Transitionne le dossier vers l'état en_evaluation dès la première notation."""
        if self.statut in (StatutDossier.SOUMIS, StatutDossier.COMPLET):
            self.statut = StatutDossier.EN_EVALUATION
            self.save(update_fields=["statut", "modifie_le"])


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
            validate_file_content,
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
    """Grille d'évaluation du comité. Une seule grille peut être active à un instant donné."""

    nom = models.CharField(max_length=150)
    active = models.BooleanField(default=True)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-cree_le"]
        constraints = [
            models.UniqueConstraint(
                fields=["active"],
                condition=models.Q(active=True),
                name="unique_grille_active",
            )
        ]

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        # Si cette grille est déclarée active, désactive automatiquement les autres
        if self.active:
            Grille.objects.exclude(pk=self.pk).filter(active=True).update(active=False)
        super().save(*args, **kwargs)


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
        """Calcule la note moyenne pondérée normalisée sur 20."""
        notes = self.notes.select_related("critere").all()
        if not notes:
            return 0.0
        total_points = 0.0
        total_poids = 0
        for n in notes:
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
        """Met à jour le statut du dossier et du projet associé de façon atomique."""
        if self.decision == DecisionType.ACCEPTE:
            self.dossier.statut = StatutDossier.ACCEPTE
            self.dossier.projet.statut = Projet.Statut.SELECTIONNE
        else:
            self.dossier.statut = StatutDossier.REFUSE
            self.dossier.projet.statut = Projet.Statut.REJETE

        self.dossier.save(update_fields=["statut", "modifie_le"])
        self.dossier.projet.save(update_fields=["statut", "modifie_le"])


class AffectationMentor(models.Model):
    """Affectation d'un mentor à un projet d'incubation."""

    projet = models.OneToOneField(
        Projet, on_delete=models.CASCADE, related_name="affectation_mentor"
    )
    mentor = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="projets_mentores"
    )
    affecte_le = models.DateTimeField(auto_now_add=True)
    affecte_par = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="mentors_affectes"
    )

    class Meta:
        ordering = ["-affecte_le"]
        verbose_name = "Affectation de mentor"
        verbose_name_plural = "Affectations de mentors"

    def __str__(self):
        return f"{self.mentor} -> {self.projet.titre}"

    def clean(self):
        if self.mentor.role != Role.MENTOR:
            raise ValidationError("L'utilisateur affecté doit avoir le rôle mentor.")


class StatutObjectif(models.TextChoices):
    A_FAIRE = "a_faire", "À faire"
    EN_COURS = "en_cours", "En cours"
    ATTEINT = "atteint", "Atteint"


class Objectif(models.Model):
    """Objectif fixé pour un projet incubé."""

    projet = models.ForeignKey(
        Projet, on_delete=models.CASCADE, related_name="objectifs"
    )
    libelle = models.CharField(max_length=255)
    echeance = models.DateField(null=True, blank=True)
    statut = models.CharField(
        max_length=20,
        choices=StatutObjectif.choices,
        default=StatutObjectif.A_FAIRE,
    )
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)
    cree_par = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="objectifs_crees"
    )

    class Meta:
        ordering = ["echeance", "cree_le"]
        verbose_name = "Objectif de projet"
        verbose_name_plural = "Objectifs de projets"

    def __str__(self):
        return f"{self.projet.titre} - {self.libelle} ({self.statut})"


class StatutJalon(models.TextChoices):
    A_FAIRE = "a_faire", "À faire"
    EN_COURS = "en_cours", "En cours"
    FAIT = "fait", "Fait"


class Jalon(models.Model):
    """Jalon d'un projet d'incubation."""

    projet = models.ForeignKey(
        Projet, on_delete=models.CASCADE, related_name="jalons"
    )
    titre = models.CharField(max_length=255)
    echeance = models.DateField()
    statut = models.CharField(
        max_length=20,
        choices=StatutJalon.choices,
        default=StatutJalon.A_FAIRE,
    )
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)
    cree_par = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="jalons_crees"
    )

    class Meta:
        ordering = ["echeance", "cree_le"]
        verbose_name = "Jalon de projet"
        verbose_name_plural = "Jalons de projets"

    def __str__(self):
        return f"{self.projet.titre} - {self.titre} ({self.statut})"

    @property
    def en_retard(self) -> bool:
        """Indicateur calculé en temps réel : vrai si la date d'échéance est passée et statut non fait."""
        return bool(self.statut != StatutJalon.FAIT and self.echeance < timezone.now().date())


class PreuveJalon(models.Model):
    """Fichier de preuve déposé pour justifier l'avancement d'un jalon."""

    jalon = models.ForeignKey(
        Jalon, on_delete=models.CASCADE, related_name="preuves"
    )
    fichier = models.FileField(
        upload_to=preuve_upload_path,
        validators=[
            FileExtensionValidator(allowed_extensions=ALLOWED_PIECE_EXTENSIONS),
            validate_file_size,
            validate_file_content,
        ],
    )
    nom = models.CharField(max_length=255)
    depose_par = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="preuves_jalons"
    )
    depose_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-depose_le"]
        verbose_name = "Preuve de jalon"
        verbose_name_plural = "Preuves de jalons"

    def __str__(self):
        return f"Preuve: {self.nom} pour jalon {self.jalon_id}"

    def save(self, *args, **kwargs):
        if not self.nom and self.fichier:
            self.nom = sanitize_filename(self.fichier.name)
        super().save(*args, **kwargs)


class CommentaireJalon(models.Model):
    """Commentaire horodaté sur un jalon d'incubation."""

    jalon = models.ForeignKey(
        Jalon, on_delete=models.CASCADE, related_name="commentaires"
    )
    auteur = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="commentaires_jalons"
    )
    texte = models.TextField()
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["cree_le"]
        verbose_name = "Commentaire de jalon"
        verbose_name_plural = "Commentaires de jalons"

    def __str__(self):
        return f"Commentaire de {self.auteur} sur jalon {self.jalon_id}"

