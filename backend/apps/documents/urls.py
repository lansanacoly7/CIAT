"""Routes de l'API documents (/api/documents/)."""
from django.urls import path

from apps.documents.views import (
    DocumentBrouillonView,
    DocumentDetailView,
    DocumentExportView,
    DocumentListView,
    DocumentPublierView,
    DocumentValiderView,
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
    # Phase 2 — T2 (Workflow de validation)
    path("<int:pk>/valider/", DocumentValiderView.as_view(), name="documents-valider"),
    path("<int:pk>/publier/", DocumentPublierView.as_view(), name="documents-publier"),
    path("<int:pk>/brouillon/", DocumentBrouillonView.as_view(), name="documents-brouillon"),
    # Phase 2 — T3 (Export Word et PDF)
    path("<int:pk>/export/", DocumentExportView.as_view(), name="documents-export"),
]
