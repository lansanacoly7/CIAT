#!/usr/bin/env bash
# ==============================================================================
# CIAT — Script de restauration de la base de données PostgreSQL (Phase 4 — T3)
# ==============================================================================
# Usage :
#   ./scripts/restauration_bd.sh [chemin_fichier_dump] [--yes|-y] [--avec-media]
#
# Variables d'environnement supportées :
#   DATABASE_URL : URL de connexion (ex. postgres://ciat:ciat@localhost:5432/ciat)
#   PGHOST       : Hôte PostgreSQL (défaut : localhost)
#   PGPORT       : Port PostgreSQL (défaut : 5432)
#   PGUSER       : Utilisateur (défaut : ciat)
#   PGPASSWORD   : Mot de passe (défaut : ciat)
#   PGDATABASE   : Nom de la base cible (défaut : ciat)
#   BACKUP_DIR   : Répertoire de recherche par défaut (défaut : ./backups)
#   USE_DOCKER   : Si 1, exécute pg_restore via docker compose exec -T db (défaut : 0)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
USE_DOCKER="${USE_DOCKER:-0}"
TARGET_FILE=""
ASSUME_YES=false
AVEC_MEDIA=false

# Traitement des arguments
for arg in "$@"; do
    case "$arg" in
        --yes|-y)
            ASSUME_YES=true
            ;;
        --avec-media)
            AVEC_MEDIA=true
            ;;
        *)
            if [ -z "$TARGET_FILE" ]; then
                TARGET_FILE="$arg"
            fi
            ;;
    esac
done

# Recherche automatique de la sauvegarde la plus récente si aucun argument
if [ -z "$TARGET_FILE" ]; then
    if [ -d "$BACKUP_DIR" ]; then
        LATEST_BACKUP=$(find "$BACKUP_DIR" -maxdepth 1 -type f \( -name "*.dump" -o -name "*.sql" \) | sort -r | head -n 1 || true)
        if [ -n "$LATEST_BACKUP" ]; then
            TARGET_FILE="$LATEST_BACKUP"
            echo "=> Aucun fichier spécifié : sélection de la sauvegarde la plus récente : ${TARGET_FILE}"
        fi
    fi
fi

if [ -z "$TARGET_FILE" ] || [ ! -f "$TARGET_FILE" ]; then
    echo "[ERREUR] Fichier de sauvegarde introuvable." >&2
    echo "Usage : $0 [chemin_fichier_dump] [--yes] [--avec-media]" >&2
    exit 1
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
echo " CIAT — Restauration PostgreSQL"
echo "=========================================================="
echo " Date       : $(date)"
echo " Fichier    : ${TARGET_FILE}"
echo " Hôte cible : ${PGHOST}:${PGPORT}"
echo " Base cible : ${PGDATABASE}"
echo " Utilisateur: ${PGUSER}"
echo " Mode       : $( [ "$USE_DOCKER" = "1" ] && echo "Docker compose exec" || echo "Client local" )"
echo "----------------------------------------------------------"

# Validation stricte du fichier AVANT de toucher à la base
echo "=> Vérification de la structure du fichier de sauvegarde..."
IS_CUSTOM_DUMP=false
IS_SQL_TEXT=false

if [ "$USE_DOCKER" = "1" ]; then
    if docker compose exec -T db pg_restore --list < "$TARGET_FILE" >/dev/null 2>&1; then
        IS_CUSTOM_DUMP=true
    fi
else
    if command -v pg_restore >/dev/null 2>&1 && pg_restore --list "$TARGET_FILE" >/dev/null 2>&1; then
        IS_CUSTOM_DUMP=true
    fi
fi

if [ "$IS_CUSTOM_DUMP" = false ]; then
    # Test si le fichier est un script SQL texte valide
    if head -n 30 "$TARGET_FILE" 2>/dev/null | grep -qE "(CREATE|INSERT|SET|DROP|BEGIN|--|ALTER|SELECT)"; then
        IS_SQL_TEXT=true
    fi
fi

if [ "$IS_CUSTOM_DUMP" = false ] && [ "$IS_SQL_TEXT" = false ]; then
    echo "[ERREUR] Le fichier '${TARGET_FILE}' est invalide (dump corrompu ou format non reconnu)." >&2
    echo "[ERREUR] Restauration abandonnée. La base de données '${PGDATABASE}' n'a pas été modifiée." >&2
    exit 1
fi

