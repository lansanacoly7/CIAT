# Protection des Données Personnelles et Usage de l'IA (CIAT)

> Ce document décrit de manière exacte et vérifiable le traitement, la conservation, l'exportation et la suppression des données personnelles au sein de la plateforme du **Centre d'Innovation et d'Accélération Technologique (CIAT)**, conformément aux exigences du sujet d'évaluation et aux principes du RGPD.

---

## 1. Données collectées et traitées

La plateforme CIAT collecte et traite uniquement les données strictement nécessaires aux activités d'incubation, de sélection et de promotion technologique :

| Catégorie | Données concernées | Finalité du traitement |
| :--- | :--- | :--- |
| **Profil utilisateur** | Nom, prénom, adresse email, numéro de téléphone, genre, organisation / structure, rôle applicatif. | Authentification JWT sécurisée, identification des porteurs et gestion des habilitations (RBAC). |
| **Projets & Candidatures** | Titre du projet, résumé, problématique, solution, domaine technologique, cohorte, statut, pièces justificatives déposées (PDF, images, tableurs). | Instruction des dossiers d'incubation par l'équipe CIAT, évaluation par le comité et suivi d'accompagnement par les mentors. |
| **Documents officiels** | Fiches projets, conventions, comptes rendus, modèles et historiques de versions de documents. | Traçabilité contractuelle et archivage institutionnel des cohortes. |
| **Échanges Assistant IA** | Historique des conversations et messages échangés avec l'assistant virtuel. | Assistance méthodologique, recherche de documents publics et conseils aux porteurs. |
| **Vitrine Galerie & Partenariats** | Nom, email, organisation, message déposé lors d'une manifestation d'intérêt ou formulaire de contact. | Mise en relation qualifiée entre porteurs de projets innovants, investisseurs et partenaires. |

---

## 2. Durée de conservation

- **Comptes actifs :** Les données restent conservées pendant toute la durée de la relation d'accompagnement et du cycle de vie des projets incubés.
- **Pièces justificatives :** Conservées de manière sécurisée dans l'arborescence média pour les besoins d'audit du comité de sélection.
- **Suppression sur demande :** Dès réception d'une demande d'effacement ou de suppression de compte, l'action est exécutée de manière immédiate en base de données.

---

## 3. Modalités concrètes d'exercice des droits (Code effectif)

### A. Droit à la portabilité — Exportation complète des données
Tout utilisateur connecté peut exporter l'intégralité des données qui le concernent sous un format ouvert et structuré :
- **Endpoint :** `GET /api/auth/me/export/`
- **Format renvoyé :** Fichier JSON téléchargeable (`application/json; charset=utf-8`, en-tête `Content-Disposition: attachment; filename="donnees_personnelles_{id}.json"`).
- **Contenu du fichier d'export :**
  1. Données complètes du profil (identité, email, rôle, dates de connexion) ;
  2. Ensemble des projets portés par l'utilisateur ;
  3. Dossiers de candidatures déposés et liste des pièces justificatives associées ;
  4. Documents rédigés avec le détail de toutes leurs versions ;
  5. Conversations et messages échangés avec l'assistant IA ;
  6. Interactions tracées (manifestations d'intérêt émises et messages de contact).
- **Sécurité et étanchéité :** Un utilisateur ne peut strictement exporter que ses propres données (HTTP 401 pour un anonyme, isolation vérifiée par tests automatisés).

### B. Droit à l'effacement — Suppression et anonymisation du compte
Conformément aux exigences légales, l'effacement doit concilier la protection de la vie privée et la préservation de l'intégrité historique des délibérations de jurys, attributions de financements et projets d'incubation :
- **Endpoint :** `DELETE /api/auth/me/`
- **Condition stricte :** Confirmation obligatoire par le mot de passe actuel (`{"password": "..."}` dans le corps de la requête). En cas d'omission ou d'erreur, une réponse HTTP `400 Bad Request` est retournée et aucune modification n'est apportée.
- **Actions réelles exécutées en base :**
  1. **Suppression définitive des conversations de l'assistant IA :** Toutes les sessions de dialogue de l'utilisateur (`Conversation.objects.filter(utilisateur=user).delete()`) et leurs messages sont immédiatement supprimés sans conservation d'archive.
  2. **Anonymisation irréversible du compte utilisateur :**
     - Prénom et nom remplacés par `Utilisateur` et `Anonymisé` ;
     - Adresse email anonymisée sous la forme technique `anonymise_{id}@ciat.sn` ;
     - Numéro de téléphone, genre et organisation purgés ;
     - Compte désactivé (`is_active = False`) ;
     - Mot de passe invalidé de façon irréversible (`set_unusable_password()`).
  3. **Préservation de l'intégrité des projets et décisions :** Les projets incubés, décisions de sélection et grilles d'évaluation restent cohérents sur le plan de la base de données, sans rupture de clés étrangères (évitement du `CASCADE` destructeur).
- **Code retour :** `204 No Content`.

### C. Suppression unitaire d'une conversation avec l'assistant
L'utilisateur peut à tout moment supprimer de manière granulaire une conversation spécifique sans supprimer son compte :
- **Endpoint :** `DELETE /api/assistant/conversations/{id}/`
- **Droits :** Réservé exclusivement à l'auteur de la conversation (`conversation.utilisateur == request.user`). Toute tentative d'un tiers se solde par un code HTTP `403 Forbidden`.
- **Code retour :** `204 No Content` (ou `404 Not Found` si identifiant inexistant).

---

## 4. Usage de l'Intelligence Artificielle et transmission aux prestataires

La plateforme CIAT utilise des modèles de langage avancés (IA générative) pour deux fonctionnalités spécifiques :
1. **L'assistant conversationnel (`apps.assistant`) :** Répond aux questions des porteurs en s'appuyant sur les documents publics du CIAT (RAG - *Retrieval-Augmented Generation*).
2. **L'assistance à la rédaction de documents (`apps.documents`) :** Propose des structures types et des canevas de documents officiels (appels, conventions, fiches projets).

### Règles de confidentialité appliquées à l'IA :
- **Aucune donnée sensible transmise :** Les mots de passe, clés secrètes, hashs, coordonnées bancaires ou données personnelles sensibles ne sont jamais inclus dans les contextes envoyés aux modèles de langage.
- **Cloisonnement des contextes :** Seuls les extraits de documents publics nécessaires à la question posée sont transmis dans le prompt.
- **Politique de non-apprentissage :** Les requêtes API adressées aux fournisseurs de modèles (Google Gemini, OpenAI ou modèles locaux) s'exécutent sous licence API entreprise interdisant l'utilisation des données pour l'entraînement public des modèles tiers.
- **Avertissement explicite :** Chaque réponse générée par l'IA comporte une mention informative rappelant que le contenu doit être relu et validé par un humain avant publication officielle.
