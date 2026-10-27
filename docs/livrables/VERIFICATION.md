# Registre de Vérification Factuelle des Livrables

> **Centre d'Innovation, d'Application et de Transfert (CIAT) — ISEP Amadou Trawaré, Diamniadio**  
> **Auteur :** Lansana Coly (Lead technique) — Phase 4 (Tâche T1)  
> **Objectif :** Audit phrase par phrase de la véracité de l'ensemble des livrables écrits du projet face au code source réel, aux tests automatisés et aux commandes exécutées.

---

## 1. Principes Directeurs et Règles de Vérification

Conformément au brief technique de la Phase 4, les règles d'intégrité suivantes régissent l'intégralité du présent audit :
1. **La plateforme n'est PAS déployée en production :** Elle fonctionne en environnement local de développement, sous conteneurs de démonstration et en intégration continue automatisée. Toute mention laissant entendre un déploiement public actif est proscrite ou rectifiée.
2. **Les données sont STRICTEMENT FICTIVES :** L'ensemble des 64 projets, 49 utilisateurs, comptes de test, évaluations et financements générés par `seed_all` sont des données simulées à vocation pédagogique et ergonomique.
3. **Les fonctionnalités d'IA dépendent de FOURNISSEURS GRATUITS :** Les appels IA (Groq, Google Gemini) via `apps.core.ai` reposent sur des paliers gratuits externes assujettis à des quotas de requêtes journaliers, à des limitations de débit (rate limits) et à des interruptions de connectivité possibles.
4. **Chiffres prouvés par l'exécution :** Chaque mesure, nombre de tests, décompte de modèles ou de pages est établi à partir de commandes réelles et reproductibles exécutées dans le terminal.

---

## 2. Tableau de Synthèse des Métriques Réelles du Codebase

| Grandeur / Composant | Valeur Réelle et Vérifiée | Méthode et Preuve de Mesure |
|---|---|---|
| **Version Django** | **Django 5.2.18** | `python -c "import django; print(django.__version__)"` |
| **Version Python** | **Python 3.13.2** | `python --version` |
| **Version Next.js** | **Next.js 16.4.3** | `frontend/package.json` (`"next": "16.4.3"`) |
| **Version React** | **React 19.3.0** | `frontend/package.json` (`"react": "19.3.0"`) |
| **Version Tailwind** | **Tailwind CSS v4** | `frontend/package.json` (`"@tailwindcss/turbopack": "^4"`) |
| **Suite de tests complète** | **256 tests passants** (0 échec, 0 erreur) en **~28s à 44s** | `python manage.py test apps` |
| **Test Parcours complet** | **2 tests passants** en **~1.05s** | `python manage.py test apps.core.tests.test_parcours_complet` |
| **Test Images de démo (T3)** | **4 tests passants** en **~12.9s** | `python manage.py test apps.core.tests.test_demo_images` |
| **Contrôle système Django** | **0 avertissement, 0 erreur** | `python manage.py check` |
| **Contrôle des migrations** | **0 migration en attente** (schéma synchrone) | `python manage.py makemigrations --check` |
| **Nombre de modèles Django** | **34 modèles** (Core: 4, Portal: 6, Incubator: 14, Documents: 4, Assistant: 3, Gallery: 1, Analytics: 2) | Inspection ORM `apps.get_models()` |
| **Nombre de tables de données** | **34 tables applicatives CIAT** | `python manage.py migrate` / introspection ORM |
| **Nombre de routes API REST** | **105 motifs d'URL d'API** sous `/api/` (297 motifs globaux avec admin/docs) | Résolution `django.urls.get_resolver()` |
| **Nombre de pages Frontend** | **31 routes `page.tsx`** sous `frontend/src/app` | Décompte glob `frontend/src/app/**/page.tsx` |
| **Durée jeton JWT Access** | **30 minutes** (`ACCESS_TOKEN_LIFETIME = timedelta(minutes=30)`) | `backend/config/settings.py:168` |
| **Palette chromatique** | **Brun CIAT `#612D10`**, **Brun Nuit `#24140D`**, **Ocre Doré `#C99A68`**, **Vert `#2E7D32`** | `frontend/src/app/globals.css` |
| **Projets créés (`seed_all`)** | **64 projets innovants** (8 domaines, 4 cohortes) | Requête ORM `Projet.objects.count()` |
| **Porteurs et Parité** | **43 porteurs** dont **16 femmes** (**37,2 %**) | Requête ORM `User.objects.filter(role='porteur')` |
| **Dossiers d'instruction** | **58 dossiers**, **174 pièces obligatoires** (3/dossier) | Requête ORM `Dossier.objects.count()`, `Piece.objects.count()` |
| **Évaluations et Décisions** | **109 évaluations du comité**, **53 décisions officielles** | Requête ORM `Evaluation.objects.count()`, `Decision.objects.count()` |
| **Mentorat et Jalons** | **49 mentors affectés**, **147 objectifs**, **147 jalons**, **38 preuves**, **57 commentaires**, **70 bilans** | Requête ORM `AffectationMentor`, `Objectif`, `Jalon`, `SuiviProjet` |
| **Partenariats & Financements** | **49 partenariats** (37 actifs), **50 financements** (467.5M FCFA dont 403M décaissés) | Requête ORM `Partenariat`, `Financement` |
| **Galerie & Documents** | **23 fiches galerie** (19 publiées, 2 en validation, 2 brouillons), **6 documents** | Requête ORM `FicheInnovation`, `Document` |
| **Images de démo locales (T3)** | **28 visuels générés** (2 actualités, 3 partenaires, 23 fiches galerie) < 150 Ko (max 53 Ko), 100 % souveraines, 0 externe | Exécution `seed_all` (Étape 7) & Pillow |
| **Lignes de données `seed_all`** | **1 740 enregistrements réels** dans les 34 tables CIAT | Requête `sum(m.objects.count())` |

