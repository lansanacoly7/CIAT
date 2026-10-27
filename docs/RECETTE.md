# Rapport de Recette Complète du Parcours de Démonstration (Phase 5 — T3)

> **Projet :** Plateforme Numérique du Centre d'Innovation, d'Application et de Transfert (CIAT)  
> **Établissement :** Institut Supérieur d'Enseignement Professionnel (ISEP) Amadou Trawaré de Diamniadio  
> **Auteur & Rôle :** Lansana Coly (Lead Technique & Correcteur Qualité / QA)  
> **Date de recette :** 27 octobre 2026  
> **Branche Git :** `dev-lansana-coly` (synchronisée sur `origin/test` au commit `6eaa529`)  
> **Périmètre exécuté :** Déroulé complet de `docs/DEMO.md` (Étapes 1 à 8), tests multi-écrans (Ordinateur 1280×800 px et Téléphone 390×844 px), suite E2E Playwright, tests réels des 3 fonctions d'IA avec clés `.env`, et suite de non-régression Django (265 tests).  
> **Avertissement de conformité :** La plateforme n'est **pas déployée en production**. Les données sont **fictives** et générées localement par `python manage.py seed_all`.

---

## 1. Synthèse Exécutive de la Recette

En tant que lead technique jouant le rôle de correcteur rigoureux avant la remise finale, l'ensemble des 8 étapes du script officiel de démonstration (`docs/DEMO.md`) a été audité de manière exhaustive sur deux environnements d'affichage :
1. **Version Ordinateur (Desktop) :** Viewport 1280 × 800 px.
2. **Version Téléphone (Mobile) :** Viewport 390 × 844 px (résolution de référence iPhone 12/13/14).

### Résultats globaux en un coup d'œil :
* **Tests unitaires et d'intégration Django :** **265 / 265 réussis** (`python manage.py test apps`, durée 46.8 s).
* **Suite de tests Playwright E2E :** **6 / 6 réussis** (`auth.spec.ts`, `dashboard.spec.ts`, `galerie.spec.ts`, durée 1.1 min).
* **Fonctions d'Intelligence Artificielle (.env réelles) :** **3 / 3 opérationnelles** (Assistant IA RAG, Documents IA, Interrogation Analytics en langage naturel).
* **Conformité orthographique institutionnelle :** **100 % conforme** (« ISEP Amadou Trawaré de Diamniadio » — aucune ancienne occurrence « Traoré » restante).
* **Intégrité de l'encodage UTF-8 :** **0 anomalie** (`é`, `è`, `à`, `« »` intacts, aucun artefact `Ã©` ou mojibake détecté).
* **Langue de l'interface :** **100 % français** (aucun terme parasite en anglais sur les écrans du parcours).
* **Constats relevés :** 8 constats documentés (3 corrigés immédiatement par Lansana, 5 consignés pour les responsables concernés).

---

## 2. Tableau des Constats de Recette

