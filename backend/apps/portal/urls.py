from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class PortalIndex(APIView):
    """Point d'entrée provisoire du module. À remplacer par les vraies routes."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"module": "portal", "status": "à implémenter"})


urlpatterns = [path("", PortalIndex.as_view(), name="portal-index")]
