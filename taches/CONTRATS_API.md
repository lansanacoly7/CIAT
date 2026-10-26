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
| `POST /dossiers/{id}/evaluations/` | `{ notes: [{ critere, note }], avis }` (membre du comité) |
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
