"""Remplit la base avec les actualités, événements, appels, partenaires et documents du CIAT.

Usage :
    python manage.py seed_portal
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.portal.models import (
    Actualite,
    AppelProjet,
    DocumentPublic,
    Evenement,
    Partenaire,
)


class Command(BaseCommand):
    help = "Initialise les contenus de démonstration pour le portail CIAT (T1, T2)."

    def handle(self, *args, **options):
        now = timezone.now()

        # 1. Actualités
        actu1, _ = Actualite.objects.get_or_create(
            slug="lancement-plateforme-ciat-360",
            defaults={
                "titre": "Lancement de la plateforme numérique unifiée de l'Écosystème CIAT 360",
                "resume": (
                    "L'ISEP Amadou Trawaré de Diamniadio déploie sa nouvelle infrastructure digitale "
                    "dédiée à l'incubation, à l'évaluation des prototypes et au transfert technologique."
                ),
                "contenu": (
                    "L'Institut Supérieur d'Enseignement Professionnel (ISEP) Amadou Trawaré de Diamniadio "
                    "marque une étape décisive dans son rayonnement national avec l'inauguration de la plateforme "
                    "numérique unifiée CIAT 360.\n\n"
                    "Conçue pour fédérer les six modules opérationnels du Centre d'Innovation, d'Application et "
                    "de Transfert, cette solution assure un suivi transparent des projets, du dépôt de l'idée "
                    "jusqu'au prototype validé et à la convention industrielle."
                ),
                "publie_le": now - timedelta(days=5),
            },
        )

        actu2, _ = Actualite.objects.get_or_create(
            slug="partenariat-strategique-transfert-technologique",
            defaults={
                "titre": "Signature d'un accord-cadre de transfert technologique avec le PTN",
                "resume": (
                    "Le CIAT et le Parc des Technologies Numériques de Diamniadio unissent leurs "
                    "capacités de calcul et de prototypage pour accélérer l'industrialisation des projets incubés."
                ),
                "contenu": (
                    "Ce partenariat stratégique permet aux incubés du CIAT d'accéder directement aux bancs "
                    "de test avancés du Data Center Tier III de Diamniadio et aux infrastructures cloud nationales.\n\n"
                    "Les premiers prototypes en incubation dans la filière 'TIC & IA' et 'Énergies Renouvelables' "
                    "bénéficieront d'un accompagnement conjoint assuré par les mentors du CIAT et les ingénieurs du PTN."
                ),
                "publie_le": now - timedelta(days=12),
            },
        )

        # 2. Événements
        Evenement.objects.get_or_create(
            titre="Journée Portes Ouvertes & Démonstrations de Prototypes CIAT 2026",
            defaults={
                "description": (
                    "Présentation des réalisations des cohortes en incubation, visites guidées des ateliers "
                    "de mécanique et démonstrations des bancs solaires en fonctionnement."
                ),
                "lieu": "Campus ISEP Amadou Trawaré, Cité du Savoir, Diamniadio",
                "debut": now + timedelta(days=14, hours=2),
                "fin": now + timedelta(days=14, hours=9),
                "lien_inscription": "https://ciat.sn/portail",
            },
        )

        Evenement.objects.get_or_create(
            titre="Séminaire Technique : Prototypage & Énergies Renouvelables au Sénégal",
            defaults={
                "description": (
                    "Masterclass sur les systèmes photovoltaïques autonomes, la maintenance prédictive "
                    "et les capteurs connectés pour l'agriculture locale."
                ),
                "lieu": "Laboratoire Génie Électrique & Solaire, CIAT Diamniadio",
                "debut": now + timedelta(days=25, hours=4),
                "fin": now + timedelta(days=25, hours=8),
                "lien_inscription": "https://ciat.sn/portail",
            },
        )

        # 3. Appels à projets
        AppelProjet.objects.get_or_create(
            titre="Appel à Candidatures — Cohorte d'Incubation 2026",
            defaults={
                "description": (
                    "Programme complet d'accompagnement de 6 mois pour transformer votre idée innovante "
                    "en prototype fonctionnel viable dans les 7 filières officielles du CIAT."
                ),
                "date_limite": now + timedelta(days=21),
                "pieces_demandees": [
                    "Fiche descriptive de projet (problème, solution, avancement)",
                    "Présentation détaillée de l'équipe et compétences",
                    "Budget prévisionnel des besoins en prototypage",
                ],
            },
        )

        AppelProjet.objects.get_or_create(
            titre="Session Spéciale — Maturation & Énergies Renouvelables 2025",
            defaults={
                "description": (
                    "Session d'accompagnement dédiée aux prototypes de séchoirs solaires et bancs d'essai énergétiques."
                ),
                "date_limite": now - timedelta(days=60),
                "pieces_demandees": [
                    "Rapport final de prototypage",
                    "Bilan de validation terrain",
                ],
            },
        )

        # 4. Partenaires
        Partenaire.objects.get_or_create(
            nom="Ministère de l'Enseignement Supérieur, de la Recherche et de l'Innovation (MESRI)",
            defaults={
                "site_web": "https://mesri.sec.gouv.sn",
                "description": "Tutelle institutionnelle soutenant l'ancrage académique et l'essor des centres d'innovation au Sénégal.",
                "ordre": 1,
            },
        )

        Partenaire.objects.get_or_create(
            nom="Délégation Générale à l'Entreprenariat Rapide (DER/FJ)",
            defaults={
                "site_web": "https://der.sn",
                "description": "Partenaire financier stratégique offrant des facilités d'amorçage pour les prototypes matures issus du CIAT.",
                "ordre": 2,
            },
        )

        Partenaire.objects.get_or_create(
            nom="Parc des Technologies Numériques de Diamniadio (PTN)",
            defaults={
                "site_web": "https://ptn.sn",
                "description": "Hub technologique offrant un accès aux infrastructures de calcul intensif et bancs IoT.",
                "ordre": 3,
            },
        )

        # 5. Documents publics
        DocumentPublic.objects.get_or_create(
            titre="Dossier de Candidature Officiel — Cohorte d'Incubation 2026",
            defaults={
                "categorie": "Candidatures & Formulaires",
            },
        )

        DocumentPublic.objects.get_or_create(
            titre="Charte de Propriété Intellectuelle & Transfert Technologique",
            defaults={
                "categorie": "Règlements & Chartes",
            },
        )

        DocumentPublic.objects.get_or_create(
            titre="Règlement Intérieur de l'Incubateur & Sécurité des Ateliers",
            defaults={
                "categorie": "Règlements & Chartes",
            },
        )

        # 6. Images de démonstration locales (Pillow)
        from apps.core.demo_images import generer_image_actualite, generer_logo_partenaire
        for actu in Actualite.objects.all():
            generer_image_actualite(actu)
        for part in Partenaire.objects.all():
            generer_logo_partenaire(part)

        self.stdout.write(self.style.SUCCESS(
            "Contenus de démonstration du portail (T1, T2) et visuels initialisés avec succès."
        ))
