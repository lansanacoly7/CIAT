from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class AssistantIndex(APIView):
    """Point d'entrée provisoire du module. À remplacer par les vraies routes."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"module": "assistant", "status": "à implémenter"})


urlpatterns = [path("", AssistantIndex.as_view(), name="assistant-index")]
