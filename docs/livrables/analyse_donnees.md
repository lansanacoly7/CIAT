# Rapport d'Analyse des Données et Recommandations Stratégiques (CIAT)

> **Auteur :** Groupe de six apprenants : Lansana Coly, Pape Alioune Sène, Maimouna Sall, El Hadji Massogui Diop, Ibrahima Khalilou Diallo, Pathé Fall (Référent analyse : Pape Alioune Sène)  
> **Livrable :** Phase 3 — Tâche T2 (`docs/livrables/analyse_donnees.md`)  
> **Destinataires :** Lansana (Chef de Projet), Comité de Sélection, Direction du CIAT  
> **Référence d'API :** Endpoints REST `/api/analytics/` (`seed_all`) et `/api/analytics/indicateurs/definitions/`  
> **Date de production :** 26 Octobre 2026  

---

## 1. Contexte et Périmètre de l'Analyse

Le présent rapport constitue l'analyse décisionnelle et méthodologique approfondie des données de l'incubateur du **Centre d'Innovation, d'Application et de Transfert (CIAT)**. 

Conformément aux exigences du profil Data Analyst et aux directives de la Phase 3, l'ensemble des chiffres et agrégats présentés dans ce document sont **strictement issus des endpoints officiels de l'API REST** (`/api/analytics/indicateurs/`, `/api/analytics/par-domaine/`, `/api/analytics/par-cohorte/`, `/api/analytics/par-genre/`, `/api/analytics/partenariats-financements/stats/`, `/api/incubator/alertes/`).

### Périmètre de la base analysée
* **62 Projets d'innovation** répartis sur 3 cohortes annuelles.
* **47 Utilisateurs enregistrés** (Porteurs, Équipe de coordination, Mentors, Membres du comité).
* **58 Dossiers de candidature formalisés** et **53 Décisions officielles** rendues par le jury.
* **147 Jalons d'incubation opérationnels** suivis au niveau des ateliers et laboratoires.
* **50 Opérations de financement** et **48 Accords de partenariats** stratégiques.
* **23 Fiches d'innovation publiées** au sein de la Galerie des Innovations.

---

## 2. Analyse Détaillée des Indicateurs Clés

### 2.1. Entonnoir de Sélection et Taux de Conversion

| Étape du Pipeline | Volume (Nombre) | % par rapport à l'étape amont | % sur Total Idées |
|---|:---:|:---:|:---:|
| **Idées reçues (sourcing brut)** | **62** | 100.0% | 100.0% |
| **Dossiers formellement déposés** | **58** | 93.5% | 93.5% |
| **Projets sélectionnés par le jury** | **49** | 84.5% | 79.0% |
| **Projets entrés en incubation active** | **38** | 77.6% | 61.3% |
| **Prototypes industriels validés** | **23** | 60.5% (des incubés) | 37.1% |

