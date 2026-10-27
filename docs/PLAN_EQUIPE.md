> **Document historique (version du début du projet).** Les priorités, les rôles et les tâches à jour sont dans [../taches/00_PRIORITES.md](../taches/00_PRIORITES.md) et dans les fiches par phase du dossier `taches/`. Les consignes Git sont dans [GUIDE_GIT.md](GUIDE_GIT.md).

# Plateforme CIAT — Plan d'équipe

> Écrit pour toute l'équipe du projet.
> Délai : 2 jours. Une seule plateforme, six modules interconnectés.

## 1. L'équipe

| Personne | Domaine |
|---|---|
| Lansana Coly | Lead technique, intervient partout |
| Ibrahima Khalilou Diallo | Back-end |
| Pathé Fall | Back-end |
| El Hadji Massogui Diop | Front-end (site web) |
| Pape Alioune Sène | Front-end |
| Maimouna Sall | Back-end et front-end |

**Fonctionnement :** chacun reçoit une tâche à la fois. Quand elle est terminée, Lansana la vérifie. Si elle est validée, la tâche suivante de la file (section 5) est assignée immédiatement. On continue jusqu'à ce que la plateforme soit en place.

## 2. Principe

Il n'y a pas six projets séparés. Il y a **une seule plateforme** :

- un monorepo ;
- une API Django REST Framework avec une app par module ;
- une base PostgreSQL commune ;
- une application Next.js (React, TypeScript) avec un module par projet ;
- un design system commun ;
- un service IA partagé, utilisé par le générateur de documents et l'assistant.

Les modules partagent les mêmes données : projets, cohortes, domaines, porteurs, utilisateurs et rôles.

## 3. Priorités

| Rang | Module | Pourquoi |
|---|---|---|
| 0 | **Socle** (authentification, rôles, modèles communs, service IA) | Tout le reste en dépend |
| 1 | **P5 Générateur de documents** | Projet prioritaire, point fort pour le jury |
| 2 | **P2 Plateforme incubateur** | Source des données des autres modules |
| 3 | **P1 Portail institutionnel** | Vitrine publique et candidatures |
| 4 | **P3 Tableau de bord décisionnel** | Consomme les données de P2 |
| 5 | **P4 Assistant IA** | Réutilise le service IA de P5 |
| 6 | **P6 Galerie des innovations** | Réutilise les projets déjà publiés |

## 4. Comment implémenter chaque module

### Socle (rang 0)
- Authentification (JWT) et gestion des utilisateurs.
- Rôles : administrateur, coordonnateur, mentor, membre du comité, porteur de projet, visiteur.
- Modèles communs : Projet, Cohorte, Domaine, Porteur, Document.
- Permissions par rôle, conventions d'API, gestion des erreurs.
- Service IA : un seul point d'appel au modèle, utilisé par tous les modules.
- Design system : couleurs et charte ISEP, polices, composants de base.

### P5 — Générateur de documents (rang 1)
Principe : l'incubateur choisit un modèle, donne le sujet, et l'IA rédige le document.

1. **Types de documents** : appel à candidatures, fiche de projet, convention, procès-verbal, rapport de suivi, compte rendu, attestation, fiche partenaire, rapport annuel.
2. **Modèles** : 3 à 4 modèles par type. Un modèle contient la structure en sections, la charte ISEP (logo, couleurs, polices, en-tête, pied de page) et un exemple de rédaction. Tout est enregistré en base.
3. **Génération** : l'IA reçoit le modèle choisi, les règles de la charte, le sujet et les données de la plateforme (projet, cohorte, mentor). Elle rédige chaque section.
4. **Correction** : le texte généré est modifiable avant validation.
5. **Workflow** : création, validation, publication, avec droits par rôle.
6. **Export** : Word et PDF, historique des versions, archivage.

