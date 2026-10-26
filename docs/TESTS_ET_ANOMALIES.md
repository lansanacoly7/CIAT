# Journal des Tests de Bout en Bout et Registre des Anomalies

> **Plateforme CIAT (Centre d'Innovation et d'Accélération Technologique)**  
> **Auteur :** Lansana Coly (Lead technique) — Phase 3  
> **Référence :** `taches/phase3/lansana.md` (Tâche T3)  
> **Suite de test automatisée :** `backend/apps/core/tests/test_parcours_complet.py`  
> **Temps d'exécution :** ~0,66 seconde (seuil exigé : < 30 secondes, optimisé avec `MD5PasswordHasher`)

---

## 1. Périmètre et Objectifs du Parcours Complet

La tâche **T3** a pour vocation de valider de bout en bout l'interconnexion de l'ensemble des modules applicatifs de la plateforme CIAT (socle Core, Incubateur P2, Documents P5, Galerie des innovations P6, Assistant P4) à travers des scénarios réels d'utilisateurs.

Chaque étape du cycle de vie valide deux dimensions indispensables :
1. **Le parcours nominal et alternatif** (flux fonctionnel complet et transitions de statuts).
2. **Le contrôle des droits et de la sécurité (RBAC)** : validation systématique de ce que chaque rôle **ne doit pas** pouvoir faire (retours HTTP 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict).

---

## 2. Matrice de Couverture des Tests de Bout en Bout

| Étape | Action testée | Acteurs impliqués | Endpoints API | Contrôles positifs | Contrôles négatifs (RBAC & Validations) |
|---|---|---|---|---|---|
| **Étape 1** | Inscription & Authentification | Porteur (visiteur) | `POST /api/auth/register/`<br>`POST /api/auth/token/`<br>`GET /api/auth/me/` | Compte créé en rôle `porteur` (201), émission des tokens JWT `access` & `refresh` (200), profil valide. | Rejet des emails en double (400), rejet des mots de passe trop courts / faibles (400). |
| **Étape 2** | Projet & Dossier de candidature | Porteur | `POST /api/projets/`<br>`POST /api/incubator/dossiers/`<br>`POST .../pieces/`<br>`POST .../soumettre/` | Projet créé au statut `idee` (201), dossier en `brouillon` (201), calcul dynamique de la complétude (0% ➔ 33% ➔ 100%), soumission réussie (200, statut projet ➔ `depose`). | Interdiction d'accès pour un autre porteur (403), interdiction de soumettre sans les 3 pièces obligatoires (400), refus de dépôt anonyme (401), refus d'ajout/suppression après soumission (400). |
| **Étape 3** | Évaluation multicritère | Membre du comité | `POST .../dossiers/{id}/evaluations/`<br>`GET .../dossiers/{id}/evaluations/` | Saisie des notes sur les 5 critères de la grille active (201), calcul automatique du score moyen (200), passage du dossier à `en_evaluation`. | Auto-évaluation par le porteur interdite (403), tentative d'évaluation anonyme (401), tentative de double évaluation par le même membre (400). |
| **Étape 4** | Décision motivée du jury | Coordonnateur | `POST .../dossiers/{id}/decision/` | Décision motivée enregistrée (201) ; acceptation ➔ statut dossier `accepte` et projet `selectionne` ; refus ➔ dossier `refuse` et projet `rejete`. | Prise de décision interdite au membre du comité (403) et au porteur (403), interdiction de redécider un dossier déjà statué (400). |
| **Étape 5** | Mentorat, Jalons & Alertes de retard | Coordonnateur, Mentor | `POST .../projets/{id}/mentor/`<br>`POST .../objectifs/`<br>`POST .../jalons/`<br>`GET /api/incubator/alertes/`<br>`POST .../commentaires/` | Affectation du mentor par le coordonnateur (200), création d'objectifs (201), détection immédiate des jalons dont l'échéance est dépassée dans `/alertes/` (200, `en_retard=True`), dépôt de commentaire d'alerte (201). | Affectation de mentor interdite au porteur (403), interdiction de commenter un jalon d'un projet tiers non affecté (403). |
| **Étape 6** | Galerie des innovations (P6) | Porteur, Coordonnateur, Visiteur anonyme | `POST /api/gallery/fiches/`<br>`POST .../soumettre/`<br>`POST .../valider/`<br>`GET /api/gallery/fiches/{slug}/`<br>`GET .../qr/` | Création de la fiche en `brouillon` (201), passage en `en_validation` (200), validation en `publie` par le coordonnateur (200), consultation publique anonyme (200) avec incrémentation des vues et génération du QR code PNG. | Création de fiche sur le projet d'autrui interdite (403), fiche brouillon invisible au public (404), auto-validation par le porteur interdite (403), zéro fuite de données personnelles (email/téléphone absents). |
| **Étape 7** | Documents officiels & Export (P5) | Coordonnateur, Équipe CIAT | `POST /api/documents/generer/`<br>`PATCH /api/documents/{id}/`<br>`GET .../versions/`<br>`POST .../valider/`<br>`GET .../export/?format=pdf` | Génération assistée par IA simulée (201, version 1 en `brouillon`), modification de section avec création de version 2 (200), validation du document (200), export binaire PDF conforme à la charte CIAT (200, signature `%PDF-`). | Génération anonyme refusée (401), modification interdite sur un document au statut `valide` ou `publie` (409 Conflict). |

