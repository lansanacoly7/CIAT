# Maimouna — Phase 7

> Ta refonte de l'espace candidat, le bouton d'accusé de réception et les maquettes sont fusionnés dans `test`. Fais `git pull origin test` sur ta branche `dev-maimouna`.
> **Attention :** tu as retravaillé `frontend/src/app/assistant/page.tsx`, qui est le fichier de Massogui (plus de 700 lignes modifiées). Parle avec lui avant de le toucher de nouveau, sinon vous aurez des conflits.

## T1 — Vue calendrier de l'espace incubateur
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** une vue calendrier mensuelle (`/incubateur/calendrier`) avec les jalons et objectifs, en rouge s'ils sont en retard. Elle consomme `GET /api/incubator/calendrier/?mois=AAAA-MM` (Ibrahima, tâche T1 de `taches/phase7/ibrahima.md`) ; commence par le contrat, tu peux travailler en attendant l'API sur la structure et les états de chargement, sans données écrites dans le code. Navigation mois précédent et suivant. Sur téléphone (390 px) : une liste par jour plutôt qu'une grille. Utilise les composants de `ui.tsx`. Messages clairs en cas d'erreur de l'API. Ajoute le lien dans le menu de l'espace incubateur.
- **Tu attends :** la route d'Ibrahima fusionnée dans `test`. Branche : `dev-maimouna`.
- **Attendu par :** Lansana (démonstration, conformité au sujet).
- **Terminé quand :** un porteur, un mentor et un coordonnateur voient chacun leur calendrier ; `npm run lint && npm run build` passent.

## T2 — Maquettes (en fin de projet)
Régénère les captures de `docs/maquettes/` avec `scripts/captures.mjs` **une fois le design finalisé**. Lansana te dira quand.
