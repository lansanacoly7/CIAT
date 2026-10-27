# Ibrahima — Phase 5

> Domaine : back-end, base de données, sécurité. Ta Phase 4 est validée et fusionnée dans `test` (276 tests) : preuve PostgreSQL honnête, droits, sauvegarde, 5 nouveaux types de documents. Fais `git pull origin test` sur ta branche `Kalz`.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Vraie preuve PostgreSQL, sans Docker
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 2 h
- **À faire :** Docker n'a pas pu démarrer (WSL2 absent). Contourne : installe PostgreSQL 16 directement (installateur Windows officiel) ou utilise la machine d'un autre membre qui a Docker. Crée la base, lance `migrate`, `seed_all` et `python manage.py test` avec `DATABASE_URL`, puis remplace dans `docs/POSTGRESQL.md` la ligne « Non exécuté » par la **sortie réelle** (version, nombre de tests, durée). Note chaque différence trouvée avec SQLite et corrige-la.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (livrable base de données, déploiement).
- **Terminé quand :** la suite passe sur PostgreSQL avec une sortie collée, ou les échecs sont listés et corrigés.

## T2 — Couverture de tests mesurée
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 1 h 30
- **À faire :** mesure la couverture avec `coverage` sur la suite complète, par application (core, incubator, documents, portal, analytics, assistant, gallery). Ajoute le tableau dans `docs/TESTS_ET_ANOMALIES.md` avec la commande. Pas d'objectif promis : seulement la mesure et les trois zones les moins couvertes.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (rapport).
- **Terminé quand :** le tableau est reproductible avec la commande indiquée.

## T3 — Routes lentes sous charge
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** les mesures de charge de Pathé (`scripts/resultats_charge.md`, à refaire sans limitation de débit) montrent des temps supérieurs à 1 s à 20 clients sur les dossiers et les indicateurs. Quand Pathé a publié ses mesures corrigées, repère les requêtes en trop (N+1, absence de `select_related` ou d'index) avec `connection.queries`, corrige les deux routes les plus lentes et mesure avant et après.
- **Tu attends :** les mesures corrigées de Pathé. Branche : `Kalz`.
- **Attendu par :** Lansana (rapport, section performance).
- **Terminé quand :** un tableau avant/après figure dans `docs/PERFORMANCE.md`, avec les tests qui passent.
