"""Tests unitaires et fonctionnels pour la Galerie des innovations (P6).

Vérifie l'ensemble des exigences du brief et du contrat d'API :
1. Une fiche non publiée n'est JAMAIS visible publiquement (GET /fiches/, GET /fiches/{slug}/, GET /fiches/{slug}/qr/)
2. L'API publique ne divulgue AUCUNE donnée privée du porteur (email, téléphone)
3. Consultation et incrémentation automatique du compteur de vues
4. Génération valide du QR code en image PNG
5. Filtrage (domaine, cohorte, avancement) et recherche textuelle
6. Workflow complet avec contrôle des droits :
   - Porteur crée pour son projet (brouillon)
   - Porteur soumet sa fiche (brouillon -> en_validation)
   - Coordonnateur / Admin valide (en_validation -> publie) ou refuse (-> refuse)
   - Interdiction de création pour un tiers (403)
   - Interdiction de validation par un porteur (403)
7. Endpoint de statistiques réservé à l'équipe CIAT
"""
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.gallery.models import FicheInnovation


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class GalleryAPITestCase(TestCase):
    """Tests fonctionnels de l'API /api/gallery/."""

    def setUp(self):
        self.client = APIClient()

        # Utilisateurs
        self.porteur1 = User.objects.create_user(
            email="porteur1@demo.ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Amina",
            last_name="Diallo",
            telephone="+221771234567",
        )
        self.porteur2 = User.objects.create_user(
            email="porteur2@demo.ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Moussa",
            last_name="Ba",
            telephone="+221779876543",
        )
        self.coordonnateur = User.objects.create_user(
            email="coordo@ciat.sn",
            password="Password123!",
            role=Role.COORDONNATEUR,
            first_name="Fatou",
            last_name="Sow",
        )
        self.admin = User.objects.create_user(
            email="admin@ciat.sn",
            password="Password123!",
            role=Role.ADMIN,
            first_name="Lansana",
            last_name="Coly",
            is_staff=True,
        )

        # Domaines et Cohortes
        self.domaine_agri = Domaine.objects.create(
            nom="Agriculture & Agroalimentaire",
            slug="agriculture-agroalimentaire",
        )
        self.domaine_sante = Domaine.objects.create(
            nom="Santé & Biotech",
            slug="sante-biotech",
        )
        self.cohorte_2026 = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)
        self.cohorte_2025 = Cohorte.objects.create(nom="Cohorte 2025", annee=2025)

        # Projets
        self.projet1 = Projet.objects.create(
            titre="AgriSol - Irrigation Solaire",
            resume="Système d'irrigation alimenté par énergie solaire",
            probleme="Manque d'accès à l'eau dans les zones rurales",
            solution="Pompes solaires intelligentes pilotées par capteurs IoT",
            domaine=self.domaine_agri,
            cohorte=self.cohorte_2026,
            porteur=self.porteur1,
            statut=Projet.Statut.INCUBE,
        )
        self.projet2 = Projet.objects.create(
            titre="SunuDoc - Télémédecine Mobile",
            resume="Plateforme de téléconsultation médicale en langues locales",
            probleme="Déserts médicaux et barrières de la langue",
            solution="Application avec synthèse vocale en wolof et pulaar",
            domaine=self.domaine_sante,
            cohorte=self.cohorte_2025,
            porteur=self.porteur2,
            statut=Projet.Statut.PROTOTYPE,
        )

        # Fiches d'innovation avec différents statuts
        self.fiche_publiee = FicheInnovation.objects.create(
            projet=self.projet1,
            titre="AgriSol Innovation",
            probleme="Pénurie d'eau récurrente pour les petits maraîchers",
            solution="Pompes solaires connectées avec suivi mobile",
            equipe="Amina Diallo (Ingénieure agronome), Cheikh Ndiaye (IoT)",
            avancement="Prototype",
            medias=[{"type": "photo", "url": "https://ciat.sn/media/agrisol.jpg"}],
            statut=FicheInnovation.Statut.PUBLIE,
            vues=10,
        )
        self.fiche_brouillon = FicheInnovation.objects.create(
            projet=self.projet2,
            titre="SunuDoc Innovation",
            probleme="Déserts médicaux",
            solution="Téléconsultation vocale",
            equipe="Moussa Ba, Dr Diop",
            avancement="Idée",
            medias=[],
            statut=FicheInnovation.Statut.BROUILLON,
            vues=0,
        )

    # ==========================================================================
    # 1. Confidentialité, sécurité et non-visibilité des fiches non publiées
    # ==========================================================================

    def test_fiche_non_publiee_jamais_visible_dans_liste_publique(self):
        """GET /api/gallery/fiches/ ne renvoie QUE les fiches au statut 'publie'."""
        resp = self.client.get("/api/gallery/fiches/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # La réponse paginée contient les résultats
        results = resp.data.get("results", resp.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.fiche_publiee.id)
        self.assertEqual(results[0]["statut"], "publie")

        # Vérification qu'aucune fiche brouillon/en_validation/refusée n'apparaît
        ids_visibles = [f["id"] for f in results]
        self.assertNotIn(self.fiche_brouillon.id, ids_visibles)

    def test_fiche_non_publiee_detail_inaccessible_au_public_404(self):
        """GET /api/gallery/fiches/{slug}/ renvoie 404 pour une fiche non publiée."""
        resp = self.client.get(f"/api/gallery/fiches/{self.fiche_brouillon.slug}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_fiche_non_publiee_qr_inaccessible_au_public_404(self):
        """GET /api/gallery/fiches/{slug}/qr/ renvoie 404 pour une fiche non publiée."""
        resp = self.client.get(f"/api/gallery/fiches/{self.fiche_brouillon.slug}/qr/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_aucune_donnee_privee_du_porteur_exposee(self):
        """L'API publique ne doit divulguer ni l'email ni le téléphone du porteur."""
        resp = self.client.get(f"/api/gallery/fiches/{self.fiche_publiee.slug}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.data
        champs_attendus = {
            "id", "slug", "projet", "titre", "probleme", "solution",
            "equipe", "avancement", "medias", "statut", "vues",
        }
        self.assertEqual(set(data.keys()), champs_attendus)

        # Vérification stricte contre les fuites
        data_str = str(data).lower()
        self.assertNotIn("email", data)
        self.assertNotIn("telephone", data)
        self.assertNotIn(self.porteur1.email.lower(), data_str)
        self.assertNotIn(self.porteur1.telephone, data_str)

    # ==========================================================================
    # 2. Consultation publique, compteur de vues et QR code
    # ==========================================================================

    def test_consultation_incremente_compteur_de_vues(self):
        """Chaque accès au détail d'une fiche publiée augmente le compteur de vues de 1."""
        vues_initiales = self.fiche_publiee.vues

        # Première consultation
        resp1 = self.client.get(f"/api/gallery/fiches/{self.fiche_publiee.slug}/")
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        self.assertEqual(resp1.data["vues"], vues_initiales + 1)

        # Seconde consultation
        resp2 = self.client.get(f"/api/gallery/fiches/{self.fiche_publiee.slug}/")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.data["vues"], vues_initiales + 2)

        self.fiche_publiee.refresh_from_db()
        self.assertEqual(self.fiche_publiee.vues, vues_initiales + 2)

    def test_qr_code_renvoie_image_png_valide(self):
        """GET /api/gallery/fiches/{slug}/qr/ renvoie un PNG valide avec en-tête d'image."""
        resp = self.client.get(f"/api/gallery/fiches/{self.fiche_publiee.slug}/qr/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "image/png")
        self.assertTrue(resp.content.startswith(b"\x89PNG\r\n\x1a\n"))

    # ==========================================================================
    # 3. Filtres et recherche textuelle
    # ==========================================================================

    def test_filtres_et_recherche(self):
        """Vérifie le fonctionnement des filtres domaine, cohorte, avancement et search."""
        # Création d'une seconde fiche publiée pour tester les filtres
        fiche_sante = FicheInnovation.objects.create(
            projet=self.projet2,
            titre="SunuDoc Télésanté",
            probleme="Accès aux soins spécialisés",
            solution="Téléconsultation sécurisée",
            equipe="Dr Ndiaye",
            avancement="Déploiement",
            statut=FicheInnovation.Statut.PUBLIE,
            vues=5,
        )

        # 1. Filtre par domaine
        resp_domaine = self.client.get(f"/api/gallery/fiches/?domaine={self.domaine_agri.slug}")
        results = resp_domaine.data.get("results", resp_domaine.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.fiche_publiee.id)

        # 2. Filtre par cohorte
        resp_cohorte = self.client.get(f"/api/gallery/fiches/?cohorte={self.cohorte_2025.annee}")
        results = resp_cohorte.data.get("results", resp_cohorte.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], fiche_sante.id)

        # 3. Filtre par avancement
        resp_avancement = self.client.get("/api/gallery/fiches/?avancement=Prototype")
        results = resp_avancement.data.get("results", resp_avancement.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.fiche_publiee.id)

        # 4. Recherche textuelle
        resp_search = self.client.get("/api/gallery/fiches/?search=Solaire")
        results = resp_search.data.get("results", resp_search.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.fiche_publiee.id)

    # ==========================================================================
    # 4. Création de fiche par le porteur
    # ==========================================================================

    def test_creation_fiche_non_authentifie_refuse_401(self):
        """Un utilisateur anonyme ne peut pas créer de fiche."""
        resp = self.client.post("/api/gallery/fiches/", {"titre": "Nouvelle Fiche"})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_porteur_ne_peut_creer_que_pour_son_propre_projet_403(self):
        """Porteur 1 ne peut pas créer de fiche pour le projet de Porteur 2."""
        self.client.force_authenticate(user=self.porteur1)

        payload = {
            "projet": self.projet2.id,  # Projet appartenant à Porteur 2
            "titre": "Fiche Non Autorisée",
            "probleme": "Test problème",
            "solution": "Test solution",
            "equipe": "Test équipe",
            "avancement": "Prototype",
            "medias": [],
        }
        resp = self.client.post("/api/gallery/fiches/", payload)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("porteur", resp.data["detail"].lower())

    def test_creation_fiche_par_le_porteur_succes_201(self):
        """Le porteur peut créer une fiche pour son projet avec statut initial brouillon."""
        self.client.force_authenticate(user=self.porteur1)

        payload = {
            "projet": self.projet1.id,
            "titre": "Nouvelle Fiche AgriSol V2",
            "probleme": "Salinisation des sols",
            "solution": "Dessalement basse énergie",
            "equipe": "Amina Diallo",
            "avancement": "MVP",
            "medias": [
                {"type": "photo", "url": "https://ciat.sn/photo1.png"},
                {"type": "demo", "url": "https://demo.ciat.sn/agrisol"},
            ],
        }
        resp = self.client.post("/api/gallery/fiches/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["titre"], payload["titre"])
        self.assertEqual(resp.data["statut"], "brouillon")
        self.assertEqual(resp.data["vues"], 0)
        self.assertTrue(len(resp.data["slug"]) > 0)

    def test_validation_format_medias(self):
        """Un type de média invalide renvoie 400 Bad Request."""
        self.client.force_authenticate(user=self.porteur1)

        payload = {
            "projet": self.projet1.id,
            "titre": "Fiche Média Invalide",
            "probleme": "Problème",
            "solution": "Solution",
            "equipe": "Équipe",
            "avancement": "Idée",
            "medias": [{"type": "audio", "url": "https://audio.sn/test.mp3"}],
        }
        resp = self.client.post("/api/gallery/fiches/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("medias", resp.data)

    # ==========================================================================
    # 5. Workflow de validation (soumettre, valider, refuser)
    # ==========================================================================

    def test_soumission_fiche_par_porteur(self):
        """Porteur soumet sa fiche brouillon pour validation."""
        # Porteur 1 tente de soumettre la fiche de Porteur 2 -> 403 Forbidden
        self.client.force_authenticate(user=self.porteur1)
        resp_tiers = self.client.post(f"/api/gallery/fiches/{self.fiche_brouillon.id}/soumettre/")
        self.assertEqual(resp_tiers.status_code, status.HTTP_403_FORBIDDEN)

        # Porteur 2 soumet sa propre fiche -> 200 OK
        self.client.force_authenticate(user=self.porteur2)
        resp_owner = self.client.post(f"/api/gallery/fiches/{self.fiche_brouillon.id}/soumettre/")
        self.assertEqual(resp_owner.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_owner.data["statut"], "en_validation")

        self.fiche_brouillon.refresh_from_db()
        self.assertEqual(self.fiche_brouillon.statut, FicheInnovation.Statut.EN_VALIDATION)

        # Tentative de re-soumission d'une fiche déjà en validation -> 400 Bad Request
        resp_re = self.client.post(f"/api/gallery/fiches/{self.fiche_brouillon.id}/soumettre/")
        self.assertEqual(resp_re.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation_par_coordonnateur_et_admin(self):
        """Seuls les coordonnateurs ou administrateurs peuvent valider une fiche."""
        # Porteur tente de valider -> 403 Forbidden
        self.client.force_authenticate(user=self.porteur1)
        resp_porteur = self.client.post(f"/api/gallery/fiches/{self.fiche_brouillon.id}/valider/")
        self.assertEqual(resp_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # Coordonnateur valide -> 200 OK
        self.client.force_authenticate(user=self.coordonnateur)
        resp_coordo = self.client.post(f"/api/gallery/fiches/{self.fiche_brouillon.id}/valider/")
        self.assertEqual(resp_coordo.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_coordo.data["statut"], "publie")

        self.fiche_brouillon.refresh_from_db()
        self.assertEqual(self.fiche_brouillon.statut, FicheInnovation.Statut.PUBLIE)

    def test_refus_par_coordonnateur_et_admin(self):
        """Seuls les coordonnateurs ou administrateurs peuvent refuser une fiche."""
        # Porteur tente de refuser -> 403 Forbidden
        self.client.force_authenticate(user=self.porteur1)
        resp_porteur = self.client.post(f"/api/gallery/fiches/{self.fiche_brouillon.id}/refuser/")
        self.assertEqual(resp_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # Administrateur refuse -> 200 OK
        self.client.force_authenticate(user=self.admin)
        resp_admin = self.client.post(f"/api/gallery/fiches/{self.fiche_brouillon.id}/refuser/")
        self.assertEqual(resp_admin.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_admin.data["statut"], "refuse")

        self.fiche_brouillon.refresh_from_db()
        self.assertEqual(self.fiche_brouillon.statut, FicheInnovation.Statut.REFUSE)

    # ==========================================================================
    # 6. Statistiques de consultation
    # ==========================================================================

    def test_statistiques_equipe_ciat(self):
        """GET /api/gallery/statistiques/ réservé à l'équipe CIAT."""
        # Non connecté -> 401 Unauthorized
        resp_anon = self.client.get("/api/gallery/statistiques/")
        self.assertEqual(resp_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # Porteur -> 403 Forbidden
        self.client.force_authenticate(user=self.porteur1)
        resp_porteur = self.client.get("/api/gallery/statistiques/")
        self.assertEqual(resp_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # Coordonnateur -> 200 OK
        self.client.force_authenticate(user=self.coordonnateur)
        resp_coordo = self.client.get("/api/gallery/statistiques/")
        self.assertEqual(resp_coordo.status_code, status.HTTP_200_OK)

        self.assertIn("total_vues", resp_coordo.data)
        self.assertIn("par_fiche", resp_coordo.data)
        self.assertEqual(resp_coordo.data["total_vues"], 10)
        self.assertEqual(len(resp_coordo.data["par_fiche"]), 2)
        self.assertEqual(resp_coordo.data["par_fiche"][0]["slug"], self.fiche_publiee.slug)
        self.assertEqual(resp_coordo.data["par_fiche"][0]["vues"], 10)
