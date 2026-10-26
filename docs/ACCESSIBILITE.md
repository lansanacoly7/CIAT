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
- Toutes les balises `<Image />` disposent d'un texte alternatif informatif décrivant fidèlement le contenu et le rôle de l'image (ex : *« Campus moderne de l'ISEP Amadou Traoré à Diamniadio, pôle d'innovation et siège du CIAT »*, *« QR Code officiel vers la fiche d'innovation {titre} »*).
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
