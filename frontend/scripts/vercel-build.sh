#!/usr/bin/env bash
# Vercel build entry point. With a Convex deploy key, push the Convex functions
# and build the site against that deployment (convex deploy sets NEXT_PUBLIC_CONVEX_URL).
# Without one, build the static site so previews work before Convex is linked.
set -euo pipefail

if [[ -n "${CONVEX_DEPLOY_KEY:-}" ]]; then
  # --preview-run only runs for a newly created preview deployment; production ignores it.
  npx convex deploy --cmd 'npm run build' --preview-run seed:init
else
  echo "CONVEX_DEPLOY_KEY is not set; building the static site without a backend."
  npm run build
fi
