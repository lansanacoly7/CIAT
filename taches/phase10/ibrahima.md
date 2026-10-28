# Ibrahima — Phase 10

> Ta Phase 9 est validée et fusionnée dans `test` (suite à 30 s, README d'installation, docstrings). Fais `git pull origin test` sur ta branche `Kalz`. Back-end uniquement.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Revue de sécurité des nouvelles routes
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** les phases 7 et 8 ont ajouté beaucoup de routes (calendrier, journal d'audit, notifications, manifestations d'intérêt de la galerie, export et suppression des données personnelles, route de santé, administration). Fais une revue d'attaquant : pour chaque route, essaie l'accès par un autre utilisateur du même rôle (accès à l'objet d'un autre : IDOR), par un rôle inférieur, sans jeton, avec un jeton expiré, et avec des paramètres de filtre qui élargiraient la portée (`?projet=`, `?acteur=`, `?utilisateur=`). Vérifie qu'aucune réponse ne divulgue d'email, de téléphone ou de message d'un tiers, y compris dans les messages d'erreur et dans la pagination. Complète ta matrice `test_droits.py` avec ces cas, corrige ce qui fuit, consigne le reste dans `docs/SECURITE.md`.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (sécurité, rapport).
- **Terminé quand :** chaque route récente a ses cas d'attaque testés, les fuites trouvées sont corrigées ou consignées avec une gravité, et la suite reste verte.

## T2 — Mot de passe oublié (API)
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** la page de connexion propose un lien « Mot de passe oublié » qui n'aboutit à rien. Ajoute :
  - `POST /api/auth/mot-de-passe/oublie/` `{ email }` : renvoie **toujours** `200` avec le même message (ne révèle jamais si le compte existe), envoie un email contenant un lien à usage unique avec jeton signé et expiré au bout de 1 heure (via le module d'emails existant, backend console en démonstration) ;
  - `POST /api/auth/mot-de-passe/reinitialiser/` `{ jeton, mot_de_passe }` : vérifie le jeton, applique les validateurs de mot de passe de Django, invalide le jeton après usage, `400` clair si le jeton est expiré ou déjà utilisé ;
  - limitation de débit stricte sur les deux routes, journal d'audit (sans le mot de passe ni le jeton), aucune donnée sensible dans les journaux.
  Tests : jeton valide, expiré, rejoué, trafiqué, compte inexistant (même réponse), limitation de débit. Documente dans `taches/CONTRATS_API.md` et `/api/docs/`.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Maimouna (pages « Mot de passe oublié » et « Nouveau mot de passe »), Lansana (conformité à l'exigence d'authentification).
- **Terminé quand :** le flux complet est testé de bout en bout, rien ne fuit sur l'existence d'un compte, et la suite reste verte.

## T3 — Sauvegarde des fichiers déposés
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 1 h 30
- **À faire :** tes scripts sauvegardent la base mais pas les fichiers déposés (`media/` : pièces des dossiers, preuves de jalons, images, PDF générés). Étends `scripts/sauvegarde_bd.sh` et `scripts/restauration_bd.sh` (ou ajoute un script jumeau) pour sauvegarder et restaurer aussi `media/`, avec un test de vérification (même nombre de fichiers et mêmes empreintes après restauration). Mets à jour la section « Exploitation » du README.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (exploitation, déploiement).
- **Terminé quand :** une sauvegarde puis une restauration redonnent la base et les fichiers à l'identique, avec le résultat réel consigné.

## Avant de pousser
`check`, `makemigrations --check` et la suite complète verts. Pousse sur `Kalz` et préviens Lansana.
