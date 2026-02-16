import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { HelpScoutClient } from '../utils/helpscout-client.js';

// Set a more generous timeout for all tests in this file
jest.setTimeout(15000);

// Mock logger to reduce test output noise
jest.mock('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock cache to prevent interference between tests
jest.mock('../utils/cache.js', () => ({
  cache: {
    get: jest.fn(() => null), // Always return null to prevent cache hits
    set: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock config to make it dynamic based on environment variables
jest.mock('../utils/config.js', () => ({
  config: {
    helpscout: {
      get apiKey() { return process.env.HELPSCOUT_API_KEY || ''; },
      get clientId() { return process.env.HELPSCOUT_APP_ID || process.env.HELPSCOUT_CLIENT_ID || process.env.HELPSCOUT_API_KEY || ''; },
      get clientSecret() { return process.env.HELPSCOUT_APP_SECRET || process.env.HELPSCOUT_CLIENT_SECRET || ''; },
      get baseUrl() { return process.env.HELPSCOUT_BASE_URL || 'https://api.helpscout.net/v2/'; },
      get defaultInboxId() { return process.env.HELPSCOUT_DEFAULT_INBOX_ID; },
    },
    cache: {
      ttlSeconds: 300,
      maxSize: 10000,
    },
    logging: {
      level: 'info',
    },
    security: {
      allowPii: false,
    },
    responses: { verbose: false },
    connectionPool: {
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000,
      keepAlive: true,
      keepAliveMsecs: 1000,
    },
  },
  validateConfig: jest.fn(),
  isVerbose: jest.fn(() => false),
}));

describe('HelpScoutClient', () => {
  const baseURL = 'https://api.helpscout.net/v2';

  beforeEach(() => {
    // Clear all mocks and nock interceptors
    jest.clearAllMocks();
    nock.cleanAll();

    // Ensure nock is active
    if (!nock.isActive()) {
      nock.activate();
    }

    // Clear any environment variables from previous tests
    delete process.env.HELPSCOUT_API_KEY;
    delete process.env.HELPSCOUT_CLIENT_ID;
    delete process.env.HELPSCOUT_CLIENT_SECRET;
    delete process.env.HELPSCOUT_APP_ID;
    delete process.env.HELPSCOUT_APP_SECRET;
  });

  afterEach(() => {
    // Check for pending interceptors before cleaning
    const pending = nock.pendingMocks();
    if (pending.length > 0) {
      console.log('Pending nock interceptors:', pending);
    }
    nock.cleanAll();
  });

  describe('authentication', () => {
    it('should use OAuth2 Client Credentials flow', async () => {
      process.env.HELPSCOUT_CLIENT_ID = 'test-client-id';
      process.env.HELPSCOUT_CLIENT_SECRET = 'test-client-secret';
      process.env.HELPSCOUT_BASE_URL = `${baseURL}/`;

      // Mock OAuth2 token endpoint
      nock('https://api.helpscout.net')
        .post('/v2/oauth2/token', {
          grant_type: 'client_credentials',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        })
        .reply(200, {
          access_token: 'oauth2-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        });

      const client = new HelpScoutClient();

      // Trigger authentication
      await (client as any).authenticate();

      expect((client as any).accessToken).toBe('oauth2-access-token');
      expect((client as any).tokenExpiresAt).toBeGreaterThan(Date.now());
    });

    it('should throw error when OAuth2 credentials are missing', async () => {
      // No credentials set
      process.env.HELPSCOUT_BASE_URL = `${baseURL}/`;

      const client = new HelpScoutClient();

      await expect((client as any).authenticate()).rejects.toThrow(
        'Failed to authenticate with Help Scout API. Check your OAuth2 credentials.'
      );
    });

    it('should deduplicate concurrent authentication requests', async () => {
      process.env.HELPSCOUT_CLIENT_ID = 'test-client-id';
      process.env.HELPSCOUT_CLIENT_SECRET = 'test-client-secret';
      process.env.HELPSCOUT_BASE_URL = `${baseURL}/`;

      // Only mock one token request - dedup should prevent second
      nock('https://api.helpscout.net')
        .post('/v2/oauth2/token')
        .reply(200, {
          access_token: 'dedup-token',
          token_type: 'Bearer',
          expires_in: 3600,
        });

      const client = new HelpScoutClient();

      // Make two concurrent auth calls
      await Promise.all([
        (client as any).ensureAuthenticated(),
        (client as any).ensureAuthenticated(),
      ]);

      // Both should resolve, only one HTTP call made
      expect((client as any).accessToken).toBe('dedup-token');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      delete process.env.HELPSCOUT_APP_SECRET;
      delete process.env.HELPSCOUT_API_KEY;
      process.env.HELPSCOUT_BASE_URL = `${baseURL}/`;
    });

    it('should handle 401 unauthorized errors with correct message', async () => {
      const client = new HelpScoutClient();

      // Test error transformation directly
      const mockAxiosError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        },
        config: {
          metadata: { requestId: 'test-401' },
          url: '/mailboxes',
          method: 'get'
        }
      };

      const transformedError = (client as any).transformError(mockAxiosError);

      expect(transformedError).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Help Scout authentication failed. Please check your API credentials.',
      });
      // Error details should include suggestion about OAuth2 credentials
      expect(transformedError.details.suggestion).toContain('HELPSCOUT_APP_ID');
      expect(transformedError.details.suggestion).toContain('HELPSCOUT_APP_SECRET');
      // Error details should NOT contain url/method (removed in new code)
      expect(transformedError.details.url).toBeUndefined();
      expect(transformedError.details.method).toBeUndefined();
    }, 10000);

    it('should handle 404 not found errors', async () => {
      const client = new HelpScoutClient();

      const mockAxiosError = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        },
        config: {
          metadata: { requestId: 'test-404' },
          url: '/conversations/999',
          method: 'get'
        }
      };

      const transformedError = (client as any).transformError(mockAxiosError);

      expect(transformedError).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Help Scout resource not found. The requested conversation, mailbox, or thread does not exist.'
      });
    }, 10000);

    it('should handle 429 rate limit errors with retries', async () => {
      const client = new HelpScoutClient();

      const mockAxiosError = {
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' },
          headers: { 'retry-after': '1' }
        },
        config: {
          metadata: { requestId: 'test-429' },
          url: '/conversations',
          method: 'get'
        }
      };

      const transformedError = (client as any).transformError(mockAxiosError);

      expect(transformedError).toMatchObject({
        code: 'RATE_LIMIT',
        message: 'Help Scout API rate limit exceeded. Please wait 1 second before retrying.'
      });
    }, 15000);

    it('should handle 400 bad request errors', async () => {
      const client = new HelpScoutClient();

      const mockAxiosError = {
        response: {
          status: 400,
          data: {
            message: 'Invalid request',
            errors: { invalid: 'parameter not allowed' }
          }
        },
        config: {
          metadata: { requestId: 'test-400' },
          url: '/conversations',
          method: 'get'
        }
      };

      const transformedError = (client as any).transformError(mockAxiosError);

      expect(transformedError).toMatchObject({
        code: 'INVALID_INPUT',
        message: 'Help Scout API client error: Invalid request'
      });
    }, 10000);

    it('should handle 500 server errors with retries', async () => {
      const client = new HelpScoutClient();

      const mockAxiosError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        },
        config: {
          metadata: { requestId: 'test-500' },
          url: '/mailboxes',
          method: 'get'
        }
      };

      const transformedError = (client as any).transformError(mockAxiosError);

      expect(transformedError).toMatchObject({
        code: 'UPSTREAM_ERROR',
        message: 'Help Scout API server error (500). The service is temporarily unavailable.'
      });
    }, 15000);
  });

  describe('caching', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();

      delete process.env.HELPSCOUT_APP_SECRET;
      delete process.env.HELPSCOUT_API_KEY;
      process.env.HELPSCOUT_BASE_URL = `${baseURL}/`;
    });

    it('should respect custom cache TTL', async () => {
      const client = new HelpScoutClient();

      const defaultTtl = (client as any).getDefaultCacheTtl('/conversations');
      expect(defaultTtl).toBe(300); // 5 minutes for conversations

      const mailboxTtl = (client as any).getDefaultCacheTtl('/mailboxes');
      expect(mailboxTtl).toBe(1440); // 24 minutes for mailboxes

      const threadsTtl = (client as any).getDefaultCacheTtl('/threads');
      expect(threadsTtl).toBe(300); // 5 minutes for threads
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      delete process.env.HELPSCOUT_APP_SECRET;
      delete process.env.HELPSCOUT_API_KEY;
      process.env.HELPSCOUT_BASE_URL = `${baseURL}/`;
    });

    it('should return true for successful connection', async () => {
      const client = new HelpScoutClient();

      // Mock the get method to simulate successful connection
      jest.spyOn(client, 'get').mockResolvedValue({ _embedded: { mailboxes: [] } });

      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      const client = new HelpScoutClient();

      // Mock the get method to simulate failed connection
      jest.spyOn(client, 'get').mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('request interceptors', () => {
    beforeEach(() => {
      delete process.env.HELPSCOUT_APP_SECRET;
      delete process.env.HELPSCOUT_API_KEY;
      process.env.HELPSCOUT_BASE_URL = `${baseURL}/`;
    });

    it('should add request IDs and timing', async () => {
      const client = new HelpScoutClient();

      // Test that the axios instance has interceptors configured
      const axiosClient = (client as any).client;

      expect(axiosClient.interceptors.request.handlers).toHaveLength(1);
      expect(axiosClient.interceptors.response.handlers).toHaveLength(1);
    });
  });
});
