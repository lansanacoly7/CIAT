"""Vues API pour le générateur de documents du CIAT (P5)."""
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.documents.models import ModeleDocument, TypeDocument
from apps.documents.serializers import (
    GenererDocumentInputSerializer,
    ModeleDocumentSerializer,
    TypeDocumentSerializer,
)
from apps.documents.services import (
    ReponseIAInvalide,
    ServiceIAIndisponible,
    ServiceIANonConfigure,
    generer_document,
)


class TypesDocumentListView(APIView):
    """Liste des types de documents disponibles (appel, convention, fiche, PV...)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        types = TypeDocument.objects.all().order_by("nom")
        serializer = TypeDocumentSerializer(types, many=True)
        return Response(serializer.data)


class ModelesDocumentListView(APIView):
    """Liste des modèles de documents, filtrable par type (?type=id_ou_code)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = ModeleDocument.objects.select_related("type").all().order_by("type", "nom")

        type_param = request.query_params.get("type")
        if type_param:
            if type_param.isdigit():
                queryset = queryset.filter(type_id=int(type_param))
            else:
                queryset = queryset.filter(type__code=type_param)

        serializer = ModeleDocumentSerializer(queryset, many=True)
        return Response(serializer.data)


class GenererDocumentView(APIView):
    """Génération assistée par IA d'un document structuré conforme à la charte CIAT."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "ai"

    def post(self, request):
        serializer = GenererDocumentInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        modele = serializer.validated_data["modele"]
        sujet = serializer.validated_data["sujet"]
        infos = serializer.validated_data.get("infos", {})
        projet = serializer.validated_data.get("projet")

        try:
            document_data = generer_document(
                modele=modele,
                sujet=sujet,
                auteur=request.user,
                infos=infos,
                projet=projet,
            )
            return Response(document_data, status=status.HTTP_201_CREATED)

        except ServiceIANonConfigure as exc:
            return Response(
                {
                    "detail": "Le service de génération IA n'est pas configuré (aucune clé d'API disponible).",
                    "erreur": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except ReponseIAInvalide as exc:
            return Response(
                {
                    "detail": "Le service IA a renvoyé une réponse invalide ou incomplète après nouvelle tentative.",
                    "erreur": str(exc),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        except ServiceIAIndisponible as exc:
            return Response(
                {
                    "detail": "Le service IA est temporairement indisponible. Veuillez réessayer plus tard.",
                    "erreur": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
