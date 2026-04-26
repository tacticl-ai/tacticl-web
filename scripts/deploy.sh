#!/bin/bash
set -euo pipefail

ENV=${1:-prod}
if [[ "$ENV" != "prod" ]]; then
  echo "error: only 'prod' is supported (tacticl-web currently has one target)" >&2
  exit 1
fi

REMOTE_HOST="platform-infra"
REMOTE_PATH="/opt/cidadel/tacticl-frontend/"

echo "Building tacticl-web..."
npm run build

echo "Deploying dist/ to $REMOTE_HOST:$REMOTE_PATH..."
rsync -avz --delete dist/ "$REMOTE_HOST:$REMOTE_PATH"

echo "Deploy complete. https://tacticl.ai"
