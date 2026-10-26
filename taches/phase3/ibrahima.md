# Ibrahima — Phase 3

> Domaine : back-end. Axes : **fiabilité de la plateforme avant livraison** : PostgreSQL, sécurité et droits, performance. Tu touches ici à tous les modules : c'est voulu, mais toute modification d'un module qui n'est pas le tien est **signalée à Lansana avant** ou limitée à des tests et des index.
> Ta Phase 2 est validée et fusionnée dans `test` (tests rapides, export Excel testé), bravo. Fais d'abord `git pull origin test` sur ta branche `Kalz`.
> Lis [../00_PRIORITES.md](../00_PRIORITES.md), [../CONTRATS_API.md](../CONTRATS_API.md) et `README.md`. Back-end uniquement. Tes tests restent rapides (hasheur rapide).

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Compatibilité PostgreSQL
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 à 4 h
- **À faire :** jusqu'ici tout tourne sur SQLite. La production et le lien du jury utiliseront PostgreSQL (`docker-compose.yml` fournit la base). Lance PostgreSQL avec `docker compose up -d`, mets `DATABASE_URL=postgres://ciat:ciat@localhost:5432/ciat` dans ton `backend/.env`, puis passe : `migrate` depuis une base vide, `seed_demo` (et les autres commandes de remplissage), et **toute la suite de tests** (`python manage.py test`). Corrige ce qui diffère entre les deux bases (champs JSON, recherche insensible à la casse, tris, contraintes, agrégations de dates). Pour les modules des autres, corrige seulement si c'est évident et signale chaque changement à Lansana. Documente la procédure dans `docs/POSTGRESQL.md`.
- **Tu attends :** rien (tous les modules sont dans `test`). Branche : ta branche personnelle.
- **Attendu par :** le déploiement (lien du jury), tous les développeurs back.
- **Terminé quand :** `migrate`, le remplissage de démonstration et la suite de tests passent entièrement sur PostgreSQL, et les différences trouvées sont listées dans `docs/POSTGRESQL.md`.

## T2 — Audit des droits et de la sécurité
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 4 à 5 h
- **À faire :** un test automatisé **matrice rôles × routes** (`apps/core/tests/test_droits.py`) qui parcourt toutes les routes de `/api/` et vérifie, pour un anonyme et pour chacun des six rôles, que l'accès accordé ou refusé correspond au contrat (200, 401 ou 403, jamais 500). Vérifie aussi qu'aucune route publique n'expose de donnée privée (email, téléphone, notes d'évaluation, montants). Contrôles complémentaires : limitation de débit sur la connexion et l'inscription (anti force brute), mots de passe (validateurs actifs), téléversements (taille, extensions, noms de fichiers), liste de contrôle de production (`DEBUG=0`, clé secrète, hôtes autorisés, cookies sécurisés). Écris les résultats dans `docs/SECURITE.md` : ce qui est vérifié, les anomalies trouvées, leur état (corrigée, ou signalée à son responsable avec la route concernée).
- **Tu attends :** T1 (non bloquant). Branche : ta branche personnelle.
- **Attendu par :** le rapport final (protection des données, limites), la sécurité de la démonstration.
- **Terminé quand :** le test matrice passe, chaque anomalie est corrigée ou attribuée à quelqu'un, et `docs/SECURITE.md` est complet.

## T3 — Performance des listes
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 3 h
- **À faire :** repère les requêtes inutiles (le problème « N+1 ») sur les listes principales : projets, dossiers, actualités, annuaire public, fiches de galerie, documents, alertes, endpoints d'analyse. Utilise `assertNumQueries` ou `CaptureQueriesContext` pour fixer un plafond de requêtes par liste avec le jeu de démonstration, corrige avec `select_related` ou `prefetch_related`, et ajoute des index (`db_index` ou `Meta.indexes`) sur les champs filtrés et triés (statut, cohorte, domaine, dates). Mesure avant et après et note les gains dans `docs/PERFORMANCE.md`. Les migrations d'index sont acceptables dans les modules des autres : préviens Lansana.
- **Tu attends :** T1 pour mesurer sur PostgreSQL. Branche : ta branche personnelle.
- **Attendu par :** la démonstration (listes rapides avec les 62 projets) et le rapport.
- **Terminé quand :** aucune liste principale ne dépasse son plafond de requêtes, les index sont migrés, et le gain est chiffré dans `docs/PERFORMANCE.md`.

## Quand tu as fini
Vérifie `check`, `makemigrations --check` et `test` (sur SQLite et sur PostgreSQL). Pousse ta branche `Kalz` et préviens Lansana avec la liste des modules touchés hors du tien.
