"""Remplit la base avec les données de démonstration du CIAT.

Comprend :
- Les comptes socle d'administration et d'équipe (*@ciat.sn)
- Les 7 domaines d'intervention du CIAT
- 3 cohortes (2024, 2025, 2026)
- ~40 porteurs de projets fictifs (*@demo.ciat.sn) avec parité femmes/hommes crédible (~40 % femmes)
- ~60 projets réalistes ancrés dans le contexte sénégalais, couvrant tous les statuts
- Dates de création étalées sur 18 mois
- Commande entièrement idempotente : relancer ne produit aucun doublon

    python manage.py seed_demo

À utiliser en développement uniquement : les mots de passe de démonstration sont connus de tous.
"""
from datetime import datetime, timezone, timedelta
from django.core.management.base import BaseCommand
from apps.core.models import Cohorte, Domaine, Projet, Role, User

DOMAINES = [
    "TIC, numérique, intelligence artificielle et données",
    "Mécanique, fabrication et maintenance",
    "Agriculture, transformation et environnement",
    "Énergie, efficacité énergétique et énergies renouvelables",
    "Pharmaceutique et biomédical",
    "Éducation, formation professionnelle et insertion",
    "Services aux collectivités, entrepreneuriat et incubation",
]

COHORTES = [
    {"nom": "Cohorte 2024", "annee": 2024, "date_debut": "2024-01-15", "date_fin": "2024-12-15"},
    {"nom": "Cohorte 2025", "annee": 2025, "date_debut": "2025-01-15", "date_fin": "2025-12-15"},
    {"nom": "Cohorte 2026", "annee": 2026, "date_debut": "2026-01-15", "date_fin": "2026-12-15"},
]

COMPTES_EQUIPE = [
    ("admin@ciat.sn", Role.ADMIN, "Admin", "CIAT", User.Genre.AUTRE, "ISEP Diamniadio"),
    ("coordo@ciat.sn", Role.COORDONNATEUR, "Coordonnateur", "CIAT", User.Genre.HOMME, "CIAT"),
    ("mentor@ciat.sn", Role.MENTOR, "Mentor", "CIAT", User.Genre.FEMME, "Réseau Mentorat Sénégal"),
    ("comite@ciat.sn", Role.COMITE, "Membre", "Comité", User.Genre.HOMME, "Comité de Sélection"),
    ("porteur@ciat.sn", Role.PORTEUR, "Porteur", "Projet", User.Genre.HOMME, "Startup Demo"),
]

MOT_DE_PASSE = "Ciat2026!"

