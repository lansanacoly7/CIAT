from django.db import connection
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Cohorte, Domaine, Projet, Role
from .permissions import ReadOnlyOrRole
from .serializers import (
    CohorteSerializer, DomaineSerializer, ProjetSerializer,
    RegisterSerializer, UserSerializer,
)
from .throttling import AuthRateThrottle


@extend_schema(
    summary="État de santé de l'API et de la base de données",
    description="Route publique sans authentification ni donnée sensible renvoyant l'état de fonctionnement de l'API et de la connexion à la base de données.",
    responses={
        200: OpenApiResponse(
            description="L'API et la base de données sont opérationnelles.",
            response={
                "type": "object",
                "properties": {
                    "status": {"type": "string", "example": "ok"},
                    "database": {"type": "string", "example": "connected"},
                },
            },
        ),
        503: OpenApiResponse(
            description="La base de données ne répond pas ou est dégradée.",
            response={
                "type": "object",
                "properties": {
                    "status": {"type": "string", "example": "degraded"},
                    "database": {"type": "string", "example": "disconnected"},
                },
            },
        ),
    },
)
class HealthView(APIView):
    """Vérifie que l'API et la base répondent. Sert à la supervision et au déploiement."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            with connection.cursor() as cur:
                cur.execute("SELECT 1")
            return Response(
                {"status": "ok", "database": "connected"},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"status": "degraded", "database": "disconnected"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class CiatTokenObtainPairView(TokenObtainPairView):
    """Obtention du JWT protégé par limitation de débit anti force-brute."""

    throttle_classes = [AuthRateThrottle]


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]


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


from rest_framework.permissions import AllowAny, IsAuthenticated

class ProjetViewSet(viewsets.ModelViewSet):
    """Un porteur voit et modifie ses projets. L'équipe CIAT, le comité et les mentors les voient tous."""

    serializer_class = ProjetSerializer
    permission_classes = [
        IsAuthenticated,
        ReadOnlyOrRole(Role.PORTEUR, Role.ADMIN, Role.COORDONNATEUR),
    ]
    filterset_fields = ["domaine", "cohorte", "statut"]
    search_fields = ["titre", "resume"]
    ordering_fields = ["cree_le", "titre"]

    def get_queryset(self):
        qs = Projet.objects.select_related("domaine", "cohorte", "porteur")
        user = self.request.user
        if not user or not user.is_authenticated:
            return Projet.objects.none()
        role = getattr(user, "role", None)
        if role in (Role.ADMIN, Role.COORDONNATEUR, Role.COMITE):
            return qs
        if role == Role.MENTOR:
            return qs.filter(affectation_mentor__mentor=user)
        return qs.filter(porteur=user)

    def perform_create(self, serializer):
        serializer.save(porteur=self.request.user)
