"""Migration de données pour initialiser les 9 types de documents et 27 modèles de documents du CIAT."""
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
    {
        "type_code": "attestation",
        "type_nom": "Attestation",
        "modeles": [
            {
                "nom": "Format Attestation d'Incubation",
                "apercu": "Attestation officielle certifiant l'admission et le statut d'incubation d'un projet et de son porteur au sein du CIAT.",
                "sections": [
                    {
                        "code": "identification",
                        "titre": "Identification du bénéficiaire et du projet",
                        "consigne": "Indiquer l'identité complète du porteur de projet, le titre du projet innovant et le domaine technologique rattaché.",
                    },
                    {
                        "code": "statut_incubation",
                        "titre": "Statut et période d'incubation",
                        "consigne": "Attester de l'admission officielle au programme d'incubation du CIAT à Diamniadio, de la date de démarrage et de la cohorte d'affectation.",
                    },
                    {
                        "code": "dispositions_legales",
                        "titre": "Droits conférés et validité",
                        "consigne": "Préciser l'accès aux infrastructures du FabLab, l'accompagnement technique et la durée de validité de l'attestation.",
                    },
                    {
                        "code": "delivrance",
                        "titre": "Formule de délivrance et signature",
                        "consigne": "Indiquer la date de délivrance, le lieu (Diamniadio) et la mention pour servir et valoir ce que de droit par le Coordonnateur du CIAT.",
                    },
                ],
                "regles_charte": "Format officiel solennel, ton administratif strict. Laisser [À COMPLÉTER : ...] pour les références d'enregistrement ou numéros de registre inconnus.",
                "exemple_redaction": "Le Coordonnateur du Centre d'Innovation, d'Application et de Transfert (CIAT) de l'ISEP Diamniadio atteste par la présente que le porteur de projet désigné est officiellement admis au sein de la cohorte d'incubation technologique...",
            },
            {
                "nom": "Format Attestation de Fin de Parcours / Réussite",
                "apercu": "Certificat délivré au porteur de projet validant l'achèvement du cycle d'incubation et la réalisation du prototype.",
                "sections": [
                    {
                        "code": "laureat",
                        "titre": "Identité du lauréat et projet abouti",
                        "consigne": "Mentionner le porteur, le nom du projet et le prototype industriel ou technologique développé.",
                    },
                    {
                        "code": "competences_validees",
                        "titre": "Compétences et jalons techniques validés",
                        "consigne": "Lister les jalons franchis : preuve de concept, modélisation FabLab, modèle économique et conformité.",
                    },
                    {
                        "code": "mention_reussite",
                        "titre": "Avis de la commission d'évaluation",
                        "consigne": "Mentionner la décision favorable du comité d'évaluation de sortie d'incubation et les perspectives industrielles.",
                    },
                    {
                        "code": "visa_direction",
                        "titre": "Signatures et homologation",
                        "consigne": "Formule officielle d'homologation signée par la direction du CIAT / ISEP Diamniadio.",
                    },
                ],
                "regles_charte": "Haute valeur honorifique et institutionnelle, vocabulaire technique valorisant les acquis.",
                "exemple_redaction": "Le CIAT certifie que le projet a franchi avec succès l'ensemble des jalons de maturation technologique prévus au programme d'incubation...",
            },
            {
                "nom": "Format Attestation de Présence et d'Hébergement au FabLab",
                "apercu": "Attestation administrative justifiant de la présence régulière et de l'utilisation des ateliers techniques par une équipe de projet.",
                "sections": [
                    {
                        "code": "beneficiaires",
                        "titre": "Membres de l'équipe et projet",
                        "consigne": "Identifier les membres de l'équipe projet autorisés à fréquenter les espaces techniques du CIAT.",
                    },
                    {
                        "code": "locaux_equipements",
                        "titre": "Espaces et équipements assignés",
                        "consigne": "Détailler les installations fréquentées : espace coworking, atelier de prototypage rapide, bancs d'essais.",
                    },
                    {
                        "code": "periode_assiduite",
                        "titre": "Période couverte et assiduité constatée",
                        "consigne": "Certifier l'assiduité et le respect des consignes de sécurité HSE au sein du campus de Diamniadio.",
                    },
                    {
                        "code": "cloture_administrative",
                        "titre": "Mention pour servir et valoir",
                        "consigne": "Délivrance officielle à la demande de l'intéressé pour valoir ce que de droit.",
                    },
                ],
                "regles_charte": "Style administratif concis et probant, traçabilité des accès.",
                "exemple_redaction": "Le Centre atteste que les membres du projet susnommé utilisent régulièrement les bancs d'essais et les machines à commande numérique du FabLab...",
            },
        ],
    },
    {
        "type_code": "fiche_partenaire",
        "type_nom": "Fiche partenaire",
        "modeles": [
            {
                "nom": "Format Partenaire Institutionnel & Académique",
                "apercu": "Fiche descriptive d'un partenaire institutionnel, universitaire ou centre de recherche affilié au CIAT.",
                "sections": [
                    {
                        "code": "presentation_organisme",
                        "titre": "Identité de l'institution partenaire",
                        "consigne": "Raison sociale, statut juridique, tutelle administrative, siège social et domaines de spécialité.",
                    },
                    {
                        "code": "axes_collaboration",
                        "titre": "Domaines de coopération et synergies",
                        "consigne": "Détailler les axes de recherche appliquée, partage de plateaux techniques ou formations certifiantes conjointes.",
                    },
                    {
                        "code": "modalites_partenariat",
                        "titre": "Gouvernance et contacts référents",
                        "consigne": "Désigner les points focaux CIAT et partenaire, ainsi que la fréquence des revues de partenariat.",
                    },
                    {
                        "code": "ressources_mobilisees",
                        "titre": "Moyens mobilisés et apports conjoints",
                        "consigne": "Préciser la mise à disposition d'experts, de laboratoires ou d'accès à des banques de données scientifiques.",
                    },
                ],
                "regles_charte": "Ton diplomatique et académique respectueux des usages interinstitutionnels.",
                "exemple_redaction": "Fiche de partenariat institutionnel conclue entre le CIAT et l'organisme partenaire pour le renforcement des capacités en recherche technologique appliquée...",
            },
            {
                "nom": "Format Partenaire Industriel & Entreprise",
                "apercu": "Fiche de cadrage pour entreprises industrielles apportant mécénat technologique, bancs de tests ou débouchés de marché.",
                "sections": [
                    {
                        "code": "profil_entreprise",
                        "titre": "Fiche signalétique de l'entreprise",
                        "consigne": "Nom commercial, secteur d'activité industrielle, implantation au Sénégal et représentant légal.",
                    },
                    {
                        "code": "offre_valeur_projets",
                        "titre": "Apport aux projets incubés",
                        "consigne": "Détailler l'offre d'accès aux chaînes de production, terrains d'expérimentation in situ ou mentorat d'ingénieurs.",
                    },
                    {
                        "code": "engagements_ciat",
                        "titre": "Contreparties et visibilité CIAT",
                        "consigne": "Préciser la visibilité de l'entreprise lors des démo days, l'accès prioritaire aux innovations et le sourcing de talents.",
                    },
                    {
                        "code": "suivi_operations",
                        "titre": "Indicateurs de succès de la coopération",
                        "consigne": "Fixer le nombre d'incubés accompagnés, les pilotes industriels menés et les jalons annuels.",
                    },
                ],
                "regles_charte": "Clarté business et opérationnelle, accent mis sur l'impact économique et l'industrialisation locale.",
                "exemple_redaction": "Partenariat stratégique CIAT - Entreprise industrielle. Cette fiche définit le cadre opérationnel d'intervention auprès des startups incubées...",
            },
            {
                "nom": "Format Bailleur & Partenaire Financier",
                "apercu": "Fiche de suivi pour fonds d'amorçage, banques de développement et agences de coopération finançant les cohortes.",
                "sections": [
                    {
                        "code": "identite_bailleur",
                        "titre": "Identité de l'institution financière ou bailleur",
                        "consigne": "Dénomination du fonds ou de l'agence, mandat d'investissement et zones géographiques d'intervention.",
                    },
                    {
                        "code": "programme_financement",
                        "titre": "Cadre de la convention de financement",
                        "consigne": "Décrire le mécanisme d'appui : subventions d'amorçage, prêts d'honneur ou co-financement des prototypes.",
                    },
                    {
                        "code": "criteres_attribution",
                        "titre": "Critères d'allocation et éligibilité des projets",
                        "consigne": "Détailler les critères ESG, maturité technologique (TRL) et impact sur l'emploi local.",
                    },
                    {
                        "code": "reporting_financier",
                        "titre": "Modalités de justification et audit",
                        "consigne": "Périodicité des rapports d'audit financier, jalons de décaissement et indicateurs d'efficacité des fonds.",
                    },
                ],
                "regles_charte": "Rigueur financière, transparence administrative, respect strict des normes de reporting.",
                "exemple_redaction": "Fiche de suivi du partenaire financier et de coopération internationale. Cadrage des dotations accordées aux porteurs de projets CIAT...",
            },
        ],
    },
    {
        "type_code": "rapport_suivi",
        "type_nom": "Rapport de suivi",
        "modeles": [
            {
                "nom": "Format Bilan d'Étape Périodique (Trimestriel)",
                "apercu": "Rapport de suivi périodique dressant l'avancement technique, financier et commercial d'un projet incubé.",
                "sections": [
                    {
                        "code": "synthese_periode",
                        "titre": "Synthèse de la période et faits marquants",
                        "consigne": "Résumer les activités principales menées durant le trimestre écoulé et l'état d'esprit de l'équipe.",
                    },
                    {
                        "code": "avancement_technique",
                        "titre": "État d'avancement du prototype et R&D",
                        "consigne": "Détailler les fonctionnalités implémentées, tests d'atelier au FabLab et difficultés techniques rencontrées.",
                    },
                    {
                        "code": "accompagnement_mentorat",
                        "titre": "Séances de mentorat et formations suivies",
                        "consigne": "Consigner le nombre d'heures de coaching avec les mentors affectés et les ateliers méthodologiques CIAT.",
                    },
                    {
                        "code": "objectifs_periode_suivante",
                        "titre": "Feuille de route et jalons du prochain trimestre",
                        "consigne": "Fixer les priorités immédiates, livrables attendus et besoins d'arbitrage par la coordination.",
                    },
                ],
                "regles_charte": "Orientation méthodologique, analyse factuelle des écarts entre prévisions et réalisations.",
                "exemple_redaction": "Rapport trimestriel de suivi d'incubation. Ce document retrace la progression technique et les résultats obtenus par le projet au cours du trimestre...",
            },
            {
                "nom": "Format Rapport de Suivi Flash / Mensuel",
                "apercu": "Synthèse rapide mensuelle pour détection précoce des blocages techniques ou administratifs.",
                "sections": [
                    {
                        "code": "metriques_cle_mois",
                        "titre": "Indicateurs d'activité du mois",
                        "consigne": "Temps passé en atelier, livrables produits, budget consommé et effectif actif.",
                    },
                    {
                        "code": "alertes_points_blocage",
                        "titre": "Points d'alerte et blocages critiques",
                        "consigne": "Signaler sans délai les retards d'approvisionnement en composants, pannes machines ou conflits d'équipe.",
                    },
                    {
                        "code": "actions_correctives",
                        "titre": "Plan d'action et soutien CIAT sollicité",
                        "consigne": "Spécifier l'intervention demandée à l'équipe de coordination ou aux experts techniques.",
                    },
                ],
                "regles_charte": "Concision, efficacité, style percutant orienté résolution de problèmes.",
                "exemple_redaction": "Suivi flash mensuel — Projet CIAT. Point d'étape opérationnel sur le franchissement des jalons critiques et les actions de remédiation...",
            },
            {
                "nom": "Format Revue de Mi-Parcours / Évaluation Intermédiaire",
                "apercu": "Bilan approfondi d'évaluation de mi-parcours conditionnant la poursuite du programme d'incubation.",
                "sections": [
                    {
                        "code": "bilan_maturite",
                        "titre": "Évaluation du gain de maturité technologique (TRL)",
                        "consigne": "Comparer le niveau TRL initial lors de l'admission avec le TRL atteint à mi-parcours.",
                    },
                    {
                        "code": "validation_marche",
                        "titre": "Retours terrain et validation du modèle économique",
                        "consigne": "Analyser les entretiens clients, tests utilisateurs et premières intentions d'achat ou partenariats.",
                    },
                    {
                        "code": "conformite_engagements",
                        "titre": "Assiduité et respect des engagements contractuels",
                        "consigne": "Vérifier le respect des clauses de la convention d'incubation et des consignes du campus.",
                    },
                    {
                        "code": "avis_commission",
                        "titre": "Recommandation pour la phase d'accélération finale",
                        "consigne": "Avis motivé du collège des mentors sur le renouvellement de l'hébergement et l'accès aux financements.",
                    },
                ],
                "regles_charte": "Évaluation critique et impartiale, critères transparents, argumentation solide.",
                "exemple_redaction": "Rapport de revue de mi-parcours. La commission technique s'est réunie pour évaluer les livrables d'étape et autoriser l'entrée en phase pilote...",
            },
        ],
    },
    {
        "type_code": "compte_rendu",
        "type_nom": "Compte rendu",
        "modeles": [
            {
                "nom": "Format Compte Rendu de Session de Mentorat",
                "apercu": "Compte rendu rédigé par le mentor ou le porteur à l'issue d'une séance de travail technique ou business.",
                "sections": [
                    {
                        "code": "contexte_reunion",
                        "titre": "Ordre du jour et participants",
                        "consigne": "Date, durée de la séance, participants présents (mentor, porteurs de projet) et thématique abordée.",
                    },
                    {
                        "code": "points_abordes",
                        "titre": "Revue des travaux et analyses",
                        "consigne": "Restituer les échanges sur les choix d'architecture, la stratégie commerciale ou les aspects réglementaires.",
                    },
                    {
                        "code": "recommandations_mentor",
                        "titre": "Conseils et préconisations du mentor",
                        "consigne": "Consigner les orientations méthodologiques données par le mentor et les corrections suggérées.",
                    },
                    {
                        "code": "plan_actions_livrables",
                        "titre": "Actions à réaliser pour la prochaine séance",
                        "consigne": "Tableau d'engagements avec responsable désigné et date butoir de livraison.",
                    },
                ],
                "regles_charte": "Clarté opérationnelle, esprit d'accompagnement bienveillant et rigoureux.",
                "exemple_redaction": "Compte rendu de séance d'accompagnement. La réunion a porté sur l'optimisation du dimensionnement mécanique du prototype et la stratégie d'approvisionnement...",
            },
            {
                "nom": "Format Compte Rendu de Réunion de Coordination Interne",
                "apercu": "Procès-verbal de travail pour les réunions d'équipe hebdomadaires de l'incubateur CIAT.",
                "sections": [
                    {
                        "code": "cadre_reunion",
                        "titre": "Participants et objet de la coordination",
                        "consigne": "Membres de la coordination présents, excusés, projets prioritaires inscrits à l'ordre du jour.",
                    },
                    {
                        "code": "tour_table_projets",
                        "titre": "Tour de table sur les cohortes en cours",
                        "consigne": "Points saillants par filière (AgriTech, Énergie, Numérique, etc.) et statut des livrables attendus.",
                    },
                    {
                        "code": "logistique_plateaux",
                        "titre": "Gestion des plateaux techniques et FabLab",
                        "consigne": "État de fonctionnement des machines, consommables en réserve, planning de réservation des salles.",
                    },
                    {
                        "code": "decisions_arbitrages",
                        "titre": "Décisions actées et répartition des tâches",
                        "consigne": "Attribution des tâches aux membres de l'équipe CIAT avec échéances fermes.",
                    },
                ],
                "regles_charte": "Style de compte rendu administratif d'équipe, traçabilité des arbitrages internes.",
                "exemple_redaction": "Compte rendu de la réunion de coordination opérationnelle de l'incubateur CIAT tenue sur le campus de Diamniadio...",
            },
            {
                "nom": "Format Compte Rendu d'Atelier Technique / Masterclass",
                "apercu": "Synthèse collective d'un atelier pratique dispensé aux incubés (propriété intellectuelle, CAO, pitch).",
                "sections": [
                    {
                        "code": "fiche_atelier",
                        "titre": "Intitulé de l'atelier et intervenant",
                        "consigne": "Thème de la formation, nom et qualité du formateur/expert, cohorte cible invitée.",
                    },
                    {
                        "code": "contenu_pedagogique",
                        "titre": "Enseignements et méthodologies dispensées",
                        "consigne": "Résumer les concepts clés, démonstrations pratiques et outils techniques mis en pratique.",
                    },
                    {
                        "code": "evaluations_retours",
                        "titre": "Participation et retours des incubés",
                        "consigne": "Niveau d'engagement des porteurs de projet, questions récurrentes soulevées et exercices réalisés.",
                    },
                    {
                        "code": "ressources_partagees",
                        "titre": "Supports et prolongements pédagogiques",
                        "consigne": "Lien vers les documentations techniques, gabarits partagés et exercices d'application attendus.",
                    },
                ],
                "regles_charte": "Pédagogie active, transmission de savoirs techniques, alignement sur les référentiels de l'ISEP.",
                "exemple_redaction": "Compte rendu de l'atelier technique spécialisé sur la protection des innovations et les démarches auprès de l'OAPI...",
            },
        ],
    },
    {
        "type_code": "rapport_annuel",
        "type_nom": "Rapport annuel",
        "modeles": [
            {
                "nom": "Format Rapport d'Activité Annuel Global CIAT",
                "apercu": "Document institutionnel de référence retraçant les réalisations, performances et perspectives annuelles du centre.",
                "sections": [
                    {
                        "code": "mot_direction",
                        "titre": "Éditorial de la direction du CIAT / ISEP",
                        "consigne": "Vision stratégique, faits marquants de l'année écoulée et contribution à l'écosystème d'innovation sénégalais.",
                    },
                    {
                        "code": "chiffres_cles",
                        "titre": "Statistiques et indicateurs de performance annuels",
                        "consigne": "Nombre de candidatures reçues, taux d'admission, startups incubées, brevets déposés et emplois créés.",
                    },
                    {
                        "code": "activites_poles",
                        "titre": "Bilan opérationnel par pôle d'activité",
                        "consigne": "Rétrospective des activités : accompagnement incubateur, réalisations FabLab, formations et événements.",
                    },
                    {
                        "code": "perspectives_budget",
                        "titre": "Orientations stratégiques et priorités de l'exercice à venir",
                        "consigne": "Projets de développement, nouveaux partenariats envisagés et perspectives budgétaires [À COMPLÉTER : ...] si non spécifié.",
                    },
                ],
                "regles_charte": "Excellence éditoriale, prestige institutionnel, mise en valeur des résultats probants. Ne pas inventer de budgets non fournis.",
                "exemple_redaction": "Rapport annuel d'activité du CIAT — Exercice 2026. Ce rapport rend compte des avancées significatives réalisées dans le déploiement des filières technologiques d'excellence...",
            },
            {
                "nom": "Format Rapport Annuel de Performance des Startups Incubées",
                "apercu": "Bilan centré sur la trajectoire économique, la viabilité et l'impact terrain des innovations accompagnées.",
                "sections": [
                    {
                        "code": "portrait_cohortes",
                        "titre": "Cartographie des cohortes et profils d'innovateurs",
                        "consigne": "Répartition sectorielle, mixité, niveau d'études des porteurs et ancrage territorial au Sénégal.",
                    },
                    {
                        "code": "maturation_technique",
                        "titre": "Industrialisation et passage à l'échelle des prototypes",
                        "consigne": "Nombre de prototypes fonctionnels validés, essais en conditions réelles et certifications obtenues.",
                    },
                    {
                        "code": "impact_socioeconomique",
                        "titre": "Retombées économiques, création de valeur et emplois",
                        "consigne": "Mesure de l'impact : emplois directs et indirects générés, levées de fonds et premiers chiffres d'affaires.",
                    },
                    {
                        "code": "difficultes_lecons",
                        "titre": "Retours d'expérience et leviers d'amélioration",
                        "consigne": "Analyse des freins rencontrés par les porteurs et pistes d'optimisation de l'offre d'incubation.",
                    },
                ],
                "regles_charte": "Rigueur analytique, valorisation des réussites entrepreneuriales, transparence sur les difficultés.",
                "exemple_redaction": "Bilan annuel d'impact et de maturation entrepreneuriale. Ce document analyse la création de valeur et l'autonomie acquise par les projets incubés...",
            },
            {
                "nom": "Format Rapport Annuel Technique & FabLab",
                "apercu": "Bilan d'exploitation des ateliers technologiques, de la maintenance des équipements et des prototypes usinés.",
                "sections": [
                    {
                        "code": "parc_machines",
                        "titre": "État du parc machines et investissements technologiques",
                        "consigne": "Inventaire des plateaux techniques (usinage, électronique, impression 3D) et maintenance préventive.",
                    },
                    {
                        "code": "projets_prototypes",
                        "titre": "Réalisations et prototypes usinés durant l'année",
                        "consigne": "Typologie des pièces conçues, matériaux consommés et temps d'usinage alloué aux incubés.",
                    },
                    {
                        "code": "securite_formation",
                        "titre": "Sécurité en atelier (HSE) et habilitations délivrées",
                        "consigne": "Bilan des formations sécurité dispensées, conformité HSE et absence d'incident majeur.",
                    },
                    {
                        "code": "recommandations_equipements",
                        "titre": "Besoins d'équipements et renouvellement du matériel",
                        "consigne": "Préconisations techniques pour l'acquisition de nouveaux bancs de test et logiciels de CAO.",
                    },
                ],
                "regles_charte": "Vocabulaire d'ingénierie et de maintenance industrielle rigoureux, respect des normes atelier.",
                "exemple_redaction": "Rapport annuel d'exploitation technique et du FabLab. Bilan de l'utilisation des équipements de prototypage rapide et perspectives de modernisation...",
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
        code__in=[item["type_code"] for item in INITIAL_DATA]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("documents", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_documents, rollback_documents),
    ]
