# Lansana — Phase 5

> Domaine : lead technique. Axes : **dossier de démonstration** et **rapport au format de remise**. Phase 4 : T1 (véracité) et T3 (images de démonstration) validées et fusionnées dans `test` (256 tests). T2 (déploiement) reste de côté jusqu'à nouvel ordre. Tu travailles sur `dev-lansana-coly` : `git fetch origin && git merge origin/test` avant de commencer.

Ordre conseillé : T1, puis T2.

## T1 — Script de démonstration et comptes de test
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** écris `docs/DEMO.md` : le tableau des comptes de démonstration (un par rôle, avec l'email et le mot de passe **tels qu'ils existent réellement dans `seed_all`**, vérifiés en te connectant à l'API), puis un déroulé de 8 à 10 minutes (parcours porteur, comité, coordonnateur, documents IA, assistant, tableau de bord, galerie), avec pour chaque étape l'écran, l'action et le résultat attendu. Ce document sert à la vidéo et à la démonstration en direct.
- **Tu attends :** rien. Branche : `dev-lansana-coly`.
- **Attendu par :** Massogui (vidéo), Lansana (présentation).
- **Terminé quand :** chaque identifiant du tableau fonctionne réellement, et chaque étape du déroulé a été jouée une fois.

## T2 — Rapport au format de remise (5 à 10 pages)
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** le sujet exige un rapport de 5 à 10 pages. Produis un PDF (et un Word) depuis `docs/livrables/rapport_projet.md`, mis en forme avec la charte, et **compte les pages réelles**. S'il en fait moins de 5 ou plus de 10, ajuste le texte, sans inventer de contenu. Indique le chemin des fichiers générés et la commande pour les régénérer.
- **Tu attends :** rien. Branche : `dev-lansana-coly`.
- **Attendu par :** la remise finale.
- **Terminé quand :** le PDF fait entre 5 et 10 pages, sans mise en page cassée, et la commande de génération est documentée.

## T3 — Recette complète du parcours de démonstration
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 à 4 h
- **À faire :** joue le rôle d'un correcteur. Fais `git merge origin/test`, installe les dépendances (`pip install -r backend/requirements.txt`, `npm ci` dans `frontend/`), lance `python manage.py migrate && python manage.py seed_all`, le back-end, le front, puis déroule `docs/DEMO.md` **étape par étape avec les vrais comptes**, en version ordinateur puis téléphone (largeur 390 px). Lance aussi la suite Playwright (`frontend/e2e/`) et note ce qui passe ou échoue. Pour chaque écran : texte cassé ou en anglais, caractères mal encodés (`é`, `Ã©`), page vide, image absente, bouton sans effet, message d'erreur peu clair, mise en page cassée sur téléphone, lien mort, ancienne orthographe « Traoré » (l'orthographe officielle est « Trawaré »). Vérifie aussi les trois fonctions d'IA avec les clés du `.env` : documents, assistant, question sur les données.
- **Livrable :** `docs/RECETTE.md` avec un tableau (écran, rôle, appareil, constat, gravité, capture si utile, statut). Corrige toi-même les défauts simples (texte, orthographe, petit style) dans le périmètre de ton domaine ; pour le reste, indique pour chacun à qui il revient (Maimouna : espace du porteur, Massogui : site public et galerie, Alioune : tableau de bord, Ibrahima et Pathé : API). Ne corrige rien d'important sans le consigner.
- **Tu attends :** rien. Branche : `dev-lansana-coly`.
- **Attendu par :** Lansana (liste des corrections à envoyer à l'équipe avant la remise).
- **Terminé quand :** chaque étape de `DEMO.md` a été jouée sur ordinateur et téléphone, le tableau est complet et honnête (ce qui n'a pas pu être testé est écrit), et la suite Playwright a été lancée avec son résultat réel.
