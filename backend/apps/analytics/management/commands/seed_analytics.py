"""Commande de remplissage pour le suivi des partenariats et des financements du CIAT.

Usage :
    python manage.py seed_analytics

Règles de cohérence strictes :
- Seuls les projets sélectionnés, incubés, prototypes ou terminés bénéficient
  de partenariats et de financements.
- Les projets au statut 'idée' ou 'déposé' ne reçoivent JAMAIS de financement ni de partenariat.
- Les dates sont postérieures à la création / sélection des projets.
- Commande entièrement idempotente : relancer plusieurs fois ne crée aucun doublon.
"""
from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.core.models import Projet
from apps.analytics.models import (
    Financement,
    Partenariat,
    StatutFinancement,
    StatutPartenariat,
    TypePartenariat,
)

# Acteurs crédibles du tissu économique et institutionnel sénégalais
PARTENAIRES_DATA = [
    {
        "partenaire": "DER/FJ (Délégation Générale à l'Entreprenariat Rapide)",
        "type": TypePartenariat.FINANCIER,
        "description": "Appui institutionnel et co-financement des prototypes à fort impact local.",
    },
    {
        "partenaire": "Sonatel — Orange Fab Sénégal",
        "type": TypePartenariat.COMMERCIAL,
        "description": "Accès au réseau d'accélération télécoms, connectivité IoT et mentorat marché.",
    },
    {
        "partenaire": "GIZ Sénégal (Programme Réussir au Sénégal)",
        "type": TypePartenariat.TECHNIQUE,
        "description": "Expertise technique internationale, conformité environnementale et valorisation.",
    },
    {
        "partenaire": "FONGIP (Fonds de Garantie des Investissements Prioritaires)",
        "type": TypePartenariat.FINANCIER,
        "description": "Garantie de financement bancaire et bonification de prêts pour l'amorçage.",
    },
    {
        "partenaire": "ISEP Diamniadio (Laboratoires et Ateliers)",
        "type": TypePartenariat.ACADEMIQUE,
        "description": "Mise à disposition des plateaux techniques, bancs de tests et encadrement scientifique.",
    },
    {
        "partenaire": "3FPT (Fonds de Financement de la Formation Professionnelle)",
        "type": TypePartenariat.INSTITUTIONNEL,
        "description": "Prise en charge des formations techniques spécialisées pour l'équipe projet.",
    },
    {
        "partenaire": "Gainde 2000 (Pôle Innovation & Dématérialisation)",
        "type": TypePartenariat.TECHNIQUE,
        "description": "Accompagnement à l'architecture logicielle, interopérabilité et sécurité.",
    },
    {
        "partenaire": "Agence Française de Développement (AFD)",
        "type": TypePartenariat.FINANCIER,
        "description": "Facilité d'innovation pour les projets à transition écologique et énergétique.",
    },
    {
        "partenaire": "Centre de Suivi Écologique (CSE)",
        "type": TypePartenariat.TECHNIQUE,
        "description": "Données géospatiales, télédétection et validation d'impact environnemental.",
    },
    {
        "partenaire": "Enda Énergie / Enda Tiers-Monde",
        "type": TypePartenariat.COMMERCIAL,
        "description": "Déploiement en zones rurales, relations avec les coopératives et groupements.",
    },
    {
        "partenaire": "Banque Nationale pour le Développement Économique (BNDE)",
        "type": TypePartenariat.FINANCIER,
        "description": "Ligne de crédit d'amorçage pour acquisition d'équipements industriels.",
    },
    {
        "partenaire": "Association Sénégalaise de Normalisation (ASN)",
        "type": TypePartenariat.INSTITUTIONNEL,
        "description": "Certification des normes nationales de qualité et sécurité pour les prototypes.",
    },
]

