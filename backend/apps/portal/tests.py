"""Tests unitaires et d'intégration pour le module Portail (apps.portal) — T1, T2, T3.

Vérifie l'intégralité des critères d'acceptation :
- T1 : Actualités, Événements, Appels à projets (lecture publique, écriture restreinte, filtres, statut calculé).
- T2 : Partenaires (sans pagination), Documents publics, Formulaire de contact (création publique, email valide, consultation restreinte à l'équipe).
- T3 : Annuaire public des projets incubés (seuls incube/prototype/termine, filtres domaine/cohorte/statut/search, aucune donnée privée).
"""
import shutil
from datetime import timedelta

from django.test import override_settings
from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Cohorte, Domaine, Projet, Role

from .models import (
    Actualite,
    AppelProjet,
    DocumentPublic,
    Evenement,
    MessageContact,
    Partenaire,
)

User = get_user_model()


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class PortalBaseTestCase(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(settings.MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        # Utilisateurs avec différents rôles
        self.admin_user = User.objects.create_user(
            email="admin@ciat.sn",
            password="password123",
            role=Role.ADMIN,
            first_name="Admin",
            last_name="CIAT",
        )
        self.coordo_user = User.objects.create_user(
            email="coordo@ciat.sn",
            password="password123",
            role=Role.COORDONNATEUR,
            first_name="Coordo",
            last_name="CIAT",
        )
        self.porteur_user = User.objects.create_user(
            email="porteur@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
            first_name="Modou",
            last_name="Diop",
        )

        now = timezone.now()

        # T1 — Jeux de données
        self.actu1 = Actualite.objects.create(
            titre="Lancement de la plateforme CIAT",
            resume="Une nouvelle étape pour l'innovation technologique.",
            contenu="Le CIAT inaugure sa plateforme numérique pour accompagner les porteurs de projets.",
            publie=True,
            publie_le=now - timedelta(days=2),
        )
        self.actu2 = Actualite.objects.create(
            titre="Atelier intelligence artificielle",
            resume="Formation intensive sur les LLMs.",
            contenu="Tous les incubés sont invités à participer à l'atelier.",
            publie=True,
            publie_le=now - timedelta(days=1),
        )

        self.evt_passe = Evenement.objects.create(
            titre="Séminaire d'accueil 2025",
            description="Accueil des étudiants et chercheurs.",
            lieu="Amphithéâtre ISEP",
            debut=now - timedelta(days=10),
            fin=now - timedelta(days=9),
        )
        self.evt_futur = Evenement.objects.create(
            titre="Hackathon AgriTech 2026",
            description="48h pour prototyper des solutions agricoles innovantes.",
            lieu="FabLab CIAT",
            debut=now + timedelta(days=15),
            fin=now + timedelta(days=17),
            lien_inscription="https://ciat.sn/hackathon-2026",
        )

        self.appel_ouvert = AppelProjet.objects.create(
            titre="Appel à projets Cohorte 2026",
            description="Rejoignez le programme d'incubation du CIAT.",
            date_limite=now + timedelta(days=30),
            pieces_demandees=["fiche_projet", "presentation_equipe", "budget_previsionnel"],
        )
        self.appel_clos = AppelProjet.objects.create(
            titre="Appel à projets Pilote 2025",
            description="Premier appel à projets de test.",
            date_limite=now - timedelta(days=5),
            pieces_demandees=["fiche_projet"],
        )

        # T2 — Partenaires et Documents
        self.partenaire1 = Partenaire.objects.create(
            nom="ISEP Diamniadio",
            site_web="https://isepdiamniadio.edu.sn",
            description="Institut Supérieur d'Enseignement Professionnel",
            ordre=1,
        )
        self.partenaire2 = Partenaire.objects.create(
            nom="Ministère de l'Enseignement Supérieur",
            site_web="https://mesri.sec.gouv.sn",
            description="Partenaire institutionnel",
            ordre=2,
        )

        fichier_test = SimpleUploadedFile("guide.pdf", b"Contenu du guide PDF", content_type="application/pdf")
        self.doc1 = DocumentPublic.objects.create(
            titre="Guide d'incubation CIAT 2026",
            categorie="Guides",
            fichier=fichier_test,
        )

        # T3 — Projets avec différents statuts
        self.domaine_agri = Domaine.objects.create(nom="Agriculture & Agroalimentaire")
        self.domaine_sante = Domaine.objects.create(nom="Santé & Biotech")

        self.cohorte_2026 = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        # Projet au statut IDÉE (ne DOIT JAMAIS apparaître dans l'annuaire)
        self.projet_idee = Projet.objects.create(
            titre="Idée Drone Arrosage",
            resume="Une idée initiale encore non incubée",
            domaine=self.domaine_agri,
            cohorte=self.cohorte_2026,
            porteur=self.porteur_user,
            statut=Projet.Statut.IDEE,
        )
        # Projets aux statuts INCUBÉ, PROTOTYPE, TERMINÉ (doivent apparaître)
        self.projet_incube = Projet.objects.create(
            titre="AgriSol Solutions",
            resume="Capteurs IoT pour l'irrigation intelligente des sols sahéliens.",
            domaine=self.domaine_agri,
            cohorte=self.cohorte_2026,
            porteur=self.porteur_user,
            statut=Projet.Statut.INCUBE,
        )
        self.projet_proto = Projet.objects.create(
            titre="BioDiag Sénégal",
            resume="Kit de diagnostic rapide pour la télémédecine rurale.",
            domaine=self.domaine_sante,
            cohorte=self.cohorte_2026,
            porteur=self.porteur_user,
            statut=Projet.Statut.PROTOTYPE,
        )
        self.projet_termine = Projet.objects.create(
            titre="SolarCold Tech",
            resume="Chambres froides solaires pour conserver les récoltes maraîchères.",
            domaine=self.domaine_agri,
            cohorte=self.cohorte_2026,
            porteur=self.porteur_user,
            statut=Projet.Statut.TERMINE,
        )


# ==============================================================================
# TESTS T1
# ==============================================================================

class ActualiteTests(PortalBaseTestCase):
    def test_visiteur_non_connecte_peut_lister_actualites(self):
        response = self.client.get("/api/portal/actualites/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("results", data)
        self.assertEqual(data["count"], 2)
        premier = data["results"][0]
        for field in ("id", "titre", "slug", "resume", "contenu", "image", "publie_le"):
            self.assertIn(field, premier)

    def test_porteur_ne_peut_pas_creer_actualite(self):
        self.client.force_authenticate(user=self.porteur_user)
        payload = {"titre": "Tentative porteur", "contenu": "Interdit"}
        response = self.client.post("/api/portal/actualites/", payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_coordonnateur_cree_actualite_avec_succes(self):
        self.client.force_authenticate(user=self.coordo_user)
        payload = {
            "titre": "Nouvelle actualité par le coordonnateur",
            "resume": "Bref résumé",
            "contenu": "Contenu officiel.",
        }
        response = self.client.post("/api/portal/actualites/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["titre"], payload["titre"])
        self.assertEqual(data["slug"], "nouvelle-actualite-par-le-coordonnateur")


class EvenementTests(PortalBaseTestCase):
    def test_filtre_a_venir_sur_evenements(self):
        response = self.client.get("/api/portal/evenements/?a_venir=1")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["id"], self.evt_futur.id)


class AppelProjetTests(PortalBaseTestCase):
    def test_statut_dynamique_ouvert_et_clos(self):
        self.assertEqual(self.appel_ouvert.statut, "ouvert")
        self.assertEqual(self.appel_clos.statut, "clos")

        res_ouvert = self.client.get(f"/api/portal/appels/{self.appel_ouvert.id}/")
        self.assertEqual(res_ouvert.json()["statut"], "ouvert")

        res_clos = self.client.get(f"/api/portal/appels/{self.appel_clos.id}/")
        self.assertEqual(res_clos.json()["statut"], "clos")


# ==============================================================================
# TESTS T2 — Partenaires, documents et contact
# ==============================================================================

class PartenaireTests(PortalBaseTestCase):
    def test_liste_partenaires_sans_pagination(self):
        """GET /api/portal/partenaires/ renvoie une liste non paginée conformément au contrat."""
        response = self.client.get("/api/portal/partenaires/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)
        premier = data[0]
        for field in ("id", "nom", "logo", "site_web", "description"):
            self.assertIn(field, premier)

    def test_porteur_ne_peut_pas_creer_partenaire(self):
        self.client.force_authenticate(user=self.porteur_user)
        response = self.client.post("/api/portal/partenaires/", {"nom": "Partenaire Test"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cree_partenaire(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "nom": "Banque Agricole",
            "site_web": "https://labanqueagricole.sn",
            "description": "Partenaire de financement",
        }
        response = self.client.post("/api/portal/partenaires/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["nom"], "Banque Agricole")


class DocumentPublicTests(PortalBaseTestCase):
    def test_lecture_publique_documents(self):
        response = self.client.get("/api/portal/documents/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("results", data)
        self.assertEqual(data["count"], 1)
        self.assertIn("fichier", data["results"][0])


class ContactTests(PortalBaseTestCase):
    def test_enregistrement_message_contact_sans_connexion(self):
        """Critère T2 : un message de contact est enregistré sans connexion (POST public -> 201)."""
        payload = {
            "nom": "Fatou Ndiaye",
            "email": "fatou.ndiaye@example.com",
            "sujet": "Demande de renseignements",
            "message": "Bonjour, comment postuler pour le prochain appel d'incubation ?",
        }
        response = self.client.post("/api/portal/contact/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MessageContact.objects.count(), 1)
        msg = MessageContact.objects.first()
        self.assertEqual(msg.nom, "Fatou Ndiaye")
        self.assertEqual(msg.email, "fatou.ndiaye@example.com")

    def test_refus_email_invalide(self):
        """Critère T2 : un email invalide est refusé avec une erreur 400."""
        payload = {
            "nom": "Utilisateur Erreur",
            "email": "adresse-invalide-sans-arobase",
            "sujet": "Test",
            "message": "Message de test",
        }
        response = self.client.post("/api/portal/contact/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json())

    def test_liste_messages_refusee_a_visiteur_et_porteur(self):
        """Critère T2 : la liste des messages est refusée à un visiteur et à un porteur."""
        # 1. Visiteur non connecté
        response_anonyme = self.client.get("/api/portal/contact/")
        self.assertIn(
            response_anonyme.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

        # 2. Porteur de projet connecté
        self.client.force_authenticate(user=self.porteur_user)
        response_porteur = self.client.get("/api/portal/contact/")
        self.assertEqual(response_porteur.status_code, status.HTTP_403_FORBIDDEN)

    def test_liste_messages_autorisee_a_equipe_ciat(self):
        """Seule l'équipe CIAT (coordonnateur, admin) peut consulter les messages de contact."""
        MessageContact.objects.create(
            nom="Awa", email="awa@example.com", sujet="Sujet", message="Texte"
        )
        self.client.force_authenticate(user=self.coordo_user)
        response = self.client.get("/api/portal/contact/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["count"], 1)


# ==============================================================================
# TESTS T3 — Annuaire public des projets incubés
# ==============================================================================

class ProjetIncubeTests(PortalBaseTestCase):
    def test_projet_statut_idee_n_apparait_jamais(self):
        """Critère T3 : un projet en statut 'idee' n'apparaît JAMAIS dans l'annuaire."""
        response = self.client.get("/api/portal/projets-incubes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # Seuls les 3 projets (incube, prototype, termine) doivent apparaître sur 4 projets totaux
        self.assertEqual(data["count"], 3)
        ids_renvoyes = [p["id"] for p in data["results"]]
        self.assertNotIn(self.projet_idee.id, ids_renvoyes)

    def test_aucune_donnee_privee_n_est_exposee(self):
        """Critère T3 : aucune donnée privée (email, porteur, etc.) n'est exposée."""
        response = self.client.get(f"/api/portal/projets-incubes/{self.projet_incube.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        champs_attendus = {"id", "titre", "resume", "domaine_nom", "cohorte_nom", "statut", "vues"}
        self.assertEqual(set(data.keys()), champs_attendus)
        # Vérification qu'aucun email ou identifiant privé ne fuite
        self.assertNotIn("porteur", data)
        self.assertNotIn("email", data)
        self.assertNotIn("telephone", data)

    def test_filtres_domaine_cohorte_statut_et_recherche(self):
        """Critère T3 : les filtres et la recherche fonctionnent fidèlement."""
        # Filtre par domaine
        res_dom = self.client.get(f"/api/portal/projets-incubes/?domaine={self.domaine_sante.id}")
        self.assertEqual(res_dom.json()["count"], 1)
        self.assertEqual(res_dom.json()["results"][0]["id"], self.projet_proto.id)

        # Filtre par statut
        res_stat = self.client.get("/api/portal/projets-incubes/?statut=incube")
        self.assertEqual(res_stat.json()["count"], 1)
        self.assertEqual(res_stat.json()["results"][0]["id"], self.projet_incube.id)

        # Filtre par recherche
        res_search = self.client.get("/api/portal/projets-incubes/?search=solaire")
        self.assertEqual(res_search.json()["count"], 1)
        self.assertEqual(res_search.json()["results"][0]["id"], self.projet_termine.id)


# ==============================================================================
# TESTS ADMIN
# ==============================================================================

@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AdminRegistrationTests(APITestCase):
    def test_tous_modeles_enregistres_dans_admin(self):
        modeles = [Actualite, Evenement, AppelProjet, Partenaire, DocumentPublic, MessageContact]
        for m in modeles:
            self.assertIn(m, admin.site._registry, f"Le modèle {m.__name__} n'est pas dans l'admin Django")


# ==============================================================================
# TESTS PHASE 3 — T1 (Brouillon/Publication) et T2 (Statistiques/Vues)
# ==============================================================================

class PortalPhase3Tests(PortalBaseTestCase):
    def setUp(self):
        super().setUp()
        now = timezone.now()
        # Création d'une actualité brouillon (publie=False)
        self.actu_brouillon = Actualite.objects.create(
            titre="Actualité en brouillon confidentielle",
            resume="Brouillon non validé",
            contenu="Texte interne non destiné au public.",
            publie=False,
            publie_le=now,
        )

    def test_actualite_non_publiee_masquee_au_public(self):
        """Une actualité brouillon n'apparaît pas dans la liste publique."""
        response = self.client.get("/api/portal/actualites/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in response.json()["results"]]
        self.assertNotIn(self.actu_brouillon.slug, slugs)
        self.assertEqual(response.json()["count"], 2)

    def test_actualite_non_publiee_detail_renvoie_404_au_public(self):
        """L'accès direct au détail d'un brouillon par le public renvoie 404."""
        response = self.client.get(f"/api/portal/actualites/{self.actu_brouillon.slug}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Même comportement si cherché par ID
        response_id = self.client.get(f"/api/portal/actualites/{self.actu_brouillon.id}/")
        self.assertEqual(response_id.status_code, status.HTTP_404_NOT_FOUND)

    def test_actualite_non_publiee_visible_et_modifiable_par_equipe(self):
        """L'équipe CIAT voit les brouillons et peut les passer en publié."""
        self.client.force_authenticate(user=self.coordo_user)

        # 1. Le coordonnateur voit le brouillon dans la liste
        res_list = self.client.get("/api/portal/actualites/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in res_list.json()["results"]]
        self.assertIn(self.actu_brouillon.slug, slugs)
        self.assertEqual(res_list.json()["count"], 3)

        # 2. Le coordonnateur peut lire le détail du brouillon
        res_detail = self.client.get(f"/api/portal/actualites/{self.actu_brouillon.slug}/")
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertFalse(res_detail.json()["publie"])

        # 3. Le coordonnateur publie l'actualité
        res_patch = self.client.patch(
            f"/api/portal/actualites/{self.actu_brouillon.id}/",
            {"publie": True},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertTrue(res_patch.json()["publie"])

        # 4. Maintenant, l'actualité est devenue visible pour le public anonyme
        self.client.logout()
        res_public = self.client.get(f"/api/portal/actualites/{self.actu_brouillon.slug}/")
        self.assertEqual(res_public.status_code, status.HTTP_200_OK)

    def test_incrementation_atomique_vues_actualite(self):
        """Deux consultations successives d'une actualité incrémentent son compteur de vues à 2."""
        self.assertEqual(self.actu1.vues, 0)

        # Première consultation
        res1 = self.client.get(f"/api/portal/actualites/{self.actu1.slug}/")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.json()["vues"], 1)

        # Deuxième consultation
        res2 = self.client.get(f"/api/portal/actualites/{self.actu1.slug}/")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.json()["vues"], 2)

        self.actu1.refresh_from_db()
        self.assertEqual(self.actu1.vues, 2)

    def test_incrementation_atomique_vues_projet_incube(self):
        """Deux consultations du détail d'un projet incubé donnent vues = 2."""
        self.assertEqual(self.projet_incube.vues, 0)

        res1 = self.client.get(f"/api/portal/projets-incubes/{self.projet_incube.id}/")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.json()["vues"], 1)

        res2 = self.client.get(f"/api/portal/projets-incubes/{self.projet_incube.id}/")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.json()["vues"], 2)

        self.projet_incube.refresh_from_db()
        self.assertEqual(self.projet_incube.vues, 2)

    def test_statistiques_portail_permissions_et_donnees(self):
        """GET /api/portal/statistiques/ est réservé à l'équipe et renvoie les vues consolidées."""
        # Incrémenter des vues
        self.client.get(f"/api/portal/actualites/{self.actu1.slug}/")
        self.client.get(f"/api/portal/actualites/{self.actu1.slug}/")
        self.client.get(f"/api/portal/projets-incubes/{self.projet_incube.id}/")

        # 1. Anonyme -> 401
        res_anon = self.client.get("/api/portal/statistiques/")
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Porteur -> 403
        self.client.force_authenticate(user=self.porteur_user)
        res_porteur = self.client.get("/api/portal/statistiques/")
        self.assertEqual(res_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Coordonnateur -> 200
        self.client.force_authenticate(user=self.coordo_user)
        res_coordo = self.client.get("/api/portal/statistiques/")
        self.assertEqual(res_coordo.status_code, status.HTTP_200_OK)
        data = res_coordo.json()

        self.assertIn("total_vues", data)
        self.assertIn("actualites", data)
        self.assertIn("projets", data)

        self.assertEqual(data["total_vues"], 3)  # 2 actu + 1 projet
        # Vérification du format des éléments
        actu_stats = next(a for a in data["actualites"] if a["slug"] == self.actu1.slug)
        self.assertEqual(actu_stats["vues"], 2)
        proj_stats = next(p for p in data["projets"] if p["id"] == self.projet_incube.id)
        self.assertEqual(proj_stats["vues"], 1)



# ==============================================================================
# Phase 9 — T1, T2, T3 (Pathé)
# ==============================================================================

from datetime import timedelta
from django.core import mail, signing
from django.core.cache import cache
from django.test import override_settings
from apps.core.models import JournalAudit


@override_settings(DISABLE_THROTTLING="1")
class Phase9Tests(APITestCase):
    """Suite de tests unifiée couvrant l'intégralité des exigences de la Phase 9."""

    def setUp(self):
        cache.clear()
        mail.outbox = []

        # Utilisateur administrateur pour l'audit et l'administration
        self.admin = User.objects.create_user(
            email="admin.phase9@ciat.sn",
            password="StrongPassword123!",
            role=Role.ADMIN,
            is_staff=True,
            first_name="Admin",
            last_name="CIAT",
        )

        # Porteur de projet
        self.porteur = User.objects.create_user(
            email="porteur.phase9@ciat.sn",
            password="StrongPassword123!",
            role=Role.PORTEUR,
            first_name="Modou",
            last_name="Diop",
        )

        # Domaines et cohortes de base
        self.domaine_agri = Domaine.objects.create(
            nom="Agriculture et Agroalimentaire",
            slug="agriculture-agroalimentaire",
        )
        self.domaine_energie = Domaine.objects.create(
            nom="Énergies Propres et Renouvelables",
            slug="energies-propres",
        )
        self.cohorte_2026 = Cohorte.objects.create(
            nom="Cohorte 2026 Alpha",
            annee=2026,
            date_debut=timezone.now().date(),
        )

    def tearDown(self):
        cache.clear()

    # ==========================================================================
    # T1 : Abonnement à la lettre d'information
    # ==========================================================================

    def test_t1_abonnement_double_optin_succes(self):
        """Un visiteur s'abonne : état en attente et envoi de l'email double opt-in."""
        from apps.portal.models import AbonnementLettre

        url = "/api/portal/lettre/abonner/"
        data = {"email": "visiteur@example.com"}

        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["statut"], "en_attente")

        # Vérification en base
        ab = AbonnementLettre.objects.get(email="visiteur@example.com")
        self.assertEqual(ab.statut, AbonnementLettre.Statut.EN_ATTENTE)
        self.assertTrue(bool(ab.jeton))
        self.assertIsNone(ab.confirme_le)

        # Vérification du courriel envoyé
        self.assertEqual(len(mail.outbox), 1)
        email_envoye = mail.outbox[0]
        self.assertIn("visiteur@example.com", email_envoye.to)
        self.assertIn("Confirmez votre abonnement", email_envoye.subject)
        self.assertIn("jeton=", email_envoye.body)

    def test_t1_abonnement_anti_enumeration(self):
        """La réponse est strictement identique que l'email existe déjà ou non."""
        from apps.portal.models import AbonnementLettre

        url = "/api/portal/lettre/abonner/"

        # 1. Création d'un abonné déjà confirmé
        ab = AbonnementLettre.objects.create(
            email="confirme@example.com",
            statut=AbonnementLettre.Statut.CONFIRME,
            jeton="ancien_jeton",
            confirme_le=timezone.now(),
        )

        resp1 = self.client.post(url, {"email": "confirme@example.com"}, format="json")
        resp2 = self.client.post(url, {"email": "nouveau@example.com"}, format="json")

        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp1.data["detail"], resp2.data["detail"])
        self.assertEqual(resp1.data["statut"], resp2.data["statut"])

        # L'abonné confirmé n'a pas été altéré
        ab.refresh_from_db()
        self.assertEqual(ab.statut, AbonnementLettre.Statut.CONFIRME)

    def test_t1_abonnement_anti_spam_throttle(self):
        """La limitation de débit stricte bloque les rafales de requêtes (anti-spam)."""
        from apps.portal.throttling import PortalLettreAnonRateThrottle
        from rest_framework.test import APIRequestFactory
        from django.contrib.auth.models import AnonymousUser

        factory = APIRequestFactory()
        throttle = PortalLettreAnonRateThrottle()
        throttle.rate = "2/minute"
        throttle.num_requests, throttle.duration = throttle.parse_rate(throttle.rate)
        request = factory.post("/api/portal/lettre/abonner/", {"email": "spam@example.com"})
        request.user = AnonymousUser()

        with override_settings(DISABLE_THROTTLING="0"):
            self.assertTrue(throttle.allow_request(request, None))
            self.assertTrue(throttle.allow_request(request, None))
            self.assertFalse(throttle.allow_request(request, None))

    def test_t1_abonnement_validation_email(self):
        """Un format d'email invalide déclenche un code 400 explicite."""
        url = "/api/portal/lettre/abonner/"

        resp = self.client.post(url, {"email": "invalide-sans-arobase"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", resp.data)

        resp_vide = self.client.post(url, {"email": ""}, format="json")
        self.assertEqual(resp_vide.status_code, status.HTTP_400_BAD_REQUEST)

    def test_t1_confirmation_et_rejeu(self):
        """Confirmation réussie puis blocage du rejeu avec code 400 clair."""
        from apps.portal.models import AbonnementLettre
        from apps.portal.emails import generer_jeton_signe

        # Inscription
        self.client.post("/api/portal/lettre/abonner/", {"email": "optin@example.com"}, format="json")
        ab = AbonnementLettre.objects.get(email="optin@example.com")
        jeton_signe = generer_jeton_signe(ab.id, ab.email, ab.jeton, "confirmer")

        # Confirmation
        url_confirm = "/api/portal/lettre/confirmer/"
        resp = self.client.post(url_confirm, {"jeton": jeton_signe}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["statut"], "confirme")

        ab.refresh_from_db()
        self.assertEqual(ab.statut, AbonnementLettre.Statut.CONFIRME)
        self.assertIsNotNone(ab.confirme_le)

        # Un courriel de bienvenue avec lien de désabonnement est envoyé
        self.assertTrue(len(mail.outbox) >= 2)
        dernier_mail = mail.outbox[-1]
        self.assertIn("désabonner", dernier_mail.body)

        # Tentative de rejeu avec le même jeton
        resp_rejeu = self.client.post(url_confirm, {"jeton": jeton_signe}, format="json")
        self.assertEqual(resp_rejeu.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("utilisé", resp_rejeu.data["detail"].lower())

    def test_t1_confirmation_jeton_invalide_ou_expire(self):
        """Un jeton corrompu ou expiré renvoie 400."""
        from apps.portal.models import AbonnementLettre

        url_confirm = "/api/portal/lettre/confirmer/"

        resp = self.client.post(url_confirm, {"jeton": "jeton_bidon_totalement_faux"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Jeton expiré ou mauvais salt
        ab = AbonnementLettre.objects.create(email="expire@example.com", jeton="xyz", statut=AbonnementLettre.Statut.EN_ATTENTE)
        jeton_signe = signing.dumps({"sub_id": ab.id, "email": ab.email, "raw": "xyz", "action": "confirmer"}, salt="mauvais_salt")
        resp_expire = self.client.post(url_confirm, {"jeton": jeton_signe}, format="json")
        self.assertEqual(resp_expire.status_code, status.HTTP_400_BAD_REQUEST)

    def test_t1_desabonnement_et_rejeu(self):
        """Désabonnement avec jeton valide puis interdiction de rejeu."""
        from apps.portal.models import AbonnementLettre
        from apps.portal.emails import generer_jeton_signe

        ab = AbonnementLettre.objects.create(
            email="desabo@example.com",
            statut=AbonnementLettre.Statut.CONFIRME,
            jeton="unsub_token_secret",
            confirme_le=timezone.now(),
        )
        jeton_signe = generer_jeton_signe(ab.id, ab.email, ab.jeton, "desabonner")

        url_desabo = "/api/portal/lettre/desabonner/"
        resp = self.client.post(url_desabo, {"jeton": jeton_signe}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["statut"], "desabonne")

        ab.refresh_from_db()
        self.assertEqual(ab.statut, AbonnementLettre.Statut.DESABONNE)
        self.assertIsNotNone(ab.desabonne_le)

        # Rejeu interdit
        resp_rejeu = self.client.post(url_desabo, {"jeton": jeton_signe}, format="json")
        self.assertEqual(resp_rejeu.status_code, status.HTTP_400_BAD_REQUEST)

    def test_t1_admin_liste_et_export_csv_audite(self):
        """L'administration peut lister, filtrer et exporter en CSV avec traçabilité dans l'audit."""
        from apps.portal.models import AbonnementLettre

        AbonnementLettre.objects.create(email="a1@ciat.sn", statut=AbonnementLettre.Statut.CONFIRME)
        AbonnementLettre.objects.create(email="a2@ciat.sn", statut=AbonnementLettre.Statut.EN_ATTENTE)

        # 1. Non authentifié : refus
        resp = self.client.get("/api/portal/lettre/abonnements/")
        self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

        # 2. Authentifié admin : succès et filtre
        self.client.force_authenticate(user=self.admin)
        resp_admin = self.client.get("/api/portal/lettre/abonnements/?statut=confirme")
        self.assertEqual(resp_admin.status_code, status.HTTP_200_OK)
        results = resp_admin.data.get("results", resp_admin.data)
        self.assertTrue(all(item["statut"] == "confirme" for item in results))

        # 3. Action d'export CSV d'administration Django
        from apps.portal.admin import exporter_abonnements_lettre_csv
        class DummyRequest:
            user = self.admin

        qs = AbonnementLettre.objects.all()
        csv_resp = exporter_abonnements_lettre_csv(None, DummyRequest(), qs)
        self.assertEqual(csv_resp.status_code, 200)
        self.assertEqual(csv_resp["Content-Type"], "text/csv; charset=utf-8-sig")

        lignes = csv_resp.content.decode("utf-8-sig").splitlines()
        self.assertEqual(lignes[0], "Email;Statut")
        self.assertTrue(any("a1@ciat.sn;confirme" in l for l in lignes))

        # Vérification dans le journal d'audit
        audit = JournalAudit.objects.filter(action="export_csv_abonnements_lettre").first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.acteur, self.admin)
        self.assertEqual(audit.apres.get("total_exporte"), qs.count())

    # ==========================================================================
    # T2 : Recherche globale des contenus publics
    # ==========================================================================

    def test_t2_recherche_validation_longueur_q(self):
        """Une recherche avec q absent ou de moins de 2 caractères renvoie 400."""
        resp1 = self.client.get("/api/portal/recherche/?q=a")
        self.assertEqual(resp1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("2 caractères", resp1.data["detail"])

        resp2 = self.client.get("/api/portal/recherche/")
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_t2_recherche_insensible_casse_et_accents(self):
        """La recherche « eau » trouve « Eau » et « éau » (insensible casse et accents)."""
        Actualite.objects.create(
            titre="Système d'assainissement et Éau potable",
            resume="Distribution moderne.",
            contenu="Réseau d'adduction d'eau au Sénégal.",
            publie=True,
        )
        Evenement.objects.create(
            titre="Forum de l'Eau et de l'Environnement",
            description="Colloque scientifique sur les nappes phréatiques.",
            lieu="Amphi Diamniadio",
            debut=timezone.now() + timedelta(days=2),
        )

        for terme in ["eau", "Eau", "éau", "ÉAU"]:
            resp = self.client.get(f"/api/portal/recherche/?q={terme}")
            self.assertEqual(resp.status_code, status.HTTP_200_OK, f"Échec pour terme={terme}")
            self.assertTrue(resp.data["total"] >= 2, f"Total insuffisant pour {terme}: {resp.data['total']}")
            self.assertTrue(len(resp.data["actualites"]) >= 1)
            self.assertTrue(len(resp.data["evenements"]) >= 1)

    def test_t2_recherche_filtre_strictement_contenus_publics(self):
        """Ne renvoie JAMAIS de brouillons, de projets non incubés, ni de fiches refusées."""
        from apps.gallery.models import FicheInnovation

        # 1. Actualité non publiée
        Actualite.objects.create(
            titre="Actualité secrète non publiée",
            resume="Brouillon confidentiel.",
            contenu="Données confidentielles sur les capteurs solaires.",
            publie=False,
        )

        # 2. Projets en statut brouillon / idée / rejeté
        Projet.objects.create(
            titre="Projet Idée Non Incubé Solaires",
            resume="Simple idée déposée.",
            domaine=self.domaine_energie,
            cohorte=self.cohorte_2026,
            porteur=self.porteur,
            statut=Projet.Statut.IDEE,
        )
        Projet.objects.create(
            titre="Projet Rejeté Solaires",
            resume="Non retenu.",
            domaine=self.domaine_energie,
            cohorte=self.cohorte_2026,
            porteur=self.porteur,
            statut=Projet.Statut.REJETE,
        )

        # 3. Projet légitime incubé
        projet_incube = Projet.objects.create(
            titre="Projet Incubé Solaires Actif",
            resume="Projet officiellement incubé.",
            domaine=self.domaine_energie,
            cohorte=self.cohorte_2026,
            porteur=self.porteur,
            statut=Projet.Statut.INCUBE,
        )

        # 4. Fiche d'innovation refusée et brouillon
        FicheInnovation.objects.create(
            projet=projet_incube,
            titre="Fiche Refusée Solaires",
            probleme="Problème",
            solution="Solution",
            equipe="Equipe",
            avancement="Idée",
            statut=FicheInnovation.Statut.REFUSE,
        )
        FicheInnovation.objects.create(
            projet=projet_incube,
            titre="Fiche Publiée Solaires",
            probleme="Problème",
            solution="Solution",
            equipe="Equipe",
            avancement="Prototype",
            statut=FicheInnovation.Statut.PUBLIE,
        )

        resp = self.client.get("/api/portal/recherche/?q=Solaires")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        titres_trouves = [r["titre"] for r in resp.data["resultats"]]

        # Vérification d'exclusion stricte
        self.assertNotIn("Actualité secrète non publiée", titres_trouves)
        self.assertNotIn("Projet Idée Non Incubé Solaires", titres_trouves)
        self.assertNotIn("Projet Rejeté Solaires", titres_trouves)
        self.assertNotIn("Fiche Refusée Solaires", titres_trouves)

        # Vérification de présence des contenus publics validés
        self.assertIn("Projet Incubé Solaires Actif", titres_trouves)
        self.assertIn("Fiche Publiée Solaires", titres_trouves)

        # Vérification de l'absence de donnée personnelle sensible
        corps_reponse = resp.content.decode("utf-8")
        self.assertNotIn(self.porteur.email, corps_reponse)

    # ==========================================================================
    # T3 : Chiffres clés réels calculés depuis la base
    # ==========================================================================

    def test_t3_chiffres_cles_recoupement_base_et_cache(self):
        """Chaque chiffre clé correspond exactement aux enregistrements réels en base."""
        # Préparation de données réelles
        Projet.objects.create(
            titre="P1 Incube",
            domaine=self.domaine_agri,
            cohorte=self.cohorte_2026,
            porteur=self.porteur,
            statut=Projet.Statut.INCUBE,
        )
        Projet.objects.create(
            titre="P2 Prototype",
            domaine=self.domaine_energie,
            cohorte=self.cohorte_2026,
            porteur=self.porteur,
            statut=Projet.Statut.PROTOTYPE,
        )
        Partenaire.objects.create(nom="Partenaire Test", ordre=1)

        resp = self.client.get("/api/portal/chiffres-cles/?nocache=1")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data

        # Recoupement direct
        statuts_incubes = [Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        expected_incubes = Projet.objects.filter(statut__in=statuts_incubes).count()
        expected_prototypes = Projet.objects.filter(statut__in=[Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]).count()
        expected_porteurs = User.objects.filter(projets_portes__statut__in=statuts_incubes).distinct().count()
        expected_partenaires = Partenaire.objects.count()
        expected_cohortes = Cohorte.objects.count()

        self.assertEqual(data["projets_incubes"], expected_incubes)
        self.assertEqual(data["prototypes"], expected_prototypes)
        self.assertEqual(data["porteurs_accompagnes"], expected_porteurs)
        self.assertEqual(data["partenaires"], expected_partenaires)
        self.assertEqual(data["cohortes"], expected_cohortes)

        # Domaines avec nombre de projets
        self.assertTrue(len(data["domaines"]) >= 2)
        dom_agri_data = next(d for d in data["domaines"] if d["id"] == self.domaine_agri.id)
        self.assertEqual(dom_agri_data["nombre_projets"], self.domaine_agri.projets.count())

        # Test de mise en cache courte
        resp_cache = self.client.get("/api/portal/chiffres-cles/")
        self.assertEqual(resp_cache.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_cache.data["projets_incubes"], data["projets_incubes"])
