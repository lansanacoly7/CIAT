# Maquettes et Écrans — Espace Candidat & Porteur de Projet (Maimouna)

Ce dossier rassemble les **captures d'écran actuelles et nettoyées** de toutes les pages sous la responsabilité de **Maimouna** sur la branche `dev-maimouna`.

Toutes les captures ont été générées en direct depuis le serveur Next.js en cours d'exécution avec authentification réelle JWT porteur via Playwright :
```bash
node scripts/capture_pages_maimouna.mjs
```

---

## 📱 Formats d'affichage capturés

| Format | Résolution | Ratio | Usage |
| :--- | :---: | :---: | :--- |
| **Ordinateur (Desktop)** | **1440 × 900 px** | 16:10 | Affichage poste de travail et grand écran |
| **Téléphone (Mobile)** | **390 × 844 px** | iPhone 12/13/14 | Affichage tactile mobile |

---

## 🗂️ Inventaire officiel des 6 pages de Maimouna

### 1. Dépôt de candidature (Incubateur)
- **URL :** `/incubateur`
- **Fichiers captures :**
  - Desktop : [`01_depot_candidature_desktop.png`](01_depot_candidature_desktop.png)
  - Mobile : [`01_depot_candidature_mobile.png`](01_depot_candidature_mobile.png)
- **Rôle :** Parcours de soumission de candidature en 3 étapes (Informations projet, Pièces justificatives avec téléversement et jauge, Récapitulatif et soumission officielle).

### 2. Suivi de mes projets (Liste)
- **URL :** `/incubateur/projets`
- **Fichiers captures :**
  - Desktop : [`02_suivi_projets_desktop.png`](02_suivi_projets_desktop.png)
  - Mobile : [`02_suivi_projets_mobile.png`](02_suivi_projets_mobile.png)
- **Rôle :** Tableau de bord et portefeuille des projets en incubation du porteur avec statut, avancement global, cohortes, filtres et accès direct aux fiches détaillées.

### 3. Fiche détaillée d'un projet & Suivi / Bilans
- **URL :** `/incubateur/projets/[id]` (ex: `/incubateur/projets/67`)
- **Fichiers captures :**
  - Desktop : [`03_projet_detail_desktop.png`](03_projet_detail_desktop.png)
  - Mobile : [`03_projet_detail_mobile.png`](03_projet_detail_mobile.png)
- **Rôle :** Pilotage individuel du projet : suivi des objectifs, jalons avec dépôt de preuves, gestion des mentors, bilans périodiques à 3 et 6 mois, exports de compte rendu Excel et PDF.

### 4. Alertes de retard
- **URL :** `/incubateur/alertes`
- **Fichiers captures :**
  - Desktop : [`04_alertes_retard_desktop.png`](04_alertes_retard_desktop.png)
  - Mobile : [`04_alertes_retard_mobile.png`](04_alertes_retard_mobile.png)
- **Rôle :** Centre de notification et d'alertes des jalons en retard ou à échéance critique avec tri par sévérité et accès direct au projet concerné.

### 5. Mon profil & Compte
- **URL :** `/compte`
- **Fichiers captures :**
  - Desktop : [`05_mon_compte_desktop.png`](05_mon_compte_desktop.png)
  - Mobile : [`05_mon_compte_mobile.png`](05_mon_compte_mobile.png)
- **Rôle :** Gestion des informations personnelles du porteur (nom, prénom, organisation, téléphone, genre), sécurité du compte et récapitulatif de ses dossiers de candidature.

### 6. Assistant IA du CIAT
- **URL :** `/assistant`
- **Fichiers captures :**
  - Desktop : [`06_assistant_ia_desktop.png`](06_assistant_ia_desktop.png)
  - Mobile : [`06_assistant_ia_mobile.png`](06_assistant_ia_mobile.png)
- **Rôle :** Espace conversationnel intelligent avec recherche documentaire officielle CIAT, atelier de rédaction assistée, et volet d'historique dépliable/repliable à droite.
