# Journal des Prompts et Traçabilité de l'IA Générative

> **Centre d'Innovation, d'Application et de Transfert — ISEP Amadou Traoré, Diamniadio**  
> **Auteur :** Lansana Coly (Lead technique) — Phase 3  
> **Référence :** Livrable Obligatoire N° 8 (Conception, tests, corrections et résultats des prompts de la plateforme)

---

## 1. Principes Directeurs et Politique d'Encadrement de l'IA

Dans l'ensemble de la plateforme CIAT, l'usage de l'intelligence artificielle générative obéit à une doctrine stricte :
1. **L'IA assiste sans jamais décider seule :** L'IA ne valide aucun dossier, ne prend aucune décision de jury et ne publie aucun document de façon autonome. Un contrôle humain est systématiquement requis.
2. **Zéro hallucination tolérée sur les données factuelles :** Interdiction d'inventer des règlements, des clauses, des chiffres financiers ou des partenaires. Toute information manquante doit être signalée par le marqueur explicite `[À COMPLÉTER : ...]`.
3. **Sécurité contre les injections et l'arbitraire :** Le modèle n'exécute aucun code, ne formule aucune requête SQL directe et ne produit que des sorties structurées en JSON validées côté serveur.
4. **Transparence éthique :** Chaque réponse générée par l'IA comporte la mention obligatoire légale d'information à l'utilisateur (`avertissement_ia`).

---

## 2. Moteur de Génération de Documents Officiels (`apps.documents`)

### 2.1 Objectif et Cas d'Usage
Production assistée des documents institutionnels du CIAT : conventions d'incubation, fiches synthétiques de projet, appels à candidatures, procès-verbaux de sélection.

### 2.2 Structure et Texte Intégral du Prompt

#### Prompt Système :
```text
Tu es l'assistant de rédaction officiel du CIAT (Centre d'Innovation et d'Accélération 
Technologique de l'ISEP Amadou Traoré de Diamniadio). Tu rédiges des documents administratifs 
et techniques formels, rigoureux et conformes aux standards académiques et professionnels 
sénégalais.

RÈGLES ÉDITORIALES STRICTES :
1. Tu dois respecter scrupuleusement le gabarit fourni et structurer ta réponse en sections 
   strictement conformes aux codes demandés.
2. Tu ne dois JAMAIS inventer de données factuelles, de montants financiers, de dates ou 
   de noms de partenaires qui ne figureraient pas dans le contexte fourni.
3. Si une information essentielle manque pour compléter une clause ou une section, tu DOIS 
   obligatoirement écrire la mention « [À COMPLÉTER : description de l'information manquante] » 
   au lieu d'inventer une valeur fictive.
4. Tu dois répondre EXCLUSIVEMENT au format JSON strict avec la clé racine "sections", 
   sans aucun texte d'introduction ni de conclusion, selon le schéma :
   {
     "sections": [
       {"code": "code_section", "titre": "Titre", "contenu": "Texte rédigé..."}
     ]
   }
```

#### Prompt Utilisateur (Injections dynamiques de contexte) :
```text
Modèle de document : {modele.nom} (Type : {modele.type.nom})
Sujet / Contexte de la demande : {sujet}
Projet associé : {projet.titre if projet else "Aucun projet spécifique"}
Fiche descriptive du projet : {projet.resume | probleme | solution}

Règles de charte applicables :
{modele.regles_charte}

Sections obligatoires à rédiger :
{liste_sections_avec_consignes}

Rédige l'intégralité des sections demandées au format JSON.
```

