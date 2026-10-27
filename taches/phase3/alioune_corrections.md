# Alioune — Corrections des tests E2E (Phase 3, T3)

> Ta Phase 3 est fusionnée dans `test` : qualité des données, méthodologie et six tests Playwright. Trois corrections restent à faire sur ta branche `Alioune` (fais d'abord `git pull origin test`).

1. **Démarrage automatique** : la consigne demandait que `npm run test:e2e` démarre lui-même le back-end (SQLite, `seed_all`) et le front. Aujourd'hui `webServer` n'existe qu'en CI et ne lance que le front. Configure `webServer` (deux serveurs) pour qu'il fonctionne aussi en local.
2. **Durée mesurée** : le README annonce « ~40 secondes, garanti ». Lance réellement `npm run test:e2e` sur une base fraîche et écris la durée observée, sans promesse.
3. **README** : « 5 parcours critiques » alors que la liste en contient 6. Corrige le nombre.

Vérifie ensuite `npm run lint`, `npm run build` et pousse `Alioune`.

## Information
Tes retraits d'emojis dans les pages de l'incubateur sont déjà dans `test`. Maimouna modifie les mêmes pages (`incubateur/page.tsx`, `alertes`, `projets`) : c'est elle qui résoudra les conflits en tirant `test`. Ne retouche plus ces fichiers, ils ne sont pas dans ton domaine.

## Correction issue de la recette
- **C4 (majeur) :** sur `/documents`, ta barre `AppShell` et la barre `AppSidebarLayout` de Maimouna se cumulent et la page déborde (1359 px pour 1280). Maimouna corrige l'écran ; mets-toi d'accord avec elle pour qu'**une seule barre soit rendue par page**, et garde ta version pour le tableau de bord.
