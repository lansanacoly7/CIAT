"""Modèles communs à toute la plateforme : utilisateurs, domaines, cohortes et projets."""
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

    def __str__(self):
        return self.get_full_name() or self.email

    @property
    def is_equipe(self):
        """Personnel du CIAT : peut voir tous les projets."""
        return self.role in (Role.ADMIN, Role.COORDONNATEUR)


class Domaine(models.Model):
    nom = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)

    class Meta:
        ordering = ["nom"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nom)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nom


class Cohorte(models.Model):
    nom = models.CharField(max_length=120, unique=True)
    annee = models.PositiveSmallIntegerField()
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-annee", "nom"]

    def __str__(self):
        return self.nom


class Projet(models.Model):
    """Projet porté par un porteur. Les modules incubateur, galerie, analyse et documents s'y rattachent."""

    class Statut(models.TextChoices):
        IDEE = "idee", "Idée"
        DEPOSE = "depose", "Dossier déposé"
        SELECTIONNE = "selectionne", "Sélectionné"
        INCUBE = "incube", "En incubation"
        PROTOTYPE = "prototype", "Prototype"
        TERMINE = "termine", "Incubation terminée"
        REJETE = "rejete", "Non retenu"

    titre = models.CharField(max_length=200)
    resume = models.TextField(blank=True)
    probleme = models.TextField(blank=True)
    solution = models.TextField(blank=True)
    domaine = models.ForeignKey(Domaine, on_delete=models.PROTECT, related_name="projets")
    cohorte = models.ForeignKey(
        Cohorte, on_delete=models.SET_NULL, null=True, blank=True, related_name="projets"
    )
    porteur = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="projets_portes"
    )
    statut = models.CharField(
        max_length=20, choices=Statut.choices, default=Statut.IDEE, db_index=True
    )
    cree_le = models.DateTimeField(auto_now_add=True, db_index=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-cree_le"]

    def __str__(self):
        return self.titre
