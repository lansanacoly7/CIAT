"""Dictionnaire et définitions méthodologiques des indicateurs décisionnels (P3).

Ce fichier constitue la source unique de vérité ('single source of truth') pour :
1. L'endpoint d'API REST : GET /api/analytics/indicateurs/definitions/
2. La page méthodologique du tableau de bord : /tableau-de-bord/methodologie
3. Le livrable d'analyse et d'audit : docs/livrables/analyse_donnees.md
"""

INDICATEURS_DEFINITIONS = [
    {
        "code": "idees_recues",
        "nom": "Idées reçues (Total des projets enregistrés)",
        "categorie": "Entonnoir d'incubation",
        "definition": (
            "Nombre total de projets et d'initiatives enregistrés dans la plateforme CIAT "
            "pour la période ou les filtres sélectionnés, quel que soit leur niveau de maturité actuel."
        ),
        "formule": "COUNT(core_projet.id) [selon filtres debut, fin, cohorte, domaine]",
        "periode": "Période sélectionnée ou cumul historique (date de création du projet : cree_le).",
        "source": "apps.core.models.Projet (table core_projet)",
        "limites": (
            "Comprend l'ensemble des projets créés, y compris les projets restés au stade d'ébauche "
            "ou d'idée non encore formalisée par un dossier complet."
        ),
        "interpretation": (
            "Mesure la notoriété, l'attractivité du centre et le volume brut du sourcing territorial. "
            "Un volume élevé valide la visibilité des appels à candidatures."
        ),
    },
    {
        "code": "dossiers_deposes",
        "nom": "Dossiers formellement déposés",
        "categorie": "Entonnoir d'incubation",
        "definition": (
            "Nombre de dossiers de candidature officiellement soumis pour instruction et évaluation, "
            "ayant dépassé le stade de brouillon."
        ),
        "formule": "COUNT(incubator_dossier.id) WHERE statut != 'brouillon'",
        "periode": "Période d'évaluation ou filtre cohorte.",
        "source": "apps.incubator.models.Dossier (table incubator_dossier rattachée à core_projet)",
        "limites": (
            "Exclut les dossiers en cours de rédaction non encore soumis par les porteurs (brouillons). "
            "Si aucun dossier formalisé n'est rattaché dans un sous-ensemble filtré, le dénominateur "
            "se base sur les projets ayant le statut 'depose' ou supérieur."
        ),
        "interpretation": (
            "Mesure la conversion effective des idées brutes en candidatures complètes et recevables. "
            "L'écart entre idées reçues et dossiers déposés révèle la complexité perçue du dossier de candidature."
        ),
    },
    {
        "code": "projets_selectionnes",
        "nom": "Projets retenus par le comité de sélection",
        "categorie": "Entonnoir d'incubation",
        "definition": (
            "Nombre de projets ayant reçu un avis favorable du comité de sélection et admis au sein "
            "d'un programme d'accompagnement du CIAT (statut sélectionné, incubé, prototype ou terminé)."
        ),
        "formule": (
            "COUNT(core_projet.id) WHERE statut IN ('selectionne', 'incube', 'prototype', 'termine')"
        ),
        "periode": "Date de décision du comité ou date de rattachement à la cohorte.",
        "source": "apps.core.models.Projet et apps.incubator.models.DecisionDossier",
        "limites": (
            "Prend en compte les projets sélectionnés même si l'incubation physique effective "
            "n'a pas encore débuté au moment de la mesure."
        ),
        "interpretation": (
            "Témoigne de la capacité d'accueil et du niveau d'exigence qualitatif fixé par le comité "
            "scientifique et technique du CIAT."
        ),
    },
    {
        "code": "projets_incubes",
        "nom": "Projets activement incubés",
        "categorie": "Entonnoir d'incubation",
        "definition": (
            "Nombre de projets bénéficiant d'un parcours d'incubation opérationnel au CIAT "
            "(accès aux ateliers, laboratoires, mentorat dédié et suivi des jalons)."
        ),
        "formule": (
            "COUNT(core_projet.id) WHERE statut IN ('incube', 'prototype', 'termine')"
        ),
        "periode": "Cohorte en cours ou période de conventionnement actif.",
        "source": "apps.core.models.Projet, apps.incubator.models.AffectationMentor",
        "limites": (
            "Dénombre les projets ayant franchi l'étape contractuelle d'entrée en incubation. "
            "N'inclut pas les projets sélectionnés en attente de démarrage de cohorte."
        ),
        "interpretation": (
            "Mesure la charge réelle d'encadrement des équipes techniques et des mentors du CIAT."
        ),
    },
    {
        "code": "prototypes",
        "nom": "Prototypes industriels et fonctionnels validés",
        "categorie": "Entonnoir d'incubation",
        "definition": (
            "Nombre de projets ayant abouti à un prototype physique, mécanique, numérique ou biomédical "
            "opérationnel et testé en conditions réelles ou de laboratoire (statut prototype ou terminé)."
        ),
        "formule": "COUNT(core_projet.id) WHERE statut IN ('prototype', 'termine')",
        "periode": "Date de validation du jalon prototype.",
        "source": "apps.core.models.Projet (statut='prototype' ou 'termine'), apps.gallery.models.FicheInnovation",
        "limites": (
            "Un projet au statut prototype peut avoir été validé en atelier sans avoir encore fait "
            "l'objet d'une publication publique dans la Galerie des Innovations."
        ),
        "interpretation": (
            "Indicateur majeur d'impact et de transfert technologique de l'institut. Reflète la concrétisation "
            "de la R&D appliquée en produits tangibles."
        ),
    },
    {
        "code": "taux_selection",
        "nom": "Taux de sélection global",
        "categorie": "Entonnoir d'incubation",
        "definition": (
            "Pourcentage de projets retenus pour incubation par rapport au nombre de dossiers formellement déposés."
        ),
        "formule": "(Projets sélectionnés / Dossiers déposés) × 100",
        "periode": "Par cohorte ou agrégat global filtré.",
        "source": "Calculé à partir de core_projet et incubator_dossier",
        "limites": (
            "Le taux de sélection compte les dossiers formellement déposés et non les simples idées reçues. "
            "Si aucun dossier formalisé n'est enregistré dans l'échantillon, le dénominateur bascule sur les idées reçues."
        ),
        "interpretation": (
            "Reflète la sélectivité du jury. Un taux équilibré garantit à la fois l'excellence des projets accueillis "
            "et le plein emploi des capacités du fablab et des plateformes technologiques."
        ),
    },
    {
        "code": "par_domaine",
        "nom": "Répartition sectorielle par domaine d'innovation",
        "categorie": "Typologie & Diversité",
        "definition": (
            "Distribution volumétrique et relative des projets selon les 7 domaines d'intervention prioritaires du CIAT."
        ),
        "formule": "COUNT(core_projet.id) GROUP BY domaine.nom",
        "periode": "Période active.",
        "source": "apps.core.models.Domaine (table core_domaine)",
        "limites": (
            "Chaque projet est affecté à un domaine principal unique. Les innovations pluridisciplinaires "
            "(ex: AgriTech combinant TIC et Agriculture) sont classées selon leur application dominante."
        ),
        "interpretation": (
            "Permet de s'assurer de l'alignement des incubations avec les priorités socio-économiques "
            "du Sénégal et du bassin de Diamniadio."
        ),
    },
    {
        "code": "par_cohorte",
        "nom": "Progression et maturité par cohorte",
        "categorie": "Typologie & Diversité",
        "definition": (
            "Comparaison de la progression du pipeline d'incubation à travers les différentes promotions annuelles "
            "(Total des candidatures, Projets sélectionnés, Prototypes finalisés)."
        ),
        "formule": (
            "SELECT cohorte, COUNT(id) AS total, COUNT(selectionnes) AS selectionnes, "
            "COUNT(prototypes) AS prototypes GROUP BY cohorte.nom"
        ),
        "periode": "Historique annuel pluriannuel (2024, 2025, 2026).",
        "source": "apps.core.models.Cohorte (table core_cohorte)",
        "limites": (
            "Les cohortes récentes (ex: 2026) affichent un taux de prototypes nul car elles sont en phase initiale "
            "d'idéation ou de sélection."
        ),
        "interpretation": (
            "Visualise le cycle de vie de l'incubation : les cohortes matures (2024) affichent 100% de prototypes, "
            "tandis que les cohortes intermédiaires (2025) progressent vers la phase prototype."
        ),
    },
    {
        "code": "par_genre",
        "nom": "Indicateur d'inclusivité et parité de genre",
        "categorie": "Typologie & Diversité",
        "definition": (
            "Proportion de projets portés par des femmes entrepreneures par rapport aux hommes porteurs de projet."
        ),
        "formule": "COUNT(core_projet.id) GROUP BY porteur.genre (F, H, A)",
        "periode": "Cumul des projets enregistrés.",
        "source": "apps.core.models.User.genre (table core_user)",
        "limites": (
            "L'indicateur reflète le genre de la personne enregistrée comme porteur principal du projet. "
            "Il ne capture pas la parité interne des équipes pluridisciplinaires complètes."
        ),
        "interpretation": (
            "Évalue l'engagement du CIAT en faveur de l'entrepreneuriat féminin et de l'accès des femmes aux carrières STIM."
        ),
    },
    {
        "code": "evolution_mensuelle",
        "nom": "Dynamique temporelle des dépôts de projets",
        "categorie": "Typologie & Diversité",
        "definition": (
            "Courbe d'évolution chronologique mensuelle du nombre de projets créés dans la plateforme."
        ),
        "formule": "COUNT(core_projet.id) GROUP BY TruncMonth(cree_le)",
        "periode": "Historique glissant mois par mois.",
        "source": "apps.core.models.Projet.cree_le",
        "limites": (
            "Les pics mensuels coïncident généralement avec les campagnes de communication et les dates limites d'appels à projets."
        ),
        "interpretation": (
            "Mesure la saisonnalité du flux de projets et l'impact direct des campagnes d'appels à projets."
        ),
    },
    {
        "code": "total_finance",
        "nom": "Volume total des financements mobilisés",
        "categorie": "Financements & Ressources",
        "definition": (
            "Montant cumulé des financements accordés ou contractualisés au profit des projets incubés "
            "(subventions, concours, prêts d'honneur, accélérateurs, fonds institutionnels)."
        ),
        "formule": "SUM(analytics_financement.montant) en Francs CFA (XOF)",
        "periode": "Exercice en cours ou cumul historique filtrable.",
        "source": "apps.analytics.models.Financement (table analytics_financement)",
        "limites": (
            "Représente les montants engagés et contractualisés. Ne garantit pas le versement immédiat "
            "sur les comptes des porteurs sans vérification des décaissements."
        ),
        "interpretation": (
            "Quantifie l'effet de levier financier du CIAT : capacité à attirer des capitaux et des subventions "
            "pour accélérer le développement technologique des startups incubées."
        ),
    },
    {
        "code": "financements_decaisses",
        "nom": "Financements effectivement décaissés",
        "categorie": "Financements & Ressources",
        "definition": (
            "Montant cumulé des financements ayant fait l'objet d'un déblocage effectif "
            "(statut 'decaiss') au profit des activités des porteurs de projet."
        ),
        "formule": "SUM(analytics_financement.montant) WHERE statut = 'decaiss'",
        "periode": "Période budgétaire active.",
        "source": "apps.analytics.models.Financement (table analytics_financement)",
        "limites": (
            "Dépend du rythme de validation des justificatifs de dépenses et des jalons techniques d'étape."
        ),
        "interpretation": (
            "Mesure la liquidité réelle injectée dans les projets. Le ratio décaissements / engagements "
            "reflète la célérité administrative et le respect des échéances."
        ),
    },
    {
        "code": "partenariats_actifs",
        "nom": "Partenariats conventionnés en vigueur",
        "categorie": "Partenariats & Réseau",
        "definition": (
            "Nombre d'accords et de conventions de partenariat opérationnels (statut 'actif') "
            "signés avec des partenaires industriels, financiers, académiques ou institutionnels."
        ),
        "formule": "COUNT(analytics_partenariat.id) WHERE statut = 'actif'",
        "periode": "Conventions valides à date.",
        "source": "apps.analytics.models.Partenariat (table analytics_partenariat)",
        "limites": (
            "Prend en compte les partenariats formalisés au niveau de la plateforme. Les conventions "
            "informelles ou en cours de négociation ne sont pas comptabilisées."
        ),
        "interpretation": (
            "Mesure la richesse de l'écosystème d'innovation et le réseau d'appui mobilisable pour les porteurs."
        ),
    },
    {
        "code": "jalons_en_retard",
        "nom": "Jalons critiques en retard d'exécution",
        "categorie": "Gouvernance & Jalons",
        "definition": (
            "Nombre d'étapes clés ou de jalons d'incubation dont la date d'échéance prévisionnelle est dépassée "
            "alors que le jalon est toujours au statut 'a_faire' ou 'en_cours'."
        ),
        "formule": "COUNT(incubator_jalon.id) WHERE echeance < CURRENT_DATE AND statut != 'fait'",
        "periode": "Contrôle en temps réel.",
        "source": "apps.incubator.models.Jalon (propriété dynamique en_retard)",
        "limites": (
            "Un retard sur un jalon intermédiaire ne bloque pas nécessairement l'ensemble du projet si "
            "des voies de contournement technique ont été mises en œuvre par le mentor."
        ),
        "interpretation": (
            "Indicateur d'alerte précoce pour l'équipe de coordination. Déclenche des revues de projet ciblées "
            "pour débloquer les verrous techniques ou administratifs."
        ),
    },
    {
        "code": "taux_conversion_prototype",
        "nom": "Taux de conversion vers le prototype",
        "categorie": "Entonnoir d'incubation",
        "definition": (
            "Pourcentage des projets sélectionnés qui parviennent à concevoir et valider un prototype fonctionnel."
        ),
        "formule": "(Prototypes réalisés / Projets sélectionnés) × 100",
        "periode": "Mesure sur les cohortes ayant achevé ou avancé leur cycle d'incubation.",
        "source": "apps.core.models.Projet",
        "limites": (
            "Ce ratio doit être interprété par cohorte : sur une cohorte récente (ex: 2026), ce taux est "
            "structurellement bas car les projets viennent d'entrer en incubation."
        ),
        "interpretation": (
            "Indicateur d'efficacité technique des installations du CIAT (fablabs, bancs d'essai, ateliers)."
        ),
    },
]

CATEGORIES_INDICATEURS = [
    "Entonnoir d'incubation",
    "Typologie & Diversité",
    "Financements & Ressources",
    "Partenariats & Réseau",
    "Gouvernance & Jalons",
]
