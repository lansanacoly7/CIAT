# Journal des Tests de Bout en Bout et Registre des Anomalies

> **Plateforme CIAT (Centre d'Innovation et d'Accélération Technologique)**  
> **Auteur :** Lansana Coly (Lead technique) — Phase 3  
> **Référence :** `taches/phase3/lansana.md` (Tâches T1, T2, T3)  
> **Suite de test automatisée du parcours complet :** `backend/apps/core/tests/test_parcours_complet.py`  
> **Temps d'exécution :** ~0,66 seconde (seuil exigé : < 30 secondes, optimisé avec `MD5PasswordHasher`)

---

## 1. Périmètre et Objectifs du Parcours Complet

La tâche **T3** a pour vocation de valider de bout en bout l'interconnexion de l'ensemble des modules applicatifs de la plateforme CIAT (socle Core, Incubateur P2, Documents P5, Galerie des innovations P6, Assistant P4) à travers des scénarios réels d'utilisateurs.

Chaque étape du cycle de vie valide deux dimensions indispensables :
1. **Le parcours nominal et alternatif** (flux fonctionnel complet et transitions de statuts).
2. **Le contrôle des droits et de la sécurité (RBAC)** : validation systématique de ce que chaque rôle **ne doit pas** pouvoir faire (retours HTTP 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict).

---

## 2. Contrôles et Protections Réalisés avec Succès

