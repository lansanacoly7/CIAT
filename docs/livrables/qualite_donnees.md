# CIAT — Contrôle et Assurance Qualité des Données

> **Module :** P3 — Tableau de bord décisionnel & Analyse de données  
> **Livrable :** Phase 3 — Tâche T1 (Data Analyst)  
> **Auteur :** Groupe de six apprenants : Lansana Coly, Pape Alioune Sène, Maimouna Sall, El Hadji Massogui Diop, Ibrahima Khalilou Diallo, Pathé Fall (Référent qualité : Pape Alioune Sène)  
> **Outil :** `python manage.py controle_qualite_donnees` (`backend/apps/analytics/management/commands/controle_qualite_donnees.py`)  
> **Statut :** Validé — 0 anomalie sur le jeu officiel `seed_all` (63 projets, 47 utilisateurs, 59 dossiers, 147 jalons, 50 financements, 48 partenariats)

---

## 1. Contexte & Objectifs

Dans le cadre du déploiement de la plateforme décisionnelle du Centre d'Innovation, d'Application et de Transfert (CIAT) de l'ISEP de Diamniadio, la fiabilité des indicateurs stratégiques repose sur une intégrité irréprochable des données sous-jacentes. 

Aucune donnée en dur (« mock data ») n'est tolérée sur les écrans : tous les agrégats proviennent de l'ORM Django. Dès lors, toute anomalie (valeur manquante, doublon, incohérence temporelle ou incompatibilité de workflow inter-modules) fausserait les taux de sélection, les statistiques de parité, les montants mobilisés ou le suivi des jalons de maturation.

Pour garantir la conformité continue des données, la commande d'audit en lecture seule `controle_qualite_donnees` a été développée.

---

## 2. Principes Fondamentaux de l'Audit

1. **Lecture Seule (Zero Side-Effects) :** La commande ne mute aucun enregistrement. Elle observe, diagnostique et rapporte.
2. **Double Mode de Sortie :**
   - **Mode Terminal :** Rapport visuel structuré par catégorie, pastilles de criticité `[CRITIQUE]`, `[AVERTISSEMENT]`, `[OK]`, et synthèse globale.
   - **Mode JSON (`--json`) :** Sortie sérialisable pour pipelines automatisés, monitoring ou intégration front-end.
3. **Mode Strict (`--strict`) :** Code de sortie non-nul (`sys.exit(1)`) en cas d'anomalie critique, utilisable comme barrière de contrôle qualité en intégration continue (CI/CD).
4. **Validation Croisée Inter-Modules :** Décloisonne l'analyse en corrélant les modèles `core` (Projets, Utilisateurs, Cohortes), `incubator` (Dossiers, Décisions, Jalons, Mentors, Évaluations), `gallery` (Fiches d'innovation) et `analytics` (Partenariats, Financements).

---

## 3. Matrice Exhaustive des 17 Contrôles de Qualité

Les contrôles sont répartis en 5 catégories méthodologiques :

### Catégorie 1 : Valeurs manquantes & Complétude

| Code Contrôle | Sévérité | Règle Métier | Justification |
|---|---|---|---|
| `PROJET_TITRE_MANQUANT` | **CRITIQUE** | Tout projet doit posséder un titre non nul et non vide. | Identifiant humain principal du projet à travers toute la plateforme. |
| `PROJET_RESUME_MANQUANT` | **CRITIQUE** | Le résumé du projet ne doit pas être vide ou constitué uniquement d'espaces blancs. | Indispensable pour l'indexation vectorielle RAG de l'assistant IA et la lecture par le comité. |
| `PROJET_DOMAINE_MANQUANT` | **CRITIQUE** | Un projet doit être rattaché à l'un des 7 domaines d'intervention prioritaires du CIAT. | Conditionne la répartition sectorielle et l'allocation des guichets techniques. |
| `PROJET_COHORTE_MANQUANTE` | **CRITIQUE** | Un projet doit obligatoirement être affecté à une promotion/cohorte annuelle. | Nécessaire pour le calcul des indicateurs de cohorte et les comparaisons annuelles. |
| `PROJET_PORTEUR_MANQUANT` | **CRITIQUE** | Tout projet doit être associé à un compte porteur de projet valide. | Responsabilité juridique, authentification et gestion des droits d'accès. |
| `USER_GENRE_MANQUANT` | **AVERTISSEMENT** | Les porteurs de projets doivent renseigner leur genre (`H`, `F` ou `A`). | Prérequis pour les statistiques d'inclusion et le calcul du taux de féminisation exigé par les bailleurs. |
| `DOSSIER_SANS_PROJET` | **CRITIQUE** | Tout dossier de candidature doit être rattaché à un projet existant. | Évite les dossiers orphelins dans le circuit d'évaluation. |

