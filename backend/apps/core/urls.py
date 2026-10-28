from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register("domaines", views.DomaineViewSet, basename="domaine")
router.register("cohortes", views.CohorteViewSet, basename="cohorte")
router.register("projets", views.ProjetViewSet, basename="projet")

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/token/", views.CiatTokenObtainPairView.as_view(), name="token"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/mot-de-passe/oublie/", views.MotDePasseOublieView.as_view(), name="mot-de-passe-oublie"),
    path("auth/mot-de-passe/reinitialiser/", views.MotDePasseReinitialiserView.as_view(), name="mot-de-passe-reinitialiser"),
    path("auth/me/export/", views.MeExportView.as_view(), name="me-export"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("audit/", views.JournalAuditListView.as_view(), name="audit-list"),
    path("notifications/", views.NotificationListView.as_view(), name="notification-list"),
    path("notifications/<int:pk>/lue/", views.NotificationMarquerLueView.as_view(), name="notification-marquer-lue"),
    path("notifications/tout-lire/", views.NotificationToutLireView.as_view(), name="notification-tout-lire"),
    path("users/<int:pk>/role/", views.UserRoleUpdateView.as_view(), name="user-role-update"),
    path("", include(router.urls)),
]
