# Alioune — Phase 1

> Domaine : front-end, grandes interfaces et données. Module : **P3 Tableau de bord décisionnel** (priorité 3). Code dans `frontend/src/app/tableau-de-bord/` et `backend/apps/analytics/`.
> Lis d'abord [00_PRIORITES.md](../00_PRIORITES.md) et [CONTRATS_API.md](../CONTRATS_API.md) (section P3).

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Structure du dashboard et filtres
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** page `/tableau-de-bord` : mise en page responsive, barre de filtres (période, cohorte, domaine, statut), cartes d'indicateurs (idées reçues, dossiers déposés, projets sélectionnés, projets incubés, prototypes, taux de sélection), états de chargement et d'erreur. Données fictives qui respectent le contrat au départ. Ajoute la bibliothèque de graphiques de ton choix (Recharts recommandé) et utilise les couleurs de la charte.
- **Tu attends :** rien pour démarrer. Branche : ta branche personnelle.
- **Attendu par :** Lansana (démonstration).
- **Terminé quand :** la page est utilisable sur ordinateur et téléphone, les filtres modifient l'état et les cartes, aucun texte coupé avec des valeurs très grandes.

## T2 — Endpoints d'indicateurs
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 à 4 h
- **À faire :** dans `backend/apps/analytics/`, les endpoints du contrat (`indicateurs`, `par-domaine`, `par-cohorte`, `par-genre`, `evolution`) à partir des projets et des utilisateurs, avec les filtres communs. Accès limité à `coordonnateur`, `administrateur` et `membre_comite`. Requêtes d'agrégation efficaces (pas de boucle qui interroge la base à chaque ligne).
- **Tu attends :** le jeu de données de démonstration de Lansana (T1) pour tester avec du volume. Les dossiers d'Ibrahima enrichiront `dossiers_deposes` plus tard : tant qu'ils n'existent pas, calcule-le à partir du statut du projet. Branche : ta branche personnelle.
- **Attendu par :** toi-même (T3), et Lansana pour l'assistant en langage naturel plus tard.
- **Terminé quand :** les cinq endpoints renvoient le format du contrat, les filtres se combinent, un porteur reçoit `403`.

## T3 — Graphiques et connexion aux vraies données
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** graphiques interactifs : projets par domaine, évolution par mois, comparaison entre cohortes, répartition par genre (légende lisible, infobulles, palette de la charte). Remplace les données fictives de T1 par les appels réels.
- **Tu attends :** tes T1 et T2, la connexion de Maimouna (T1) pour appeler l'API en tant qu'utilisateur connecté. Branche : ta branche personnelle.
- **Attendu par :** Lansana (démonstration), et le rapport final (captures d'écran).
- **Terminé quand :** connecté avec `coordo@ciat.sn`, le dashboard affiche les vraies données du jeu de démonstration et réagit aux filtres.

## Quand tu as fini
Vérifie `npm run lint` et `npm run build`, et `python manage.py check`. Ouvre ta demande de fusion et préviens Lansana : la tâche suivante te sera donnée après validation.

## Revue de ta Phase 1 : ce qui est fait et ce qui reste
**Fait (merci, le rendu est soigné) :** T1, la structure du dashboard : filtres, cartes d'indicateurs, graphiques Recharts avec la palette de la charte, états de chargement.

**Pas encore fait, donc ta branche n'est pas fusionnée dans `test` :**
1. **T2 n'existe pas.** Ta branche ne contient aucun fichier dans `backend/`. Les endpoints `indicateurs`, `par-domaine`, `par-cohorte`, `par-genre` et `evolution` de `backend/apps/analytics/` restent à écrire, avec les filtres du contrat et l'accès réservé à `coordonnateur`, `administrateur` et `membre_comite`. Tu peux les tester avec `python manage.py seed_demo` (62 projets, 3 cohortes). Ajoute des tests rapides (`MD5PasswordHasher`).
2. **Le dashboard n'affiche que des données fictives.** `DashboardContent.tsx` appelle `getMockAnalyticsData`. Branche-le sur les vrais endpoints avec le client `src/lib/api.ts`. En cas d'erreur de l'API, affiche un message d'erreur : pas de fausses données (voir la règle plus bas).
3. **La page n'est pas protégée.** Le dashboard est réservé à l'équipe CIAT et au comité : utilise le composant de protection de routes de Maimouna une fois qu'il sera dans `test` (il y est dans sa branche `dev-maimouna`, en cours de correction). En attendant, ne l'expose pas dans le menu public.
4. **Tu as réécrit des fichiers communs** : `src/components/Header.tsx` (+367 lignes) et `src/app/layout.tsx`. Ils sont déjà modifiés par Massogui et Maimouna : ta branche entre en **conflit** avec `test` sur ces deux fichiers. Remets ces deux fichiers dans l'état de `test` (`git checkout origin/test -- frontend/src/components/Header.tsx frontend/src/app/layout.tsx`) et garde ta barre latérale et ta bannière **à l'intérieur** du module `tableau-de-bord/`. Si tu as besoin d'un changement du menu commun, demande à Lansana.
5. **Règle sur les fausses données :** pas de données fictives affichées comme réelles. Si tu veux garder `mockData.ts` pour tes essais, mets-le derrière `NEXT_PUBLIC_MODE_DEMO=1` (absente par défaut) avec un bandeau « MODE DÉMONSTRATION » toujours visible.

Ordre conseillé : d'abord le point 4 (`git merge origin/test` sur ta branche pour résoudre les conflits), puis T2, puis le point 2, puis le point 3. Pousse sur ta branche `Alioune` après chaque étape et préviens Lansana quand c'est prêt.
