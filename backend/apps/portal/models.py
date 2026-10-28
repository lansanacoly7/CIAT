"""Modèles du module Portail (apps.portal) — Phases 1 (T1, T2).

Gère les actualités, événements, appels à projets, partenaires, documents publics
et messages de contact du CIAT.
"""
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

# ==============================================================================
# T1 — Contenus institutionnels
# ==============================================================================

class Actualite(models.Model):
    """Actualité publiée sur le portail institutionnel du CIAT."""

    titre = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    resume = models.TextField(blank=True)
    contenu = models.TextField()
    image = models.ImageField(upload_to="actualites/", null=True, blank=True)
    publie = models.BooleanField(
        default=False,
        help_text="Seules les actualités publiées sont visibles du public.",
    )
    vues = models.PositiveIntegerField(
        default=0,
        help_text="Nombre de consultations de l'actualité.",
    )
    publie_le = models.DateTimeField(default=timezone.now, db_index=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-publie_le"]
        verbose_name = "Actualité"
        verbose_name_plural = "Actualités"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.titre) or "actualite"
            slug = base_slug
            counter = 1
            while Actualite.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.titre


class Evenement(models.Model):
    """Événement organisé ou soutenu par le CIAT."""

    titre = models.CharField(max_length=200)
    description = models.TextField()
    lieu = models.CharField(max_length=200)
    debut = models.DateTimeField(db_index=True)
    fin = models.DateTimeField(null=True, blank=True)
    lien_inscription = models.URLField(max_length=500, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["debut"]
        verbose_name = "Événement"
        verbose_name_plural = "Événements"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(fin__isnull=True) | models.Q(debut__lte=models.F("fin")),
                name="check_evenement_dates_coherentes",
            ),
        ]

    def __str__(self):
        return self.titre


class AppelProjet(models.Model):
    """Appel à projets / à candidatures lancé par le CIAT."""

    titre = models.CharField(max_length=200)
    description = models.TextField()
    date_limite = models.DateTimeField(db_index=True)
    pieces_demandees = models.JSONField(default=list, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_limite"]
        verbose_name = "Appel à projets"
        verbose_name_plural = "Appels à projets"

    @property
    def statut(self) -> str:
        """Statut calculé dynamiquement selon la date limite : ouvert ou clos."""
        if self.date_limite and self.date_limite < timezone.now():
            return "clos"
        return "ouvert"

    def __str__(self):
        return self.titre


# ==============================================================================
# T2 — Partenaires, documents publics et formulaire de contact
# ==============================================================================

class Partenaire(models.Model):
    """Partenaire institutionnel, académique ou financier du CIAT."""

    nom = models.CharField(max_length=150)
    logo = models.ImageField(upload_to="partenaires/", null=True, blank=True)
    site_web = models.URLField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    ordre = models.PositiveSmallIntegerField(default=0, help_text="Ordre d'affichage")
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ordre", "nom"]
        verbose_name = "Partenaire"
        verbose_name_plural = "Partenaires"

    def __str__(self):
        return self.nom


class DocumentPublic(models.Model):
    """Document téléchargeable public (rapports, chartes, guides, etc.)."""

    titre = models.CharField(max_length=200)
    categorie = models.CharField(
        max_length=100,
        help_text="Ex: Rapports, Charte, Guides, Formulaires",
    )
    fichier = models.FileField(upload_to="documents_publics/")
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["categorie", "titre"]
        verbose_name = "Document public"
        verbose_name_plural = "Documents publics"

    def __str__(self):
        return f"[{self.categorie}] {self.titre}"


class MessageContact(models.Model):
    """Message envoyé via le formulaire de contact public."""

    nom = models.CharField(max_length=150)
    email = models.EmailField()
    sujet = models.CharField(max_length=200)
    message = models.TextField()
    traite = models.BooleanField(default=False, help_text="Marqué comme traité par l'équipe CIAT")
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-cree_le"]
        verbose_name = "Message de contact"
        verbose_name_plural = "Messages de contact"

    def __str__(self):
        return f"Message de {self.nom} ({self.email}) - {self.sujet}"


# ==============================================================================
# Phase 9 — T1 : Lettre d'information avec double opt-in
# ==============================================================================

class AbonnementLettre(models.Model):
    """Abonnement à la lettre d'information institutionnelle du CIAT avec double opt-in."""

    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        CONFIRME = "confirme", "Confirmé"
        DESABONNE = "desabonne", "Désabonné"

    email = models.EmailField(
        unique=True,
        db_index=True,
        verbose_name="Adresse email",
        help_text="Adresse email unique de l'abonné.",
    )
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        db_index=True,
        verbose_name="Statut de l'abonnement",
    )
    jeton = models.CharField(
        max_length=255,
        blank=True,
        db_index=True,
        verbose_name="Jeton de validation / désabonnement à usage unique",
    )
    cree_le = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Date d'inscription",
    )
    confirme_le = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de confirmation (opt-in)",
    )
    desabonne_le = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de désabonnement",
    )

    class Meta:
        ordering = ["-cree_le"]
        verbose_name = "Abonnement à la lettre d'information"
        verbose_name_plural = "Abonnements à la lettre d'information"

    def __str__(self):
        return f"{self.email} ({self.get_statut_display()})"
