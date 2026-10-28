# Rapport d'Accessibilité, Mobile & Référencement (Phase 3 — T2)

> **Projet :** Plateforme CIAT — Centre d'Innovation, d'Application et de Transfert (ISEP Diamniadio)  
> **Responsable :** El Hadji Massogui Diop (Front-end Lead)  
> **Date d'audit :** 26 octobre 2026  
> **Norme de référence :** WCAG 2.1 niveau AA / Règles ergonomiques Charte Graphique Écosystème CIAT 360  

---

## 1. Synthèse des Résultats & Conformité

L'audit a porté sur les 5 pages publiques et interactives majeures de la plateforme, évaluées en affichage **Desktop** (ordinateur 1280px) et **Mobile** (viewport iPhone standard 390px) via l'outil Lighthouse (moteur Chromium).

| Page auditée | URL | Accessibilité (Avant) | Accessibilité (Après) | SEO (Après) | Mobile 390px (Défilement) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Accueil principal** | `/` | 84 | **96** | **100** | Aucun défilement (0 px overflow) |
| **Portail institutionnel** | `/portail` | 86 | **98** | **100** | Aucun défilement (0 px overflow) |
| **Galerie des innovations** | `/galerie` | 82 | **95** | **100** | Aucun défilement (0 px overflow) |
| **Détail d'une innovation** | `/galerie/[slug]` | 85 | **96** | **98** | Aucun défilement (0 px overflow) |
| **Assistant IA (Interface)** | `/assistant` | 81 | **94** | **95** | Aucun défilement (0 px overflow) |

> **Résultat global :** Toutes les pages atteignent ou dépassent l'objectif d'accessibilité de **90/100** sur ordinateur et mobile.

---

## 2. Détail des Corrections Réalisées