---

### Catégorie 2 : Unicité & Détection des Doublons

| Code Contrôle | Sévérité | Règle Métier | Justification |
|---|---|---|---|
| `PROJET_TITRE_DOUBLON` | **CRITIQUE** | Deux projets distincts ne peuvent pas porter le même titre (normalisation insensible à la casse et aux espaces). | Empêche les soumissions accidentelles multiples et la confusion dans la galerie et le dashboard. |
| `USER_EMAIL_DOUBLON` | **CRITIQUE** | Deux utilisateurs ne peuvent pas posséder la même adresse email normalisée. | Clé d'authentification unique (JWT) sur toute la plateforme. |
| `FICHE_PROJET_DOUBLON` | **AVERTISSEMENT** | Un projet ne doit pas disposer de fiches d'innovation multiples simultanément actives. | Évite la pollution de la vitrine publique des innovations. |

---

### Catégorie 3 : Incohérences Temporelles & Chronologie Métier

| Code Contrôle | Sévérité | Règle Métier | Justification |
|---|---|---|---|
| `COHORTE_DATES_INVERSEES` | **CRITIQUE** | La date de fin d'une cohorte doit être strictement postérieure à sa date de début (`date_fin > date_debut`). | Cohérence du calendrier annuel d'incubation. |
| `DECISION_AVANT_DEPOT` | **CRITIQUE** | Une décision du comité ne peut pas être enregistrée avant la date effective de soumission du dossier (`decision.cree_le >= dossier.soumis_le`). | Respect strict de la procédure légale et de la chronologie d'instruction. |
| `JALON_AVANT_PROJET` | **CRITIQUE** | L'échéance d'un jalon d'incubation ne peut être antérieure à la création du projet (`jalon.echeance >= projet.cree_le.date()`). | Un projet ne peut pas valider d'étape avant d'avoir été formalisé en base. |
| `FINANCEMENT_AVANT_PROJET` | **CRITIQUE** | La date d'octroi ou de décaissement d'un financement ne peut précéder la création du projet (`financement.date >= projet.cree_le.date()`). | Aucune allocation de fonds ne peut précéder l'existence institutionnelle de l'initiative. |
| `PARTENARIAT_AVANT_PROJET` | **CRITIQUE** | La date d'effet d'un partenariat ne peut précéder la date de création du projet (`partenariat.date_debut >= projet.cree_le.date()`). | Empêche l'attribution anachronique d'accords partenariaux. |

---

### Catégorie 4 : Incompatibilités Inter-Modules & Statuts Croisés

| Code Contrôle | Sévérité | Règle Métier | Justification |
|---|---|---|---|
| `STATUT_IDEE_AVEC_DOSSIER` | **CRITIQUE** | Un projet au stade initial « idée » ne peut posséder de dossier de candidature déjà soumis ou validé. | Dès qu'un dossier est déposé, le statut du projet bascule à `depose` ou `selectionne`. |
| `STATUT_REJETE_AVEC_FINANCEMENT` | **CRITIQUE** | Un projet « idée » ou « rejeté » ne peut bénéficier de financement accordé ou décaissé. | Sauvegarde des deniers publics et des subventions des partenaires (DER, 3FPT, etc.). |
| `STATUT_REJETE_AVEC_PARTENARIAT` | **CRITIQUE** | Un projet « idée » ou « rejeté » ne peut détenir de partenariat formellement actif ou signé. | Protège la crédibilité institutionnelle des engagements du CIAT. |
| `FICHE_PUBLIEE_NON_ELIGIBLE` | **CRITIQUE** | Seuls les projets parvenus aux stades `selectionne`, `incube`, `prototype` ou `termine` peuvent faire l'objet d'une fiche publiée dans la Galerie des innovations. | La vitrine publique ne doit exposer que des prototypes réels et validés. |
| `PROJET_INCUBE_SANS_MENTOR` | **AVERTISSEMENT** | Tout projet incubé (`statut='incube'`) doit avoir au moins un mentor attitré. | Garantie de la qualité d'accompagnement individualisé du programme CIAT. |