#### Interprétation :
1. **Forte complétude des candidatures (93.5%) :** Sur 62 idées soumises, 58 ont franchi avec succès le stade du dossier formel (pièces justificatives, budget prévisionnel, présentation d'équipe). Ce ratio exceptionnel démontre que le formulaire de candidature et l'accompagnement initial sont clairs et incitatifs.
2. **Taux de sélection de 84.5% :** Le ratio `Projets sélectionnés (49) / Dossiers déposés (58)` s'établit à **84.5%**. Cette sélectivité reflète un pré-sourcing ciblé et un alignement étroit entre les profils des candidats et les axes prioritaires du centre.
3. **Efficacité de passage au prototype (46.9% des sélectionnés, 60.5% des incubés) :** Déjà 23 prototypes fonctionnels sont achevés et validés. Comme analysé ci-après, ce chiffre reflète fidèlement la maturité échelonnée par promotion.

![Figure 3 — Évolution mensuelle des dépôts de dossiers](figures/fig3_evolution_mensuelle.png)

**Interprétation (Fig. 3) :** L'évolution mensuelle révèle deux pics de dépôt marqués : un premier en octobre–novembre 2024 (ouverture de la Cohorte 2025) et un second en mars 2026 (lancement de la Cohorte 2026), conformément au calendrier académique de l'ISEP. Les mois inter-cohortes affichent un flux résiduel stable de 2 à 4 dossiers, témoignant d'une activité d'instruction continue plutôt que purement saisonnière. Ce profil multi-pics est caractéristique des incubateurs intégrés à un établissement à cycles semestriels.

**Recommandation :** Planifier les ressources humaines du comité de sélection (jury, coordinateurs) en anticipant ces deux fenêtres de forte charge (octobre et mars) pour réduire les délais d'instruction.

*(Données fictives de démonstration issues de seed_all)*

---

### 2.2. Répartition Sectorielle par Domaine d'Innovation

Les 62 projets se déploient à travers les 7 domaines d'intervention prioritaires de l'ISEP et du CIAT :

| Domaine Prioritaire CIAT | Nombre de Projets | Part Relative | Financements Mobilisés (FCFA) |
|---|:---:|:---:|:---:|
| **Agriculture, transformation & environnement** | 9 | 14.5% | 80 000 000 FCFA |
| **Mécanique, fabrication & maintenance** | 9 | 14.5% | 56 000 000 FCFA |
| **Pharmaceutique et biomédical** | 9 | 14.5% | 95 000 000 FCFA |
| **Services aux collectivités & incubation** | 9 | 14.5% | 73 000 000 FCFA |
| **TIC, numérique, IA & données** | 9 | 14.5% | 72 000 000 FCFA |
| **Énergie & efficacité énergétique** | 9 | 14.5% | 35 000 000 FCFA |
| **Éducation, formation & insertion** | 8 | 12.9% | 61 000 000 FCFA |
| **TOTAL** | **62** | **100.0%** | **472 000 000 FCFA** |

#### Interprétation :
* **Équilibre multisectoriel parfait :** Chaque domaine accueille entre 8 et 9 projets (13% à 15%). Il n'existe aucune monoculture technologique.
* **Intensité capitalistique différenciée :** Si les volumes de projets sont homogènes, les capitaux mobilisés reflètent les besoins réels de chaque filière :
  - Le secteur **Pharmaceutique & Biomédical** capte le plus fort volume d'investissement (**95 000 000 FCFA**, 9 opérations), justifié par le coût des équipements d'analyse et les exigences d'homologation sanitaire.
  - L'**Agriculture & Transformation** arrive en seconde position avec **80 000 000 FCFA** (machines agroalimentaires, serres connectées).
  - Le secteur **Énergie** affiche en revanche un sous-financement relatif (**35 000 000 FCFA**, 5 financements), constituant un axe d'amélioration stratégique.

![Figure 1 — Répartition des projets par domaine](figures/fig1_repartition_domaine.png)

**Interprétation (Fig. 1) :** Le diagramme en secteurs confirme la distribution quasi-uniforme des 62 projets entre les 7 domaines prioritaires du CIAT : chaque filière représente entre 12.9% et 14.5% du portefeuille. Cette égalité de représentation sectorielle reflète une politique de sélection délibérément multidisciplinaire, évitant toute surconcentration sectorielle susceptible de créer des goulets d'étranglement dans les équipements partagés du fablab. Toutefois, la différence de financement entre secteurs (de 35M FCFA pour l'Énergie à 95M FCFA pour le Biomédical) indique que l'équilibre en volume de projets ne se traduit pas automatiquement en équilibre de ressources.

**Recommandation :** Mettre en place un tableau de bord de l'intensité capitalistique par domaine afin de détecter précocement les secteurs sous-financés et d'activer des guichets spécifiques avant la prochaine session de sélection.

*(Données fictives de démonstration issues de seed_all)*

---

### 2.3. Maturité et Cycle de Vie par Cohorte

L'analyse longitudinale met en lumière la progression séquentielle des promotions :

| Cohorte | Année | Total Projets | Projets Sélectionnés | Prototypes Validés | Statut dans le Cycle |
|---|:---:|:---:|:---:|:---:|---|
| **Cohorte 2024** | 2024 | 21 | 21 (100%) | 21 (100%) | **Promotion Mature** (Cycle complet achevé) |
| **Cohorte 2025** | 2025 | 32 | 28 (87.5%) | 2 (6.3%) | **En Incubation Active** (Prototypage en cours) |
| **Cohorte 2026** | 2026 | 9 | 0 (0%) | 0 (0%) | **Phase Candidature & Instruction** |

#### Interprétation :
* **Cohorte 2024 (L'excellence du modèle) :** Les 21 projets accueillis sont tous parvenus au stade de prototype fonctionnel validé (**taux d'achèvement de 100%**). Ces prototypes alimentent directement la Galerie des Innovations du CIAT.
* **Cohorte 2025 (Le vivier opérationnel) :** Forte de 32 projets et 28 sélections, cette cohorte compte actuellement 26 projets en phase intensive d'atelier et 2 premiers prototypes déjà finalisés.
* **Cohorte 2026 (Le pipeline émergent) :** 9 projets enregistrés en attente des délibérations du comité de sélection, marquant le flux continu d'alimentation du hub.

