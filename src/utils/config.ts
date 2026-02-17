import dotenv from 'dotenv';

// Only load .env in non-test environments
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
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

export function validateConfig(): void {
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
}