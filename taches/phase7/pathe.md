# Pathé — Phase 7 : correction à rendre avant fusion

> Ta Phase 6 (fiche promotionnelle, mesures de charge, audit de sécurité) est fusionnée dans `test`. Ta Phase 7 (robustesse, route de santé, contrat d'API) est livrée mais **pas fusionnable** : elle fait échouer 7 tests du générateur de documents. Fais `git pull origin test` avant toute chose (la suite est passée à 282 tests).

## Correction bloquante
7 tests de `apps.documents.tests.test_documents` échouent avec `429 != 201` quand la suite complète tourne. Cause : ton test de robustesse envoie beaucoup de requêtes aux routes d'IA, la limitation de débit (partagée entre tous les tests via le cache) est épuisée, et les tests qui s'exécutent ensuite sont refusés.

À faire :
1. Dans ton nouveau test, vide le cache au début et à la fin de chaque test (`cache.clear()` dans `setUp` et `tearDown`), ou fixe les limites avec `override_settings` pour ce test.
2. Relance `python manage.py test` **en entier** (pas seulement ton fichier) : il doit être vert.
3. Vérifie `check` et `makemigrations --check`, puis pousse sur `pathe`.

## Rappel des tâches de la Phase 7
- **T1 — Aucune erreur 500** : un test qui envoie des entrées anormales à toutes les routes (identifiants négatifs, chaînes très longues, mauvais types, JSON invalide, fichiers vides) et vérifie qu'on n'obtient jamais 500.
- **T2 — Route de santé et journalisation** : `GET /api/health/` (503 si la base ne répond pas), journalisation sans mot de passe ni jeton.
- **T3 — Contrat d'API vérifié** : un test qui vérifie que chaque route de `taches/CONTRATS_API.md` existe dans le schéma OpenAPI, plus `docs/API.md`.