SOURCES_FINANCEMENT = [
    {
        "source": "Fonds d'Amorçage DER/FJ",
        "montant": Decimal("5000000"),
        "description": "Subvention d'amorçage pour la réalisation du prototype fonctionnel.",
    },
    {
        "source": "Bourse d'Innovation CIAT - ISEP",
        "montant": Decimal("3000000"),
        "description": "Dotation matérielle et achat de composants électroniques pour tests en laboratoire.",
    },
    {
        "source": "Subvention GIZ Innovation & Transition",
        "montant": Decimal("10000000"),
        "description": "Financement d'équipements de production et audit énergétique.",
    },
    {
        "source": "Prêt d'Honneur FONGIP",
        "montant": Decimal("7500000"),
        "description": "Fonds de roulement sans garantie exigée pour la phase pilote commerciale.",
    },
    {
        "source": "Orange Fab Accélération",
        "montant": Decimal("12000000"),
        "description": "Ticket d'investissement d'accélération et subvention d'infrastructure cloud.",
    },
    {
        "source": "Facilité d'Investissement AFD Sénégal",
        "montant": Decimal("15000000"),
        "description": "Financement de l'industrialisation et de l'étude d'impact communautaire.",
    },
    {
        "source": "Fonds d'Appui 3FPT",
        "montant": Decimal("2500000"),
        "description": "Financement du plan de renforcement des compétences et certifications techniques.",
    },
    {
        "source": "Concours National de l'Innovation Numérique",
        "montant": Decimal("6000000"),
        "description": "Prix de l'innovation et dotation spéciale pour le prototypage avancé.",
    },
    {
        "source": "BNDE Ligne Amorçage PME",
        "montant": Decimal("20000000"),
        "description": "Crédit-bail pour l'acquisition de la ligne pilote de fabrication.",
    },
]