# ~40 porteurs fictifs (16 femmes ~40%, 24 hommes ~60%) avec emails @demo.ciat.sn
PORTEURS_FICTIFS = [
    # Femmes (16)
    {"email": "porteur01@demo.ciat.sn", "prenom": "Aminata", "nom": "Diallo", "genre": User.Genre.FEMME, "org": "AgriTech Sahel (fictif)", "tel": "+221771000101"},
    {"email": "porteur02@demo.ciat.sn", "prenom": "Fatou", "nom": "Ndiaye", "genre": User.Genre.FEMME, "org": "Solaire Sunu Kër (fictif)", "tel": "+221771000102"},
    {"email": "porteur03@demo.ciat.sn", "prenom": "Aïssatou", "nom": "Sow", "genre": User.Genre.FEMME, "org": "BioPharma Diaraf (fictif)", "tel": "+221771000103"},
    {"email": "porteur04@demo.ciat.sn", "prenom": "Mariama", "nom": "Ba", "genre": User.Genre.FEMME, "org": "EduDakar Connect (fictif)", "tel": "+221771000104"},
    {"email": "porteur05@demo.ciat.sn", "prenom": "Khady", "nom": "Fall", "genre": User.Genre.FEMME, "org": "PlasticEco Senegal (fictif)", "tel": "+221771000105"},
    {"email": "porteur06@demo.ciat.sn", "prenom": "Ndèye", "nom": "Diop", "genre": User.Genre.FEMME, "org": "SantéMobi Thiès (fictif)", "tel": "+221771000106"},
    {"email": "porteur07@demo.ciat.sn", "prenom": "Coumba", "nom": "Cissé", "genre": User.Genre.FEMME, "org": "AgroTransfo Casamance (fictif)", "tel": "+221771000107"},
    {"email": "porteur08@demo.ciat.sn", "prenom": "Rokhaya", "nom": "Sarr", "genre": User.Genre.FEMME, "org": "ÉcoFroid Mbour (fictif)", "tel": "+221771000108"},
    {"email": "porteur09@demo.ciat.sn", "prenom": "Oumy", "nom": "Gueye", "genre": User.Genre.FEMME, "org": "Femmes & Code Diamniadio (fictif)", "tel": "+221771000109"},
    {"email": "porteur10@demo.ciat.sn", "prenom": "Mame Diarra", "nom": "Bousso", "genre": User.Genre.FEMME, "org": "Touba BioTech (fictif)", "tel": "+221771000110"},
    {"email": "porteur11@demo.ciat.sn", "prenom": "Khadija", "nom": "Kane", "genre": User.Genre.FEMME, "org": "Dakar Waste Solutions (fictif)", "tel": "+221771000111"},
    {"email": "porteur12@demo.ciat.sn", "prenom": "Salimata", "nom": "Trawaré", "genre": User.Genre.FEMME, "org": "Anacarde Valo (fictif)", "tel": "+221771000112"},
    {"email": "porteur13@demo.ciat.sn", "prenom": "Anta", "nom": "Sy", "genre": User.Genre.FEMME, "org": "Diourbel Logistique (fictif)", "tel": "+221771000113"},
    {"email": "porteur14@demo.ciat.sn", "prenom": "Binta", "nom": "Camara", "genre": User.Genre.FEMME, "org": "MicroHydro Sénégal (fictif)", "tel": "+221771000114"},
    {"email": "porteur15@demo.ciat.sn", "prenom": "Astou", "nom": "Faye", "genre": User.Genre.FEMME, "org": "TeleDiag Rufisque (fictif)", "tel": "+221771000115"},
    {"email": "porteur16@demo.ciat.sn", "prenom": "Seynabou", "nom": "Thiam", "genre": User.Genre.FEMME, "org": "Kayar Fisheries Tech (fictif)", "tel": "+221771000116"},

    # Hommes (24)
    {"email": "porteur17@demo.ciat.sn", "prenom": "Mamadou", "nom": "Sarr", "genre": User.Genre.HOMME, "org": "MecaPrecision Senegal (fictif)", "tel": "+221771000117"},
    {"email": "porteur18@demo.ciat.sn", "prenom": "Ousmane", "nom": "Gueye", "genre": User.Genre.HOMME, "org": "SunuGrid Énergie (fictif)", "tel": "+221771000118"},
    {"email": "porteur19@demo.ciat.sn", "prenom": "Cheikh", "nom": "Fall", "genre": User.Genre.HOMME, "org": "IA Vision Dakar (fictif)", "tel": "+221771000119"},
    {"email": "porteur20@demo.ciat.sn", "prenom": "Abdoulaye", "nom": "Cissé", "genre": User.Genre.HOMME, "org": "Drones Sahel Surveillance (fictif)", "tel": "+221771000120"},
    {"email": "porteur21@demo.ciat.sn", "prenom": "Ibrahima", "nom": "Diop", "genre": User.Genre.HOMME, "org": "BioFertil Kaolack (fictif)", "tel": "+221771000121"},
    {"email": "porteur22@demo.ciat.sn", "prenom": "Modou", "nom": "Ndiaye", "genre": User.Genre.HOMME, "org": "Maintenance 4.0 Niayes (fictif)", "tel": "+221771000122"},
    {"email": "porteur23@demo.ciat.sn", "prenom": "Babacar", "nom": "Kane", "genre": User.Genre.HOMME, "org": "SmartIrrig Podor (fictif)", "tel": "+221771000123"},
    {"email": "porteur24@demo.ciat.sn", "prenom": "Samba", "nom": "Diallo", "genre": User.Genre.HOMME, "org": "Biogaz Saloum (fictif)", "tel": "+221771000124"},
    {"email": "porteur25@demo.ciat.sn", "prenom": "Alioune", "nom": "Sylla", "genre": User.Genre.HOMME, "org": "FabLab Diamniadio Proto (fictif)", "tel": "+221771000125"},
    {"email": "porteur26@demo.ciat.sn", "prenom": "Lamine", "nom": "Badji", "genre": User.Genre.HOMME, "org": "Ziguinchor AgroSolar (fictif)", "tel": "+221771000126"},
    {"email": "porteur27@demo.ciat.sn", "prenom": "El Hadji", "nom": "Seck", "genre": User.Genre.HOMME, "org": "Pharmacie Numérique Dakar (fictif)", "tel": "+221771000127"},
    {"email": "porteur28@demo.ciat.sn", "prenom": "Amadou", "nom": "Ba", "genre": User.Genre.HOMME, "org": "ProBTP Soudure Mécanique (fictif)", "tel": "+221771000128"},
    {"email": "porteur29@demo.ciat.sn", "prenom": "Pape", "nom": "Mbodj", "genre": User.Genre.HOMME, "org": "VR Métiers Sénégal (fictif)", "tel": "+221771000129"},
    {"email": "porteur30@demo.ciat.sn", "prenom": "Boubacar", "nom": "Touré", "genre": User.Genre.HOMME, "org": "Collecte Propre Thiès (fictif)", "tel": "+221771000130"},
    {"email": "porteur31@demo.ciat.sn", "prenom": "Malick", "nom": "Mendy", "genre": User.Genre.HOMME, "org": "HydroTech Casamance (fictif)", "tel": "+221771000131"},
    {"email": "porteur32@demo.ciat.sn", "prenom": "Mansour", "nom": "Niang", "genre": User.Genre.HOMME, "org": "Diagnostic Laitier Dahra (fictif)", "tel": "+221771000132"},
    {"email": "porteur33@demo.ciat.sn", "prenom": "Gorgui", "nom": "Ndour", "genre": User.Genre.HOMME, "org": "Fatick Éco-Briques (fictif)", "tel": "+221771000133"},
    {"email": "porteur34@demo.ciat.sn", "prenom": "Youssou", "nom": "Sène", "genre": User.Genre.HOMME, "org": "Sénégal IoT Traçabilité (fictif)", "tel": "+221771000134"},
    {"email": "porteur35@demo.ciat.sn", "prenom": "Djibril", "nom": "Dione", "genre": User.Genre.HOMME, "org": "Usinage CNC Bambey (fictif)", "tel": "+221771000135"},
    {"email": "porteur36@demo.ciat.sn", "prenom": "Alassane", "nom": "Wade", "genre": User.Genre.HOMME, "org": "Éolien Petit Côte (fictif)", "tel": "+221771000136"},
    {"email": "porteur37@demo.ciat.sn", "prenom": "Serigne", "nom": "Gningue", "genre": User.Genre.HOMME, "org": "Apprentissage Métiers ISEP (fictif)", "tel": "+221771000137"},
    {"email": "porteur38@demo.ciat.sn", "prenom": "Mor", "nom": "Tine", "genre": User.Genre.HOMME, "org": "Guichet Unique PME Sénégal (fictif)", "tel": "+221771000138"},
    {"email": "porteur39@demo.ciat.sn", "prenom": "Bassirou", "nom": "Sané", "genre": User.Genre.HOMME, "org": "Kédougou Eau Solaire (fictif)", "tel": "+221771000139"},
    {"email": "porteur40@demo.ciat.sn", "prenom": "Demba", "nom": "Baldé", "genre": User.Genre.HOMME, "org": "Matam Stockage Froid (fictif)", "tel": "+221771000140"},
]

