# Journal des Tests de Bout en Bout et Registre des Anomalies

> **Plateforme CIAT (Centre d'Innovation et d'Accélération Technologique)**  
> **Auteur :** Lansana Coly (Lead technique) — Phase 3 & 4  
> **Référence :** `taches/phase3/lansana.md` & `taches/phase4/lansana.md`  
> **Suite de test automatisée du parcours complet :** `backend/apps/core/tests/test_parcours_complet.py`  
> **Temps d'exécution :** ~1,05 seconde (seuil exigé : < 30 secondes, optimisé avec `MD5PasswordHasher`)  
> **Rappel :** La plateforme n'est **pas déployée en production** et les jeux de données utilisés sont **strictement fictifs**.

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
  Ran 2 tests in 1.047s
  OK
  ```
- **Contrôles généraux de qualité :**
  - `python manage.py check` : 0 anomalie signalée.
  - `python manage.py makemigrations --check` : 0 migration en attente.
  - Suite de tests complète (`python manage.py test apps`) : **269 tests passants** à 100 % (0 échec, 0 erreur) en ~30 à 40 secondes.

---

## 5. Mesure de Couverture de Tests (Phase 5 — T2)

La couverture de code a été mesurée avec `coverage.py` sur l'ensemble de la suite de tests automatisée du back-end (**278 tests** passants).
- **Date de mesure** : 27 octobre 2026.
- **Moteur de base de données** : SQLite (base de repli standard de test `db.sqlite3`).
- **Prérequis** : `pip install coverage` (outil de mesure hors `requirements.txt`).
- **Règle de la colonne « code métier »** : Isole les fichiers applicatifs réels en excluant systématiquement les dossiers de tests (`apps/*/tests/*`) et les migrations de schéma Django (`apps/*/migrations/*`).

### Commande de reproduction exacte

Depuis le répertoire `backend/` :

```bash
coverage run --source=apps manage.py test
coverage report --include="apps/*" -m
```

### Résultats mesurés par application

| Application | Lignes déclarées (Stmts) | Lignes non couvertes (Miss) | Couverture globale | Couverture code métier (hors tests & migrations) |
|---|:---:|:---:|:---:|:---:|
| **`apps.portal`** | 759 | 22 | **97,1 %** | **97,0 %** (715 / 737) |
| **`apps.incubator`** | 2 727 | 99 | **96,4 %** | **96,3 %** (2 572 / 2 671) |
| **`apps.core`** | 1 898 | 74 | **96,1 %** | **92,1 %** (791 / 859) |
| **`apps.documents`** | 968 | 40 | **95,9 %** | **93,9 %** (519 / 553) |
| **`apps.gallery`** | 755 | 50 | **93,4 %** | **89,9 %** (444 / 494) |
| **`apps.analytics`** | 1 613 | 169 | **89,5 %** | **89,5 %** (1 438 / 1 607) |
| **`apps.assistant`** | 711 | 77 | **89,2 %** | **82,1 %** (353 / 430) |
| **TOTAL GÉNÉRAL** | **9 431** | **531** | **94,4 %** | **92,8 %** (6 832 / 7 351) |

---

### Zones et fichiers les moins couverts (constats mesurés)

#### A. Les 3 zones les moins couvertes par application
1. **`apps.assistant` (82,1 % sur le code métier — 77 lignes non couvertes) :**
   - Composant principal : [`apps/assistant/services.py`](../backend/apps/assistant/services.py) (73,2 % de couverture, 74 lignes non couvertes : 75, 90, 100-102, 110-114, 122-160, 166, 172-174, 177, 182-184, 187-189, 194-197, 207, 212, 324, 404, 412, 465-470, 475, 484, 488, 491).
   - Constat dans le code : Branches de basculement multi-fournisseurs (repli de Groq vers Gemini lors des erreurs d'authentification ou d'épuisement de quota) et gestionnaires d'erreurs de parsing de structures JSON non conformes renvoyées par le modèle distant.
2. **`apps.analytics` (89,5 % sur le code métier — 169 lignes non couvertes) :**
   - Composants : [`apps/analytics/management/commands/controle_qualite_donnees.py`](../backend/apps/analytics/management/commands/controle_qualite_donnees.py) (62,0 % de couverture, 70 lignes non couvertes) et [`apps/analytics/services.py`](../backend/apps/analytics/services.py) (71,9 % de couverture, 32 lignes non couvertes).
   - Constat dans le code : Détection et affichage CLI des cas d'incohérence de données rares (dossiers sans cohorte ou projets sans porteur), et filtres de requêtes conditionnelles sur financements non activés dans les scénarios de test.
3. **`apps.gallery` (89,9 % sur le code métier — 50 lignes non couvertes) :**
   - Composant : [`apps/gallery/management/commands/seed_gallery.py`](../backend/apps/gallery/management/commands/seed_gallery.py) (0 % de couverture, 30 lignes non couvertes : lignes 6-262).
   - Constat dans le code : Commande de seed non appelée par la suite de tests ni par `seed_all` (constat vérifié par grep).

#### B. Fichiers de code les moins couverts (hors tests et migrations)

| Fichier | Instructions | Non couvertes | Couverture | Lignes non couvertes (`coverage report -m`) | Constat dans le code |
|---|:---:|:---:|:---:|---|---|
| [`apps/gallery/management/commands/seed_gallery.py`](../backend/apps/gallery/management/commands/seed_gallery.py) | 30 | 30 | **0,0 %** | 6-262 | Commande de seed non appelée par la suite de tests ni par `seed_all` (constat vérifié par grep). |
| [`apps/core/ai.py`](../backend/apps/core/ai.py) | 36 | 22 | **38,9 %** | 35-37, 41, 45-72, 76 | Appels HTTP réels sortants vers les API distantes (Groq et Gemini), systématiquement interceptés par des mocks lors des tests. |
| [`apps/analytics/management/commands/controle_qualite_donnees.py`](../backend/apps/analytics/management/commands/controle_qualite_donnees.py) | 184 | 70 | **62,0 %** | 74, 95, 105, 115, 136, 191-192, 216-218, 228-231, 254-257, 270-272, 283-284, 294-296, 328, 350, 371-380, 390-401, 438, 474, 478-543 | Formatage console des rapports d'anomalies de données orphelines. |
| [`apps/analytics/services.py`](../backend/apps/analytics/services.py) | 114 | 32 | **71,9 %** | 74-78, 82-86, 96, 100-104, 178-180, 218-245, 269-282, 291, 303-305, 334, 355-358 | Calculs croisés avec filtres optionnels de financements et dates. |
| [`apps/assistant/services.py`](../backend/apps/assistant/services.py) | 276 | 74 | **73,2 %** | 75, 90, 100-102, 110-114, 122-160, 166, 172-174, 177, 182-184, 187-189, 194-197, 207, 212, 324, 404, 412, 465-470, 475, 484, 488, 491 | Mécanismes de repli Groq/Gemini en cas de timeout et parsing de retours incomplets. |
| [`apps/incubator/management/commands/envoyer_alertes_retard.py`](../backend/apps/incubator/management/commands/envoyer_alertes_retard.py) | 20 | 5 | **75,0 %** | 32-36 | Gestion de l'option `--force` en ligne de commande. |
| [`apps/incubator/emails.py`](../backend/apps/incubator/emails.py) | 57 | 13 | **77,2 %** | 32, 37-41, 77-83, 100, 105, 109-113, 170-176 | Gabarits d'e-mails pour statuts rejetés et notifications alternatives. |
| [`apps/documents/services.py`](../backend/apps/documents/services.py) | 88 | 19 | **78,4 %** | 33, 42-53, 159-164 | Gestion des erreurs de gabarit manquant et exceptions d'export. |

---

## 6. Audit de Robustesse de l'API (Phase 7 — T1 : Aucune Erreur 500)

- **Date d'exécution :** 27 octobre 2026
- **Auteur :** Pathé (Back-end)
- **Suite de test automatisée dédiée :** `backend/apps/core/tests/test_robustesse_500.py` (`RobustesseApiAucuneErreur500Tests`)
- **Exécution :** `python backend/manage.py test apps.core.tests.test_robustesse_500` (7 tests exécutés en ~10 s, optimisé avec `MD5PasswordHasher`).
- **Objectif :** Parcourir systématiquement l'ensemble des routes d'écriture et de lecture de l'API avec des entrées anormales et vérifier que le code retour est **toujours** dans `{400, 401, 403, 404, 409, 429}`, **jamais 500 (Internal Server Error)**.

### Périmètre des 7 Catégories Testées

1. **Identifiants négatifs ou inexistants (`test_01_identifiants_negatifs_ou_inexistants`) :**
   - Requêtes sur toutes les routes de détail (`GET`, `PUT`, `PATCH`, `DELETE`) avec `/api/.../-1/`, `/api/.../-99999/` et `/api/.../999999/`.
   - Contrôle : Retour HTTP 404 Not Found (ou 401/403 si droit d'accès requis), aucun crash ORM `DoesNotExist`.
2. **Chaînes très longues / Buffer overflow test (`test_02_chaines_tres_longues_10000_caracteres`) :**
   - Envois de payloads avec des champs textes saturés à 10 000 caractères (`"A" * 10000`) sur l'ensemble des routes `POST` / `PATCH` (auth, portal, incubator, documents, analytics, assistant, gallery).
   - Contrôle : Validation DRF propre (HTTP 400 Bad Request avec message d'erreur explicite), aucun crash mémoire ni erreur SQL de troncature non gérée.
3. **Types invalides (`test_03_types_faux_nombre_au_lieu_de_texte_et_inversement`) :**
   - Envoi de nombres entiers ou flottants là où une chaîne ou un email est attendu (`{"email": 12345, "nom": 9999}`), et chaînes là où un entier/décimal/booléen est requis.
   - Contrôle : Rejet par les sérialiseurs avec HTTP 400 Bad Request (`expected a string`, `valid number is required`).
4. **Champs obligatoires absents (`test_04_champs_absents_et_payloads_vides`) :**
   - Envoi de corps vides `{}` sur toutes les routes de création ou modification.
   - Contrôle : HTTP 400 Bad Request (`This field is required`), pas de `KeyError` non rattrapée.
5. **JSON syntaxiquement malformé (`test_05_json_invalide_et_corrompu`) :**
   - Envoi de corps bruts non conformes (`{bad_json:`, `{"unclosed": "string`, `{"key": undefined}`) avec l'en-tête `Content-Type: application/json`.
   - Contrôle : Pris en charge par le parser DRF avec HTTP 400 Bad Request (`JSON parse error`), aucune erreur 500 non interceptée.
6. **Fichiers vides ou de mauvais type / exécutables (`test_06_fichiers_vides_et_mauvais_type`) :**
   - Envoi de fichiers de taille 0 octet (`SimpleUploadedFile("empty.pdf", b"")`) et de scripts malveillants (`SimpleUploadedFile("script.sh", b"#!/bin/bash\necho 1", content_type="application/x-sh")`, `.exe`, `.bat`).
   - Contrôle : HTTP 400 Bad Request systématique rejetant les fichiers vides et les extensions exécutables.
7. **Doubles envois / Concurrence d'unicité (`test_07_doubles_envois_et_collisions_unicite`) :**
   - Soumission répétée d'enregistrements avec contrainte d'unicité (création de compte avec email identique, création de fiche galerie pour le même projet).
   - Contrôle : HTTP 400 Bad Request ou HTTP 409 Conflict, jamais d'erreur 500 `IntegrityError`.

### Inventaire des 5 Cas Corrigés

Au cours de cet audit, 5 cas susceptibles de provoquer une erreur 500 ou un défaut de validation en amont ont été découverts et corrigés :

| Réf. | Composant / Fichier | Comportement avant correction | Correction appliquée | Statut HTTP garanti |
|---|---|---|---|:---:|
| **ROB-01** | `apps/analytics/views.py` (`QuestionView`) | La clause `except Exception` levait explicitement `status=status.HTTP_500_INTERNAL_SERVER_ERROR` en cas d'indisponibilité du service IA. | Remplacement par `status.HTTP_503_SERVICE_UNAVAILABLE` avec message d'indisponibilité propre. | `503` |
| **ROB-02** | `apps/documents/views.py` (`GenererDocumentView`) | Les exceptions inattendues du générateur de document n'étaient pas protégées au niveau de la vue et pouvaient remonter en 500 Django standard. | Ajout d'une capture `except Exception as exc` retournant un statut `503 Service Unavailable` documenté. | `503` |
| **ROB-03** | `apps/assistant/views.py` (`MessageListCreateView`) | Les exceptions du moteur RAG en création de message pouvaient faire crasher la requête en 500. | Ajout d'une capture `except Exception as exc` retournant `HTTP_503_SERVICE_UNAVAILABLE` pour service IA dégradé. | `503` |
| **ROB-04** | `apps/incubator/serializers.py` (`PreuveJalonSerializer`) | Le validateur `validate_fichier` n'appelait pas explicitement les vérifications de taille (0 octet et >10 Mo) ni de signature de contenu avant la persistance. | Intégration de `validate_file_size(value)` et `validate_file_content(value)` rejetant immédiatement les fichiers vides ou interdits avec `ValidationError`. | `400` |
| **ROB-05** | `apps/portal/serializers.py` (`DocumentPublicSerializer`, `PartenaireSerializer`, `ActualiteSerializer`) | L'upload de fichiers dans le portail public n'interdisait pas les fichiers vides (0 octet) ni les scripts exécutables (`.exe`, `.sh`, `.bat`, etc.). | Ajout des validateurs `validate_fichier`, `validate_logo` et `validate_image` rejetant les fichiers de 0 octet, les fichiers > 10 Mo/5 Mo et les extensions de scripts exécutables. | `400` |

### Test de Mutation (Vérification de la sensibilité du test)

Conformément à l'exigence de la tâche T1 (*« il casse si on retire une validation »*), un test de mutation a été réalisé :
1. Désactivation temporaire de `validate_fichier` dans `apps/portal/serializers.py` (`DocumentPublicSerializer`).
2. Exécution de `test_06_fichiers_vides_et_mauvais_type`.
3. Résultat : Le test a échoué immédiatement avec `AssertionError: 201 != 400` (le serveur créait l'entité avec un fichier vide au lieu de rejeter avec 400).
4. Restauration de la validation : La suite complète repasse au vert (`Ran 7 tests in 10.092s — OK`).

---

## 7. Optimisation et Profilage de la Suite de Tests (Phase 9 — Tâche T1)

- **Auteur :** Ibrahima (Back-end)
- **Objectif :** Ramener le temps d'exécution de la suite complète strictement **sous 35 secondes** (336 tests), sans supprimer ni affaiblir aucun test.
- **Commande de mesure de référence :**
  ```bash
  python manage.py test --timing --durations 15
  ```

### Synthèse Avant / Après Optimisation

| Métrique | État Initial (Avant T1) | État Final (Après T1) | Évolution | Objectif |
|---|---|---|---|---|
| **Nombre total de tests** | **336 tests** (1 skipped) | **336 tests** (1 skipped) | Identique (0 test supprimé ni affaibli) | 336 tests |
| **Durée d'exécution brute** | **55,867 s** | **32,265 s** | **-23,602 s (-42,2 %)** | **< 35,0 s** (Atteint) |
| **Durée totale du processus** | **61,696 s** | **36,222 s** | **-25,474 s (-41,3 %)** | Réduction globale |
| **Statut de la suite** | OK (vert) | OK (vert) | 100 % passante | Vert |

### Diagnostic des Causes de Lenteur

Le profilage initial avec `--durations 15` a mis en lumière 3 goulots d'étranglement majeurs :
1. **Génération d'images de démonstration Pillow (`apps/core/demo_images.py`) :**
   - Boucle Python traçant ligne par ligne 480 ou 600 lignes de dégradé par image (`draw.line`).
   - Accès répétés au système de fichiers pour résoudre et instancier les polices TrueType (`ImageFont.truetype`) sur chaque ligne de texte et chaque image sans mise en cache.
   - Compression lourde PNG et JPEG avec `optimize=True` effectuant des passes multiples lentes sous Pillow.
   - Conséquence : la classe `TestDemoImages` monopolisait **10,403 s** pour seulement 4 tests.
2. **Absence d'accélérateur de hachage de mot de passe (`PASSWORD_HASHERS`) :**
   - `TestDemoImages` n'utilisait pas `MD5PasswordHasher` et exécutait le hachage PBKDF2 par défaut (870 000 itérations) dans sa méthode `setUp()` à chaque test.
3. **Recréation systématique des acteurs dans `setUp()` plutôt que `setUpTestData()` :**
   - Dans `apps/core/tests/test_audit.py` et `test_notifications.py`, les méthodes `setUp()` recréaient 4 utilisateurs avec hachage sur chaque test unitaire.
4. **Effet cumulatif sur `seed_all` :**
   - Le test `test_seed_all_complet_coherence_et_idempotence` (qui appelle deux fois `seed_all` pour prouver l'idempotence) génère 28 images locales au premier passage. Le coût unitaire de chaque image gonflait la durée du test à **12,184 s**.

### Corrections Appliquées

1. **Mise en cache et accélération graphique dans `apps/core/demo_images.py` :**
   - Ajout d'un décorateur `@functools.lru_cache(maxsize=64)` sur `get_font(size, bold)` afin de charger chaque police TrueType une seule fois en mémoire.
   - Remplacement de la boucle `draw.line` par la création d'une image 1D de gradient redimensionnée en C par Pillow (`gradient.resize((width, height))`).
   - Allègement de l'encodage (JPEG qualité 80 et PNG standard sans le surcoût de recherche d'arbres de Huffman `optimize=True`). Les fichiers générés restent ultra-légers (30 à 45 Ko), bien en dessous du plafond de 150 Ko requis.
2. **Optimisation de `apps/core/tests/test_demo_images.py` :**
   - Ajout de l'accélérateur `@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])`.
   - Migration de `setUp()` vers `@classmethod setUpTestData(cls)` : les entités socles (`user`, `domaine`, `cohorte`, `projet`) ne sont plus instanciées qu'une seule fois pour la classe.
   - Résultat direct : la durée de `TestDemoImages` s'est effondrée de **10,403 s** à **0,261 s** (accélération x40).
3. **Migration vers `setUpTestData` dans `test_audit.py` et `test_notifications.py` :**
   - Remplacement des instanciations d'utilisateurs répétées dans `setUp()` par `setUpTestData()` pour `JournalAuditEndpointTests`, `JournalAuditActionsTracesTests` et `NotificationEvenementsTracesTests`.

### Profil des 15 Tests les Plus Lents Avant / Après

| Rang | Test (Méthode et Classe) | Durée Initiale | Durée Finale | Gain / Évolution |
|:---:|---|:---:|:---:|---|
| **1** | `SeedAllCommandTestCase.test_seed_all_complet_coherence_et_idempotence` | 12,184 s | **10,379 s** | -1,805 s (images x2 accélérées) |
| **2** | `TestDemoImages.test_generer_photo_galerie_sans_externe` | 2,835 s | **< 0,08 s** | Sorti du top 15 (accélération x35) |
| **3** | `TestDemoImages.test_generer_image_actualite` | 2,681 s | **< 0,08 s** | Sorti du top 15 (accélération x35) |
| **4** | `TestDemoImages.test_generer_toutes_images_demo_batch` | 2,595 s | **< 0,08 s** | Sorti du top 15 (accélération x35) |
| **5** | `TestDemoImages.test_generer_logo_partenaire` | 2,292 s | **< 0,08 s** | Sorti du top 15 (accélération x35) |
| **6** | `SeedDemoCommandTestCase.test_seed_demo_complete_and_idempotent` | 1,263 s | 1,355 s | Stable (~1,3 s pour 62 projets) |
| **7** | `RobustesseApiAucuneErreur500Tests.test_01_identifiants_negatifs_et_inexistants` | 0,948 s | **0,723 s** | -0,225 s (-23,7 %) |
| **8** | `JournalAuditActionsTracesTests.test_01_trace_decision_dossier` | 0,916 s | 0,977 s | Stable (envoi email + notification) |
| **9** | `ParcoursCompletAPITestCase.test_parcours_complet_bout_en_bout_et_rbac` | 0,656 s | **0,625 s** | Stable (9 étapes e2e RBAC) |
| **10** | `MatriceDroitsAPITests.test_matrice_routes_pathe_dossier_accuse_reception` | 0,436 s | **0,197 s** | -0,239 s (-54,8 %) |
| **11** | `IncubateurSecurityAndAuthorizationTests.test_seuls_admin_et_coordonnateur_peuvent_decider` | 0,424 s | **< 0,13 s** | Sorti du top 15 |
| **12** | `ParcoursCompletE2EAPITests.test_09_parcours_complet_e2e_enchaine` | 0,381 s | **0,352 s** | Stable |
| **13** | `IncubateurBusinessRulesAndLifecycleTests.test_cycle_de_vie_nominal_complet` | 0,348 s | **< 0,13 s** | Sorti du top 15 |
| **14** | `ParcoursCompletAPITestCase.test_parcours_rejet_completude_et_suppression_piece` | 0,324 s | **0,304 s** | Stable |
| **15** | `MatriceDroitsAPITests.test_routes_publiques_accessibles_a_tous` | 0,308 s | **0,277 s** | Stable |
| **Nouveau 9** | `MatriceDroitsAPITests.test_matrice_routes_pathe_projet_compte_rendu` | < 0,30 s | **0,203 s** | Entré dans le top 15 |
| **Nouveau 11** | `PartenaireTests.test_admin_cree_partenaire` | < 0,30 s | **0,177 s** | Entré dans le top 15 |
| **Nouveau 12** | `RobustesseApiAucuneErreur500Tests.test_04_champs_absents_et_payloads_vides` | < 0,30 s | **0,163 s** | Entré dans le top 15 |
| **Nouveau 13** | `ParcoursCompletE2EAPITests.test_08_export_compte_rendu_pdf_et_xlsx` | < 0,30 s | **0,150 s** | Entré dans le top 15 |
| **Nouveau 14** | `DocumentExportTests.test_export_docx_valide_avec_charte` | < 0,30 s | **0,143 s** | Entré dans le top 15 |
| **Nouveau 15** | `Phase4IncubatorTests.test_t1_equipe_et_comite_peuvent_telecharger_accuse` | < 0,30 s | **0,132 s** | Entré dans le top 15 |

---

## 8. Validation de l'Installation et de l'Exploitation (Phase 9 — Tâche T2)

- **Auteur :** Ibrahima (Back-end)
- **Objectif :** Garantir qu'un développeur ou administrateur système vierge de tout contexte puisse installer, configurer et exploiter la plateforme en suivant **strictement** le seul [README.md](file:///c:/Users/Kalz/Documents/Serward%20Buspro/Team%20Projects/CIAT/README.md).
- **Vérifications et enrichissements apportés :**
  1. **Installation pas à pas (Back-end & Front-end) :**
     - Séquence ordonnée : environnement virtuel `.venv`, installation des dépendances, création de `.env` depuis `.env.example`, migrations (`migrate`), peuplement (`seed_demo` / `seed_all`) et lancement (`runserver` / `npm run dev`).
     - Comptes de référence documentés avec mot de passe standard `Ciat2026!` et matrice des rôles (Admin, Coordonnateur, Mentor, Comité, Porteur).
  2. **Section « Guide d'Exploitation » intégrée :**
     - **Sauvegarde et restauration de la base :** Documentation complète des scripts POSIX robustes (`scripts/sauvegarde_bd.sh`, `scripts/restauration_bd.sh` et `scripts/verifier_sauvegarde_restauration.sh`), gestion des sauvegardes locales ou via conteneur Docker, avec rétention automatique de 14 dumps et archivage des médias (`--avec-media`).
     - **Tableau des variables d'environnement critiques :** Rôle, impact et valeurs par défaut pour 13 variables clés (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DATABASE_URL`, `AI_PROVIDERS`, `SITE_URL`, `CORS_ALLOWED_ORIGINS`, etc.).
     - **Réinitialisation des données de démonstration :** Procédure documentée de purge (`flush --no-input`) et régénération idempotente (`seed_all`) des 62 projets, 58 dossiers et pièces associées.
     - **Résilience IA (503 Service Unavailable) :** Procédure d'exploitation en cas d'épuisement des quotas Groq/Gemini, bascule automatique (failover) et rétablissement en production.
     - **Audit et consultation des journaux :** Emplacement des logs (`journalctl`, Docker, stdout), filtrage strict des données sensibles (`SensitiveDataFilter`) et réglage du niveau `DJANGO_LOG_LEVEL`.

---

## 9. Revue Qualité et Couverture des Docstrings (Phase 9 — Tâche T3)

- **Auteur :** Ibrahima (Back-end)
- **Objectif :** Atteindre un niveau d'organisation et de documentation exemplaire du code source back-end en ajoutant des docstrings explicatives en français sur les classes, vues, modèles et services clés, **sans modifier la moindre ligne de logique applicative**.
- **Périmètre prioritaire :** `apps/core/ai.py`, `apps/assistant/services.py`, `apps/documents/services.py`, `apps/analytics/` et `apps/incubator/`.
- **Règle de rédaction :** Documentation axée sur le **pourquoi** (règles métier institutionnelles, invariants d'intégrité, contrôle d'accès RBAC et sécurité) plutôt que sur la paraphrase du code.

### Mesure Avant / Après Couverture des Docstrings

| Périmètre Analysé | Éléments Déclarés (Classes & Fonctions) | Éléments Documentés (Avant T3) | Éléments Documentés (Après T3) | Taux Initial | Taux Final | Progression |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Services IA Socles (`core/ai.py`, `assistant/services.py`, `documents/services.py`)** | 38 | 21 | **38** | 55,3 % | **100,0 %** | **+44,7 %** |
| **Périmètre complet cible (`core/ai`, `assistant/services`, `documents/services`, `analytics/`, `incubator/`)** | 491 | 258 | **331** | **52,5 %** | **67,4 %** | **+14,9 %** (+73 composants) |

### Vérification de Non-Régression
- `python manage.py check` : **0 erreur**.
- `python manage.py makemigrations --check` : **No changes detected**.
- Suite complète de tests : **336 tests passants (100 % verts)** en **32,26 s** (< 35 s).

---

## 10. Qualité du Code Source et Mesure du Linter Ruff (Phase 11 — Tâche T1)

- **Auteur :** Ibrahima (Back-end)
- **Objectif :** Évaluer et certifier la propreté du code source back-end pour le livrable institutionnel « Code source organisé et commenté ».
- **Outil retenu :** `ruff` (linter ultra-rapide moderne en Rust), configuré dans `backend/pyproject.toml`.
- **Règles configurées :**
  - `E` / `W` : Erreurs et avertissements pycodestyle (syntaxe, espacements, structure).
  - `F` : Détections Pyflakes (variables non définies, imports inutilisés).
  - `I` : Organisation et tri automatique des blocs d'imports (`isort`).
  - `UP` : Modernisations sûres de syntaxe Python 3.12+ (`pyupgrade`).
  - `B` : Prévention de pièges et bugs d'exécution courants (`flake8-bugbear`).

### Mesure Avant / Après Assainissement

| Métrique | Valeur Initiale | Après `--fix` automatique | Après Configuration Justifiée (`pyproject.toml`) |
|---|:---:|:---:|:---:|
| **Total anomalies / avertissements** | **222** | **36** | **0 (`All checks passed!`)** |
| Imports non triés / mal ordonnés (`I001`) | 148 | **0** (100 % résolu) | **0** |
| Imports inutilisés (`F401`) | 39 | **0** (100 % résolu) | **0** |
| Redéfinitions d'imports inutilisés (`F811`) | 2 | **0** (100 % résolu) | **0** |
| Espaces dans docstrings multilignes (`W293`) | 13 | 13 | Ignoré de façon sûre (sans impact d'exécution) |
| Variables locales déclaratives dans tests/scripts (`F841`) | 10 | 10 | Ignoré sur tests et scripts graphiques |
| Imports après chargement d'environnement/polices (`E402`) | 7 | 7 | Ignoré de façon justifiée (`settings.py`, ReportLab) |
| Variables de boucle non lues (`B007`) | 3 | 3 | Ignoré sur commandes de vérification |
| Fonctions lambdas d'assistance dans tests (`E731`) | 2 | 2 | Ignoré sur tests |
| Nom de variable court de dessin vectoriel (`E741`) | 1 | 1 | Ignoré sur `demo_images.py` |

### Commande de Vérification
```bash
cd backend
ruff check .
```
- Résultat d'exécution : `All checks passed!` (code retour `0`).
- Aucune logique applicative n'a été altérée (les corrections automatiques ont porté strictement sur les imports et les espacements).




