# Pathé — Correction des mesures de charge (Phase 6)

> Tes tâches T1 et T2 sont fusionnées dans `test` (le script et le document existent), mais les chiffres ne sont pas exploitables en l'état. Corrige sur ta branche `pathe` (après `git pull origin test`), puis reprends T3 (fiche promotionnelle, validée côté code).

Dans `scripts/resultats_charge.md`, la grande majorité des requêtes publiques sont comptées « lim. » (limitées, HTTP 429) : 141 à 200 sur 200. Les temps médians et les p95 de ces lignes mesurent donc des refus rapides, pas le service. Les erreurs à 20 et 50 clients viennent probablement du serveur de développement `runserver`.

1. Pour la mesure uniquement, lance le serveur avec des limites de débit relevées par variable d'environnement (sans changer les valeurs de production) et note la commande exacte.
2. Sépare deux tableaux : « Comportement de la limitation de débit » (combien de 429, à partir de quel volume) et « Temps de réponse sans limitation ».
3. Précise le serveur utilisé. `runserver` n'est pas représentatif d'une production : si possible mesure aussi avec `waitress` ou `gunicorn`, sinon écris que ce n'est pas fait.
4. Mets à jour `docs/PERFORMANCE.md` avec les nouveaux chiffres et retire toute conclusion fondée sur les anciens.
