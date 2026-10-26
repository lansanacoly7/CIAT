# Cahier des Charges Fonctionnel et Technique

> **Plateforme Numérique Intégrée du CIAT et de son Incubateur**  
> **Institution :** Centre d'Innovation, d'Application et de Transfert (CIAT) — ISEP Amadou Traoré, Diamniadio  
> **Auteur :** Lansana Coly (Lead technique) — Phase 3 & 4  
> **Référence académique :** Évaluation pratique du cours d'Intelligence Artificielle Générative (Livrable Obligatoire N° 1)  
> **Avertissement méthodologique :** La plateforme n'est **pas déployée en production** (fonctionnement en local et en intégration continue). L'ensemble des données injectées sont **strictement fictives**. Les fonctionnalités d'IA générative **dépendent de fournisseurs externes gratuits** soumis à quotas et aléas réseau.

---

## 1. Contexte Institutionnel et Justification du Projet

### 1.1 Le CIAT et l'ISEP Amadou Traoré
L'Institut Supérieur d'Enseignement Professionnel (ISEP) Amadou Traoré de Diamniadio forme des techniciens supérieurs hautement qualifiés et promeut activement l'entrepreneuriat technologique au Sénégal. En son sein, le **Centre d'Innovation, d'Application et de Transfert (CIAT)** a pour mission stratégique :
- La valorisation de la recherche appliquée et le transfert de technologies vers le tissu économique local.
- L'accueil, la sélection et l'accompagnement des porteurs de projets innovants via son **Incubateur d'entreprises**.
- L'animation de pôles technologiques répondant aux priorités du Plan Sénégal Émergent (agroécologie, énergies renouvelables, numérique/IA, mécanique, santé, éducation).

