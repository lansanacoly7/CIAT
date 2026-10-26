"""Modèles du générateur de documents (P5).

Modèles :
- TypeDocument : typologies de documents officiels (appel, convention, fiche, PV)
- ModeleDocument : gabarits avec sections, consignes et exemples de rédaction
- Document : document généré rattaché à un modèle et optionnellement à un projet
- VersionDocument : historique des versions avec contenu des sections
"""
from django.conf import settings
from django.db import models


class TypeDocument(models.Model):
    """Typologie de document administratif ou institutionnel."""

    code = models.CharField(max_length=50, unique=True)
    nom = models.CharField(max_length=150)

    class Meta:
        ordering = ["nom"]
        verbose_name = "Type de document"
        verbose_name_plural = "Types de documents"

    def __str__(self):
        return self.nom


class ModeleDocument(models.Model):
    """Gabarit prédéfini associé à un type de document."""

    type = models.ForeignKey(
        TypeDocument, on_delete=models.CASCADE, related_name="modeles"
    )
    nom = models.CharField(max_length=150)
    apercu = models.TextField(blank=True)
    sections = models.JSONField(
        default=list,
        help_text="Liste ordonnée de sections : [{'code': '...', 'titre': '...', 'consigne': '...'}]",
    )
    regles_charte = models.TextField(
        blank=True,
        help_text="Directives spécifiques de charte graphique et éditoriale ISEP/CIAT",
    )
    exemple_redaction = models.TextField(
        blank=True,
        help_text="Exemple type servant de guide au modèle de langage",
    )

    class Meta:
        ordering = ["type", "nom"]
        verbose_name = "Modèle de document"
        verbose_name_plural = "Modèles de documents"

    def __str__(self):
        return f"{self.type.nom} — {self.nom}"


class Document(models.Model):
    """Document rédigé ou généré par la plateforme."""

    class Statut(models.TextChoices):
        BROUILLON = "brouillon", "Brouillon"
        VALIDE = "valide", "Validé"
        PUBLIE = "publie", "Publié"

    modele = models.ForeignKey(
        ModeleDocument, on_delete=models.PROTECT, related_name="documents"
    )
    titre = models.CharField(max_length=250)
    sujet = models.TextField()
    projet = models.ForeignKey(
        "core.Projet",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="documents_crees",
    )
    statut = models.CharField(
        max_length=20, choices=Statut.choices, default=Statut.BROUILLON
    )
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-cree_le"]
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def __str__(self):
        return self.titre

    @property
    def derniere_version(self):
        return self.versions.order_by("-numero").first()

    @property
    def version_courante(self):
        dv = self.derniere_version
        return dv.numero if dv else 1


class VersionDocument(models.Model):
    """Version horodatée d'un document avec contenu des sections."""

    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name="versions"
    )
    numero = models.PositiveIntegerField(default=1)
    sections = models.JSONField(
        default=list,
        help_text="Contenu des sections : [{'code': '...', 'titre': '...', 'contenu': '...'}]",
    )
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="versions_documents",
    )
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-numero"]
        unique_together = [("document", "numero")]
        verbose_name = "Version de document"
        verbose_name_plural = "Versions de documents"

    def __str__(self):
        return f"{self.document.titre} (v{self.numero})"