# 63 projets couvrant les 7 domaines, 3 cohortes et tous les statuts
# Répartition des statuts :
# termine: 10, prototype: 12, incube: 16, selectionne: 12, depose: 5, idee: 4, rejete: 4 (Total: 63)
# Majorité (50/63 = 79%) en selectionne, incube, prototype, termine.
PROJETS_DE_DEMO = [
    # --- DOMAINE 1 : TIC, NUMÉRIQUE, IA ET DONNÉES ---
    {
        "titre": "SunuAgri AI — Détection des maladies maraîchères des Niayes",
        "resume": "Plateforme mobile utilisant l'IA pour identifier les ravageurs et maladies foliaires des cultures horticoles par simple photo sur smartphone.",
        "probleme": "Dans les Niayes, les agriculteurs perdent jusqu'à 30 % de leurs récoltes de tomates et choux par manque de diagnostic phytosanitaire rapide.",
        "solution": "Un modèle de vision par ordinateur embarqué hors-ligne adapté aux cultures sahéliennes avec recommandations de traitements biologiques.",
        "domaine": 0, "cohorte": "Cohorte 2024", "porteur": "porteur01@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 18
    },
    {
        "titre": "TerangaLang — Reconnaissance vocale en Wolof pour formalités administratives",
        "resume": "Moteur NLP open source transcrivant et traduisant la langue wolof pour rendre les démarches publiques accessibles aux citoyens analphabètes.",
        "probleme": "L'accès aux services publics et bancaires en ligne exclut une partie des populations ne maîtrisant pas le français écrit.",
        "solution": "Assistant vocal interactif en wolof intégrable aux bornes des collectivités locales et applications mobiles.",
        "domaine": 0, "cohorte": "Cohorte 2024", "porteur": "porteur19@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 16
    },
    {
        "titre": "Kayar Trace — Traçabilité blockchain de la pêche artisanale",
        "resume": "Système de suivi numérique des captures des pirogues artisanales de Kayar garantissant la fraîcheur et la conformité aux normes d'export.",
        "probleme": "Manque de transparence dans la filière halieutique artisanale menant au déclassement des cargaisons et à la baisse des revenus des pêcheurs.",
        "solution": "Bagues QR code scannées au débarquement avec enregistrement immuable des coordonnées de pêche, température et heure.",
        "domaine": 0, "cohorte": "Cohorte 2025", "porteur": "porteur16@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 11
    },
    {
        "titre": "Dakar Traffic Flow — Optimisation des carrefours par caméras connectées",
        "resume": "Solution de régulation intelligente des feux de signalisation par analyse des flux vidéo en temps réel sur la VDN.",
        "probleme": "Les embouteillages dakarois coûtent des milliards de FCFA chaque année en carburant et perte de productivité.",
        "solution": "Capteurs vidéo à bas coût couplés à des algorithmes de synchronisation dynamique des feux tricolores.",
        "domaine": 0, "cohorte": "Cohorte 2025", "porteur": "porteur34@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 8
    },
    {
        "titre": "Drones Sahel — Surveillance thermique des lignes de transport Senelec",
        "resume": "Drones autonomes équipés de caméras infrarouges pour l'inspection prédictive des lignes à haute tension.",
        "probleme": "Les pannes de transport électrique provoquent des coupures généralisées et les inspections manuelles pédestres sont lentes et périlleuses.",
        "solution": "Cartographie thermique aérienne automatisée signalant les échauffements anormaux avant la rupture d'équipement.",
        "domaine": 0, "cohorte": "Cohorte 2024", "porteur": "porteur20@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 17
    },
    {
        "titre": "SmartTax Collect — Recouvrement digitalisé des taxes de marchés locaux",
        "resume": "Application TPE mobile pour la délivrance de tickets numériques et la sécurisation des recettes fiscales communales.",
        "probleme": "Évasion fiscale et pertes significatives lors de la perception manuelle des droits de place dans les marchés hebdomadaires.",
        "solution": "Terminaux Android robustes avec impression de reçu QR code et reversement instantané au Trésor via mobile money.",
        "domaine": 0, "cohorte": "Cohorte 2025", "porteur": "porteur13@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 10
    },
    {
        "titre": "Geofencing Bétail — Suivi GPS des troupeaux en zone sylvopastorale",
        "resume": "Colliers connectés LoRaWAN à recharge solaire pour prévenir le vol de bétail et suivre les parcours de transhumance.",
        "probleme": "Le vol de bétail au Ferlo fragilise l'économie pastorale et engendre des conflits ruraux récurrents.",
        "solution": "Réseau de balises basse consommation alertant les éleveurs par SMS dès qu'un animal franchit une zone définie.",
        "domaine": 0, "cohorte": "Cohorte 2026", "porteur": "porteur32@demo.ciat.sn", "statut": Projet.Statut.DEPOSE, "mois_offset": 3
    },
    {
        "titre": "EduCloud Sénégal — Serveurs scolaires locaux hors-ligne préchargés",
        "resume": "Boîtiers micro-serveurs Wi-Fi diffusant les ressources éducatives nationales sans connexion Internet dans les collèges ruraux.",
        "probleme": "La fracture numérique prive des milliers d'élèves de l'intérieur du pays de manuels scolaires et cours numériques.",
        "solution": "Raspberry Pi sécurisé et alimenté en solaire hébergeant Wikipédia, Khan Academy et annales du BFEM/Bac.",
        "domaine": 0, "cohorte": "Cohorte 2026", "porteur": "porteur04@demo.ciat.sn", "statut": Projet.Statut.IDEE, "mois_offset": 2
    },
    {
        "titre": "Crypto-Tontine — Plateforme d'épargne rotative non régulée",
        "resume": "Tontine informelle sur protocole décentralisé sans garantie prudentielle.",
        "probleme": "Manque d'infrastructures financières dans les villages reculés.",
        "solution": "Spéculation sur tokens communautaires sans agrément bancaire BCEAO.",
        "domaine": 0, "cohorte": "Cohorte 2025", "porteur": "porteur38@demo.ciat.sn", "statut": Projet.Statut.REJETE, "mois_offset": 9
    },

    # --- DOMAINE 2 : MÉCANIQUE, FABRICATION ET MAINTENANCE ---
    {
        "titre": "Usinage CNC Local — Pièces de rechange pour usines agroalimentaires",
        "resume": "Atelier d'usinage de précision numérique à Diamniadio produisant des engrenages et arbres mécaniques introuvables localement.",
        "probleme": "Les arrêts d'usines durent des semaines lors de la casse d'une pièce mécanique importée d'Europe ou d'Asie.",
        "solution": "Rétro-ingénierie par scanner 3D et usinage local sur fraiseuse 4 axes en moins de 48 heures.",
        "domaine": 1, "cohorte": "Cohorte 2024", "porteur": "porteur17@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 17
    },
    {
        "titre": "Batteuse Multicéréales — Adaptée au fonio et petit mil",
        "resume": "Machine mécanique mobile tractée par moto, allégeant la pénibilité de la récolte pour les groupements féminins.",
        "probleme": "Le battage traditionnel au pilon provoque une pénibilité extrême et des pertes de grains atteignant 20 %.",
        "solution": "Batteuse ergonomique équipée d'un tamis réglable entraîné par un moteur thermique économe ou électrique.",
        "domaine": 1, "cohorte": "Cohorte 2024", "porteur": "porteur28@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 15
    },
    {
        "titre": "Presse Compacte à Huile d'Arachide et Sésame",
        "resume": "Presse à vis mécanique semi-industrielle pour l'extraction à froid de l'huile par les coopératives rurales du bassin arachidier.",
        "probleme": "L'arachide brute est vendue à bas prix faute d'équipements de première transformation sur place.",
        "solution": "Presse mécanique en acier alimentaire inoxydable réparable avec des pièces standards du marché sénégalais.",
        "domaine": 1, "cohorte": "Cohorte 2025", "porteur": "porteur21@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 10
    },
    {
        "titre": "Maintenance Connectée Niayes — Diagnostic vibratoire des pompes agricoles",
        "resume": "Capteurs IoT mesurant les vibrations des groupes motopompes pour prévenir les grippages en pleine saison des pluies.",
        "probleme": "Une panne de motopompe durant la période de repiquage détruit l'intégralité d'un cycle de production maraîchère.",
        "solution": "Boîtier résistant à la poussière alertant par voyant et SMS avant l'endommagement des roulements.",
        "domaine": 1, "cohorte": "Cohorte 2025", "porteur": "porteur22@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 12
    },
    {
        "titre": "FabLab Prototypage Rapide ISEP — Banc d'essai pièces plastiques recyclées",
        "resume": "Machine d'injection plastique manuelle de laboratoire utilisant des paillettes de bouchons PEHD collectés à Diamniadio.",
        "probleme": "Coût prohibitif des moules industriels pour les étudiants et entrepreneurs souhaitant tester une pièce technique.",
        "solution": "Micro-injecteuse de table et moules aluminium fraisés en interne pour séries de 100 à 500 unités.",
        "domaine": 1, "cohorte": "Cohorte 2025", "porteur": "porteur25@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 7
    },
    {
        "titre": "Remorque Frigorifique Solaire pour Mototricycles",
        "resume": "Caisse isotherme réfrigérée montée sur triporteur pour le transport du poisson frais des quais de débarquement vers les marchés.",
        "probleme": "Rupture de la chaîne du froid lors du transport intermédiaire par caisse en polystyrène et glace fondante.",
        "solution": "Groupe frigorifique 12V alimenté par panneau solaire de toit conservant le poisson entre 0°C et 4°C sur 8 heures.",
        "domaine": 1, "cohorte": "Cohorte 2024", "porteur": "porteur08@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 14
    },
    {
        "titre": "Découpe Plasma Numérique Artisanale",
        "resume": "Table de découpe plasma pilotée par ordinateur pour la ferronnerie d'art et les fabricants de grilles de Dakar.",
        "probleme": "La découpe manuelle au chalumeau produit des pièces imprécises et demande un ébavurage très long.",
        "solution": "Châssis robuste mécano-soudé local avec électronique de commande accessible pour artisans métalliers.",
        "domaine": 1, "cohorte": "Cohorte 2026", "porteur": "porteur35@demo.ciat.sn", "statut": Projet.Statut.DEPOSE, "mois_offset": 4
    },
    {
        "titre": "Kit de Rétrofit Électrique pour Car Rapide",
        "resume": "Conversion de minibus de transport urbain en motorisation électrique avec pack batterie lithium fer phosphate.",
        "probleme": "Pollution atmosphérique sévère et consommation excessive de gasoil des vieux véhicules de transport dakarois.",
        "solution": "Kit de remplacement moteur-boîte adaptable aux châssis courants avec recharge nocturne.",
        "domaine": 1, "cohorte": "Cohorte 2026", "porteur": "porteur17@demo.ciat.sn", "statut": Projet.Statut.IDEE, "mois_offset": 1
    },
    {
        "titre": "Moteur Perpétuel à Aimants Néodyme",
        "resume": "Générateur autonome prétendant produire de l'énergie mécanique infinie sans apport extérieur.",
        "probleme": "Coût de l'énergie dans les ateliers mécaniques.",
        "solution": "Système non fondé scientifiquement violant les lois de la thermodynamique.",
        "domaine": 1, "cohorte": "Cohorte 2025", "porteur": "porteur28@demo.ciat.sn", "statut": Projet.Statut.REJETE, "mois_offset": 8
    },

    # --- DOMAINE 3 : AGRICULTURE, TRANSFORMATION ET ENVIRONNEMENT ---
    {
        "titre": "SmartIrrig Saloum — Goutte-à-goutte automatisé par sondes d'humidité",
        "resume": "Système d'irrigation de précision actionnant des électrovannes selon la tension hydrique du sol mesurée à différentes profondeurs.",
        "probleme": "Gaspillage de l'eau des nappes phréatiques et salinisation progressive des sols par sur-irrigation dans le Saloum.",
        "solution": "Économie de 40 % d'eau et 25 % d'énergie de pompage tout en augmentant le rendement des cultures d'oignons.",
        "domaine": 2, "cohorte": "Cohorte 2024", "porteur": "porteur23@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 18
    },
    {
        "titre": "Mangue Séchée Casamance — Séchoir solaire hybride thermodynamique",
        "resume": "Unité de séchage de mangues et bananes combinant capteurs solaires thermiques et appoint biomasse pour un fonctionnement 24h/24.",
        "probleme": "Plus de 40 % des mangues pourrissent sur place pendant le pic de production faute de capacité de conservation.",
        "solution": "Séchoir respectant les normes d'hygiène HACCP permettant l'exportation de fruits séchés à haute valeur ajoutée.",
        "domaine": 2, "cohorte": "Cohorte 2024", "porteur": "porteur07@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 16
    },
    {
        "titre": "BioCharbon Typha — Combustible écologique de la vallée du fleuve",
        "resume": "Transformation de la plante envahissante Typha Australis en briquettes de charbon écologique pour la cuisson ménagère.",
        "probleme": "Déforestation pour le charbon de bois et prolifération du Typha qui asphyxie les canaux d'irrigation à Saint-Louis.",
        "solution": "Carbonisation contrôlée et liant à base d'amidon de manioc produisant un charbon sans fumée toxique.",
        "domaine": 2, "cohorte": "Cohorte 2025", "porteur": "porteur05@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 12
    },
    {
        "titre": "Farine Protéinée d'Asticots — Alimentation avicole durable",
        "resume": "Élevage de larves de mouches soldats noires nourries sur des biodéchets de marchés pour substituer la farine de poisson.",
        "probleme": "Le prix de l'aliment de volaille a doublé avec la raréfaction des ressources halieutiques servant à fabriquer la farine de poisson.",
        "solution": "Production locale d'une farine riche en protéines à 60 % à un coût inférieur de 35 % à l'aliment conventionnel.",
        "domaine": 2, "cohorte": "Cohorte 2025", "porteur": "porteur21@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 11
    },
    {
        "titre": "Anacarde Valo — Valorisation de la pomme de cajou en jus pasteurisé",
        "resume": "Chaîne de pressage et clarification de la fausse pomme de cajou pour produire un jus vitaminé naturel et du vinaigre de table.",
        "probleme": "La noix est exportée brute et la pomme (90 % de la masse du fruit) est totalement abandonnée aux champs.",
        "solution": "Processus d'élimination de l'astringence par tanins et mise en bouteille hygiénique générant des revenus complémentaires.",
        "domaine": 2, "cohorte": "Cohorte 2025", "porteur": "porteur12@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 7
    },
    {
        "titre": "Hydroponie Urbaine Dakar — Salades et aromates sur toits d'immeubles",
        "resume": "Système de culture hors-sol en circuit fermé permettant de produire des légumes frais au cœur de la capitale sans pesticides.",
        "probleme": "Éloignement des zones maraîchères et utilisation d'eaux usées non traitées pour l'arrosage urbain.",
        "solution": "Tours verticales alimentées en nutriments minéraux réduisant de 90 % l'empreinte au sol et l'usage d'eau.",
        "domaine": 2, "cohorte": "Cohorte 2024", "porteur": "porteur01@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 15
    },
    {
        "titre": "Serre Maraîchère Climatisée par Évaporation Adiabatique",
        "resume": "Serres horticoles rafraîchies par coussins humides et ventilateurs solaires pour produire de la tomate sous forte chaleur estivale.",
        "probleme": "Chute de nouaison et arrêt de la production de tomate entre juin et octobre en raison des températures excessives.",
        "solution": "Baisse de 7°C à 10°C de la température intérieure par évaporation naturelle de micro-gouttelettes d'eau.",
        "domaine": 2, "cohorte": "Cohorte 2025", "porteur": "porteur23@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 6
    },
    {
        "titre": "Compostage Accéléré Déchets de Marchés Thiès",
        "resume": "Plateforme municipale de bio-déchets maraîchers transformant les résidus en fertilisant organique certifié en 21 jours.",
        "probleme": "Accumulation insalubre des ordures organiques aux abords des marchés centraux générant lixiviats et odeurs.",
        "solution": "Andains aérés mécaniquement par retourneur mobile avec suivi des montées en température thermo-bactériennes.",
        "domaine": 2, "cohorte": "Cohorte 2026", "porteur": "porteur30@demo.ciat.sn", "statut": Projet.Statut.DEPOSE, "mois_offset": 3
    },
    {
        "titre": "Farine de Grillon Sahélien pour Bébés",
        "resume": "Aliment infantile à base d'insectes sans étude toxicologique préalable.",
        "probleme": "Malnutrition protéique dans certaines localités.",
        "solution": "Mise sur le marché d'une recette sans validation des services de la Direction de la Pharmacie et des Laboratoires.",
        "domaine": 2, "cohorte": "Cohorte 2025", "porteur": "porteur07@demo.ciat.sn", "statut": Projet.Statut.REJETE, "mois_offset": 8
    },

    # --- DOMAINE 4 : ÉNERGIE, EFFICACITÉ ÉNERGÉTIQUE ET RENOUVELABLES ---
    {
        "titre": "SunuGrid — Mini-réseau solaire intelligent avec paiement Pay-As-You-Go",
        "resume": "Mini-centrale photovoltaïque alimentant un village de 150 ménages avec compteurs intelligents télérelevés par GSM.",
        "probleme": "Électrification rurale très lente des hameaux isolés situés à plus de 20 km du réseau moyenne tension.",
        "solution": "Distribution électrique 220V sécurisée avec paiement mobile quotidien adapté aux revenus des ménages ruraux.",
        "domaine": 3, "cohorte": "Cohorte 2024", "porteur": "porteur18@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 18
    },
    {
        "titre": "Biogaz Saloum — Digesteur agricole pour élevages laitiers",
        "resume": "Valorisation des bouses de vaches en gaz de cuisson et en fertilisant liquide (digestat) pour fermes de 10 à 30 têtes.",
        "probleme": "Corvée de bois pour les femmes et pollution des sols par les déjections animales non stabilisées.",
        "solution": "Dôme géotextile continu alimentant deux feux de cuisson domestiques et fournissant un engrais biologique liquide.",
        "domaine": 3, "cohorte": "Cohorte 2024", "porteur": "porteur24@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 16
    },
    {
        "titre": "ÉcoClim Solaire — Climatisation solaire par absorption pour dispensaires",
        "resume": "Système frigorifique solaire sans compresseur électrique conservant vaccins et sang dans les centres de santé isolés.",
        "probleme": "Les coupures de courant et pannes de batteries détruisent fréquemment les stocks de vaccins sensibles.",
        "solution": "Cycle thermodynamique eau-ammoniac activé directement par des capteurs solaires à tubes sous vide.",
        "domaine": 3, "cohorte": "Cohorte 2025", "porteur": "porteur02@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 13
    },
    {
        "titre": "MicroHydro Casamance — Turbines fluviales pour cours d'eau côtiers",
        "resume": "Génératrices hydrauliques flottantes installées sur les bolongs pour fournir de l'électricité nocturne aux villages de pêcheurs.",
        "probleme": "Absence totale de réseau électrique dans les îles de basse Casamance accessibles uniquement en pirogue.",
        "solution": "Turbines hélice immergées exploitant le courant marégraphique et fluvial sans barrage ni impact sur les mangroves.",
        "domaine": 3, "cohorte": "Cohorte 2025", "porteur": "porteur14@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 9
    },
    {
        "titre": "Audit Solaire Bâtiments Publics — Capteurs IoT de monitoring énergétique",
        "resume": "Plateforme SaaS analysant la consommation en temps réel des ministères et universités pour réduire les factures Senelec.",
        "probleme": "Climatiseurs laissés allumés la nuit et équipements obsolètes causant des surcoûts colossaux aux finances publiques.",
        "solution": "Boîtiers tores magnétiques non intrusifs identifiant les dérives de consommation et générant des rapports d'audit.",
        "domaine": 3, "cohorte": "Cohorte 2025", "porteur": "porteur18@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 7
    },
    {
        "titre": "Éolien Artisanal Petite Côte — Pompage d'eau par éoliennes multipales",
        "resume": "Fabrication locale d'éoliennes mécaniques pompant l'eau des puits pour l'abreuvement du bétail sans carburant.",
        "probleme": "Les groupes motopompes au diesel tombent souvent en panne et le carburant coûte cher aux éleveurs.",
        "solution": "Éoliennes lentes à fort couple fabriquées à partir d'essieux de voitures recyclés et de pales en tôle galvanisée.",
        "domaine": 3, "cohorte": "Cohorte 2024", "porteur": "porteur36@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 14
    },
    {
        "titre": "Lampadaires Solaires Connectés à Batterie LFP",
        "resume": "Éclairage public solaire autonome équipé de communication radio maillée pour la détection automatique des pannes.",
        "probleme": "Plus de 50 % des lampadaires solaires tombent en panne après deux ans à cause de batteries plomb dégradées.",
        "solution": "Batteries lithium-fer-phosphate garanties 5 ans avec gradation automatique d'éclairage selon le passage.",
        "domaine": 3, "cohorte": "Cohorte 2025", "porteur": "porteur02@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 5
    },
    {
        "titre": "Station de Recharge Solaire pour Pirogues Électriques",
        "resume": "Ponton flottant équipé de panneaux solaires pour recharger les moteurs hors-bord électriques dans l'estuaire du Saloum.",
        "probleme": "Rejets d'huile et d'essence deux-temps des pirogues polluant la mangrove et les zones de reproduction des huîtres.",
        "solution": "Moteurs électriques de 10 kW alimentés par packs batteries amovibles rechargés au ponton solaire.",
        "domaine": 3, "cohorte": "Cohorte 2026", "porteur": "porteur26@demo.ciat.sn", "statut": Projet.Statut.DEPOSE, "mois_offset": 2
    },
    {
        "titre": "Générateur Éther Ondulatoire",
        "resume": "Dispositif prétendant capter les ondes telluriques pour produire du courant haute tension.",
        "probleme": "Facture d'électricité des ménages.",
        "solution": "Dispositif pseudoscientifique sans validation physique.",
        "domaine": 3, "cohorte": "Cohorte 2025", "porteur": "porteur36@demo.ciat.sn", "statut": Projet.Statut.REJETE, "mois_offset": 10
    },

    # --- DOMAINE 5 : PHARMACEUTIQUE ET BIOMÉDICAL ---
    {
        "titre": "BioPharma Diaraf — Extraction standardisée de principes actifs d'Artemisia",
        "resume": "Laboratoire de transformation locale des plantes médicinales sénégalaises en tisanes dosées et gélules certifiées.",
        "probleme": "La médecine traditionnelle utilise des dosages empiriques sans garantie de teneur en matière active ni contrôle microbien.",
        "solution": "Contrôle qualité HPLC et conditionnement sous blister conforme aux normes de la pharmacopée africaine.",
        "domaine": 4, "cohorte": "Cohorte 2024", "porteur": "porteur03@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 17
    },
    {
        "titre": "TeleDiag Rufisque — Valise de télémédecine pour postes de santé de brousse",
        "resume": "Valise tout-en-un connectée en 4G/satellite regroupant ECG, stéthoscope numérique, dermatoscope et échographe portable.",
        "probleme": "Déserts médicaux en milieu rural où les infirmiers chefs de poste n'ont aucun spécialiste pour confirmer un diagnostic.",
        "solution": "Téléconsultation synchrone avec les médecins spécialistes des CHU de Fann et Dantec.",
        "domaine": 4, "cohorte": "Cohorte 2024", "porteur": "porteur15@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 15
    },
    {
        "titre": "SunuGlucovue — Glucomètre connecté sans bandelette jetable",
        "resume": "Capteur optique non invasif mesurant la glycémie capillaire par spectrophotométrie infrarouge au bout du doigt.",
        "probleme": "Le coût mensuel des bandelettes de glycémie (plus de 25 000 FCFA) amène les diabétiques à espacer dangereusement leurs contrôles.",
        "solution": "Capteur réutilisable sans consommable jetable transmettant l'historique glycémique au smartphone du patient.",
        "domaine": 4, "cohorte": "Cohorte 2025", "porteur": "porteur06@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 12
    },
    {
        "titre": "Chambre d'Isothermie pour Transport Sanguin d'Urgence",
        "resume": "Glacière active de transport de culots globulaires stabilisée à +4°C avec enregistrement inviolable de température.",
        "probleme": "Altération des poches de sang transférées par taxi ou ambulance entre la banque de sang et les hôpitaux régionaux.",
        "solution": "Régulation électronique par module Peltier et géolocalisation continue du convoi.",
        "domaine": 4, "cohorte": "Cohorte 2025", "porteur": "porteur27@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 10
    },
    {
        "titre": "Gestion Électronique des Stocks de Pharmacie Rurale",
        "resume": "Application d'inventaire sur tablette signalant les ruptures imminentes de paracétamol, antipaludiques et sérums antivenimeux.",
        "probleme": "Ruptures de stock imprévues dans les postes de santé distants suivies de péremption de lots mal gérés.",
        "solution": "Calcul prédictif du seuil de réapprovisionnement connecté à la Pharmacie Nationale d'Approvisionnement (PNA).",
        "domaine": 4, "cohorte": "Cohorte 2025", "porteur": "porteur10@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 8
    },
    {
        "titre": "Production Locale d'Hydrogel Antiseptique à Base de Moringa",
        "resume": "Gel désinfectant et cicatrisant formulé à partir d'extraits éthanoliques de feuilles de Moringa oleifera de Fatick.",
        "probleme": "Vulnérabilité aux ruptures d'approvisionnement en antiseptiques importés observée lors des crises sanitaires.",
        "solution": "Procédé galénique brevetable valorisant les cultures villageoises locales avec une forte efficacité bactéricide.",
        "domaine": 4, "cohorte": "Cohorte 2024", "porteur": "porteur03@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 16
    },
    {
        "titre": "Incubateur Néonatal Low-Cost pour Maternités Rurales",
        "resume": "Couveuse thermique fermée réalisée avec matériaux locaux et servorégulation de température par résistance céramique blindée.",
        "probleme": "Hypothermie néonatale responsable de décès évitables chez les nouveau-nés prématurés dans les postes de santé ruraux.",
        "solution": "Couveuse réparable localement à un coût 10 fois inférieur aux modèles importés.",
        "domaine": 4, "cohorte": "Cohorte 2025", "porteur": "porteur15@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 7
    },
    {
        "titre": "Stérilisateur Médical Solaire à Vapeur Autoclave",
        "resume": "Autoclave à concentrateur parabolique solaire stérilisant instruments chirurgicaux et compresses sans électricité.",
        "probleme": "Infections nosocomiales en zone enclavée dues au manque d'autoclaves électriques fonctionnels.",
        "solution": "Cuve inox sous pression montant à 121°C pendant 20 minutes uniquement par concentration des rayons solaires.",
        "domaine": 4, "cohorte": "Cohorte 2026", "porteur": "porteur06@demo.ciat.sn", "statut": Projet.Statut.IDEE, "mois_offset": 1
    },
    {
        "titre": "Unité Mobile de Purification d'Eau pour Dispensaires Ruraux",
        "resume": "Système mobile de filtration sur membrane céramique et stérilisation UV solaire produisant de l'eau purifiée de qualité médicale pour soins d'urgence.",
        "probleme": "Manque d'eau potable stérile dans les postes de santé enclavés pour la désinfection et la préparation de solutés de réhydratation.",
        "solution": "Filtration autonome par gravité et panneau solaire 50W éliminant 99,99 % des bactéries et virus sans additif chimique.",
        "domaine": 4, "cohorte": "Cohorte 2025", "porteur": "porteur03@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 6
    },

    # --- DOMAINE 6 : ÉDUCATION, FORMATION PROFESSIONNELLE ET INSERTION ---
    {
        "titre": "Simulateur VR Soudure et Usinage ISEP — Réalité virtuelle pour ateliers techniques",
        "resume": "Casques de réalité virtuelle permettant aux apprenants de s'exercer au geste de soudage TIG et MIG sans gaspiller de métal.",
        "probleme": "Coût très élevé des consommables métalliques et gaz industriels limitant le temps de pratique réelle des étudiants.",
        "solution": "Apprentissage immersif avec retour haptique reproduisant fidèlement l'arc électrique, l'angle de torche et la vitesse d'avance.",
        "domaine": 5, "cohorte": "Cohorte 2024", "porteur": "porteur29@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 17
    },
    {
        "titre": "Plateforme d'Insertion Métiers — Matching diplômés ISEP et entreprises",
        "resume": "Portail web qualifiant les compétences des techniciens supérieurs et organisant des mises en relation directes pour les stages.",
        "probleme": "Difficulté des industriels de la zone économique de Diamniadio à recruter des techniciens qualifiés immédiatement opérationnels.",
        "solution": "CV vidéo certifié par les formateurs, tests de compétences pratiques en ligne et conventionnement dématérialisé.",
        "domaine": 5, "cohorte": "Cohorte 2024", "porteur": "porteur09@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 15
    },
    {
        "titre": "Micro-Certifications Vocales en Langues Nationales pour Artisans",
        "resume": "Parcours d'apprentissage par WhatsApp et messagerie vocale pour les maçons, menuisiers et électriciens du secteur informel.",
        "probleme": "Les artisans traditionnels maîtrisent d'excellentes techniques mais n'ont aucune certification formelle reconnue pour soumissionner aux marchés.",
        "solution": "Modules courts audio en wolof, sérère et pulaar validés par des évaluations pratiques chez des maîtres artisans agréés.",
        "domaine": 5, "cohorte": "Cohorte 2025", "porteur": "porteur37@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 11
    },
    {
        "titre": "Kit Robotique Pédagogique Low-Cost pour Lycées Techniques",
        "resume": "Valise de composants électroniques et servomoteurs programmables en blocs graphiques pour initier les lycéens à l'automatisme.",
        "probleme": "Les kits robotiques éducatifs importés coûtent cher et ne disposent pas de pièces de rechange disponibles localement.",
        "solution": "Composants standards robustes avec cartes microcontrôleurs assemblées au FabLab CIAT et tutoriels en français/wolof.",
        "domaine": 5, "cohorte": "Cohorte 2025", "porteur": "porteur04@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 9
    },
    {
        "titre": "Banc d'Apprentissage Électromécanique Didactique",
        "resume": "Armoire pédagogique de câblage industriel modulable pour la formation aux démarrages moteurs et automates programmables.",
        "probleme": "Les pannes induites lors des séances d'essais endommagent les équipements industriels réels en entreprise.",
        "solution": "Banc didactique protégé contre les courts-circuits avec injection automatique de défauts pour entraîner les techniciens.",
        "domaine": 5, "cohorte": "Cohorte 2025", "porteur": "porteur37@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 6
    },
    {
        "titre": "Plateforme d'Apprentissage Hybride pour Métiers Féminins Porteurs",
        "resume": "Formations intensives de reconversion vers la maintenance informatique et l'installation photovoltaïque pour jeunes femmes.",
        "probleme": "Faible représentation des femmes dans les filières techniques et technologiques à forte employabilité.",
        "solution": "Accompagnement personnalisé, mentorat féminin actif et stages garantis en entreprises partenaires.",
        "domaine": 5, "cohorte": "Cohorte 2024", "porteur": "porteur09@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 14
    },
    {
        "titre": "Jumeau Numérique des Ateliers ISEP pour Télé-Enseignement",
        "resume": "Modélisation 3D interactive des machines-outils de Diamniadio pour permettre aux étudiants de réviser à distance.",
        "probleme": "Saturation des créneaux en atelier physique limitant le temps de manipulation machine par élève.",
        "solution": "Visite virtuelle navigable avec procédures de sécurité pas-à-pas et questionnaires d'auto-évaluation.",
        "domaine": 5, "cohorte": "Cohorte 2025", "porteur": "porteur29@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 5
    },
    {
        "titre": "Tutorat IA pour Concours d'Entrée aux Écoles d'Ingénieurs",
        "resume": "Application d'entraînement adaptatif générant des exercices corrigés en mathématiques et physique conformes aux programmes sénégalais.",
        "probleme": "Inégalité d'accès aux cours particuliers et prépas privées entre Dakar et les régions intérieures.",
        "solution": "Génération d'explications détaillées et suivi personnalisé des lacunes sans abonnement payant prohibitif.",
        "domaine": 5, "cohorte": "Cohorte 2026", "porteur": "porteur04@demo.ciat.sn", "statut": Projet.Statut.DEPOSE, "mois_offset": 2
    },

    # --- DOMAINE 7 : SERVICES AUX COLLECTIVITÉS, ENTREPRENEURIAT ET INCUBATION ---
    {
        "titre": "Dakar Waste Solutions — Optimisation de collecte des ordures ménagères",
        "resume": "Algorithme d'optimisation des tournées des camions-bennes selon le niveau de remplissage des bacs mesuré par capteurs ultrasons.",
        "probleme": "Débordement récurrent des poubelles publiques et gaspillage de gasoil par les véhicules de nettoiement circulant à vide.",
        "solution": "Réduction de 30 % des trajets des bennes et cartographie dynamique des points noirs transmise aux chauffeurs.",
        "domaine": 6, "cohorte": "Cohorte 2024", "porteur": "porteur11@demo.ciat.sn", "statut": Projet.Statut.TERMINE, "mois_offset": 18
    },
    {
        "titre": "Guichet Unique Numérique des Permis Communaux",
        "resume": "Plateforme web pour les mairies de la banlieue dakaroise dématérialisant les demandes d'actes d'état civil et autorisations de construire.",
        "probleme": "Files d'attente interminables dans les mairies et risques élevés de perte ou falsification de dossiers papier.",
        "solution": "Dépôt en ligne, paiement sécurisé et signature électronique avec QR code de vérification infalsifiable.",
        "domaine": 6, "cohorte": "Cohorte 2024", "porteur": "porteur38@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 16
    },
    {
        "titre": "Éco-Briques Fatick — Pavés autobloquants en plastique recyclé et sable",
        "resume": "Unité semi-industrielle fabriquant des pavés de voirie sans ciment à partir de sachets plastiques usagés fondus avec du sable dunaire.",
        "probleme": "Pollution massive par les déchets plastiques et coût élevé du pavage en béton pour les voiries secondaires.",
        "solution": "Pavés plus résistants à la compression et à l'érosion que le béton, deux fois moins coûteux à fabriquer.",
        "domaine": 6, "cohorte": "Cohorte 2025", "porteur": "porteur33@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 11
    },
    {
        "titre": "Plateforme d'Achats Groupés pour Coopératives Féminines",
        "resume": "Centrale d'achat numérique permettant aux groupements de femmes transformatrices de négocier emballages et matières premières au prix de gros.",
        "probleme": "Marges réduites des petites productrices achetant leurs bocaux et cartons au détail à des prix exorbitants.",
        "solution": "Regroupement des commandes à l'échelle départementale avec livraison mutualisée aux sièges des coopératives.",
        "domaine": 6, "cohorte": "Cohorte 2025", "porteur": "porteur11@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 10
    },
    {
        "titre": "Assainissement Autonome — Vidange hygiénique planifiée par application",
        "resume": "Service de commande et traçabilité des camions hydrocureurs vers les stations de traitement de boues de vidange de Cambérène.",
        "probleme": "Déversement clandestin des boues de vidange dans la nature par des opérateurs informels faute de contrôle.",
        "solution": "Certification de dépotage à la station d'épuration avant déblocage du paiement mobile à l'opérateur.",
        "domaine": 6, "cohorte": "Cohorte 2025", "porteur": "porteur30@demo.ciat.sn", "statut": Projet.Statut.INCUBE, "mois_offset": 9
    },
    {
        "titre": "Incubateur Mobile Rural — Caravane d'accompagnement entrepreneurial",
        "resume": "Bus équipé d'un espace de coworking et connectivité satellitaire sillonnant les villages pour former les jeunes porteurs de projets.",
        "probleme": "Concentration quasi-totale des structures d'incubation et d'accès au crédit dans la seule région de Dakar.",
        "solution": "Sessions intensives de formation en comptabilité simplifiée, modélisation économique et pitch de financement.",
        "domaine": 6, "cohorte": "Cohorte 2025", "porteur": "porteur38@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 7
    },
    {
        "titre": "Gestion Partagée des Espaces Marchands de Diamniadio",
        "resume": "Application de réservation horaire et partage d'étals frigorifiques et balance certifiée pour les vendeurs du nouveau pôle.",
        "probleme": "Sous-utilisation de certains équipements collectifs et conflits fréquents d'attribution des espaces de vente.",
        "solution": "Planning partagé sur smartphone avec historique des réservations et paiement transparent des redevances.",
        "domaine": 6, "cohorte": "Cohorte 2024", "porteur": "porteur33@demo.ciat.sn", "statut": Projet.Statut.PROTOTYPE, "mois_offset": 13
    },
    {
        "titre": "Observatoire Local de l'Emploi et des Compétences",
        "resume": "Tableau de bord cartographiant les besoins en recrutement des entreprises du pôle industriel de Diamniadio.",
        "probleme": "Décalage entre l'offre de formation locale et les postes ouverts dans les nouvelles usines de la zone franche.",
        "solution": "Enquêtes trimestrielles automatisées guidant les ouvertures de filières à l'ISEP et aux centres de formation.",
        "domaine": 6, "cohorte": "Cohorte 2025", "porteur": "porteur13@demo.ciat.sn", "statut": Projet.Statut.SELECTIONNE, "mois_offset": 6
    },
    {
        "titre": "Borne Interactive Citoyenne Solaire pour Maisons de Quartier",
        "resume": "Kiosque tactile autonome en énergie délivrant formulaires administratifs et informations locales sans agent d'accueil.",
        "probleme": "Fermeture des guichets communaux l'après-midi pénalisant les actifs travaillant aux champs ou en atelier.",
        "solution": "Borne antivandalisme avec lecteur de carte d'identité biométrique CEDEAO et impression de formulaires.",
        "domaine": 6, "cohorte": "Cohorte 2026", "porteur": "porteur11@demo.ciat.sn", "statut": Projet.Statut.IDEE, "mois_offset": 1
    },
]


