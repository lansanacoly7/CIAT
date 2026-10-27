# Guide de Référence de l'API Plateforme CIAT

> **Centre d'Innovation et d'Accélération Technologique (CIAT)**  
> **Documentation d'intégration de l'API REST**  
> **Documentation interactive Swagger UI :** [`/api/docs/`](http://localhost:8000/api/docs/)  
> **Spécification OpenAPI 3.0 :** [`docs/openapi.yaml`](file:///c:/Users/pathe/Desktop/CIAT/docs/openapi.yaml) ou [`/api/schema/`](http://localhost:8000/api/schema/)  
> **Route de supervision :** [`GET /api/health/`](#2-route-de-santé-et-supervision)

---

## 1. Principes Généraux et Authentification

Toutes les routes de l'API sont préfixées par `/api/`.  
Les échanges s'effectuent au format **JSON** (sauf téléversements multipart et exports PDF/Excel/ICS).  
Les listes sont paginées au format standard : `{ "count": 42, "next": "...", "previous": null, "results": [...] }`.

### Comment se connecter (Obtention du JWT)

L'authentification repose sur des jetons **JSON Web Tokens (JWT)** émis via SimpleJWT.

#### A. Obtention du jeton d'accès

- **Endpoint :** `POST /api/auth/token/`
- **En-tête :** `Content-Type: application/json`
- **Corps de la requête :**
  ```json
  {
    "email": "porteur@ciat.sn",
    "password": "MotDePasseSecurise123!"
  }
  ```
- **Réponse (HTTP 200) :**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### B. Utilisation du jeton dans les requêtes protégées

Pour chaque appel à une route nécessitant une authentification, transmettez le jeton dans l'en-tête HTTP `Authorization` :

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### C. Rafraîchissement du jeton d'accès

Le jeton `access` expire après 30 minutes. Le jeton `refresh` (valide 7 jours) permet d'en obtenir un nouveau sans ressaisir le mot de passe :

- **Endpoint :** `POST /api/auth/token/refresh/`
- **Corps de la requête :**
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Réponse (HTTP 200) :**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

## 2. Route de Santé et Supervision

- **Endpoint :** `GET /api/health/`
- **Accès :** Public (aucun jeton requis).
- **Rôle :** Utilisé par les orchestrateurs (Docker, Kubernetes) et les sondes de monitoring.
- **Réponse nominale (HTTP 200) :**
  ```json
  {
    "status": "ok",
    "database": "connected"
  }
  ```
- **Réponse en cas d'indisponibilité base (HTTP 503 Service Unavailable) :**
  ```json
  {
    "status": "degraded",
    "database": "disconnected"
  }
  ```

---

## 3. Exemples de Requêtes par Module

### 3.1 Module Portail (`/api/portal/`)

Consultation publique des actualités, événements, appels à projets et partenaires institutionnels.

```bash
# Exemple : Consulter les actualités publiques
curl -X GET "http://localhost:8000/api/portal/actualites/" \
     -H "Accept: application/json"
```

**Réponse (HTTP 200) :**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "titre": "Lancement officiel de la plateforme CIAT",
      "slug": "lancement-officiel-de-la-plateforme-ciat",
      "resume": "Ouverture des candidatures pour la cohorte 2026.",
      "image": "/media/actualites/ciat-launch.png",
      "publie_le": "2026-10-27T08:00:00Z"
    }
  ]
}
```

---

### 3.2 Module Incubateur (`/api/incubator/`)

Gestion du cycle de vie des projets, dossiers de candidature, grilles d'évaluation et alertes de jalons.

```bash
# Exemple : Créer un dossier de candidature pour un projet
curl -X POST "http://localhost:8000/api/incubator/dossiers/" \
     -H "Authorization: Bearer <access_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "projet": 4
     }'
```

**Réponse (HTTP 201) :**
```json
{
  "id": 12,
  "projet": {
    "id": 4,
    "titre": "Plateforme Agro-Sénégal"
  },
  "statut": "brouillon",
  "completude": 0,
  "pieces": [],
  "pieces_manquantes": [
    "fiche_projet",
    "presentation_equipe",
    "budget_previsionnel"
  ],
  "soumis_le": null
}
```

---

### 3.3 Module Documents Officiels (`/api/documents/`)

Génération assistée par IA, versionnement et export (Word/PDF) des documents institutionnels conformes à la charte CIAT.

```bash
# Exemple : Générer un document officiel assisté par IA
curl -X POST "http://localhost:8000/api/documents/generer/" \
     -H "Authorization: Bearer <access_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "modele": 1,
       "sujet": "Attestation de sélection - Cohorte 2026",
       "projet": 4,
       "infos": {
         "date_comite": "2026-10-27"
       }
     }'
