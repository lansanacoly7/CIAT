"""Configuration des routes pour apps.portal."""
from rest_framework.routers import DefaultRouter

from .views import ActualiteViewSet, AppelProjetViewSet, EvenementViewSet

router = DefaultRouter()
router.register(r"actualites", ActualiteViewSet, basename="actualite")
router.register(r"evenements", EvenementViewSet, basename="evenement")
router.register(r"appels", AppelProjetViewSet, basename="appel")

urlpatterns = router.urls
