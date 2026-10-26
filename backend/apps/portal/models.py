"""Modèles du module Portail (apps.portal) — Phase 1.

Gère les actualités, événements et appels à projets du CIAT.
"""
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Actualite(models.Model):
    """Actualité publiée sur le portail institutionnel du CIAT."""

    titre = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    resume = models.TextField(blank=True)
    contenu = models.TextField()
    image = models.ImageField(upload_to="actualites/", null=True, blank=True)
    publie_le = models.DateTimeField(default=timezone.now)
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
    debut = models.DateTimeField()
    fin = models.DateTimeField(null=True, blank=True)
    lien_inscription = models.URLField(max_length=500, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["debut"]
        verbose_name = "Événement"
        verbose_name_plural = "Événements"

    def __str__(self):
        return self.titre


class AppelProjet(models.Model):
    """Appel à projets / à candidatures lancé par le CIAT."""

    titre = models.CharField(max_length=200)
    description = models.TextField()
    date_limite = models.DateTimeField()
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
