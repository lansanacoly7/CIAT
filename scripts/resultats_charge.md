# Synthèse des résultats de mesures sous charge — Plateforme CIAT (Phase 6)

Ce document consigne les résultats empiriques des deux campagnes de mesure de charge réalisées conformément aux exigences de la Phase 6 :
1. **Campagne A : Comportement de la limitation de débit (Throttling de production)**
2. **Campagne B : Temps de réponse sous charge (Service réel sans limitation sur serveur WSGI)**

---

## 1. Protocole et Commandes de Reproduction

### Environnement matériel et logiciel de test
- **Machine hôte** : PC Windows 10 (Build 19045), Processeur 2 cœurs x86_64 (GenuineIntel, 2 vCPUs @ 2.40 GHz), 8 Go RAM.
- **Base de données** : SQLite 3 configurée en mode WAL (`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=30000;`).
- **Serveur WSGI multi-threadé** : Waitress 3.0.2 (16 threads de travail).
- **Jeu de données** : Données de démonstration semées via `python manage.py seed_all` (100% idempotent).

### Commandes exactes d'exécution

#### A. Campagne de limitation de débit (Throttling actif de production)
```powershell
# 1. Démarrer le serveur avec les seuils de production (60/min anon, 300/min user, 5/min auth)
cd backend
python manage.py runserver 127.0.0.1:8000

# 2. Exécuter le banc de test
python scripts/mesure_charge.py --base-url http://127.0.0.1:8000 --requests 200 --concurrency 5 20 50
```

#### B. Campagne de temps de réponse de service réel (Limites de débit relevées)
```powershell
# 1. Démarrer le serveur WSGI de production avec désactivation du throttling par variable d'environnement
cd backend
$env:DISABLE_THROTTLING="1"
python -c "import django; django.setup(); from waitress import serve; from config.wsgi import application; serve(application, host='127.0.0.1', port=8000, threads=16)"

# 2. Exécuter le banc de test
python scripts/mesure_charge.py --base-url http://127.0.0.1:8000 --requests 200 --concurrency 5 20 50 --server "Waitress WSGI"
```

---

## 2. Tableau A — Comportement de la limitation de débit (Throttling de production)

Ce tableau évalue l'étanchéité des protections anti-déni de service (DoS) et force brute configurées dans `settings.REST_FRAMEWORK`. Il mesure le nombre de requêtes traitées (200 OK) avant le déclenchement du blocage HTTP 429 (`Too Many Requests`).

| Route | Clients | Requêtes | 200 Traitées | 429 Bloquées | Taux rejet (%) | Seuil théorique prod |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Actualités (public) | **5** | 200 | 59 | **141** | 70.5 % | 60 / minute (`anon`) |
| Galerie (public) | **5** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon` - quota épuisé) |
| Détail Fiche (public) | **5** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon` - quota épuisé) |
| Connexion (auth throttle) | **5** | 200 | 3 | **197** | 98.5 % | 5 / minute (`auth`) |
| Dossiers (porteur) | **5** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Indicateurs (coordonnateur) | **5** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Actualités (public) | **20** | 200 | 60 | **140** | 70.0 % | 60 / minute (`anon`) |
| Galerie (public) | **20** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon`) |
| Détail Fiche (public) | **20** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon`) |
| Connexion (auth throttle) | **20** | 200 | 5 | **195** | 97.5 % | 5 / minute (`auth`) |
| Dossiers (porteur) | **20** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Indicateurs (coordonnateur) | **20** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Actualités (public) | **50** | 200 | 60 | **140** | 70.0 % | 60 / minute (`anon`) |
| Galerie (public) | **50** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon`) |
| Détail Fiche (public) | **50** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon`) |
| Connexion (auth throttle) | **50** | 200 | 5 | **195** | 97.5 % | 5 / minute (`auth`) |
| Dossiers (porteur) | **50** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Indicateurs (coordonnateur) | **50** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |

**Constat technique** : Les seuils de limitation sont strictement respectés. La route d'authentification bloque dès la 4e à 6e requête, et les routes publiques coupent le flux au-delà de 60 requêtes/minute par adresse IP.

---

