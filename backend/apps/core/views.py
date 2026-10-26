from django.db import connection
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cohorte, Domaine, Projet, Role
from .permissions import ReadOnlyOrRole
from .serializers import (
    CohorteSerializer, DomaineSerializer, ProjetSerializer,
    RegisterSerializer, UserSerializer,
)


class HealthView(APIView):
    """Vérifie que l'API et la base répondent. Sert à la supervision et au déploiement."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
        return Response({"status": "ok"})


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class DomaineViewSet(viewsets.ModelViewSet):
    queryset = Domaine.objects.all()
    serializer_class = DomaineSerializer
    permission_classes = [ReadOnlyOrRole(Role.ADMIN, Role.COORDONNATEUR)]
    pagination_class = None


class CohorteViewSet(viewsets.ModelViewSet):
    queryset = Cohorte.objects.all()
    serializer_class = CohorteSerializer
    permission_classes = [ReadOnlyOrRole(Role.ADMIN, Role.COORDONNATEUR)]
    pagination_class = None


class ProjetViewSet(viewsets.ModelViewSet):
    """Un porteur voit et modifie ses projets. L'équipe CIAT, le comité et les mentors les voient tous."""

    serializer_class = ProjetSerializer
    filterset_fields = ["domaine", "cohorte", "statut"]
    search_fields = ["titre", "resume"]
    ordering_fields = ["cree_le", "titre"]

    def get_queryset(self):
        qs = Projet.objects.select_related("domaine", "cohorte", "porteur")
        user = self.request.user
        if user.role in (Role.ADMIN, Role.COORDONNATEUR, Role.COMITE, Role.MENTOR):
            return qs
        return qs.filter(porteur=user)

    def perform_create(self, serializer):
        serializer.save(porteur=self.request.user)
