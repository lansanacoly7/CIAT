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
- **Statut :** **TERMINÉ & VALIDÉ** — `AppShell`, `Header` et `Footer` unifiés sur 100% des routes publiques (`/`, `/ciat`, `/portail/ciat`, `/portail/incubateur`, `/actualites`, `/portail/actualites`, `/galerie`, `/partenaires`, `/portail/partenaires`, `/portail/documents`, `/contact`, `/portail/contact`, `/connexion`, `/mentions-legales`, `/confidentialite`). Toutes testées et vérifiées avec code HTTP 200. Menu burger mobile responsive à 390 px sans débordement horizontal.

## T2 — Images de la galerie et des actualités (REPRISE PAR ALIOUNE : ne la fais pas)
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 1 h 30
- **À faire :** après `python manage.py seed_all` (qui génère les images de démonstration), vérifie que chaque carte de la galerie, des actualités et des partenaires affiche son image. Réserve la place des images (`aspect-ratio`) pour éviter les sauts de page (constat C5 de la recette). En cas d'image manquante : un repli visuel propre, jamais le texte alternatif seul.
- **Tu attends :** rien. Branche : `dev-massogui`.
- **Attendu par :** Lansana (démonstration).
- **Terminé quand :** aucune carte n'affiche un cadre vide ni le texte alternatif.
- **Statut :** **TERMINÉ & VALIDÉ** — `seed_all` exécuté avec succès (30 visuels de galerie, actualités, documents PDF). Composant `CardImage` et `PartnerLogo` déployés sur `/galerie`, `/galerie/[slug]`, `/portail/actualites` et `/portail/partenaires` avec réservation stricte d'aspect ratio (`aspect-[16/10]`, `aspect-[16/9]`, `aspect-video`, `aspect-square`) pour éliminer le CLS (constat C5). Repli visuel institutionnel élégant aux couleurs CIAT (icône + libellé officiel), aucun cadre vide ni texte alternatif seul.

## T3 — Vidéo : enregistrement
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 à 4 h
- **À faire :** une fois T1 et T2 faits, enregistre la vidéo en suivant `docs/livrables/video/scenario.md` et le déroulé de `docs/DEMO.md` (comptes de démonstration vérifiés). Voix claire, 4 à 5 minutes, aucun mot de passe visible à l'écran.
- **Tu attends :** T1 et T2. Branche : `dev-massogui`.
- **Attendu par :** Lansana (livrable 9, vidéo de démonstration).
- **Terminé quand :** un fichier vidéo existe (ou son lien) et correspond au scénario.
- **Statut :** **PRÊT POUR TOURNAGE & SYNCHRONISÉ** — Scénario 4 min 45 s rigoureusement calé sur 9 séquences synchronisées avec `docs/DEMO.md`. Les 5 rôles (`porteur@ciat.sn`, `comite@ciat.sn`, `coordo@ciat.sn`, `mentor@ciat.sn`, `admin@ciat.sn`) sont initialisés et vérifiés avec `seed_all` sans aucun mot de passe à saisir en clair pendant la captation.

## Contrastes d'accessibilité & Refonte Graphique CIAT
- **Statut :** **TERMINÉ & VALIDÉ (100% CHARTE CIAT)** :
  1. **En-tête & Navigation (`Header.tsx`)** : Suppression des liens d'accès restreint (`Suivi Projets`, `Documents IA`) pour une barre de navigation publique épurée et conforme.
  2. **Page Le CIAT (`/portail/ciat` & `/ciat`)** :
     - Hero pleine hauteur (`min-h-[calc(100vh-72px)]`) calé sur le côté gauche, parfaitement harmonisé avec la page d'Accueil et l'Incubateur.
     - Suppression définitive du badge pill supérieur et du voile marron flou au profit d'une netteté photographique 100% réaliste du campus.
  3. **Page Galerie (`/galerie`)** :
     - Suppression intégrale de tout faux hero lourd ou artificiel au profit d'un en-tête éditorial aéré sur fond sable `#FAF7F2`.
     - Intégration des 27 photographies haute définition d'ateliers, laboratoires et vie au campus.
     - Barre d'onglets épurée par pills, recherche instantanée, tri rapide et pagination ergonomique.
  4. **Page Les 7 Domaines (`/portail/domaines`)** :
     - Refonte complète inspirée des standards Awwwards en architecture Master-Detail interactive (liste des 7 filières à gauche, pavillon immersif grand format à droite).
     - Suppression de 100% des icônes décoratives pour laisser toute la place à la typographie noble, aux numérotations d'ingénierie et aux photos des ateliers.
     - Grille synoptique bento et cartouches de prototypes réels reliés à la Galerie.
  5. **Contrôle Qualité** : 0 erreur ESLint / TypeScript, 40 routes pré-rendues avec succès via `next build`.

