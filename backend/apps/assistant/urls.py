"""Routes d'API pour le module Assistant (P4)."""
from django.urls import path

from .views import ConversationListCreateView, IndexationView, MessageListCreateView

urlpatterns = [
    path("conversations/", ConversationListCreateView.as_view(), name="assistant-conversations"),
    path("conversations/<int:pk>/messages/", MessageListCreateView.as_view(), name="assistant-messages"),
    path("indexation/", IndexationView.as_view(), name="assistant-indexation"),
]