---

## 3. Registre des Anomalies et État de Traitement

| Réf. | Module / Composant | Description de l'anomalie | Gravité | Responsable | État | Mesure corrective / Solution apportée |
|---|---|---|---|---|---|---|
| **ANO-01** | `apps.documents` (Commandes) | **Erreur de syntaxe bloquante** : `from apps.documents.migrations.0002_seed_documents import INITIAL_DATA` générait un `SyntaxError: invalid decimal literal` au chargement de Python. | **Bloquant** | Lansana | **Corrigée** | Remplacement par un import dynamique via `importlib.import_module("apps.documents.migrations.0002_seed_documents")`. |
| **ANO-02** | `apps.assistant` (Services RAG) | **Rétention indue des sources documentaires en cas de refus** : lorsque l'assistant refusait de répondre car les documents ne contenaient pas la réponse, `sources` renvoyait néanmoins les passages transmis. | **Majeur** | Lansana | **Corrigée** | Ajout des filtres `reponse_est_un_refus` et `filtrer_sources_utilisees` dans `services.py`. La liste `sources` est désormais vidée lors d'un refus et ne retient que les passages dont le contenu ou le titre est réellement mobilisé dans la réponse. |
| **ANO-03** | `apps.core` (Modèle User) | **Format strict du champ `genre`** : Le modèle `User` attend les codes à 1 caractère (`"F"`, `"H"`, `"A"`), alors que certains formulaires ou tests envoyaient la chaîne `"femme"`, provoquant une `ValidationError (400)`. | **Mineur** | Lansana | **Corrigée** | Documentation et harmonisation des données de test sur les choix canoniques du modèle (`User.Genre.choices`). |
| **ANO-04** | `apps.analytics` (Seed) | **Absence de commande `seed_analytics`** : La commande `seed_all` risquait d'échouer si la commande analytique n'était pas encore fusionnée. | **Majeur** | Alioune | **Corrigée (Contournement sécurisé)** | Appel conditionnel et tolérant aux pannes implémenté dans `seed_all.py` via `get_commands()` afin de ne pas bloquer l'initialisation. |
| **ANO-05** | `apps.gallery` (Sécurité P6) | **Risque d'exposition de coordonnées privées** : Risque d'inclusion d'adresses email ou numéros de téléphone du porteur dans le descriptif d'équipe sur les fiches publiques. | **Critique** | Lansana & Massogui | **Corrigée & Validée** | Contrôle strict dans `seed_all` (nettoyage systématique) et assertion négative automatisée dans le test de bout en bout (`assertNotIn` pour l'email et le téléphone sur l'endpoint public). |
| **ANO-06** | `apps.documents` (Workflow P5) | **Intégrité juridique des documents officiels** : Nécessité de garantir qu'une version validée ou publiée ne puisse plus être altérée par un appel `PATCH`. | **Majeur** | Lansana | **Validée conforme** | L'endpoint renvoie strictement un code `409 Conflict` si le document n'est plus à l'état `brouillon`. |
| **ANO-07** | `apps.incubator` (Pièces jointes) | **Vérification de la signature binaire (magic bytes)** : Un fichier renommé avec l'extension `.pdf` sans être un véritable PDF pouvait être déposé. | **Majeur** | Kalz / Ibrahima | **Validée conforme** | Le validateur `validate_file_content` contrôle la signature `%PDF-` à l'upload et rejette les faux fichiers avec une erreur `400`. |

---

## 4. Synthèse d'Exécution et Performance

- **Commande d'exécution :**
  ```bash
  python manage.py test apps.core.tests.test_parcours_complet
  ```
- **Résultat de la suite de test :**
  ```text
  Ran 2 tests in 0.664s
  OK
  ```
- **Contrôles généraux du projet :**
  - `python manage.py check` : 0 anomalie.
  - `python manage.py makemigrations --check` : 0 migration manquante.
  - Suite complète des tests (`python manage.py test apps`) : **141 tests passants** à 100 %.