---

## 3. Registre Détaillé d'Audit Phrase par Phrase

### 3.1 Cahier des Charges Fonctionnel et Technique (`docs/livrables/cahier_des_charges.md`)

| Affirmation / Chiffre audité | Fichier et Ligne | Preuve (code / commande / test) | Décision |
|---|---|---|---|
| Mention de la phase « Phase 3 » | `cahier_des_charges.md:5` | Projet en phase 4 désormais. | **Corrigée** : mise à jour en « Phase 3 & 4 ». |
| Absence d'avertissement de non-déploiement en préambule | `cahier_des_charges.md:6-8` | Consigne Phase 4 : la plateforme n'est pas déployée. | **Corrigée** : ajout du bloc méthodologique stipulant le fonctionnement local/test et les données fictives. |
| « 6 rôles d'utilisateurs matérialisés par le champ role » | `cahier_des_charges.md:26` | `apps.core.models.User.Role.choices` comporte 6 valeurs : `visiteur`, `porteur`, `membre_comite`, `mentor`, `coordonnateur`, `administrateur`. | **Conservée** : strictement vérifiée. |
| « 3 pièces obligatoires (Fiche de projet, Présentation de l'équipe, Budget prévisionnel) » | `cahier_des_charges.md:50` | `apps.incubator.models.Piece.TypePiece.choices` et `verifier_completude` dans `apps/incubator/services.py`. | **Conservée** : strictement vérifiée. |
| « Grille active (5 critères standard pondérés) » | `cahier_des_charges.md:53` | `apps.incubator.services.initialiser_grille_standard` crée 5 critères pondérés. | **Conservée** : strictement vérifiée. |
| « Tokens JWT (access d'une durée de 30 min, refresh rotatif) » | `cahier_des_charges.md:90` | `backend/config/settings.py:140` : `ACCESS_TOKEN_LIFETIME = timedelta(minutes=30)`. | **Conservée** : strictement conforme au code. |
| « Exécution complète de la suite de tests en moins de 20 secondes » | `cahier_des_charges.md:97` | L'exécution des 256 tests automatisés prend ~28s à 44s selon la machine. | **Corrigée** : reformulé en « 256 tests automatisés passants en ~30 à 40 secondes ». |
| « Tolérance aux pannes des services d'IA : fallback Groq -> Gemini » | `cahier_des_charges.md:98` | `apps.core.ai.AIService._providers` boucle sur `settings.AI_PROVIDERS` (`groq,gemini`). | **Corrigée** : ajout de la mention explicite des limites de quotas gratuits tiers. |
| « Palette chromatique : Brun ISEP #8B4513, Ocre Terre #C68642 » | `cahier_des_charges.md:101` | `frontend/src/app/globals.css` définit `--ciat-primary: #612D10` et `--ciat-secondary: #C99A68`. | **Corrigée** : remplacement par `#612D10` (Brun CIAT) et `#C99A68` (Ocre Doré CIAT). |

---

### 3.2 Guide d'Utilisation de la Plateforme (`docs/livrables/guide_utilisateur.md`)

| Affirmation / Chiffre audité | Fichier et Ligne | Preuve (code / commande / test) | Décision |
|---|---|---|---|
| Avertissement sur les données et le statut de déploiement | `guide_utilisateur.md:6` | Règle du brief : la plateforme n'est pas déployée en production. | **Corrigée** : ajout de l'avertissement en tête de document. |
| « Annuaire public des projets (/portail) » | `guide_utilisateur.md:29` | L'annuaire complet des projets est situé sur `/portail/projets` (avec vitrine sur `/portail`). | **Corrigée** : précision de `/portail/projets` ou `/portail`. |
| « Cliquez sur S'inscrire (/connexion) » | `guide_utilisateur.md:53` | La page d'inscription est `/inscription` (`frontend/src/app/inscription/page.tsx`), `/connexion` étant la connexion. | **Corrigée** : remplacé par « Cliquez sur S'inscrire (`/inscription`) ou Se connecter (`/connexion`) ». |
| « Pôle technologique parmi les 7 domaines officiels » | `guide_utilisateur.md:59` | 8 domaines sont désormais peuplés par `seed_all` (dont l'Agroalimentaire ajouté). | **Corrigée** : aligné avec le référentiel réel. |
| « 5 critères pondérés de la grille standard » | `guide_utilisateur.md:109` | Vérifié dans `apps/incubator/services.py:initialiser_grille_standard`. | **Conservée** : conforme. |
| « Découpe les textes en passages de 200 à 300 mots » | `guide_utilisateur.md:206` | Vérifié dans `apps/assistant/services.py:decouper_texte` (`taille_chunk=250`, `recouvrement=50`). | **Conservée** : conforme. |
| « Peuplement de l'ensemble des modules (seed_all) » | `guide_utilisateur.md:213` | Commande `seed_all` exécutée avec succès (64 projets, 58 dossiers, 49 partenariats, etc.). | **Corrigée** : mention explicite des volumes réels vérifiés et du caractère fictif des données. |
| « Vérifiez la conformité : check, makemigrations --check, test apps » | `guide_utilisateur.md:216-218` | Les trois commandes ont été exécutées avec un code de retour 0 (256 tests OK). | **Corrigée** : ajout du résultat chiffré (256 tests OK). |

---

### 3.3 Schéma de la Base de Données (`docs/livrables/schema_base_de_donnees.md`) et Dictionnaire (`docs/dictionnaire_donnees.md`)

| Affirmation / Chiffre audité | Fichier et Ligne | Preuve (code / commande / test) | Décision |
|---|---|---|---|
| « Dictionnaire exhaustif des 31 modèles » | `schema_base_de_donnees.md:6` | L'application compte désormais 34 modèles (avec `analytics` et `incubator.AlerteJalonEnvoyee`). | **Corrigée** : mis à jour à 34 modèles. |
| « Performances en environnement de production (PostgreSQL) » | `schema_base_de_donnees.md:12` | La plateforme n'est pas déployée. PostgreSQL est la cible du conteneur local. | **Corrigée** : reformulé pour distinguer l'environnement cible conteneurisé du runtime local de test. |
| Absence des modèles de partenariats et financements dans le Mermaid | `schema_base_de_donnees.md:70-76` | `apps.analytics.models` contient `Partenariat` et `Financement`. | **Corrigée** : ajout des relations et entités `PARTENARIAT` et `FINANCEMENT` au diagramme Mermaid. |
| Absence de la description d'`apps.analytics` dans le détail des relations | `schema_base_de_donnees.md:245` | `apps.analytics` possède deux modèles avec règles `clean` spécifiques. | **Corrigée** : création de la section `3.6 Suivi des Partenariats et Financements`. |
| Coquille typographique « Afin de garantir des des temps de réponse » | `schema_base_de_donnees.md:256` | Répétition du mot « des ». | **Corrigée** : suppression du doublon. |
| Table de synthèse du dictionnaire mentionnant 0 table pour Analytics et un total de 31 | `dictionnaire_donnees.md:346-347` | Introspection Django : 34 modèles et 34 tables applicatives CIAT. | **Corrigée** : passage du total à 34 modèles et 34 tables. |

---

### 3.4 Journal des Prompts et Traçabilité IA (`docs/livrables/journal_prompts.md`)

| Affirmation / Chiffre audité | Fichier et Ligne | Preuve (code / commande / test) | Décision |
|---|---|---|---|
| Absence de mention des limites de quotas en préambule | `journal_prompts.md:4` | Les services IA gratuits imposent des quotas et des fenêtres de débit. | **Corrigée** : ajout de l'avertissement méthodologique complet. |
| « Mode JSON strict avec la clé racine sections pour les documents » | `journal_prompts.md:41-47` | Vérifié dans `apps/documents/services.py:generer_contenu_document` et test `test_generation_ia`. | **Conservée** : strictement conforme au code. |
| « Découpage en passages et mode JSON strict passages_utilises pour l'assistant » | `journal_prompts.md:92-101` | `apps/assistant/services.py:repondre_question_rag` filtre `sources` selon les numéros transmis par l'IA. | **Conservée** : strictement conforme au code. |
| Description textuelle simplifiée sans le texte réel du routeur Analytics | `journal_prompts.md:166-172` | `apps.analytics.services` implémente `SYSTEM_ROUTER_PROMPT` et `SYSTEM_SYNTHESIS_PROMPT`. | **Corrigée** : intégration du texte exhaustif des prompts de routage et de synthèse chiffrée. |
| « Modèle par défaut fixé à gemini-3.5-flash » | `journal_prompts.md:182` | `backend/config/settings.py:180-194` configure Groq (`openai/gpt-oss-120b`) en premier et Gemini (`gemini-3.5-flash`) en repli. | **Corrigée** : actualisation de la synthèse pour documenter l'architecture multi-fournisseurs. |

---

### 3.5 Rapport Final de Projet (`docs/livrables/rapport_projet.md`)

| Affirmation / Chiffre audité | Fichier et Ligne | Preuve (code / commande / test) | Décision |
|---|---|---|---|
| « Django 5.1 » | `rapport_projet.md:47, 72` | L'environnement utilise Django 5.2.18 (`Django 5.2`). | **Corrigée** : mis à jour à Django 5.2. |
| « Next.js 16 (App Router) + React 19 » | `rapport_projet.md:41` | `package.json` spécifie Next.js 16.4.3 et React 19.3.0. | **Corrigée** : précision des versions mineures exactes. |
| « 31 tables » | `rapport_projet.md:64, 186` | Le modèle compte 34 tables applicatives. | **Corrigée** : mis à jour à 34 tables. |
| « 62 projets innovants » | `rapport_projet.md:153` | `seed_all` initialise 64 projets. | **Corrigée** : mis à jour à 64 projets. |
| « Représentativité paritaire : 39 % de femmes fondatrices » | `rapport_projet.md:157` | Le décompte exact donne 16 femmes sur 43 porteurs, soit 37,2 %. | **Corrigée** : rectifié à 37,2 % (16 femmes sur 43 porteurs). |
| Absence des métriques partenariats et financements de `seed_all` | `rapport_projet.md:155` | `seed_all` peuple 49 partenariats et 50 financements. | **Corrigée** : ajout des chiffres précis (49 partenariats dont 37 actifs, 467.5M FCFA mobilisés). |
| « Temps d'exécution du parcours complet : 0,66 seconde » | `rapport_projet.md:164` | Mesuré à ~1.05 seconde dans l'environnement local. | **Corrigée** : rectifié à ~1,05 seconde. |
| « Couverture : 145 tests unitaires et fonctionnels » | `rapport_projet.md:167` | La suite compte désormais 256 tests automatisés. | **Corrigée** : mis à jour à 256 tests (100 % passants). |
| « Temps d'exécution total : ~14 secondes » | `rapport_projet.md:168` | Mesuré entre 28s et 44s pour les 256 tests. | **Corrigée** : rectifié à ~30 à 40 secondes. |

---

### 3.6 Registre des Tests et Anomalies (`docs/TESTS_ET_ANOMALIES.md`)

| Affirmation / Chiffre audité | Fichier et Ligne | Preuve (code / commande / test) | Décision |
|---|---|---|---|
| « Temps d'exécution : ~0,66 seconde » | `TESTS_ET_ANOMALIES.md:7` | Commande réelle `test apps.core.tests.test_parcours_complet` exécutée en 1.047s. | **Corrigée** : mis à jour à ~1,05 seconde. |
| Absence d'avertissement de non-déploiement en en-tête | `TESTS_ET_ANOMALIES.md:8` | Règle du brief : la plateforme n'est pas déployée en production. | **Corrigée** : ajout du rappel sur le non-déploiement et la nature fictive des données. |
| « Ran 2 tests in 0.664s » | `TESTS_ET_ANOMALIES.md:76` | Sortie console mesurée : `Ran 2 tests in 1.047s`. | **Corrigée** : aligné sur la mesure réelle. |
| « Suite de tests complète : 145 tests passants » | `TESTS_ET_ANOMALIES.md:82` | Commande réelle `test apps` : `Ran 256 tests, OK`. | **Corrigée** : mis à jour à 256 tests passants (100 % succès). |

---

### 3.7 Images de Démonstration Locales (`Phase 4 — T3`)

| Affirmation / Chiffre audité | Preuve et Mesure Réelle | Décision |
|---|---|---|
| Zéro image externe (pas de dépendance Unsplash / Internet) | `grep -ri "images.unsplash.com" backend/ frontend/` : **0 occurrence résiduelle**. Visuels générés en local avec Pillow. | **Vérifiée** : conformité souveraine totale. |
| Respect de la charte graphique CIAT | Couleurs hexadécimales officielles : `#612D10` (Brun CIAT), `#24140D` (Brun Nuit), `#C99A68` (Ocre Doré), `#2E7D32` (Vert). | **Vérifiée** : intégrées dans `demo_images.py`. |
| Poids maîtrisé des images (< 150 Ko) | Actualités (37-38 Ko), Logos (7-8 Ko), Galerie (45-53 Ko). Poids maximal mesuré : **53 Ko**. | **Vérifiée** : toutes largement inférieures au plafond de 150 Ko. |
| Idempotence absolue de `seed_all` | 1er passage : 28 images générées. 2e passage consécutif : **0 image recréée** (28 déjà présentes, signalées inchangées). | **Vérifiée** : aucune régénération inutile. |
| Couverture de tests dédiée | `apps.core.tests.test_demo_images` : **4 tests unitaires passants** (taille, contenu, idempotence, suppression d'URLs externes). | **Vérifiée** : intégrée à la suite globale (256 tests). |

---

## 4. Commandes Reproductibles pour Vérification

Tout auditeur ou juré souhaitant contrôler ces grandeurs peut exécuter les commandes suivantes depuis la racine du projet :

```bash
# 1. Contrôle du système et de l'intégrité Django
backend\.venv\Scripts\python.exe backend\manage.py check

# 2. Contrôle des migrations de base de données
backend\.venv\Scripts\python.exe backend\manage.py makemigrations --check

# 3. Exécution du parcours complet de bout en bout (2 tests)
backend\.venv\Scripts\python.exe backend\manage.py test apps.core.tests.test_parcours_complet

# 4. Exécution de la suite de tests complète (256 tests)
backend\.venv\Scripts\python.exe backend\manage.py test apps

# 5. Décompte exact des modèles enregistrés dans l'application (34 modèles)
backend\.venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'backend'); import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); django.setup(); from django.apps import apps; ciat_models = [m for m in apps.get_models() if m._meta.app_label in ['core', 'portal', 'incubator', 'documents', 'assistant', 'gallery', 'analytics']]; print(f'Nombre de modèles CIAT : {len(ciat_models)}')"

# 6. Décompte des routes d'API (105 motifs d'URL)
backend\.venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'backend'); import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); django.setup(); from django.urls import get_resolver; resolver = get_resolver();
def list_urls(lis, prefix=''):
    res = []
    for entry in lis:
        if hasattr(entry, 'url_patterns'):
            res.extend(list_urls(entry.url_patterns, prefix + str(entry.pattern)))
        else:
            res.append(prefix + str(entry.pattern))
    return res
api_urls = [u for u in list_urls(resolver.url_patterns) if u.startswith('api/')]; print(f'Total endpoints API : {len(api_urls)}')"

# 7. Décompte des pages Next.js du front-end (31 pages)
backend\.venv\Scripts\python.exe -c "import pathlib; pages = list(pathlib.Path('frontend/src/app').glob('**/page.tsx')); print(f'Total pages Frontend : {len(pages)}')"

# 8. Décompte des lignes de données insérées par seed_all (1 740 lignes)
backend\.venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'backend'); import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); django.setup(); from django.apps import apps; ciat_models = [m for m in apps.get_models() if m._meta.app_label in ['core', 'portal', 'incubator', 'documents', 'assistant', 'gallery', 'analytics']]; print('Total lignes seed_all :', sum(m.objects.count() for m in ciat_models))"
```