![Figure 4 — Comparaison des promotions par cohorte](figures/fig4_comparaison_cohortes.png)

**Interprétation (Fig. 4) :** Le graphique en barres groupées illustre la progression séquentielle des trois cohortes : la Cohorte 2024 (21 projets, 100% prototype) représente le modèle d'excellence à cycle complet ; la Cohorte 2025 (32 projets, 28 sélectionnés, 2 prototypes) est en pleine phase d'intensification ; la Cohorte 2026 (9 projets) est en attente de délibération. L'effet de pyramide inversée — plus de projets en entrée que de prototypes validés — est sain et témoigne d'un pipeline fonctionnel, à condition que les ressources de mentorat et d'équipement scalent avec la taille de la Cohorte 2025.

**Recommandation :** Allouer dès maintenant des créneaux lablab supplémentaires à la Cohorte 2025 pour éviter un goulot d'étranglement lors du passage en phase prototype prévu au second semestre 2026.

*(Données fictives de démonstration issues de seed_all)*

---

### 2.4. Inclusivité et Parité de Genre

| Genre du Porteur Principal | Effectif de Projets | Pourcentage |
|---|:---:|:---:|
| **Femmes entrepreneures (F)** | **29** | **46.8%** |
| **Hommes entrepreneurs (H)** | **33** | **53.2%** |
| **Autre / Non précisé** | **0** | **0.0%** |
| **Total** | **62** | **100.0%** |

#### Interprétation :
* Avec **46.8% de projets dirigés par des femmes**, le CIAT réalise une performance exemplaire en matière d'inclusivité, surpassant nettement les moyennes continentales dans les incubateurs technologiques (~20% à 25%).
* Cette parité est observée dans des filières traditionnellement masculines (fabrication mécanique, photovoltaïque et génie logiciel), validant la politique d'ouverture de l'ISEP.

![Figure 2 — Répartition des porteurs par genre](figures/fig2_repartition_genre.png)

**Interprétation (Fig. 2) :** Le graphique en anneau révèle une parité remarquable : 46.8% des projets sont portés par des femmes (29/62), contre une moyenne africaine estimée entre 20% et 25% pour les incubateurs technologiques. Cet écart de +20 points de pourcentage par rapport à la moyenne continentale constitue un indicateur d'impact social fort, résultat direct de la politique d'admission non discriminatoire de l'ISEP et des programmes de bourses ciblées. Aucun projet n'est classé « genre non précisé », attestant de la qualité de la collecte de données à l'inscription.

**Recommandation :** Capitaliser sur cette performance de parité dans les communications institutionnelles et les dossiers de financement (bailleurs AFD, GIZ, ONU Femmes) pour accéder à des guichets de financement conditionnés à l'inclusion genre.

*(Données fictives de démonstration issues de seed_all)*

---

### 2.5. Santé Opérationnelle des Jalons et Détection des Retards

Le module d'incubation assure le suivi de **147 jalons contractuels** :

| Statut du Jalon | Nombre de Jalons | Part (%) |
|---|:---:|:---:|
| **Jalons validés ("fait")** | 60 | 40.8% |
| **Jalons en cours de réalisation ("en_cours")** | 50 | 34.0% |
| **Jalons planifiés ("a_faire")** | 37 | 25.2% |
| **TOTAL** | **147** | **100.0%** |

#### Analyse des Retards Critiques :
* **8 jalons sont identifiés en retard critique** (`en_retard = True`, date d'échéance dépassée et statut non terminé), soit **5.4%** de l'ensemble des jalons.
* **Typologie des retards :**
  - 4 retards concernent l'approvisionnement en composants spécialisés (capteurs IoT, réactifs chimiques importés).
  - 3 retards sont liés à des démarches administratives ou réglementaires d'homologation.
  - 1 retard est d'ordre organisationnel (recrutement d'un stagiaire technicien).
* **Diagnostic :** Le taux de retard de 5.4% est modéré et maîtrisé, mais requiert une veille proactive pour éviter l'engorgement des bancs d'essai.

---

### 2.6. Financements Mobilisés et Partenariats Écosystémiques