```

**Réponse (HTTP 201) :**
```json
{
  "id": 7,
  "titre": "Attestation de sélection - Cohorte 2026",
  "statut": "brouillon",
  "version": 1,
  "sections": [
    {
      "code": "PREAMBULE",
      "titre": "Préambule et contexte",
      "contenu": "Le jury réuni à Diamniadio atteste..."
    }
  ]
}
```

---

### 3.4 Module Analyse Décisionnelle (`/api/analytics/`)

Tableaux de bord d'analyse, KPIs de sélection, statistiques croisées et interrogation en langage naturel.

```bash
# Exemple : Obtenir les indicateurs clés du tableau de bord
curl -X GET "http://localhost:8000/api/analytics/indicateurs/" \
     -H "Authorization: Bearer <access_token>" \
     -H "Accept: application/json"
```

**Réponse (HTTP 200) :**
```json
{
  "idees_recues": 45,
  "dossiers_deposes": 28,
  "projets_selectionnes": 12,
  "projets_incubes": 8,
  "prototypes": 3,
  "taux_selection": 42.86
}
```

---

### 3.5 Module Assistant Virtuel (`/api/assistant/`)

Assistant RAG spécialisé avec indexation des documents publics CIAT.

```bash
# Exemple : Poser une question à l'assistant documentaire
curl -X POST "http://localhost:8000/api/assistant/conversations/1/messages/" \
     -H "Authorization: Bearer <access_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "contenu": "Quelles sont les pièces obligatoires pour candidater à l'\''incubateur ?",
       "mode": "documents"
     }'
```

**Réponse (HTTP 201) :**
```json
{
  "id": 18,
  "role": "assistant",
  "contenu": "Les trois pièces obligatoires sont la fiche de projet, la présentation de l'équipe et le budget prévisionnel.",
  "sources": [
    {
      "document_id": 2,
      "titre": "Règlement d'appel à candidatures CIAT",
      "extrait": "Chaque dossier doit impérativement comporter..."
    }
  ],
  "avertissement_ia": "Réponse générée par IA à partir des documents institutionnels du CIAT."
}
```

---

### 3.6 Module Galerie des Innovations (`/api/gallery/`)

Vitrine publique des projets incubés, QR codes dynamiques et fiches promotionnelles PDF officielles.

```bash
# Exemple : Consulter la fiche publique d'un projet incubé
curl -X GET "http://localhost:8000/api/gallery/fiches/agrisol-diamniadio/" \
     -H "Accept: application/json"
```

**Réponse (HTTP 200) :**
```json
{
  "id": 3,
  "slug": "agrisol-diamniadio",
  "titre": "AgriSol - Irrigation solaire connectée",
  "probleme": "Accès limité à l'énergie pour l'irrigation maraîchère.",
  "solution": "Système de pompage solaire autonome supervisé par capteurs IoT.",
  "equipe": "Moussa Diop (Porteur), Fatou Faye (Ingénieure IoT)",
  "avancement": "prototype",
  "vues": 142,
  "medias": [
    {
      "type": "photo",
      "url": "/media/gallery/agrisol-1.jpg"
    }
  ]
}
```

---

## 4. Codes de Réponse et Gestion des Erreurs

L'API CIAT respecte scrupuleusement la sémantique HTTP. **Aucune erreur 500 (Internal Server Error) n'est admise en réponse applicative.**

| Code HTTP | Libellé | Signification et cas d'usage | Format de réponse type |
|---|---|---|---|
| **200** | `OK` | Requête traitée avec succès (`GET`, `PATCH`, `PUT`). | Objet ou liste JSON demandée. |
| **201** | `Created` | Ressource créée avec succès (`POST`). | Représentation de l'entité créée. |
| **204** | `No Content` | Ressource supprimée avec succès (`DELETE`). | Corps vide. |
| **400** | `Bad Request` | Données en entrée invalides, types erronés, champs manquants ou fichiers interdits. | `{ "champ": ["Message d'erreur explicite"] }` ou `{ "non_field_errors": [...] }` |
| **401** | `Unauthorized` | Authentification requise : jeton absent, expiré ou signature invalide. | `{ "detail": "Informations d'authentification non fournies." }` |
| **403** | `Forbidden` | Droit d'accès refusé : le rôle de l'utilisateur ne l'autorise pas à exécuter cette action (RBAC). | `{ "detail": "Vous n'avez pas la permission d'effectuer cette action." }` |
| **404** | `Not Found` | Entité demandée introuvable ou identifiant inexistant. | `{ "detail": "Pas trouvé." }` |
| **409** | `Conflict` | Conflit d'état métier (ex : modification d'un document déjà validé ou publié). | `{ "detail": "Conflit : cette entité ne peut être modifiée dans son état actuel." }` |
| **429** | `Too Many Requests` | Dépassement des quotas de requêtes (limitation anti force-brute). | `{ "detail": "Limite de demandes atteinte." }` |
| **503** | `Service Unavailable` | Dégradation temporaire d'un service amont (base inaccessible, modèle d'IA tiers temporairement saturé). | `{ "status": "degraded", "database": "disconnected" }` ou `{ "erreur": "Service temporairement indisponible..." }` |
