# Pathé — Phase 9

> Ta Phase 8 (intérêts de la galerie, administration, données personnelles) est validée et fusionnée dans `test`. Fais `git pull origin test` sur ta branche `pathe`. Back-end uniquement. Ces tâches donnent de vraies routes à des éléments du site public qui aujourd'hui sont décoratifs.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Abonnement à la lettre d'information
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **Constat :** le pied de page du site (carte « Restez informé » avec le bouton « Rejoindre ») affiche un message de succès **sans rien envoyer** : aucune route n'existe. C'est un faux succès, ce qu'on s'interdit.
- **À faire :** un modèle `AbonnementLettre` (email unique, statut en attente / confirmé / désabonné, dates, jeton). Routes publiques :
  - `POST /api/portal/lettre/abonner/` `{ email }` : crée l'abonnement en attente et envoie un email de confirmation (double opt-in, lien à jeton signé et à usage unique) ; réponse identique que l'email existe déjà ou non ; limitation de débit stricte ; validation de l'email.
  - `POST /api/portal/lettre/confirmer/` `{ jeton }` : passe l'abonnement à confirmé ; `400` clair si le jeton est expiré, rejoué ou invalide.
  - `POST /api/portal/lettre/desabonner/` `{ jeton }` : désabonnement à usage unique, présent dans chaque email.
  - Côté administration : liste des abonnés filtrable avec export CSV (email et statut seulement) ; l'action est enregistrée dans le journal d'audit d'Ibrahima.
  Aucune donnée sensible dans les journaux. Tests : abonnement, confirmation, rejeu, désabonnement, doublon, spam. Documente dans `taches/CONTRATS_API.md` et `/api/docs/`.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Massogui (branche le formulaire du pied de page).
- **Terminé quand :** le flux complet est testé de bout en bout et la suite complète reste verte.

## T2 — Recherche globale du site
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** `GET /api/portal/recherche/?q=` qui cherche dans les contenus **publics** : actualités publiées, événements, appels, projets incubés, fiches de galerie publiées, documents publics, partenaires. Résultats groupés par type : `{ type, titre, extrait, url_interne, score }`, tri par pertinence, limités (par exemple 5 par type et un total), `q` d'au moins 2 caractères sinon `400`. Insensible à la casse et aux accents (SQLite et PostgreSQL). Jamais de contenu non publié, de brouillon, de fiche refusée ni de donnée personnelle. Limitation de débit.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Massogui (la recherche de l'en-tête), Lansana (démonstration).
- **Terminé quand :** les tests prouvent qu'un contenu non publié n'apparaît jamais, que la recherche « eau » trouve « Eau » et « éau », et que la suite reste verte.

## T3 — Chiffres clés publics réels
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 1 h 30
- **À faire :** pour l'accueil et les pages de domaines, une route publique `GET /api/portal/chiffres-cles/` qui renvoie uniquement des comptages réels : projets incubés, prototypes, porteurs accompagnés, partenaires, domaines avec leur nombre de projets, cohortes. Pas de donnée personnelle, mise en cache courte, tests de cohérence avec la base. Documente la route.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Massogui (afficher de vrais chiffres au lieu de valeurs écrites dans le code).
- **Terminé quand :** chaque chiffre est recoupé avec la base dans un test, et la suite reste verte.

## Avant de pousser
`check`, `makemigrations --check` et la suite complète verts (isole le cache et les limites de débit dans tes tests). Pousse sur `pathe` et préviens Lansana.
