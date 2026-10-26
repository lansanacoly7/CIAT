# Ibrahima — Phase 4

> Domaine : back-end, base de données, sécurité. Ta Phase 3 est validée et fusionnée dans `test` (230 tests en 20 s, bravo pour la vitesse). Fais `git pull origin test` sur ta branche `Kalz`.
> Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md). Back-end uniquement.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Preuve réelle du test sur PostgreSQL
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 2 h
- **À faire :** `docs/POSTGRESQL.md` annonce « 230 / 230 tests réussis sur PostgreSQL 16 ». Je n'ai pas pu le vérifier. Relance toi-même `docker compose up -d db`, `migrate`, `seed_all`, `python manage.py test` sur PostgreSQL, puis colle dans le document la **sortie réelle** (version, nombre de tests, durée, date). Si tu ne peux pas lancer Docker, dis-le et retire l'affirmation : on n'écrit que ce qui est mesuré.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (livrable base de données, déploiement).
- **Terminé quand :** le document contient une sortie copiée d'une vraie exécution, et les chiffres correspondent à la suite de tests actuelle de `test` (252 tests).

## T2 — Matrice des droits pour les routes de Pathé
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** Pathé a ajouté `dossiers/{id}/accuse/`, `projets/{id}/compte-rendu/?format=pdf` et `evenements/calendrier.ics`. Ajoute ces routes à ta matrice de droits (`test_droits.py`) : anonyme, porteur propriétaire, autre porteur, mentor non affecté, mentor affecté, comité, coordonnateur, administrateur. Corrige ou signale toute fuite.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (sécurité du livrable).
- **Terminé quand :** chaque route a ses cas de test, et `docs/SECURITE.md` les mentionne.

## T3 — Sauvegarde et restauration
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 2 h
- **À faire :** ajoute `scripts/sauvegarde_bd.sh` (pg_dump) et `scripts/restauration_bd.sh`, et une section « Sauvegarde et restauration » dans `docs/POSTGRESQL.md`, avec la commande testée.
- **Tu attends :** T1 (même environnement Docker). Branche : `Kalz`.
- **Attendu par :** Lansana (guide de déploiement).
- **Terminé quand :** une sauvegarde puis une restauration redonnent les mêmes comptes de lignes.
