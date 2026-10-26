# Audit de Cohérence Visuelle & Finition d'Interface (Phase 4 — T3)

> **Projet :** Plateforme Numérique du CIAT — ISEP Diamniadio  
> **Lead Front-end & Design :** El Hadji Massogui Diop  
> **Date de livraison :** 26 octobre 2026  
> **Cadre méthodologique :** Conforme aux directives du document `Master.md` (sobriété institutionnelle, authenticité, zéro artifice superflu, accessibilité universelle).

---

## 1. Objectif & Principes Directeurs

Cet audit vise à garantir que l'ensemble de la plateforme CIAT présente une harmonie visuelle rigoureuse et une ergonomie irréprochable sur l'ensemble des parcours utilisateurs :
- **Palette officielle :** Brun Nuit (`#24140D`), Brun CIAT (`#612D10`), Ocre Doré (`#C99A68` / `#D4AA70`), Sable Doux (`#FAF7F2`), Lin Bordure (`#EFE4D6`).
- **Interdiction formelle :** Jamais de texte blanc sur fond beige ou doré (contraste minimum 4.5:1 garanti).
- **Zones tactiles mobiles :** Cibles de clic et de toucher d'au moins **44 × 44 px** sur tous les éléments interactifs.
- **Micro-interactions sobres :** Pas d'animations spectaculaires qui gênent la lecture ; désactivation native sous `prefers-reduced-motion`.

---

## 2. Synthèse des Écarts Identifiés & Plan d'Action

Conformément à la consigne de Lansana :
- **Pages sous la responsabilité de Massogui :** Toutes les finitions et corrections ont été immédiatement appliquées dans le code.
- **Pages des autres modules :** Les écarts sont rigoureusement répertoriés ci-dessous avec la solution préconisée, **sans modification destructive unilatérale**, afin de laisser chaque développeur responsable intégrer les correctifs.

---

### Tableau Récapitulatif des Pages & Modules

| Module / Page | Responsable | Statut Visuel | Écart constaté | Correction proposée / Réalisée |
| :--- | :--- | :---: | :--- | :--- |
| **Accueil (`/`)** | Massogui | **Conforme (100%)** | Aucun | Photo campus cadrée, typographie hiérarchisée, zéro défilement horizontal. |
| **Portail public (`/portail`)** | Massogui | **Conforme (100%)** | Aucun | Cartes de lin douces, survol ocre, chargement squelette `loading.tsx` actif. |
| **Galerie publique (`/galerie`)** | Massogui | **Conforme (100%)** | Aucun | Filtres 44px, QR code téléchargeable, badge de niveau d'avancement officiel. |
| **Détail innovation (`/galerie/[slug]`)** | Massogui | **Conforme (100%)** | Aucun | Page de repli 404 intégrée en cas de fiche non publiée, médias en grille sobre. |
| **Assistant IA (`/assistant`)** | Massogui | **Conforme (100%)** | Aucun | Sélecteur de mode 44px, citations de sources encadrées, refus poli sans crash. |
| **Pages Légales & Erreur** | Massogui | **Conforme (100%)** | Aucun | Mentions d'éthique IA explicites, page 404 institutionnelle, `error.tsx` résilient. |
| **Incubateur — Dépôt (`/incubateur`)** | Maimouna / Kalz | *À harmoniser* | Boutons d'action avec rayon de courbure variable (`rounded-lg` vs `rounded-xl`). | Aligner sur le composant centralisé `Button` de `@/components/ui`. |
| **Incubateur — Alertes (`/incubateur/alertes`)** | Maimouna / Kalz | *À harmoniser* | Alertes de retard utilisant un rouge vif externe non rattaché au token `--color-erreur`. | Utiliser `Badge tone="erreur"` et `border-erreur/40` de `ui.tsx`. |
| **Comité — Évaluation (`/incubateur/evaluation`)** | Maimouna / Kalz | *À harmoniser* | Grille de notation dense sur mobile avec risque de débordement tactile. | Augmenter l'espacement vertical et adopter `min-h-[44px]` sur les curseurs/notes. |
| **Documents IA (`/documents`)** | Pathé | *À harmoniser* | Modale de création wizard comportant quelques labels sans balise `<label htmlFor>`. | Envelopper les champs de saisie dans `FormField` de `@/components/ui`. |
| **Tableau de Bord (`/tableau-de-bord`)** | Alioune | *À harmoniser* | Boutons d'export Excel/PDF stylisés de manière ad-hoc dans `ExportToolbar.tsx`. | Réutiliser `Button variant="secondary"` pour uniformiser la barre d'outils. |

---

## 3. Détail des Finitions Appliquées sur les Pages de Massogui

1. **Uniformisation des rayons de courbure :**
   - Harmonisation générale à `rounded-2xl` (16px) pour les grandes cartes d'information et `rounded-xl` (12px) pour les boutons et contrôles.
2. **Accessibilité mobile et contrastes :**
   - Toutes les étiquettes et badges dorés portent du texte sombre `--color-primary-dark` (`#24140D`), sans aucune exception de texte blanc.
   - Hauteur tactile minimale de 44 px validée sur tous les champs de filtres et boutons de pagination.
3. **États vides et d'erreur enrichis :**
   - La recherche sans résultat dans la galerie affiche un `EmptyState` accueillant invitant à réinitialiser les filtres.
   - Les indisponibilités du serveur affichent l'`ApiErrorBanner` avec déclencheur de reconnexion transparent.

---

## 4. Consolidation du Fichier `frontend/src/components/ui.tsx`

Le fichier [`frontend/src/components/ui.tsx`](../frontend/src/components/ui.tsx) a été enrichi pour servir de référence unique à l'ensemble des développeurs de l'équipe :
- **Documentation d'en-tête complète** : guide d'emploi par composant et variante.
- **Nouveaux composants génériques prêts à l'emploi :**
  - `FormField` : conteneur de champ avec libellé, indicateur d'obligation `*`, texte d'aide et message d'erreur `role="alert"`.
  - `Input`, `Select`, `Textarea` : contrôles de saisie 44px avec bordure Lin et focus anneau ocre.
  - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` : structure tabulaire responsive.
  - `EmptyState` : composant d'état vide réutilisable avec icône douce et bouton d'action.
- **Respect du confort visuel (`motion-reduce`) :**
  - Ajout des modificateurs Tailwind `motion-reduce:transition-none motion-reduce:animate-none` pour respecter les réglages système d'accessibilité cognitive.