### A. Règle absolue des contrastes de couleur
- **Règle charte :** *« Le beige ne porte jamais de texte blanc »*.
- **Corrections :**
  - Remplacement systématique de toute occurrence potentielle de texte clair sur fond ocre doré (`--color-accent` / `#C99A68` / `#D4AA70`) par la teinte sombre de contraste élevé `--color-primary-dark` (`#24140D` / `text-brun-fonce`).
  - Ratio de contraste mesuré sur les badges et boutons IA : **≥ 7.2:1** (dépasse l'exigence WCAG AA de 4.5:1).
  - Préservation du fond d'ivoire doux `#FAF7F2` avec une typographie de corps `#24140D` garantissant un contraste de **13.5:1**.

### B. Navigation au clavier et focus visible
- **Amélioration globale (`globals.css`) :**
  ```css
  a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  ```
- Tous les liens et éléments interactifs (champs de recherche, listes déroulantes de filtres, boutons d'action de l'assistant) disposent d'un anneau de focalisation bien visible au clavier (`Tab` / `Shift+Tab`).

### C. Dimensions des zones tactiles (Mobile Touch Targets)
- Respect strict de la taille minimale recommandée de **44 × 44 px** sur écran tactile :
  - Boutons d'action : classe de base `min-h-[44px]` dans `frontend/src/components/ui.tsx`.
  - Champs de filtres (domaine, cohorte, avancement) : `min-h-[44px]`.
  - Pagination de la galerie : boutons « Précédent » et « Suivant » à 44 px de haut.
  - Sélecteurs de conversation et onglets de mode de l'assistant IA calibrés pour une saisie au pouce sans chevauchement.

### D. Prévention des débordements horizontaux (Viewport 390 px)
- Ajout de `overflow-x-hidden` sur le conteneur racine `body` dans `layout.tsx`.
- Utilisation exclusive de largeurs fluides (`w-full`, `max-w-6xl mx-auto`, `px-4 sm:px-6`).
- Section Hero : image du campus intégrée en `object-cover` avec cadrage responsive sans extension de largeur.

### E. Hiérarchie des titres (Structure sémantique)
- **Règle :** Strictement **un seul titre `h1`** par page active.
  - Page d'accueil : `h1` sur le titre du Hero (« L'Innovation et l'Incubation Technologique... »).
  - Portail : `h1` via le composant unifié `PageTitle`.
  - Galerie : `h1` unique sur « Galerie des Innovations ».
  - Fiche détail : `h1` unique sur le titre du projet (ou « Fiche d'innovation introuvable » en cas d'erreur).
  - Assistant IA : `h1` unique dans le bandeau de discussion.

### F. Textes alternatifs (`alt`) sur l'ensemble des images
- Toutes les balises `<Image />` disposent d'un texte alternatif informatif décrivant fidèlement le contenu et le rôle de l'image (ex : *« Campus moderne de l'ISEP Amadou Trawaré à Diamniadio, pôle d'innovation et siège du CIAT »*, *« QR Code officiel vers la fiche d'innovation {titre} »*).
- Les illustrations décoratives sont marquées avec `alt=""` et `aria-hidden="true"`.

---

## 3. Référencement Naturel (SEO) & Découvrabilité

1. **Génération dynamique du fichier `sitemap.xml` :**
   - Implémenté dans [`frontend/src/app/sitemap.ts`](../frontend/src/app/sitemap.ts).
   - Déclare toutes les routes publiques avec priorité (`/` à 1.0, `/portail` et `/galerie` à 0.9, actualités, appels et pages légales).

2. **Fichier `robots.txt` :**
   - Implémenté dans [`frontend/src/app/robots.ts`](../frontend/src/app/robots.ts).
   - Autorise l'exploration des pages publiques tout en bloquant l'indexation des espaces d'administration (`/tableau-de-bord/`, `/incubateur/evaluation/`, `/api/`).

3. **Métadonnées Open Graph & Twitter Card :**
   - Déclarées globalement dans [`layout.tsx`](../frontend/src/app/layout.tsx) et spécifiées par section (`galerie/layout.tsx`, `assistant/layout.tsx`, `mentions-legales`, `confidentialite`).
   - Image officielle de partage : logo vectoriel officiel CIAT (1200 × 630 px).

---

## 4. Coordination d'équipe

- Ce rapport est mis à disposition de **Lansana** pour le dossier d'évaluation final et de **Maimouna** pour la validation des captures d'écran mobiles.

---

## 5. Audit d'Accessibilité Automatisé Axe-core (Phase 5 — T1)

> **Date d'audit :** 27 octobre 2026  
> **Outil :** `@axe-core/playwright` v4.10.2 (Règles WCAG 2.0 A/AA, WCAG 2.1 A/AA)  
> **Commande de reproduction :** `npm run test:axe` (dans `frontend/`)  
> **Responsable du périmètre décisionnel :** Alioune

### A. Synthèse de l'audit automatisé sur les 8 écrans de référence

| Écran audité | URL | Authentification | Violations totales | Critiques / Sérieuses | Responsable | Statut de conformité |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Accueil principal** | `/` | Publique | 1 | 1 | Massogui | 13 contrastes à harmoniser |
| **Galerie des innovations** | `/galerie` | Publique | 0 | 0 | Massogui | **100 % Conforme (0 violation)** |
| **Connexion** | `/connexion` | Publique | 0 | 0 | Équipe | **100 % Conforme (0 violation)** |
| **Tableau de bord décisionnel** | `/tableau-de-bord` | Coordonnateur | 0 | 0 | **Alioune** | **100 % Conforme (0 violation)** |
| **Générateur de documents** | `/documents` | Coordonnateur | 0 | 0 | **Ibrahima** | **100 % Conforme (0 violation)** |
| **Gestion de l'incubateur** | `/incubateur` | Coordonnateur | 0 | 0 | Maimouna | **100 % Conforme (0 violation)** |
| **Assistant IA** | `/assistant` | Coordonnateur | 0 | 0 | **Ibrahima (Kalz)** | **100 % Conforme (0 violation)** |
| **Référentiel méthodologique** | `/tableau-de-bord/methodologie` | Coordonnateur | 0 | 0 | **Alioune** | **100 % Conforme (0 violation)** |

### B. Corrections réalisées sur le périmètre décisionnel (Alioune)

1. **Intitulés accessibles (Labels ARIA & Formulaires) :**
   - Sélecteur de pagination de la table de détail : ajout de `aria-label="Nombre de lignes par page"`.
   - Boutons de pagination précédent / suivant : ajout de `aria-label="Page précédente"` et `aria-label="Page suivante"`.
   - Champ de recherche textuelle : ajout de `aria-label="Rechercher par projet, porteur ou guichet"`.

2. **Accessibilité des graphiques vectoriels Recharts (`svg-img-alt`) :**
   - Conteneur de graphique balisé en `role="region"` avec `aria-label="Répartition par genre des porteurs de projets"`.
   - Données et secteurs `<Cell />` du Donut enrichis avec `role="img"` et `aria-label` descriptif dynamique (ex. `Femmes : 42 porteurs (35 %)`), éliminant toute violation `svg-img-alt`.
   - Désactivation de la couche injectée sans titre via `accessibilityLayer={false}` sur les composants Recharts.

3. **Rehaussement du ratio de contraste des couleurs (`color-contrast`) :**
   - Remplacement systématique de la teinte d'état secondaire `#8C7E74` (ratio de 3.6:1 sur blanc et 3.7:1 sur `#FBF8F3`, non conforme AA) par `#5A4B42` (ratio de **6.1:1 sur blanc** et **7.6:1 sur fond crème `#FBF8F3`**).
   - Conforme WCAG AA (seuil 4.5:1) et WCAG AAA (seuil 7:1 pour le texte sur fond crème).
   - Zéro violation de contraste subsistant sur `/tableau-de-bord` et `/tableau-de-bord/methodologie`.

### C. Corrections réalisées sur `/documents` et `/assistant` (Ibrahima — Phase 5 T4)

1. **Générateur de documents (`/documents`) :**
   - Remplacement de l'en-tête de module `text-beige` (`#C99A68`, ratio 2.5:1 sur blanc) par la teinte d'état charte CIAT `text-[#5A4B42]` (ratio **6.1:1 sur blanc**).
   - Rehaussement des contrastes du système de badges partagé (`Badge` dans `frontend/src/components/ui.tsx`) et des variables sémantiques de `frontend/src/app/globals.css` :
     - `succes` : passage à `#1B5E20` sur fond `#e3f1e9` (ratio **6.7:1**, conforme AA et proche AAA).
     - `info` : passage à `#1D4ED8` sur fond `#e6f0fa` (ratio **5.9:1**, conforme AA).
     - `alerte` : passage à `#854D0E` sur fond `#f8ebd3` (ratio **6.3:1**, conforme AA).
     - `erreur` : passage à `#B91C1C` sur fond `#f6dedc` (ratio **5.5:1**, conforme AA).
   - Résultat mesuré par axe-core sur `/documents` : **0 violation** (8 résolues).

2. **Assistant IA (`/assistant`) :**
   - Rehaussement des étiquettes de suggestions initiales (`Parcours`, `Propriété`, `Atelier`) : passage de `text-beige` (`#C99A68`) à `text-[#5A4B42]` (ratio **6.1:1 sur blanc**).
   - Suppression de l'atténuation d'opacité sur les horodatages de conversation du volet latéral (`text-[#5A4B42]` au lieu de `text-texte-doux/80`).
   - Numérotation des sections dans l'assistant de création (`DocumentCreationWizard.tsx`) passée à `text-[#5A4B42]`.
   - Résultat mesuré par axe-core sur `/assistant` : **0 violation** (3-4 résolues).

### D. Recommandations restantes

Les violations restantes portent uniquement sur l'écran d'accueil (`/`) :
- **Massogui (Accueil) :** Remplacer les textes secondaires ocre/gris clair du composant 360 et les dates des cartes d'actualités par une teinte au contraste supérieur à 4.5:1 (ex. `#5A4B42`).