Les règles de sécurité et de robustesse suivantes ont été validées et sont en vigueur dans le code (la plateforme n'est pas encore déployée) :

1. **Format strict et canonique du profil utilisateur (`genre`) :**  
   Le modèle `User` impose les codes de choix à 1 caractère (`"F"`, `"H"`, `"A"`) définis dans `User.Genre.choices`. Toute tentative de transmission de libellés non canoniques (ex. `"femme"`) est strictement rejetée à la validation avec un code HTTP 400.
2. **Confidentialité des données privées du porteur dans la galerie (P6) :**  
   Les endpoints publics de la galerie (`/api/gallery/fiches/` et `/api/gallery/fiches/{slug}/`) excluent formellement l'adresse email et le numéro de téléphone personnel du porteur. Une assertion négative automatisée (`assertNotIn`) garantit l'absence de fuite de données personnelles dans les réponses publiques.
3. **Immutabilité juridique des documents institutionnels (P5) :**  
   Dès qu'un document officiel généré atteint le statut `valide` ou `publie`, toute tentative de modification ultérieure (`PATCH`) est bloquée avec un code HTTP `409 Conflict` afin de garantir l'intégrité de la version archivée.
4. **Vérification de la signature binaire réelle des pièces jointes (Magic Bytes) :**  
   Le validateur `validate_file_content` inspecte les premiers octets du fichier lors du téléversement pour s'assurer de la présence de la signature binaire `%PDF-`. Un simple renommage de fichier avec l'extension `.pdf` est détecté et rejeté avec une erreur explicite.

### Matrice de Couverture des Tests de Bout en Bout

| Étape | Action testée | Acteurs impliqués | Endpoints API | Contrôles positifs | Contrôles négatifs (RBAC & Validations) |
|---|---|---|---|---|---|
| **Étape 1** | Inscription & Authentification | Porteur (visiteur) | `POST /api/auth/register/`<br>`POST /api/auth/token/`<br>`GET /api/auth/me/` | Compte créé en rôle `porteur` (201), émission des tokens JWT `access` & `refresh` (200), profil valide. | Rejet des emails en double (400), rejet des mots de passe trop faibles (400). |
| **Étape 2** | Projet & Dossier de candidature | Porteur | `POST /api/projets/`<br>`POST /api/incubator/dossiers/`<br>`POST .../pieces/`<br>`POST .../soumettre/` | Projet créé au statut `idee` (201), dossier en `brouillon` (201), calcul dynamique de la complétude (0% ➔ 33% ➔ 100%), soumission réussie (200, statut projet ➔ `depose`). | Interdiction d'accès pour un autre porteur (403), interdiction de soumettre sans les 3 pièces obligatoires (400), refus de dépôt anonyme (401), refus d'ajout/suppression après soumission (400). |
| **Étape 3** | Évaluation multicritère | Membre du comité | `POST .../dossiers/{id}/evaluations/`<br>`GET .../dossiers/{id}/evaluations/` | Saisie des notes sur les 5 critères de la grille active (201), calcul automatique du score moyen (200), passage du dossier à `en_evaluation`. | Auto-évaluation par le porteur interdite (403), tentative d'évaluation anonyme (401), tentative de double évaluation par le même membre (400). |
| **Étape 4** | Décision motivée du jury | Coordonnateur | `POST .../dossiers/{id}/decision/` | Décision motivée enregistrée (201) ; acceptation ➔ statut dossier `accepte` et projet `selectionne` ; refus ➔ dossier `refuse` et projet `rejete`. | Prise de décision interdite au membre du comité (403) et au porteur (403), interdiction de redécider un dossier déjà statué (400). |
| **Étape 5** | Mentorat, Jalons & Alertes de retard | Coordonnateur, Mentor | `POST .../projets/{id}/mentor/`<br>`POST .../objectifs/`<br>`POST .../jalons/`<br>`GET /api/incubator/alertes/`<br>`POST .../commentaires/` | Affectation du mentor par le coordonnateur (200), création d'objectifs (201), détection immédiate des jalons en retard dans `/alertes/` (200, `en_retard=True`), dépôt de commentaire d'alerte (201). | Affectation de mentor interdite au porteur (403), consultation de l'affectation interdite aux tiers non concernés (403), commentaire interdit sur un projet tiers (403). |
| **Étape 6** | Galerie des innovations (P6) | Porteur, Coordonnateur, Visiteur anonyme | `POST /api/gallery/fiches/`<br>`POST .../soumettre/`<br>`POST .../valider/`<br>`GET /api/gallery/fiches/{slug}/`<br>`GET .../qr/` | Création de la fiche en `brouillon` (201), passage en `en_validation` (200), validation en `publie` par le coordonnateur (200), consultation publique anonyme (200) avec incrémentation des vues et QR code PNG dynamique. | Création de fiche sur le projet d'autrui interdite (403), fiche brouillon invisible au public (404), auto-validation par le porteur interdite (403), zéro fuite de données personnelles. |
| **Étape 7** | Documents officiels & Export (P5) | Coordonnateur, Équipe CIAT | `POST /api/documents/generer/`<br>`PATCH /api/documents/{id}/`<br>`GET .../versions/`<br>`POST .../valider/`<br>`GET .../export/?format=pdf` | Génération assistée par IA simulée (201, version 1 en `brouillon`), modification de section avec création de version 2 (200), validation du document (200), export binaire PDF conforme à la charte CIAT (200, signature `%PDF-`). | Génération anonyme refusée (401), modification interdite sur un document au statut `valide` ou `publie` (409 Conflict). |

---

## 3. Registre des Anomalies Constatées et Traitées

Ce registre consigne l'ensemble des défauts réels identifiés lors des revues de code et des audits de qualité menés durant le projet. Pour chaque anomalie, l'origine exacte, la gravité, le rôle responsable et la décision ou le commit de correction sont consignés.

| Réf. | Module / Composant | Description & Origine de l'anomalie | Gravité | Rôle responsable | État | Mesure corrective / Commit de résolution |
|---|---|---|---|---|---|---|
| **ANO-01** | `apps.documents` (Back-end) | **Erreur de syntaxe bloquante à l'import** : `from apps.documents.migrations.0002_seed_documents import INITIAL_DATA` levait `SyntaxError: invalid decimal literal` au chargement de Python car le nom de module débute par un chiffre. | **Bloquante** | Lead technique / Développeur Back-end | **Corrigée** | Remplacement par un import dynamique via `importlib.import_module("apps.documents.migrations.0002_seed_documents")`. |
| **ANO-02** | `apps.assistant` (Services RAG) | **Rétention indue des sources documentaires en cas de refus** : Lors de questions comme *« Quel est le montant de la subvention ? »*, la détection par mots-clés (`reponse_est_un_refus`) ne couvrait pas les formulations négatives complexes et laissait des sources attachées à la réponse. | **Majeure** | Lead technique / Développeur Back-end | **Corrigée** | Remplacement complet par le mode JSON strict (`ai.chat(..., json_mode=True)`). Le modèle renvoie obligatoirement la liste ordonnée `passages_utilises`. Validation serveur des numéros existants ; si la liste est vide ou inconnue, `sources` est vide. Mécanisme de 2 tentatives avec erreur 502 explicite en cas de JSON invalide. |
| **ANO-03** | Frontend Auth (`AuthContext.tsx`) | **Connexion sans mot de passe via jetons de démo** : La fonction `login` interceptait toute erreur de mot de passe et connectait automatiquement les comptes à privilèges (`admin@ciat.sn`, `coordo@ciat.sn`, `comite@ciat.sn`) avec de faux jetons (`demo_*_token`), contournant l'authentification. | **Critique** | Développeuse Front-end (authentification & incubation) | **Corrigée** | Signalée dans `2c6b944`, corrigée dans `9db87a5` avec suppression définitive des jetons démo et affichage strict de l'erreur « Email ou mot de passe incorrect ». |
| **ANO-04** | Frontend Incubateur (`incubator.ts`, `evaluation.ts`) | **Faux enregistrement de dossier et fausses évaluations en cas de panne API** : Si le serveur était indisponible, les dossiers et notes étaient sauvegardés en localStorage (`ciat_mock_*`), laissant faussement croire que la soumission avait réussi. | **Critique** | Développeuse Front-end (incubation) | **Corrigée** | Signalée dans `2c6b944`, corrigée dans `9db87a5` : suppression des stockages fictifs, affichage d'un message d'erreur clair et maintien des champs remplis pour nouvel essai. |
| **ANO-05** | Frontend Portail (`portal-api.ts`) | **Fausses données publiques affichées en cas de panne réseau** : En cas d'échec de l'API, le portail basculait sur des données fictives de secours (`MOCK_ACTUALITES`, `MOCK_APPELS`), affichant de faux appels à projets et de fausses dates limites. | **Majeure** | Développeur Front-end (portail institutionnel) | **Corrigée** | Signalée dans `91c60c9`, corrigée dans `8161437` : suppression des données de secours implicites et affichage d'un message d'indisponibilité temporaire avec bouton de réessai. |
| **ANO-06** | Backend Incubateur (`apps/incubator/views.py`) | **Exposition de l'email du mentor à tout utilisateur authentifié** : L'endpoint `GET /api/incubator/projets/{id}/mentor/` ne contrôlait pas l'habilitation du demandeur, permettant à un porteur tiers de lire l'email et les coordonnées de mentors d'autres projets. | **Élevée** | Développeur Back-end (incubation) | **Corrigée** | Résolue dans le commit `605656d` : accès restreint à l'équipe CIAT, au comité, au porteur titulaire du projet et au mentor assigné, validé par `test_mentor_visibilite.py`. |
| **ANO-07** | Tests automatisés (`apps.incubator`, `apps.portal`) | **Lenteur critique des suites de tests unitaires** : La suite de tests de l'incubateur dépassait 5 minutes et celle du portail 56 secondes, pénalisant l'exécution continue en raison du hachage PBKDF2 lors de la création d'utilisateurs. | **Majeure** | Développeurs Back-end (incubateur et portail) | **Corrigée** | Commits `5737154` et `a1bb047` : accélération via `@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])`, réduisant l'exécution à ~5s (incubateur) et ~1,3s (portail). |
| **ANO-08** | Frontend Analytics (`DashboardContent.tsx`) | **Erreurs de lint React bloquantes sur le tableau de bord** : Présence d'un `setState` direct dans un `useEffect` (risque de cascade de rendus) et d'une apostrophe non échappée bloquant la commande `npm run lint`. | **Moyenne** | Développeur Front-end & Data (tableau de bord) | **Corrigée** | Signalée dans `26d2a7b`, corrigée dans `e9bbca4` : extraction du calcul hors de l'effet et échappement typographique conforme. |
| **ANO-09** | Frontend Routing (`layout.tsx`) | **Layout d'administration appliqué par erreur à la galerie publique** : Injection de barres latérales administratives sur les routes `/galerie`, `/assistant`, `/documents` et `/incubateur`. La galerie publique se retrouvait entourée d'un menu d'administration. | **Majeure** | Développeur Front-end & Data (tableau de bord) | **Corrigée** | Signalée dans `26d2a7b`, corrigée dans `e9bbca4` avec suppression des fichiers `layout.tsx` superflus hors du module tableau de bord. |
| **ANO-10** | Backend Galerie (`apps/gallery/views.py`) | **Adresse du QR code codée en dur dans le code** : L'URL encodée dans le QR code pointait en dur vers `https://ciat.sn/galerie/{slug}`, rendant les QR codes non fonctionnels en environnement local ou de test. | **Moyenne** | Développeur Fullstack (galerie des innovations) | **Corrigée** | Résolue dans le commit `f9bec17` : utilisation dynamique du réglage `SITE_URL` configurable via les variables d'environnement (`settings.SITE_URL`). |
| **ANO-11** | Backend Core IA (`apps/core/ai.py`, `settings.py`) | **Indisponibilité et timeout de l'alias Gemini** : L'alias par défaut `gemini-flash-latest` provoquait des dépassements de délai (> 60 secondes) ou des erreurs de modèle introuvable auprès de l'API. | **Majeure** | Lead technique / Développeur Back-end | **Corrigée** | Résolue dans le commit `44976ec` : fixation du modèle par défaut à `gemini-3.5-flash` dans `settings.py` et `.env.example`. |

---

## 4. Synthèse d'Exécution et Performance

- **Commande d'exécution du parcours complet :**
  ```bash
  python manage.py test apps.core.tests.test_parcours_complet
  ```
- **Résultat :**
  ```text
  Ran 2 tests in 0.664s
  OK
  ```
- **Contrôles généraux de qualité :**
  - `python manage.py check` : 0 anomalie signalée.
  - `python manage.py makemigrations --check` : 0 migration en attente.
  - Suite de tests complète (`python manage.py test apps`) : **145 tests passants** à 100 % en ~18 secondes.
