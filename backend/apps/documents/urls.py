from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class DocumentsIndex(APIView):
    """Point d'entrée provisoire du module. À remplacer par les vraies routes."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"module": "documents", "status": "à implémenter"})


urlpatterns = [path("", DocumentsIndex.as_view(), name="documents-index")]
