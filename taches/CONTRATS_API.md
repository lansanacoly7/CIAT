# Contrats d'API (Phase 1)

> Écrit pour toute l'équipe. Ces formats sont la référence commune : le back les fournit, le front les consomme.
> Toutes les routes commencent par `/api/`. Les listes sont paginées : `{ count, next, previous, results: [...] }`, sauf mention contraire.
> Les dates sont au format ISO 8601. Les erreurs de validation renvoient `400` avec `{ "champ": ["message"] }`.

## Déjà disponible (socle)

| Route | Description |
|---|---|
| `POST /auth/token/` | `{ email, password }` → `{ access, refresh }` |
| `POST /auth/token/refresh/` | `{ refresh }` → `{ access }` |
| `POST /auth/register/` | Crée un porteur de projet |
| `GET/PATCH /auth/me/` | `{ id, email, first_name, last_name, role, telephone, genre, organisation }` |
| `GET /domaines/`, `GET /cohortes/` | Listes sans pagination |
| `GET/POST /projets/` | `{ id, titre, resume, probleme, solution, domaine, domaine_nom, cohorte, cohorte_nom, porteur, porteur_nom, statut, cree_le, modifie_le }` |

Rôles : `administrateur`, `coordonnateur`, `mentor`, `membre_comite`, `porteur`, `visiteur`.
Statuts d'un projet : `idee`, `depose`, `selectionne`, `incube`, `prototype`, `termine`, `rejete`.

## P2 — Incubateur (`/api/incubator/`)

**Dossier**
```json
{
  "id": 1,
  "projet": { "id": 4, "titre": "AgriSol" },
  "statut": "brouillon",
  "completude": 66,
  "pieces": [{ "id": 9, "type": "fiche_projet", "nom": "fiche.pdf", "fichier": "/media/...", "depose_le": "2026-10-27T10:00:00Z" }],
  "pieces_manquantes": ["budget_previsionnel"],
  "soumis_le": null
}
```
Statuts du dossier : `brouillon`, `soumis`, `complet`, `en_evaluation`, `accepte`, `refuse`.
Types de pièces obligatoires : `fiche_projet`, `presentation_equipe`, `budget_previsionnel`. Type facultatif : `autre`.

| Route | Description |
|---|---|
| `GET/POST /dossiers/` | Un porteur voit ses dossiers ; l'équipe, le comité et les mentors les voient tous. `POST` : `{ projet }` |
| `GET/PATCH /dossiers/{id}/` | Détail |
| `POST /dossiers/{id}/pieces/` | Dépôt d'une pièce, `multipart/form-data` : `type`, `fichier` (10 Mo max) |
| `DELETE /dossiers/{id}/pieces/{piece_id}/` | Supprime une pièce (dossier non soumis) |
| `POST /dossiers/{id}/soumettre/` | Refuse (`400`) si une pièce obligatoire manque |
| `GET /grilles/actuelle/` | `{ id, criteres: [{ id, libelle, poids, note_max }] }` |
| `POST /dossiers/{id}/evaluations/` | `{ notes: [{ critere, note }], avis }` (membre du comité, mentor, coordonnateur ou administrateur ; une seule évaluation par personne et par dossier) |
| `GET /dossiers/{id}/evaluations/` | Liste des évaluations et `score_moyen` |
| `POST /dossiers/{id}/decision/` | `{ decision: "accepte"\|"refuse", motif }` (coordonnateur). Met à jour le statut du dossier et du projet. |

## P1 — Portail (`/api/portal/`)

Lecture publique pour tous. Écriture réservée à l'administrateur et au coordonnateur (sauf `contact/`).

