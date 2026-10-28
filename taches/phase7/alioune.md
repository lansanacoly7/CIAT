# Alioune — Phase 7

> Il te reste trois tâches à rendre. Fais `git pull origin test` sur ta branche `Alioune`.

## T1 — Images de la galerie et des actualités
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 1 h 30
- **À faire :** après `python manage.py seed_all` (qui génère les images de démonstration), vérifie que chaque carte de la galerie, des actualités et des partenaires affiche son image. Réserve la place des images (`aspect-ratio`) pour éviter les sauts de page (constat C5 de la recette : sur 390 px, les cartes du bas de la galerie apparaissent en retard). En cas d'image manquante : un repli visuel propre, jamais le texte alternatif seul.
- **Terminé quand :** aucune carte n'affiche un cadre vide ni le texte alternatif, en 1280 px et en 390 px.

## T2 — Tests de bout en bout manquants
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** ajoute à la suite Playwright : le dépôt d'un dossier par le porteur (jusqu'à la soumission), l'évaluation d'un dossier par le comité, la génération d'un document par le coordonnateur. Sélecteurs robustes (rôles et libellés accessibles, pas de classes CSS), chaque test indépendant, aucune dépendance à une clé d'IA (le cas de l'IA indisponible est testé par son message).
- **Terminé quand :** `npm run test:e2e` passe, et un test échoue quand on casse volontairement le parcours.

## T3 — Qualité des données
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 1 h 30
- **À faire :** relance `python manage.py controle_qualite_donnees` sur une base `seed_all` fraîche et mets à jour `docs/livrables/qualite_donnees.md` avec les résultats réels (nombre de contrôles, anomalies trouvées, corrections). Pas de promesse : seulement ce que la commande affiche.
- **Terminé quand :** le document correspond à la sortie réelle de la commande, avec la date et la commande indiquées.
