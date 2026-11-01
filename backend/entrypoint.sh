#!/bin/sh
# Démarrage du back-end : base prête, données de démonstration, puis serveur.
# Le disque des hébergements gratuits est effacé à chaque redémarrage : on recrée donc la base
# (SQLite par défaut) et les données de démonstration à chaque démarrage (seed_all est idempotent).
set -e

python manage.py migrate --no-input
python manage.py seed_all

exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:${PORT:-7860}" \
    --workers 2 \
    --timeout 120
