import dotenv from 'dotenv';
import { execFileSync } from 'node:child_process';

// Only load .env in non-test environments
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

/**
 * Read a secret from the macOS Keychain using the `security` CLI.
 * Returns the trimmed value, or null if the lookup fails (item missing,
 * `security` not available, etc.). Never throws.
 *
 * The Keychain path is preferred over env vars when both are present:
 * env vars leak via `ps`, `/proc`, and Docker / launchd inspection;
 * Keychain values stay local to the user session.
 */
function readKeychainSecret(service: string): string | null {
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

/**
 * Resolve OAuth2 credentials from the macOS Keychain when
 * HELPSCOUT_USE_KEYCHAIN=true. Mutates `config.helpscout` in place.
 *
 * Service names default to claude-helpscout-app-id and
 * claude-helpscout-app-secret; override with
 * HELPSCOUT_KEYCHAIN_ID_SERVICE / HELPSCOUT_KEYCHAIN_SECRET_SERVICE.
 *
 * Throws when:
 * - the platform is not darwin (Keychain is macOS-only),
 * - either secret is missing from the Keychain,
 * - the `security` CLI fails for any other reason.
 *
 * Keychain values always win over env vars when this resolver is engaged,
 * so a leaking env doesn't override the secure path.
 */
function loadCredentialsFromKeychain(): void {
  if (process.env.HELPSCOUT_USE_KEYCHAIN !== 'true') return;

  if (process.platform !== 'darwin') {
    throw new Error(
      'HELPSCOUT_USE_KEYCHAIN=true is only supported on macOS. ' +
      `Current platform: ${process.platform}. ` +
      'Use a launcher script or secret manager on other platforms.'
    );
  }

  const idService = process.env.HELPSCOUT_KEYCHAIN_ID_SERVICE || 'claude-helpscout-app-id';
  const secretService = process.env.HELPSCOUT_KEYCHAIN_SECRET_SERVICE || 'claude-helpscout-app-secret';

  const id = readKeychainSecret(idService);
  const secret = readKeychainSecret(secretService);

  if (!id || !secret) {
    const missing: string[] = [];
    if (!id) missing.push(idService);
    if (!secret) missing.push(secretService);
    throw new Error(
      `HELPSCOUT_USE_KEYCHAIN=true but Keychain is missing: ${missing.join(', ')}.\n\n` +
      'Store credentials with:\n' +
      `  security add-generic-password -s ${idService} -w 'YOUR_APP_ID' -U\n` +
      `  security add-generic-password -s ${secretService} -w 'YOUR_APP_SECRET' -U`
    );
  }

  config.helpscout.clientId = id;
  config.helpscout.clientSecret = secret;
}

export interface Config {
  helpscout: {
    apiKey: string;         // Deprecated: kept for backwards compatibility only
    clientId?: string;      // OAuth2 client ID (required)
    clientSecret?: string;  // OAuth2 client secret (required)
    baseUrl: string;
    defaultInboxId?: string; // Optional: default inbox for scoped searches
    docsApiKey?: string;    // Help Scout Docs API key
    docsBaseUrl?: string;   // Help Scout Docs API base URL
    allowDocsDelete?: boolean;  // Allow deletion operations in Docs API
    defaultDocsCollectionId?: string;  // Default Docs collection ID for queries
    defaultDocsSiteId?: string;  // Default Docs site ID for queries
    disableDocs?: boolean;  // Set HELPSCOUT_DISABLE_DOCS=true to hide all Docs tools/resources
    replySpacing?: 'compact' | 'relaxed';  // Paragraph spacing style for replies
    allowSendReply?: boolean;  // Allow sending published (non-draft) replies
  };
  cache: {
    ttlSeconds: number;
    maxSize: number;
  };
  logging: {
    level: string;
  };
  security: {
    allowPii: boolean;
  };
  responses: {
    verbose: boolean;  // Default verbosity for tool responses (HELPSCOUT_VERBOSE_RESPONSES)
  };
  connectionPool: {
    maxSockets: number;
    maxFreeSockets: number;
    timeout: number;
    keepAlive: boolean;
    keepAliveMsecs: number;
  };
}

export const config: Config = {
  helpscout: {
    // OAuth2 authentication (Client Credentials flow)
    apiKey: process.env.HELPSCOUT_API_KEY || '', // Deprecated, kept for backwards compatibility
    clientId: process.env.HELPSCOUT_APP_ID || process.env.HELPSCOUT_CLIENT_ID || '',
    clientSecret: process.env.HELPSCOUT_APP_SECRET || process.env.HELPSCOUT_CLIENT_SECRET || '',
    baseUrl: process.env.HELPSCOUT_BASE_URL || 'https://api.helpscout.net/v2/',
    defaultInboxId: process.env.HELPSCOUT_DEFAULT_INBOX_ID,
    docsApiKey: process.env.HELPSCOUT_DOCS_API_KEY || '',
    docsBaseUrl: process.env.HELPSCOUT_DOCS_BASE_URL || 'https://docsapi.helpscout.net/v1/',
    allowDocsDelete: process.env.HELPSCOUT_ALLOW_DOCS_DELETE === 'true',
    defaultDocsCollectionId: process.env.HELPSCOUT_DEFAULT_DOCS_COLLECTION_ID || '',
    defaultDocsSiteId: process.env.HELPSCOUT_DEFAULT_DOCS_SITE_ID || '',
    disableDocs: process.env.HELPSCOUT_DISABLE_DOCS === 'true',
    replySpacing: (process.env.HELPSCOUT_REPLY_SPACING === 'compact' ? 'compact' : 'relaxed') as 'compact' | 'relaxed',
    allowSendReply: process.env.HELPSCOUT_ALLOW_SEND_REPLY === 'true',
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
    maxSize: parseInt(process.env.MAX_CACHE_SIZE || '10000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  security: {
    // Default: show content. Set REDACT_MESSAGE_CONTENT=true to hide message bodies.
    allowPii: process.env.REDACT_MESSAGE_CONTENT !== 'true',
  },
  responses: {
    verbose: process.env.HELPSCOUT_VERBOSE_RESPONSES === 'true',
  },
  connectionPool: {
    maxSockets: parseInt(process.env.HTTP_MAX_SOCKETS || '50', 10),
    maxFreeSockets: parseInt(process.env.HTTP_MAX_FREE_SOCKETS || '10', 10),
    timeout: parseInt(process.env.HTTP_SOCKET_TIMEOUT || '30000', 10),
    keepAlive: process.env.HTTP_KEEP_ALIVE !== 'false', // Default to true
    keepAliveMsecs: parseInt(process.env.HTTP_KEEP_ALIVE_MSECS || '1000', 10),
  },
};

/**
 * Resolve whether a tool call should return verbose (full API) responses.
 * Per-tool `verbose` param overrides the global HELPSCOUT_VERBOSE_RESPONSES env var.
 */
export function isVerbose(args: unknown): boolean {
  if (args && typeof args === 'object' && 'verbose' in args && typeof (args as any).verbose === 'boolean') {
    return (args as any).verbose;
  }
  return config.responses.verbose;
}

/**
 * Parse a comma-separated env var into a Set of trimmed non-empty
 * strings. Returns null when the env var is unset or empty — callers
 * use null to mean "no allowlist enforced".
 */
function parseAllowlist(envVar: string | undefined): Set<string> | null {
  if (!envVar) return null;
  const trimmed = envVar.trim();
  if (!trimmed) return null;
  const ids = trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
  return ids.length > 0 ? new Set(ids) : null;
}

const writeInboxAllowlist = parseAllowlist(process.env.HELPSCOUT_WRITE_INBOX_ALLOWLIST);
const writeDocsSiteAllowlist = parseAllowlist(process.env.HELPSCOUT_WRITE_DOCS_SITE_ALLOWLIST);

/**
 * Check whether a mailbox ID is allowed for write operations.
 *
 * Default-deny: when HELPSCOUT_WRITE_INBOX_ALLOWLIST is unset, every
 * write is rejected. Operators must explicitly enumerate mailbox IDs
 * to enable writes. This forces explicit configuration of the blast
 * radius for an LLM-driven session.
 *
 * Comparison is string-based so callers can pass numbers or strings;
 * the env var is parsed as a string set.
 */
export function isWriteInboxAllowed(mailboxId: string | number | undefined | null): boolean {
  if (writeInboxAllowlist === null) return false;
  if (mailboxId === undefined || mailboxId === null) return false;
  return writeInboxAllowlist.has(String(mailboxId));
}

/**
 * The configured write inbox allowlist as a sorted array, or null if
 * unset. Surface for error messages so the LLM knows which IDs are OK.
 */
export function getWriteInboxAllowlist(): string[] | null {
  return writeInboxAllowlist ? [...writeInboxAllowlist].sort() : null;
}

/**
 * Same shape as isWriteInboxAllowed, but for Help Scout Docs site IDs.
 * Default-deny: unset env var means no Docs writes permitted.
 */
export function isWriteDocsSiteAllowed(siteId: string | number | undefined | null): boolean {
  if (writeDocsSiteAllowlist === null) return false;
  if (siteId === undefined || siteId === null) return false;
  return writeDocsSiteAllowlist.has(String(siteId));
}

export function getWriteDocsSiteAllowlist(): string[] | null {
  return writeDocsSiteAllowlist ? [...writeDocsSiteAllowlist].sort() : null;
}

export function validateConfig(): void {
  // If the operator opted into the Keychain path, resolve credentials
  // before any other check — this lets validation enforce APP_ID/SECRET
  // presence regardless of env-var state.
  loadCredentialsFromKeychain();

  // Check if user is trying to use deprecated Personal Access Token
  if (process.env.HELPSCOUT_API_KEY?.startsWith('Bearer ')) {
    throw new Error(
      'Personal Access Tokens are no longer supported.\n\n' +
      'Help Scout API now requires OAuth2 Client Credentials.\n' +
      'Please migrate your configuration:\n\n' +
      '  OLD (deprecated):\n' +
      '    HELPSCOUT_API_KEY=Bearer your-token\n\n' +
      '  NEW (required):\n' +
      '    HELPSCOUT_APP_ID=your-app-id\n' +
      '    HELPSCOUT_APP_SECRET=your-app-secret\n\n' +
      'Get OAuth2 credentials: Help Scout → My Apps → Create Private App'
    );
  }

  const hasOAuth2 = (config.helpscout.clientId && config.helpscout.clientSecret);

  if (!hasOAuth2) {
    throw new Error(
      'OAuth2 authentication required. Help Scout API only supports OAuth2 Client Credentials flow.\n' +
      'Please provide:\n' +
      '  - HELPSCOUT_APP_ID: Your App ID from Help Scout\n' +
      '  - HELPSCOUT_APP_SECRET: Your App Secret from Help Scout\n\n' +
      'Get these from: Help Scout → My Apps → Create Private App\n\n' +
      'Optional configuration:\n' +
      '  - HELPSCOUT_DEFAULT_INBOX_ID: Default inbox for scoped searches (improves LLM context)'
    );
  }

  // Enforce HTTPS for API base URL to prevent credential exposure
  if (config.helpscout.baseUrl && !config.helpscout.baseUrl.startsWith('https://')) {
    throw new Error(
      'Security Error: HELPSCOUT_BASE_URL must use HTTPS to protect credentials in transit.\n' +
      `Current value: ${config.helpscout.baseUrl}\n` +
      'Please use: https://api.helpscout.net/v2/'
    );
  }

  // Constrain HELPSCOUT_BASE_URL to known Help Scout hosts. The OAuth2
  // bearer token is sent on every authenticated request, so a misconfigured
  // (or attacker-controlled) base URL would exfiltrate it.
  const ALLOWED_HOSTS = new Set([
    'api.helpscout.net',
    'api.helpscout.com',
  ]);
  if (config.helpscout.baseUrl) {
    let parsed: URL;
    try {
      parsed = new URL(config.helpscout.baseUrl);
    } catch {
      throw new Error(
        `Security Error: HELPSCOUT_BASE_URL is not a valid URL.\n` +
        `Current value: ${config.helpscout.baseUrl}`
      );
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      throw new Error(
        `Security Error: HELPSCOUT_BASE_URL host "${parsed.hostname}" is not in the allowlist. ` +
        `Allowed hosts: ${[...ALLOWED_HOSTS].join(', ')}.`
      );
    }
  }

  // Same treatment for the Docs API host. The Docs API key travels via
  // HTTP basic auth, which is just as sensitive.
  const ALLOWED_DOCS_HOSTS = new Set([
    'docsapi.helpscout.net',
  ]);
  if (config.helpscout.docsBaseUrl) {
    if (!config.helpscout.docsBaseUrl.startsWith('https://')) {
      throw new Error(
        'Security Error: HELPSCOUT_DOCS_BASE_URL must use HTTPS to protect credentials in transit.\n' +
        `Current value: ${config.helpscout.docsBaseUrl}\n` +
        'Please use: https://docsapi.helpscout.net/v1/'
      );
    }
    let parsedDocs: URL;
    try {
      parsedDocs = new URL(config.helpscout.docsBaseUrl);
    } catch {
      throw new Error(
        `Security Error: HELPSCOUT_DOCS_BASE_URL is not a valid URL.\n` +
        `Current value: ${config.helpscout.docsBaseUrl}`
      );
    }
    if (!ALLOWED_DOCS_HOSTS.has(parsedDocs.hostname)) {
      throw new Error(
        `Security Error: HELPSCOUT_DOCS_BASE_URL host "${parsedDocs.hostname}" is not in the allowlist. ` +
        `Allowed hosts: ${[...ALLOWED_DOCS_HOSTS].join(', ')}.`
      );
    }
  }

  // Reject obviously-too-short app secrets. Real Help Scout secrets are
  // 32 chars alphanumeric; anything <24 chars is almost certainly a
  // dummy/test value.
  if (config.helpscout.clientSecret && config.helpscout.clientSecret.length < 24) {
    throw new Error(
      'Security Error: HELPSCOUT_APP_SECRET appears too short to be a real Help Scout secret. ' +
      'Expected at least 24 characters.'
    );
  }
}