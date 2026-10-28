"""URLs du module d'analyse décisionnelle (apps.analytics).

Points d'entrée de l'API /api/analytics/ :
- /api/analytics/indicateurs/
- /api/analytics/par-domaine/
- /api/analytics/par-cohorte/
- /api/analytics/par-genre/
- /api/analytics/evolution/
- /api/analytics/export/?format=xlsx|pdf
- /api/analytics/question/
- /api/analytics/partenariats/
- /api/analytics/financements/
- /api/analytics/partenariats-financements/stats/
"""
from django.urls import path

from .views import (
    AnalyticsExportView,
    ConstatsView,
    EvolutionView,
    FinancementsListView,
    IndicateursDefinitionsView,
    IndicateursView,
    ParCohorteView,
    ParDomaineView,
    ParGenreView,
    PartenariatsFinancementsStatsView,
    PartenariatsListView,
    QuestionView,
)

urlpatterns = [
    path(
        "indicateurs/definitions/",
        IndicateursDefinitionsView.as_view(),
        name="analytics-indicateurs-definitions",
    ),
    path("indicateurs/", IndicateursView.as_view(), name="analytics-indicateurs"),
    path("constats/", ConstatsView.as_view(), name="analytics-constats"),
    path("par-domaine/", ParDomaineView.as_view(), name="analytics-par-domaine"),
    path("par-cohorte/", ParCohorteView.as_view(), name="analytics-par-cohorte"),
    path("par-genre/", ParGenreView.as_view(), name="analytics-par-genre"),
    path("evolution/", EvolutionView.as_view(), name="analytics-evolution"),
    path("export/", AnalyticsExportView.as_view(), name="analytics-export"),
    path("question/", QuestionView.as_view(), name="analytics-question"),
    path("partenariats/", PartenariatsListView.as_view(), name="analytics-partenariats"),
    path("financements/", FinancementsListView.as_view(), name="analytics-financements"),
    path(
        "partenariats-financements/stats/",
        PartenariatsFinancementsStatsView.as_view(),
        name="analytics-partenariats-financements-stats",
    ),
]
