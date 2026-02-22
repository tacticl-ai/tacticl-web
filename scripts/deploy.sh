#!/bin/bash
set -euo pipefail

ENV=${1:-qa}
echo "Deploying tacticl-web to $ENV..."

npm run build

firebase deploy --only hosting --project tacticl

echo "Deploy complete."
