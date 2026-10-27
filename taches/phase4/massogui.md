# Massogui — Phase 4

> Domaine : front-end, conception du site web. Axes : **vidéo de démonstration** (livrable obligatoire sans responsable) et **design de l'interface**.
> Ta Phase 3 est validée et fusionnée dans `test`, bravo. Je n'ai corrigé que des contenus que tu avais inventés dans les pages légales : coordonnées de l'ISEP (téléphone, courriel), hébergement et garantie sur les fournisseurs d'IA. **Ne remets jamais d'information institutionnelle ou technique non vérifiée dans une page publique** : si tu ne la connais pas, écris « À compléter ». Fais `git pull origin test` sur ta branche `dev-massogui`.
> Règles inchangées : une seule branche (`dev-massogui`), `lint` et `build` passent, aucune fausse donnée affichée comme réelle.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Vidéo de démonstration : scénario et plan
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** l'évaluation exige une « vidéo de démonstration : présentation courte des fonctionnalités essentielles ». Écris le scénario dans `docs/livrables/video/scenario.md` : durée visée de 4 à 5 minutes, découpage en séquences avec pour chacune la durée, l'écran montré, les actions à faire et le texte dit à voix haute. Suis le fil réel de la plateforme : (1) le CIAT et le portail ; (2) un porteur s'inscrit, dépose son dossier avec ses pièces et le soumet ; (3) le comité évalue, le coordonnateur décide ; (4) mentor, jalons et alertes ; (5) le générateur de documents avec l'IA, la validation et l'export ; (6) l'assistant et ses sources ; (7) le tableau de bord et une question en langage naturel ; (8) la galerie et le QR code ; (9) conclusion. Reste vrai : ne montre que ce qui fonctionne et ne promets rien de plus. Prévois une liste de préparation (comptes de démonstration, données chargées avec `seed_all`, clés IA configurées, quelles pages ouvrir dans quel ordre) pour ne rien improviser.
- **Tu attends :** rien (l'application existe). Branche : ta branche personnelle.
- **Attendu par :** Lansana (présentation finale).
- **Terminé quand :** le scénario se déroule du début à la fin sur l'application locale sans étape impossible, et chaque séquence a son texte.

## T2 — Vidéo de démonstration : enregistrement
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** enregistre la vidéo en suivant ton scénario : capture d'écran en 1080p (OBS Studio ou l'enregistreur de Windows), voix off claire en français, montage simple (coupe les temps morts, ajoute le logo en intro et en conclusion, des titres de séquence aux couleurs de la charte). Fichier MP4 à moins de 100 Mo (compresse avec HandBrake si besoin), dans `docs/livrables/video/` **uniquement si la taille est raisonnable**, sinon donne à Lansana le lien de partage (Drive, YouTube non répertorié) et note-le dans `docs/livrables/video/README.md`. Utilise exclusivement les **données de démonstration** : aucune donnée réelle, aucun mot de passe visible à l'écran.
- **Tu attends :** T1. Les dernières fonctionnalités des autres (bilans de suivi de Maimouna, tests de l'interface d'Alioune) ne sont pas nécessaires : filme ce qui existe. Si une fonction annoncée n'est pas encore finie, ne la montre pas.
- **Attendu par :** la livraison finale (livrable n° 9).
- **Terminé quand :** la vidéo dure entre 4 et 6 minutes, le son est audible, les captures sont nettes, et elle ne montre aucune erreur à l'écran.

## T3 — Design : cohérence et finition de l'interface
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 4 h
- **À faire :** consacre le temps restant au design, sans changer le comportement. **(a)** Audit de cohérence visuelle de toutes les pages (les tiennes et celles des autres) avec le jeu de données de démonstration : boutons, titres, espacements, états vides, messages d'erreur, tableaux, formulaires. Note les écarts dans `docs/DESIGN_COHERENCE.md` (page, écart, correction proposée) : pour les pages des autres, tu **listes sans modifier**. **(b)** Corrige tout ce qui est sur tes pages. **(c)** Consolide `frontend/src/components/ui.tsx` : composants communs (bouton, carte, badge, champ de formulaire, tableau, état vide, message d'erreur) avec leurs variantes, de façon à ce que les autres puissent s'y brancher sans réécrire de styles ; documente leur usage en tête du fichier. Animations sobres seulement (transitions courtes, pas d'effet qui gêne la lecture), respect de la préférence « réduire les animations » du système. Reste conforme à la charte (couleurs, polices, contrastes).
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** Maimouna (captures de maquettes), la présentation finale.
- **Terminé quand :** `DESIGN_COHERENCE.md` liste les écarts avec la page concernée, tes pages n'en ont plus, `ui.tsx` est documenté, `lint` et `build` passent, et les accessibilités déjà obtenues (score d'au moins 90) ne baissent pas.

## Quand tu as fini
Vérifie `npm run lint` et `npm run build`. Pousse ta branche `dev-massogui` et préviens Lansana.

## Correction issue de la recette
- **C5 :** sur la galerie (`/galerie`) en 390 px, les cartes du bas de liste affichent un vide avant d'apparaître (`loading="lazy"`). Garde le chargement différé mais réserve la place de l'image (`aspect-ratio`) et ajoute un fond doux pour que rien ne saute.
