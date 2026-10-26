from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ActualiteViewSet,
    AppelProjetViewSet,
    DocumentPublicViewSet,
    EvenementCalendrierICSView,
    EvenementViewSet,
    MessageContactViewSet,
    PartenaireViewSet,
    ProjetIncubeViewSet,
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

urlpatterns = [
    path("evenements/calendrier.ics", EvenementCalendrierICSView.as_view(), name="evenements-calendrier-ics"),
    path("statistiques/", StatistiquesPortailView.as_view(), name="portal-statistiques"),
] + router.urls
