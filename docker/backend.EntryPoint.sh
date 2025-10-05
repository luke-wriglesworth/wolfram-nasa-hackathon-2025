#!/usr/bin/env bash
set -euo pipefail

# ALEMBIC_CONFIG="${ALEMBIC_CONFIG:-/build/db/src/sharksdb/alembic.ini}"

log() { printf '[entrypoint] %s\n' "$*"; }

# Wait for TCP if DB_HOST/DB_PORT are provided (skip for SQLite or if unset)
wait_for_tcp() {
  if [[ -n "${DB_HOST:-}" && -n "${DB_PORT:-}" ]]; then
    log "Waiting for database at ${DB_HOST}:${DB_PORT} ..."
    for i in {1..60}; do
      if (echo >"/dev/tcp/${DB_HOST}/${DB_PORT}") >/dev/null 2>&1; then
        log "Database port is reachable."
        return 0
      fi
      sleep 2
    done
    log "WARNING: Timed out waiting for ${DB_HOST}:${DB_PORT}; continuing anyway."
  else
    log "DB_HOST/DB_PORT not set; skipping TCP wait (SQLite or URL-only config?)."
  fi
}

# Sanity checks
if [[ ! -f "$ALEMBIC_CONFIG" ]]; then
  echo "[entrypoint] ERROR: alembic.ini not found at $ALEMBIC_CONFIG" >&2
  exit 1
fi

# Optional: surface DATABASE_URL override for Alembic (handled in env.py)
if [[ -n "${DATABASE_URL:-}" ]]; then
  log "Using DATABASE_URL from environment."
fi

wait_for_tcp

log "Running migrations: alembic -c $ALEMBIC_CONFIG upgrade head"
alembic -c "$ALEMBIC_CONFIG" upgrade head

python -m ensurepip

log "[entrypoint] Starting backend:"
# Replace the shell with the final process (don’t background it)
exec "$@"
