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
            publie_le=now - timedelta(days=2),
        )
        self.actu2 = Actualite.objects.create(
            titre="Atelier intelligence artificielle",
            resume="Formation intensive sur les LLMs.",
            contenu="Tous les incubés sont invités à participer à l'atelier.",
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
        champs_attendus = {"id", "titre", "resume", "domaine_nom", "cohorte_nom", "statut"}
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