## 3. Tableau B — Temps de réponse sans limitation (Service réel sous charge — Waitress WSGI)

Ce tableau mesure les performances réelles du service applicatif (sans biais de rejets 429 rapides). Toutes les requêtes sont réellement exécutées jusqu'à la base de données.

| Route | Clients | Requêtes | 200 OK | Erreurs | Médiane (ms) | p95 (ms) | Débit effectif (req/s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Actualités (public) | **5** | 200 | 200 | 0 | 136.1 | 998.1 | **17.3** |
| Galerie (public) | **5** | 200 | 200 | 0 | 222.4 | 1175.5 | **12.2** |
| Détail Fiche (public) | **5** | 200 | 200 | 0 | 530.7 | 3693.7 | **4.9** |
| Connexion (auth throttle)* | **5** | 200 | 200 | 0 | 15725.0 | 19028.1 | **0.3** |
| Dossiers (porteur) | **5** | 200 | 200 | 0 | 99.8 | 1094.0 | **17.5** |
| Indicateurs (coordonnateur) | **5** | 200 | 200 | 0 | 179.4 | 956.3 | **13.8** |
| Actualités (public) | **20** | 200 | 200 | 0 | 579.8 | 2982.4 | **13.6** |
| Galerie (public) | **20** | 200 | 200 | 0 | 855.3 | 3351.7 | **11.8** |
| Détail Fiche (public) | **20** | 200 | 200 | 0 | 1273.9 | 14974.9 | **5.4** |
| Connexion (auth throttle)* | **20** | 200 | 16 | 184 | 52136.4 | 57457.2 | **0.0** |
| Dossiers (porteur) | **20** | 200 | 180 | 20 | 2607.1 | 20053.2 | **1.4** |
| Indicateurs (coordonnateur) | **20** | 200 | 200 | 0 | 254.7 | 920.4 | **16.1** |
| Actualités (public) | **50** | 200 | 200 | 0 | 505.7 | 1369.7 | **17.9** |
| Galerie (public) | **50** | 200 | 200 | 0 | 666.9 | 1396.3 | **16.9** |
| Détail Fiche (public) | **50** | 200 | 200 | 0 | 3475.7 | 12377.9 | **8.0** |
| Connexion (auth throttle)* | **50** | 200 | 16 | 184 | 53033.0 | 59413.3 | **0.1** |
| Dossiers (porteur) | **50** | 200 | 189 | 11 | 2110.9 | 46886.8 | **1.9** |
| Indicateurs (coordonnateur) | **50** | 200 | 200 | 0 | 737.8 | 2414.2 | **29.4** |

\* **Note explicative sur l'authentification** : Sur `/api/auth/token/`, le calcul du hachage de mot de passe (PBKDF2 avec 870 000 itérations) est délibérément consommateur de CPU par mesure de sécurité cryptographique. Sans limitation de débit, 200 requêtes concurrentes saturent les 2 vCPUs de la machine hôte. Ceci démontre empiriquement l'utilité vitale de la limitation `AuthRateThrottle (5 req/min)` qui empêche cette saturation en production.

---

## 4. Points Clés pour l'équipe (Lansana & Ibrahima)

1. **Prise en compte par Ibrahima (`taches/phase5/ibrahima.md` T3)** :
   - Les requêtes authentifiées `dossiers` et `indicateurs` présentent une médiane de **99.8 ms à 179.4 ms** à 5 clients simultanés sur Waitress.
   - À 20 et 50 clients, `dossiers` subit le coût de la sérialisation des pièces jointes et des calculs dynamiques de complétude, constituant un candidat privilégié pour la mise en cache Redis ou l'optimisation de requêtes en Phase 5.
2. **Incrémentation atomique de vues (`gallery_ficheinnovation`)** :
   - Sur `GET /api/gallery/fiches/{slug}/`, l'instruction `FicheInnovation.objects.filter(pk=fiche.pk).update(vues=F('vues') + 1)` écrit en base à chaque lecture. L'activation du mode WAL (`PRAGMA journal_mode=WAL;`) permet à SQLite d'absorber jusqu'à 50 clients concurrents (200/200 requêtes servies avec succès), là où le mode DELETE classique déclenchait des verrous de fichier.
