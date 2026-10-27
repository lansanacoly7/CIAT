# Contrats d'API (Phase 1)

> Écrit pour toute l'équipe. Ces formats sont la référence commune : le back les fournit, le front les consomme.
> Toutes les routes commencent par `/api/`. Les listes sont paginées : `{ count, next, previous, results: [...] }`, sauf mention contraire.
> Les dates sont au format ISO 8601. Les erreurs de validation renvoient `400` avec `{ "champ": ["message"] }`.

## Déjà disponible (socle)

| Route | Description |
|---|---|
| `GET /health/` | `{ status: "ok", database: "connected" }` (public, supervision, HTTP 503 si base indisponible) |
| `POST /auth/token/` | `{ email, password }` → `{ access, refresh }` |
| `POST /auth/token/refresh/` | `{ refresh }` → `{ access }` |
| `POST /auth/register/` | Crée un porteur de projet |
| `GET/PATCH /auth/me/` | `{ id, email, first_name, last_name, role, telephone, genre, organisation }` |
| `GET /domaines/`, `GET /cohortes/` | Listes sans pagination |
| `GET/POST /projets/` | `{ id, titre, resume, probleme, solution, domaine, domaine_nom, cohorte, cohorte_nom, porteur, porteur_nom, statut, cree_le, modifie_le }` |
| `GET /audit/` | Journal d'audit des actions sensibles (admin et coordonnateur, filtrable par acteur, action, date) |
| `GET /notifications/` | Notifications internes de l'utilisateur connecté (filtre `?non_lues=1`) |
| `POST /notifications/{id}/lue/` | Marquer une notification comme lue |
| `POST /notifications/tout-lire/` | Marquer toutes les notifications comme lues |
| `PATCH /users/{id}/role/` | Modification du rôle d'un utilisateur (administrateur) |


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
| `GET /indicateurs/definitions/` | Définitions méthodologiques des indicateurs décisionnels |
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
| `GET /calendrier/?mois=AAAA-MM` | Renvoie les jalons et objectifs du mois : `[{ date, type, titre, projet, statut, en_retard }]`, triés par date. Droits : porteur (ses projets), mentor (projets affectés), coordonnateur/admin (tout). |
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
| `GET /fiches/{slug}/fiche/` | Public : fiche promotionnelle officielle en PDF (1 page A4, charte CIAT, problème, solution, équipe, QR code). `404` si non publiée (sauf porteur / équipe). |
| `POST /fiches/` | Porteur : crée une fiche pour son projet |
| `POST /fiches/{id}/valider/` | Coordonnateur ou administrateur : validation d'une fiche |
| `POST /fiches/{id}/refuser/` | Coordonnateur ou administrateur : refus d'une fiche |
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
| `GET /partenariats-financements/stats/` | Indicateurs agrégés (consolide le résumé financements et partenariats) : `{ total_finance, financements_decaisses, nombre_financements, nombre_partenariats_actifs, total_partenariats, par_source: [{ source, total, count }], par_type_partenariat: [{ type, type_key, count }], par_domaine: [{ domaine, total, count }] }`. Mêmes filtres et droits d'analyse. |

### P6 — Filtres réservés de la liste des fiches (ajout de la Phase 2)

| Requête | Effet |
|---|---|
| `GET /api/gallery/fiches/?mes_fiches=1` | Connecté : toutes les fiches de **ses** projets, quel que soit leur statut. Anonyme : ignoré (fiches publiées seulement). |
| `GET /api/gallery/fiches/?en_validation=1` | Équipe CIAT (administrateur, coordonnateur) : les fiches « en validation ». Pour les autres : ignoré (fiches publiées seulement). |

## P2 / P1 — Ajouts des Phases 4 et 5 (Pathé)

### Accusé de réception et export compte-rendu (`/api/incubator/`)

| Route | Méthode | Paramètres | Description & Droits | Codes d'erreur |
|---|---|---|---|---|
| `/dossiers/{id}/accuse/` | `GET` | Aucun | Télécharge l'accusé de réception officiel en PDF (`application/pdf`) reprenant les métadonnées officielles du dossier (référence `CIAT-AR-XXXXX`), l'équipe, la complétude, la liste des pièces justificatives et les mentions obligatoires du comité. **Droits :** porteur du projet, équipe CIAT ou membre du comité. | `400` : dossier encore en brouillon ; `403` : utilisateur non autorisé ; `404` : dossier inexistant. |
| `/projets/{id}/compte-rendu/` | `GET` | `?format=xlsx` (défaut) ou `?format=pdf` | Génère et télécharge le compte rendu complet d'un projet incubé sous forme de document structuré en 4 blocs (Projet & Identité, Objectifs, Jalons clés, Bilans de suivi). **Droits :** porteur du projet, mentor affecté ou équipe CIAT. | `400` : format non supporté (seuls `xlsx` et `pdf` sont valides) ; `403` : utilisateur non autorisé ; `404` : projet inexistant. |

