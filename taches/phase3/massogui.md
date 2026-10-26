# Massogui — Phase 3

> Domaine : front-end, conception du site web. Axes : **finition et fiabilité du site public**, accessibilité, et **supports de communication** (livrables). Code dans `frontend/src/app/`.
> Ta Phase 2 est validée et fusionnée dans `test` : galerie, assistant, espace galerie. Bravo : photo allégée à 217 Ko, images centralisées, filtres de la galerie sûrs. J'ai ajouté 3 tests sur tes filtres `mes_fiches` et `en_validation` et je les ai documentés dans le contrat d'API. Fais `git pull origin test` sur ta branche `dev-massogui`.
> Lis [../00_PRIORITES.md](../00_PRIORITES.md). Règles inchangées : aucune fausse donnée affichée comme réelle, `lint` et `build` passent, une seule branche (`dev-massogui`).

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Pages d'erreur, états vides et pages légales
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** pour que le site se comporte bien en démonstration quand quelque chose ne va pas : page 404 soignée (`app/not-found.tsx`) avec retour à l'accueil, page d'erreur générale (`app/error.tsx`) avec bouton « Réessayer », écrans de chargement (`loading.tsx`) pour les listes du portail et de la galerie. Deux pages légales liées depuis le pied de page : `/mentions-legales` et `/confidentialite`. La seconde doit expliquer simplement quelles données sont collectées (compte, dossier, messages de contact), à quoi elles servent, qui y accède selon les rôles, et **l'usage de l'intelligence artificielle** (générateur de documents, assistant, questions sur les données : les textes générés doivent être relus par un humain avant d'être validés). Écris-la d'après le fonctionnement réel de la plateforme, sans promettre ce qu'elle ne fait pas.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** Lansana (le cahier des charges demande la protection des données et l'information sur l'usage de l'IA), le rapport.
- **Terminé quand :** une adresse inexistante affiche la 404, une panne de l'API affiche l'erreur avec « Réessayer » sans planter, les deux pages légales existent et sont liées depuis le pied de page.

## T2 — Accessibilité, mobile et référencement du site public
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** audit et corrections sur **tes pages** (portail, galerie, accueil, assistant). Mesure avec Lighthouse (dans Chrome, onglet « Lighthouse ») sur 5 pages principales, ordinateur et mobile. Objectif : accessibilité d'au moins 90. Vérifie : contrastes conformes à la charte (le beige ne porte jamais de texte blanc), navigation au clavier avec focus visible, texte alternatif sur toutes les images, ordre des titres (un seul `h1` par page), zones tactiles d'au moins 44 px, aucun défilement horizontal à 390 px de large. Ajoute pour chaque page publique un `title` et une `description` propres (champ `metadata`), une image de partage (Open Graph) avec le logo, `robots.txt` et `sitemap.xml`. Écris les scores avant et après dans `docs/ACCESSIBILITE.md`, avec les corrections faites.
- **Tu attends :** rien. Maimouna relève aussi les défauts mobiles des pages (sa tâche T3 de la Phase 3) : coordonnez-vous si elle te signale quelque chose. Branche : ta branche personnelle.
- **Attendu par :** Lansana (rapport, qualité de l'interface), Maimouna (captures).
- **Terminé quand :** les 5 pages ont un score d'accessibilité d'au moins 90 sur ordinateur et mobile, ou chaque écart est expliqué dans `docs/ACCESSIBILITE.md`.

## T3 — Affiche de lancement et kit pour les réseaux sociaux
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 4 h
- **À faire :** deux livrables de communication demandés par l'évaluation. **(a)** Une affiche ou un flyer de lancement de la plateforme du CIAT, format A4, en PDF et en PNG. **(b)** Un kit pour les réseaux sociaux : trois publications carrées (1080 × 1080) et une bannière de partage (1200 × 630). Utilise la charte (couleurs, polices Montserrat et Inter, logo officiel), la photo du campus et le QR code de la galerie. Le contenu doit rester vrai : message sur le CIAT, l'incubation et la plateforme, sans chiffres inventés. Construis-les en HTML et CSS puis exporte en image avec un petit script Playwright (`scripts/communication.mjs`) pour pouvoir les régénérer. Place les résultats et les sources dans `docs/communication/` avec un `README.md` qui liste chaque pièce.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** la livraison finale (livrables de communication de l'infographe).
- **Terminé quand :** l'affiche A4 et les quatre visuels existent en PNG, respectent la charte, et le script les régénère.

## Quand tu as fini
Vérifie `npm run lint` et `npm run build`. Pousse ta branche `dev-massogui` et préviens Lansana.