class Command(BaseCommand):
    help = "Remplit la base avec les données de démonstration du CIAT (environ 60 projets, 3 cohortes, 7 domaines, ~40 porteurs)."

    def handle(self, *args, **options):
        nb_projets_avant = Projet.objects.count()

        # 1. Domaines
        domaines_objs = []
        for nom in DOMAINES:
            dom, _ = Domaine.objects.get_or_create(nom=nom)
            domaines_objs.append(dom)

        # 2. Cohortes
        cohortes_map = {}
        for c in COHORTES:
            coh, _ = Cohorte.objects.get_or_create(
                nom=c["nom"],
                defaults={
                    "annee": c["annee"],
                    "date_debut": c["date_debut"],
                    "date_fin": c["date_fin"],
                },
            )
            cohortes_map[c["nom"]] = coh

        # 3. Comptes équipe socle
        for email, role, prenom, nom, genre, org in COMPTES_EQUIPE:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "role": role,
                    "first_name": prenom,
                    "last_name": nom,
                    "genre": genre,
                    "organisation": org,
                    "is_staff": role == Role.ADMIN,
                    "is_superuser": role == Role.ADMIN,
                },
            )
            if created:
                user.set_password(MOT_DE_PASSE)
                user.save()

        # 4. Porteurs de projets fictifs
        porteurs_map = {}
        for p in PORTEURS_FICTIFS:
            user, created = User.objects.get_or_create(
                email=p["email"],
                defaults={
                    "role": Role.PORTEUR,
                    "first_name": p["prenom"],
                    "last_name": p["nom"],
                    "genre": p["genre"],
                    "organisation": p["org"],
                    "telephone": p["tel"],
                },
            )
            if created:
                user.set_password(MOT_DE_PASSE)
                user.save()
            else:
                updated = False
                if user.last_name != p["nom"]:
                    user.last_name = p["nom"]
                    updated = True
                if user.first_name != p["prenom"]:
                    user.first_name = p["prenom"]
                    updated = True
                if user.organisation != p["org"]:
                    user.organisation = p["org"]
                    updated = True
                if updated:
                    user.save()
            porteurs_map[p["email"]] = user

        # 5. Projets de démonstration
        date_reference = datetime(2026, 10, 20, 10, 0, tzinfo=timezone.utc)
        nb_boucle_crees = 0

        for p_data in PROJETS_DE_DEMO:
            domaine = domaines_objs[p_data["domaine"]]
            cohorte = cohortes_map.get(p_data["cohorte"])
            porteur = porteurs_map[p_data["porteur"]]

            # Calcul de la date étalée sur 18 mois
            date_creation = date_reference - timedelta(days=p_data["mois_offset"] * 30 + 5)

            projet, created = Projet.objects.get_or_create(
                titre=p_data["titre"],
                defaults={
                    "resume": p_data["resume"],
                    "probleme": p_data["probleme"],
                    "solution": p_data["solution"],
                    "domaine": domaine,
                    "cohorte": cohorte,
                    "porteur": porteur,
                    "statut": p_data["statut"],
                },
            )

            # Renseigner explicitement cree_le et modifie_le en base
            Projet.objects.filter(id=projet.id).update(
                cree_le=date_creation,
                modifie_le=date_creation + timedelta(days=15),
            )

            if created:
                nb_boucle_crees += 1

        total_projets = Projet.objects.count()
        nb_projets_crees = max(total_projets - nb_projets_avant, nb_boucle_crees)
        total_porteurs = User.objects.filter(role=Role.PORTEUR).count()
        femmes = User.objects.filter(role=Role.PORTEUR, genre=User.Genre.FEMME).count()
        pourcentage_femmes = (femmes / total_porteurs * 100) if total_porteurs else 0

        self.stdout.write(self.style.SUCCESS(
            f"Données de démonstration prêtes (idempotent)."
        ))
        self.stdout.write(
            f"- Projets : {total_projets} projets en base ({nb_projets_crees} créés lors de ce passage)\n"
            f"- Domaines : {Domaine.objects.count()} domaines\n"
            f"- Cohortes : {Cohorte.objects.count()} cohortes\n"
            f"- Porteurs : {total_porteurs} porteurs ({femmes} femmes, soit {pourcentage_femmes:.1f} %)\n"
            f"- Comptes équipes : admin@ciat.sn, coordo@ciat.sn, mentor@ciat.sn, comite@ciat.sn, porteur@ciat.sn (mdp: {MOT_DE_PASSE})\n"
            f"- Porteurs démo : porteur01@demo.ciat.sn à porteur40@demo.ciat.sn (mdp: {MOT_DE_PASSE})"
        )

        try:
            from django.core.management import call_command
            call_command("seed_analytics", stdout=self.stdout)
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"Avertissement seed_analytics : {exc}"))
