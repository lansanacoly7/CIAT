# Journal des Prompts et Traçabilité de l'IA Générative

> **Centre d'Innovation, d'Application et de Transfert — ISEP Amadou Trawaré, Diamniadio**  
> **Auteur :** Groupe de six apprenants : Lansana Coly, Pape Alioune Sène, Maimouna Sall, El Hadji Massogui Diop, Ibrahima Khalilou Diallo, Pathé Fall  
> **Référence :** Livrable Obligatoire N° 8 (Méthode de travail IA, conception des prompts, résultats et corrections)  
> **Avertissement :** La plateforme n'est **pas déployée en production**. Les données sont purement fictives. L'ensemble des appels IA dépend de fournisseurs externes tiers (Groq, Google Gemini) via des offres gratuites sujettes à des quotas journaliers, des limitations de débit et d'éventuelles interruptions de service.

---

## 1. Principes Directeurs et Politique d'Encadrement de l'IA

Dans l'ensemble de la plateforme CIAT, l'usage de l'intelligence artificielle générative obéit à une doctrine stricte :
1. **L'IA assiste sans jamais décider seule :** L'IA ne valide aucun dossier, ne prend aucune décision de jury et ne publie aucun document de façon autonome. Un contrôle humain est systématiquement requis.
2. **Zéro hallucination tolérée sur les données factuelles :** Interdiction d'inventer des règlements, des clauses, des chiffres financiers ou des partenaires. Toute information manquante doit être signalée par le marqueur explicite `[À COMPLÉTER : ...]`.
3. **Sécurité contre les injections et l'arbitraire :** Le modèle n'exécute aucun code, ne formule aucune requête SQL directe et ne produit que des sorties structurées en JSON validées côté serveur.
4. **Transparence éthique :** Chaque réponse générée par l'IA comporte la mention obligatoire légale d'information à l'utilisateur (`avertissement_ia`).

---

## 2. Outils d'IA Utilisés et Méthode de Travail

La construction de la plateforme CIAT a mobilisé une articulation étroite entre intelligence artificielle et gouvernance humaine :

### 2.1 Services d'IA Embarqués dans la Plateforme
La solution applicative embarque un service d'inférence commun (`apps.core.ai.AIService`) respectant le standard OpenAI API. Deux fournisseurs gratuits distincts sont orchestrés en cascade avec repli automatique (`fallback`) :
- **Groq Cloud (`openai/gpt-oss-120b`) :** Fournisseur prioritaire offrant une vitesse de traitement élevée (LPUs) pour la génération de documents structurés et le routage des intentions.
- **Google Gemini (`gemini-3.5-flash`) :** Fournisseur secondaire sollicité en relais transparent lors des dépassements de quotas ou défaillances réseau de Groq.
L'ordonnancement est paramétré de façon centralisée dans `backend/config/settings.py` via la variable `AI_PROVIDERS = "groq,gemini"`.

### 2.2 Assistants d'IA de Développement
Pour concevoir, architecturer et implémenter la plateforme dans les délais impartis, Lansana Coly et les membres du groupe ont utilisé des assistants de codage intelligents, notamment **Antigravity** (Google DeepMind) :
- **Rôle d'Antigravity :** Assistance à la mise en place du socle technique Django/Next.js, proposition d'architectures modulaires conformes au cahier des charges, génération des squelettes de tests automatisés, factorisation du code CSS et accélération de la documentation technique.
- **Transparence sur la paternité du travail :** Antigravity intervient comme outil d'accélération et d'aide au développement en binôme (pair programming) ; il n'est ni l'auteur légal ni le garant décisionnel des livrables. Les choix d'architecture, la modélisation métier du CIAT, la résolution des incohérences et l'intégration finale ont été arrêtés par les six apprenants du groupe.

### 2.3 Mécanismes de Vérification Humaine et Validation Continue
Aucun code généré ou assisté par IA n'a été intégré sans un protocole rigoureux de vérification humaine :
- **Revue systématique des branches :** Chaque lot de fonctionnalités a fait l'objet d'une branche dédiée (`dev-*`), revue instruction par instruction (`git diff`), avec interdiction de modifier des fichiers hors du périmètre fixé.
- **Batterie de tests automatisés :** Validation de non-régression continue avec **256 tests unitaires et d'intégration** (`python manage.py test apps`), couvrant le parcours complet, le RBAC négatif, les validations de fichiers magiques et les cas limites.
- **Essais réels avec les clés d'API :** Tests manuels répétés avec les clés actives du `.env` sur les trois fonctionnalités d'IA (générateur de documents, assistant RAG et requêtes analytiques).
- **Audit de véracité factuelle :** Confrontation phrase par phrase des livrables textuels aux commandes réelles du dépôt (`docs/livrables/VERIFICATION.md`) et consignation exhaustive des anomalies (`docs/TESTS_ET_ANOMALIES.md`).

---

## 3. Recueil des Prompts Majeurs, Résultats et Corrections

Six prompts fondamentaux, représentatifs de l'architecture et des demandes réelles de construction du projet, sont détaillés ci-dessous :