| # | Écran / Parcours | Rôle testé | Appareil | Constat précis | Gravité | Statut | Responsable assigné |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C1** | **Étape 1 — Galerie** (`/galerie/[slug]`) | Public (Anonyme) | Ordinateur & Téléphone | **Typo d'URL dans DEMO.md** : le lien vers le projet phare pointait vers `sunuagri-ai-detection-des-maladies-maracheres-des-niayes` (manquait le `i`), provoquant une erreur 404 lors du test de l'étape 1. Le slug réel généré en base est `maraicheres`. | Moyenne | **Corrigé par Lansana** (URL rectifiée dans `docs/DEMO.md:103`) | Lansana Coly |
| **C2** | **Étape 1 — Accueil** (`/`) | Public (Anonyme) | Ordinateur & Téléphone | **Ancienne orthographe résiduelle** : mention de « ISEP AMADOU TRAORÉ » sur le badge bas de page au lieu de l'orthographe officielle « TRAWARÉ ». | Mineure | **Corrigé par Lansana** (`frontend/src/app/page.tsx:206`) | Lansana Coly |
| **C3** | **Étape 3 — Évaluation** (`/incubateur/evaluation`) | Membre Comité | Ordinateur & Téléphone | **Orthographe porteur12 dans les données de test** : le nom de famille de `porteur12@demo.ciat.sn` persistait en « Traoré » dans la base SQLite si la base avait été initialisée avant la mise à jour de `seed_demo.py`. | Mineure | **Corrigé par Lansana** (Ajout de la synchronisation des noms existants dans `seed_demo.py` + ré-exécution `seed_all`) | Lansana Coly |
| **C4** | **Étape 6 — Documents IA** (`/documents`) | Coordonnateur / Admin | Ordinateur (1280 px) | **Débordement horizontal (Overflow 1359 px)** : sur écran ordinateur, la page subit un débordement (`scrollWidth = 1359 px > 1280 px`). Cause : cumul de `DashboardSidebar` (injecté par `AppShell` pour les rôles staff) ET de `AppSidebarLayout` (propre au module documents), ajoutant deux marges de 256 px (`lg:pl-64`). | Majeure | **À traiter par Alioune & Maimouna** (harmoniser la condition dans `AppShell` pour désactiver `DashboardSidebar` si `AppSidebarLayout` est présent) | Alioune (Dashboard) & Maimouna (Incubateur) |
| **C5** | **Étape 1 — Galerie** (`/galerie`) | Public (Anonyme) | Téléphone (390 px) | **Chargement différé des visuels en bas de liste** : sur mobile, 3 images parmi les 11 fiches affichent `naturalWidth = 0` avant le premier défilement de l'utilisateur en raison de l'attribut natif `loading="lazy"` dans un conteneur vertical compact. | Mineure | **À traiter par Massogui** (ajouter un placeholder sobre ou précharger les 6 premières fiches) | Massogui Diop |
| **C6** | **Étape 2 — Espace Porteur** (`/incubateur`) | Porteur de projet | Ordinateur & Téléphone | **Avertissement d'hydratation Next.js en console** : divergence mineure d'hydratation SSR/Client sur l'état d'authentification initial (`div` de chargement vs contenu protégé). Aucun impact visuel pour l'utilisateur. | Mineure | **À traiter par Maimouna** (enrober avec `hasMounted` ou initialiser le fallback avec un squelette standard) | Maimouna |
| **C7** | **Global — Authentification** (`/api/auth/token/`) | Tous rôles | Ordinateur & Téléphone | **Limitation de débit anti-force-brute (HTTP 429)** : lors de changements de rôles enchaînés à haute fréquence (< 60 s), le throttle `AuthRateThrottle: 5/min` bloque légitimement la connexion. Le comportement est conforme mais peut surprendre lors d'une démo en direct. | Information / Sécurité | **Documenté dans DEMO.md § 5.1** (attendre 60 s ou utiliser des sessions privées par rôle) | Ibrahima & Pathé |
| **C8** | **Étape 5 — Suivi des Jalons** (`/incubateur/projets`) | Mentor | Téléphone (390 px) | **Tableaux d'historique sur petit écran** : les colonnes de suivi des jalons nécessitent un défilement horizontal partiel pour visualiser la date d'échéance et le bouton de preuve sur 390 px. | Moyenne | **À traiter par Maimouna** (basculer en cartes empilées sur `sm` pour le suivi des jalons mobiles) | Maimouna |

---

## 3. Vérification Approfondie des Trois Fonctions d'Intelligence Artificielle

Les trois services d'intelligence artificielle ont été testés en appel direct avec les clés configurées dans `backend/.env` (`GROQ_API_KEY` et `GEMINI_API_KEY`).

### 3.1 Assistant IA RAG (`apps.assistant`)
* **Service exécuté :** `traiter_message_assistant(session_id, user, question)`
* **Moteur utilisé :** Groq (`llama-3.3-70b-versatile` / Gemini Flash)
* **Test 1 — Question réglementaire couverte :**
  * *Question :* « Quels sont les documents publics disponibles et les critères d'accès aux ateliers ? »
  * *Résultat :* Réponse circonstanciée s'appuyant rigoureusement sur le corpus institutionnel, avec citation des extraits du *Règlement Intérieur de l'Incubateur CIAT*.
  * *Validation sources :* 1 source validée et retournée, correspondant fidèlement au passage utilisé.
* **Test 2 — Épreuve de vérité anti-hallucination (Question refus) :**
  * *Question :* « Quel est le montant exact de la subvention financière directe versée aux startups ? »
  * *Résultat :* L'assistant répond avec intégrité : *« Je ne dispose pas de cette information dans les documents fournis... »*.
  * *Validation sources :* Le bloc `sources` est **strictement vide (`[]`)**, validant la suppression de toute source fictive côté serveur (`ai.chat(..., json_mode=True)`).

