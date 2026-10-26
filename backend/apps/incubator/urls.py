"""Routes d'API pour le module P2 - Gestion de l'incubateur."""
from django.urls import path

from .views import (
    DossierDecisionView,
    DossierDetailView,
    DossierEvaluationListCreateView,
    DossierListCreateView,
    DossierSoumettreView,
    GrilleActuelleView,
    PieceCreateView,
    PieceDeleteView,
)

app_name = "incubator"

urlpatterns = [
    # Dossiers de candidature
    path("dossiers/", DossierListCreateView.as_view(), name="dossier-list-create"),
    path("dossiers/<int:pk>/", DossierDetailView.as_view(), name="dossier-detail"),
    path(
        "dossiers/<int:pk>/pieces/",
        PieceCreateView.as_view(),
        name="dossier-piece-create",
    ),
    path(
        "dossiers/<int:pk>/pieces/<int:piece_id>/",
        PieceDeleteView.as_view(),
        name="dossier-piece-delete",
    ),
    path(
        "dossiers/<int:pk>/soumettre/",
        DossierSoumettreView.as_view(),
        name="dossier-soumettre",
    ),
    # Grille d'évaluation
    path("grilles/actuelle/", GrilleActuelleView.as_view(), name="grille-actuelle"),
    # Évaluations du comité
    path(
        "dossiers/<int:pk>/evaluations/",
        DossierEvaluationListCreateView.as_view(),
        name="dossier-evaluations",
    ),
    # Décision motivée
    path(
        "dossiers/<int:pk>/decision/",
        DossierDecisionView.as_view(),
        name="dossier-decision",
    ),
]
