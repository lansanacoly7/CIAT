from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AbonnementLettreAbonnerView,
    AbonnementLettreAdminViewSet,
    AbonnementLettreConfirmerView,
    AbonnementLettreDesabonnerView,
    ActualiteViewSet,
    AppelProjetViewSet,
    ChiffresClesView,
    DocumentPublicViewSet,
    EvenementCalendrierICSView,
    EvenementViewSet,
    MessageContactViewSet,
    PartenaireViewSet,
    ProjetIncubeViewSet,
    RechercheGlobaleView,
    StatistiquesPortailView,
)

router = DefaultRouter()
# T1
router.register(r"actualites", ActualiteViewSet, basename="actualite")
router.register(r"evenements", EvenementViewSet, basename="evenement")
router.register(r"appels", AppelProjetViewSet, basename="appel")

# T2
router.register(r"partenaires", PartenaireViewSet, basename="partenaire")
router.register(r"documents", DocumentPublicViewSet, basename="document")
router.register(r"contact", MessageContactViewSet, basename="contact")

# T3
router.register(r"projets-incubes", ProjetIncubeViewSet, basename="projet-incube")

# Phase 9 — T1 : Administration des abonnements à la lettre d'information
router.register(r"lettre/abonnements", AbonnementLettreAdminViewSet, basename="portal-lettre-abonnements")

urlpatterns = [
    # Calendrier et statistiques existants
    path("evenements/calendrier.ics", EvenementCalendrierICSView.as_view(), name="evenements-calendrier-ics"),
    path("statistiques/", StatistiquesPortailView.as_view(), name="portal-statistiques"),

    # Phase 9 — T1 : Lettre d'information avec double opt-in
    path("lettre/abonner/", AbonnementLettreAbonnerView.as_view(), name="portal-lettre-abonner"),
    path("lettre/confirmer/", AbonnementLettreConfirmerView.as_view(), name="portal-lettre-confirmer"),
    path("lettre/desabonner/", AbonnementLettreDesabonnerView.as_view(), name="portal-lettre-desabonner"),

    # Phase 9 — T2 : Recherche globale des contenus publics
    path("recherche/", RechercheGlobaleView.as_view(), name="portal-recherche"),

    # Phase 9 — T3 : Chiffres clés réels calculés depuis la base
    path("chiffres-cles/", ChiffresClesView.as_view(), name="portal-chiffres-cles"),
] + router.urls