# Demande de confirmation si non automatisé
if [ "$ASSUME_YES" = false ]; then
    echo "[ATTENTION] Cette opération va réinitialiser les données de la base '${PGDATABASE}'."
    read -r -p "Voulez-vous continuer ? (o/N) " confirm
    if [[ ! "$confirm" =~ ^[oOyY]$ ]]; then
        echo "Opération annulée par l'utilisateur."
        exit 0
    fi
fi

# Exécution de la restauration
if [ "$IS_CUSTOM_DUMP" = true ]; then
    echo "=> Format validé : archive pg_dump custom (-Fc)"
    echo "=> Lancement de pg_restore (--clean --if-exists --single-transaction --exit-on-error)..."

    if [ "$USE_DOCKER" = "1" ]; then
        docker compose exec -T -e PGPASSWORD="$PGPASSWORD" db pg_restore \
            --username="$PGUSER" \
            --dbname="$PGDATABASE" \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            --single-transaction \
            --exit-on-error \
            --verbose < "$TARGET_FILE"
    else
        if ! command -v pg_restore >/dev/null 2>&1; then
            echo "[ERREUR] pg_restore est introuvable sur le système hôte." >&2
            echo "[AIDE] Utilisez USE_DOCKER=1 pour exécuter pg_restore via le conteneur." >&2
            exit 1
        fi

        pg_restore \
            --host="$PGHOST" \
            --port="$PGPORT" \
            --username="$PGUSER" \
            --dbname="$PGDATABASE" \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            --single-transaction \
            --exit-on-error \
            --verbose \
            "$TARGET_FILE"
    fi
else
    echo "=> Format validé : script SQL textuel"
    echo "=> Exécution via psql (-v ON_ERROR_STOP=1 --single-transaction)..."

    if [ "$USE_DOCKER" = "1" ]; then
        docker compose exec -T -e PGPASSWORD="$PGPASSWORD" db psql \
            --username="$PGUSER" \
            --dbname="$PGDATABASE" \
            -v ON_ERROR_STOP=1 \
            --single-transaction < "$TARGET_FILE"
    else
        if ! command -v psql >/dev/null 2>&1; then
            echo "[ERREUR] psql est introuvable sur le système hôte." >&2
            exit 1
        fi

        psql \
            --host="$PGHOST" \
            --port="$PGPORT" \
            --username="$PGUSER" \
            --dbname="$PGDATABASE" \
            -v ON_ERROR_STOP=1 \
            --single-transaction \
            --file="$TARGET_FILE"
    fi
fi

# Restauration des médias associés si présents
MEDIA_ARCHIVE="${TARGET_FILE%.dump}_media.tar.gz"
MANIFEST_FILE="${TARGET_FILE%.dump}_media.sha256"

if [ "$AVEC_MEDIA" = true ] || [ -f "$MEDIA_ARCHIVE" ]; then
    if [ -f "$MEDIA_ARCHIVE" ]; then
        echo "=> Restauration de l'archive médias (${MEDIA_ARCHIVE})..."
        mkdir -p "$REPO_ROOT/backend"
        tar -xzf "$MEDIA_ARCHIVE" -C "$REPO_ROOT/backend"
        RESTORED_COUNT=$(find "$REPO_ROOT/backend/media" -type f 2>/dev/null | wc -l || echo "0")
        echo "=> ${RESTORED_COUNT} fichiers médias restaurés dans backend/media."

        # Vérification des empreintes SHA-256 si le manifeste existe
        if [ -f "$MANIFEST_FILE" ] && [ -s "$MANIFEST_FILE" ]; then
            echo "=> Contrôle d'intégrité SHA-256 des fichiers restaurés..."
            if (cd "$REPO_ROOT/backend" && (sha256sum -c "$MANIFEST_FILE" >/dev/null 2>&1 || shasum -a 256 -c "$MANIFEST_FILE" >/dev/null 2>&1)); then
                echo "=> [VÉRIFIÉ] Toutes les empreintes SHA-256 des fichiers médias correspondent à 100% !"
            else
                echo "[AVERTISSEMENT] Divergence d'empreinte détectée sur certains fichiers médias."
            fi
        fi
    else
        if [ "$AVEC_MEDIA" = true ]; then
            echo "[AVERTISSEMENT] Archive médias '${MEDIA_ARCHIVE}' introuvable."
        fi
    fi
fi

echo "----------------------------------------------------------"
echo "[SUCCÈS] Restauration achevée avec succès dans '${PGDATABASE}' !"
echo "=========================================================="
