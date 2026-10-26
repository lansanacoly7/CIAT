from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class IncubatorIndex(APIView):
    """Point d'entrée provisoire du module. À remplacer par les vraies routes."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"module": "incubator", "status": "à implémenter"})


urlpatterns = [path("", IncubatorIndex.as_view(), name="incubator-index")]