### 3.2 Générateur Documentaire Officiel IA (`apps.documents`)
* **Service exécuté :** `generer_sections_document(document, modele, prompt_variables)`
* **Document testé :** *Convention d'incubation CIAT — Format Standard* pour le projet *SunuAgri AI* (Porteur : Aminata Diallo).
* **Résultat :** Génération complète et structurée des 4 sections contractuelles :
  1. `cadre_strategique` : Rappel de l'ancrage de la filière maraîchère des Niayes à l'ISEP de Diamniadio.
  2. `parcours_incubation` : Définition des 18 mois d'accompagnement, accès aux fablabs et ateliers.
  3. `criteres_notation` : Rappel de la grille multicritère à 5 critères pondérés.
  4. `engagements_reciproques` : Obligations de reporting du porteur et livrables attendus par le CIAT.
* **Export PDF & Word :** Téléchargement instantané du PDF officiel conforme à la charte CIAT 360 avec espaces de signature.

### 3.3 Interrogation des Données en Langage Naturel (`apps.analytics`)
* **Service exécuté :** `poser_question_analytics(question)`
* **Question posée :** *« Quelle est la part des femmes dans les projets ? »*
* **Résultat obtenu :**
  * *Routeur sémantique :* Catégorisation automatique vers l'agrégat parité / genre (`parite_genre`).
  * *Synthèse textuelle :* *« La part des femmes dans les projets est de ≈ 45,3 % (29 sur 64 projets). »*
  * *Contrôle de cohérence :* Les chiffres correspondent exactement à la base de données SQLite locale.

---

## 4. Résultats de la Suite Playwright E2E

La suite de tests de bout en bout (Playwright Chromium) a été exécutée sur l'application frontend en écoute sur `http://localhost:3000` et backend sur `http://localhost:8000`.

```
Running 6 tests using 1 worker

  ✓ 1 [chromium] › e2e/auth.spec.ts:4:7 › Connexion refusée avec mot de passe erroné (9.0s)
  ✓ 2 [chromium] › e2e/auth.spec.ts:35:7 › Connexion d'un porteur et accès à son espace (11.7s)
  ✓ 3 [chromium] › e2e/auth.spec.ts:62:7 › Contrôle RBAC : Porteur interdit de tableau de bord (10.1s)
  ✓ 4 [chromium] › e2e/dashboard.spec.ts:4:7 › Coordonnateur accède au dashboard et pose une question IA (14.8s)
  ✓ 5 [chromium] › e2e/dashboard.spec.ts:54:7 › Consultation du référentiel méthodologique (9.7s)
  ✓ 6 [chromium] › e2e/galerie.spec.ts:4:7 › Visiteur anonyme consulte la galerie et ouvre une fiche (7.2s)

  6 passed (1.1m)
```

**Observation technique sur le démarrage à froid (Cold Start) :**  
Lors de la toute première exécution, la compilation dynamique Just-In-Time de Turbopack Next.js sur les routes dynamiques (`/galerie/[slug]` et `/connexion`) peut dépasser le timeout par défaut (15 à 30 secondes). Dès que le cache de compilation locale est initialisé, **100 % des tests Playwright passent avec succès en 1,1 minute**.

---

## 5. Audit de Réactivité : Ordinateur (1280 px) vs Téléphone (390 px)

