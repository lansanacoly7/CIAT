#!/usr/bin/env bash
# ==============================================================================
# CIAT — Vérification de bout en bout sauvegarde & restauration (Phase 4 — T3)
# ==============================================================================
# Usage :
#   ./scripts/verifier_sauvegarde_restauration.sh
#
# Comportement :
#   1. Relève le nombre exact de lignes de chaque table du schéma public.
#   2. Exécute une sauvegarde complète vers un fichier temporaire.
#   3. Tronque une table métier (incubator_dossier CASCADE) pour simuler une perte.
#   4. Restaure la base via restauration_bd.sh --yes.
#   5. Relève à nouveau les comptes et compare table par table.
#   6. Affiche le tableau comparatif et conclut par IDENTIQUE (0) ou DIFFÉRENT (1).
# ==============================================================================

set -euo pipefail

USE_DOCKER="${USE_DOCKER:-0}"

# Parsing de DATABASE_URL si fournie
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
    fi
fi

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-ciat}"
PGPASSWORD="${PGPASSWORD:-ciat}"
PGDATABASE="${PGDATABASE:-ciat}"

export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

# Protection absolue : ne jamais exécuter sur une base distante
if [ "$PGHOST" != "localhost" ] && [ "$PGHOST" != "127.0.0.1" ]; then
    echo "[ERREUR] Le script de vérification refuse de s'exécuter sur une base distante ('${PGHOST}')." >&2
    echo "[ERREUR] Seuls localhost et 127.0.0.1 sont autorisés pour protéger les bases de production." >&2
    exit 1
fi

TEMP_DUMP=$(mktemp /tmp/ciat_verif_XXXXXX.dump 2>/dev/null || echo "./backups/ciat_verif_temp_$$.dump")

cleanup() {
    rm -f "$TEMP_DUMP" "${TEMP_DUMP}.partiel"
}
trap cleanup EXIT INT TERM

# Fonction d'exécution SQL
exec_sql() {
    local sql="$1"
    if [ "$USE_DOCKER" = "1" ]; then
        docker compose exec -T -e PGPASSWORD="$PGPASSWORD" db psql \
            --username="$PGUSER" \
            --dbname="$PGDATABASE" \
            -t -A -c "$sql"
    else
        psql \
            --host="$PGHOST" \
            --port="$PGPORT" \
            --username="$PGUSER" \
            --dbname="$PGDATABASE" \
            -t -A -c "$sql"
    fi
}

echo "=========================================================="
echo " CIAT — Test de vérification Sauvegarde / Restauration"
echo "=========================================================="
echo " Base testée : ${PGDATABASE} sur ${PGHOST}:${PGPORT}"
echo " Mode        : $( [ "$USE_DOCKER" = "1" ] && echo "Docker compose" || echo "Local" )"
echo "----------------------------------------------------------"

# Test de connectivité
if ! exec_sql "SELECT 1;" >/dev/null 2>&1; then
    echo "[ERREUR] Impossible de se connecter à la base PostgreSQL (${PGDATABASE} sur ${PGHOST}:${PGPORT})." >&2
    exit 1
fi

# Fonction de relevé exact de toutes les tables du schéma public
get_table_counts() {
    local outfile="$1"
    rm -f "$outfile"
    local tables
    tables=$(exec_sql "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;" | tr -d '\r')
    for tbl in $tables; do
        tbl=$(echo "$tbl" | tr -d '\r')
        if [ -n "$tbl" ]; then
            local count
            count=$(exec_sql "SELECT count(*) FROM \"${tbl}\";" | tr -d '\r')
            echo "${tbl}|${count}" >> "$outfile"
        fi
    done
}

FILE_BEFORE=$(mktemp /tmp/ciat_counts_before_XXXXXX 2>/dev/null || echo "./ciat_counts_before_$$.tmp")
FILE_AFTER=$(mktemp /tmp/ciat_counts_after_XXXXXX 2>/dev/null || echo "./ciat_counts_after_$$.tmp")

# 1. Relevé initial
echo "=> Étape 1 : Relevé initial des lignes de chaque table..."
get_table_counts "$FILE_BEFORE"
TABLE_COUNT=$(wc -l < "$FILE_BEFORE")
echo "   ${TABLE_COUNT} tables analysées dans le schéma public."

# 2. Sauvegarde vers fichier temporaire
echo "=> Étape 2 : Lancement de sauvegarde_bd.sh vers ${TEMP_DUMP}..."
./scripts/sauvegarde_bd.sh "$TEMP_DUMP" >/dev/null

# 3. Altération volontaire (simulation de perte)
echo "=> Étape 3 : Altération volontaire (TRUNCATE incubator_dossier CASCADE)..."
exec_sql "TRUNCATE TABLE incubator_dossier CASCADE;" >/dev/null
COUNT_MUTATED=$(exec_sql "SELECT count(*) FROM incubator_dossier;")
echo "   Lignes dans incubator_dossier après troncature : ${COUNT_MUTATED}"

# 4. Restauration
echo "=> Étape 4 : Lancement de restauration_bd.sh..."
./scripts/restauration_bd.sh "$TEMP_DUMP" --yes >/dev/null

# 5. Relevé après restauration
echo "=> Étape 5 : Relevé des lignes après restauration..."
get_table_counts "$FILE_AFTER"

# 6. Comparaison et affichage du tableau
echo "----------------------------------------------------------"
printf "%-40s | %-10s | %-10s | %-10s\n" "Table" "Avant" "Après" "Résultat"
echo "----------------------------------------------------------"

HAS_DIFF=false

while IFS='|' read -r tbl cnt_before; do
    cnt_after=$(grep "^${tbl}|" "$FILE_AFTER" | cut -d'|' -f2 || echo "ABSENTE")
    if [ "$cnt_before" = "$cnt_after" ]; then
        status="OK"
    else
        status="ERREUR"
        HAS_DIFF=true
    fi
    printf "%-40s | %-10s | %-10s | %-10s\n" "$tbl" "$cnt_before" "$cnt_after" "$status"
done < "$FILE_BEFORE"

rm -f "$FILE_BEFORE" "$FILE_AFTER"
echo "----------------------------------------------------------"

if [ "$HAS_DIFF" = false ]; then
    echo "Verdict : IDENTIQUE"
    echo "=========================================================="
    exit 0
else
    echo "Verdict : DIFFÉRENT"
    echo "=========================================================="
    exit 1
fi
