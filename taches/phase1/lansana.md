# Lansana — Phase 1

> Domaine : lead technique, intervient partout. Modules : **données de démonstration**, **fondations de P5 (générateur de documents)**, **déploiement**. Revue de toutes les demandes de fusion.
> Lis [00_PRIORITES.md](../00_PRIORITES.md) et [CONTRATS_API.md](../CONTRATS_API.md).

Ordre conseillé : T1 d'abord (il débloque Alioune), puis T2 et T3 en parallèle des revues.

## T1 — Jeu de données de démonstration réaliste
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 2 à 3 h
- **À faire :** étendre `seed_demo` : environ 60 projets répartis sur 3 cohortes et les 7 domaines, tous les statuts représentés, répartition femmes/hommes crédible, dates étalées sur 18 mois, porteurs fictifs. Créer aussi un dictionnaire des données (`docs/dictionnaire_donnees.md`) qui décrit chaque champ : c'est un livrable obligatoire de l'évaluation. Marquer clairement que les données sont fictives.
- **Tu attends :** rien. Branche : `feature/seed-donnees`.
- **Attendu par :** Alioune (indicateurs et graphiques), Pathé (test de l'annuaire), Massogui (annuaire).
- **Terminé quand :** `python manage.py seed_demo` produit ces données sans doublon quand on le relance, et le dictionnaire est écrit.

## T2 — Fondations du générateur de documents (P5)
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 5 à 6 h
- **À faire :** dans `backend/apps/documents/` : modèles `TypeDocument`, `ModeleDocument` (3 à 4 par type : sections, consigne par section, exemple de rédaction, règles de la charte), `Document` généré avec `Version`. Moteur de génération : à partir d'un modèle, du sujet et des informations du projet, construit le prompt, appelle `ai.chat(..., json_mode=True)` et renvoie les sections remplies. Gère l'absence de clé et l'échec des fournisseurs sans casser l'API. Endpoints du contrat (`types`, `modeles`, `generer`).
- **Tu attends :** les clés Groq et Gemini dans `backend/.env` (gratuites). Branche : `feature/documents-moteur`.
- **Attendu par :** la Phase 2 (interface du générateur, export Word et PDF). Cette tâche peut être répartie ensuite avec un développeur back qui se libère.
- **Terminé quand :** `POST /api/documents/generer/` produit, pour au moins deux types de documents, un texte structuré qui suit le modèle choisi, et renvoie une erreur claire sans clé.

## T3 — Intégration continue et premier déploiement
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** GitHub Actions qui lance `check` et les tests du back, `lint` et `build` du front sur les branches `feature/*` et sur `test`. Protection de `main` et de `test` (fusion uniquement par toi). Choix et mise en place de l'hébergement gratuit pour le jury (lien de déploiement : livrable obligatoire). Variables d'environnement et clés d'API stockées comme secrets, jamais dans le dépôt.
- **Tu attends :** rien pour l'intégration continue. Branche : `feature/ci-deploiement`.
- **Attendu par :** toute l'équipe (vérification automatique de leur code).
- **Terminé quand :** une demande de fusion déclenche les vérifications, `main` et `test` sont protégées, et une version accessible en ligne existe.

## En continu — revues et distribution
- **Complexité :** Moyenne · **Importance :** Critique
- **À faire :** vérifier chaque demande de fusion (lecture du code, droits, secrets, tests), l'accepter ou demander des corrections, puis donner la tâche suivante à la personne. Suivre les dépendances de ce dossier : si quelqu'un est bloqué, prendre la partie qui manque.
- **Terminé quand :** la Phase 1 est entièrement fusionnée sur `test` et fonctionne de bout en bout.
