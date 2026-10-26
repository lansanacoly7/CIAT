from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    # Un préfixe par module : chaque développeur ajoute ses routes dans apps/<module>/urls.py
    path("api/", include("apps.core.urls")),
    path("api/documents/", include("apps.documents.urls")),
    path("api/incubator/", include("apps.incubator.urls")),
    path("api/portal/", include("apps.portal.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/assistant/", include("apps.assistant.urls")),
    path("api/gallery/", include("apps.gallery.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