| Route | Forme d'un élément |
|---|---|
| `GET /actualites/` | `{ id, titre, slug, resume, contenu, image, publie_le }` |
| `GET /evenements/` | `{ id, titre, description, lieu, debut, fin, lien_inscription }` (filtre `?a_venir=1`) |
| `GET /appels/` | `{ id, titre, description, date_limite, statut: "ouvert"\|"clos", pieces_demandees }` |
| `GET /partenaires/` | `{ id, nom, logo, site_web, description }`, sans pagination |
| `GET /documents/` | `{ id, titre, categorie, fichier }` |
| `POST /contact/` | `{ nom, email, sujet, message }` → `201`. Public. |
| `GET /projets-incubes/` | Public. `{ id, titre, resume, domaine_nom, cohorte_nom, statut }`. Seulement les projets au statut `incube`, `prototype` ou `termine`. Filtres : `?domaine=&cohorte=&statut=&search=` |

## P3 — Analyse (`/api/analytics/`)

Accès : coordonnateur, administrateur, membre du comité. Tous les endpoints acceptent les filtres `?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ&cohorte=&domaine=&statut=`.

| Route | Réponse |
|---|---|
| `GET /indicateurs/` | `{ idees_recues, dossiers_deposes, projets_selectionnes, projets_incubes, prototypes, taux_selection }` |
| `GET /par-domaine/` | `[{ domaine, total }]` |
| `GET /par-cohorte/` | `[{ cohorte, total, selectionnes, prototypes }]` |
| `GET /par-genre/` | `[{ genre, total }]` |
| `GET /evolution/` | `[{ mois: "2026-09", total }]` |

## P5 — Documents (`/api/documents/`)

| Route | Description |
|---|---|
| `GET /types/` | `[{ id, code, nom }]` (appel à candidatures, fiche de projet, convention, procès-verbal, ...) |
| `GET /modeles/?type=` | `[{ id, type, nom, apercu, sections: [{ code, titre, consigne }] }]` |
| `POST /generer/` | `{ modele, sujet, infos: {}, projet? }` → `{ id, titre, sections: [{ code, titre, contenu }], statut: "brouillon", version: 1 }` |

### P5 — Ajouts de la Phase 2 (versions, workflow, export)

Un document : `{ id, titre, modele, projet, auteur, statut, version_courante, cree_le, modifie_le }`. Statuts : `brouillon`, `valide`, `publie`. Une version : `{ numero, sections: [{ code, titre, contenu }], auteur, cree_le }`.

