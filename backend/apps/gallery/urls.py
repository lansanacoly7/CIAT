"""Routes d'API pour le module Galerie des innovations (P6)."""
from django.urls import path

from .views import (
    FicheDetailView,
    FicheListCreateView,
    FichePDFView,
    FicheQRCodeView,
    FicheRefuserView,
    FicheSoumettreView,
    FicheValiderView,
    StatistiquesGalleryView,
)

urlpatterns = [
    path("fiches/", FicheListCreateView.as_view(), name="gallery-fiches"),
    path("fiches/<int:pk>/soumettre/", FicheSoumettreView.as_view(), name="gallery-fiche-soumettre"),
    path("fiches/<int:pk>/valider/", FicheValiderView.as_view(), name="gallery-fiche-valider"),
    path("fiches/<int:pk>/refuser/", FicheRefuserView.as_view(), name="gallery-fiche-refuser"),
    path("fiches/<slug:slug>/", FicheDetailView.as_view(), name="gallery-fiche-detail"),
    path("fiches/<slug:slug>/qr/", FicheQRCodeView.as_view(), name="gallery-fiche-qr"),
    path("fiches/<slug:slug>/fiche/", FichePDFView.as_view(), name="gallery-fiche-pdf"),
    path("statistiques/", StatistiquesGalleryView.as_view(), name="gallery-statistiques"),
]
