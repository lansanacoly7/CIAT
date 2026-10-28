"""Vues API pour le générateur de documents du CIAT (P5) — Phases 1 et 2 (T1, T2, T3)."""
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.models import Role
from apps.core.permissions import HasRole, IsEquipeCIAT
from apps.core.services import tracer_publication_document, tracer_validation_document
from apps.documents.exports import generer_export_docx, generer_export_pdf
from apps.documents.models import Document, ModeleDocument, TypeDocument, VersionDocument
from apps.documents.serializers import (
    DocumentDetailSerializer,
    DocumentListSerializer,
    DocumentPatchSerializer,
    GenererDocumentInputSerializer,
    ModeleDocumentSerializer,
    TypeDocumentSerializer,
    VersionDocumentSerializer,
)
from apps.documents.services import (
    ReponseIAInvalide,
    ServiceIAIndisponible,
    ServiceIANonConfigure,
    generer_document,
)

# ==============================================================================
# Phase 1 — Types, Modèles et Moteur IA (Conservés intacts)
# ==============================================================================

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

        except Exception as exc:
            return Response(
                {
                    "detail": "Une erreur inattendue est survenue lors de la génération du document.",
                    "erreur": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


# ==============================================================================
# Phase 2 — T1 : Consultation, Modification et Gestion des versions
# ==============================================================================

def _verifier_acces_document(user, document):
    """Vérifie si l'utilisateur a le droit d'accéder à ce document."""
    if getattr(user, "is_equipe", False):
        return True
    if document.auteur_id == user.id:
        return True
    raise PermissionDenied("Vous n'avez pas l'autorisation d'accéder à ce document.")


class DocumentListView(APIView):
    """GET /api/documents/ : Liste mes documents (l'équipe CIAT voit tous les documents)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "is_equipe", False):
            queryset = (
                Document.objects.all()
                .select_related("modele", "projet", "auteur")
                .prefetch_related("versions")
            )
        else:
            queryset = (
                Document.objects.filter(auteur=request.user)
                .select_related("modele", "projet", "auteur")
                .prefetch_related("versions")
            )
        serializer = DocumentListSerializer(queryset, many=True)
        return Response(serializer.data)


class DocumentDetailView(APIView):
    """GET /api/documents/{id}/ : Détail avec sections de la version courante.

    PATCH /api/documents/{id}/ : Crée une nouvelle version avec les sections modifiées.
    """

    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        doc = get_object_or_404(
            Document.objects.select_related("modele", "projet", "auteur"), pk=pk
        )
        _verifier_acces_document(request.user, doc)
        return doc

    def get(self, request, pk):
        doc = self.get_object(request, pk)
        serializer = DocumentDetailSerializer(doc)
        return Response(serializer.data)

    def patch(self, request, pk):
        doc = self.get_object(request, pk)

        # Règle métier : modification uniquement autorisée au statut brouillon
        if doc.statut != Document.Statut.BROUILLON:
            return Response(
                {
                    "detail": f"Impossible de modifier un document au statut '{doc.statut}'. Seul un brouillon peut être modifié."
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = DocumentPatchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        sections_payload = serializer.validated_data["sections"]

        # Validation des codes de section par rapport au gabarit du modèle
        codes_autorises = {s.get("code") for s in doc.modele.sections if s.get("code")}
        titres_par_code = {s.get("code"): s.get("titre", "") for s in doc.modele.sections if s.get("code")}

        for sec in sections_payload:
            code = sec.get("code")
            if not code or code not in codes_autorises:
                return Response(
                    {
                        "detail": f"Code de section inconnu : '{code}'. Codes autorisés pour ce modèle : {', '.join(sorted(codes_autorises))}."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Récupération des sections de la dernière version pour mise à jour différentielle
        derniere_version = doc.derniere_version
        sections_existantes = derniere_version.sections if derniere_version else []
        map_contenus = {s.get("code"): s.get("contenu", "") for s in sections_existantes}

        # Application des modifications envoyées
        for sec in sections_payload:
            map_contenus[sec["code"]] = sec.get("contenu", "")

        # Reconstruction de la liste ordonnée selon le modèle
        nouvelles_sections = []
        for s in doc.modele.sections:
            code = s.get("code")
            nouvelles_sections.append(
                {
                    "code": code,
                    "titre": s.get("titre", titres_par_code.get(code, "")),
                    "contenu": map_contenus.get(code, ""),
                }
            )

        # Création de la nouvelle version (numéro incrémenté)
        nouveau_numero = (derniere_version.numero if derniere_version else 0) + 1
        VersionDocument.objects.create(
            document=doc,
            numero=nouveau_numero,
            sections=nouvelles_sections,
            auteur=request.user,
        )

        doc.save(update_fields=["modifie_le"])
        doc.refresh_from_db()

        return Response(DocumentDetailSerializer(doc).data, status=status.HTTP_200_OK)


class DocumentVersionsListView(APIView):
    """GET /api/documents/{id}/versions/ : Historique des versions d'un document."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        _verifier_acces_document(request.user, doc)
        versions = doc.versions.all().order_by("-numero")
        serializer = VersionDocumentSerializer(versions, many=True)
        return Response(serializer.data)


class DocumentVersionDetailView(APIView):
    """GET /api/documents/{id}/versions/{numero}/ : Détail d'une version spécifique."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, numero):
        doc = get_object_or_404(Document, pk=pk)
        _verifier_acces_document(request.user, doc)
        version = doc.versions.filter(numero=numero).first()
        if not version:
            return Response(
                {"detail": f"La version {numero} du document #{pk} n'existe pas."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = VersionDocumentSerializer(version)
        return Response(serializer.data)


# ==============================================================================
# Phase 2 — T2 : Workflow de validation et droits
# ==============================================================================

class DocumentValiderView(APIView):
    """POST /api/documents/{id}/valider/ : Coordonnateur ou Administrateur.

    Passe un document de 'brouillon' à 'valide'.
    """

    permission_classes = [IsAuthenticated, IsEquipeCIAT]

    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        if doc.statut != Document.Statut.BROUILLON:
            return Response(
                {
                    "detail": f"Impossible de valider un document au statut '{doc.statut}'. Seul un brouillon peut être validé."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        doc.statut = Document.Statut.VALIDE
        doc.save(update_fields=["statut", "modifie_le"])
        tracer_validation_document(request.user, doc)
        return Response(DocumentDetailSerializer(doc).data, status=status.HTTP_200_OK)


class DocumentPublierView(APIView):
    """POST /api/documents/{id}/publier/ : Administrateur uniquement.

    Passe un document de 'valide' à 'publie'.
    """

    permission_classes = [IsAuthenticated, HasRole(Role.ADMIN)]

    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        if doc.statut == Document.Statut.PUBLIE:
            return Response(
                {"detail": "Ce document est déjà publié."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if doc.statut != Document.Statut.VALIDE:
            return Response(
                {
                    "detail": f"Le document doit d'abord être validé avant d'être publié (statut actuel : '{doc.statut}')."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        doc.statut = Document.Statut.PUBLIE
        doc.save(update_fields=["statut", "modifie_le"])
        tracer_publication_document(request.user, doc)
        return Response(DocumentDetailSerializer(doc).data, status=status.HTTP_200_OK)


class DocumentBrouillonView(APIView):
    """POST /api/documents/{id}/brouillon/ : Coordonnateur ou Administrateur.

    Repasse un document au statut 'brouillon' pour permettre de nouvelles modifications.
    """

    permission_classes = [IsAuthenticated, IsEquipeCIAT]

    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        if doc.statut == Document.Statut.BROUILLON:
            return Response(
                {"detail": "Le document est déjà au statut brouillon."},
                status=status.HTTP_200_OK,
            )

        doc.statut = Document.Statut.BROUILLON
        doc.save(update_fields=["statut", "modifie_le"])
        return Response(DocumentDetailSerializer(doc).data, status=status.HTTP_200_OK)


# ==============================================================================
# Phase 2 — T3 : Export Word (.docx) et PDF (.pdf) avec la charte
# ==============================================================================

class DocumentExportView(APIView):
    """GET /api/documents/{id}/export/?format=docx ou ?format=pdf :

    Exporte le document au format Word ou PDF mis en forme selon la charte graphique CIAT.
    """

    permission_classes = [IsAuthenticated]

    def perform_content_negotiation(self, request, force=False):
        # Empêche DRF d'intercepter le query param ?format= (utilisé pour choisir docx ou pdf)
        renderers = self.get_renderers()
        return (renderers[0], renderers[0].media_type)

    def get(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)

        _verifier_acces_document(request.user, doc)

        format_param = request.query_params.get("format", "").strip().lower()
        if format_param not in ("docx", "pdf"):
            return Response(
                {
                    "detail": "Format d'export invalide ou manquant. Formats supportés : 'docx', 'pdf'."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        titre_nettoye = slugify(doc.titre) or f"document_{doc.id}"
        version_num = doc.version_courante

        if format_param == "docx":
            buf = generer_export_docx(doc)
            filename = f"{titre_nettoye}_v{version_num}.docx"
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            buf = generer_export_pdf(doc)
            filename = f"{titre_nettoye}_v{version_num}.pdf"
            content_type = "application/pdf"

        response = HttpResponse(buf.getvalue(), content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