| Route | Description |
|---|---|
| `GET /` | Mes documents (l'équipe CIAT voit tous les documents) |
| `GET /{id}/` | Détail avec les sections de la version courante |
| `PATCH /{id}/` | `{ sections: [{ code, contenu }] }` → crée une nouvelle version. Refusé (`409`) si le statut n'est pas `brouillon`. |
| `GET /{id}/versions/` | Liste des versions |
| `GET /{id}/versions/{numero}/` | Une version |
| `POST /{id}/valider/` | Coordonnateur ou administrateur : `brouillon` donne `valide` |
| `POST /{id}/publier/` | Administrateur : `valide` donne `publie` |
| `POST /{id}/brouillon/` | Coordonnateur ou administrateur : repasse en `brouillon` |
| `GET /{id}/export/?format=docx` ou `pdf` | Fichier à télécharger, mis en forme avec la charte |


### P2 — Ajouts de la Phase 2 (`/api/incubator/`)

Objectif : `{ id, projet, libelle, echeance, statut }` (statuts `a_faire`, `en_cours`, `atteint`).
Jalon : `{ id, projet, titre, echeance, statut, en_retard, preuves: [...], commentaires: [...] }` (statuts saisis `a_faire`, `en_cours`, `fait` ; `en_retard` est calculé).

| Route | Description |
|---|---|
| `GET /mentors/` | Utilisateurs de rôle mentor (coordonnateur, administrateur) |
| `POST /projets/{id}/mentor/` | `{ mentor }` : affecte un mentor (coordonnateur, administrateur) |
| `GET/POST /projets/{id}/objectifs/` | Liste et création |
| `PATCH /objectifs/{id}/` | Modification |
| `GET/POST /projets/{id}/jalons/` | Liste et création |
| `PATCH /jalons/{id}/` | Modification |
| `POST /jalons/{id}/preuves/` | `multipart/form-data` : `fichier` |
| `POST /jalons/{id}/commentaires/` | `{ texte }` |
| `GET /alertes/` | Jalons en retard visibles pour l'utilisateur connecté |
| `GET/POST /projets/{id}/suivis/` | `{ echeance: "3_mois"\|"6_mois", bilan, indicateurs }` |
| `GET /projets/{id}/compte-rendu/?format=xlsx` | Fichier Excel à télécharger |

## P4 — Assistant (`/api/assistant/`)

Authentification obligatoire.

| Route | Description |
|---|---|
| `GET /conversations/` | Mes conversations : `[{ id, titre, cree_le }]` |
| `POST /conversations/` | Crée une conversation |
| `GET /conversations/{id}/messages/` | `[{ id, role: "user"\|"assistant", contenu, sources, cree_le }]` |
| `POST /conversations/{id}/messages/` | `{ contenu, mode: "documents"\|"atelier" }` → message de l'assistant : `{ contenu, sources: [{ document_id, titre, extrait }], avertissement_ia }`. `sources` vide et refus explicite si rien de pertinent (mode `documents`). `503` sans clé IA. |
| `POST /indexation/` | Administrateur : réindexe les documents publics |

## P6 — Galerie (`/api/gallery/`)

Fiche : `{ id, slug, projet, titre, probleme, solution, equipe, avancement, medias: [{ type: "photo"\|"video"\|"demo", url }], statut, vues }`. Statuts : `brouillon`, `en_validation`, `publie`, `refuse`.

| Route | Description |
|---|---|
| `GET /fiches/` | Public : fiches publiées. Filtres `?domaine=&cohorte=&avancement=&search=` |
| `GET /fiches/{slug}/` | Public : détail d'une fiche publiée (incrémente `vues`) |
| `GET /fiches/{slug}/qr/` | Public : image PNG du QR code vers la fiche |
| `POST /fiches/` | Porteur : crée une fiche pour son projet |
| `POST /fiches/{id}/soumettre/` | Porteur : brouillon vers en validation |
| `POST /fiches/{id}/valider/`, `POST /fiches/{id}/refuser/` | Coordonnateur ou administrateur |
| `GET /statistiques/` | Équipe CIAT : `{ total_vues, par_fiche: [{ slug, titre, vues }] }` |


## P1 — Compléments de la Phase 3 (`/api/portal/`)

| Route | Description |
|---|---|
| `GET /statistiques/` | Équipe CIAT : `{ total_vues, actualites: [{ slug, titre, vues }], projets: [{ id, titre, vues }] }` |
| Actualités | Nouveau champ `publie` (booléen). Le public ne voit que les actualités publiées ; l'équipe voit tout et peut modifier `publie`. |

## P3 — Export (`/api/analytics/`)

| Route | Description |
|---|---|
| `GET /export/?format=xlsx` ou `pdf` | Mêmes filtres et mêmes droits que les autres endpoints d'analyse. Fichier à télécharger. |

## P3 — Compléments de la Phase 2 (`/api/analytics/`)

| Route | Description |
|---|---|
| `POST /question/` | `{ question }` → `{ reponse, donnees, filtres_utilises }`. Le modèle choisit un endpoint et des filtres dans une liste fermée, jamais de SQL. Mêmes droits que les autres endpoints d'analyse ; `503` sans clé IA. |
| `GET /partenariats/` | Liste filtrable : `{ id, projet, partenaire, type, date_debut, statut }` |
| `GET /financements/` | Liste filtrable : `{ id, projet, source, montant, date, statut }` |
| `GET /financements/resume/` | `{ total_finance, partenariats_actifs }` |
