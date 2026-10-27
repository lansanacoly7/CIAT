from django.db import connection
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Cohorte, Domaine, JournalAudit, Notification, Projet, Role, User
from .permissions import HasRole, IsEquipeCIAT, ReadOnlyOrRole
from .serializers import (
    CohorteSerializer, DomaineSerializer, JournalAuditSerializer,
    NotificationSerializer, ProjetSerializer, RegisterSerializer,
    UserRoleUpdateSerializer, UserSerializer,
)
from .services import tracer_changement_role
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


@extend_schema(
    summary="Journal d'audit des actions sensibles",
    description="Consultation en lecture seule du journal d'audit, filtrable par acteur, action et date.",
    responses={
        200: JournalAuditSerializer(many=True),
        403: OpenApiResponse(description="Accès réservé à l'équipe CIAT"),
    },
)
class JournalAuditListView(generics.ListAPIView):
    """GET /api/audit/ : Consultation du journal d'audit en lecture seule pour l'administrateur et le coordonnateur."""

    serializer_class = JournalAuditSerializer
    permission_classes = [IsAuthenticated, IsEquipeCIAT]
    queryset = JournalAudit.objects.none()

    def get_queryset(self):
        user = self.request.user
        if getattr(self, "swagger_fake_view", False) or not user or not user.is_authenticated:
            return JournalAudit.objects.none()
        qs = JournalAudit.objects.select_related("acteur").order_by("-date")
        acteur = self.request.query_params.get("acteur")
        if acteur:
            if acteur.isdigit():
                qs = qs.filter(acteur_id=int(acteur))
            else:
                qs = qs.filter(acteur__email__icontains=acteur)

        action = self.request.query_params.get("action")
        if action:
            qs = qs.filter(action=action)

        date_val = self.request.query_params.get("date")
        if date_val:
            qs = qs.filter(date__date=date_val)

        date_debut = self.request.query_params.get("date_debut")
        if date_debut:
            qs = qs.filter(date__date__gte=date_debut)

        date_fin = self.request.query_params.get("date_fin")
        if date_fin:
            qs = qs.filter(date__date__lte=date_fin)

        return qs


@extend_schema(
    summary="Liste des notifications de l'utilisateur",
    description="Renvoie les notifications de l'utilisateur connecté avec filtre optionnel ?non_lues=1.",
    responses={200: NotificationSerializer(many=True)},
)
class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ : Consultation des notifications internes de l'utilisateur connecté."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.none()

    def get_queryset(self):
        user = self.request.user
        if getattr(self, "swagger_fake_view", False) or not user or not user.is_authenticated:
            return Notification.objects.none()
        qs = Notification.objects.filter(destinataire=user).order_by("-date")
        non_lues = self.request.query_params.get("non_lues")
        if non_lues in ("1", "true", "True", True):
            qs = qs.filter(lue=False)
        return qs


@extend_schema(
    summary="Marquer une notification comme lue",
    description="Passe la notification spécifiée au statut lu pour l'utilisateur connecté.",
    request=None,
    responses={
        200: NotificationSerializer,
        404: OpenApiResponse(description="Notification introuvable"),
    },
)
class NotificationMarquerLueView(APIView):
    """POST /api/notifications/{id}/lue/ : Marquer une notification comme lue."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, destinataire=request.user)
        notification.lue = True
        notification.save(update_fields=["lue"])
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Marquer toutes les notifications comme lues",
    description="Marque l'intégralité des notifications non lues de l'utilisateur connecté comme lues.",
    request=None,
    responses={200: OpenApiResponse(description="Notifications marquées comme lues")},
)
class NotificationToutLireView(APIView):
    """POST /api/notifications/tout-lire/ : Marquer toutes les notifications comme lues."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        nb = Notification.objects.filter(destinataire=request.user, lue=False).update(lue=True)
        return Response(
            {"detail": "Toutes vos notifications sont marquées comme lues.", "modifiees": nb},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    summary="Modifier le rôle d'un utilisateur (Administrateur)",
    description="Permet à un administrateur de modifier le rôle d'un utilisateur.",
    request=UserRoleUpdateSerializer,
    responses={
        200: UserSerializer,
        403: OpenApiResponse(description="Accès réservé aux administrateurs"),
    },
)
class UserRoleUpdateView(APIView):
    """PATCH /api/users/{id}/role/ : Modification du rôle d'un utilisateur par un administrateur."""

    permission_classes = [IsAuthenticated, HasRole(Role.ADMIN)]

    def patch(self, request, pk):
        user_cible = get_object_or_404(User, pk=pk)
        serializer = UserRoleUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role_avant = user_cible.role
        role_apres = serializer.validated_data["role"]
        user_cible.role = role_apres
        user_cible.save(update_fields=["role"])
        tracer_changement_role(request.user, user_cible, role_avant, role_apres)
        return Response(UserSerializer(user_cible).data, status=status.HTTP_200_OK)
