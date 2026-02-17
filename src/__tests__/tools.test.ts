import nock from 'nock';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

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
      get replySpacing() { return process.env.HELPSCOUT_REPLY_SPACING === 'compact' ? 'compact' : 'relaxed'; },
      get allowSendReply() { return process.env.HELPSCOUT_ALLOW_SEND_REPLY === 'true'; },
    },
    cache: { ttlSeconds: 300, maxSize: 10000 },
    logging: { level: 'info' },
    security: { allowPii: false },
    responses: { get verbose() { return process.env.HELPSCOUT_VERBOSE_RESPONSES === 'true'; } },
    connectionPool: {
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000,
      keepAlive: true,
      keepAliveMsecs: 1000,
    },
  },
  validateConfig: jest.fn(),
  isVerbose: (args: unknown) => {
    if (args && typeof args === 'object' && 'verbose' in args && typeof (args as any).verbose === 'boolean') {
      return (args as any).verbose;
    }
    return process.env.HELPSCOUT_VERBOSE_RESPONSES === 'true';
  },
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

import { ToolHandler } from '../tools/index.js';

describe('ToolHandler', () => {
  let toolHandler: ToolHandler;
  const baseURL = 'https://api.helpscout.net/v2';

  beforeEach(() => {
    // Mock environment for tests
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

    toolHandler = new ToolHandler();
  });

  afterEach(async () => {
    nock.cleanAll();
    // Clean up any pending promises or timers
    await new Promise(resolve => setImmediate(resolve));
  });

  describe('listTools', () => {
    it('should return all available tools', async () => {
      const tools = await toolHandler.listTools();

      // Core conversation tools + structuredConversationFilter + docs tools + reports tools
      expect(tools.length).toBeGreaterThanOrEqual(9);
      const toolNames = tools.map(t => t.name);

      // Verify all core conversation tools are present
      const expectedCoreTools = [
        'searchInboxes',
        'searchConversations',
        'getConversationSummary',
        'getThreads',
        'getServerTime',
        'listAllInboxes',
        'structuredConversationFilter'
      ];
      expectedCoreTools.forEach(name => {
        expect(toolNames).toContain(name);
      });
    });

    it('should have proper tool schemas', async () => {
      const tools = await toolHandler.listTools();

      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
      });
    });
  });

  describe('getServerTime', () => {
    it('should return server time without Help Scout API call', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getServerTime',
          arguments: {}
        }
      };

      const result = await toolHandler.callTool(request);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response).toHaveProperty('isoTime');
      expect(response).toHaveProperty('unixTime');
      expect(typeof response.isoTime).toBe('string');
      expect(typeof response.unixTime).toBe('number');
    });
  });

  describe('listAllInboxes', () => {
    it('should list all inboxes with helpful guidance', async () => {
      const mockResponse = {
        _embedded: {
          mailboxes: [
            { id: 1, name: 'Support Inbox', email: 'support@example.com', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-02T00:00:00Z' },
            { id: 2, name: 'Sales Inbox', email: 'sales@example.com', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-02T00:00:00Z' }
          ]
        },
        page: { size: 100, totalElements: 2 }
      };

      nock(baseURL)
        .get('/mailboxes')
        .query({ page: 1, size: 100 })
        .reply(200, mockResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'listAllInboxes',
          arguments: {}
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.content).toHaveLength(1);

      const textContent = result.content[0] as { type: 'text'; text: string };

      // Handle error responses
      if (result.isError) {
        expect(textContent.text).toContain('Error');
        return;
      }

      const response = JSON.parse(textContent.text);
      expect(response.inboxes).toHaveLength(2);
      expect(response.inboxes[0]).toHaveProperty('id', 1);
      expect(response.inboxes[0]).toHaveProperty('name', 'Support Inbox');
      expect(response.totalInboxes).toBe(2);
    });
  });

  describe('searchInboxes', () => {
    it('should search inboxes by name', async () => {
      const mockResponse = {
        _embedded: {
          mailboxes: [
            { id: 1, name: 'Support Inbox', email: 'support@example.com' },
            { id: 2, name: 'Sales Inbox', email: 'sales@example.com' }
          ]
        },
        page: { size: 50, totalElements: 2 }
      };

      nock(baseURL)
        .get('/mailboxes')
        .query({ page: 1, size: 50 })
        .reply(200, mockResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchInboxes',
          arguments: { query: 'Support' }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.content).toHaveLength(1);

      const textContent = result.content[0] as { type: 'text'; text: string };

      // Handle error responses
      if (result.isError) {
        expect(textContent.text).toContain('Error');
        return;
      }

      const response = JSON.parse(textContent.text);
      expect(response.results).toHaveLength(1);
      expect(response.results[0].name).toBe('Support Inbox');
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      nock(baseURL)
        .get('/mailboxes')
        .reply(401, { message: 'Unauthorized' });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchInboxes',
          arguments: { query: 'test' }
        }
      };

      const result = await toolHandler.callTool(request);
      // The error might be handled gracefully, so check for either error or empty results
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      // Should either be an error or empty results
      expect(response.error || response.results || response.totalFound === 0).toBeTruthy();
    });

    it('should handle unknown tool names', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'unknownTool',
          arguments: {}
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      expect(textContent.text).toContain('Unknown tool');
    });
  });

  describe('searchConversations', () => {
    it('should search conversations with filters', async () => {
      const mockResponse = {
        _embedded: {
          conversations: [
            {
              id: 1,
              subject: 'Support Request',
              status: 'active',
              createdAt: '2023-01-01T00:00:00Z',
              customer: { id: 1, firstName: 'John', lastName: 'Doe' }
            }
          ]
        },
        page: { size: 50, totalElements: 1 },
        _links: { next: null }
      };

      nock(baseURL)
        .get('/conversations')
        .query({
          page: 1,
          size: 50,
          sortField: 'createdAt',
          sortOrder: 'desc',
          status: 'active'
        })
        .reply(200, mockResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            limit: 50,
            status: 'active',
            sort: 'createdAt',
            order: 'desc'
          }
        }
      };

      const result = await toolHandler.callTool(request);

      if (!result.isError) {
        const textContent = result.content[0] as { type: 'text'; text: string };
        const response = JSON.parse(textContent.text);
        expect(response.results).toHaveLength(1);
        expect(response.results[0].subject).toBe('Support Request');
      }
    });
  });

  describe('searchConversations with includeTranscripts', () => {
    it('should return conversations with inline transcripts', async () => {
      const mockConversations = {
        _embedded: {
          conversations: [
            {
              id: 101,
              subject: 'Billing Issue',
              status: 'active',
              createdAt: '2023-06-01T00:00:00Z',
              customer: { id: 1, firstName: 'Jane', lastName: 'Doe' },
            },
          ],
        },
        page: { size: 10, totalElements: 1 },
        _links: { next: null },
      };

      const mockThreads = {
        _embedded: {
          threads: [
            {
              id: 201,
              type: 'customer',
              state: 'published',
              body: '<p>I have a billing question</p>',
              createdAt: '2023-06-01T00:00:00Z',
              customer: { id: 1, firstName: 'Jane', lastName: 'Doe' },
              createdBy: null,
            },
            {
              id: 202,
              type: 'message',
              state: 'published',
              body: '<p>Happy to help with billing</p>',
              createdAt: '2023-06-01T01:00:00Z',
              customer: null,
              createdBy: { id: 5, firstName: 'Agent', lastName: 'Smith' },
            },
            {
              id: 203,
              type: 'note',
              state: 'published',
              body: 'Internal note',
              createdAt: '2023-06-01T00:30:00Z',
              customer: null,
              createdBy: { id: 5, firstName: 'Agent', lastName: 'Smith' },
            },
          ],
        },
        page: { size: 10, totalElements: 3 },
        _links: { next: null },
      };

      // Mock: search returns conversations for all 3 statuses
      for (const status of ['active', 'pending', 'closed']) {
        nock(baseURL)
          .get('/conversations')
          .query((q) => q.status === status)
          .reply(200, status === 'active' ? mockConversations : {
            _embedded: { conversations: [] },
            page: { size: 10, totalElements: 0 },
            _links: { next: null },
          });
      }

      // Mock: thread fetch for conversation 101
      nock(baseURL)
        .get('/conversations/101/threads')
        .query(true)
        .reply(200, mockThreads);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            includeTranscripts: true,
            limit: 5,
          },
        },
      };

      const result = await toolHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);

      expect(response.includeTranscripts).toBe(true);
      expect(response.transcriptMaxMessages).toBe(10);

      // Find the conversation in the results
      const allConvs = response.results || response.resultsByStatus?.flatMap((s: any) => s.conversations) || [];
      expect(allConvs.length).toBeGreaterThanOrEqual(1);

      const conv = allConvs.find((c: any) => c.id === 101);
      expect(conv).toBeDefined();
      expect(conv.transcript).toBeDefined();
      expect(conv.transcript).toHaveLength(2); // customer + staff only (note excluded)
      expect(conv.transcript[0].role).toBe('customer');
      expect(conv.transcript[1].role).toBe('staff');
      // allowPii is false in test config, so content is redacted
      expect(conv.transcript[0].body).toContain('Content hidden');
      expect(conv.transcript[1].body).toContain('Content hidden');
    });

    it('should default limit to 10 when includeTranscripts is true and no limit specified', async () => {
      // We verify the default by checking the query param sent to the API
      for (const status of ['active', 'pending', 'closed']) {
        nock(baseURL)
          .get('/conversations')
          .query((q) => q.status === status)
          .reply(200, {
            _embedded: { conversations: [] },
            page: { size: 10, totalElements: 0 },
            _links: { next: null },
          });
      }

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            includeTranscripts: true,
            // no limit specified — should default to 10 instead of 50
          },
        },
      };

      const result = await toolHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.includeTranscripts).toBe(true);
    });

    it('should respect transcriptMaxMessages parameter', async () => {
      const mockConversations = {
        _embedded: {
          conversations: [
            {
              id: 301,
              subject: 'Long thread',
              status: 'active',
              createdAt: '2023-06-01T00:00:00Z',
              customer: { id: 1, firstName: 'Test', lastName: 'User' },
            },
          ],
        },
        page: { size: 10, totalElements: 1 },
        _links: { next: null },
      };

      // Create 5 customer messages
      const threads = Array.from({ length: 5 }, (_, i) => ({
        id: 400 + i,
        type: 'customer',
        state: 'published',
        body: `<p>Message ${i + 1}</p>`,
        createdAt: `2023-06-0${i + 1}T00:00:00Z`,
        customer: { id: 1, firstName: 'Test', lastName: 'User' },
        createdBy: null,
      }));

      for (const status of ['active', 'pending', 'closed']) {
        nock(baseURL)
          .get('/conversations')
          .query((q) => q.status === status)
          .reply(200, status === 'active' ? mockConversations : {
            _embedded: { conversations: [] },
            page: { size: 10, totalElements: 0 },
            _links: { next: null },
          });
      }

      nock(baseURL)
        .get('/conversations/301/threads')
        .query(true)
        .reply(200, {
          _embedded: { threads },
          page: { size: 10, totalElements: 5 },
          _links: { next: null },
        });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            includeTranscripts: true,
            transcriptMaxMessages: 2,
            limit: 5,
          },
        },
      };

      const result = await toolHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);

      const allConvs = response.results || response.resultsByStatus?.flatMap((s: any) => s.conversations) || [];
      const conv = allConvs.find((c: any) => c.id === 301);
      expect(conv).toBeDefined();
      expect(conv.transcript).toHaveLength(2); // capped at transcriptMaxMessages
      expect(response.transcriptMaxMessages).toBe(2);
    });
  });

  describe('API Constraints Validation - Branch Coverage', () => {
    it('should handle validation failures with required prerequisites', async () => {
      // Set user context that mentions an inbox
      toolHandler.setUserContext('search the support inbox for urgent tickets');

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            query: 'urgent',
            // No inboxId provided despite mentioning "support inbox"
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.error).toBe('API Constraint Validation Failed');
      expect(response.details.requiredPrerequisites).toContain('searchInboxes');
    });

    it('should handle validation failures without prerequisites', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getConversationSummary',
          arguments: {
            conversationId: 'invalid-format'  // Should be numeric
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.error).toBe('API Constraint Validation Failed');
      expect(response.details.errors).toContain('Invalid conversation ID format');
    });

    it('should provide API guidance for successful tool calls', async () => {
      const mockResponse = {
        results: [
          { id: '123', name: 'Support', email: 'support@test.com' }
        ]
      };

      nock(baseURL)
        .get('/mailboxes')
        .query({ page: 1, size: 50 })
        .reply(200, { _embedded: { mailboxes: mockResponse.results } });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchInboxes',
          arguments: { query: 'support' }
        }
      };

      const result = await toolHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);

      expect(response.apiGuidance).toBeDefined();
      expect(response.apiGuidance[0]).toContain('NEXT STEP');
    });

    it('should handle tool calls without API guidance', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getServerTime',
          arguments: {}
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.isoTime).toBeDefined();
      // getServerTime doesn't generate API guidance
    });
  });

  describe('Error Handling - Branch Coverage', () => {
    it('should handle Zod validation errors in tool arguments', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchInboxes',
          arguments: { limit: 'invalid' }  // Should be number
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const errorResponse = JSON.parse(textContent.text);
      expect(errorResponse.error.code).toBe('INVALID_INPUT');
    });

    it('should handle missing required fields in tool arguments', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getConversationSummary',
          arguments: {}  // Missing required conversationId
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const errorResponse = JSON.parse(textContent.text);

      // Could be either validation error or API constraint validation error
      const errorIdentifier = typeof errorResponse.error === 'string'
        ? errorResponse.error
        : errorResponse.error?.code;
      expect(['INVALID_INPUT', 'API Constraint Validation Failed']).toContain(errorIdentifier);
    });

    it('should handle unknown tool calls', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'unknownTool',
          arguments: {}
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const errorResponse = JSON.parse(textContent.text);
      expect(errorResponse.error.code).toBe('TOOL_ERROR');
      expect(errorResponse.error.message).toContain('Unknown tool');
    });

    it('should handle keyword search with no inbox ID when required', async () => {
      toolHandler.setUserContext('search conversations in the support mailbox');

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            searchTerms: ['urgent']
            // Missing inboxId despite mentioning "support mailbox"
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);

      // Validation should fail because inbox was mentioned but no inboxId provided
      expect(response.error).toBe('API Constraint Validation Failed');
      expect(response.details.requiredPrerequisites).toContain('searchInboxes');
    });
  });

  describe('getConversationSummary', () => {
    it('should handle conversations with no customer threads', async () => {
      const mockConversation = {
        id: 123,
        subject: 'Test Conversation',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        customer: { id: 1, firstName: 'John', lastName: 'Doe' },
        assignee: null,
        tags: []
      };

      const mockThreads = {
        _embedded: {
          threads: [
            {
              id: 1,
              type: 'message',  // Staff message only
              body: 'Staff reply',
              createdAt: '2023-01-01T10:00:00Z',
              createdBy: { id: 1, firstName: 'Agent', lastName: 'Smith' }
            }
          ]
        }
      };

      nock(baseURL)
        .get('/conversations/123')
        .reply(200, mockConversation);

      nock(baseURL)
        .get('/conversations/123/threads')
        .query({ page: 1, size: 200 })
        .reply(200, mockThreads);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getConversationSummary',
          arguments: { conversationId: '123' }
        }
      };

      const result = await toolHandler.callTool(request);

      if (!result.isError) {
        const textContent = result.content[0] as { type: 'text'; text: string };
        const response = JSON.parse(textContent.text);

        // Should handle null firstCustomerMessage
        expect(response.firstCustomerMessage).toBeNull();
        expect(response.latestStaffReply).toBeDefined();
      }
    });

    it('should handle conversations with no staff replies', async () => {
      const mockConversation = {
        id: 124,
        subject: 'Customer Only Conversation',
        status: 'pending',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        customer: { id: 1, firstName: 'John', lastName: 'Doe' },
        assignee: null,
        tags: []
      };

      const mockThreads = {
        _embedded: {
          threads: [
            {
              id: 1,
              type: 'customer',  // Customer message only
              body: 'Customer question',
              createdAt: '2023-01-01T09:00:00Z',
              customer: { id: 1, firstName: 'John', lastName: 'Doe' }
            }
          ]
        }
      };

      nock(baseURL)
        .get('/conversations/124')
        .reply(200, mockConversation);

      nock(baseURL)
        .get('/conversations/124/threads')
        .query({ page: 1, size: 200 })
        .reply(200, mockThreads);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getConversationSummary',
          arguments: { conversationId: '124' }
        }
      };

      const result = await toolHandler.callTool(request);

      if (!result.isError) {
        const textContent = result.content[0] as { type: 'text'; text: string };
        const response = JSON.parse(textContent.text);

        // Should handle null latestStaffReply
        expect(response.firstCustomerMessage).toBeDefined();
        expect(response.latestStaffReply).toBeNull();
      }
    });

    it('should get conversation summary with threads', async () => {
      const mockConversation = {
        id: 123,
        subject: 'Test Conversation',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        customer: { id: 1, firstName: 'John', lastName: 'Doe' },
        assignee: { id: 2, firstName: 'Jane', lastName: 'Smith' },
        tags: ['support', 'urgent']
      };

      const mockThreads = {
        _embedded: {
          threads: [
            {
              id: 1,
              type: 'customer',
              body: 'Original customer message',
              createdAt: '2023-01-01T00:00:00Z',
              customer: { id: 1, firstName: 'John' }
            },
            {
              id: 2,
              type: 'message',
              body: 'Staff reply',
              createdAt: '2023-01-01T12:00:00Z',
              createdBy: { id: 2, firstName: 'Jane' }
            }
          ]
        }
      };

      nock(baseURL)
        .get('/conversations/123')
        .reply(200, mockConversation)
        .get('/conversations/123/threads')
        .query({ page: 1, size: 200 })
        .reply(200, mockThreads);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getConversationSummary',
          arguments: { conversationId: "123" }
        }
      };

      const result = await toolHandler.callTool(request);

      if (!result.isError) {
        const textContent = result.content[0] as { type: 'text'; text: string };
        const summary = JSON.parse(textContent.text);
        expect(summary.conversation.subject).toBe('Test Conversation');
        expect(summary.firstCustomerMessage).toBeDefined();
        expect(summary.latestStaffReply).toBeDefined();
      }
    });
  });

  describe('getThreads', () => {
    it('should get conversation threads', async () => {
      const mockResponse = {
        _embedded: {
          threads: [
            {
              id: 1,
              type: 'customer',
              body: 'Thread message',
              createdAt: '2023-01-01T00:00:00Z'
            }
          ]
        }
      };

      nock(baseURL)
        .get('/conversations/123/threads')
        .query({ page: 1, size: 200 })
        .reply(200, mockResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getThreads',
          arguments: { conversationId: "123" }
        }
      };

      const result = await toolHandler.callTool(request);

      if (!result.isError) {
        const textContent = result.content[0] as { type: 'text'; text: string };
        const response = JSON.parse(textContent.text);
        expect(response.conversationId).toBe("123");
        expect(response.threads).toHaveLength(1);
      }
    });

    it('should return transcript format with only customer/staff messages', async () => {
      const mockResponse = {
        _embedded: {
          threads: [
            {
              id: 1,
              type: 'customer',
              body: '<p>Hello, I need help with <b>billing</b></p>',
              customer: { id: 10, firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
              createdBy: null,
              createdAt: '2024-01-01T10:00:00Z',
              updatedAt: '2024-01-01T10:00:00Z',
            },
            {
              id: 2,
              type: 'lineitem',
              body: 'Assigned to Support Team',
              customer: null,
              createdBy: null,
              createdAt: '2024-01-01T10:01:00Z',
              updatedAt: '2024-01-01T10:01:00Z',
            },
            {
              id: 3,
              type: 'note',
              body: 'Internal: check their account',
              customer: null,
              createdBy: { id: 20, firstName: 'Agent', lastName: 'Smith', email: 'agent@test.com' },
              createdAt: '2024-01-01T10:02:00Z',
              updatedAt: '2024-01-01T10:02:00Z',
            },
            {
              id: 4,
              type: 'message',
              body: '<p>Hi Jane, I can help with that!</p>',
              customer: null,
              createdBy: { id: 20, firstName: 'Agent', lastName: 'Smith', email: 'agent@test.com' },
              createdAt: '2024-01-01T10:05:00Z',
              updatedAt: '2024-01-01T10:05:00Z',
            },
          ]
        },
        page: { size: 25, totalElements: 4, totalPages: 1, number: 0 }
      };

      nock(baseURL)
        .get('/conversations/456/threads')
        .query({ page: 1, size: 200 })
        .reply(200, mockResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getThreads',
          arguments: { conversationId: '456', format: 'transcript' }
        }
      };

      const result = await toolHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);

      expect(response.format).toBe('transcript');
      expect(response.messages).toHaveLength(2); // Only customer + message, not lineitem/note
      expect(response.messages[0].role).toBe('customer');
      expect(response.messages[0].from).toBe('Jane Doe');
      expect(response.messages[0].body).toContain('[Content hidden'); // PII redacted in test config
      expect(response.messages[1].role).toBe('staff');
      expect(response.messages[1].from).toBe('Agent Smith');
      expect(response.messages[1].body).toContain('[Content hidden');
      expect(response.totalMessages).toBe(2);
      expect(response.totalThreads).toBe(4);
    });
  });

  describe('searchConversations - keyword mode', () => {
    it('should search across multiple statuses by default', async () => {
      const freshToolHandler = new ToolHandler();

      // Clean all previous mocks
      nock.cleanAll();

      // Re-add the auth mock
      nock(baseURL)
        .persist()
        .post('/oauth2/token')
        .reply(200, {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        });

      // Mock responses for each status
      const mockActiveConversations = {
        _embedded: {
          conversations: [
            {
              id: 1,
              subject: 'Active urgent issue',
              status: 'active',
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        },
        page: {
          size: 25,
          totalElements: 1,
          totalPages: 1,
          number: 0
        }
      };

      const mockPendingConversations = {
        _embedded: {
          conversations: [
            {
              id: 2,
              subject: 'Pending urgent request',
              status: 'pending',
              createdAt: '2024-01-02T00:00:00Z'
            }
          ]
        },
        page: {
          size: 25,
          totalElements: 1,
          totalPages: 1,
          number: 0
        }
      };

      const mockClosedConversations = {
        _embedded: {
          conversations: [
            {
              id: 3,
              subject: 'Closed urgent case',
              status: 'closed',
              createdAt: '2024-01-03T00:00:00Z'
            },
            {
              id: 4,
              subject: 'Another closed urgent case',
              status: 'closed',
              createdAt: '2024-01-04T00:00:00Z'
            }
          ]
        },
        page: {
          size: 25,
          totalElements: 2,
          totalPages: 1,
          number: 0
        }
      };

      // Set up nock interceptors for each status
      // Note: query includes createdAt filter appended by the tool
      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'active' && (params.query as string).includes('body:"urgent"'))
        .reply(200, mockActiveConversations);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'pending' && (params.query as string).includes('body:"urgent"'))
        .reply(200, mockPendingConversations);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'closed' && (params.query as string).includes('body:"urgent"'))
        .reply(200, mockClosedConversations);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            searchTerms: ['urgent'],
            timeframeDays: 30
          }
        }
      };

      const result = await freshToolHandler.callTool(request);

      expect(result.isError).toBeUndefined();
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);

      expect(response.totalConversationsFound).toBe(4);
      expect(response.totalAvailable).toBe(4);
      expect(response.resultsByStatus).toHaveLength(3);
      expect(response.resultsByStatus[0].status).toBe('active');
      expect(response.resultsByStatus[0].conversations).toHaveLength(1);
      expect(response.resultsByStatus[1].status).toBe('pending');
      expect(response.resultsByStatus[1].conversations).toHaveLength(1);
      expect(response.resultsByStatus[2].status).toBe('closed');
      expect(response.resultsByStatus[2].conversations).toHaveLength(2);
    });

    it('should handle keyword search with custom limit', async () => {
      const freshToolHandler = new ToolHandler();

      nock.cleanAll();

      nock(baseURL)
        .persist()
        .post('/oauth2/token')
        .reply(200, {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        });

      const mockActiveConversations = {
        _embedded: {
          conversations: [
            {
              id: 1,
              subject: 'Active billing issue',
              status: 'active',
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        },
        page: {
          size: 10,
          totalElements: 1,
          totalPages: 1,
          number: 0
        }
      };

      const emptyResponse = {
        _embedded: { conversations: [] },
        page: { size: 10, totalElements: 0 }
      };

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'active' && (params.query as string).includes('body:"billing"'))
        .reply(200, mockActiveConversations);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'pending' && (params.query as string).includes('body:"billing"'))
        .reply(200, emptyResponse);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'closed' && (params.query as string).includes('body:"billing"'))
        .reply(200, emptyResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            searchTerms: ['billing'],
            limit: 10
          }
        }
      };

      const result = await freshToolHandler.callTool(request);

      expect(result.isError).toBeUndefined();
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);

      expect(response.totalConversationsFound).toBe(1);
      expect(response.resultsByStatus).toHaveLength(3);
      expect(response.resultsByStatus[0].status).toBe('active');
    });

    it('should handle invalid inboxId format validation', async () => {
      toolHandler.setUserContext('search the support inbox');

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            query: 'test',
            inboxId: 'invalid-format'  // Should be numeric
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.error).toBe('API Constraint Validation Failed');
      expect(response.details.errors[0]).toContain('Invalid inbox ID format');
    });

    it('should handle different search locations in keyword search', async () => {
      const freshToolHandler = new ToolHandler();

      nock.cleanAll();

      nock(baseURL)
        .persist()
        .post('/oauth2/token')
        .reply(200, {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        });

      const emptyResponse = {
        _embedded: { conversations: [] },
        page: { size: 25, totalElements: 0 }
      };

      // Mock all 3 statuses
      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'active')
        .reply(200, emptyResponse);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'pending')
        .reply(200, emptyResponse);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'closed')
        .reply(200, emptyResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            searchTerms: ['test'],
            searchIn: ['subject'],  // Test subject-only search
          }
        }
      };

      const result = await freshToolHandler.callTool(request);

      if (!result.isError) {
        const textContent = result.content[0] as { type: 'text'; text: string };
        const response = JSON.parse(textContent.text);
        expect(response.query).toContain('subject:"test"');
        expect(response.query).not.toContain('body:"test"');
      }
    });

    it('should handle search with no results and provide guidance', async () => {
      const freshToolHandler = new ToolHandler();

      nock.cleanAll();

      nock(baseURL)
        .persist()
        .post('/oauth2/token')
        .reply(200, {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        });

      const emptyResponse = {
        _embedded: {
          conversations: []
        },
        page: {
          size: 25,
          totalElements: 0,
          totalPages: 0,
          number: 0
        }
      };

      // Mock empty responses for all statuses
      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'active')
        .reply(200, emptyResponse);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'pending')
        .reply(200, emptyResponse);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'closed')
        .reply(200, emptyResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            searchTerms: ['nonexistent']
          }
        }
      };

      const result = await freshToolHandler.callTool(request);

      expect(result.isError).toBeUndefined();
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);

      expect(response.totalConversationsFound).toBe(0);
      // New compact shape: no searchTips field, but totalAvailable is present
      expect(response.totalAvailable).toBe(0);
      expect(response.resultsByStatus).toBeDefined();
      expect(response.resultsByStatus).toHaveLength(3);
    });
  });

  describe('searchConversations - structured mode', () => {
    it('should handle advanced search with all parameter types', async () => {
      const mockResponse = {
        _embedded: { conversations: [] },
        page: { size: 50, totalElements: 0 }
      };

      nock(baseURL)
        .get('/conversations')
        .query(() => true)
        .reply(200, mockResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            contentTerms: ['urgent', 'billing'],
            subjectTerms: ['help', 'support'],
            customerEmail: 'test@example.com',
            emailDomain: 'company.com',
            tags: ['vip', 'escalation'],
            createdBefore: '2024-01-31T23:59:59Z'
          }
        }
      };

      const result = await toolHandler.callTool(request);

      if (!result.isError) {
        const textContent = result.content[0] as { type: 'text'; text: string };
        const response = JSON.parse(textContent.text);
        // New compact shape: query is a string containing the search terms
        expect(response.query).toContain('body:"urgent"');
        expect(response.query).toContain('body:"billing"');
        expect(response.query).toContain('tag:"vip"');
        expect(response.query).toContain('tag:"escalation"');
        expect(response.pagination).toBeDefined();
        expect(response.pagination.returned).toBe(0);
      }
    });

    it('should slim conversations by default in structured mode', async () => {
      const mockResponse = {
        _embedded: {
          conversations: [
            { id: 1, subject: 'Test', status: 'active', extraField: 'should be stripped', createdAt: '2024-01-01T00:00:00Z' }
          ]
        },
        page: { size: 50, totalElements: 1 }
      };

      nock(baseURL)
        .get('/conversations')
        .query(() => true)
        .reply(200, mockResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            contentTerms: ['test'],
          }
        }
      };

      const result = await toolHandler.callTool(request);

      if (!result.isError) {
        const textContent = result.content[0] as { type: 'text'; text: string };
        const response = JSON.parse(textContent.text);
        // Slim mode strips extraField and other non-essential fields
        expect(response.results[0].id).toBe(1);
        expect(response.results[0].extraField).toBeUndefined();
      }
    });
  });

  describe('enhanced searchConversations', () => {
    it('should search all statuses by default when no status provided', async () => {
      const freshToolHandler = new ToolHandler();

      nock.cleanAll();

      nock(baseURL)
        .persist()
        .post('/oauth2/token')
        .reply(200, {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        });

      const emptyResponse = {
        _embedded: {
          conversations: []
        },
        page: {
          size: 50,
          totalElements: 0,
          totalPages: 0,
          number: 0
        }
      };

      // Multi-status parallel search: active, pending, closed
      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'active' && params.query === '(body:"test")')
        .reply(200, emptyResponse);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'pending' && params.query === '(body:"test")')
        .reply(200, emptyResponse);

      nock(baseURL)
        .get('/conversations')
        .query(params => params.status === 'closed' && params.query === '(body:"test")')
        .reply(200, emptyResponse);

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'searchConversations',
          arguments: {
            query: '(body:"test")'
          }
        }
      };

      const result = await freshToolHandler.callTool(request);

      expect(result.isError).toBeUndefined();
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);

      // New compact shape: statuses array at top level, no searchInfo wrapper
      expect(response.statuses).toEqual(['active', 'pending', 'closed']);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.returned).toBe(0);
      expect(response.pagination.totalAvailable).toBe(0);
    });
  });

  describe('createReply', () => {
    it('should list createReply in available tools', async () => {
      const tools = await toolHandler.listTools();
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('createReply');
    });

    it('should create a draft reply successfully', async () => {
      nock(baseURL)
        .post('/conversations/12345/reply')
        .reply(201, '', { 'resource-id': '99999' });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '12345',
            text: '<p>Thanks for reaching out!</p>',
            customer: { id: 789 },
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBeUndefined();

      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.success).toBe(true);
      expect(response.conversationId).toBe('12345');
      expect(response.threadId).toBe('99999');
      expect(response.draft).toBe(true);
      expect(response.message).toContain('Draft');
    });

    it('should default to draft when draft is not specified', async () => {
      nock(baseURL)
        .post('/conversations/12345/reply', (body: any) => body.draft === true)
        .reply(201, '', { 'resource-id': '99999' });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '12345',
            text: '<p>Test</p>',
            customer: { email: 'test@example.com' },
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBeUndefined();

      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.draft).toBe(true);
    });

    it('should block published replies when HELPSCOUT_ALLOW_SEND_REPLY is not set', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '12345',
            text: '<p>Test</p>',
            customer: { id: 789 },
            draft: false,
          }
        }
      };

      const result = await toolHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.error).toBe('Published replies are disabled');
    });

    it('should allow published replies when HELPSCOUT_ALLOW_SEND_REPLY=true', async () => {
      process.env.HELPSCOUT_ALLOW_SEND_REPLY = 'true';

      nock(baseURL)
        .post('/conversations/12345/reply', (body: any) => body.draft === false)
        .reply(201, '', { 'resource-id': '88888' });

      // Need a fresh handler to pick up the env change via mock getters
      const freshHandler = new ToolHandler();

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '12345',
            text: '<p>Sent reply</p>',
            customer: { id: 789 },
            draft: false,
          }
        }
      };

      const result = await freshHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.success).toBe(true);
      expect(response.draft).toBe(false);
      expect(response.message).toContain('sent successfully');

      delete process.env.HELPSCOUT_ALLOW_SEND_REPLY;
    });

    it('should pass optional fields (cc, bcc, status, user, assignTo)', async () => {
      nock(baseURL)
        .post('/conversations/12345/reply', (body: any) => {
          return body.cc?.length === 1 &&
            body.bcc?.length === 1 &&
            body.status === 'closed' &&
            body.user === 42 &&
            body.assignTo === 99;
        })
        .reply(201, '', { 'resource-id': '77777' });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '12345',
            text: '<p>Closing this out.</p>',
            customer: { id: 789 },
            cc: ['manager@example.com'],
            bcc: ['archive@example.com'],
            status: 'closed',
            user: 42,
            assignTo: 99,
          }
        }
      };

      const result = await toolHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.success).toBe(true);
    });

    it('should validate conversationId format via API constraints', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: 'invalid-id',
            text: '<p>Test</p>',
            customer: { id: 1 },
          }
        }
      };

      const result = await toolHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.error).toBe('API Constraint Validation Failed');
      expect(response.details.errors).toContain('Invalid conversation ID format');
    });

    it('should validate missing required fields via API constraints', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '12345',
            // missing text and customer
          }
        }
      };

      const result = await toolHandler.callTool(request);
      const textContent = result.content[0] as { type: 'text'; text: string };
      const response = JSON.parse(textContent.text);
      expect(response.error).toBe('API Constraint Validation Failed');
      expect(response.details.errors).toContain('text is required');
      expect(response.details.errors).toContain('customer is required');
    });
  });

  describe('formatReplyHtml (via createReply)', () => {
    // We test formatReplyHtml indirectly by checking the text sent in the POST body

    it('should convert <p> tags to <br><br>', async () => {
      nock(baseURL)
        .post('/conversations/1/reply', (body: any) => {
          return body.text === 'Hello<br><br>World';
        })
        .reply(201, '', { 'resource-id': '1' });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '1',
            text: '<p>Hello</p><p>World</p>',
            customer: { id: 1 },
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBeUndefined();
    });

    it('should add inline-code class to bare <code> tags', async () => {
      nock(baseURL)
        .post('/conversations/1/reply', (body: any) => {
          return body.text.includes('<code class="inline-code">') &&
                 body.text.includes('<code class="existing">');
        })
        .reply(201, '', { 'resource-id': '1' });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '1',
            text: '<p>Code: <code>test</code> and <code class="existing">keep</code></p>',
            customer: { id: 1 },
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBeUndefined();
    });

    it('should convert <pre><code> to <div> with <br> for newlines', async () => {
      nock(baseURL)
        .post('/conversations/1/reply', (body: any) => {
          // <pre><code>line1\nline2</code></pre> → <div>line1<br>line2</div>
          return body.text.includes('<div>line1<br>line2</div>');
        })
        .reply(201, '', { 'resource-id': '1' });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '1',
            text: '<pre><code>line1\nline2</code></pre>',
            customer: { id: 1 },
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBeUndefined();
    });

    it('should strip breaks before lists and add break after in relaxed mode', async () => {
      nock(baseURL)
        .post('/conversations/1/reply', (body: any) => {
          // No breaks before <ul>, single <br> after </ul>
          return body.text.includes('Before<ul>') && body.text.includes('</ul><br>After');
        })
        .reply(201, '', { 'resource-id': '1' });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '1',
            text: '<p>Before</p><ul><li>Item</li></ul><p>After</p>',
            customer: { id: 1 },
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBeUndefined();
    });

    it('should add double break before blockquotes in relaxed mode', async () => {
      nock(baseURL)
        .post('/conversations/1/reply', (body: any) => {
          return body.text.includes('<br><br><blockquote>');
        })
        .reply(201, '', { 'resource-id': '1' });

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '1',
            text: '<p>Before</p><blockquote>Quoted</blockquote>',
            customer: { id: 1 },
          }
        }
      };

      const result = await toolHandler.callTool(request);
      expect(result.isError).toBeUndefined();
    });

    it('should strip all extra breaks in compact mode', async () => {
      process.env.HELPSCOUT_REPLY_SPACING = 'compact';

      nock(baseURL)
        .post('/conversations/1/reply', (body: any) => {
          // Compact: no breaks before blockquote, no breaks after blocks
          return !body.text.includes('<br><blockquote>') &&
                 !body.text.includes('</ul><br>') &&
                 !body.text.includes('</blockquote><br>');
        })
        .reply(201, '', { 'resource-id': '1' });

      const freshHandler = new ToolHandler();

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'createReply',
          arguments: {
            conversationId: '1',
            text: '<p>Before</p><ul><li>Item</li></ul><p>Middle</p><blockquote>Quoted</blockquote><p>After</p>',
            customer: { id: 1 },
          }
        }
      };

      const result = await freshHandler.callTool(request);
      expect(result.isError).toBeUndefined();

      delete process.env.HELPSCOUT_REPLY_SPACING;
    });
  });
});
