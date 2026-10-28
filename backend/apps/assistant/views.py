"""Vues API pour l'assistant IA du CIAT (P4)."""
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.models import Role

from .models import Conversation
from .serializers import (
    ConversationSerializer,
    CreerMessageInputSerializer,
    MessageAssistantSerializer,
)
from .services import (
    ReponseIAInvalide,
    ServiceIAIndisponible,
    ServiceIANonConfigure,
    indexer_documents_publics,
    traiter_message_assistant,
)


@extend_schema_view(
    get=extend_schema(
        summary="Lister mes conversations avec l'assistant",
        responses={200: ConversationSerializer(many=True)},
    ),
    post=extend_schema(
        summary="Créer une nouvelle conversation",
        request=ConversationSerializer,
        responses={201: ConversationSerializer},
    ),
)
class ConversationListCreateView(APIView):
    """Gestion des conversations privées de l'utilisateur avec l'assistant IA."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(utilisateur=request.user).order_by("-modifie_le")
        serializer = ConversationSerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ConversationSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save(utilisateur=request.user)
        return Response(ConversationSerializer(conversation).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(
        summary="Lister les messages d'une conversation",
        responses={200: MessageAssistantSerializer(many=True)},
    ),
    post=extend_schema(
        summary="Envoyer un message et obtenir la réponse de l'assistant",
        request=CreerMessageInputSerializer,
        responses={
            201: MessageAssistantSerializer,
            400: dict,
            503: dict,
        },
    ),
)
class MessageListCreateView(APIView):
    """Lecture de l'historique et soumission d'une question à l'assistant IA."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "ai"

    def get_conversation(self, pk, user):
        return get_object_or_404(Conversation, pk=pk, utilisateur=user)

    def get(self, request, pk):
        conversation = self.get_conversation(pk, request.user)
        messages = conversation.messages.all().order_by("cree_le")
        serializer = MessageAssistantSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        conversation = self.get_conversation(pk, request.user)
        serializer = CreerMessageInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        contenu = serializer.validated_data["contenu"]
        mode = serializer.validated_data.get("mode", "documents")

        try:
            message_assistant = traiter_message_assistant(
                conversation=conversation,
                contenu_utilisateur=contenu,
                mode=mode,
            )
            return Response(
                MessageAssistantSerializer(message_assistant).data,
                status=status.HTTP_201_CREATED,
            )
        except ServiceIANonConfigure as exc:
            return Response(
                {
                    "detail": "Le service d'assistance IA n'est pas configuré (aucune clé d'API disponible).",
                    "erreur": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except ReponseIAInvalide as exc:
            return Response(
                {
                    "detail": "Le modèle IA a renvoyé une réponse invalide après nouvelle tentative.",
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
        except Exception as exc:
            return Response(
                {
                    "detail": "Une erreur inattendue est survenue lors du traitement du message par le service IA.",
                    "erreur": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


@extend_schema(
    summary="Réindexer les documents publics du portail pour l'assistant",
    request=None,
    responses={
        200: dict,
        403: dict,
    },
)
class IndexationView(APIView):
    """Endpoint administratif permettant de découper et indexer les documents publics."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        is_admin = (
            getattr(request.user, "role", None) == Role.ADMIN
            or request.user.is_staff
            or request.user.is_superuser
        )
        if not is_admin:
            return Response(
                {"detail": "Action réservée aux administrateurs de la plateforme."},
                status=status.HTTP_403_FORBIDDEN,
            )

        resultat = indexer_documents_publics()
        return Response(
            {
                "detail": "Indexation des documents publics terminée avec succès.",
                **resultat,
            },
            status=status.HTTP_200_OK,
        )
