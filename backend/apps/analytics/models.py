"""Modèles du module analytics : suivi des partenariats et des financements (T3).

Ces modèles sont directement reliés aux projets de apps.core.models.Projet.
Règle métier stricte :
- Seuls les projets sélectionnés, incubés, prototypes ou terminés peuvent avoir
  des partenariats ou des financements. Un projet au stade 'idée' ou 'déposé'
  n'a jamais de financement ni de partenariat.
"""
from django.core.exceptions import ValidationError
from django.db import models
from apps.core.models import Projet


class TypePartenariat(models.TextChoices):
    TECHNIQUE = "technique", "Technique & R&D"
    FINANCIER = "financier", "Financier & Investissement"
    COMMERCIAL = "commercial", "Commercial & Marché"
    ACADEMIQUE = "academique", "Académique & Recherche"
    INSTITUTIONNEL = "institutionnel", "Institutionnel & Public"
    AUTRE = "autre", "Autre"


class StatutPartenariat(models.TextChoices):
    EN_DISCUSSION = "en_discussion", "En discussion"
    SIGNE = "signe", "Signé"
    ACTIF = "actif", "Actif"
    CLOS = "clos", "Terminé / Clos"


class Partenariat(models.Model):
    """Partenariat formalisé ou en cours pour un projet incubé au CIAT."""

    projet = models.ForeignKey(
        Projet,
        on_delete=models.CASCADE,
        related_name="partenariats",
        help_text="Projet bénéficiaire du partenariat",
    )
    partenaire = models.CharField(
        max_length=200,
        help_text="Nom de l'organisation ou de l'entreprise partenaire",
    )
    type = models.CharField(
        max_length=30,
        choices=TypePartenariat.choices,
        default=TypePartenariat.TECHNIQUE,
    )
    date_debut = models.DateField(
        help_text="Date d'entrée en vigueur ou de début de collaboration"
    )
    statut = models.CharField(
        max_length=30,
        choices=StatutPartenariat.choices,
        default=StatutPartenariat.ACTIF,
    )
    description = models.TextField(
        blank=True,
        help_text="Modalités, apports attendus ou périmètre de l'accord",
    )
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_debut", "partenaire"]
        verbose_name = "Partenariat"
        verbose_name_plural = "Partenariats"

    def clean(self):
        super().clean()
        if self.projet_id:
            statuts_interdits = [Projet.Statut.IDEE, Projet.Statut.DEPOSE]
            if self.projet.statut in statuts_interdits:
                raise ValidationError(
                    f"Un projet au statut '{self.projet.get_statut_display()}' ne peut pas avoir de partenariat."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.partenaire} — {self.projet.titre} ({self.get_statut_display()})"


class StatutFinancement(models.TextChoices):
    EN_INSTRUCTION = "en_cours", "En cours d'instruction"
    ACCORDE = "accorde", "Accordé"
    DECAISSE = "decaisse", "Décaissé"
    REFUSE = "refuse", "Non retenu"


class Financement(models.Model):
    """Financement accordé, décaissé ou instruit pour un projet incubé au CIAT."""

    projet = models.ForeignKey(
        Projet,
        on_delete=models.CASCADE,
        related_name="financements",
        help_text="Projet bénéficiaire du financement",
    )
    source = models.CharField(
        max_length=200,
        help_text="Origine des fonds (ex : DER/FJ, 3FPT, FONGIP, CIAT, Donateur)",
    )
    montant = models.DecimalField(
        max_digits=14,
        decimal_places=0,
        help_text="Montant total en Francs CFA (FCFA)",
    )
    date = models.DateField(
        help_text="Date de signature, d'octroi ou de versement"
    )
    statut = models.CharField(
        max_length=30,
        choices=StatutFinancement.choices,
        default=StatutFinancement.ACCORDE,
    )
    description = models.TextField(
        blank=True,
        help_text="Objet du financement (matériel, prototypage, fonds de roulement, etc.)",
    )
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-montant"]
        verbose_name = "Financement"
        verbose_name_plural = "Financements"

    def clean(self):
        super().clean()
        if self.projet_id:
            statuts_interdits = [Projet.Statut.IDEE, Projet.Statut.DEPOSE]
            if self.projet.statut in statuts_interdits:
                raise ValidationError(
                    f"Un projet au statut '{self.projet.get_statut_display()}' ne peut pas avoir de financement."
                )
        if self.montant is not None and self.montant <= 0:
            raise ValidationError("Le montant du financement doit être supérieur à zéro.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.source} : {self.montant:,.0f} FCFA — {self.projet.titre} ({self.get_statut_display()})"
