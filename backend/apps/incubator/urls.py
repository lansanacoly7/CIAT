"""Routes d'API pour le module P2 - Gestion de l'incubateur."""
from django.urls import path

from .views import (
    AlerteJalonListView,
    DossierDecisionView,
    DossierDetailView,
    DossierEvaluationListCreateView,
    DossierListCreateView,
    DossierSoumettreView,
    GrilleActuelleView,
    JalonCommentaireCreateView,
    JalonDetailView,
    JalonPreuveCreateView,
    MentorListView,
    ObjectifDetailView,
    PieceCreateView,
    PieceDeleteView,
    ProjetJalonListCreateView,
    ProjetMentorView,
    ProjetObjectifListCreateView,
)

app_name = "incubator"

urlpatterns = [
    # Mentors et affectation
    path("mentors/", MentorListView.as_view(), name="mentor-list"),
    path("projets/<int:pk>/mentor/", ProjetMentorView.as_view(), name="projet-mentor"),
    path("projets/<int:pk>/objectifs/", ProjetObjectifListCreateView.as_view(), name="projet-objectifs"),
    path("objectifs/<int:pk>/", ObjectifDetailView.as_view(), name="objectif-detail"),
    # Jalons, preuves, commentaires et alertes de retard
    path("projets/<int:pk>/jalons/", ProjetJalonListCreateView.as_view(), name="projet-jalons"),
    path("jalons/<int:pk>/", JalonDetailView.as_view(), name="jalon-detail"),
    path("jalons/<int:pk>/preuves/", JalonPreuveCreateView.as_view(), name="jalon-preuves"),
    path("jalons/<int:pk>/commentaires/", JalonCommentaireCreateView.as_view(), name="jalon-commentaires"),
    path("alertes/", AlerteJalonListView.as_view(), name="alertes-retard"),

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
