# Module P2 — Gestion de l'incubateur

> **Auteur :** Ibrahima Khalilou Diallo (Kalz)  
> **Domaine :** Back-end Django REST Framework  
> **Emplacement du code :** `backend/apps/incubator/`  
> **Préfixe API :** `/api/incubator/`  
> **Branche de travail :** `Kalz`  

---

## 1. Vue d'ensemble

Le module **P2 (Gestion de l'incubateur)** est le cœur opérationnel de la plateforme CIAT. Il gère :
1. Le cycle de vie des **dossiers de candidature** rattachés aux projets d'innovation portés par les apprenants et chercheurs de l'ISEP Amadou Traoré.
2. Le **dépôt sécurisé et le contrôle de complétude des pièces jointes** (validation de taille, vérification des signatures binaires / magic bytes et assainissement des noms de fichiers).
3. La **grille d'évaluation multicritère unique et active**, avec validation d'exhaustivité des critères lors des notations du jury.
4. Les **évaluations confidentielles et le calcul du score pondéré** sur 20.
5. La **décision finale motivée**, protégée par verrous transactionnels et mise à jour atomique des statuts du dossier et du projet.

---

## 2. Modèles de Données (`apps.incubator.models`)

### 2.1. `Dossier`
- **Relations :** `OneToOneField` vers `apps.core.models.Projet`.
- **Statuts possibles (`statut`) :**
  - `brouillon` (par défaut lors de la création par le porteur)
  - `soumis` (dossier validé et transmis au comité, fige les pièces pour le porteur)
  - `complet`
  - `en_evaluation` (dès qu'un membre du comité commence la notation)
  - `accepte` (projet admis en incubation)
  - `refuse` (projet non retenu)
- **Propriétés & Méthodes :**
  - `pieces_manquantes` : liste des types obligatoires absents (`fiche_projet`, `presentation_equipe`, `budget_previsionnel`).
  - `completude` : pourcentage calculé dynamiquement (`0%`, `33%`, `66%`, `100%`).
  - `est_complet` : booléen (`True` si aucune pièce obligatoire ne manque).
  - `soumettre()` : valide l'état `brouillon`, contrôle la complétude, enregistre `soumis_le` et fait passer le projet à `depose`.
  - `commencer_evaluation()` : bascule automatiquement l'état vers `en_evaluation` dès la première notation.

### 2.2. `Piece`
- **Relations :** `ForeignKey` vers `Dossier`.
- **Types de pièces (`type`) :**
  - `fiche_projet` *(obligatoire)*
  - `presentation_equipe` *(obligatoire)*
  - `budget_previsionnel` *(obligatoire)*
  - `autre` *(facultatif)*
- **Fichier (`fichier`) :**
  - Nom assaini via `sanitize_filename()` (slugification et suppression des caractères de path traversal `../`).
  - Limite de taille : **10 Mo maximum**, rejet des fichiers vides (0 octet).
  - Contrôle binaire (`validate_file_content`) : vérification des magic bytes (PDF `%PDF-`, PNG, JPEG, WEBP, DOCX `PK..`, DOC).

### 2.3. `Grille` et `Critere`
- **`Grille` :** définit la grille de notation.
  - **Unicité garantie :** `unique_grille_active` empêche l'existence de plusieurs grilles actives en base de données.
  - La méthode `save()` désactive automatiquement les anciennes grilles actives lors de l'activation d'une nouvelle grille.
- **`Critere` :**
  - `libelle`, `poids`, `note_max` (par défaut 20), `ordre`.
- **Grille par défaut CIAT (initialisée via `python manage.py seed_incubator`) :**
  1. *Pertinence du problème et adéquation de la solution* (poids 1, note max 20)
  2. *Caractère innovant et faisabilité technique* (poids 1, note max 20)
  3. *Modèle économique et viabilité financière* (poids 1, note max 20)
  4. *Compétences, profil et complémentarité de l'équipe* (poids 1, note max 20)
  5. *Impact socio-économique, création de valeur et durabilité* (poids 1, note max 20)

### 2.4. `Evaluation` et `Note`
- **`Evaluation` :**
  - Liée au `Dossier` et à l'utilisateur `evaluateur` (`User`).
  - Contrainte d'unicité : un membre du comité ne peut évaluer un dossier qu'une seule fois (`unique_evaluation_par_evaluateur`).
  - Obligation de noter **l'intégralité** des critères de la grille active (rejet des notations partielles).
  - Formule de score pondéré normalisée sur 20 :
    $$\text{Score} = \frac{\sum ((\text{note} / \text{note\_max}) \times 20 \times \text{poids})}{\sum \text{poids}}$$

### 2.5. `Decision`
- **Relations :** `OneToOneField` vers `Dossier`.
- **Règles :**
  - Réservé exclusivement au coordonnateur et à l'administrateur.
  - Motif obligatoire et non vide.
  - Dossier dans un état éligible (non brouillon, non déjà décidé).
  - Mise à jour atomique :
    - `accepte` $\rightarrow$ dossier `accepte`, projet `selectionne`.
    - `refuse` $\rightarrow$ dossier `refuse`, projet `rejete`.

### 2.6. `AffectationMentor` (Phase 2 - T1)
- **Relations :**
  - `OneToOneField` vers `apps.core.models.Projet` (`related_name="affectation_mentor"`).
  - `ForeignKey` vers `apps.core.models.User` (`role=Role.MENTOR`).
  - `ForeignKey` vers `apps.core.models.User` (`affecte_par`).
- **Règles :**
  - L'utilisateur affecté doit obligatoirement posséder le rôle `mentor`.
  - Seuls l'administrateur et le coordonnateur peuvent affecter ou réassigner un mentor.
  - **Filtrage des projets :** Un mentor accédant à l'endpoint `/api/projets/` ne visualise que les projets qui lui sont explicitement affectés.

### 2.7. `Objectif` (Phase 2 - T1)
- **Relations :**
  - `ForeignKey` vers `apps.core.models.Projet` (`related_name="objectifs"`).
  - `ForeignKey` vers `apps.core.models.User` (`cree_par`).
- **Statuts possibles (`statut`) :**
  - `a_faire` (par défaut)
  - `en_cours`
  - `atteint`
  - `annule`
- **Règles :**
  - Seul le mentor affecté au projet ou l'équipe CIAT peut créer (`POST`) ou modifier (`PATCH`) un objectif.
  - Le porteur du projet bénéficie d'un accès en lecture seule (`GET`) pour suivre sa feuille de route, tout refus d'écriture étant sanctuarisé (`HTTP 403`).
  - Les mentors non affectés au projet se voient refuser l'accès (`HTTP 403`).

---

## 3. Matrice des Rôles et Contrats d'API

Toutes les routes sont sous `/api/incubator/`.

| Méthode | Route | Description & Contrat | Droits d'accès |
|---|---|---|---|
| `GET` | `/api/incubator/mentors/` | Liste des mentors disponibles (`MentorUserSerializer`). | Coordonnateur, Administrateur |
| `POST` | `/api/incubator/projets/{id}/mentor/` | Affecte ou met à jour le mentor (`{ "mentor": <id> }`). | Coordonnateur, Administrateur |
| `GET` | `/api/incubator/projets/{id}/objectifs/` | Liste des objectifs d'accompagnement du projet. | Équipe, Mentor affecté, Porteur (lecture) |
| `POST` | `/api/incubator/projets/{id}/objectifs/` | Création d'un objectif d'accompagnement (`libelle`, `echeance`). | Équipe, Mentor affecté |
| `PATCH` | `/api/incubator/objectifs/{id}/` | Mise à jour d'un objectif (`statut`, `libelle`, `echeance`). | Équipe, Mentor affecté |
| `GET` | `/api/incubator/dossiers/` | Liste les dossiers. Filtré par porteur pour les porteurs ; complet pour comité et équipe. | Authentifié |
| `POST` | `/api/incubator/dossiers/` | Crée un dossier : supporte `{ "projet": <id> }` et `{ "projet_id": <id> }`. | Porteur propriétaire, Admin, Coordo |
| `GET` | `/api/incubator/dossiers/{id}/` | Détail complet d'un dossier. | Propriétaire ou Équipe/Comité/Mentor |
| `PATCH` | `/api/incubator/dossiers/{id}/` | Modification (projet strictement immuable ; porteur bloqué si statut != brouillon). | Propriétaire ou Équipe |
| `POST` | `/api/incubator/dossiers/{id}/pieces/` | Dépôt multipart sécurisé (contrôle binaire). | Propriétaire ou Équipe (dossier brouillon) |
| `DELETE` | `/api/incubator/dossiers/{id}/pieces/{id}/` | Suppression de pièce. | Propriétaire ou Équipe (dossier brouillon) |
| `POST` | `/api/incubator/dossiers/{id}/soumettre/` | Soumission officielle (verrou transactionnel `select_for_update`). | Propriétaire ou Équipe |
| `GET` | `/api/incubator/grilles/actuelle/` | Consultation de la grille active et de ses critères. | Authentifié |
| `GET` | `/api/incubator/dossiers/{id}/evaluations/` | Consultation confidentielle des évaluations et `score_moyen`. | Comité, Mentors, Équipe *(Interdit aux porteurs)* |
| `POST` | `/api/incubator/dossiers/{id}/evaluations/` | Dépôt de notation sur tous les critères de la grille active. | Membre du comité, Équipe |
| `POST` | `/api/incubator/dossiers/{id}/decision/` | Dépôt de la décision motivée finale. | Coordonnateur, Administrateur |


---

## 4. Sécurité & Production

- **Vérification en production (`settings.py`) :**
  - Django lève une exception critique `ImproperlyConfigured` si `DJANGO_DEBUG=0` sans que `DJANGO_SECRET_KEY` ne soit explicitement définie avec une clé forte.
  - En-têtes HTTPS activés : `SECURE_HSTS_SECONDS=31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS=True`, `SECURE_CONTENT_TYPE_NOSNIFF=True`, `X_FRAME_OPTIONS="DENY"`.
- **Protection des pièces téléversées :**
  - Validation magique des en-têtes (magic bytes) évitant l'exécution de scripts déguisés en PDF ou images.
  - Assainissement des chemins (`sanitize_filename`).

---

## 5. Validation et Tests Automatisés

```bash
# Vérifications d'intégrité
python manage.py check                     # 0 issue
python manage.py makemigrations --check    # No changes detected

# Suite de tests complète (34 tests automatisés)
python manage.py test apps.incubator
```

**Couverture des 34 tests :**
- **12 tests d'authentification et de sécurité des rôles (Phase 1) :** Rejet anonyme, isolation multi-porteurs, immutabilité de `projet`, confidentialité des jurys, restrictions par rôle.
- **11 tests de règles métier et cycle de vie (Phase 1) :** Parcours complet nominal, interdiction d'évaluation sur brouillon ou après décision, critères d'autres grilles rejetés, complétude des critères, note hors limites, unicité de grille active, double évaluation, double décision, concurrence de soumission.
- **4 tests de sécurité des fichiers (Phase 1) :** Validation de signature PDF, rejet de fichier vide (0 octet), rejet de fichier avec extension spoofée, assainissement anti path traversal.
- **7 tests Phase 2 - T1 (Mentors & Objectifs) :**
  1. Restriction de la liste des mentors à l'équipe (`admin`, `coordo`) avec rejet anonyme, porteur et mentor.
  2. Affectation de mentor par le coordonnateur et rejet avec 400 d'un utilisateur non-mentor.
  3. Réassignation par l'administrateur.
  4. Interdiction d'affectation aux porteurs et mentors (403).
  5. Isolation des projets dans `/api/projets/` : un mentor ne voit que les projets qui lui sont assignés.
  6. Sanctuarisation des objectifs : le porteur a un accès en lecture seule et ne peut ni POST ni PATCH (403).
  7. Gestion par le mentor affecté (création et mise à jour) et rejet d'un mentor tiers non affecté (403).