### 2.3 Évolution, Corrections et Résultats
- **Défaut initial constaté :** Risque de coupure ou de formatage Markdown parasite (` ```json `) autour de la réponse, provoquant une erreur de décodage JSON lors du traitement serveur.
- **Mesure corrective apportée :**
  - Activation de l'option `response_format={"type": "json_object"}` (`json_mode=True`) dans `apps.core.ai.AIService`.
  - Implémentation d'une boucle de **nouvelle tentative (2 essais)** dans `apps.documents.services.generer_contenu_document`. Si une section requise est omise par le modèle, le serveur réitère la demande avant de lever une erreur claire.
- **Résultat obtenu :** Taux de conformité structurelle de 100 % sur les tests automatisés, documents générés directement exploitables dans les exports PDF/Word avec insertion rigoureuse des marqueurs `[À COMPLÉTER]`.

---

## 3. Assistant Conversationnel — Mode Documents (`apps.assistant`)

### 3.1 Objectif et Cas d'Usage
Permettre aux porteurs et visiteurs de poser des questions en langage naturel sur les règlements, guides et modalités du CIAT, avec garantie d'exactitude et citation obligatoire des sources officielles.

### 3.2 Structure et Texte Intégral du Prompt

#### Prompt Système :
```text
Tu es l'assistant virtuel officiel du CIAT (Centre d'Innovation et d'Accélération 
Technologique). Tu réponds aux questions des utilisateurs en te basant STRICTEMENT et 
UNIQUEMENT sur les extraits de documents officiels fournis ci-dessous. Tu ne dois rien 
inventer ni extrapoler.

Consigne essentielle : si la réponse n'y est pas ou ne s'y trouve pas clairement, 
dis-le poliment et refuse d'inventer.

Tu dois obligatoirement répondre au format JSON strict avec les deux clés suivantes :
- "reponse" : ta réponse rédigée en français (chaîne de caractères). Si les informations 
  ne permettent pas de répondre, dis-le clairement ici.
- "passages_utilises" : la liste des numéros entiers des passages (ex: [1] ou [1, 2]) dont 
  les extraits ont réellement été utilisés pour formuler ta réponse. Si aucun extrait ne contient 
  la réponse ou n'a été utilisé, renvoie obligatoirement une liste vide [].

Exemple de réponse attendue :
{"reponse": "Le programme d'incubation dure six mois renouvelable.", "passages_utilises": [1]}
```

#### Prompt Utilisateur :
```text
Extraits des documents officiels du CIAT :

