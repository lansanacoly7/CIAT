"""Peuple la Galerie des innovations avec des fiches représentatives du CIAT.

Usage :
    python manage.py seed_gallery
"""
from django.core.management.base import BaseCommand
from apps.core.models import Projet
from apps.gallery.models import FicheInnovation


FICHES_DATA = [
    {
        "slug": "agrisol-pompe-solaire-connectee",
        "titre": "AgriSol — Pompes Solaires Connectées & Micro-Irrigation Intelligente",
        "projet_filtre": {"titre__icontains": "MicroHydro"}, # fallback to any project if not exact
        "probleme": (
            "Dans la vallée du fleuve Sénégal et les Niayes, le coût prohibitif du carburant "
            "pour motopompes et l'épuisement des nappes phréatiques menacent la rentabilité des petits maraîchers."
        ),
        "solution": (
            "AgriSol combine une station de pompage solaire photovoltaïque avec un réseau de capteurs d'humidité "
            "des sols IoT et une vanne connectée LoRaWAN. L'irrigation est déclenchée automatiquement aux heures "
            "optimales, réduisant de 40 % la consommation d'eau et éliminant tout recours aux hydrocarbures."
        ),
        "equipe": "Aminata Diallo (Ingénieure Agronome, ISEP), Cheikh Ndiaye (Architecte IoT & Électronique), Babacar Sy (Développement Mobile)",
        "avancement": "Prototype",
        "statut": FicheInnovation.Statut.PUBLIE,
        "vues": 142,
        "medias": [
            {"type": "photo", "url": "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80"},
            {"type": "photo", "url": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80"},
            {"type": "demo", "url": "https://demo.agrisol.sn"},
            {"type": "video", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
        ],
    },
    {
        "slug": "sunudoc-telemedecine-langues-nationales",
        "titre": "SunuDoc — Téléconsultation Médicale et Triage Assisté en Langues Locales",
        "projet_filtre": {"titre__icontains": "Chambre d'Isothermie"},
        "probleme": (
            "Plus de 60 % des populations rurales au Sénégal font face à des déserts médicaux et à une barrière "
            "linguistique lors des consultations médicales d'urgence ou de suivi prénatal."
        ),
        "solution": (
            "SunuDoc est une station de télé-diagnostic mobile intégrant des capteurs physiologiques (stéthoscope numérique, "
            "oxymètre, ECG) et une interface vocale multilingue (Wolof, Pulaar, Sérère, Français) capable de guider "
            "l'infirmier de poste et de transférer les bilans aux spécialistes du CHU de Fann."
        ),
        "equipe": "Dr. Fatou Sow (Médecine communautaire), Moussa Ba (Ingénieur Intelligence Artificielle), Aïcha Faye (UX & Linguistique)",
        "avancement": "MVP",
        "statut": FicheInnovation.Statut.PUBLIE,
        "vues": 289,
        "medias": [
            {"type": "photo", "url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"},
            {"type": "photo", "url": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80"},
            {"type": "demo", "url": "https://sunudoc.ciat-demo.sn"},
        ],
    },
    {
        "slug": "jumeau-numerique-ateliers-isep",
        "titre": "Jumeau Numérique des Ateliers ISEP pour Télé-Enseignement et Maintenance Virtuelle",
        "projet_filtre": {"titre__icontains": "Jumeau Numérique"},
        "probleme": (
            "L'accès limité aux machines-outils de haute précision restreint le temps de pratique des apprenants "
            "dans les instituts professionnels et centres de formation technique décentralisés."
        ),
        "solution": (
            "Plateforme immersive 3D reproduisant fidèlement les ateliers d'usinage et de chaudronnerie de l'ISEP Diamniadio. "
            "Les élèves réalisent des opérations de maintenance, de diagnostic de panne et de découpe numérique en réalité "
            "virtuelle avant manipulation physique sur machine réelle."
        ),
        "equipe": "Mamadou Lamine Diagne (Conception mécanique 3D), Ousmane Sène (Développeur Unity/WebGL), Khady Ndao (Pédagogie professionnelle)",
        "avancement": "Prototype",
        "statut": FicheInnovation.Statut.PUBLIE,
        "vues": 310,
        "medias": [
            {"type": "photo", "url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"},
            {"type": "demo", "url": "https://jumeau-ateliers.isep.sn"},
        ],
    },
    {
        "slug": "kayar-trace-tracabilite-peche-artisanale",
        "titre": "Kayar Trace — Traçabilité Numérique et Chaîne de Froid de la Pêche Artisanale",
        "projet_filtre": {"titre__icontains": "Kayar Trace"},
        "probleme": (
            "Près de 30 % des captures de la pêche artisanale sénégalaise subissent des avaries avant commercialisation "
            "faute de chaîne de froid tracée et de valorisation transparente auprès des mareyeurs."
        ),
        "solution": (
            "Balises isothermes communicantes équipées de thermocapteurs et enregistrement décentralisé infalsifiable "
            "du trajet piroguier et de la température de conservation, certifiant la fraîcheur des poissons jusqu'au débarcadère."
        ),
        "equipe": "Abdoulaye Guèye (Génie logiciel maritime), Souleymane Mbaye (Électronique embarquée), Mariama Diallo (Économie halieutique)",
        "avancement": "Pilote",
        "statut": FicheInnovation.Statut.PUBLIE,
        "vues": 195,
        "medias": [
            {"type": "photo", "url": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80"},
            {"type": "photo", "url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80"},
            {"type": "demo", "url": "https://kayartrace.ciat-labs.org"},
        ],
    },
    {
        "slug": "presse-compacte-huile-arachide-sesame",
        "titre": "Presse Compacte Éco-Énergétique pour Oléagineux Locaux (Arachide & Sésame)",
        "projet_filtre": {"titre__icontains": "Presse Compacte"},
        "probleme": (
            "L'extraction artisanale de l'huile dans le bassin arachidier reste manuelle, pénible et peu productive, "
            "tandis que les équipements industriels importés sont inadaptés aux groupements féminins villageois."
        ),
        "solution": (
            "Presse à vis modulaire en acier inoxydable alimentaire, actionnée par un moteur basse consommation "
            "ou couplable à l'énergie solaire. Conception locale réparable avec pièces interchangeables fabriquées à l'atelier ISEP."
        ),
        "equipe": "Ibrahima Cissé (Ingénieur mécanique & usinage), Salimata Touré (Coopérative de transformation agroalimentaire)",
        "avancement": "Déploiement",
        "statut": FicheInnovation.Statut.PUBLIE,
        "vues": 412,
        "medias": [
            {"type": "photo", "url": "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80"},
            {"type": "video", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
        ],
    },
    {
        "slug": "incubateur-neonatal-low-cost-maternites",
        "titre": "NéoCiat — Couveuse Néonatale Connectée et Résiliente aux Coupures Électriques",
        "projet_filtre": {"titre__icontains": "Incubateur Nonatal"},
        "probleme": (
            "La mortalité néonatale par hypothermie touche de nombreux nouveau-nés prématurés dans les postes de santé ruraux "
            "dépourvus de couveuses adaptées aux micro-coupures de courant et à la chaleur sahélienne."
        ),
        "solution": (
            "Couveuse thermique à matériaux à changement de phase (MCP) maintenant une température constante de 37°C pendant "
            "6 heures sans électricité. Équipée d'un photothérapique LED et d'une alarme connectée par SMS aux sages-femmes."
        ),
        "equipe": "Dr. Arame Diop (Pédiatrie & Santé publique), Jean-Pierre Mendy (Biomédical & Régulation thermique)",
        "avancement": "Pilote",
        "statut": FicheInnovation.Statut.PUBLIE,
        "vues": 528,
        "medias": [
            {"type": "photo", "url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80"},
            {"type": "photo", "url": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80"},
            {"type": "demo", "url": "https://neociat.sante.sn"},
        ],
    },
    {
        "slug": "smarttax-collect-fiscalite-locale-marches",
        "titre": "SmartTax Collect — Recouvrement Numérique et Traçable des Droits de Place",
        "projet_filtre": {"titre__icontains": "SmartTax Collect"},
        "probleme": (
            "Les collectivités territoriales perdent jusqu'à 50 % des recettes des marchés forains en raison du paiement "
            "en liquide avec tickets manuels, sources de fraudes et d'opacité comptable."
        ),
        "solution": (
            "Terminaux durcis POS avec impression de reçus QR Code sécurisés et synchronisation hors-ligne. "
            "Les commerçants paient par porte-monnaie électronique (Wave, Orange Money) ou liquide avec journalisation inviolable."
        ),
        "equipe": "Alioune Badara Diop (Fintech & Systèmes distribués), Ndeye Fatou Kane (Gouvernance locale & Économie)",
        "avancement": "MVP",
        "statut": FicheInnovation.Statut.PUBLIE,
        "vues": 178,
        "medias": [
            {"type": "photo", "url": "https://images.unsplash.com/photo-1556742049-0a67e557224e?auto=format&fit=crop&w=1200&q=80"},
            {"type": "demo", "url": "https://smarttax.demo-collectivites.sn"},
        ],
    },
    {
        "slug": "kit-robotique-pedagogique-lycees-techniques",
        "titre": "RoboSen — Kit Robotique Modulaire en Bois et Plastique Recyclé pour Lycées",
        "projet_filtre": {"titre__icontains": "Kit Robotique"},
        "probleme": (
            "Le coût d'acquisition des robots éducatifs étrangers interdit leur adoption dans les collèges et lycées "
            "techniques sénégalais, limitant l'éveil aux sciences et à la programmation."
        ),
        "solution": (
            "Châssis découpé au laser dans du contreplaqué local ou imprimé en 3D avec plastique recyclé, motorisé "
            "par une carte microcontrôleur programmable par blocs (Scratch/Blockly) en langues locales."
        ),
        "equipe": "Serigne Mor Fall (Mécatronique & Éducation STEM), Astou Badiane (Ingénierie des matériaux recyclés)",
        "avancement": "Déploiement",
        "statut": FicheInnovation.Statut.PUBLIE,
        "vues": 265,
        "medias": [
            {"type": "photo", "url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80"},
            {"type": "photo", "url": "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1200&q=80"},
            {"type": "video", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
        ],
    },
    # Fiches non publiées pour vérifier le comportement d'exclusion et de 404
    {
        "slug": "prototype-secret-drone-surveillance-champs",
        "titre": "Projet Drone Maraîcher — Surveillance Multispectrale des Parasites (Brouillon)",
        "projet_filtre": {"titre__icontains": "Drone"},
        "probleme": "Attaques parasitaires non détectées à temps sur les parcelles de mangues et d'oignons.",
        "solution": "Surveillance par drone équipé d'une caméra multispectrale.",
        "equipe": "Équipe Alpha (Brouillon interne)",
        "avancement": "Idée",
        "statut": FicheInnovation.Statut.BROUILLON,
        "vues": 0,
        "medias": [],
    },
    {
        "slug": "biogaz-dechets-marches-poissons",
        "titre": "BioÉnergie Soumbédioune — Valorisation des Déchets de Poisson en Biogaz (En validation)",
        "projet_filtre": {"titre__icontains": "Biogaz"},
        "probleme": "Accumulation insalubre de viscères et déchets organiques sur les quais de débarquement.",
        "solution": "Méthaniseur continu anaérobie produisant du gaz de cuisson et du compost bio.",
        "equipe": "Khaled Seck, Mame Diarra Bousso",
        "avancement": "Prototype",
        "statut": FicheInnovation.Statut.EN_VALIDATION,
        "vues": 0,
        "medias": [],
    },
]


class Command(BaseCommand):
    help = "Initialise des fiches d'innovation de démonstration pour la galerie publique (P6)."

    def handle(self, *args, **options):
        projets = list(Projet.objects.all())
        if not projets:
            self.stderr.write("Aucun projet trouvé. Veuillez lancer 'python manage.py seed_demo' d'abord.")
            return

        total_creees = 0
        total_mises_a_jour = 0

        for idx, item in enumerate(FICHES_DATA):
            # Trouver un projet adapté
            filtre = item.get("projet_filtre", {})
            projet = Projet.objects.filter(**filtre).first()
            if not projet:
                # Fallback : prendre le projet par index modulo le total
                projet = projets[idx % len(projets)]

            defaults = {
                "projet": projet,
                "titre": item["titre"],
                "probleme": item["probleme"],
                "solution": item["solution"],
                "equipe": item["equipe"],
                "avancement": item["avancement"],
                "medias": item["medias"],
                "statut": item["statut"],
                "vues": item["vues"],
            }

            fiche, created = FicheInnovation.objects.get_or_create(
                slug=item["slug"],
                defaults=defaults,
            )

            if not created:
                for k, v in defaults.items():
                    setattr(fiche, k, v)
                fiche.save()
                total_mises_a_jour += 1
            else:
                total_creees += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Galerie initialisée avec succès : {total_creees} créée(s), {total_mises_a_jour} mise(s) à jour."
            )
        )
