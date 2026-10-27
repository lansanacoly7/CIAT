# Maimouna — Phase 4

> Domaine : front-end (parcours du porteur, suivi, maquettes) et correctifs d'export. Ta Phase 3 n'est pas encore fusionnée : le travail est riche (13 maquettes desktop et mobile, bilans de suivi, Mon compte, sidebar), mais deux points bloquent. Fais d'abord `git pull origin test` (il a beaucoup avancé), résous les conflits, puis corrige.

## Corrections avant fusion (bloquantes)
1. **`backend/apps/documents/exports.py`** : tu as remis un `try/except ImportError` autour des imports `python-docx`, qu'on t'avait déjà fait retirer. Remets l'import normal en tête de fichier, avec les constantes de couleur. Les dépendances sont dans `requirements.txt` : `pip install -r backend/requirements.txt` si l'import échoue chez toi.
2. **Page de connexion** : `contact@ciat.sn` est une adresse inventée. Remplace-la par « À compléter » (comme les pages légales), ou renvoie vers la page de contact du site.
3. Avant de pousser : `python manage.py test` (252 tests en ~20 s) et `npm run lint && npm run build` doivent passer.

## T1 — Boutons des nouveaux exports
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** deux routes de Pathé sont disponibles dans `test` : `GET /api/incubator/dossiers/{id}/accuse/` (PDF) et `GET /api/incubator/projets/{id}/compte-rendu/?format=pdf`. Ajoute « Télécharger mon accusé de réception » dans l'espace du porteur (visible seulement après soumission) et le choix Excel ou PDF pour le compte rendu. Message clair en cas d'erreur.
- **Tu attends :** rien. Branche : `dev-maimouna`.
- **Attendu par :** Lansana (démonstration).
- **Terminé quand :** les téléchargements fonctionnent avec les vrais comptes de `seed_all`, sans donnée écrite dans le code.

## T2 — Régénérer les maquettes après intégration
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 1 h 30
- **À faire :** après la fusion de tout le monde dans `test` (méthodologie du tableau de bord, galerie, nouveau design), relance `scripts/captures.mjs` sur la base `seed_all` et remplace les images de `docs/maquettes/`. Mets à jour `docs/maquettes/README.md` et `DEFAUTS_MOBILE.md` avec l'état réel.
- **Tu attends :** les corrections ci-dessus fusionnées, et les images de démonstration de Lansana.
- **Attendu par :** Lansana (livrable maquettes), Massogui (vidéo).
- **Terminé quand :** chaque écran principal a sa capture desktop et mobile à jour, sans page vide ni erreur.

## Attention : conflits attendus
Alioune a retiré des emojis dans `incubateur/page.tsx`, `incubateur/alertes/page.tsx` et `incubateur/projets/page.tsx`, déjà fusionné dans `test`. En tirant `test`, tu auras des conflits sur ces fichiers : garde ta version (refonte) et ne remets pas d'emojis.

## Corrections issues de la recette (`docs/RECETTE.md`)
- **C4 (majeur) — `/documents` déborde à droite sur ordinateur (1359 px pour 1280).** Deux barres latérales se cumulent : `AppShell` (Alioune) et `AppSidebarLayout` (toi). Mets-toi d'accord avec Alioune : **une seule barre latérale par page**. Corrige le cumul sur `/documents` et vérifie `/incubateur`, `/galerie/gestion` et `/assistant`.
- **C6 — avertissement d'hydratation Next.js** dans la console sur `/incubateur` à la première session (contenu qui dépend de la session ou de `localStorage` affiché côté serveur). Corrige-le.
- **C8 — suivi des jalons sur téléphone (390 px)** : le tableau impose un défilement horizontal. Passe à des cartes empilées.
Vérifie `npm run lint && npm run build`, ouvre l'écran en 390 px et en 1280 px, puis pousse.
