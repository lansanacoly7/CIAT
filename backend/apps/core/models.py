"""Modèles communs à toute la plateforme : utilisateurs, domaines, cohortes et projets."""
from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.text import slugify


class Role(models.TextChoices):
    ADMIN = "administrateur", "Administrateur"
    COORDONNATEUR = "coordonnateur", "Coordonnateur"
    MENTOR = "mentor", "Mentor"
    COMITE = "membre_comite", "Membre du comité"
    PORTEUR = "porteur", "Porteur de projet"
    VISITEUR = "visiteur", "Visiteur"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create(self, email, password, **extra):
        if not email:
            raise ValueError("L'email est obligatoire.")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", Role.ADMIN)
        return self._create(email, password, **extra)


class User(AbstractUser):
    """Utilisateur identifié par son email. Le rôle détermine ses droits dans toute la plateforme."""

    class Genre(models.TextChoices):
        FEMME = "F", "Femme"
        HOMME = "H", "Homme"
        AUTRE = "A", "Autre / non précisé"

    username = None
    email = models.EmailField("email", unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PORTEUR)
    telephone = models.CharField(max_length=30, blank=True)
    genre = models.CharField(max_length=1, choices=Genre.choices, blank=True)
    organisation = models.CharField(max_length=150, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    class Meta:
        ordering = ["last_name", "first_name"]
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(role__in=[c[0] for c in Role.choices]),
                name="check_user_role_valide",
            ),
            models.CheckConstraint(
                condition=models.Q(genre__in=["", "F", "H", "A"]),
                name="check_user_genre_valide",
            ),
        ]

    def __str__(self):
        return self.get_full_name() or self.email

    @property
    def is_equipe(self):
        """Personnel du CIAT : peut voir tous les projets."""
        return self.role in (Role.ADMIN, Role.COORDONNATEUR)


class Domaine(models.Model):
    nom = models.CharField(max_length=120, unique=True, verbose_name="Nom du domaine")
    slug = models.SlugField(max_length=140, unique=True, blank=True)

    class Meta:
        ordering = ["nom"]
        verbose_name = "Domaine d'intervention"
        verbose_name_plural = "Domaines d'intervention"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nom)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nom


class Cohorte(models.Model):
    nom = models.CharField(max_length=120, unique=True, verbose_name="Nom de la cohorte")
    annee = models.PositiveSmallIntegerField(verbose_name="Année")
    date_debut = models.DateField(null=True, blank=True, verbose_name="Date de début")
    date_fin = models.DateField(null=True, blank=True, verbose_name="Date de fin")

    class Meta:
        ordering = ["-annee", "nom"]
        verbose_name = "Cohorte d'incubation"
        verbose_name_plural = "Cohortes d'incubation"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(date_debut__isnull=True)
                | models.Q(date_fin__isnull=True)
                | models.Q(date_debut__lte=models.F("date_fin")),
                name="check_cohorte_dates_coherentes",
            ),
        ]

    def __str__(self):
        return self.nom


class StatutProjet(models.TextChoices):
    IDEE = "idee", "Idée"
    DEPOSE = "depose", "Dossier déposé"
    SELECTIONNE = "selectionne", "Sélectionné"
    INCUBE = "incube", "En incubation"
    PROTOTYPE = "prototype", "Prototype"
    TERMINE = "termine", "Incubation terminée"
    REJETE = "rejete", "Non retenu"
    RETIRE = "retire", "Candidature retirée"


class Projet(models.Model):
    """Projet porté par un porteur. Les modules incubateur, galerie, analyse et documents s'y rattachent."""

    Statut = StatutProjet

    titre = models.CharField(max_length=200, verbose_name="Titre du projet")
    resume = models.TextField(blank=True, verbose_name="Résumé")
    probleme = models.TextField(blank=True, verbose_name="Problème adressé")
    solution = models.TextField(blank=True, verbose_name="Solution innovante")
    domaine = models.ForeignKey(
        Domaine, on_delete=models.PROTECT, related_name="projets", verbose_name="Domaine"
    )
    cohorte = models.ForeignKey(
        Cohorte,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projets",
        verbose_name="Cohorte",
    )
    porteur = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="projets_portes", verbose_name="Porteur de projet"
    )
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.IDEE,
        db_index=True,
        verbose_name="Statut du projet",
    )
    vues = models.PositiveIntegerField(
        default=0,
        verbose_name="Nombre de consultations",
        help_text="Nombre de consultations de la fiche projet.",
    )
    cree_le = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Date de création")
    modifie_le = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")

    class Meta:
        ordering = ["-cree_le"]
        verbose_name = "Projet"
        verbose_name_plural = "Projets"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(statut__in=[c[0] for c in StatutProjet.choices]),
                name="check_projet_statut_valide",
            ),
        ]
        indexes = [
            models.Index(fields=["domaine", "statut"], name="idx_projet_domaine_statut"),
            models.Index(fields=["cohorte", "statut"], name="idx_projet_cohorte_statut"),
        ]


    def __str__(self):
        return self.titre

    def save(self, *args, **kwargs):
        if not self.cohorte_id:
            derniere = Cohorte.objects.order_by("-annee").first()
            if derniere:
                self.cohorte = derniere
        super().save(*args, **kwargs)


class JournalAudit(models.Model):
    """Journal d'audit des actions sensibles pour la traçabilité des décisions."""

    acteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="actions_audit",
    )
    action = models.CharField(max_length=100, db_index=True)
    objet = models.CharField(max_length=255)
    avant = models.JSONField(default=dict, blank=True)
    apres = models.JSONField(default=dict, blank=True)
    date = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Entrée du journal d'audit"
        verbose_name_plural = "Journal d'audit"

    def __str__(self):
        acteur_str = self.acteur.email if self.acteur else "Système"
        return f"[{self.date:%Y-%m-%d %H:%M}] {acteur_str} - {self.action} - {self.objet}"

    @property
    def objet_concerne(self):
        return self.objet

    @property
    def cree_le(self):
        return self.date


class Notification(models.Model):
    """Notification interne visible dans la plateforme pour un utilisateur."""

    class Type(models.TextChoices):
        DECISION_DOSSIER = "decision_dossier", "Décision sur le dossier"
        JALON_RETARD = "jalon_retard", "Jalon en retard"
        DOCUMENT_VALIDE = "document_valide", "Document validé"
        DOCUMENT_PUBLIE = "document_publie", "Document publié"
        FICHE_VALIDEE = "fiche_validee", "Fiche validée"
        FICHE_REFUSEE = "fiche_refusee", "Fiche refusée"
        MENTOR_AFFECTE = "mentor_affecte", "Nouveau mentor affecté"
        AUTRE = "autre", "Autre notification"

    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(
        max_length=50,
        choices=Type.choices,
        default=Type.AUTRE,
        db_index=True,
    )
    message = models.CharField(max_length=255)
    lien = models.CharField(max_length=255, blank=True)
    lue = models.BooleanField(default=False, db_index=True)
    date = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        statut_str = "Lue" if self.lue else "Non lue"
        return f"[{statut_str}] {self.destinataire.email}: {self.message}"

    @property
    def cree_le(self):
        return self.date
