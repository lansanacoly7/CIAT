# Rapport Final de Projet : Plateforme Numérique CIAT

> **Développement de Solutions Numériques pour le CIAT et son Incubateur**  
> **Établissement :** Institut Supérieur d'Enseignement Professionnel (ISEP) Amadou Traoré de Diamniadio  
> **Auteur :** Lansana Coly (Lead technique)  
> **Référence académique :** Évaluation pratique du cours d'Intelligence Artificielle Générative (Livrable Obligatoire N° 6)  
> **Volume documentaire :** 6 pages réelles (conforme à l'exigence académique de 5 à 10 pages)  
> **Avertissement méthodologique :** La plateforme n'est **pas déployée en production** (environnement de développement local, conteneurs et tests automatisés). Les données de test et de démonstration sont **strictement fictives**. Les fonctionnalités d'IA générative **dépendent de fournisseurs externes gratuits** (Groq, Google Gemini) soumis à quotas de requêtes et aléas de disponibilité.

---

## Sommaire
1. [Introduction et Contexte Institutionnel](#1-introduction-et-contexte-institutionnel)
2. [Architecture Globale et Choix Technologiques](#2-architecture-globale-et-choix-technologiques)
3. [Réalisations Fonctionnelles par Module](#3-réalisations-fonctionnelles-par-module)
4. [Intégration et Encadrement de l'IA Générative](#4-intégration-et-encadrement-de-lia-générative)
5. [Sécurité, Contrôle Qualité et Résolution des Anomalies](#5-sécurité-contrôle-qualité-et-résolution-des-anomalies)
6. [Jeux de Données et Performance des Tests Automatisés](#6-jeux-de-données-et-performance-des-tests-automatisés)
7. [Limites du Système et Perspectives d'Évolution](#7-limites-du-système-et-perspectives-dévolution)
8. [Conclusion](#8-conclusion)
9. [Formats de Remise et Commandes de Génération](#9-formats-de-remise-et-commandes-de-génération)

---

## 1. Introduction et Contexte Institutionnel

### 1.1 Le CIAT au Cœur du Pôle Technologique de Diamniadio
Implanté au sein de l'ISEP Amadou Traoré de Diamniadio, le **Centre d'Innovation, d'Application et de Transfert (CIAT)** constitue un levier stratégique de transfert technologique et d'incubation entrepreneuriale au Sénégal. Sa vocation est d'accompagner les porteurs de projets innovants, d'accélérer le passage de l'idée au prototype industriel et de rapprocher la formation professionnelle des besoins réels des filières économiques (agroécologie, énergies renouvelables, intelligence artificielle, fabrication mécanique, santé).

### 1.2 Objectif de l'Évaluation Pratique
Dans le cadre du cours d'Intelligence Artificielle Générative, l'objectif assigné à l'équipe technique était de concevoir, développer, tester et documenter une solution logicielle complète, interconnectée et immédiatement opérationnelle. Le résultat dépasse le stade d'un prototype jetable : la plateforme CIAT intègre l'ensemble des modules métiers requis, repose sur des bases de données relationnelles consistantes, intègre des garde-fous de sécurité avancés et encadre l'IA générative dans un cadre de confiance strict.

---

## 2. Architecture Globale et Choix Technologiques

### 2.1 Schéma Directeur de l'Architecture
La solution adopte une architecture moderne découplée reposant sur des protocoles d'échanges standardisés (REST / JSON) et une authentification sans état via tokens JWT :

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   INTERFACE UTILISATEUR (FRONT-END)                    │
│      Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SERVEUR D'APPLICATION (BACK-END)                     │
│               Django 5.2 + Django REST Framework (DRF)                 │
│                                                                        │
│  [apps.core]       [apps.portal]       [apps.incubator]                │
│  • Auth JWT / RBAC • Actualités / FAQ  • Dossiers & Complétude         │
│  • Référentiels    • Appels à projets  • Évaluations & Jurys           │
│  • Projets CIAT    • Annuaire public   • Mentors & Jalons              │
│                                                                        │
│  [apps.analytics]  [apps.assistant]    [apps.documents]  [apps.gallery]│
│  • Métriques SQL   • RAG strict        • Générateur IA   • Valorisation│
│  • Partenariats    • Citations JSON    • Versionnage     • QR Codes    │
│  • Financements    • Atelier           • Immuabilité     • Statistiques│
└──────────────────┬────────────────────────────────┬────────────────────┘
                   │                                │
                   ▼                                ▼
       ┌──────────────────────┐         ┌───────────────────────┐
       │   BASE DE DONNÉES    │         │     FOURNISSEURS      │
       │     RELATIONNELLE    │         │     IA GÉNÉRATIVE     │
       │ PostgreSQL / SQLite  │         │  Groq / Gemini Flash  │
       │      (34 tables)     │         │  (Format OpenAI API)  │
       └──────────────────────┘         └───────────────────────┘
```

### 2.2 Choix Technologiques Argumentés

| Couche | Technologie retenue | Rationale et Bénéfices constatés |
|---|---|---|
| **Back-end** | **Python 3.13 / Django 5.2 / DRF** | Robustesse éprouvée de l'ORM, écosystème de sécurité natif (CSRF, injection SQL, hachage sécurisé), facilité de modélisation et sérialisation conforme OpenAPI (drf-spectacular). |
| **Front-end** | **Next.js 16.4 / React 19.3 / Tailwind CSS v4** | Typage statique prévenant les anomalies à l'exécution, Server Components pour les performances SEO du portail, réactivité de l'espace interactif de gestion. |
| **Stockage relationnel** | **SQLite (développement/tests) / PostgreSQL (cible conteneur local)** | La plateforme n'est pas déployée en production. Support des contraintes d'unicité avancées et des requêtes JSONField performantes pour les sections documentaires et les métadonnées. |
| **Passerelle IA** | **Abstraction `apps.core.ai`** | Implémentation du protocole standardisé « OpenAI-compatible ». Permet de basculer de Groq à Google Gemini sans modifier une seule ligne de code applicatif, avec gestion de quotas gratuits et tolérance aux pannes. |

---

## 3. Réalisations Fonctionnelles par Module

La plateforme fédère six modules opérationnels interconnectés par les données du modèle central `core.Projet` :

1. **P1 — Portail Institutionnel (`apps.portal`) :**  
   Vitrine officielle présentant les missions du CIAT, publiant les actualités, l'agenda des événements à venir (`?a_venir=1`), les appels à projets dont le statut `ouvert`/`clos` est calculé dynamiquement, ainsi que l'annuaire public des projets incubés avec occultation des données privées.
2. **P2 — Gestion Complète de l'Incubateur (`apps.incubator`) :**  
   Gestion du parcours complet de la candidature au bilan final :
   - Dépôt de dossier avec jauge dynamique de complétude (0 % à 100 %).
   - Vérification de sécurité binaire des fichiers joints (Magic Bytes).
   - Évaluation multicritère par le comité de sélection sur la grille active (5 critères pondérés) avec score sur 20.
   - Décision motivée du jury enregistrée par le coordonnateur (`accepte` / `refuse`).
   - Affectation exclusive d'un mentor, définition d'objectifs, cadencement de jalons avec détection automatique des retards (`en_retard=True`), téléversement de preuves et bilans de suivi périodiques à 3 et 6 mois.
3. **P3 — Tableau de Bord Décisionnel (`apps.analytics`) :**  
   Console de pilotage consolidant les indicateurs clés (idées, dossiers, sélection, prototypes, taux de sélection), ventilés par domaine technologique, par cohorte et par genre (parité).
4. **P4 — Assistant Conversationnel Virtuel (`apps.assistant`) :**  
   Système d'orientation fonctionnant en deux modes : recherche documentaire stricte (RAG fondé sur les documents officiels avec citations de sources vérifiées) et atelier de formalisation (pitch, SWOT).
5. **P5 — Générateur Intelligent de Documents (`apps.documents`) :**  
   Production assistée par IA de conventions d'incubation, fiches synthétiques et procès-verbaux de jurys conformes à la charte ISEP, avec gestion de versions et verrouillage d'immuabilité juridique (`409 Conflict`).
6. **P6 — Galerie Numérique des Innovations (`apps.gallery`) :**  
   Plateforme publique de valorisation des prototypes, workflow de validation éditoriale (`en_validation` ➔ `publie`), compteur de visites atomique et génération à la volée de QR codes promotionnels dynamiques.

---

## 4. Intégration et Encadrement de l'IA Générative

L'intégration de l'intelligence artificielle au sein du CIAT a été guidée par une exigence d'**explicabilité, de sobriété et de vérifiabilité** :

### 4.1 RAG Documentaire Strict sans Surcoût d'Infrastructure
Au lieu de recourir à des bases vectorielles tierces payantes ou complexes à maintenir (Pinecone, Weaviate), le CIAT exploite un moteur local d'indexation et d'extraction textuelle multi-format (PDF via parsing des flux, Word via XML, texte brut) découpé en passages de 200 à 300 mots.  
La recherche lexicale intègre la normalisation NFKD (suppression d'accents), l'élargissement phonétique et morphologique (troncature à 5 lettres) et un dictionnaire de synonymes contextualisés au Sénégal (*« Où »* ➔ *« situé »*, *« Diamniadio »*).

### 4.2 Élimination des Hallucinations : Le Mode JSON Strict
L'un des défis majeurs résolus au cours du projet concerne la traçabilité des citations de l'assistant :
- **Problème initial :** Une détection naïve par mots-clés ne parvenait pas à détecter des refus subtils formulés par le LLM (ex: *« Le montant de la subvention n'est pas indiqué dans les extraits fournis »*), associant indûment un document source à une réponse négative.
- **Solution mise en œuvre :** L'assistant utilise le mode JSON strict (`ai.chat(..., json_mode=True)`). Le modèle transmet obligatoirement un tableau d'entiers `passages_utilises`. Le serveur valide que ces numéros correspondent effectivement aux passages envoyés dans le prompt. Si la liste est vide ou en cas de refus d'extrapoler, `sources` est garanti vide (`[]`). En cas de réponse non conforme, une nouvelle tentative est automatiquement déclenchée avant retour d'une erreur 502 explicite.

### 4.3 Marqueur Universel `[À COMPLÉTER]`
Dans le générateur de documents (P5) comme dans l'atelier de pitch (P4), le modèle a l'interdiction formelle d'inventer des clauses légales, des résultats techniques ou des noms de partenaires. Toute information requise non présente dans le contexte fourni doit obligatoirement être substituée par le marqueur `[À COMPLÉTER : ...]`, préservant la responsabilité légale du rédacteur humain.

---

## 5. Sécurité, Contrôle Qualité et Résolution des Anomalies

### 5.1 Architecture de Sécurité et Contrôle RBAC
Le contrôle d'accès repose sur la matrice des 6 rôles. Les vérifications ne sont pas uniquement ergonomiques (côté client), mais sont appliquées au niveau de la couche contrôleur de chaque vue DRF :
- Interdiction pour un porteur d'accéder aux dossiers ou projets d'un tiers (403/404).
- Interdiction de modifier ou supprimer des pièces après soumission officielle du dossier (400).
- Interdiction d'auto-évaluation ou de double évaluation par le même membre du jury (400/403).
- Restriction stricte de la consultation des mentors affectés aux seuls membres concernés (Équipe CIAT, porteur du projet, mentor désigné).

### 5.2 Traitement Exhaustif des 11 Anomalies Réelles du Projet
Conformément au registre tenu dans [`docs/TESTS_ET_ANOMALIES.md`](../TESTS_ET_ANOMALIES.md), l'ensemble des défauts constatés lors des revues de code successives a été analysé, documenté et résolu :

| Réf. | Composant / Module | Nature de l'anomalie constatée | Impact / Gravité | Correction vérifiée |
|---|---|---|---|---|
| **ANO-01** | `apps.documents` | Erreur de syntaxe Python bloquante sur import avec chiffre initial. | Bloquante | Remplacement par import dynamique `importlib`. |
| **ANO-02** | `apps.assistant` | Rétention indue des sources documentaires en cas de refus partiel. | Majeure | Mode JSON strict (`passages_utilises`) et validation serveur. |
| **ANO-03** | Frontend Auth | Connexion sans mot de passe via jetons de démo fictifs (`demo_*_token`). | Critique | Suppression définitive des jetons démo et contrôle strict du mot de passe. |
| **ANO-04** | Frontend Incubateur | Faux enregistrement de candidatures en localStorage en cas de panne réseau. | Critique | Suppression des mocks locaux, affichage d'erreurs claires sans perte de saisie. |
| **ANO-05** | Frontend Portail | Affichage de fausses actualités et dates limites fictives si l'API échouait. | Majeure | Remplacement par un message d'indisponibilité avec bouton de réessai. |
| **ANO-06** | Backend Incubateur | Exposition des coordonnées de mentors à des utilisateurs tiers. | Élevée | Contrôle d'habilitation strict dans `ProjetMentorView` (commit `605656d`). |
| **ANO-07** | Tests automatisés | Durée excessive des tests (> 5 min incubateur, 56s portail). | Majeure | Accélération via `MD5PasswordHasher` (~5s et ~1.3s). |
| **ANO-08** | Frontend Analytics | Erreurs de lint React (`setState` dans `useEffect`, apostrophe non échappée). | Moyenne | Nettoyage des composants et correction typographique JSX. |
| **ANO-09** | Frontend Routing | Menus d'administration injectés indûment sur la galerie publique. | Majeure | Suppression des `layout.tsx` parasites hors du tableau de bord. |
| **ANO-10** | Backend Galerie | URL du QR code codée en dur avec un nom de domaine fixe. | Moyenne | Utilisation dynamique du paramètre `settings.SITE_URL`. |
| **ANO-11** | Backend Core IA | Alias `gemini-flash-latest` provoquant des dépassements de délai (> 60s). | Majeure | Modèle par défaut fixé à `gemini-3.5-flash` dans `settings.py`. |

---

## 6. Jeux de Données et Performance des Tests Automatisés

### 6.1 Cohérence et Idempotence Globales (`seed_all`)
Pour offrir une démonstration réaliste et des dashboards immédiatement exploitables, la commande `python manage.py seed_all` initialise une base consolidée de données **strictement fictives** :
- **64 projets innovants** réalistes ancrés dans le tissu socio-économique sénégalais (répartis sur 8 domaines et 4 cohortes).
- **43 porteurs de projet** dont 16 femmes, matérialisant un taux de féminisation de 37,2 %.
- **58 dossiers d'instruction**, 174 pièces obligatoires téléversées, 109 évaluations du comité et 53 décisions motivées.
- **49 mentors affectés**, 147 objectifs, 147 jalons cadencés et 70 bilans d'étape à 3 et 6 mois.
- **49 partenariats** formalisés (dont 37 actifs) et **50 financements** d'amorçage (totalisant 467 500 000 FCFA mobilisés dont 403 000 000 FCFA décaissés).
- **23 fiches de galerie** (19 publiées, 2 en validation, 2 brouillons) avec QR codes dynamiques.
- **6 documents institutionnels** générés et archivés.
- **28 images de démonstration générées localement** (Pillow) : 2 visuels d'actualités, 3 logos partenaires, 23 photos de galerie, poids < 150 Ko (max 53 Ko), 100 % souveraines (zéro URL externe).
- **1 740 enregistrements de démonstration au total** peuplés dans les 34 tables applicatives du CIAT.
- **Idempotence certifiée :** Une réexécution successive de la commande conserve strictement les totaux en base sans générer le moindre doublon ni régénérer d'image.

### 6.2 Résultats de la Suite de Tests
La validation de l'application repose sur deux suites de tests automatisées exécutées sur machine locale :
1. **Parcours complet de bout en bout (`apps.core.tests.test_parcours_complet`) :**  
   Simule l'ensemble du cycle de vie d'un porteur (inscription ➔ dépôt ➔ complétude ➔ notation comité ➔ décision coordonnateur ➔ jalonnement mentor ➔ publication galerie ➔ export document officiel) :
   - Temps d'exécution : **~1,05 seconde** (seuil exigé : < 30 secondes).
   - Résultat : **2/2 tests passants** (100 %).
2. **Suite globale de tests d'intégration (`python manage.py test apps`) :**  
   - Couverture : **265 tests unitaires et fonctionnels** couvrant l'ensemble des 7 modules.
   - Temps d'exécution total : **~30 à 40 secondes**.
   - Résultat : **100 % OK, 0 échec, 0 erreur**.
   - Contrôles système : `python manage.py check` (0 avertissement), `makemigrations --check` (0 divergence de schéma).

---

## 7. Limites du Système et Perspectives d'Évolution

En toute transparence académique et technique, les limites suivantes constituent les axes d'évolution préconisés pour la phase suivante :
1. **Paiement et bourses d'amorçage :** La plateforme trace les montants accordés mais ne déclenche pas de virements financiers automatisés. Une passerelle vers des APIs de paiement (Wave, Orange Money) pourra être greffée.
2. **Recherche sémantique vectorielle :** Le moteur RAG actuel est purement lexical. Bien que très performant et économique, l'ajout d'embeddings (ex. modèle `text-embedding-004`) enrichira la détection des paraphrases complexes.
3. **Application mobile native :** L'interface actuelle est entièrement responsive sur navigateur mobile ; la publication d'une application Flutter ou PWA installable renforcera le confort d'usage des porteurs sur le terrain.

---

## 8. Conclusion

La plateforme numérique du CIAT conçue et livrée lors de cette évaluation pratique constitue une réponse technique complète, rigoureuse et pérenne aux défis d'accompagnement de l'ISEP Amadou Traoré de Diamniadio.  
En mariant la solidité d'une modélisation relationnelle de 34 tables, une étanchéité de droits garantie par une matrice RBAC à 6 rôles, et une intégration de l'IA générative strictement encadrée par des garde-fous anti-hallucination, la solution démontre qu'il est possible de mobiliser l'intelligence artificielle au service de l'action publique et académique sans jamais sacrifier la sécurité, la souveraineté des données ni la rigueur méthodologique.

---

## 9. Formats de Remise et Commandes de Génération

Conformément aux exigences du livrable N° 6, ce rapport est produit sous deux formats officiels respectant la charte graphique CIAT / ISEP Diamniadio :
- **Format PDF imprimable :** [`docs/livrables/rapport_projet.pdf`](./rapport_projet.pdf) (volume réel mesuré : **6 pages**, pagination dynamique, en-tête institutionnel, palettes `#612D10` et `#C49A45`).
- **Format Word modifiable :** [`docs/livrables/rapport_projet.docx`](./rapport_projet.docx) (styles typographiques hiérarchisés, tableaux zébrés et schémas encadrés).

### Commande de Régénération Reproductible
```bash
.\backend\.venv\Scripts\python.exe scripts/generer_rapport.py
```
