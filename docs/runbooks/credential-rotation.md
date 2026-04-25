# Runbook: Help Scout credential rotation

Use when:

- Credentials are suspected leaked (committed to a public repo, posted in chat, in a screenshot)
- Quarterly rotation per security policy
- A team member with access leaves
- After running this MCP from a machine you no longer trust

**Time required:** 10-15 minutes.

## Pre-rotation: gather context

```bash
# Confirm which credentials are currently in Keychain
security find-generic-password -s claude-helpscout-app-id -w
# (only the App ID prints; secret stays in Keychain)
```

Note the App ID. You'll cross-reference it when revoking.

## Step 1 — Create the replacement app first (no downtime)

1. Sign into Help Scout admin: https://secure.helpscout.net/
2. Avatar (top right) → **Your Profile** → **My Apps** → **Create App**
3. App Name: `Claude Revenue Analysis YYYY-MM-DD` (date-stamp so you can audit later)
4. Redirection URL: `https://example.com` (unused by client-credentials flow but required field)
5. Copy the new **App ID** and **App Secret** — the secret displays once.

> If the existing app has any specific scopes set (verify in the app's detail page), match them on the replacement.

## Step 2 — Update Keychain with new credentials

```bash
NEW_APP_ID='paste_here'
NEW_APP_SECRET='paste_here'

security add-generic-password -s claude-helpscout-app-id -a hello@jeangalea.com -w "$NEW_APP_ID" -U
security add-generic-password -s claude-helpscout-app-secret -a hello@jeangalea.com -w "$NEW_APP_SECRET" -U
```

The `-U` flag updates the existing entry instead of adding a duplicate.

## Step 3 — Verify the new credentials work

```bash
APP_ID=$(security find-generic-password -s claude-helpscout-app-id -w)
APP_SECRET=$(security find-generic-password -s claude-helpscout-app-secret -w)

curl -sS -X POST https://api.helpscout.net/v2/oauth2/token \
  -d "grant_type=client_credentials&client_id=${APP_ID}&client_secret=${APP_SECRET}" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print("✓ token issued, expires_in=" + str(d.get("expires_in"))) if "access_token" in d else print("✗", d)'
```

Expected: `✓ token issued, expires_in=172800`. If you see `invalid_client`, double-check you copied the secret correctly (it has confusable chars: `1lI0O`).

## Step 4 — Restart the MCP host

The MCP holds the bearer token in memory and will keep using the old one until the process restarts.

- **Claude Desktop:** Quit completely (Cmd+Q), reopen.
- **Claude Code session:** end the session, start a new one.
- **Other MCP host:** restart however you launch it.

## Step 5 — Revoke the old app

1. Help Scout → My Apps → click the OLD app (the one you replaced).
2. Click the trash/delete icon.
3. Confirm.

This is permanent — anyone using the old credentials gets `invalid_client` immediately.

## Step 6 — Audit Help Scout activity

If rotation was triggered by a leak, check who touched the API during the exposure window.

1. Help Scout → Manage → **Activity Log** (or Audit Log, name varies by plan tier)
2. Filter for events from the OAuth client (the API will show as `Help Scout API` with the App ID)
3. Look for unexpected geographies, off-hours access, or burst patterns
4. If you find anomalies, file a GDPR breach notification within 72 hours per Article 33

## Step 7 — Clean local working trees

If the leaked secret was in a git repo:

```bash
# Verify nothing in current working tree
grep -rE 'qCJgfjX8a34wTWgn7yWYHUBP6TGHcGFa|<old_app_id>' . --exclude-dir=node_modules --exclude-dir=.git

# If found in any file, delete and re-commit
# If found in git history, run filter-repo:
git filter-repo --replace-text <(echo '<old_app_id>==>REVOKED_APP_ID')
git push --force --tags origin main
```

The replacement-text approach is non-destructive (commits keep their structure, just the credential strings get redacted with `REVOKED_APP_ID`). Safer than `--invert-paths` if the file containing the secret had other useful changes.

## Step 8 — Record the rotation

Update Obsidian:

```
Vault/RebelCode/security/credential-rotation-log.md
- 2026-04-25 — Rotated Help Scout creds from leak (Zack/GravityKit's repo). Old App ID kE8DQ... revoked. New App ID stored in Keychain.
```

## Common gotchas

- **Keychain shows old secret in `security` command output** — Keychain caches per-process. Restart the shell (or use `security delete-generic-password -s claude-helpscout-app-secret` then re-add).
- **`invalid_client` on the new creds** — most likely a paste error on the secret. The 32-char string contains `1lI0O` which is easy to mistype. Use `security find-generic-password -s claude-helpscout-app-secret -w | wc -c` (should be 33: 32 chars + newline).
- **MCP keeps using old token** — the in-memory token cache survives credential rotation. Restart the process. The new code (post-Audit) zeroes tokens on `closePool()` but cold-restart is more reliable.
- **Browser still has old session in admin.google.com / Help Scout admin** — orthogonal; doesn't affect the OAuth2 client. But sign out of Help Scout admin if you suspect that session is also burned.

## Don't do these

- **Don't reuse the old App ID with a new secret.** Help Scout sometimes lets you regenerate the secret on an existing app, but if the old App ID was leaked, the App ID itself signals which tenant to attack. Replace the whole app.
- **Don't email the new secret to yourself.** Email is logged. Use Keychain.
- **Don't commit a `.env` file as part of "fixing this once and for all."** That's how the original leak happened. Keychain only.
- **Don't skip the audit log review.** Even when the rotation feels routine, looking at the log takes 5 minutes and occasionally surfaces real attacks.
