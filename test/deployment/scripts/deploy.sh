#!/usr/bin/env bash
# Deploys a specific frontend/backend version pair to this server.
#
# Usage: ./scripts/deploy.sh <frontend-version> <backend-version>
# Example: ./scripts/deploy.sh f144a57... fc9c6e5...
#
# Requires compose/.env.production to already exist (secrets, DB
# password, PUBLIC_ORIGIN, FRONTEND_IMAGE/BACKEND_IMAGE) — copy
# env/production.env.example and fill it in once; this script only ever
# changes which image versions run.
#
# Order matters, and is what makes a failed deploy safe:
#   1. pull the new images
#   2. run the new backend image's one-off `migrate` job (migrations +
#      seed) — if this fails, stop: nothing that's serving traffic has
#      been touched, and the version records are unchanged
#   3. only then record versions for rollback and switch the stack over
#   4. poll /health
#
# Migrations must therefore stay backward-compatible with the version
# still running (add columns/tables first, drop them in a later deploy)
# — step 2 applies them while the old version is still serving, and
# rollback.sh re-runs an older image's migrate job, which is a no-op
# ("No pending migrations") against an already-newer schema.
#
# If scripts/setup-https.sh has been run, compose/.env.https exists and
# every deploy keeps the HTTPS overlay (port 443, certificates) on —
# without it, `up` would recreate the proxy HTTP-only against a TLS
# config whose certificates aren't mounted, taking the site down.

set -euo pipefail
cd "$(dirname "$0")/../compose"

FRONTEND_VERSION="${1:?Usage: deploy.sh <frontend-version> <backend-version>}"
BACKEND_VERSION="${2:?Usage: deploy.sh <frontend-version> <backend-version>}"

if [ ! -f .env.production ]; then
  echo "compose/.env.production not found. Copy env/production.env.example and fill in real values first." >&2
  exit 1
fi

cat > pending-versions.env <<EOF
FRONTEND_VERSION=$FRONTEND_VERSION
BACKEND_VERSION=$BACKEND_VERSION
EOF

COMPOSE=(docker compose -f compose.production.yaml)
ENV_FILES=(--env-file .env.production)
if [ -f .env.https ]; then
  COMPOSE+=(-f compose.https.yaml)
  ENV_FILES+=(--env-file .env.https)
  # shellcheck disable=SC1091
  HTTPS_DOMAIN="$(. ./.env.https && echo "$DOMAIN")"
fi

echo "==> Pulling frontend=$FRONTEND_VERSION backend=$BACKEND_VERSION"
"${COMPOSE[@]}" "${ENV_FILES[@]}" --env-file pending-versions.env pull frontend backend

echo "==> Applying migrations and seed with the new backend image..."
if ! "${COMPOSE[@]}" "${ENV_FILES[@]}" --env-file pending-versions.env --profile tools run --rm migrate; then
  rm -f pending-versions.env
  echo "==> Migration failed. Nothing was switched: the previous version is still serving, and" \
       "current-versions.env is unchanged. Fix the migration and deploy again." >&2
  exit 1
fi

# Records what's currently live BEFORE switching, so rollback.sh has
# something to go back to. First deploy on a fresh server: no
# current-versions.env yet, nothing to preserve — that's expected.
if [ -f current-versions.env ]; then
  cp current-versions.env previous-versions.env
  echo "==> Preserved previous versions for rollback: $(tr '\n' ' ' < previous-versions.env)"
fi
mv pending-versions.env current-versions.env

echo "==> Switching the stack to frontend=$FRONTEND_VERSION backend=$BACKEND_VERSION"
"${COMPOSE[@]}" "${ENV_FILES[@]}" --env-file current-versions.env up -d

DEFAULT_HEALTH_URL="http://localhost"
if [ -n "${HTTPS_DOMAIN:-}" ]; then
  DEFAULT_HEALTH_URL="https://$HTTPS_DOMAIN"
fi
HEALTH_URL="${HEALTH_CHECK_URL:-$DEFAULT_HEALTH_URL}/health"
echo "==> Waiting for health at $HEALTH_URL..."
HEALTHY=0
for _ in $(seq 1 30); do
  if curl -sf -m 2 "$HEALTH_URL" > /dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 2
done

if [ "$HEALTHY" -ne 1 ]; then
  echo "==> Health check failed after deploy." >&2
  if [ -f previous-versions.env ]; then
    echo "==> Run ./scripts/rollback.sh to return to the last known-good version." >&2
  fi
  exit 1
fi

echo "==> Deploy succeeded: frontend=$FRONTEND_VERSION backend=$BACKEND_VERSION, health check passed."
