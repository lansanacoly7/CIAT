# Lansana — Phase 6 : appui au design et à l'UX de l'équipe

> Contexte : Alioune, Maimouna et Massogui **restent responsables de leurs écrans** et continuent à les concevoir. Certains peinent à obtenir une interface qui leur plaît. Lansana et ses assistants les **aident à progresser plus vite** : ils ne reprennent pas leurs pages, ils leur donnent un cadre commun, des constats précis et des solutions prêtes à appliquer. Fais `git fetch origin && git merge origin/test` avant de commencer.

## Règles
- **Aucune modification des pages ou composants d'un membre** sans qu'il le demande : ton travail se limite à des ajouts (document, jetons, composants partagés nouveaux) et à des fichiers de conseils. Sinon : conflits.
- Visuel et UX uniquement, jamais de logique ni d'API. Charte : `docs/Charte_Graphique_CIAT_ISEP.pdf` et `frontend/src/components/ui.tsx`. Pas d'emoji, jamais de texte blanc sur beige ou doré, contraste d'au moins 4,5:1, zones tactiles d'au moins 44 px.
- Branche : `dev-lansana-coly`. `npm run lint && npm run build` doivent passer.

Ordre : T1, puis T2, puis T3.

## T1 — Cadre de design commun (additif)
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** capture les 29 pages en 1280 px et 390 px (`docs/design/etat_actuel/`) et fais l'état des lieux : deux en-têtes publics différents, rayons de coins, titres, boutons, cartes, badges de statut qui diffèrent selon les pages. Écris `docs/DESIGN_SYSTEM.md` : une échelle typographique (titre de page, section, corps, légende), espacements, rayons, ombres, couleurs sémantiques, catalogue des composants de `ui.tsx` avec **quand les utiliser**, et 3 modèles de page (page publique, page d'espace connecté, page de formulaire). Si un composant manque dans `ui.tsx`, ajoute-le **sans modifier les existants**.
- **Tu attends :** rien. Branche : `dev-lansana-coly`.
- **Attendu par :** Alioune, Maimouna, Massogui (référence commune).
- **Terminé quand :** le document est clair pour quelqu'un qui n'est pas designer, avec des exemples de code.

## T2 — Fiches d'amélioration par écran
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** pour chaque membre, une fiche `docs/design/fiche_<prénom>.md` couvrant **ses** écrans (Alioune : tableau de bord, méthodologie, barre latérale ; Maimouna : dépôt, suivi, alertes, évaluation, compte, documents ; Massogui : accueil, portail, galerie, assistant, connexion). Pour chaque écran : capture, ce qui fonctionne, trois problèmes classés par impact (hiérarchie, cohérence, espacement, lisibilité sur téléphone, états vides), et pour chacun **la correction exacte** (classes Tailwind ou composant à utiliser, avant/après en quelques lignes). Commence par les problèmes qui font paraître le site incohérent (en-tête public différent selon les pages, boutons, titres). Ton ton est celui d'un coéquipier qui aide, pas d'un juge.
- **Tu attends :** T1. Branche : `dev-lansana-coly`.
- **Attendu par :** chaque membre, qui applique les corrections sur ses écrans.
- **Terminé quand :** chaque écran a ses trois corrections applicables telles quelles.

## T3 — Binômage sur demande
- **Complexité :** Variable · **Importance :** Normale · **Durée estimée :** au fil de l'eau
- **À faire :** quand un membre dit à Lansana qu'il bloque sur un écran, tu le prends en binôme : une capture de ce qu'il veut obtenir (ou une description), des variantes de mise en page proposées sous forme de code prêt à coller. Tu ne modifies pas sa branche toi-même : tu fournis le code dans un fichier de `docs/design/` qu'il intègre.
- **Tu attends :** une demande de Lansana.
- **Terminé quand :** le membre a intégré une version qui lui plaît.