#### Bilan Financier :
* **Volume total des financements engagés :** **472 000 000 FCFA** répartis sur 50 financements distincts.
* **Montant effectivement décaissé :** **402 000 000 FCFA**, soit un **taux de décaissement de 85.2%**.
* **Répartition par bailleur / source :**
  1. *BNDE Ligne Amorçage PME :* 120 000 000 FCFA (6 projets)
  2. *Orange Fab Accélération :* 108 000 000 FCFA (9 projets)
  3. *Facilité d'Investissement AFD Sénégal :* 75 000 000 FCFA (5 projets)
  4. *Subvention GIZ Innovation & Transition :* 60 000 000 FCFA (6 projets)
  5. *Prêt d'Honneur FONGIP :* 30 000 000 FCFA (4 projets)
  6. *Fonds d'Amorçage DER/FJ :* 25 000 000 FCFA (5 projets)
  7. *Concours National de l'Innovation Numérique :* 24 000 000 FCFA (4 projets)
  8. *Fonds d'Appui 3FPT :* 15 000 000 FCFA (6 projets)
  9. *Bourse d'Innovation CIAT - ISEP :* 15 000 000 FCFA (5 projets)

#### Réseau de Partenariats :
* **48 conventions enregistrées**, dont **33 partenariats actifs** (68.8%).
* Typologie : Technique & R&D (12), Commercial & Marché (12), Financier (11), Institutionnel (9), Académique (4).

![Figure 5 — Financements mobilisés par guichet](figures/fig5_financements_sources.png)

**Interprétation (Fig. 5) :** Le graphique en barres horizontales classe les 9 guichets de financement par montant engagé : la BNDE (120M FCFA) et Orange Fab (108M FCFA) représentent ensemble 48% des 472M FCFA totaux, plaçant le CIAT dans une situation de dépendance bilatérale concentrée. Les 7 autres guichets se répartissent les 52% restants, avec des montants individuels compris entre 15M et 75M FCFA. Le taux global de décaissement de 85.2% (402M/472M) est excellent, confirmant la fiabilité des engagements des bailleurs partenaires.

**Recommandation :** Diversifier le portefeuille de financement en sollicitant activement 2 à 3 nouveaux guichets non encore mobilisés (FONSIS, BOAD Fonds Vert, Banque Islamique de Développement) afin de réduire le risque de concentration et d'atteindre une répartition équilibrée, aucun guichet ne dépassant 20% du total.

*(Données fictives de démonstration issues de seed_all)*

---

## 3. Recommandations Stratégiques pour le CIAT

Sur la base de ces constats empiriques, 4 recommandations prioritaires sont formulées à l'attention de la gouvernance du CIAT :

### Recommandation 1 : Mise en place d'un "Guichet Fast-Track Approvisionnement & Homologation"
* **Constat :** Les 8 jalons en retard (5.4%) se concentrent sur la livraison de composants importés et les autorisations réglementaires.
* **Action :** Créer une convention-cadre avec les transitaires de Diamniadio et l'Agence Sénégalaise de Réglementation Pharmaceutique (ARP) pour accélérer le dédouanement et la certification des prototypes des incubés.

### Recommandation 2 : Rééquilibrage du Financement sur la Filière "Énergie & Transition Écologique"
* **Constat :** Bien que le domaine Énergie compte 9 projets à forte valeur ajoutée, il n'a capté que 35 000 000 FCFA (7.4% du total des financements), contre 95M FCFA pour le biomédical.
* **Action :** Négocier un guichet spécifique de co-financement avec l'Agence Nationale pour les Énergies Renouvelables (ANER), le FONSIS ou les fonds verts climat (BOAD/FVC) pour abonder les projets solaires et biogaz.

### Recommandation 3 : Activation des Partenariats Commerciaux pour les 21 Prototypes Mature de 2024
* **Constat :** 21 prototypes sont prêts, testés et exposés dans la Galerie des Innovations. Le risque principal est le maintien prolongé en phase laboratoire ("vallée de la mort").
* **Action :** Mobiliser sans délai les **12 partenaires commerciaux** enregistrés dans la plateforme pour organiser des *Demo Days B2B* et lancer des phases pilotes industrielles ou des commandes publiques précommerciales.

### Recommandation 4 : Clôture de l'Instruction et Délibération sur la Cohorte 2026
* **Constat :** Les 9 dossiers de la promotion 2026 sont enregistrés mais affichent 0 sélection effective, risquant de créer un creux de charge dans les ateliers au second semestre.
* **Action :** Programmer la session plénière du comité de sélection avant la fin du trimestre pour intégrer la nouvelle vague et optimiser l'occupation des bancs de test du fablab.

---

## 4. Signalement des Limites Méthodologiques

Conformément à la rigueur scientifique exigée pour tout travail d'analyste de données :

1. **Nature Simulée des Données de Démonstration :**  
   Les chiffres, projets, financements et jalons présentés dans ce document sont issus du jeu de test complet généré par la commande `python manage.py seed_all`. Bien qu'ils modélisent fidèlement un centre d'innovation technologique sénégalais et respectent les contraintes réelles du CIAT, **ces données sont purement fictives et destinées aux phases d'évaluation, d'audit et de démonstration**.
