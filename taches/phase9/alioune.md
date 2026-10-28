# Alioune — Phase 9

> Ta Phase 8 est validée et fusionnée dans `test` (375 tests verts) : recoupement des indicateurs avec la base, mesures de performance réelles, figures d'analyse, registre des fonds. Fais `git pull origin test` sur ta branche `Alioune`. Domaine : tableau de bord et données.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Exports fidèles aux filtres
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet demande l'export des analyses en PDF, Excel et image. Écris un test back-end qui, pour plusieurs combinaisons de filtres (cohorte, domaine, statut, période), télécharge l'export Excel, l'ouvre avec `openpyxl` et vérifie que **chaque valeur du fichier est égale à celle de l'API** (indicateurs, répartitions, évolution), et que le PDF contient bien les titres, la période filtrée et les chiffres clés (extraction de texte). Ajoute un test de bout en bout qui télécharge les trois formats (PDF, Excel, image) depuis le tableau de bord avec un filtre actif. Corrige tout écart.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (livrable data, démonstration).
- **Terminé quand :** un export dont une valeur diffère de l'API fait échouer le test, et le test de bout en bout passe.

## T2 — Tests de bout en bout des 4 onglets et du registre
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 h 30
- **À faire :** ta refonte a introduit 4 onglets (`?vue=`) et la fenêtre d'historique des fonds. Ajoute à la suite Playwright : la navigation entre les 4 onglets (l'URL change, l'état est conservé au rechargement), l'ouverture et la fermeture de la fenêtre du registre (clavier : `Échap`, focus piégé puis rendu), un filtre qui ne donne aucun résultat (message clair, pas de graphique vide), et l'accès refusé pour un porteur. Sélecteurs robustes (rôles et libellés accessibles). Ajoute les pages d'onglets au test d'accessibilité axe.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (filet de sécurité avant la démonstration).
- **Terminé quand :** `npm run test:e2e` et `npm run test:axe` passent, et un test échoue quand on casse volontairement un onglet.

## T3 — Tableau de bord sur téléphone (390 px)
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** reprends le tableau de bord, la méthodologie et le registre en 390 px : aucun défilement horizontal de la page, graphiques lisibles (hauteur adaptée, légendes qui ne se chevauchent pas), tableaux transformés en cartes empilées ou défilement interne clairement signalé, filtres dans un panneau repliable, fenêtre du registre plein écran avec bouton de fermeture d'au moins 44 px. Les chiffres clés passent en une colonne en gardant la hiérarchie. Prends une capture avant et après de chaque onglet dans `docs/design/dashboard_mobile/`.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (démonstration, vidéo).
- **Terminé quand :** les 4 onglets et la méthodologie sont utilisables à 390 px, sans débordement, avec les captures avant/après.

## Avant de pousser
`check`, `makemigrations --check`, `python manage.py test` verts, puis `npm run lint && npm run build` jusqu'au bout. Pousse sur `Alioune` et préviens Lansana.
