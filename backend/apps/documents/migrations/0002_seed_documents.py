"""Migration de données pour initialiser les 4 types de documents et 12 modèles de documents."""
from django.db import migrations

INITIAL_DATA = [
    {
        "type_code": "appel_candidatures",
        "type_nom": "Appel à candidatures",
        "modeles": [
            {
                "nom": "Format Institutionnel Formel",
                "apercu": "Structure classique avec cadre réglementaire, critères d'éligibilité, processus de sélection et engagements des lauréats.",
                "sections": [
                    {
                        "code": "contexte",
                        "titre": "Contexte et objectifs du programme",
                        "consigne": "Présenter le cadre stratégique du CIAT/ISEP, la mission de la cohorte et les défis technologiques ciblés.",
                    },
                    {
                        "code": "profil_candidats",
                        "titre": "Critères d'éligibilité et profils ciblés",
                        "consigne": "Détailler les prérequis pour les porteurs de projets, la maturité attendue des prototypes et les domaines concernés.",
                    },
                    {
                        "code": "avantages",
                        "titre": "Offre d'accompagnement et dotation",
                        "consigne": "Lister les bénéfices offerts : accès FabLab, mentorat, espaces de travail à Diamniadio et opportunités de financement.",
                    },
                    {
                        "code": "modalites",
                        "titre": "Processus et calendrier de sélection",
                        "consigne": "Exposer les étapes de candidature, dates limites et composition du jury d'évaluation.",
                    },
                ],
                "regles_charte": "Ton protocolaire et valorisant pour l'ISEP Diamniadio. Couleurs officielles Bleu Nuit (#003366) et Ocre Sahélien (#C5A059). Ne pas inventer de dates ni de montants absents des consignes.",
                "exemple_redaction": "Le Centre d'Innovation, d'Application et de Transfert (CIAT) de l'ISEP Diamniadio lance son appel officiel à candidatures destiné à propulser les innovations technologiques sénégalaises. Cet appel s'adresse aux porteurs de projets démontrant une preuve de concept dans l'un des sept domaines prioritaires de l'Institut...",
            },
            {
                "nom": "Format Synthétique / Allégé",
                "apercu": "Version concise conçue pour les diffusions rapides, réseaux sociaux et communications ciblées.",
                "sections": [
                    {
                        "code": "accroche",
                        "titre": "L'opportunité en bref",
                        "consigne": "Résumer en un paragraphe percutant la cible et la valeur ajoutée du programme.",
                    },
                    {
                        "code": "criteres_cles",
                        "titre": "Qui peut postuler ?",
                        "consigne": "Trois à quatre critères essentiels sous forme de points clés faciles à appréhender.",
                    },
                    {
                        "code": "modalites_rapides",
                        "titre": "Comment et quand candidater ?",
                        "consigne": "Date limite, lien de dépôt et contact direct de l'équipe d'incubation.",
                    },
                ],
                "regles_charte": "Clarté maximale, phrases courtes, ton dynamique et accessible. Aucun jargon superflu.",
                "exemple_redaction": "Vous êtes technicien, diplômé ou innovateur au Sénégal ? Rejoignez la prochaine cohorte du CIAT pour concrétiser votre prototype industriel et bénéficier d'un coaching sur mesure à Diamniadio...",
            },
            {
                "nom": "Format Détaillé / Programme d'accélération",
                "apercu": "Gabarit exhaustif pour programmes d'accélération intensive avec cahier des charges technique.",
                "sections": [
                    {
                        "code": "cadre_strategique",
                        "titre": "Cadre programmatique et thématiques industrielles",
                        "consigne": "Décrire les filières industrielles ciblées et l'alignement sur les priorités nationales sénégalaises.",
                    },
                    {
                        "code": "parcours_incubation",
                        "titre": "Architecture du parcours d'accélération",
                        "consigne": "Détailler les phases séquentielles : idéation, banc d'essai au FabLab, passage à l'échelle et démo day.",
                    },
                    {
                        "code": "criteres_notation",
                        "titre": "Grille d'évaluation multicritères",
                        "consigne": "Spécifier la pondération des critères : degré d'innovation, faisabilité mécanique/logicielle et impact territorial.",
                    },
                    {
                        "code": "engagements_reciproques",
                        "titre": "Engagements et propriété intellectuelle",
                        "consigne": "Préciser les droits et devoirs du porteur de projet et la politique de brevetage OAPI.",
                    },
                ],
                "regles_charte": "Rigueur contractuelle, vocabulaire technique précis, normes institutionnelles ISEP. Ne rien extrapoler hors des données transmises.",
                "exemple_redaction": "Dans le cadre de son plan de développement technologique, le CIAT déploie le programme d'accélération intensive afin de catalyser l'émergence d'entreprises viables dans les secteurs clés de l'économie...",
            },
        ],
    },
    {
        "type_code": "fiche_projet",
        "type_nom": "Fiche de projet",
        "modeles": [
            {
                "nom": "Format Standard / Instruction Incubateur",
                "apercu": "Fiche descriptive complète utilisée pour l'analyse technique et financière par les instructeurs du CIAT.",
                "sections": [
                    {
                        "code": "presentation_generale",
                        "titre": "Identité et vision du projet",
                        "consigne": "Présenter le nom, le domaine technologique, le porteur et la vision à long terme.",
                    },
                    {
                        "code": "probleme_marche",
                        "titre": "Diagnostic du besoin et étude de marché",
                        "consigne": "Exposer la problématique locale résolue et les utilisateurs cibles au Sénégal.",
                    },
                    {
                        "code": "solution_technique",
                        "titre": "Description technique de l'innovation",
                        "consigne": "Détailler les composants matériels, logiciels ou procédés techniques mis en œuvre.",
                    },
                    {
                        "code": "plan_deploiement",
                        "titre": "Jalons techniques et calendrier de déploiement",
                        "consigne": "Fixer les étapes clés du prototypage au déploiement opérationnel.",
                    },
                ],
                "regles_charte": "Format structuré, ton analytique neutre et rigoureux. Respecter strictement les détails techniques fournis.",
                "exemple_redaction": "Fiche technique d'évaluation — Projet CIAT. Ce document présente le descriptif complet du projet, son modèle de valeur et sa feuille de route technologique au sein du centre...",
            },
            {
                "nom": "Format Synthétique / Executive Summary",
                "apercu": "Synthèse sur une page pour décideurs, partenaires et financeurs.",
                "sections": [
                    {
                        "code": "pitch",
                        "titre": "Pitch exécutif et proposition de valeur",
                        "consigne": "Résumer la proposition de valeur en 3 phrases marquantes et claires.",
                    },
                    {
                        "code": "metriques_cles",
                        "titre": "Indicateurs d'impact et cibles",
                        "consigne": "Mettre en avant les chiffres clés fournis : utilisateurs cibles, gains d'efficacité, coûts estimés.",
                    },
                    {
                        "code": "besoin_accompagnement",
                        "titre": "Besoins d'accélération au CIAT",
                        "consigne": "Indiquer les ressources matérielles et d'expertise requises auprès du CIAT.",
                    },
                ],
                "regles_charte": "Style percutant, orientation résultats et valeur ajoutée immédiate. Pas de longueurs.",
                "exemple_redaction": "Executive Summary — Synthèse du projet d'innovation. L'initiative vise à répondre à une inefficacité majeure du secteur grâce à une approche technologique sobre et adaptée...",
            },
            {
                "nom": "Format Détaillé / Dossier Technique & Prototypage",
                "apercu": "Dossier approfondi pour passage en atelier de prototypage (FabLab) et certification.",
                "sections": [
                    {
                        "code": "cahier_charges",
                        "titre": "Spécifications techniques fonctionnelles",
                        "consigne": "Détailler les exigences techniques, normes applicables et contraintes d'assemblage.",
                    },
                    {
                        "code": "architecture_materielle",
                        "titre": "Architecture et nomenclature des composants",
                        "consigne": "Lister les sous-systèmes mécaniques, électroniques ou logiciels nécessaires.",
                    },
                    {
                        "code": "securite_risques",
                        "titre": "Analyse des risques et conformité HSE",
                        "consigne": "Identifier les risques d'usage, de maintenance et les mesures de mitigation préconisées.",
                    },
                    {
                        "code": "budget_ressources",
                        "titre": "Ressources requises en atelier",
                        "consigne": "Spécifier les machines nécessaires (CNC, imprimante 3D, banc de test) et l'assistance technique.",
                    },
                ],
                "regles_charte": "Vocabulaire d'ingénierie rigoureux, formulation normative conforme aux standards ISEP.",
                "exemple_redaction": "Dossier technique de faisabilité et d'usinage. Le présent document consigne l'architecture technique détaillée, la liste des pièces et le protocole d'essai en atelier...",
            },
        ],
    },
    {
        "type_code": "convention",
        "type_nom": "Convention d'incubation",
        "modeles": [
            {
                "nom": "Format Standard / Engagement Bilatéral",
                "apercu": "Contrat officiel fixant les droits et obligations entre le CIAT et le porteur de projet incubé.",
                "sections": [
                    {
                        "code": "preambule",
                        "titre": "Préambule et désignation des parties",
                        "consigne": "Désigner le CIAT/ISEP d'une part et le porteur de projet d'autre part, en rappelant le contexte d'admission.",
                    },
                    {
                        "code": "obligations_ciat",
                        "titre": "Engagements et prestations du CIAT",
                        "consigne": "Préciser la mise à disposition des locaux, des équipements FabLab et du réseau d'experts mentors.",
                    },
                    {
                        "code": "obligations_porteur",
                        "titre": "Engagements et assiduité du porteur",
                        "consigne": "Stipuler l'assiduité aux ateliers, le respect du règlement intérieur et la transmission des livrables.",
                    },
                    {
                        "code": "duree_resiliation",
                        "titre": "Durée, confidentialité et résiliation",
                        "consigne": "Fixer la période de validité de l'accompagnement et les clauses de rupture amiable ou contentieuse.",
                    },
                ],
                "regles_charte": "Style juridique rigoureux, respect des formulations légales administratives sénégalaises. Pas de clauses imaginaires.",
                "exemple_redaction": "Entre les soussignés : Le Centre d'Innovation, d'Application et de Transfert (CIAT), représenté par son Coordonnateur, d'une part, et le porteur de projet désigné, d'autre part...",
            },
            {
                "nom": "Format Partenariat / Tripartite",
                "apercu": "Convention associant le CIAT, le porteur de projet et un partenaire industriel ou financier tiers.",
                "sections": [
                    {
                        "code": "parties_tripartites",
                        "titre": "Désignation des trois parties contractantes",
                        "consigne": "Identifier le CIAT, le porteur de projet et le partenaire industriel associé.",
                    },
                    {
                        "code": "role_partenaire",
                        "titre": "Apport et rôle du partenaire industriel",
                        "consigne": "Détailler le mécénat de compétences, fourniture de composants ou terrain d'expérimentation offert.",
                    },
                    {
                        "code": "gouvernance",
                        "titre": "Comité de pilotage et revue d'avancement",
                        "consigne": "Fixer la fréquence des réunions tripartites de suivi et la prise de décision conjointe.",
                    },
                    {
                        "code": "dispositions_finales",
                        "titre": "Entrée en vigueur et juridiction compétente",
                        "consigne": "Préciser l'application du droit sénégalais et le tribunal compétent de Dakar.",
                    },
                ],
                "regles_charte": "Rigueur contractuelle multipartite, délimitation stricte des responsabilités de chacun.",
                "exemple_redaction": "Convention tripartite de partenariat technologique et d'expérimentation in situ. Les parties conviennent de mutualiser leurs expertises techniques pour accélérer le déploiement du projet...",
            },
            {
                "nom": "Format Cadre / Accélération Intensive",
                "apercu": "Convention pour phase de prototypage rapide avec accès étendu aux installations de production.",
                "sections": [
                    {
                        "code": "objet_programme",
                        "titre": "Objet du programme d'accélération intensive",
                        "consigne": "Définir les objectifs chiffrés de passage de l'idée au prototype industrialisable.",
                    },
                    {
                        "code": "acces_ateliers",
                        "titre": "Modalités d'accès sécurisé aux ateliers et machines",
                        "consigne": "Réglementer l'utilisation des machines industrielles et les protocoles de sécurité HSE.",
                    },
                    {
                        "code": "propriete_intellectuelle",
                        "titre": "Propriété intellectuelle et brevets",
                        "consigne": "Définir la répartition de la titularité des inventions et le dépôt auprès de l'OAPI.",
                    },
                    {
                        "code": "sanctions_manquement",
                        "titre": "Conditions de sortie et bilan final",
                        "consigne": "Modalités d'évaluation finale de fin de parcours et délivrance du certificat d'incubation.",
                    },
                ],
                "regles_charte": "Terminologie juridique de transfert de technologies et de protection OAPI.",
                "exemple_redaction": "Accord-cadre d'accélération technologique et d'accès aux infrastructures de prototypage avancées du CIAT...",
            },
        ],
    },
    {
        "type_code": "proces_verbal",
        "type_nom": "Procès-verbal de sélection",
        "modeles": [
            {
                "nom": "Format Procès-Verbal Standard du Comité",
                "apercu": "Document officiel consignant les délibérations et décisions du comité de sélection des projets.",
                "sections": [
                    {
                        "code": "ouverture_seance",
                        "titre": "Ouverture de séance et émargement",
                        "consigne": "Mentionner la date, le lieu à Diamniadio, les membres du jury présents et l'ordre du jour.",
                    },
                    {
                        "code": "synthese_deliberations",
                        "titre": "Examen des projets et délibérations",
                        "consigne": "Résumer les présentations des candidats, points forts et réserves formulées par les évaluateurs.",
                    },
                    {
                        "code": "decisions_classement",
                        "titre": "Décisions d'admission et liste des lauréats",
                        "consigne": "Formuler la décision officielle d'admission en cohorte ou de rejet motivé.",
                    },
                    {
                        "code": "signatures",
                        "titre": "Clôture et formules de signature",
                        "consigne": "Mentionner l'heure de levée de séance et les signataires officiels (Président du comité, Coordonnateur).",
                    },
                ],
                "regles_charte": "Style administratif solennel, formules officielles de procès-verbal de jury.",
                "exemple_redaction": "L'an deux mille vingt-six, le comité de sélection s'est réuni dans la salle du conseil du CIAT à Diamniadio pour statuer sur les candidatures présentées à la cohorte d'incubation...",
            },
            {
                "nom": "Format Relevé de Décisions Synthétique",
                "apercu": "Compte-rendu allégé pour communication interne rapide aux mentors et équipes techniques.",
                "sections": [
                    {
                        "code": "rappel_session",
                        "titre": "Rappel de la session d'arbitrage",
                        "consigne": "Indiquer la cohorte concernée, le nombre de dossiers instruits et la date de la session.",
                    },
                    {
                        "code": "tableau_arbitrages",
                        "titre": "Relevé des avis et recommandations",
                        "consigne": "Synthétiser par projet les points clés et l'orientation donnée par le collège des évaluateurs.",
                    },
                    {
                        "code": "actions_immediates",
                        "titre": "Prochaines étapes de déploiement",
                        "consigne": "Lister les démarches d'onboarding immédiates pour les lauréats retenus.",
                    },
                ],
                "regles_charte": "Clarté, concision, style orienté action et suivi opérationnel.",
                "exemple_redaction": "Relevé de décisions de la session de sélection des projets. Le comité a examiné les dossiers soumis et arrêté les orientations suivantes pour la période d'amorçage...",
            },
            {
                "nom": "Format Rapport d'Évaluation Exhaustif",
                "apercu": "Rapport détaillé pour les ministères de tutelle et bailleurs institutionnels.",
                "sections": [
                    {
                        "code": "cadre_methodologique",
                        "titre": "Méthodologie d'instruction et grille multicritères",
                        "consigne": "Détailler les critères de notation : pertinence, viabilité technique, modèle économique.",
                    },
                    {
                        "code": "analyse_projets",
                        "titre": "Évaluation détaillée par domaine d'intervention",
                        "consigne": "Dresser le bilan statistique des candidatures reçues par pôle technologique.",
                    },
                    {
                        "code": "recommandations_comite",
                        "titre": "Recommandations stratégiques du comité",
                        "consigne": "Formuler des préconisations pour le renforcement des filières et la prochaine cohorte.",
                    },
                    {
                        "code": "annexes_scores",
                        "titre": "Synthèse des notations et conclusion",
                        "consigne": "Présenter le classement général et la clôture officielle du rapport.",
                    },
                ],
                "regles_charte": "Haute tenue institutionnelle, rigueur méthodologique, chiffres et statistiques valorisés.",
                "exemple_redaction": "Rapport annuel d'évaluation du comité de sélection du CIAT. La présente commission s'est attachée à apprécier le potentiel d'impact économique et sociétal des innovations présentées...",
            },
        ],
    },
]


def seed_documents(apps, schema_editor):
    TypeDocument = apps.get_model("documents", "TypeDocument")
    ModeleDocument = apps.get_model("documents", "ModeleDocument")

    for item in INITIAL_DATA:
        type_obj, _ = TypeDocument.objects.get_or_create(
            code=item["type_code"],
            defaults={"nom": item["type_nom"]},
        )
        for mod in item["modeles"]:
            ModeleDocument.objects.get_or_create(
                type=type_obj,
                nom=mod["nom"],
                defaults={
                    "apercu": mod["apercu"],
                    "sections": mod["sections"],
                    "regles_charte": mod["regles_charte"],
                    "exemple_redaction": mod["exemple_redaction"],
                },
            )


def rollback_documents(apps, schema_editor):
    TypeDocument = apps.get_model("documents", "TypeDocument")
    TypeDocument.objects.filter(
        code__in=["appel_candidatures", "fiche_projet", "convention", "proces_verbal"]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("documents", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_documents, rollback_documents),
    ]
