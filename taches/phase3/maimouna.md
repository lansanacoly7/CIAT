# Maimouna — Phase 3

> Domaine : front-end et back-end (surtout front ici), UX/UI. Modules : **P2 espaces utilisateurs**, **qualité de l'interface** et **maquettes**. Code dans `frontend/src/`.
> Ta Phase 2 est validée et fusionnée dans `test` (documents, suivi, alertes), bravo. J'ai corrigé deux points dans ton envoi : la consultation du mentor d'un projet n'est plus ouverte à tous les utilisateurs connectés (elle exposait l'email du mentor), et l'import de `python-docx` est rétabli sans `try/except`. **Lance `pip install -r backend/requirements.txt` dans ton environnement** : il n'est pas à jour, c'est ce qui t'avait fait contourner l'import. Puis `git pull origin test` sur ta branche `dev-maimouna`.
> Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md) (sections P2). Le back-end de ces écrans existe déjà dans `test`.
> Règles inchangées : aucune fausse donnée affichée comme réelle, `lint` et `build` passent, une seule branche (`dev-maimouna`).

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Bilans à 3 et 6 mois et compte rendu d'un projet
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** dans la page de suivi d'un projet (`/incubateur/projets/[id]`), un bloc « Bilans de suivi » : liste des bilans à 3 et à 6 mois (`GET /api/incubator/projets/{id}/suivis/`), formulaire de création pour le mentor et le coordonnateur (échéance, bilan écrit, indicateurs libres), indication claire des bilans manquants selon la durée écoulée. Bouton « Télécharger le compte rendu (Excel) » (`GET /api/incubator/projets/{id}/compte-rendu/?format=xlsx`, accessible selon les droits du back-end : affiche le message d'erreur `403` tel quel).
- **Tu attends :** rien (le back-end d'Ibrahima est dans `test`). Branche : ta branche personnelle.
- **Attendu par :** Lansana (démonstration, livrable « comptes rendus »).
- **Terminé quand :** un mentor crée un bilan à 3 mois, il apparaît dans la liste, le compte rendu Excel se télécharge et s'ouvre avec les quatre blocs, un porteur ne voit pas le formulaire de création.

## T2 — Espace « Mon compte » et accueil du coordonnateur
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 4 h
- **À faire :** deux écrans que le cahier des charges demande et qui manquent. **(a)** Page `/compte` pour tout utilisateur connecté : voir et modifier son profil (nom, téléphone, organisation, genre, via `GET/PATCH /api/auth/me/`), voir son rôle, et pour un porteur la liste de ses projets et de ses dossiers avec leur statut. **(b)** Accueil du coordonnateur dans `/incubateur` : file des dossiers à traiter (soumis ou en évaluation), nombre de jalons en retard (depuis `/api/incubator/alertes/`), projets sans mentor, et raccourcis vers l'évaluation, la décision et le suivi. N'affiche que ce que l'API renvoie.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** Lansana (démonstration du parcours complet porteur puis coordonnateur).
- **Terminé quand :** un porteur modifie son téléphone et le voit enregistré après actualisation, le coordonnateur voit sa file de dossiers avec les chiffres qui recoupent le jeu de démonstration, aucun écran ne montre de fausse donnée.

## T3 — Maquettes (livrable) et passage mobile
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 4 h
- **À faire :** les **maquettes** sont un livrable obligatoire (« parcours principal sur ordinateur et téléphone »), et nous avons décidé de les tirer du code. Avec le jeu de données de démonstration (`seed_all` d'Antigravity, dès qu'il est dans `test`, sinon `seed_demo`), produis des captures propres dans `docs/maquettes/`, une capture ordinateur (1440 px) et une capture téléphone (390 px) pour chacun de ces parcours : accueil et portail, connexion et inscription, dépôt de dossier, évaluation du comité, générateur de documents, suivi d'un projet, galerie, tableau de bord, assistant. Fais-le avec un petit script (`scripts/captures.mjs` utilisant Playwright) pour pouvoir le relancer, et un `docs/maquettes/README.md` qui liste chaque image et ce qu'elle montre. Pendant ce travail, **note chaque défaut visuel sur téléphone** (texte coupé, bouton hors écran, tableau qui déborde) et corrige ceux de tes propres pages ; pour les pages des autres, écris la liste dans `docs/maquettes/DEFAUTS_MOBILE.md` avec le nom de la page, sans les modifier.
- **Tu attends :** Massogui (assistant) et Alioune (dashboard) pour les dernières captures ; commence par les pages déjà là. Branche : ta branche personnelle.
- **Attendu par :** la livraison finale (livrable n° 2 de l'évaluation) et le rapport.
- **Terminé quand :** chaque parcours a ses deux captures, le script les régénère, et les défauts mobiles sont corrigés ou listés avec leur responsable.

## Quand tu as fini
Vérifie `npm run lint` et `npm run build` (et `npm ci` doit réussir). Pousse ta branche `dev-maimouna` et préviens Lansana.
