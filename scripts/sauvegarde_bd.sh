#!/usr/bin/env bash
# ==============================================================================
# CIAT — Script de sauvegarde de la base de données PostgreSQL (Phase 4 — T3)
# ==============================================================================
# Usage :
#   ./scripts/sauvegarde_bd.sh [chemin_fichier_destination] [--avec-media]
#
# Variables d'environnement supportées :
#   DATABASE_URL : URL de connexion (ex. postgres://ciat:ciat@localhost:5432/ciat)
#   PGHOST       : Hôte PostgreSQL (défaut : localhost)
#   PGPORT       : Port PostgreSQL (défaut : 5432)
#   PGUSER       : Utilisateur (défaut : ciat)
#   PGPASSWORD   : Mot de passe (défaut : ciat)
#   PGDATABASE   : Nom de la base (défaut : ciat)
#   BACKUP_DIR   : Répertoire de stockage des sauvegardes (défaut : ./backups)
#   BACKUP_KEEP  : Nombre de sauvegardes automatiques à conserver (défaut : 14)
#   USE_DOCKER   : Si 1, exécute pg_dump via docker compose exec -T db (défaut : 0)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"
USE_DOCKER="${USE_DOCKER:-0}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEFAULT_FILENAME="ciat_backup_${TIMESTAMP}.dump"
TARGET_FILE=""
AVEC_MEDIA=false
IS_EXPLICIT_TARGET=false

# Traitement des arguments
for arg in "$@"; do
    case "$arg" in
        --avec-media)
            AVEC_MEDIA=true
            ;;
        *)
            if [ -z "$TARGET_FILE" ]; then
                TARGET_FILE="$arg"
                IS_EXPLICIT_TARGET=true
            fi
            ;;
    esac
done

if [ -z "$TARGET_FILE" ]; then
    mkdir -p "$BACKUP_DIR"
    TARGET_FILE="${BACKUP_DIR}/${DEFAULT_FILENAME}"
fi

# Parsing robuste de DATABASE_URL (support mots de passe encodés %40, %3A, %2F)
if [ -n "${DATABASE_URL:-}" ]; then
    PARSED_ENV=""
    if command -v python3 >/dev/null 2>&1; then
        PY_CMD="python3"
    elif command -v python >/dev/null 2>&1; then
        PY_CMD="python"
    else
        PY_CMD=""
    fi

    if [ -n "$PY_CMD" ]; then
        PARSED_ENV=$($PY_CMD -c '
import sys, urllib.parse, shlex
url = sys.argv[1]
try:
    p = urllib.parse.urlsplit(url)
    u = urllib.parse.unquote(p.username or "")
    pwd = urllib.parse.unquote(p.password or "")
    h = p.hostname or ""
    port = str(p.port or "")
    db = p.path.lstrip("/").split("?")[0]
    print(f"PGUSER={shlex.quote(u)}")
    print(f"PGPASSWORD={shlex.quote(pwd)}")
    print(f"PGHOST={shlex.quote(h)}")
    if port:
        print(f"PGPORT={shlex.quote(port)}")
    print(f"PGDATABASE={shlex.quote(db)}")
except Exception:
    sys.exit(1)
' "$DATABASE_URL" 2>/dev/null || true)
    fi

    if [ -n "$PARSED_ENV" ]; then
        eval "$PARSED_ENV"
    else
        # Repli bash basique
        PROTO="${DATABASE_URL%%://*}"
        URL_WITHOUT_PROTO="${DATABASE_URL#*://}"
        USER_PASS="${URL_WITHOUT_PROTO%%@*}"
        HOST_PORT_DB="${URL_WITHOUT_PROTO##*@}"

        if [ "$USER_PASS" != "$URL_WITHOUT_PROTO" ]; then
            PGUSER="${USER_PASS%%:*}"
            if [ "$USER_PASS" != "$PGUSER" ]; then
                PGPASSWORD="${USER_PASS#*:}"
                export PGPASSWORD
            fi
        fi

        HOST_PORT="${HOST_PORT_DB%%/*}"
        PGDATABASE="${HOST_PORT_DB#*/}"
        PGDATABASE="${PGDATABASE%%\?*}"

        PGHOST="${HOST_PORT%%:*}"
        if [ "$HOST_PORT" != "$PGHOST" ]; then
            PGPORT="${HOST_PORT#*:}"
        fi
    fi
fi

# Valeurs par défaut alignées sur docker-compose.yml
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-ciat}"
PGPASSWORD="${PGPASSWORD:-ciat}"
PGDATABASE="${PGDATABASE:-ciat}"

export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

echo "=========================================================="
echo " CIAT — Sauvegarde PostgreSQL"
echo "=========================================================="
echo " Date       : $(date)"
echo " Hôte       : ${PGHOST}:${PGPORT}"
echo " Base       : ${PGDATABASE}"
echo " Utilisateur: ${PGUSER}"
echo " Fichier    : ${TARGET_FILE}"
echo " Format     : pg_dump custom (-Fc, compressé)"
echo " Mode       : $( [ "$USE_DOCKER" = "1" ] && echo "Docker compose exec" || echo "Client local" )"
echo "----------------------------------------------------------"

mkdir -p "$(dirname "$TARGET_FILE")"
PARTIAL_FILE="${TARGET_FILE}.partiel"

