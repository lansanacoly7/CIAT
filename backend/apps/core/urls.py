from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register("domaines", views.DomaineViewSet, basename="domaine")
router.register("cohortes", views.CohorteViewSet, basename="cohorte")
router.register("projets", views.ProjetViewSet, basename="projet")

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
