"""Modèles du module Galerie des innovations (apps.gallery) — Phase 2 (T2 / P6).

Gère les fiches d'innovation liées aux projets incubés au CIAT,
le cycle de validation (brouillon, en validation, publié, refusé),
le compteur de consultations et les médias associés.
"""
from django.db import models
from django.utils.text import slugify


class FicheInnovation(models.Model):
    """Fiche d'innovation publique ou en cours de validation liée à un projet."""

    class Statut(models.TextChoices):
        BROUILLON = "brouillon", "Brouillon"
        EN_VALIDATION = "en_validation", "En validation"
        PUBLIE = "publie", "Publié"
        REFUSE = "refuse", "Refusé"

    projet = models.ForeignKey(
        "core.Projet",
        on_delete=models.CASCADE,
        related_name="fiches_innovation",
        verbose_name="Projet associé",
    )
    titre = models.CharField(max_length=200, verbose_name="Titre de la fiche")
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    probleme = models.TextField(verbose_name="Problème adressé")
    solution = models.TextField(verbose_name="Solution innovante")
    equipe = models.TextField(
        verbose_name="Présentation de l'équipe",
        help_text="Présentation de l'équipe (noms et compétences, sans données privées)",
    )
    avancement = models.CharField(
        max_length=100,
        verbose_name="Niveau d'avancement",
        help_text="Ex : Idée, Prototype, MVP, Pilote, Déploiement",
    )
    medias = models.JSONField(
        default=list,
        blank=True,
        help_text="Liste des médias : [{'type': 'photo'|'video'|'demo', 'url': '...'}]",
    )
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.BROUILLON,
        verbose_name="Statut du workflow",
        db_index=True,
    )
    vues = models.PositiveIntegerField(
        default=0,
        verbose_name="Nombre de consultations",
    )
    cree_le = models.DateTimeField(auto_now_add=True, db_index=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-cree_le"]
        verbose_name = "Fiche d'innovation"
        verbose_name_plural = "Fiches d'innovation"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.titre) or "fiche-innovation"
            slug = base_slug
            counter = 1
            while FicheInnovation.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titre} [{self.statut}]"


class ManifestationInteret(models.Model):
    """Manifestation d'intérêt d'un partenaire ou investisseur pour une fiche d'innovation."""

    fiche = models.ForeignKey(
        FicheInnovation,
        on_delete=models.CASCADE,
        related_name="manifestations_interet",
        verbose_name="Fiche d'innovation",
    )
    nom = models.CharField(max_length=150, verbose_name="Nom complet")
    email = models.EmailField(verbose_name="Adresse email")
    organisation = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Organisation ou entreprise",
    )
    message = models.TextField(verbose_name="Message ou objet de l'intérêt")
    cree_le = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Date d'enregistrement")

    class Meta:
        ordering = ["-cree_le"]
        verbose_name = "Manifestation d'intérêt"
        verbose_name_plural = "Manifestations d'intérêt"

    def __str__(self):
        return f"{self.nom} ({self.email}) — {self.fiche.titre}"