# Nettoyage automatique en cas d'interruption
cleanup() {
    if [ -f "$PARTIAL_FILE" ]; then
        rm -f "$PARTIAL_FILE"
    fi
}
trap cleanup EXIT INT TERM

# Exécution de pg_dump
echo "=> Génération du dump de la base de données..."
DUMP_ERR=""

if [ "$USE_DOCKER" = "1" ]; then
    if ! docker compose exec -T -e PGPASSWORD="$PGPASSWORD" db pg_dump \
        --username="$PGUSER" \
        --dbname="$PGDATABASE" \
        --format=custom \
        --blobs > "$PARTIAL_FILE" 2> /tmp/ciat_pg_dump.err; then
        DUMP_ERR=$(cat /tmp/ciat_pg_dump.err 2>/dev/null || true)
        echo "[ERREUR] Échec de pg_dump via Docker :" >&2
        echo "$DUMP_ERR" >&2
        exit 1
    fi
else
    if ! command -v pg_dump >/dev/null 2>&1; then
        echo "[ERREUR] pg_dump est introuvable sur le système hôte." >&2
        echo "[AIDE] Utilisez USE_DOCKER=1 pour exécuter pg_dump dans le conteneur db." >&2
        exit 1
    fi

    if ! pg_dump \
        --host="$PGHOST" \
        --port="$PGPORT" \
        --username="$PGUSER" \
        --dbname="$PGDATABASE" \
        --format=custom \
        --blobs \
        --file="$PARTIAL_FILE" 2> /tmp/ciat_pg_dump.err; then
        DUMP_ERR=$(cat /tmp/ciat_pg_dump.err 2>/dev/null || true)
        echo "[ERREUR] Échec de pg_dump :" >&2
        echo "$DUMP_ERR" >&2
        if echo "$DUMP_ERR" | grep -qi "server version mismatch"; then
            echo "[AIDE] Votre version client pg_dump est plus ancienne que celle du serveur PostgreSQL." >&2
            echo "[AIDE] Activez le mode Docker avec USE_DOCKER=1 pour exécuter la sauvegarde via le conteneur." >&2
        fi
        exit 1
    fi
fi

# Validation immédiate du fichier généré avec pg_restore --list
echo "=> Validation de l'intégrité du dump..."
VALID_DUMP=false
if [ "$USE_DOCKER" = "1" ]; then
    if docker compose exec -T db pg_restore --list < "$PARTIAL_FILE" >/dev/null 2>&1; then
        VALID_DUMP=true
    fi
else
    if command -v pg_restore >/dev/null 2>&1 && pg_restore --list "$PARTIAL_FILE" >/dev/null 2>&1; then
        VALID_DUMP=true
    fi
fi

if [ "$VALID_DUMP" = false ]; then
    echo "[ERREUR] Le dump généré est invalide ou corrompu." >&2
    rm -f "$PARTIAL_FILE"
    exit 1
fi

# Renommage atomique du fichier partiel vers le fichier final
mv "$PARTIAL_FILE" "$TARGET_FILE"
trap - EXIT INT TERM

FILE_SIZE=$(du -h "$TARGET_FILE" | cut -f1)
echo "=> Dump validé et écrit avec succès (${FILE_SIZE})."

# Sauvegarde des médias si demandée
if [ "$AVEC_MEDIA" = true ]; then
    MEDIA_DIR="backend/media"
    MEDIA_ARCHIVE="${TARGET_FILE%.dump}_media.tar.gz"
    if [ -d "$MEDIA_DIR" ]; then
        echo "=> Sauvegarde des fichiers médias (backend/media)..."
        tar -czf "$MEDIA_ARCHIVE" -C "$(dirname "$MEDIA_DIR")" "$(basename "$MEDIA_DIR")"
        echo "=> Archive médias créée : ${MEDIA_ARCHIVE}"
    else
        echo "[AVERTISSEMENT] Répertoire backend/media introuvable. Aucun média sauvegardé."
    fi
else
    echo "[AVERTISSEMENT] Les fichiers de backend/media/ ne sont pas inclus (utiliser --avec-media)."
fi

# Gestion de la rétention (uniquement pour les sauvegardes automatiques dans BACKUP_DIR)
if [ "$IS_EXPLICIT_TARGET" = false ] && [ -d "$BACKUP_DIR" ]; then
    DUMP_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -name "ciat_backup_*.dump" -type f | wc -l)
    if [ "$DUMP_COUNT" -gt "$BACKUP_KEEP" ]; then
        EXCESS=$((DUMP_COUNT - BACKUP_KEEP))
        echo "=> Application de la rétention (${BACKUP_KEEP} conservés, ${EXCESS} à purger)..."
        find "$BACKUP_DIR" -maxdepth 1 -name "ciat_backup_*.dump" -type f | sort | head -n "$EXCESS" | while read -r old_dump; do
            echo "   Suppression : ${old_dump}"
            rm -f "$old_dump"
            old_media="${old_dump%.dump}_media.tar.gz"
            if [ -f "$old_media" ]; then
                rm -f "$old_media"
            fi
        done
    fi
fi

echo "----------------------------------------------------------"
echo "[SUCCÈS] Sauvegarde terminée avec succès !"
echo " Emplacement : ${TARGET_FILE}"
echo " Taille      : ${FILE_SIZE}"
echo "=========================================================="
