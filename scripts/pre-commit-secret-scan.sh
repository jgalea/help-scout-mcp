#!/usr/bin/env bash
# Pre-commit hook: block commits containing hardcoded Help Scout credentials,
# AI-tooling files, or other common secret patterns. Exit non-zero to reject.
# Install via:  npm run install-hooks

set -uo pipefail

# Files staged for this commit
staged=$(git diff --cached --name-only --diff-filter=ACM)
[[ -z "$staged" ]] && exit 0

fail=0

# 1. Block AI-tooling files. Upstream's leak came from .claude/settings.local.json.
ai_paths=$(echo "$staged" | grep -E '^(\.claude/|\.cursor/|GEMINI\.md|AGENTS\.local\.md|CLAUDE\.md|claude-desktop-config\.json)' || true)
if [[ -n "$ai_paths" ]]; then
  echo "ERROR: refusing to commit AI-tooling files:"
  echo "$ai_paths" | sed 's/^/  - /'
  echo "These files often contain credentials. Add to .gitignore."
  fail=1
fi

# 2. Scan staged content for likely secrets.
patterns=(
  # Any variable / env var named secret-ish, assigned a quoted long base62-ish string
  '(SECRET|TOKEN|API[_-]?KEY|PASSWORD|PASSWD|AUTH|CREDENTIAL|PRIVATE[_-]?KEY|BEARER|CLIENT[_-]?SECRET|CLIENT[_-]?ID|APP[_-]?ID|APP[_-]?SECRET)[[:space:]]*[=:][[:space:]]*["'"'"'][A-Za-z0-9+/=_\-]{20,}["'"'"']'
  # Same patterns without quotes (env-style assignments in shell, env files)
  '(SECRET|TOKEN|API[_-]?KEY|PASSWORD|AUTH|CREDENTIAL|BEARER)[[:space:]]*=[[:space:]]*[A-Za-z0-9+/=_\-]{32,}'
  # Help Scout specifically (any 32-char base62 near "helpscout")
  '[Hh][Ee][Ll][Pp][Ss][Cc][Oo][Uu][Tt][^"'"'"']*["'"'"'][A-Za-z0-9]{32}["'"'"']'
  # AWS keys
  'AKIA[0-9A-Z]{16}'
  # Generic JWTs
  'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
  # Stripe live keys
  'sk_live_[A-Za-z0-9]{20,}'
  # Slack tokens
  'xox[abprs]-[A-Za-z0-9-]{10,}'
  # GitHub PAT
  'ghp_[A-Za-z0-9]{36}'
  'gho_[A-Za-z0-9]{36}'
  # Google API key
  'AIza[A-Za-z0-9_-]{35}'
)

for pattern in "${patterns[@]}"; do
  hits=$(git diff --cached -U0 -- ':(exclude)*.test.ts' ':(exclude)*.test.js' ':(exclude)__tests__/*' \
    | grep -E "^\+" \
    | grep -iE "$pattern" \
    | grep -v 'your-app-secret\|your-app-id\|YOUR_APP_SECRET\|YOUR_APP_ID\|example\|placeholder\|REDACTED' \
    || true)
  if [[ -n "$hits" ]]; then
    echo "ERROR: possible secret detected matching pattern: $pattern"
    echo "Sample hit (first 200 chars):"
    echo "$hits" | head -3 | cut -c1-200
    echo
    echo "If this is a false positive, you can bypass with: git commit --no-verify"
    fail=1
  fi
done

if [[ $fail -ne 0 ]]; then
  echo
  echo "Pre-commit secret scan failed. See above. Aborting commit."
  exit 1
fi

exit 0
