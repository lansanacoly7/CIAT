# Ibrahima — Phase 9

> Ta Phase 8 (calendrier, journal d'audit, notifications, migrations réversibles) est validée et fusionnée dans `test` (336 tests verts). Fais `git pull origin test` sur ta branche `Kalz`. Back-end et documentation, sans toucher au design.

## T1 — Retrouver une suite de tests rapide
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** la suite est passée d'environ 20 s (265 tests) à 46 s et jusqu'à 90 s (336 tests). Mesure avec `python manage.py test --timing` (ou `--durations`) les 15 tests les plus lents, trouve les causes (hachage de mots de passe réel, `setUp` au lieu de `setUpTestData`, création de fichiers, appels réseau, `seed` appelé dans un test) et corrige-les. Objectif : revenir sous 35 s sans supprimer ni affaiblir aucun test.
- **Terminé quand :** le nombre de tests est identique, la durée mesurée avant/après est consignée dans `docs/TESTS_ET_ANOMALIES.md`, tout est vert.

## T2 — Installation vérifiée sur un dépôt neuf
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** le sujet exige une « documentation d'installation et d'exploitation ». Clone le dépôt dans un dossier vide, suis **uniquement** le `README.md` à la lettre : environnement virtuel, dépendances, `.env` (à partir de `.env.example`), `migrate`, `seed_all`, lancement du back-end et du front, premiers comptes. Chaque étape qui échoue ou manque est corrigée dans le document. Ajoute les sections « Exploitation » : sauvegarde et restauration (tes scripts), variables d'environnement importantes, réinitialiser les données de démonstration, que faire si l'IA répond 503, où lire les journaux.
- **Terminé quand :** quelqu'un qui n'a jamais vu le projet peut l'installer et le lancer avec le seul README, et tu as consigné les étapes réellement jouées.

## T3 — Code commenté
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 2 h
- **À faire :** le livrable « Code source » doit être « organisé, commenté ». Ajoute des docstrings en français aux classes, vues, services et fonctions publiques du back-end qui n'en ont pas, **sans changer aucune ligne de logique** (mesure avant/après avec `interrogate` ou un script simple). Priorité aux modules `core/ai.py`, `assistant/services.py`, `documents/services.py`, `analytics/` et `incubator/`. Un commentaire explique le **pourquoi** (règle métier, sécurité), pas une paraphrase du code.
- **Terminé quand :** le taux de docstrings mesuré passe nettement au-dessus de l'état initial (indique les deux chiffres), tous les tests restent verts, le diff ne contient aucun changement de logique.

## Avant de pousser
`check`, `makemigrations --check` et la suite complète verts, puis pousse sur `Kalz` et préviens Lansana.
