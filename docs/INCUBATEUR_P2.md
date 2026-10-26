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
2. Le **dépôt et le contrôle de complétude des pièces jointes** exigées (documents administratifs, techniques et financiers).
3. La **grille d'évaluation multicritère** et les notations individuelles des membres du comité de sélection.
4. La **décision motivée** prise par le coordonnateur ou l'administrateur, déclenchant l'admission du projet en incubation.

---

## 2. Modèles de Données (`apps.incubator.models`)

### 2.1. `Dossier`
- **Relations :** `OneToOneField` vers `apps.core.models.Projet`.
- **Statuts possibles (`statut`) :**
  - `brouillon` (par défaut lors de la création par le porteur)
  - `soumis` (dossier validé et transmis au comité)
  - `complet`
  - `en_evaluation` (dès qu'un membre du comité commence la notation)
  - `accepte` (projet admis en incubation)
  - `refuse` (projet non retenu)
- **Propriétés calculées :**
  - `pieces_manquantes` : liste des types obligatoires absents (`fiche_projet`, `presentation_equipe`, `budget_previsionnel`).
  - `completude` : pourcentage calculé dynamiquement (`0%`, `33%`, `66%`, `100%`).
  - `est_complet` : booléen (`True` si aucune pièce obligatoire ne manque).
- **Méthode `soumettre()` :**
  - Refuse la soumission si le dossier est incomplet (`ValidationError`).
  - Enregistre `soumis_le = timezone.now()`.
  - Fait évoluer le statut du projet associé de `idee` à `depose`.

### 2.2. `Piece`
- **Relations :** `ForeignKey` vers `Dossier`.
- **Types de pièces (`type`) :**
  - `fiche_projet` *(obligatoire)*
  - `presentation_equipe` *(obligatoire)*
  - `budget_previsionnel` *(obligatoire)*
  - `autre` *(facultatif)*
- **Fichier (`fichier`) :**
  - Stockage dans `incubator/pieces/<dossier_id>/<nom_fichier>`.
  - Limite de taille stricte : **10 Mo maximum**.
  - Formats acceptés : `pdf`, `doc`, `docx`, `png`, `jpg`, `jpeg`, `webp`.

### 2.3. `Grille` et `Critere`
- **`Grille` :** définit une grille de critères active pour les jurys de sélection.
- **`Critere` :**
  - `libelle` (intitulé)
  - `poids` (coefficient de pondération)
  - `note_max` (plafond de notation, par exemple 20)
  - `ordre` (ordre d'affichage)
- **Grille par défaut CIAT (initialisée via `python manage.py seed_incubator`) :**
  1. *Pertinence du problème et adéquation de la solution* (poids 1, note max 20)
  2. *Caractère innovant et faisabilité technique* (poids 1, note max 20)
  3. *Modèle économique et viabilité financière* (poids 1, note max 20)
  4. *Compétences, profil et complémentarité de l'équipe* (poids 1, note max 20)
  5. *Impact socio-économique, création de valeur et durabilité* (poids 1, note max 20)

### 2.4. `Evaluation` et `Note`
- **`Evaluation` :**
  - Liée au `Dossier` et à l'utilisateur `evaluateur` (`User`).
  - Contrainte d'unicité : un membre du comité ne peut évaluer un dossier qu'une seule fois.
  - Propriété `score` : moyenne pondérée normalisée sur 20.
- **`Note` :**
  - Associe une note chiffrée à un `Critere` pour une `Evaluation` donnée.

### 2.5. `Decision`
- **Relations :** `OneToOneField` vers `Dossier`.
- **Champs :**
  - `decision` : `accepte` ou `refuse`.
  - `motif` : texte obligatoire motivant le choix du jury.
  - `decide_par` : `ForeignKey` vers `User` (réservé au coordonnateur et à l'administrateur).
- **Méthode `appliquer()` :**
  - Si `accepte` : `dossier.statut = "accepte"`, `projet.statut = "selectionne"`.
  - Si `refuse` : `dossier.statut = "refuse"`, `projet.statut = "rejete"`.

---

## 3. Contrats d'API et Endpoints

Toutes les routes sont préfixées par `/api/incubator/`.

### 3.1. Dossiers de candidature
| Méthode | Route | Description | Droits d'accès |
|---|---|---|---|
| `GET` | `/api/incubator/dossiers/` | Liste les dossiers. Un porteur ne voit que ses dossiers ; l'équipe, le comité et les mentors les voient tous. | Authentifié |
| `POST` | `/api/incubator/dossiers/` | Crée un dossier : `{"projet_id": <id>}` | Porteur propriétaire ou Équipe |
| `GET` | `/api/incubator/dossiers/{id}/` | Détail complet d'un dossier avec complétude et pièces | Propriétaire ou Équipe/Comité |
| `PATCH` | `/api/incubator/dossiers/{id}/` | Modification (interdite pour un porteur si déjà soumis) | Propriétaire ou Équipe |
| `POST` | `/api/incubator/dossiers/{id}/pieces/` | Dépôt d'une pièce jointe (`multipart/form-data`) | Propriétaire ou Équipe (dossier brouillon) |
| `DELETE` | `/api/incubator/dossiers/{id}/pieces/{piece_id}/` | Suppression d'une pièce | Propriétaire ou Équipe (dossier brouillon) |
| `POST` | `/api/incubator/dossiers/{id}/soumettre/` | Soumission officielle du dossier (refusée si incomplet) | Propriétaire ou Équipe |

### 3.2. Grille & Évaluations
| Méthode | Route | Description | Droits d'accès |
|---|---|---|---|
| `GET` | `/api/incubator/grilles/actuelle/` | Retourne la grille active et la liste des critères | Authentifié |
| `GET` | `/api/incubator/dossiers/{id}/evaluations/` | Liste des évaluations du dossier avec `score_moyen` | Comité, Mentors, Équipe |
| `POST` | `/api/incubator/dossiers/{id}/evaluations/` | Dépôt d'une évaluation : `{"notes": [{"critere": 1, "note": 16.0}], "avis": "..."}` | Membre du comité, Équipe |

### 3.3. Décision motivée
| Méthode | Route | Description | Droits d'accès |
|---|---|---|---|
| `POST` | `/api/incubator/dossiers/{id}/decision/` | Dépôt de la décision finale : `{"decision": "accepte"\|"refuse", "motif": "..."}` | Coordonnateur, Administrateur |

---

## 4. Exemples de Payloads JSON

### Consultation d'un dossier (`GET /api/incubator/dossiers/1/`)
```json
{
  "id": 1,
  "projet": {
    "id": 4,
    "titre": "AgriSol"
  },
  "statut": "brouillon",
  "completude": 66,
  "pieces": [
    {
      "id": 9,
      "type": "fiche_projet",
      "nom": "fiche_technique.pdf",
      "fichier": "http://localhost:8000/media/incubator/pieces/1/fiche_technique.pdf",
      "depose_le": "2026-10-26T10:00:00Z"
    },
    {
      "id": 10,
      "type": "presentation_equipe",
      "nom": "cv_equipe.docx",
      "fichier": "http://localhost:8000/media/incubator/pieces/1/cv_equipe.docx",
      "depose_le": "2026-10-26T10:05:00Z"
    }
  ],
  "pieces_manquantes": [
    "budget_previsionnel"
  ],
  "soumis_le": null,
  "cree_le": "2026-10-26T09:30:00Z",
  "modifie_le": "2026-10-26T10:05:00Z"
}
```

### Évaluation du comité (`POST /api/incubator/dossiers/1/evaluations/`)
```json
{
  "notes": [
    { "critere": 1, "note": 17.5 },
    { "critere": 2, "note": 16.0 },
    { "critere": 3, "note": 14.0 },
    { "critere": 4, "note": 18.0 },
    { "critere": 5, "note": 16.5 }
  ],
  "avis": "Excellente proposition, équipe pluridisciplinaire solide et impact direct sur la région de Thiès."
}
```

### Décision finale (`POST /api/incubator/dossiers/1/decision/`)
```json
{
  "decision": "accepte",
  "motif": "Dossier conforme aux critères d'innovation et validé à l'unanimité par le comité de sélection."
}
```

---

## 5. Commandes de Validation & Tests

### Initialisation des critères par défaut
```bash
python manage.py seed_incubator
```

### Exécution des tests automatisés
```bash
python manage.py test apps.incubator
```
*Résultat : 4 tests exécutés avec succès (couverture intégrale des scénarios de dépôt, contrôles de complétude, sécurité, soumission, évaluations multiples avec score moyen et décision finale).*

### Vérification Django & Migrations
```bash
python manage.py check
python manage.py makemigrations --check
```
