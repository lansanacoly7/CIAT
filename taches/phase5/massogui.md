# Massogui — Phase 5

> Domaine : front-end, site public, galerie, communication. Ta refonte de l'accueil et du header est fusionnée dans `test`. Fais `git pull origin test` sur ta branche `dev-massogui`.
> **Constat d'audit :** l'accueil a un en-tête et un style (petite barre avec « Candidater », autre logo) qui ne ressemblent pas aux autres pages publiques (Le CIAT, actualités, galerie), qui ont l'autre en-tête avec « Connexion ». Un visiteur a l'impression de voir deux sites différents.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Un seul en-tête et un seul pied de page pour tout le site public
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** choisis la version finale (la tienne) et applique-la à **toutes** les pages publiques : accueil, Le CIAT, Incubateur, actualités, galerie, partenaires, documents, contact, connexion, mentions légales. Même en-tête, mêmes boutons (« Connexion » pour un visiteur, accès à l'espace pour un connecté), même pied de page, mêmes titres (police, tailles, couleurs). Ne casse pas la barre latérale des espaces connectés (elle reste celle d'Alioune).
- **Tu attends :** rien. Branche : `dev-massogui`.
- **Attendu par :** Lansana (cohérence, vidéo).
- **Terminé quand :** en passant de l'accueil aux autres pages publiques, rien ne change d'en-tête ni de style, vérifié en 1280 px et en 390 px.

## T2 — Images de la galerie et des actualités
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 1 h 30
- **À faire :** après `python manage.py seed_all` (qui génère les images de démonstration), vérifie que chaque carte de la galerie, des actualités et des partenaires affiche son image. Réserve la place des images (`aspect-ratio`) pour éviter les sauts de page (constat C5 de la recette). En cas d'image manquante : un repli visuel propre, jamais le texte alternatif seul.
- **Tu attends :** rien. Branche : `dev-massogui`.
- **Attendu par :** Lansana (démonstration).
- **Terminé quand :** aucune carte n'affiche un cadre vide ni le texte alternatif.

## T3 — Vidéo : enregistrement
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 à 4 h
- **À faire :** une fois T1 et T2 faits, enregistre la vidéo en suivant `docs/livrables/video/scenario.md` et le déroulé de `docs/DEMO.md` (comptes de démonstration vérifiés). Voix claire, 4 à 5 minutes, aucun mot de passe visible à l'écran.
- **Tu attends :** T1 et T2. Branche : `dev-massogui`.
- **Attendu par :** Lansana (livrable 9, vidéo de démonstration).
- **Terminé quand :** un fichier vidéo existe (ou son lien) et correspond au scénario.
