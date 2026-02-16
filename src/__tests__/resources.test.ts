import nock from 'nock';

// Mock config with dynamic getters so env vars set in beforeEach take effect
jest.mock('../utils/config.js', () => ({
  config: {
    helpscout: {
      get apiKey() { return process.env.HELPSCOUT_API_KEY || ''; },
      get clientId() { return process.env.HELPSCOUT_APP_ID || process.env.HELPSCOUT_CLIENT_ID || process.env.HELPSCOUT_API_KEY || ''; },
      get clientSecret() { return process.env.HELPSCOUT_APP_SECRET || process.env.HELPSCOUT_CLIENT_SECRET || ''; },
      get baseUrl() { return process.env.HELPSCOUT_BASE_URL || 'https://api.helpscout.net/v2/'; },
      get defaultInboxId() { return process.env.HELPSCOUT_DEFAULT_INBOX_ID; },
      get docsApiKey() { return process.env.HELPSCOUT_DOCS_API_KEY || ''; },
      get docsBaseUrl() { return process.env.HELPSCOUT_DOCS_BASE_URL || 'https://docsapi.helpscout.net/v1/'; },
      get allowDocsDelete() { return process.env.HELPSCOUT_ALLOW_DOCS_DELETE === 'true'; },
      get defaultDocsCollectionId() { return process.env.HELPSCOUT_DEFAULT_DOCS_COLLECTION_ID || ''; },
      get defaultDocsSiteId() { return process.env.HELPSCOUT_DEFAULT_DOCS_SITE_ID || ''; },
      get disableDocs() { return process.env.HELPSCOUT_DISABLE_DOCS === 'true'; },
    },
    cache: { ttlSeconds: 300, maxSize: 10000 },
    logging: { level: 'info' },
    security: { allowPii: false },
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

// Mock logger to reduce test output noise
jest.mock('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock cache
jest.mock('../utils/cache.js', () => ({
  cache: {
    get: jest.fn(() => null),
    set: jest.fn(),
    clear: jest.fn(),
  },
}));

import { ResourceHandler } from '../resources/index.js';

describe('ResourceHandler', () => {
  let resourceHandler: ResourceHandler;
  const baseURL = 'https://api.helpscout.net/v2';

  beforeEach(() => {
    // Set environment for tests
    process.env.HELPSCOUT_CLIENT_ID = 'test-client-id';
    process.env.HELPSCOUT_CLIENT_SECRET = 'test-client-secret';
    process.env.HELPSCOUT_BASE_URL = `${baseURL}/`;

    nock.cleanAll();

    // Mock OAuth2 authentication endpoint
    nock('https://api.helpscout.net')
      .persist()
      .post('/v2/oauth2/token')
      .reply(200, {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });

    resourceHandler = new ResourceHandler();
  });

  afterEach(async () => {
    nock.cleanAll();
    // Clean up any pending promises or timers
    await new Promise(resolve => setImmediate(resolve));
  });

  describe('listResources', () => {
    it('should return available resources with at least core resources', async () => {
      const resources = await resourceHandler.listResources();

      // Core resources should always be present
      const coreUris = resources.map(r => r.uri).filter(uri => uri.startsWith('helpscout://'));
      expect(coreUris).toContain('helpscout://inboxes');
      expect(coreUris).toContain('helpscout://conversations');
      expect(coreUris).toContain('helpscout://threads');
      expect(coreUris).toContain('helpscout://clock');
    });

    it('should have proper resource metadata on listResources', async () => {
      const resources = await resourceHandler.listResources();

      // listResources returns Resource[] which includes name/description
      const coreResources = resources.filter(r => r.uri.startsWith('helpscout://'));
      coreResources.forEach(resource => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType', 'application/json');
      });
    });
  });

  describe('handleResource', () => {
    describe('helpscout://inboxes', () => {
      it('should fetch inboxes resource as TextResourceContents', async () => {
        const mockResponse = {
          _embedded: {
            mailboxes: [
              { id: 1, name: 'Support', email: 'support@example.com' }
            ]
          },
          page: { size: 50, totalElements: 1 },
          _links: { next: null }
        };

        nock(baseURL)
          .get('/mailboxes')
          .query({ page: 1, size: 50 })
          .reply(200, mockResponse);

        const resource = await resourceHandler.handleResource('helpscout://inboxes');

        // TextResourceContents has uri, mimeType, text - no name/description
        expect(resource.uri).toBe('helpscout://inboxes');
        expect(resource.mimeType).toBe('application/json');
        expect(resource).not.toHaveProperty('name');
        expect(resource).not.toHaveProperty('description');

        const data = JSON.parse(resource.text as string);
        expect(data.inboxes).toHaveLength(1);
        expect(data.inboxes[0].name).toBe('Support');
      });

      it('should handle pagination parameters', async () => {
        const mockResponse = {
          _embedded: { mailboxes: [] },
          page: { size: 10, totalElements: 0 }
        };

        nock(baseURL)
          .get('/mailboxes')
          .query({ page: 2, size: 10 })
          .reply(200, mockResponse);

        const resource = await resourceHandler.handleResource('helpscout://inboxes?page=2&size=10');
        expect(resource).toBeDefined();
      });
    });

    describe('helpscout://conversations', () => {
      it('should fetch conversations resource as TextResourceContents', async () => {
        const mockResponse = {
          _embedded: {
            conversations: [
              {
                id: 1,
                subject: 'Test Conversation',
                status: 'active',
                customer: { id: 1, firstName: 'John', lastName: 'Doe' }
              }
            ]
          },
          page: { size: 50, totalElements: 1 },
          _links: { next: null }
        };

        nock(baseURL)
          .get('/conversations')
          .query({ page: 1, size: 50 })
          .reply(200, mockResponse);

        const resource = await resourceHandler.handleResource('helpscout://conversations');

        // TextResourceContents - no name/description
        expect(resource.uri).toBe('helpscout://conversations');
        expect(resource.mimeType).toBe('application/json');
        expect(resource).not.toHaveProperty('name');
        expect(resource).not.toHaveProperty('description');

        const data = JSON.parse(resource.text as string);
        expect(data.conversations).toHaveLength(1);
        expect(data.conversations[0].subject).toBe('Test Conversation');
        expect(data.pagination).toBeDefined();
        expect(data.links).toBeDefined();
      });

      it('should handle filter parameters', async () => {
        const mockResponse = {
          _embedded: { conversations: [] },
          page: { size: 50, totalElements: 0 },
          _links: { next: null }
        };

        nock(baseURL)
          .get('/conversations')
          .query({ page: 1, size: 50, status: 'active', mailbox: '123' })
          .reply(200, mockResponse);

        const resource = await resourceHandler.handleResource(
          'helpscout://conversations?status=active&mailbox=123'
        );
        expect(resource).toBeDefined();
      });

      it('should handle pagination parameters', async () => {
        const mockResponse = {
          _embedded: { conversations: [] },
          page: { size: 25, totalElements: 0, number: 2 },
          _links: { prev: { href: '/conversations?page=1' } }
        };

        nock(baseURL)
          .get('/conversations')
          .query({ page: 2, size: 25 })
          .reply(200, mockResponse);

        const resource = await resourceHandler.handleResource(
          'helpscout://conversations?page=2&size=25'
        );

        const data = JSON.parse(resource.text as string);
        expect(data.pagination.number).toBe(2);
        expect(data.pagination.size).toBe(25);
      });

      it('should handle all filter parameters', async () => {
        const mockResponse = {
          _embedded: { conversations: [] },
          page: { size: 50, totalElements: 0 },
          _links: {}
        };

        nock(baseURL)
          .get('/conversations')
          .query({
            page: 1,
            size: 50,
            mailbox: '123',
            status: 'closed',
            tag: 'urgent',
            modifiedSince: '2023-01-01T00:00:00Z'
          })
          .reply(200, mockResponse);

        const resource = await resourceHandler.handleResource(
          'helpscout://conversations?mailbox=123&status=closed&tag=urgent&modifiedSince=2023-01-01T00:00:00Z'
        );
        expect(resource).toBeDefined();
      });
    });

    describe('helpscout://threads', () => {
      it('should fetch threads resource as TextResourceContents', async () => {
        const mockResponse = {
          _embedded: {
            threads: [
              {
                id: 1,
                type: 'customer',
                body: 'Test message',
                createdAt: '2023-01-01T00:00:00Z'
              }
            ]
          },
          page: { size: 50, totalElements: 1 },
          _links: { next: null }
        };

        nock(baseURL)
          .get('/conversations/123/threads')
          .query({ page: 1, size: 50 })
          .reply(200, mockResponse);

        const resource = await resourceHandler.handleResource(
          'helpscout://threads?conversationId=123'
        );

        // TextResourceContents - no name/description
        expect(resource.uri).toBe('helpscout://threads?conversationId=123');
        expect(resource.mimeType).toBe('application/json');
        expect(resource).not.toHaveProperty('name');
        expect(resource).not.toHaveProperty('description');

        const data = JSON.parse(resource.text as string);
        expect(data.conversationId).toBe('123');
        expect(data.threads).toHaveLength(1);
        expect(data.threads[0].body).toBe('Test message');
        expect(data.pagination).toBeDefined();
        expect(data.links).toBeDefined();
      });

      it('should handle pagination parameters for threads', async () => {
        const mockResponse = {
          _embedded: {
            threads: []
          },
          page: { size: 25, totalElements: 0, number: 2 },
          _links: { prev: { href: '/conversations/123/threads?page=1' } }
        };

        nock(baseURL)
          .get('/conversations/123/threads')
          .query({ page: 2, size: 25 })
          .reply(200, mockResponse);

        const resource = await resourceHandler.handleResource(
          'helpscout://threads?conversationId=123&page=2&size=25'
        );

        const data = JSON.parse(resource.text as string);
        expect(data.pagination.number).toBe(2);
        expect(data.pagination.size).toBe(25);
      });

      it('should require conversationId parameter', async () => {
        await expect(
          resourceHandler.handleResource('helpscout://threads')
        ).rejects.toThrow('conversationId parameter is required');
      });

      it('should handle empty threads response', async () => {
        const mockResponse = {
          _embedded: { threads: [] },
          page: { size: 50, totalElements: 0 },
          _links: {}
        };

        nock(baseURL)
          .get('/conversations/456/threads')
          .query({ page: 1, size: 50 })
          .reply(200, mockResponse);

        const resource = await resourceHandler.handleResource(
          'helpscout://threads?conversationId=456'
        );

        const data = JSON.parse(resource.text as string);
        expect(data.conversationId).toBe('456');
        expect(data.threads).toHaveLength(0);
      });
    });

    describe('helpscout://clock', () => {
      it('should return server time as TextResourceContents', async () => {
        const resource = await resourceHandler.handleResource('helpscout://clock');

        // TextResourceContents - no name/description
        expect(resource.uri).toBe('helpscout://clock');
        expect(resource.mimeType).toBe('application/json');
        expect(resource).not.toHaveProperty('name');
        expect(resource).not.toHaveProperty('description');

        const data = JSON.parse(resource.text as string);
        expect(data).toHaveProperty('isoTime');
        expect(data).toHaveProperty('unixTime');
        expect(typeof data.isoTime).toBe('string');
        expect(typeof data.unixTime).toBe('number');
      });
    });

    describe('error handling', () => {
      it('should handle unsupported protocols', async () => {
        await expect(
          resourceHandler.handleResource('https://example.com/test')
        ).rejects.toThrow('Unsupported protocol: https');
      });

      it('should handle unknown resource paths', async () => {
        await expect(
          resourceHandler.handleResource('helpscout://unknown')
        ).rejects.toThrow('Unknown resource path: unknown');
      });

      it('should handle API errors', async () => {
        nock(baseURL)
          .get('/mailboxes')
          .reply(500, { message: 'Internal Server Error' });

        await expect(
          resourceHandler.handleResource('helpscout://inboxes')
        ).rejects.toBeDefined();
      });
    });
  });
});
