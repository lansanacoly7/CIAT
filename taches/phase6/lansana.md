# Lansana — Phase 6 : reprise du design et de l'UX de toute la plateforme

> Décision de Lansana : Alioune, Maimouna et Massogui peinent à obtenir une interface qui leur plaît. **Lansana et ses assistants prennent en charge tout le côté visuel et UX du front**, sur une seule branche (`dev-lansana-coly`), pour obtenir un résultat cohérent. Les trois membres arrêtent de modifier le design (voir leurs fichiers). Fais `git fetch origin && git merge origin/test` avant de commencer.

## Règles
- **Visuel et UX uniquement** : mise en page, hiérarchie, espacements, couleurs, typographie, composants, états vides et de chargement, responsive. **Aucun changement de logique, d'API ni de données.**
- Charte : `docs/Charte_Graphique_CIAT_ISEP.pdf` et `frontend/src/components/ui.tsx`. Pas d'emoji, pas d'icône décorative gratuite, jamais de texte blanc sur beige ou doré. Contraste au moins 4,5:1, zones tactiles d'au moins 44 px.
- Chaque lot : `npm run lint && npm run build`, `npm run test:e2e` et `npm run test:axe` doivent passer. Un commit par groupe de pages.
- Avant et après : une capture de chaque page (1280 px et 390 px) dans `docs/design/avant/` et `docs/design/apres/`. Lansana valide **après T2** (le cadre du site) avant de continuer.

Ordre : T1, puis T2 (arrêt pour validation de Lansana), puis T3, puis T4.

## T1 — Système de design unique
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 2 h
- **À faire :** fais l'état des lieux (captures des 29 pages, des styles concurrents : deux en-têtes, rayons de coins, titres, boutons, cartes, badges de statut). Écris `docs/DESIGN_SYSTEM.md` : **une seule** échelle typographique (titre de page, section, corps, légende), espacements, rayons, ombres, couleurs sémantiques (succès, alerte, erreur, information), et le catalogue de composants (bouton, carte, badge, tableau, champ, bandeau de page, état vide). Centralise tout dans les jetons de `globals.css` et dans `ui.tsx`. Dis explicitement ce qui est supprimé.
- **Tu attends :** rien. Branche : `dev-lansana-coly`.
- **Attendu par :** tout le reste de la phase.
- **Terminé quand :** le document et les jetons existent, et aucun composant n'est défini deux fois.

## T2 — Cadre commun du site public (en-tête, pied de page, bandeau de page)
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 h
- **À faire :** un seul `Header`, un seul `Footer` et un seul bandeau de titre de page pour toutes les pages publiques (accueil, Le CIAT, Incubateur, actualités, événements, appels, projets, partenaires, domaines, documents, contact, galerie, connexion, inscription, légales). Même boutons (« Connexion » pour un visiteur, accès à l'espace pour un connecté). Menu mobile propre à 390 px. Garde la barre latérale des espaces connectés.
- **Tu attends :** T1. Branche : `dev-lansana-coly`.
- **Attendu par :** Lansana (validation du style avant la suite).
- **Terminé quand :** en passant d'une page publique à l'autre, rien ne change d'en-tête ni de style. **Arrête-toi et demande la validation de Lansana.**

## T3 — Toutes les pages publiques
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 4 h
- **À faire :** applique le système aux pages publiques, une par une : accueil, Le CIAT, Incubateur, actualités (liste et détail), événements, appels, projets incubés (liste et détail), partenaires, domaines, documents, contact, galerie (liste et fiche), connexion, inscription, légales, 404. Hiérarchie claire (un titre, une action principale par écran), sections aérées, cartes homogènes, images avec place réservée, états vides et chargement soignés.
- **Tu attends :** la validation de T2. Branche : `dev-lansana-coly`.
- **Attendu par :** Lansana, la vidéo, la remise.
- **Terminé quand :** chaque page publique suit le système, en 1280 px et en 390 px, sans débordement.

## T4 — Espaces connectés
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 4 h
- **À faire :** même traitement pour : tableau de bord et méthodologie, gestion de l'incubateur (dépôt, suivi, alertes, évaluation, détail d'un projet), générateur de documents (liste, création, éditeur), assistant, compte, gestion de la galerie. Même bandeau de page, mêmes cartes, mêmes tableaux, mêmes badges de statut, mêmes formulaires ; tableaux et jalons lisibles sur téléphone (cartes empilées plutôt que défilement horizontal). Corrige les contrastes relevés par `docs/ACCESSIBILITE.md`.
- **Tu attends :** T1. Branche : `dev-lansana-coly`.
- **Attendu par :** Lansana, la vidéo, la remise.
- **Terminé quand :** tous les écrans connectés suivent le système, et `npm run test:axe` ne relève plus de violation grave.
