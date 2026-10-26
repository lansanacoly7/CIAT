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