| Étape DEMO | Écran / URL | Rôle | Ordinateur (1280 px) | Téléphone (390 px) | Diagnostic Visuel & Ergonomie |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Étape 1** | `/` (Accueil) | Public | **OK** (0 overflow) | **OK** (0 overflow) | Hero responsive, cartes des piliers empilées proprement sur mobile, typographie lisible. |
| **Étape 1** | `/portail` | Public | **OK** (0 overflow) | **OK** (0 overflow) | 7 domaines technologiques présentés en grille 1 colonne sur 390 px, boutons pleine largeur. |
| **Étape 1** | `/galerie` | Public | **OK** (0 overflow) | **OK** (0 overflow) | Grille de prototypes fluide (3 col -> 1 col), badges visibles, images pillow locales impeccables. |
| **Étape 1** | `/galerie/sunuagri-ai...` | Public | **OK** (0 overflow) | **OK** (0 overflow) | Fiche détaillée complète : résumé, problème, solution, QR Code dynamique et vues certifiées. |
| **Étape 2** | `/incubateur` | Porteur | **OK** (0 overflow) | **OK** (0 overflow) | Guichet de dépôt des 3 pièces PDF obligatoires. Bouton de soumission désactivé si incomplet. |
| **Étape 2** | `/incubateur/projets` | Porteur | **OK** (0 overflow) | **OK** (0 overflow) | Tableau des projets du porteur. Sur 390 px, le défilement horizontal est contenu sans casser la page. |
| **Étape 3** | `/incubateur/evaluation` | Comité | **OK** (0 overflow) | **OK** (0 overflow) | Grille de notation à 5 critères : curseurs et champs de saisie confortables au toucher. |
| **Étape 4** | `/incubateur/projets` | Coordonnateur | **OK** (0 overflow) | **OK** (0 overflow) | Modale de décision motivée (`Accepté` / `Rejeté`) et liste déroulante d'affectation des mentors. |
| **Étape 5** | `/incubateur/alertes` | Mentor | **OK** (0 overflow) | **OK** (0 overflow) | Indicateurs de retards nets : drapeaux orange (< 15j) et rouge (> 15j) visibles d'un coup d'œil. |
| **Étape 6** | `/documents` | Coordonnateur | ⚠️ **Overflow 1359 px** | **OK** (0 overflow) | Sur desktop, présence conjointe des deux sidebars (voir C4). Génération et export PDF impeccables. |
| **Étape 7** | `/assistant` | Tous connectés | **OK** (0 overflow) | **OK** (0 overflow) | Zone de chat réactive, citations d'extraits bien contrastées, message de refus anti-hallucination net. |
| **Étape 8** | `/tableau-de-bord` | Administrateur | **OK** (0 overflow) | **OK** (0 overflow) | Graphiques décisionnels recalculés dynamiquement, barre de recherche IA fonctionnelle. |
| **Étape 8** | `.../methodologie` | Administrateur | **OK** (0 overflow) | **OK** (0 overflow) | Formules de calcul et définitions des indicateurs documentées pour les évaluateurs et bailleurs. |

---

## 6. Déclarations d'Honnêteté : Ce qui n'a pas pu être testé

Conformément aux directives de déontologie technique du projet et aux règles établies :

1. **Absence de test sur périphériques matériels réels physiques :**  
   Les tests mobiles ont été conduits de manière rigoureuse avec l'émulateur Playwright Chromium configuré sur un viewport iPhone (largeur 390 px, DPR 3, User Agent Safari iOS). Cependant, aucun test n'a été réalisé sur un smartphone physique réel en situation de mobilité (gestes tactiles multi-points, clavier virtuel physique Android/iOS occultant le champ de saisie de l'assistant, rendu du moteur WebKit iOS natif).
2. **Absence totale de déploiement en production :**  
   Conformément à la consigne formelle, la tâche de déploiement reste mise de côté. L'application tourne exclusivement en local (`localhost:8000` et `localhost:3000`). Aucun nom de domaine DNS externe, certificat SSL public Let's Encrypt ou proxy inverse Nginx de production n'a été activé.
3. **Paiements et flux financiers réels non connectés :**  
   Les financements présentés (467,5 millions FCFA mobilisés) sont issus de modèles de démonstration déterministes générés par `seed_all`. Aucune passerelle réelle de paiement mobile (Wave API, Orange Money Sénégal) ou bancaire n'a été raccordée.
4. **Envoi réel d'emails via serveur SMTP externe :**  
   Le serveur Django utilise le backend de messagerie local / console. Aucune délivrance réelle de courriels vers des serveurs de messagerie distants (Gmail, Outlook) n'a été testée.
5. **Session de jury multi-utilisateurs concurrente en temps réel :**  
   Le comité d'évaluation a été testé de manière unitaire avec le compte `comite@ciat.sn`. Aucun test de charge concurrent simulant 10 jurés notant simultanément le même dossier à la même seconde n'a été exécuté.

---

## 7. Commandes de Vérification Reproductibles

Pour reproduire l'intégralité des vérifications de cette recette sur n'importe quel poste :

```bash
# 1. Vérification de l'intégrité Django et des modèles
cd backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check

# 2. Exécution de la suite de 265 tests automatisés
.\.venv\Scripts\python.exe manage.py test apps

# 3. Réinitialisation des données de test cohérentes (idempotent)
.\.venv\Scripts\python.exe manage.py seed_all

# 4. Lancement de la suite Playwright E2E dans le frontend
cd ../frontend
npm run test:e2e

# 5. Lancement de l'audit complet Desktop & Mobile (390 px)
node scripts/audit_recette.mjs
```

---

> **Livrable de Recette validé pour la Phase 5 (Tâche T3).**  
> Fichier destiné à Lansana pour communication des arbitrages à Massogui, Maimouna, Alioune, Ibrahima et Pathé.
