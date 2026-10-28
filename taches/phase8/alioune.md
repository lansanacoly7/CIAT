# Alioune — Phase 8

> Tes trois tâches de la phase 7 et la refonte du tableau de bord sont validées et fusionnées dans `test` (358 tests verts, build propre). Fais `git pull origin test` sur ta branche `Alioune`. Domaine : données et tableau de bord.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Indicateurs vérifiés contre la base
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet exige des indicateurs « définis précisément » et des analyses fiables. Écris un test back-end (dans `apps/analytics/`) qui, sur les données de `seed_all`, recalcule **chaque indicateur** du tableau de bord directement avec l'ORM (idées reçues, dossiers déposés, projets sélectionnés, incubés, prototypes, taux de sélection, répartitions par domaine, cohorte et genre, évolution mensuelle, partenariats, financements) et compare avec la réponse de l'API, avec et sans filtres (cohorte, domaine, statut, période). Vérifie aussi que la formule écrite dans `docs/livrables/analyse_donnees.md` et la page « Méthodologie » correspond bien au code. Tout écart est corrigé (la doc ou le code, au choix justifié) et consigné.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (fiabilité du livrable data), le rapport.
- **Terminé quand :** chaque indicateur a son test de recoupement, qui échoue si on modifie volontairement un calcul, et la suite reste rapide et verte.

## T2 — Performance mesurée du tableau de bord
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 2 h 30
- **À faire :** mesure la performance réelle de `/tableau-de-bord` et de 3 autres pages clés avec Lighthouse (ou l'outil de ton choix), sur un build de production local (`npm run build && npm run start`) : score, LCP, CLS, poids des images. Consigne les chiffres réels dans `docs/PERFORMANCE.md` (section « Front-end »), avec la commande et la machine. Corrige ce qui est simple dans ton domaine (images non dimensionnées, graphiques chargés trop tôt, requêtes en double). Ne promets aucun objectif : seulement la mesure et le avant/après.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (rapport, section performance).
- **Terminé quand :** un tableau avant/après avec les valeurs réelles figure dans le document, et `npm run lint && npm run build` passent.

## T3 — Figures d'analyse pour le rapport
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** le rapport doit contenir une « interprétation des résultats et des recommandations ». À partir des données de `seed_all`, produis 5 figures lisibles (PNG, charte du CIAT, titres de 6 mots maximum, aucune donnée inventée) : répartition par domaine, par genre, évolution mensuelle des dépôts, comparaison entre cohortes, financements par source. Génère-les avec un script reproductible `scripts/generer_figures_analyse.py` (lecture de la base ou de l'API), enregistre-les dans `docs/livrables/figures/`, puis insère-les dans `docs/livrables/analyse_donnees.md` avec, sous chacune, 2 à 3 phrases d'interprétation et une recommandation, **en précisant que les données sont fictives de démonstration**.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (rapport et diaporama).
- **Terminé quand :** les 5 figures se régénèrent avec une commande, le document les intègre, et chaque chiffre cité peut être retrouvé dans la base.

## Avant de pousser
`check`, `makemigrations --check`, `python manage.py test` verts, puis `npm run lint && npm run build` (jusqu'au bout). Pousse sur `Alioune` et préviens Lansana.