### 3.1 Prompt 1 — Génération de Documents Administratifs (`apps.documents`)
- **Cas d'usage :** Rédaction assistée de conventions d'incubation et fiches officielles structurées.
- **Texte du prompt système :**
```text
Tu es l'assistant de rédaction officiel du CIAT (Centre d'Innovation, d'Application et de Transfert 
de l'ISEP Amadou Trawaré de Diamniadio). Tu rédiges des documents administratifs et techniques formels, 
rigoureux et conformes aux standards académiques et professionnels sénégalais.

RÈGLES ÉDITORIALES STRICTES :
1. Tu dois respecter scrupuleusement le gabarit fourni et structurer ta réponse en sections 
   strictement conformes aux codes demandés.
2. Tu ne dois JAMAIS inventer de données factuelles, de montants financiers, de dates ou 
   de noms de partenaires qui ne figureraient pas dans le contexte fourni.
3. Si une information essentielle manque pour compléter une clause ou une section, tu DOIS 
   obligatoirement écrire la mention « [À COMPLÉTER : description de l'information manquante] » 
   au lieu d'inventer une valeur fictive.
4. Tu dois répondre EXCLUSIVEMENT au format JSON strict avec la clé racine "sections" :
   {"sections": [{"code": "code_section", "titre": "Titre", "contenu": "Texte..."}]}
```
- **Résultat initial obtenu :** Sorties polluées par des balises Markdown (` ```json `) et omission occasionnelle d'une section requise.
- **Correction apportée :** Activation de `response_format={"type": "json_object"}` dans `AIService`, plus un retry automatique (2 tentatives) vérifiant la présence de chaque section requise avant sauvegarde.

---

### 3.2 Prompt 2 — Assistant RAG à Sources Citées en JSON Strict (`apps.assistant`)
- **Cas d'usage :** Questions sur les règlements du CIAT avec citation des passages documentaires.
- **Texte du prompt système :**
```text
Tu es l'assistant virtuel officiel du CIAT. Tu réponds aux questions des utilisateurs en te 
basant STRICTEMENT et UNIQUEMENT sur les extraits de documents officiels fournis ci-dessous. 
Tu ne dois rien inventer ni extrapoler.

Consigne essentielle : si la réponse n'y est pas ou ne s'y trouve pas clairement, 
dis-le poliment et refuse d'inventer.

Tu dois obligatoirement répondre au format JSON strict avec les deux clés suivantes :
- "reponse" : ta réponse rédigée en français. Si les informations ne permettent pas de répondre, 
  dis-le clairement ici.
- "passages_utilises" : la liste des numéros entiers des passages (ex: [1] ou [1, 2]) dont les extraits 
  ont réellement été utilisés. Si aucun extrait ne contient la réponse, renvoie obligatoirement [].
```
- **Résultat initial obtenu (Anomalie ANO-02) :** Sur la question *« Quel est le montant de la subvention ? »*, le modèle répondait *« Le montant n'est pas précisé dans les extraits »*, mais l'ancienne détection textuelle laissait un passage documentaire attaché à tort dans `sources`.
- **Correction apportée :** Remplacement de la détection par mots-clés par le parsing du tableau `passages_utilises` validé côté serveur. Si la liste est vide ou inconnue, `sources` est strictement vide (`[]`).

---

### 3.3 Prompt 3 — Assistant Atelier : Interdiction d'Inventer et Gabarits Porteurs (`apps.assistant`)
- **Cas d'usage :** Assistance méthodologique des porteurs pour pitch decks et analyses SWOT.
- **Texte du prompt système :**
```text
Tu es l'assistant atelier du CIAT. Tu accompagnes les porteurs de projet dans la rédaction 
de leurs documents de travail : fiches de projet, pitchs, analyses SWOT, argumentaires ou plans d'action.

CONSIGNES STRICTES :
1. Il est strictement interdit d'inventer des chiffres, performances, dates, noms, partenaires 
   ou résultats concernant le projet de l'utilisateur.
2. Toute donnée manquante ou nécessaire doit obligatoirement être écrite sous la forme 
   « [À COMPLÉTER : ...] » au lieu d'être inventée.
3. Le pitch et l'ensemble de la rédaction doivent se limiter strictement aux informations fournies.
4. Tu ne dois jamais inventer de règles ou financements inexistants sur le CIAT.
```
- **Résultat initial obtenu :** Tendance du LLM à halluciner des partenaires de distribution et des taux de rentabilité non calculés.
- **Correction apportée :** Injection du garde-fou négatif `[À COMPLÉTER]` et validation dans l'interface utilisateur que le porteur reste le rédacteur responsable de ses métriques.

---

### 3.4 Prompt 4 — Question en Langage Naturel sans SQL Direct (`apps.analytics`)
- **Cas d'usage :** Interrogation des indicateurs de l'incubateur en langage naturel par la coordination.
- **Texte du prompt routeur :**
```text
Tu es l'analyseur d'intentions du tableau de bord décisionnel du CIAT (ISEP Diamniadio).
Ta mission est d'associer une question en langage naturel à l'un des endpoints d'analyse existants 
et d'en extraire les filtres pertinents.

LISTE FERMÉE DES ENDPOINTS AUTORISÉS :
- "indicateurs" : pour les volumes globaux, totaux, nombre d'idées soumises, dossiers déposés.
- "par-domaine" : pour la répartition ou ventilation par secteur technologique.
- "par-cohorte" : pour la comparaison entre promotions annuelles.
- "par-genre" : pour la répartition femmes/hommes et la parité.
- "hors_sujet" : pour toute question ne concernant pas les données statistiques des projets du CIAT.

FORMAT DE SORTIE JSON STRICT :
{"endpoint": "...", "filtres": {"cohorte": "...", "domaine": "..."}, "hors_sujet": boolean}
```
- **Résultat initial obtenu :** Risque critique d'injection SQL ou d'arbitraire si le LLM produisait directement des requêtes de base de données.
- **Correction apportée :** Architecture à 2 niveaux : le modèle route la question vers un endpoint Django existant dont les filtres sont appliqués par l'ORM sécurisé, puis un second prompt synthétise les données réelles sans aucun accès SQL direct.

---

### 3.5 Prompt 5 — Directive de Rigueur : « Aucune Fausse Donnée Écrite dans le Front » (ANO-03, ANO-04, ANO-05)
- **Cas d'usage :** Directive d'ingénierie imposée lors de la Phase 3 & 4 pour éliminer les contournements mockés.
- **Consigne technique transmise lors du développement :**
```text
Interdiction absolue d'écrire des fausses données de secours en dur dans le code du frontend.
1. Supprimer définitivement les jetons démo qui connectent sans mot de passe (AuthContext.tsx).
2. Supprimer les faux enregistrements en localStorage en cas de panne d'API (incubator.ts, evaluation.ts).
3. Supprimer les fausses actualités et faux appels affichés automatiquement en cas de réseau coupé (portal-api.ts).
En cas d'échec d'un appel API, afficher un message d'erreur clair, maintenir les champs saisis 
et proposer un bouton d'action pour réessayer. La plateforme ne doit jamais simuler un faux succès.
```
- **Résultat et vérification :** Signalée dans les commits `2c6b944` et `91c60c9`, cette directive a été appliquée dans `9db87a5` et `8161437`. Toutes les interactions front-end s'appuient désormais exclusivement sur les réponses réelles de l'API Django.

---

### 3.6 Prompt 6 — Directive de Résilience : « Correction du Modèle d'IA Expirant » (ANO-11)
- **Cas d'usage :** Fiabilisation de la connectivité LLM et élimination des timeouts bloquants.
- **Consigne technique transmise lors du développement :**
```text
L'alias gemini-flash-latest provoque des erreurs de modèle introuvable ou des dépassements 
de délai (> 60s) bloquant la suite de tests et les démonstrations.
1. Remplacer l'alias instable par la version officielle fixée gemini-3.5-flash.
2. Basculer la priorité sur Groq (openai/gpt-oss-120b) pour une inférence sub-seconde.
3. Rendre la configuration testable avec un faux service IA (FakeAIService) pour garantir 
   l'exécution déterministe des 256 tests sans consommer de quota.
```
- **Résultat et vérification :** Résolue dans le commit `44976ec` : `settings.py` et `.env.example` ont été alignés sur `gemini-3.5-flash` et `openai/gpt-oss-120b`, rendant le sous-système d'IA robuste et réactif.

---

## 4. Synthèse des Évolutions et Statut des Prompts

| N° | Composant / Directive | Problème initial ou Risque | Correction appliquée | Statut vérifié |
|---|---|---|---|---|
| **P1** | **Générateur Documents (P5)** | Échecs de découpage et balises markdown | Format JSON forcé (`json_mode=True`) et retry automatique | **Validé (100% tests OK)** |
| **P2** | **Assistant RAG (P4)** | Rétention indue des sources documentaires en cas de refus (ANO-02) | Sources en JSON strict (`passages_utilises`) et validation serveur | **Validé (sources vides si refus)** |
| **P3** | **Assistant Atelier (P4)** | Risque de chiffres et partenaires inventés | Consigne impérative du marqueur `[À COMPLÉTER]` | **Validé (zéro hallucination)** |
| **P4** | **Requêtes Analytics (P3)** | Risque d'injections et vulnérabilités SQL | Architecture en 2 étapes via filtres ORM Django sans SQL | **Validé (défense en profondeur)** |
| **P5** | **Zéro donnée en dur (Front)** | Faux succès et fausses données locales (ANO-03 à 05) | Suppression des mocks localStorage et affichage strict des erreurs | **Validé (zéro fausse donnée)** |
| **P6** | **Résilience Modèle (Core)** | Timeouts et alias LLM expirant (ANO-11) | Modèle fixé `gemini-3.5-flash` + priorité Groq LPU | **Validé (repli transparent)** |
