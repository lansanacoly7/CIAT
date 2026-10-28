from django.db import connection
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


class HealthView(APIView):
    """Vérifie que l'API et la base répondent. Sert à la supervision et au déploiement."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
        return Response({"status": "ok"})


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
        # Un projet retiré par son porteur n'apparaît plus dans son espace.
        return qs.filter(porteur=user).exclude(statut=Projet.Statut.RETIRE)

    def perform_create(self, serializer):
        serializer.save(porteur=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Suppression encadrée.

        - Porteur, projet au stade « idée » (brouillon) : suppression définitive.
        - Porteur, dossier déposé : retrait (suppression douce, trace conservée pour le comité).
        - Porteur, projet sélectionné / en incubation ou au-delà : refusé.
        - Admin / coordonnateur : suppression définitive.
        """
        projet = self.get_object()
        role = getattr(request.user, "role", None)

        if role == Role.PORTEUR:
            if projet.statut == Projet.Statut.IDEE:
                return super().destroy(request, *args, **kwargs)
            if projet.statut == Projet.Statut.DEPOSE:
                projet.statut = Projet.Statut.RETIRE
                projet.save(update_fields=["statut", "modifie_le"])
                return Response({"statut": projet.statut}, status=status.HTTP_200_OK)
            return Response(
                {"detail": "Ce projet ne peut plus être supprimé depuis votre espace. "
                           "Contactez l'équipe CIAT pour toute demande de clôture."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)
