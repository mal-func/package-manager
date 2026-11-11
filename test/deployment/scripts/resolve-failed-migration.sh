#!/usr/bin/env bash
# Unblocks deploys after a migration failed during ./scripts/deploy.sh.
#
# Prisma records a failed migration and then refuses every later
# `migrate deploy` (error P3009) until someone confirms it was rolled
# back. deploy.sh already guarantees the failed version never went
# live; this marks the migration as rolled back so the next deploy —
# with the migration fixed, or removed — can run.
#
# Usage: ./scripts/resolve-failed-migration.sh <migration-name>
#   e.g. ./scripts/resolve-failed-migration.sh 20261001120000_add_orders
# (the name is in deploy.sh's error output: "The `<name>` migration ...
# failed").
#
# BEFORE running this, check the database: MySQL can't roll back DDL,
# so a migration with several statements may have partly applied. Undo
# any statement that did run (or make the fixed migration tolerate it),
# otherwise the fixed migration will fail again on the same objects.

set -euo pipefail
cd "$(dirname "$0")/../compose"

MIGRATION="${1:?Usage: resolve-failed-migration.sh <migration-name>}"

for required in .env.production current-versions.env; do
  if [ ! -f "$required" ]; then
    echo "compose/$required not found — this only applies to a server deploy.sh has run on." >&2
    exit 1
  fi
done

COMPOSE=(docker compose -f compose.production.yaml)
ENV_FILES=(--env-file .env.production --env-file current-versions.env)
if [ -f .env.https ]; then
  COMPOSE+=(-f compose.https.yaml)
  ENV_FILES+=(--env-file .env.https)
fi

# The currently-serving backend image is enough: `migrate resolve` only
# updates Prisma's bookkeeping table, it doesn't need the migration file.
echo "==> Marking $MIGRATION as rolled back..."
"${COMPOSE[@]}" "${ENV_FILES[@]}" --profile tools run --rm migrate \
  npx prisma migrate resolve --rolled-back "$MIGRATION"

echo "==> Done. Fix (or remove) the migration, publish a new image, and run ./scripts/deploy.sh again."
