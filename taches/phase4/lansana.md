# Lansana — Phase 4

> Domaine : lead technique. Axes : **véracité des livrables**, **préparation du déploiement**, **images de démonstration**. Revue des demandes de fusion en continu.
> Phases 1 à 3 : toutes validées et fusionnées dans `test` (seed_all, parcours complet de test, assistant à sources exactes, livrables écrits). Tu travailles directement sur `dev-lansana-coly` : `git fetch origin && git merge origin/test` d'abord.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Vérifier la véracité des livrables
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** pendant ma relecture, j'ai trouvé dans tes livrables des affirmations non mesurées ou fausses (temps de réponse inférieurs à 150 ms et 100 ms, Next.js 15 au lieu de 16, jeton de 60 minutes au lieu de 30, PostgreSQL « en production »). Je les ai corrigées, mais il y en a sûrement d'autres. Relis `docs/livrables/` (cahier des charges, guide utilisateur, schéma, journal des prompts, rapport) et `docs/TESTS_ET_ANOMALIES.md` **phrase par phrase** : pour chaque affirmation factuelle (chiffre, version, durée, nom de route, comportement, rôle autorisé, capacité), retrouve la preuve dans le code, les tests ou une commande exécutée. Ce qui n'est pas prouvé est corrigé, reformulé en objectif, ou supprimé. Règles : la plateforme n'est **pas déployée** (ne jamais écrire qu'elle l'est), les données sont **fictives** (ne pas les présenter comme réelles), les fonctions d'IA **dépendent d'un fournisseur gratuit** (quota, indisponibilité possibles). Consigne dans `docs/livrables/VERIFICATION.md` un tableau : affirmation, fichier et ligne, preuve, décision (conservée, corrigée, supprimée). Mets à jour les chiffres qui ont changé (nombre de tests, de pages, de routes) à partir des commandes réelles, pas de mémoire.
- **Tu attends :** rien. Branche : `dev-lansana-coly`.
- **Attendu par :** Lansana (rapport final, remise du dossier).
- **Terminé quand :** `VERIFICATION.md` couvre chaque affirmation chiffrée des cinq livrables, et un lecteur qui lance les commandes retrouve les mêmes chiffres.

## T2 — Préparer le déploiement (sans créer de compte)
- **Complexité :** Élevée · **Importance :** Critique · **Durée estimée :** 4 à 5 h
- **À faire :** le lien de déploiement est un livrable obligatoire et rien n'est en place. Prépare tout ce qui ne nécessite pas de compte d'hébergement. **(a)** Reprends la branche `dev-lansana-coly--ci-deploiement` : fusionne-la dans `dev-lansana-coly` après `git merge origin/test`, résous les conflits (`settings.py` a bougé), supprime ce qui n'est plus nécessaire. **(b)** Workflow GitHub Actions `.github/workflows/ci.yml` : back (Python 3.13, `check`, `makemigrations --check`, `test`) et front (Node 22, `npm ci`, `lint`, `build`), sans secret en clair. Valide-le localement (syntaxe YAML, commandes exécutées à la main dans le même ordre). **(c)** Un `Dockerfile` pour le back-end (gunicorn, fichiers statiques) et un pour le front, plus un `docker-compose.prod.yml` (PostgreSQL, back, front), testé en local avec `docker compose` : l'application démarre, `migrate` et `seed_all` passent sur PostgreSQL, la page d'accueil et l'API répondent. **(d)** Réglages de production dans `settings.py` : `DEBUG=0`, `ALLOWED_HOSTS`, `CORS`, `CSRF_TRUSTED_ORIGINS`, `SITE_URL`, fichiers statiques (WhiteNoise) et médias, depuis les variables d'environnement. **(e)** `docs/DEPLOIEMENT.md` : liste des variables (noms seulement), procédure pas à pas pour un hébergement gratuit (Vercel pour le front ; pour le back, un service gratuit avec PostgreSQL au choix, en listant ses limites connues : mise en veille, effacement des fichiers téléversés), étapes manuelles que Lansana devra faire, dans l'ordre.
- **Tu attends :** rien pour tout ce qui précède. Ne déploie rien toi-même : les comptes n'existent pas. Branche : `dev-lansana-coly`.
- **Attendu par :** la livraison finale (lien de déploiement) et toute l'équipe (CI qui vérifie les branches).
- **Terminé quand :** `docker compose -f docker-compose.prod.yml up` fait tourner une version complète en local sur PostgreSQL avec les données de `seed_all`, le workflow est valide, et `DEPLOIEMENT.md` permet à une personne qui n'a pas suivi le projet de mettre en ligne sans te poser de question.

## T3 — Images de démonstration pour `seed_all`
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 2 h
- **À faire :** les écrans de la galerie, des actualités et des partenaires paraissent vides sans images, et le dossier `media/` n'est pas dans Git. Complète `seed_all` pour **générer des images de remplacement** avec Pillow (déjà installé) : visuels aux couleurs de la charte (brun `#612D10`, beige `#C99A68`) avec le titre écrit dessus, pour les actualités, les logos de partenaires et les fiches de galerie (photos), enregistrés dans le stockage de médias comme de vraies images téléversées. Aucun problème de droits d'auteur, aucune image prise sur internet. La commande reste idempotente (ne regénère pas une image déjà créée) et légère (images sous 150 Ko).
- **Tu attends :** rien. Branche : `dev-lansana-coly`.
- **Attendu par :** Massogui (galerie, vidéo de démonstration), Maimouna (captures de maquettes).
- **Terminé quand :** après `seed_all`, chaque fiche publiée, chaque actualité et chaque partenaire a une image qui s'affiche dans l'interface ; une deuxième exécution ne change rien.

## En continu — revues
Vérifier chaque branche poussée par l'équipe (contrôles, périmètre, secrets, conformité au contrat), fusionner dans `test` si c'est bon, puis donner la tâche suivante.
