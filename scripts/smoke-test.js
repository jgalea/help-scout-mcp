#!/usr/bin/env node
/**
 * Smoke test against a real Help Scout tenant.
 *
 * Read-only proof of life: acquires an OAuth2 bearer token, then exercises
 * three GET endpoints (mailboxes, conversations, reports). Never calls a
 * write endpoint, never logs secrets, never writes to disk.
 *
 * Credentials are read from the macOS Keychain by default
 * (services: claude-helpscout-app-id, claude-helpscout-app-secret); falls
 * back to env vars HELPSCOUT_APP_ID / HELPSCOUT_APP_SECRET if Keychain
 * lookups fail (non-macOS, missing items, or unsupported `security` cmd).
 *
 * Exit 0 on success, 1 on any failure, with the specific error printed.
 *
 * Run with: npm run smoke
 */

import { execFileSync } from 'node:child_process';

const KEYCHAIN_ID_SERVICE = 'claude-helpscout-app-id';
const KEYCHAIN_SECRET_SERVICE = 'claude-helpscout-app-secret';
const TOKEN_URL = 'https://api.helpscout.net/v2/oauth2/token';
const API_BASE = 'https://api.helpscout.net/v2';

function readKeychain(service) {
  if (process.platform !== 'darwin') return null;
  try {
    const value = execFileSync('security', ['find-generic-password', '-s', service, '-w'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
    return value || null;
  } catch {
    return null;
  }
}

function loadCredentials() {
  const idFromKeychain = readKeychain(KEYCHAIN_ID_SERVICE);
  const secretFromKeychain = readKeychain(KEYCHAIN_SECRET_SERVICE);
  const appId = idFromKeychain || process.env.HELPSCOUT_APP_ID || '';
  const appSecret = secretFromKeychain || process.env.HELPSCOUT_APP_SECRET || '';

  if (!appId || !appSecret) {
    throw new Error(
      'Missing Help Scout credentials. Provide them via Keychain ' +
      `(services "${KEYCHAIN_ID_SERVICE}" / "${KEYCHAIN_SECRET_SERVICE}") ` +
      'or env vars HELPSCOUT_APP_ID / HELPSCOUT_APP_SECRET.'
    );
  }
  return { appId, appSecret, source: idFromKeychain ? 'keychain' : 'env' };
}

async function getAccessToken(appId, appSecret) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: appId,
    client_secret: appSecret,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OAuth2 token request failed: ${res.status} ${res.statusText}${detail ? ` — ${detail.slice(0, 200)}` : ''}`);
  }
  const json = await res.json();
  if (!json.access_token) {
    throw new Error('OAuth2 response missing access_token');
  }
  return json.access_token;
}

async function apiGet(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}${detail ? ` — ${detail.slice(0, 200)}` : ''}`);
  }
  return res.json();
}

function isoDaysAgo(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

async function main() {
  const { appId, appSecret, source } = loadCredentials();
  const appIdHint = `${appId.slice(0, 4)}…${appId.slice(-2)}`;
  console.log(`Loaded credentials from ${source} (app id ${appIdHint})`);

  const token = await getAccessToken(appId, appSecret);
  console.log('Acquired OAuth2 bearer token');

  const mailboxes = await apiGet('/mailboxes', token);
  const inboxes = mailboxes._embedded?.mailboxes || [];
  const names = inboxes.map((m) => m.name).filter(Boolean);
  console.log(`Mailboxes: ${inboxes.length} — ${names.join(', ') || '(none)'}`);
  if (inboxes.length === 0) {
    throw new Error('No mailboxes returned — check OAuth2 app scopes (Mailbox: Read).');
  }

  const convos = await apiGet('/conversations?status=active&size=1', token);
  const firstConv = convos._embedded?.conversations?.[0];
  if (firstConv) {
    console.log(`First active conversation: id=${firstConv.id} subject=${JSON.stringify(firstConv.subject || '')}`);
  } else {
    console.log('No active conversations (status=active returned empty — not a failure).');
  }

  const firstMailboxId = inboxes[0].id;
  const start = encodeURIComponent(isoDaysAgo(7));
  const end = encodeURIComponent(new Date().toISOString());
  const reportPath = `/reports/conversations?start=${start}&end=${end}&mailboxes=${firstMailboxId}`;
  const report = await apiGet(reportPath, token);
  const totalCount = report?.companyConversations?.totalCount ?? report?.totalCount ?? '(unknown shape)';
  console.log(`Conversations report (last 7d, mailbox ${firstMailboxId}): totalCount=${totalCount}`);

  console.log('✓ Smoke test passed');
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Smoke test FAILED: ${msg}`);
  process.exit(1);
});
