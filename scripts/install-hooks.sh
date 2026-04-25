#!/usr/bin/env bash
# Install git hooks for this repo. Run once after cloning.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_SRC="$ROOT/scripts/pre-commit-secret-scan.sh"
HOOK_DEST="$ROOT/.git/hooks/pre-commit"

if [[ ! -d "$ROOT/.git" ]]; then
  echo "ERROR: $ROOT is not a git repo (no .git/ directory)."
  exit 1
fi

if [[ ! -f "$HOOK_SRC" ]]; then
  echo "ERROR: $HOOK_SRC missing."
  exit 1
fi

mkdir -p "$ROOT/.git/hooks"
cp "$HOOK_SRC" "$HOOK_DEST"
chmod +x "$HOOK_DEST"

echo "✓ Installed pre-commit hook at $HOOK_DEST"
echo "  Source: $HOOK_SRC"
echo
echo "To bypass (NOT recommended): git commit --no-verify"