### 1.2 Problématique et Besoins Numériques
Jusqu'alors, les flux de candidatures, les délibérations de jurys, le suivi du mentorat et la valorisation des prototypes souffraient d'un fractionnement des outils (fichiers bureautiques non versionnés, échanges d'emails non sécurisés, absence de statistiques consolidées en temps réel).  
La plateforme numérique CIAT a été conçue pour fédérer l'intégralité du cycle de vie de l'innovation au sein d'une architecture applicative unique, robuste, ergonomique et augmentée par des fonctionnalités d'**intelligence artificielle générative** strictement encadrées.

---

## 2. Profils d'Utilisateurs et Matrice des Droits (RBAC)

La plateforme repose sur une segmentation stricte en **6 rôles d'utilisateurs** matérialisée par le champ `role` du modèle `apps.core.models.User` et appliquée par des permissions personnalisées (`IsAuthenticated`, `ReadOnlyOrRole`, permissions par module).

| Rôle | Description métier | Périmètre d'action principal | Restrictions et Interdictions strictes |
|---|---|---|---|
| **Visiteur public** (`visiteur` ou anonyme) | Étudiant, chercheur, partenaire, investisseur ou citoyen. | Consultation des actualités, événements, appels à projets, partenaires, documents téléchargeables, annuaire public des projets incubés, galerie des innovations et formulaires de contact / candidature. | Aucun accès aux données privées (emails/téléphones de porteurs masqués), aux dossiers en cours d'instruction, ni aux fonctions d'administration. |
| **Porteur de projet** (`porteur`) | Candidat ou entrepreneur sélectionné pour l'incubation. | Gestion de son profil, création et modification de son projet, soumission de son dossier avec pièces jointes obligatoires, suivi des jalons de son projet, dépôt de preuves, proposition de fiche de galerie, accès à l'assistant IA. | Strict cloisonnement : interdiction d'accéder aux projets et dossiers d'autrui, interdiction de modifier son dossier après soumission, interdiction de s'auto-évaluer ou de s'auto-affecter un mentor. |
| **Membre du comité** (`membre_comite`) | Expert technique, enseignant ou juré chargé de l'instruction. | Consultation des dossiers soumis complets, notation multicritère selon la grille active, saisie d'avis qualitatifs et recommandations techniques. | Interdiction de trancher la décision finale (réservée au coordonnateur), interdiction d'évaluer deux fois le même dossier, interdiction d'altérer les grilles d'évaluation. |
| **Mentor** (`mentor`) | Tuteur métier ou professionnel accompagnant une startup. | Consultation du projet assigné, définition d'objectifs, création et cadencement des jalons, consultation des alertes de retard, dépôt de commentaires et bilans de suivi (à 3 et 6 mois). | Accès strictement limité aux projets qui lui sont officiellement affectés par le coordonnateur. Interdiction de consulter les coordonnées d'autres projets non mentorés. |
| **Coordonnateur** (`coordonnateur`) | Responsable opérationnel de l'incubateur CIAT. | Supervision globale : arbitrage et décision motivée post-évaluation (`accepte`/`refuse`), affectation des mentors, validation des fiches de galerie, génération et publication des documents officiels, tableaux de bord de suivi. | Soumis à la traçabilité des décisions et au respect de l'immuabilité des documents institutionnels validés. |
| **Administrateur** (`administrateur`) | Responsable technique et de la gouvernance de la plateforme. | Gestion des comptes et des rôles, configuration des grilles d'évaluation, déclenchement des réindexations documentaires, surveillance des journaux d'erreurs et des métriques système. | Ne doit pas outrepasser les règles de validation métier lors de l'usage des endpoints d'API. |

---

## 3. Exigences Fonctionnelles Détaillées par Module

### 3.1 Module P1 : Portail Institutionnel Intelligent (`apps.portal`)
- **F-P1-01 (Contenus publics) :** Publication d'actualités catégorisées, d'événements à venir avec filtrage chronologique (`?a_venir=1`), et d'appels à candidatures.
- **F-P1-02 (Statut dynamique des appels) :** Détermination automatique du statut `ouvert` ou `clos` selon l'échéance `date_limite`.
- **F-P1-03 (Annuaire des innovations) :** Consultation publique filtrable (par domaine, cohorte, statut) des projets activement incubés (`incube`, `prototype`, `termine`), avec occultation stricte des données personnelles des porteurs.
- **F-P1-04 (Espace partenaires et documentaire) :** Présentation des partenaires institutionnels et mise à disposition de documents téléchargeables publics (chartes, règlements).
- **F-P1-05 (Contact sécurisé) :** Formulaire de contact public avec limitation de débit (throttle), validation syntaxique de l'email et traçabilité interne.

### 3.2 Module P2 : Gestion de l'Incubateur (`apps.incubator`)
- **F-P2-01 (Dossier de candidature) :** Création d'un dossier en statut `brouillon` associé à un projet innovant.
- **F-P2-02 (Contrôle de complétude dynamique) :** Dépôt des trois pièces obligatoires (*Fiche de projet*, *Présentation de l'équipe*, *Budget prévisionnel*) avec calcul du taux de complétude (0%, 33%, 66%, 100%).
- **F-P2-03 (Validation de sécurité binaire) :** Contrôle des extensions autorisées, de la taille maximale (10 Mo) et inspection des octets magiques (Magic Bytes) pour certifier l'intégrité des documents PDF, Word et images.
- **F-P2-04 (Soumission verrouillée) :** Soumission officielle réservée aux dossiers à 100% de complétude, figeant les pièces jointes et passant le projet au statut `depose`.
- **F-P2-05 (Évaluation multicritère du comité) :** Saisie des notes sur la grille active (5 critères standard pondérés), calcul automatique du score moyen normalisé sur 20, transition du dossier vers `en_evaluation`.
- **F-P2-06 (Décision motivée du jury) :** Enregistrement de l'arbitrage officiel par le coordonnateur :
  - *Acceptation* ➔ dossier `accepte`, projet `selectionne`.
  - *Rejet* ➔ dossier `refuse`, projet `rejete`.
- **F-P2-07 (Mentorat et cadencement opérationnel) :** Affectation nominative d'un mentor, définition d'objectifs, création de jalons avec détection automatique des retards (`en_retard=True`), téléversement de preuves et commentaires d'alerte.
- **F-P2-08 (Bilans de suivi) :** Rédaction formalisée des synthèses d'avancement à 3 mois et 6 mois avec indicateurs d'étape.

### 3.3 Module P3 : Tableau de Bord Décisionnel (`apps.analytics`)
- **F-P3-01 (Métriques consolidées) :** Calcul en temps réel des indicateurs clés : idées reçues, dossiers déposés, projets sélectionnés, projets incubés, prototypes réalisés, taux de sélection.
- **F-P3-02 (Ventilations multidimensionnelles) :** Répartition des projets par domaine technologique, comparaison inter-cohortes et répartition par genre des fondateurs (suivi de la parité).
- **F-P3-03 (Évolution chronologique) :** Suivi mensuel de la dynamique de dépôt sur 18 mois.
- **F-P3-04 (Filtrage universel) :** Capacité de croiser les indicateurs par plage de dates (`debut`/`fin`), domaine, cohorte et statut.

### 3.4 Module P4 : Assistant Conversationnel IA (`apps.assistant`)
- **F-P4-01 (RAG documentaire strict) :** Découpage en passages (chunking de 200 à 300 mots) des documents publics, recherche lexicale avec lemmatisation, synonymes et tolérance aux fautes.
- **F-P4-02 (Citations et traçabilité des sources) :** Obligation pour le modèle IA de répondre en mode JSON strict (`ai.chat(..., json_mode=True)`) en fournissant la liste `passages_utilises`. Validation serveur des numéros existants et injection des citations complètes (`document_id`, `titre`, `extrait`).
- **F-P4-03 (Refus explicite d'inventer) :** Si les extraits transmis ne contiennent pas la réponse, obligation pour le modèle de refuser d'extrapoler ; le serveur garantit que `sources` reste vide (`[]`).
- **F-P4-04 (Atelier de rédaction assistée) :** Mode interactif d'aide à la formalisation (pitch, analyse SWOT, fiche projet) avec consigne absolue d'insérer des marqueurs `[À COMPLÉTER]` au lieu d'inventer des métriques ou des partenaires.
- **F-P4-05 (Transparence IA) :** Présence systématique de l'avertissement légal d'utilisation de l'IA sur chaque réponse générée.

### 3.5 Module P5 : Générateur Intelligent de Documents (`apps.documents`)
- **F-P5-01 (Gabarits institutionnels) :** Bibliothèque de modèles conformes à la charte ISEP/CIAT (appels à candidatures, conventions d'incubation, fiches de projet, procès-verbaux de sélection).
- **F-P5-02 (Génération structurée par IA) :** Injection des données réelles du projet et du contexte, génération section par section au format JSON strict, mécanisme de double tentative en cas de réponse tronquée.
- **F-P5-03 (Cycle de révision et immuabilité) :** Historique versionné des modifications (`VersionDocument`). Verrouillage strict en statut `valide` ou `publie` interdisant toute altération (`409 Conflict`).
- **F-P5-04 (Export binaire PDF conforme) :** Génération binaire de fichiers PDF aux couleurs du CIAT avec en-tête officiel, pagination et signature `%PDF-`.

### 3.6 Module P6 : Galerie Numérique des Innovations (`apps.gallery`)
- **F-P6-01 (Fiches de valorisation) :** Présentation publique des prototypes : problème, solution technologique, profil de l'équipe (sans coordonnées privées), niveau d'avancement et médias (photos, vidéos, démos).
- **F-P6-02 (Workflow d'approbation) :** Soumission par le porteur (`brouillon` ➔ `en_validation`), contrôle éditorial et publication par le coordonnateur (`publie`).
- **F-P6-03 (QR Codes promotionnels dynamiques) :** Génération à la volée de codes QR PNG renvoyant vers l'URL officielle de la fiche, configurée de façon dynamique via la variable `SITE_URL`.
- **F-P6-04 (Statistiques d'audience) :** Incrémentation automatique du compteur de vues lors de chaque consultation publique.

---

## 4. Exigences Non-Fonctionnelles

### 4.1 Sécurité et Confidentialité
- **Authentification forte :** Tokens JWT (`access` d'une durée de 30 min, `refresh` rotatif). Hachage des mots de passe en PBKDF2 en production.
- **Protection des données personnelles :** Strict masquage des adresses électroniques et numéros de téléphone des porteurs et mentors sur l'ensemble des endpoints publics ou partagés.
- **Anti-tampering & Traçabilité :** Vérification binaire des fichiers téléversés pour interdire les attaques par renommage d'extension ou traversal path (`sanitize_filename`).
- **Limitation de débit (Throttling) :** Protection des endpoints sensibles (`/api/auth/token/`, `/api/contact/`, endpoints IA) contre les attaques par force brute ou déni de service.

### 4.2 Performance et Disponibilité
- **Temps de réponse API :** Objectif de réponses rapides sur les requêtes standards, grâce à l'optimisation des requêtes Django (aucune mesure de charge n'a encore été réalisée) (`select_related`, `prefetch_related`, agrégations SQL natives).
- **Vitesse de la suite de tests :** Exécution complète de la suite de 256 tests automatisés (100 % passants) en environ 30 à 40 secondes sur machine standard grâce à l'usage de `MD5PasswordHasher` en contexte de test.
- **Tolérance aux pannes des services d'IA :** Mécanisme de fallback ordonné multi-fournisseurs (Groq ➔ Gemini) avec gestion gracieuse des erreurs (`503 Service Unavailable` ou `502 Bad Gateway` avec messages clairs en français). Les services d'IA reposent sur des quotas gratuits de fournisseurs tiers et demeurent soumis à des limites de requêtes ou des indisponibilités ponctuelles.

### 4.3 Ergonomie et Identité Visuelle
- **Conformité à la charte ISEP/CIAT :** Respect rigoureux de la palette chromatique officielle définie dans l'application (Brun CIAT `#612D10`, Brun Nuit `#24140D`, Ocre Doré CIAT `#C99A68`, Vert `#2E7D32`), de la typographie et des règles de contraste WCAG AA.
- **Accessibilité et Réactivité :** Interface responsive adaptée aux ordinateurs de bureau, tablettes et smartphones (cibles tactiles >= 44x44px).

---

## 5. Limites et Périmètre d'Exclusion

Pour garantir la faisabilité, la robustesse et la focalisation sur les besoins clés du CIAT, les éléments suivants sont explicitement exclus du périmètre de la présente version :
1. **Paiement et décaissement en direct :** La plateforme gère l'instruction, l'octroi et la traçabilité des financements d'amorçage, mais n'effectue aucun virement bancaire ni opération financière directe.
2. **Hébergement local d'un modèle de langage souverain :** L'inférence LLM repose sur des APIs standardisées (OpenAI-compatible) sécurisées ; aucun déploiement de modèle local lourd (ex. LLaMA 70B sur GPU sur site) n'est requis à ce stade.
3. **Signature électronique qualifiée au sens eIDAS :** La validation des documents administratifs repose sur une authentification forte par compte utilisateur et une empreinte cryptographique en base, sans recours à un tiers de confiance payant.
