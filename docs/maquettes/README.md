# Maquettes et Parcours Utilisateurs — CIAT (Centre d'Innovation, d'Application et de Transfert)

Ce dossier rassemble les **captures d'écran officielles** du parcours principal de l'application CIAT, réalisées dans le cadre du **livrable obligatoire T3 (Phase 3 — Maimouna)**.

Toutes les captures sont générées directement à partir du code de production et du jeu de données de démonstration (`seed_demo` / `seed_all`) via le script automatisé Playwright :
```bash
node scripts/captures.mjs
```

---

## 📱 Formats d'affichage capturés

| Format | Résolution | Ratio | Usage |
| :--- | :---: | :---: | :--- |
| **Ordinateur (Desktop)** | **1440 × 900 px** | 16:10 | Affichage poste de travail et grand écran |
| **Téléphone (Mobile)** | **390 × 844 px** | iPhone 12/13/14 | Affichage tactile mobile |

---

## 🗂️ Inventaire des 13 parcours capturés

### 1. Accueil & Portail Public
- **Ordinateur :** [`01_accueil_desktop.png`](01_accueil_desktop.png)
- **Téléphone :** [`01_accueil_mobile.png`](01_accueil_mobile.png)
- **Description :** Vitrine institutionnelle du CIAT, mise en valeur des 7 domaines d'intervention, appels à projets et accès direct aux modules.

### 2. Présentation du CIAT
- **Ordinateur :** [`02_portail_ciat_desktop.png`](02_portail_ciat_desktop.png)
- **Téléphone :** [`02_portail_ciat_mobile.png`](02_portail_ciat_mobile.png)
- **Description :** Présentation détaillée de la mission de l'ISEP Amadou Trawaré de Diamniadio, gouvernance et ateliers technologiques.

### 3. Connexion
- **Ordinateur :** [`03_connexion_desktop.png`](03_connexion_desktop.png)
- **Téléphone :** [`03_connexion_mobile.png`](03_connexion_mobile.png)
- **Description :** Interface d'authentification JWT sécurisée avec disposition en deux panneaux (visuel marque + formulaire).

### 4. Inscription
- **Ordinateur :** [`04_inscription_desktop.png`](04_inscription_desktop.png)
- **Téléphone :** [`04_inscription_mobile.png`](04_inscription_mobile.png)
- **Description :** Création de compte porteur de projet avec formulaire qualifié (nom, organisation, téléphone, genre).

### 5. Dépôt de dossier (Porteur de projet) — *Refonte Phase 3*
- **Ordinateur :** [`05_depot_dossier_desktop.png`](05_depot_dossier_desktop.png)
- **Téléphone :** [`05_depot_dossier_mobile.png`](05_depot_dossier_mobile.png)
- **Description :** Parcours de candidature en 3 étapes (Informations, Pièces justificatives, Récapitulatif). Mise en page 2/3 - 1/3 sur desktop avec guide d'aide contextuelle, stepper responsive avec jauge sur mobile, cartes de dépôt directes par pièce obligatoire, confirmation de brouillon en temps réel.

### 6. Évaluation du comité de sélection
- **Ordinateur :** [`06_evaluation_comite_desktop.png`](06_evaluation_comite_desktop.png)
- **Téléphone :** [`06_evaluation_comite_mobile.png`](06_evaluation_comite_mobile.png)
- **Description :** Grille d'évaluation multicritères pour les membres du comité (note sur pertinence, faisabilité, équipe, budget et avis motivé).

### 7. Générateur de documents IA
- **Ordinateur :** [`07_documents_ia_desktop.png`](07_documents_ia_desktop.png)
- **Téléphone :** [`07_documents_ia_mobile.png`](07_documents_ia_mobile.png)
- **Description :** Assistant de rédaction assistée par IA générative pour les porteurs et coordonnateurs (fiches projets, synthèses, bilans).

### 8. Suivi des projets incubés
- **Ordinateur :** [`08_suivi_projets_desktop.png`](08_suivi_projets_desktop.png)
- **Téléphone :** [`08_suivi_projets_mobile.png`](08_suivi_projets_mobile.png)
- **Description :** Vue d'ensemble du portefeuille de projets en incubation, filtres par domaine, statut et cohorte.

### 9. Détail de suivi d'un projet & Bilans (3 et 6 mois) — *Livrable T1*
- **Ordinateur :** [`09_suivi_projet_detail_desktop.png`](09_suivi_projet_detail_desktop.png)
- **Téléphone :** [`09_suivi_projet_detail_mobile.png`](09_suivi_projet_detail_mobile.png)
- **Description :** Écran de pilotage individuel : jalons, preuves, bilans périodiques à 3 et 6 mois et export Excel (`.xlsx`) du compte rendu d'avancement.

### 10. Galerie des innovations
- **Ordinateur :** [`10_galerie_desktop.png`](10_galerie_desktop.png)
- **Téléphone :** [`10_galerie_mobile.png`](10_galerie_mobile.png)
- **Description :** Vitrine publique des prototypes et innovations issus des cohortes d'incubation du CIAT.

### 11. Tableau de bord & Décisionnel — Coordonnateur
- **Ordinateur :** [`11_tableau_de_bord_desktop.png`](11_tableau_de_bord_desktop.png)
- **Téléphone :** [`11_tableau_de_bord_mobile.png`](11_tableau_de_bord_mobile.png)
- **Description :** KPIs clés de l'incubateur (taux de sélection, parité, répartition par domaine) et graphiques analytiques.

### 12. Assistant IA conversationnel
- **Ordinateur :** [`12_assistant_desktop.png`](12_assistant_desktop.png)
- **Téléphone :** [`12_assistant_mobile.png`](12_assistant_mobile.png)
- **Description :** Chatbot spécialisé pour l'orientation des porteurs de projet et la recherche contextuelle dans les documents du CIAT.

### 13. Espace « Mon compte » — *Livrable T2*
- **Ordinateur :** [`13_mon_compte_desktop.png`](13_mon_compte_desktop.png)
- **Téléphone :** [`13_mon_compte_mobile.png`](13_mon_compte_mobile.png)
- **Description :** Consultation et mise à jour du profil utilisateur (nom, téléphone, organisation, genre) et consultation des projets/dossiers associés.

---

## 🔄 Régénération des captures

Pour régénérer l'ensemble des maquettes après une modification :
1. Démarrer le serveur backend : `py -3.10 manage.py runserver 8000` (avec la base de démo `seed_demo`).
2. Démarrer le frontend : `npm run dev` (port 3000).
3. Lancer la commande :
   ```bash
   node scripts/captures.mjs
   ```
