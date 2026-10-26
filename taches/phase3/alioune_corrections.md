# Alioune — Corrections des tests E2E (Phase 3, T3)

> Ta Phase 3 est fusionnée dans `test` : qualité des données, méthodologie et six tests Playwright. Trois corrections restent à faire sur ta branche `Alioune` (fais d'abord `git pull origin test`).

1. **Démarrage automatique** : la consigne demandait que `npm run test:e2e` démarre lui-même le back-end (SQLite, `seed_all`) et le front. Aujourd'hui `webServer` n'existe qu'en CI et ne lance que le front. Configure `webServer` (deux serveurs) pour qu'il fonctionne aussi en local.
2. **Durée mesurée** : le README annonce « ~40 secondes, garanti ». Lance réellement `npm run test:e2e` sur une base fraîche et écris la durée observée, sans promesse.
3. **README** : « 5 parcours critiques » alors que la liste en contient 6. Corrige le nombre.

Vérifie ensuite `npm run lint`, `npm run build` et pousse `Alioune`.
