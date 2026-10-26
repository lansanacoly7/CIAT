# Rapport d'Audit & Défauts Mobiles (390 px) — CIAT

> **Contexte :** Réalisé dans le cadre de la Phase 3 (Maimouna, T3).  
> Conformément aux consignes de travail :
> - Les pages sous ma responsabilité directe (`/incubateur`, `/incubateur/projets/[id]`, `/compte`) ont été directement optimisées et corrigées sur mobile.
> - Pour les pages relevant des autres membres de l'équipe (Alioune, Massogui, Pathé), les défauts constatés lors de la génération des maquettes mobiles (390 × 844 px) sont listés ci-dessous avec leur page d'origine et le responsable suggéré, **sans modification non concertée de leur code**.

---

## 1. Pages de Maimouna (Vérifiées et conformes sur mobile)

| Page | URL | Statut Mobile (390 px) | Correctifs apportés |
| :--- | :--- | :---: | :--- |
| **Dépôt de dossier** | `/incubateur` | **Conforme** | Stepper compact avec barre continue de progression, passage en 1 colonne des champs, cartes de dépôt directes adaptées au tactile, boutons min-h 48px, encart d'aide replié/intégré en bas. |
| **Suivi d'un projet & Bilans** | `/incubateur/projets/[id]` | **Conforme** | Formulaire de bilan à 3/6 mois empilé verticalement, bouton d'export Excel pleine largeur, absence de débordement horizontal. |
| **Mon Compte** | `/compte` | **Conforme** | Formulaire de profil et listes de projets en carte unique fluide, labels accessibles. |

---

## 2. Défauts constatés sur les pages des autres modules (Pour information et correction par leurs auteurs)

### A. Tableau de bord & Analytics (`/tableau-de-bord`) — *Responsable : Alioune*
- **Symptôme :** Les graphiques analytiques (Recharts) ont une largeur fixe sur certains conteneurs et déclenchent un léger défilement horizontal résiduel sur mobile.
- **Impact utilisateur :** L'utilisateur doit faire défiler horizontalement pour voir la légende complète des graphiques en barres.
- **Recommandation :** Encapsuler les graphiques dans un composant `<ResponsiveContainer width="100%" height={260}>` et empiler les filtres de cohortes en menu déroulant sur écran `< 640px`.

### B. Évaluation du comité (`/incubateur/evaluation`) — *Responsable : Équipe Incubateur / Comité*
- **Symptôme :** La grille de notation avec curseurs numériques et tableau comparatif des critères dépasse 390 px de large.
- **Impact utilisateur :** Les libellés des critères d'évaluation sont tronqués sur mobile si l'on ne zoome pas.
- **Recommandation :** Remplacer l'affichage tableau par un affichage en cartes verticales (1 carte par critère avec son curseur de note de 1 à 10 et commentaire direct).

### C. Assistant IA conversationnel (`/assistant`) — *Responsable : Massogui*
- **Symptôme :** La zone de saisie du message en bas de l'écran entre en conflit avec la barre de navigation mobile fixe (`fixed bottom-0`).
- **Impact utilisateur :** Le champ de saisie du prompt est masqué ou difficilement cliquable lorsque la barre de navigation tactile inférieure est active.
- **Recommandation :** Ajouter une marge basse `pb-20` (ou `mb-16`) sur le conteneur du chat pour que l'input reste toujours dégagé au-dessus de la barre de navigation.

### D. Navigation mobile globale (`Header.tsx` - Barre inférieure)
- **Symptôme :** Les 5 icônes de la barre inférieure (`Accueil`, `Le CIAT`, `Incubateur`, `Domaines`, `Espace`) sont très serrées sur les téléphones de moins de 375 px (ex: iPhone SE / 320 px).
- **Impact utilisateur :** Risque de clic erroné entre deux onglets voisins.
- **Recommandation :** Réduire la taille de police des labels de `text-xs` à `text-[10px]` ou masquer les libellés texte sur les très petits écrans pour ne garder que l'icône avec tooltip accessible.

---

## Conclusion
Le parcours principal du porteur de projet et les modules de la Phase 3 sont 100 % opérationnels et ergonomiques sur écran mobile. Les points listés ci-dessus pour les autres modules constituent la feuille de route idéale pour la finalisation d'équipe avant livraison finale.
