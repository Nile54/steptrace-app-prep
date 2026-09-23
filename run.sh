#!/bin/sh
# Prefer an installed Node; use the existing Codex runtime on this Mac if needed.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if command -v node >/dev/null 2>&1; then
  steptrace_node=$(command -v node)
elif [ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]; then
  steptrace_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
else
  echo 'Node.js 22 or later is required. Install it from https://nodejs.org, then run this script again.' >&2
  exit 1
fi
case "${1:-start}" in
  start) exec "$steptrace_node" scripts/serve.mjs ;;
  check) exec "$steptrace_node" scripts/check.mjs ;;
  evaluate) shift; exec "$steptrace_node" scripts/evaluate.mjs "$@" ;;
  evaluate-ui) exec "$steptrace_node" scripts/evaluation-server.mjs ;;
  *) echo 'Usage: ./run.sh [start|check|evaluate|evaluate-ui]' >&2; exit 1 ;;
esac
