# Ibrahima — Phase 11

> Ta Phase 10 (revue de sécurité des nouvelles routes, mot de passe oublié, sauvegarde des fichiers avec empreintes) est validée et fusionnée dans `test` (393 tests verts en 35 s). Fais `git pull origin test` sur ta branche `Kalz`. Back-end et qualité, sans toucher au design.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Qualité du code mesurée (linter)
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** le livrable « Code source » doit être « organisé et commenté ». Ajoute `ruff` (configuration dans `backend/pyproject.toml` ou `ruff.toml`, règles raisonnables : erreurs, imports inutilisés, imports triés, simplifications sûres), lance-le sur tout le back-end, corrige **uniquement les corrections automatiques sans risque** (`ruff check --fix` sur les imports et espaces) et consigne le reste avec son nombre. Ne change aucune logique. Ajoute la commande au README (« Vérifier la qualité du code ») et le nombre d'avertissements avant/après dans `docs/TESTS_ET_ANOMALIES.md`.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (rapport, qualité du code).
- **Terminé quand :** `ruff check` passe sur la configuration retenue (ou les exceptions sont justifiées une à une), et la suite complète reste verte.

## T2 — Mesure de charge sur PostgreSQL
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 h 30
- **À faire :** les mesures de charge de Pathé (`scripts/mesure_charge.py`, `docs/PERFORMANCE.md`) ont été faites sur SQLite. Relance-les sur ton service PostgreSQL 16 (même script, même jeu `seed_all`, serveur Waitress, mêmes paliers de clients, option `--routes` si utile), et ajoute à `docs/PERFORMANCE.md` une section « Mesures sous charge sur PostgreSQL » avec le tableau comparé à SQLite : médiane, 95e centile, débit, erreurs, avec la machine utilisée. Écris sans enjoliver : si PostgreSQL est plus lent ou plus rapide, dis-le et explique pourquoi dans la limite de ce que tu as mesuré.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (rapport, section performance et déploiement).
- **Terminé quand :** le tableau comparé SQLite / PostgreSQL figure avec les commandes exactes, et les chiffres peuvent être retrouvés en relançant le script.

## T3 — Intégrité des données au niveau de la base
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 3 h
- **À faire :** audite les modèles du schéma : contraintes qui manquent (unicités, `CheckConstraint` sur les statuts, les notes de la grille, les montants positifs, les dates de début avant les dates de fin, un seul mentor actif par projet), choix des `on_delete` (rien ne doit supprimer en cascade des décisions ou des preuves par erreur), index sur les clés étrangères filtrées. Ajoute les contraintes pertinentes avec leurs migrations (vérifie qu'elles s'appliquent sur les données de `seed_all` et sur PostgreSQL), des tests qui prouvent qu'une donnée incohérente est refusée, et mets à jour `docs/dictionnaire_donnees.md`. Ne casse aucun test existant ; si une contrainte révèle des données de démonstration incohérentes, corrige la graine, pas la contrainte.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (livrable base de données).
- **Terminé quand :** chaque contrainte ajoutée a son test de refus, les migrations passent sur SQLite et PostgreSQL, et la suite reste verte.

## Avant de pousser
`check`, `makemigrations --check` et la suite complète verts. Pousse sur `Kalz` et préviens Lansana.