### Calendrier des événements (`/api/portal/`)

| Route | Méthode | Paramètres | Description & Droits | Codes de retour |
|---|---|---|---|---|
| `/evenements/calendrier.ics` | `GET` | `?a_venir=1` (optionnel) | Flux iCalendar conforme RFC 5545 (`text/calendar; charset=utf-8`) exportable dans Google Agenda, Outlook ou Apple Calendar. Si `?a_venir=1`, seuls les événements futurs sont renvoyés. **Droits :** Public (aucun token requis). | `200` : fichier `.ics` téléchargeable. |

### Notifications et emails transactionnels (`Phase 5`)

- **Soumission de dossier :** Lors de l'appel à `POST /api/incubator/dossiers/{id}/soumettre/`, un email de confirmation contenant la référence officielle et le lien direct vers l'accusé de réception (`/api/incubator/dossiers/{id}/accuse/`) est automatiquement transmis au porteur de projet.
- **Décision du comité :** Lors de l'appel à `POST /api/incubator/dossiers/{id}/decision/`, un email notifiant l'acceptation ou le refus du dossier ainsi que le motif officiel saisi est envoyé au porteur de projet.
- **Alertes de retard jalons :** La commande `python manage.py envoyer_alertes_retard` avertit quotidiennement les porteurs et mentors des échéances dépassées non validées (idempotence journalière garantie en base via le modèle `AlerteJalonEnvoyee`).

### Fiche promotionnelle PDF (`Phase 6 — Galerie`)

| Route | Méthode | Paramètres | Description & Droits | Codes de retour |
|---|---|---|---|---|
| `/api/gallery/fiches/{slug}/fiche/` | `GET` | Aucun | Génère un document PDF d'une page A4 aux couleurs officielles du CIAT / ISEP Amadou Trawaré de Diamniadio. Contient le titre, badges (domaine, cohorte, avancement), problème, solution innovante, équipe et le QR code officiel menant à la vitrine en ligne. **Droits :** Public pour une fiche au statut `publie`. Pour une fiche non publiée, seul le porteur propriétaire ou un membre de l'équipe CIAT peut y accéder. | `200` : fichier `.pdf` (`application/pdf`) ; `404` : fiche non publiée ou slug inexistant. |

---

## Vérification de Conformité OpenAPI (Phase 7 — T3)

- **Date de vérification :** 27 octobre 2026  
- **Responsable :** Pathé (Back-end)  
- **Fichier de schéma exporté :** [`docs/openapi.yaml`](../docs/openapi.yaml) (généré via `python manage.py spectacular --file docs/openapi.yaml`)  
- **Suite de test automatisée :** `backend/apps/core/tests/test_contrat_api.py` (`ApiContractConformanceTests`)  
- **Résultat du test :** `Ran 2 tests in 3.508s — OK` (100 % de conformité, 0 écart résiduel).

### Écarts constatés et mesures appliquées

Conformément à la règle de la tâche T3 (*« corrige le document, pas le code, sauf bug évident »*) :

1. **Route obsolète `/api/analytics/financements/resume/` :**
   - *Constat :* Documentée en Phase 2 mais non présente dans l'implémentation effective ni dans le schéma OpenAPI.
   - *Explication :* Cette route initiale a été consolidée et intégrée directement dans `GET /api/analytics/partenariats-financements/stats/` qui agrège déjà l'ensemble des indicateurs de financements et partenariats actifs.
   - *Correction :* Mise à jour de la documentation `taches/CONTRATS_API.md` en retirant la route obsolète et en précisant la consolidation.
2. **Scission des routes de validation/refus de fiches galerie :**
   - *Constat :* Notées sur une seule ligne combinée `POST /fiches/{id}/valider/, POST /fiches/{id}/refuser/`.
   - *Correction :* Scission en deux lignes distinctes pour une lecture univoque et un parsing automatisé exact.
3. **Route méthodologique ajoutée `/api/analytics/indicateurs/definitions/` :**
   - *Constat :* Présente dans le code et le schéma OpenAPI mais absente du tableau récapitulatif.
   - *Correction :* Ajout de la route dans la section P3 Analyse de `taches/CONTRATS_API.md`.
4. **Route publique de santé `/api/health/` :**
   - *Constat :* Ajoutée en Phase 7 T2.
   - *Correction :* Intégrée dans le tableau socle de `taches/CONTRATS_API.md` et documentée dans `docs/API.md`.

