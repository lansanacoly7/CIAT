"""URLs du module d'analyse décisionnelle (apps.analytics).

Points d'entrée de l'API /api/analytics/ :
- /api/analytics/indicateurs/
- /api/analytics/par-domaine/
- /api/analytics/par-cohorte/
- /api/analytics/par-genre/
- /api/analytics/evolution/
"""
from django.urls import path
from .views import (
    EvolutionView,
    ExportView,
    FinancementsListView,
    IndicateursView,
    ParCohorteView,
    ParDomaineView,
    ParGenreView,
    PartenariatsFinancementsStatsView,
    PartenariatsListView,
    QuestionView,
)

urlpatterns = [
    path("indicateurs/", IndicateursView.as_view(), name="analytics-indicateurs"),
    path("par-domaine/", ParDomaineView.as_view(), name="analytics-par-domaine"),
    path("par-cohorte/", ParCohorteView.as_view(), name="analytics-par-cohorte"),
    path("par-genre/", ParGenreView.as_view(), name="analytics-par-genre"),
    path("evolution/", EvolutionView.as_view(), name="analytics-evolution"),
    path("export/", ExportView.as_view(), name="analytics-export"),
    path("question/", QuestionView.as_view(), name="analytics-question"),
    path("partenariats/", PartenariatsListView.as_view(), name="analytics-partenariats"),
    path("financements/", FinancementsListView.as_view(), name="analytics-financements"),
    path(
        "partenariats-financements/stats/",
        PartenariatsFinancementsStatsView.as_view(),
        name="analytics-partenariats-financements-stats",
    ),
]