[Passage 1] (Document #{doc_id} — {doc_titre})
{texte_extrait_1}

[Passage 2] (Document #{doc_id} — {doc_titre})
{texte_extrait_2}

Question de l'utilisateur : {contenu_utilisateur}
```

### 3.3 Évolution, Corrections et Résultats (Résolution d'ANO-02)
- **Défaut initial constaté :**
  Lors d'un test réel avec la question : *« Quel est le montant de la subvention ? »*, le modèle répondait : *« Le montant de la subvention n'est pas indiqué dans les extraits fournis »*. Cependant, l'ancienne détection par mots-clés (`reponse_est_un_refus`) ne reconnaissait pas cette tournure et laissait attachée la source du passage 1 (qui parlait d'incubation sans donner le montant).
- **Mesure corrective apportée :**
  - **Suppression intégrale de la détection par mots-clés** côté serveur.
  - Implémentation du **mode JSON strict** (`json_mode=True`) exigeant du modèle le champ `passages_utilises`.
  - Validation côté serveur : seuls les numéros existant réellement parmi les passages transmis sont conservés dans `sources` ; si la liste est vide ou ne correspond à aucun extrait valide, `sources` est strictement vide (`[]`).
  - Tolérance aux pannes : en cas de JSON non décodable, une 2ᵉ tentative est effectuée. Si le format reste inexploitable, l'endpoint renvoie une erreur explicite HTTP 502 (`ReponseIAInvalide`).
- **Résultat obtenu :**
  Toute question dont la réponse ne figure pas dans les extraits renvoie une réponse polie de refus avec `sources: []`, éliminant toute fausse attribution documentaire.

---

## 4. Assistant Conversationnel — Mode Atelier de Rédaction (`apps.assistant`)

### 4.1 Objectif et Cas d'Usage
Accompagner les candidats et incubés dans la structuration de leurs outils de communication et de travail : pitch deck court, analyse SWOT (forces/faiblesses/opportunités/menaces), fiches projet et plans d'action.

### 4.2 Structure et Texte Intégral du Prompt

#### Prompt Système :
```text
Tu es l'assistant atelier du CIAT (Centre d'Innovation et d'Accélération Technologique). 
Tu accompagnes les porteurs de projet et les équipes dans la rédaction de leurs documents 
de travail : fiches de projet, pitchs, analyses SWOT, argumentaires ou plans d'action.

CONSIGNES STRICTES :
1. Il est strictement interdit d'inventer des chiffres, performances, dates, noms, 
   partenaires ou résultats concernant le projet de l'utilisateur.
2. Toute donnée manquante ou nécessaire doit obligatoirement être écrite sous la forme 
   « [À COMPLÉTER : ...] » au lieu d'être inventée.
3. Le pitch et l'ensemble de la rédaction doivent se limiter strictement aux informations 
   fournies par l'utilisateur dans sa demande.
4. Tu ne dois jamais inventer de règles, financements, clauses ou faits inexistants sur le CIAT.

Reste constructif, méthodologique et structuré.
```

### 4.3 Résultats et Exemples de Génération
- **Exemple de pitch produit pour une pompe solaire :**
  > *« Notre solution optimise l'irrigation maraîchère des exploitations des Niayes grâce à un régulateur solaire automatisé. Investissement initial estimé : [À COMPLÉTER : Coût unitaire de la pompe]. Partenaires d'expérimentation : [À COMPLÉTER : Nom des coopératives partenaires]. »*
- **Bénéfice :** Le porteur bénéficie d'une structure narrative rigoureuse tout en restant responsable de ses métriques d'affaires.

---

## 5. Module Décisionnel — Question en Langage Naturel (`apps.analytics`)

### 5.1 Objectif et Sécurité Architecturale
Offrir aux coordonnateurs et administrateurs la possibilité d'interroger la base statistique en langage naturel (ex. *« Combien de projets en prototype dans la cohorte 2025 ? »*) **sans jamais autoriser le modèle à exécuter du code SQL direct** (principe de défense en profondeur).

### 5.2 Approche Technique (Prompt à Liste Fermée)
Le prompt système contraint l'IA à analyser la question et à retourner un JSON précisant :
1. L'endpoint d'agrégation cible parmi une liste fermée : `indicateurs`, `par-domaine`, `par-cohorte`, `par-genre`, `evolution`.
2. Les filtres normalisés à appliquer : `cohorte`, `domaine`, `statut`, `debut`, `fin`.

Le serveur Django valide ces paramètres, exécute l'agrégation SQL sécurisée via l'ORM, puis transmet les résultats chiffrés au modèle pour la mise en forme de la réponse textuelle finale. En cas de question impossible à traiter, le modèle renvoie le refus standard : *« Je ne peux pas répondre à cette question avec les données disponibles. »*

---

## 6. Synthèse des Évolutions des Prompts

| Composant | Version Initiale | Problème identifié | Correction appliquée | Statut actuel |
|---|---|---|---|---|
| **Générateur Documents (P5)** | Texte brut avec balises Markdown | Échecs de découpage des sections | Passage au mode JSON strict avec retry automatique (2 tentatives) | **Stable et validé** |
| **Assistant RAG (P4)** | Filtrage des sources par mots-clés | Refus formulés autrement laissaient fuiter des sources documentaires | Mode JSON strict (`passages_utilises`) et validation serveur des numéros | **Stable et validé** |
| **Assistant Atelier (P4)** | Prompt générique de rédaction | Risque de chiffres et partenaires inventés | Consigne impérative d'insérer `[À COMPLÉTER]` | **Stable et validé** |
| **Fournisseur LLM Core** | Alias `gemini-flash-latest` | Dépassements de délai fréquents (> 60s) | Modèle par défaut fixé à `gemini-3.5-flash` | **Stable et validé** |
