"""Routes de l'API documents (/api/documents/)."""
from django.urls import path

from apps.documents.views import (
    DocumentDetailView,
    DocumentListView,
    DocumentVersionDetailView,
    DocumentVersionsListView,
    GenererDocumentView,
    ModelesDocumentListView,
    TypesDocumentListView,
)

urlpatterns = [
    # Phase 1
    path("types/", TypesDocumentListView.as_view(), name="documents-types"),
    path("modeles/", ModelesDocumentListView.as_view(), name="documents-modeles"),
    path("generer/", GenererDocumentView.as_view(), name="documents-generer"),
    # Phase 2 — T1 (Consultation et versions)
    path("", DocumentListView.as_view(), name="documents-list"),
    path("<int:pk>/", DocumentDetailView.as_view(), name="documents-detail"),
    path("<int:pk>/versions/", DocumentVersionsListView.as_view(), name="documents-versions"),
    path("<int:pk>/versions/<int:numero>/", DocumentVersionDetailView.as_view(), name="documents-version-detail"),
]
