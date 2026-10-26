"""Routes de l'API documents (/api/documents/)."""
from django.urls import path
from apps.documents.views import (
    GenererDocumentView,
    ModelesDocumentListView,
    TypesDocumentListView,
)

urlpatterns = [
    path("types/", TypesDocumentListView.as_view(), name="documents-types"),
    path("modeles/", ModelesDocumentListView.as_view(), name="documents-modeles"),
    path("generer/", GenererDocumentView.as_view(), name="documents-generer"),
]
