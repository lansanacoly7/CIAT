# Kit de Communication & Supports Institutionnels CIAT 360 (Phase 3 — T3)

> **Projet :** Centre d'Innovation, d'Application et de Transfert (CIAT) — ISEP Diamniadio  
> **Auteur / Lead :** El Hadji Massogui Diop (Front-end & Conception)  
> **Date de livraison :** 26 octobre 2026  
> **Conformité :** Charte Graphique Écosystème CIAT 360 (v1.0), Couleurs officielles, Typographies Montserrat & Inter  

---

## 1. Inventaire des Livrables de Communication

Tous les livrables sont générés à partir de sources HTML/CSS fidèles et modulaires, puis compilés en images haute définition via un script reproductible.

| Nom de la pièce | Type & Format | Dimensions | Fichier exporté | Fichier source |
| :--- | :--- | :---: | :--- | :--- |
| **Affiche officielle de lancement** | Affiche A4 (PNG) | 1240 × 1754 px | [`affiche_ciat_a4.png`](affiche_ciat_a4.png) *(~228 Ko)* | [`sources/affiche_a4.html`](sources/affiche_a4.html) |
| **Affiche officielle de lancement (PDF)** | Document Print (PDF) | Format A4 | [`affiche_ciat_a4.pdf`](affiche_ciat_a4.pdf) *(~637 Ko)* | [`sources/affiche_a4.html`](sources/affiche_a4.html) |
| **Post Réseaux 1 — Lancement plateforme** | Carré Social (PNG) | 1080 × 1080 px | [`post_1_lancement.png`](post_1_lancement.png) *(~179 Ko)* | [`sources/post_1_lancement.html`](sources/post_1_lancement.html) |
| **Post Réseaux 2 — Appel à projets & Incubateur** | Carré Social (PNG) | 1080 × 1080 px | [`post_2_incubation.png`](post_2_incubation.png) *(~98 Ko)* | [`sources/post_2_incubation.html`](sources/post_2_incubation.html) |
| **Post Réseaux 3 — Galerie & QR Code** | Carré Social (PNG) | 1080 × 1080 px | [`post_3_galerie.png`](post_3_galerie.png) *(~78 Ko)* | [`sources/post_3_galerie.html`](sources/post_3_galerie.html) |
| **Bannière de partage officielle** | Format OpenGraph (PNG) | 1200 × 630 px | [`banniere_ciat_1200x630.png`](banniere_ciat_1200x630.png) *(~475 Ko)* | [`sources/banniere_partage.html`](sources/banniere_partage.html) |

---

## 2. Règle de Performance et d'Optimisation (< 500 Ko)

Conformément à la directive d'équipe imposée par Lansana, **100 % des images matricielles PNG du kit respectent rigoureusement la limite des 500 Ko maximum** :
- `affiche_ciat_a4.png` : 228 Ko (qualité d'impression préservée)
- `post_1_lancement.png` : 179 Ko
- `post_2_incubation.png` : 98 Ko
- `post_3_galerie.png` : 78 Ko
- `banniere_ciat_1200x630.png` : 475 Ko

---

## 3. Identité Visuelle & Contenus Véritables

- **Couleurs officielles appliquées :**
  - Brun Nuit : `#24140D` (ancrage institutionnel et lisibilité maximale)
  - Brun CIAT : `#5A3A22` / `#602D10` (rigueur académique)
  - Ocre Doré : `#D4AA70` / `#C99A68` (mentorat & éclosion)
  - Sable Doux : `#FAF7F2` (fond chaleureux)
- **Typographies :** Montserrat (titres percutants) et Inter (textes de corps et légendes).
- **Photographie authentique :** Cliché officiel du campus de l'ISEP Diamniadio (`assets/campus-isep.png`, 217 Ko).
- **QR Code certifié :** Code ISO/IEC 18004 généré dynamiquement et pointant vers la Galerie publique des innovations (`assets/qr_galerie.png`).
- **Exactitude des contenus :** Aucun chiffre inventé. Le message se concentre sur les missions réelles de l'incubateur, l'évaluation collégiale par le comité et l'accompagnement par des mentors.

---

## 4. Procédure de Régénération Automatisée

Pour modifier ou régénérer l'intégralité des visuels et du PDF :
```bash
node scripts/communication.mjs
```

Le script détecte automatiquement Playwright ou l'exécutable Chrome Headless de l'environnement, génère les fichiers et applique l'optimisation adaptative.