class Command(BaseCommand):
    help = "Remplit la base avec des partenariats et des financements cohérents et idempotents pour le CIAT."

    def handle(self, *args, **options):
        self.stdout.write("Génération des partenariats et financements réalistes...")

        # Règle stricte : uniquement des projets sélectionnés, incubés, prototypes ou terminés
        statuts_autorises = [
            Projet.Statut.SELECTIONNE,
            Projet.Statut.INCUBE,
            Projet.Statut.PROTOTYPE,
            Projet.Statut.TERMINE,
        ]

        projets_eligibles = (
            Projet.objects.filter(statut__in=statuts_autorises)
            .select_related("cohorte", "domaine", "porteur")
            .order_by("id")
        )

        total_eligibles = projets_eligibles.count()
        if total_eligibles == 0:
            self.stdout.write(
                self.style.WARNING(
                    "Aucun projet éligible trouvé (statut sélectionné, incubé, prototype ou terminé). "
                    "Exécutez d'abord 'python manage.py seed_demo'."
                )
            )
            return

        nb_partenariats_crees = 0
        nb_financements_crees = 0

        for i, projet in enumerate(projets_eligibles):
            # Date de création du projet servant de date pivot
            date_projet = projet.cree_le.date() if projet.cree_le else timezone.now().date()

            # 1. Génération de 1 à 2 partenariats par projet éligible (sur environ 75% des projets)
            if i % 4 != 3:  # 3 projets sur 4 ont au moins un partenariat
                part_template_1 = PARTENAIRES_DATA[i % len(PARTENAIRES_DATA)]
                date_part_1 = date_projet + timedelta(days=20 + (i % 15))

                # Statut cohérent avec l'avancement
                if projet.statut in (Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE):
                    statut_p1 = StatutPartenariat.ACTIF
                elif projet.statut == Projet.Statut.INCUBE:
                    statut_p1 = StatutPartenariat.ACTIF if i % 2 == 0 else StatutPartenariat.SIGNE
                else:
                    statut_p1 = StatutPartenariat.SIGNE if i % 2 == 0 else StatutPartenariat.EN_DISCUSSION

                _, created = Partenariat.objects.get_or_create(
                    projet=projet,
                    partenaire=part_template_1["partenaire"],
                    defaults={
                        "type": part_template_1["type"],
                        "date_debut": date_part_1,
                        "statut": statut_p1,
                        "description": part_template_1["description"],
                    },
                )
                if created:
                    nb_partenariats_crees += 1

                # Second partenariat pour certains projets matures (prototypes et terminés)
                if projet.statut in (Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE) and (i % 2 == 0):
                    part_template_2 = PARTENAIRES_DATA[(i + 5) % len(PARTENAIRES_DATA)]
                    date_part_2 = date_part_1 + timedelta(days=45)
                    _, created2 = Partenariat.objects.get_or_create(
                        projet=projet,
                        partenaire=part_template_2["partenaire"],
                        defaults={
                            "type": part_template_2["type"],
                            "date_debut": date_part_2,
                            "statut": StatutPartenariat.ACTIF,
                            "description": part_template_2["description"],
                        },
                    )
                    if created2:
                        nb_partenariats_crees += 1

            # 2. Génération de financements :
            # Les projets incubés, prototypes et terminés ont des financements accordés ou décaissés.
            # Les projets sélectionnés récents peuvent être en cours d'instruction.
            if projet.statut in (Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE):
                fin_template_1 = SOURCES_FINANCEMENT[i % len(SOURCES_FINANCEMENT)]
                date_fin_1 = date_projet + timedelta(days=30 + (i % 20))

                # Statut du financement :
                # Prototypes / terminés ont des financements décaissés
                # Incubés ont accordé ou décaissé
                if projet.statut in (Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE):
                    statut_f1 = StatutFinancement.DECAISSE
                elif projet.statut == Projet.Statut.INCUBE:
                    statut_f1 = StatutFinancement.DECAISSE if (i % 3 != 0) else StatutFinancement.ACCORDE
                else:
                    statut_f1 = StatutFinancement.EN_INSTRUCTION

                _, f_created = Financement.objects.get_or_create(
                    projet=projet,
                    source=fin_template_1["source"],
                    defaults={
                        "montant": fin_template_1["montant"],
                        "date": date_fin_1,
                        "statut": statut_f1,
                        "description": fin_template_1["description"],
                    },
                )
                if f_created:
                    nb_financements_crees += 1

                # Deuxième tranche de financement pour les projets prototypes
                if projet.statut == Projet.Statut.PROTOTYPE and (i % 2 == 1):
                    fin_template_2 = SOURCES_FINANCEMENT[(i + 4) % len(SOURCES_FINANCEMENT)]
                    date_fin_2 = date_fin_1 + timedelta(days=60)
                    _, f_created2 = Financement.objects.get_or_create(
                        projet=projet,
                        source=fin_template_2["source"],
                        defaults={
                            "montant": fin_template_2["montant"],
                            "date": date_fin_2,
                            "statut": StatutFinancement.DECAISSE,
                            "description": fin_template_2["description"],
                        },
                    )
                    if f_created2:
                        nb_financements_crees += 1

            elif projet.statut == Projet.Statut.SELECTIONNE and (i % 3 == 0):
                # Quelques projets sélectionnés en cours d'instruction de dossier de financement
                fin_template_sel = SOURCES_FINANCEMENT[(i + 1) % len(SOURCES_FINANCEMENT)]
                date_fin_sel = date_projet + timedelta(days=15)
                _, f_created_sel = Financement.objects.get_or_create(
                    projet=projet,
                    source=fin_template_sel["source"],
                    defaults={
                        "montant": fin_template_sel["montant"],
                        "date": date_fin_sel,
                        "statut": StatutFinancement.EN_INSTRUCTION,
                        "description": "Dossier de subvention en cours d'instruction par le comité technique.",
                    },
                )
                if f_created_sel:
                    nb_financements_crees += 1

        total_partenariats = Partenariat.objects.count()
        partenariats_actifs = Partenariat.objects.filter(statut=StatutPartenariat.ACTIF).count()
        total_financements = Financement.objects.count()
        from django.db.models import Sum
        somme_financements = (
            Financement.objects.exclude(statut=StatutFinancement.REFUSE).aggregate(Sum("montant"))["montant__sum"] or 0
        )
        somme_decaisses = (
            Financement.objects.filter(statut=StatutFinancement.DECAISSE).aggregate(Sum("montant"))["montant__sum"] or 0
        )

        self.stdout.write(self.style.SUCCESS("Données analytics prêtes et cohérentes (idempotent) :"))
        self.stdout.write(f"- Partenariats : {total_partenariats} enregistrés ({partenariats_actifs} actifs, {nb_partenariats_crees} créés ce passage)")
        self.stdout.write(f"- Financements : {total_financements} lignes ({nb_financements_crees} créées ce passage)")
        self.stdout.write(f"- Montant total mobilisé : {somme_financements:,.0f} FCFA (dont {somme_decaisses:,.0f} FCFA décaissés)")