### P2 — Plateforme de gestion de l'incubateur (rang 2)
1. Compte et profil du porteur de projet.
2. Dépôt du dossier, contrôle de complétude, ajout de documents.
3. Grille d'évaluation, comité de sélection, décision motivée.
4. Affectation d'un mentor et objectifs.
5. Calendrier, jalons, preuves, commentaires, alertes de retard.
6. Tableau de bord du coordonnateur, suivi à 3 et 6 mois.
7. Comptes rendus, export PDF et Excel.

### P1 — Portail institutionnel (rang 3)
1. Présentation du CIAT, de l'incubateur et des domaines d'intervention.
2. Actualités, événements, appels à projets, calendrier.
3. Annuaire des projets incubés avec recherche et filtres.
4. Formulaire de candidature avec pièces jointes et accusé de réception.
5. Espace documentaire, espace partenaires, formulaire de contact.
6. Interface d'administration des contenus et des candidatures.
7. Intégration de l'assistant (P4).

### P3 — Tableau de bord décisionnel (rang 4)
1. Filtres : période, cohorte, domaine, statut, porteur.
2. Indicateurs : idées reçues, projets sélectionnés, prototypes, retards, partenariats, financements.
3. Comparaison entre cohortes, répartition par domaine et par genre.
4. Graphiques interactifs et fiches de synthèse.
5. Interrogation des données en langage naturel.
6. Export PDF, Excel et image.

### P4 — Assistant IA (rang 5)
1. Recherche dans les documents autorisés du CIAT (RAG), avec indication des sources.
2. Refus explicite d'inventer une information absente des documents.
3. Présentation des services, du parcours d'incubation et des pièces demandées.
4. Aide à la rédaction : fiche de projet, pitch, analyse SWOT, modèle économique, plan d'action.
5. Historique des échanges, protection des données, information sur l'usage de l'IA.

### P6 — Galerie numérique des innovations (rang 6)
1. Fiches de projets : problème, solution, équipe, niveau d'avancement.
2. Photos, vidéos et démonstrations.
3. Recherche par domaine, cohorte, statut ou besoin.
4. Espace de présentation pour partenaires et investisseurs.
5. Fiche promotionnelle et QR code par projet.
6. Statistiques de consultation.
7. Workflow de validation avant publication.

## 5. File des tâches suivantes

Quand une tâche est validée, la personne prend la première tâche disponible de la file de son domaine.

### Back-end
1. Modèles de documents et types de documents (P5)
2. Génération par l'IA à partir d'un modèle (P5)
3. Versions, droits et validation des documents (P5)
4. Export Word et PDF (P5)
5. Dossiers, évaluation, comité, mentors (P2)
6. Jalons et alertes de retard (P2)
7. Candidatures, actualités et événements (P1)
8. Endpoints d'indicateurs (P3)
9. RAG et sources pour l'assistant (P4)
10. Galerie, workflow de validation et QR code (P6)

### Front-end
1. Interface du générateur : choix du modèle, sujet, aperçu (P5)
2. Éditeur et aperçu des documents, validation, export (P5)
3. Design system et pages du site public (P1)
4. Interfaces de P2 : dépôt de dossier, suivi, tableau de bord du coordonnateur
5. Dashboard avec filtres et graphiques (P3)
6. Interface de chat (P4)
7. Galerie et espace partenaires (P6)

### Transverse
- Déploiement et CI/CD
- Sécurité
- Jeu de données de départ et dictionnaire des données
- Tests des fonctions essentielles
- Documentation : cahier des charges, guide utilisateur, rapport, journal des prompts
- Vidéo de démonstration
- Maquettes tirées des écrans du code

## 6. Calendrier

| Moment | Objectif |
|---|---|
| Jour 1, matin | Socle, design system, première tâche de chacun |
| Jour 1, après-midi | P5 utilisable de bout en bout, premières versions de P2 et du site public |
| Jour 2, matin | P3, P4, P6 et finitions de P5 |
| Jour 2, après-midi | Tests, déploiement, documentation, vidéo, maquettes |
