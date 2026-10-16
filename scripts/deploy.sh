#!/usr/bin/env bash
# Builds the committed HEAD locally and ships the standalone output to the server.
# The host has no swap and runs other apps, so building there risks the OOM killer.
set -euo pipefail

SERVER="root@178.104.131.90"
REMOTE_DIR="/opt/ahtapot-n11"
SITE_URL="https://ahtapot.n11.works"
DB_PORT=55441
# The host already runs an unrelated compose project named "ahtapot".
COMPOSE="docker compose -p ahtapot-n11"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${TMPDIR:-/tmp}"
BUILD_DIR="${BUILD_DIR%/}/ahtapot-deploy"

cd "$ROOT"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit edilmemiş değişiklikler var; önce commit'le." >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Deploy yalnızca main branch'inden yapılır." >&2
  exit 1
fi
COMMIT="$(git rev-parse --short HEAD)"

echo "→ GitHub'a gönderiliyor ($COMMIT)"
git push origin main

echo "→ Build"
rm -rf "$BUILD_DIR/src" "$BUILD_DIR/out"
mkdir -p "$BUILD_DIR/src"
git archive HEAD | tar -x -C "$BUILD_DIR/src"
cd "$BUILD_DIR/src"
npm ci --no-audit --no-fund --loglevel=error
# Build only needs these to exist; runtime values come from $REMOTE_DIR/.env.
DATABASE_URL="postgres://build:build@127.0.0.1:1/build" \
BETTER_AUTH_SECRET="build-only-placeholder-secret" \
BETTER_AUTH_URL="$SITE_URL" \
  npm run build:web

OUT="$BUILD_DIR/out"
cp -R apps/web/.next/standalone "$OUT"
cp -R apps/web/.next/static "$OUT/apps/web/.next/static"
cp -R apps/web/public "$OUT/apps/web/public"

echo "→ Sunucuya yükleniyor"
ssh "$SERVER" "test -f $REMOTE_DIR/.env" || {
  echo "$REMOTE_DIR/.env sunucuda yok; önce ilk kurulumu yap." >&2
  exit 1
}
rsync -az --delete --exclude 'node_modules/@img/*darwin*' \
  --link-dest="$REMOTE_DIR/current/" "$OUT/" "$SERVER:$REMOTE_DIR/releases/$COMMIT/"
rsync -az "$ROOT/docker-compose.yml" "$ROOT/deploy/ecosystem.config.cjs" "$SERVER:$REMOTE_DIR/"

echo "→ Veritabanı"
ssh "$SERVER" "cd $REMOTE_DIR && $COMPOSE up -d --wait postgres"
DB_PASSWORD="$(ssh "$SERVER" "grep '^POSTGRES_PASSWORD=' $REMOTE_DIR/.env | cut -d= -f2-")"
TUNNEL="$BUILD_DIR/tunnel.sock"
ssh -fN -M -S "$TUNNEL" -o ExitOnForwardFailure=yes -L "$DB_PORT:127.0.0.1:$DB_PORT" "$SERVER"
trap 'ssh -S "$TUNNEL" -O exit "$SERVER" 2>/dev/null || true' EXIT
DATABASE_URL="postgres://ahtapot:$DB_PASSWORD@127.0.0.1:$DB_PORT/ahtapot" node packages/db/src/migrate.ts

echo "→ Yayına alınıyor"
ssh "$SERVER" "set -e
  cd $REMOTE_DIR
  ln -sfn releases/$COMMIT current
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save >/dev/null
  ls -1dt releases/* | tail -n +4 | xargs -r rm -rf"

echo "→ Kontrol"
curl -fsS -o /dev/null --retry 10 --retry-delay 2 --retry-all-errors -w "$SITE_URL/giris → %{http_code}\n" "$SITE_URL/giris"
echo "✓ $COMMIT yayında: $SITE_URL"