---

### Catégorie 5 : Valeurs Hors Plage & Intégrité Numérique

| Code Contrôle | Sévérité | Règle Métier | Justification |
|---|---|---|---|
| `FINANCEMENT_MONTANT_INVALIDE` | **CRITIQUE** | Tout financement enregistré doit avoir un montant strictement supérieur à 0 FCFA. | Évite les lignes comptables nulles ou erronées. |
| `FINANCEMENT_MONTANT_ABERRANT` | **AVERTISSEMENT** | Les financements individuels ne doivent pas excéder 5 000 000 000 FCFA (5 Mds). | Détecte les erreurs de frappe (zéros surnuméraires) sur la monnaie locale. |
| `COHORTE_ANNEE_HORS_PLAGE` | **AVERTISSEMENT** | L'année d'une cohorte doit se situer dans la fenêtre réaliste du centre [2020, 2035]. | Détection de dates anachroniques (ex. 1990 ou 2099). |
| `NOTE_EVALUATION_HORS_PLAGE` | **CRITIQUE** | Une note d'évaluation ne peut être négative ni excéder le barème maximum défini sur le critère (`0 <= note <= critere.note_max`). | Garantit la rigueur mathématique des délibérations du comité de sélection. |
| `EVALUATION_SCORE_HORS_PLAGE` | **CRITIQUE** | Le score global calculé d'un dossier doit obligatoirement être compris entre 0.0 et 20.0. | Cohérence de la grille standard CIAT normalisée sur 20. |

---

## 4. Mode d'Emploi

### A. Exécution standard (Console terminal)
```bash
python manage.py controle_qualite_donnees
```

### B. Sortie au format JSON (Automation / APIs)
```bash
python manage.py controle_qualite_donnees --json
```

### C. Contrôle strict pour pipeline CI/CD
```bash
python manage.py controle_qualite_donnees --strict
# Retourne le code 0 si la base est saine, 1 si une anomalie critique est détectée.
```

---

## 5. Preuve de Conformité sur le Jeu de Référence (`seed_all`)

Exécution réelle constatée en date du 28 octobre 2026 :

```text
================================================================================
  CIAT — CONTRÔLE DE LA QUALITÉ DES DONNÉES (AUDIT AUTOMATISÉ)
  Horodatage : 2026-10-28T01:33:36.690376
================================================================================

[+] PERIMETRE DE LA BASE AUDITEE :
  - Projets : 63 | Utilisateurs : 47 | Cohortes : 3
  - Dossiers : 59 | Décisions : 53 | Jalons : 147
  - Fiches Galerie : 23 | Financements : 50 | Partenariats : 48
  - Évaluations : 110 | Notes : 550

--------------------------------------------------------------------------------
[+] RESULTATS PAR CATEGORIE DE CONTROLE :
--------------------------------------------------------------------------------

1. Valeurs manquantes et complétude : [OK] - 0 anomalie détectée

2. Unicité et détection de doublons : [OK] - 0 anomalie détectée

3. Incohérences temporelles et chronologie : [OK] - 0 anomalie détectée

4. Statuts incompatibles inter-modules : [OK] - 0 anomalie détectée

5. Valeurs hors plage et bornes numériques : [OK] - 0 anomalie détectée

================================================================================
[SUCCES] Base 100% conforme. 0 anomalie detectee sur 63 projets et l'ensemble des modules.
================================================================================
```

---

## 6. Couverture de Tests Automatisés

La suite `apps.analytics.tests.DataQualityControlCommandTests` valide le comportement du moteur d'audit :
- **Injection volontaire de défauts :** Chaque anomalie (résumé vide, cohorte inversée, financement anachronique, fiche publiée sur projet idée, doublon insensible à la casse, note hors barème) est injectée séparément et vérifiée par son code précis.
- **Vérification de la base saine :** Confirme que la base nominale ne génère aucun faux positif.
- **Temps d'exécution :** Moins de 3.2 secondes pour 44 tests unitaires complets.