2. **Périmètre du Dénominateur du Taux de Sélection :**  
   Le taux de sélection de 84.5% s'appuie sur le nombre de **dossiers formellement déposés** (58) et non sur le nombre brut d'idées saisies (62). Cette règle méthodologique évite de pénaliser le centre pour des projets abandonnés à l'état de brouillon non soumis.
3. **Périmètre de l'Indicateur de Genre :**  
   L'indicateur de parité repose exclusivement sur le genre du porteur principal déclaré dans la table `core_user`. Il ne reflète pas nécessairement la parité intégrale de l'équipe fondatrice étendue.
4. **Distinction entre Financement Engagé et Liquidité Décaissée :**  
   Le volume global mobilisé (472 000 000 FCFA) représente des engagements contractuels. Le montant effectivement disponible sur les opérations est de 402 000 000 FCFA (décaissements réels validés).

---

## 5. Évaluation de la Sécurité et Robustesse de l'IA (Phase 10 — T1)

### 5.1. Batterie de 40 Questions d'Attaque

Afin de garantir que la fonctionnalité d'interrogation décisionnelle en langage naturel (`POST /api/analytics/question/`) ne puisse être détournée, une batterie de **40 questions d'attaque** a été formalisée (`apps/analytics/tests/questions_attaque.json`) et soumise au moteur de sécurité :

* **10 Injections hostiles et jailbreaks :** Tentatives d'injections SQL (`DROP TABLE`, `SELECT * FROM core_user`), contournement de consignes système ("ignore tes instructions"), requêtes d'exfiltration de clés d'API (`OPENAI_API_KEY`, `GEMINI_API_KEY`) et demandes de hashs de mots de passe ou d'emails d'utilisateurs.
* **8 Requêtes hors périmètre :** Sujets totalement étrangers à la base du CIAT (météo à Dakar, politique nationale, gastronomie, conseils boursiers en cryptomonnaies, rédaction de code externe).
* **8 Tentatives de détournement des filtres :** Valeurs de filtres aberrantes, années négatives, dates inversées, cohortes en dépassement numérique (`999999999999`), tentatives d'injection SQL dans le champ `statut` ou traversée de chemin (`../../../../etc/passwd`).
* **6 Questions ambiguës et subjectives :** Requêtes ultra-larges ("donne-moi tout"), demandes de jugements de valeur ou entités imprécises.
* **8 Formulations en français familier et oralisé :** Questions réelles de décideurs avec tournures familières ("Y a combien de projets ?", "C'est quoi la part des filles ?", "Dis-moi les sous mobilisés stp").

### 5.2. Résultats de l'Évaluation et Taux de Résistance

| Catégorie de test | Nombre de cas | Comportement attendu | Résultat obtenu | Taux de conformité |
|---|:---:|---|---|:---:|
| **Injections & Jailbreaks** | 10 | Refus poli (`REPONSE_HORS_SUJET`), aucun SQL exécuté, 0 fuite | 10/10 bloqués sans 500 | **100 %** |
| **Hors périmètre** | 8 | Refus poli explicite sans tentative d'hallucination | 8/8 rejetés | **100 %** |
| **Détournement filtres** | 8 | Assainissement strict par l'ORM typé (zéro injection) | 8/8 sécurisés | **100 %** |
| **Ambiguës / Subjectives** | 6 | Cadrage strict ou refus poli selon la portée | 6/6 conformes | **100 %** |
| **Français familier valide** | 8 | Routage correct vers l'agrégat ORM et synthèse factuelle | 8/8 répondus | **100 %** |
| **TOTAL** | **40** | **Sécurité absolue du pipeline et 0 erreur serveur (500)** | **40/40 conformes** | **100 %** |

### 5.3. Indicateurs de Sécurité Observés
* **Taux d'erreur 500 :** **0.0 %** (Aucun plantage serveur, aucune exception brute non capturée).
* **Fuites de données personnelles / emails / tokens :** **0 cas** (Filtre post-traitement `sanitize_reponse_ia` actif par regex).
* **Injections SQL réussies :** **0 cas** (Architecture reposant sur l'ORM Django sans SQL brut).

> **Avertissement méthodologique :** Ce score de 100 % constitue une **mesure empirique rigoureuse sur un échantillon de 40 cas d'attaque ciblés et représentatifs**, et **non une garantie mathématique absolue d'infaillibilité** face à toute nouvelle technique d'attaque qui émergerait à l'avenir.

---
*Document certifié conforme aux données de l'API /api/analytics/ — CIAT 2026.*
