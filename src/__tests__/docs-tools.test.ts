import nock from 'nock';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

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

jest.mock('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../utils/cache.js', () => ({
  cache: {
    get: jest.fn(() => null),
    set: jest.fn(),
    clear: jest.fn(),
  },
}));

import { ToolHandler } from '../tools/index.js';

describe('Docs Tools Compatibility', () => {
  let toolHandler: ToolHandler;
  const baseURL = 'https://api.helpscout.net/v2';

  beforeEach(() => {
    process.env.HELPSCOUT_CLIENT_ID = 'test-client-id';
    process.env.HELPSCOUT_CLIENT_SECRET = 'test-client-secret';
    process.env.HELPSCOUT_BASE_URL = `${baseURL}/`;
    process.env.HELPSCOUT_DOCS_API_KEY = 'test-docs-key';
    delete process.env.HELPSCOUT_DISABLE_DOCS;

    nock.cleanAll();

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
    delete process.env.HELPSCOUT_DOCS_API_KEY;
    await new Promise(resolve => setImmediate(resolve));
  });

  it('should call listDocsArticles for a collection', async () => {
    nock('https://docsapi.helpscout.net')
      .get('/v1/collections/col-1/articles')
      .query({
        page: 1,
        pageSize: 100,
        sort: 'createdAt',
        order: 'desc',
      })
      .reply(200, {
        page: 1,
        pages: 1,
        count: 1,
        items: [
          {
            id: 'art-1',
            name: 'Article One',
            status: 'published',
            publicUrl: 'https://example.com/article-one',
            viewCount: 12,
            collectionId: 'col-1',
          },
        ],
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'listDocsArticles',
        arguments: { collectionId: 'col-1' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.articles).toEqual([
      {
        id: 'art-1',
        name: 'Article One',
        status: 'published',
        publicUrl: 'https://example.com/article-one',
        viewCount: 12,
        collectionId: 'col-1',
      },
    ]);
  });

  it('should route legacy docs aliases through the merged handlers', async () => {
    nock('https://docsapi.helpscout.net')
      .get('/v1/categories/cat-1/articles')
      .query({
        page: 1,
        pageSize: 100,
        sort: 'createdAt',
        order: 'desc',
      })
      .reply(200, {
        page: 1,
        pages: 1,
        count: 1,
        items: [
          {
            id: 'art-2',
            name: 'Alias Article',
            status: 'published',
            publicUrl: 'https://example.com/alias-article',
            viewCount: 4,
            collectionId: 'col-2',
          },
        ],
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'listDocsArticlesByCategory',
        arguments: { categoryId: 'cat-1' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.articles[0].id).toBe('art-2');
  });

  it('should call getDocsEntity for a collection', async () => {
    nock('https://docsapi.helpscout.net')
      .get('/v1/collections/col-9')
      .reply(200, {
        id: 'col-9',
        siteId: 'site-1',
        name: 'Guides',
        description: 'Product guides',
        visibility: 'public',
        order: 1,
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'getDocsEntity',
        arguments: { type: 'collection', id: 'col-9' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.collection.id).toBe('col-9');
    expect(response.collection.name).toBe('Guides');
  });

  it('should route legacy getDocsCollection through getDocsEntity', async () => {
    nock('https://docsapi.helpscout.net')
      .get('/v1/collections/col-legacy')
      .reply(200, {
        id: 'col-legacy',
        siteId: 'site-1',
        name: 'Legacy Collection',
        description: 'Legacy path',
        visibility: 'private',
        order: 2,
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'getDocsCollection',
        arguments: { collectionId: 'col-legacy' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.collection.id).toBe('col-legacy');
  });

  it('should call updateDocsEntity for a category', async () => {
    nock('https://docsapi.helpscout.net')
      .put('/v1/categories/cat-9', {
        name: 'Updated Category',
        visibility: 'public',
        order: 3,
      })
      .reply(200, {
        id: 'cat-9',
        collectionId: 'col-9',
        name: 'Updated Category',
        visibility: 'public',
        order: 3,
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'updateDocsEntity',
        arguments: {
          type: 'category',
          id: 'cat-9',
          name: 'Updated Category',
          visibility: 'public',
          order: 3,
        },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.category.id).toBe('cat-9');
    expect(response.category.name).toBe('Updated Category');
  });

  it('should route legacy updateDocsCategory through updateDocsEntity', async () => {
    nock('https://docsapi.helpscout.net')
      .put('/v1/categories/cat-legacy', {
        description: 'Updated description',
      })
      .reply(200, {
        id: 'cat-legacy',
        collectionId: 'col-legacy',
        name: 'Legacy Category',
        description: 'Updated description',
        visibility: 'public',
        order: 1,
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'updateDocsCategory',
        arguments: {
          categoryId: 'cat-legacy',
          description: 'Updated description',
        },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.category.description).toBe('Updated description');
  });

  it('should call searchDocsArticles with /search/articles endpoint', async () => {
    nock('https://docsapi.helpscout.net')
      .get('/v1/search/articles')
      .query({
        query: 'getting started',
        page: 1,
        pageSize: 100,
        status: 'published',
      })
      .reply(200, {
        page: 1,
        pages: 1,
        count: 1,
        items: [
          {
            id: 'art-search-1',
            name: 'Getting Started Guide',
            status: 'published',
            publicUrl: 'https://example.com/getting-started',
            collectionId: 'col-1',
            preview: 'Welcome to our getting started guide...',
          },
        ],
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'searchDocsArticles',
        arguments: { query: 'getting started' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.results).toHaveLength(1);
    expect(response.results[0].id).toBe('art-search-1');
    expect(response.results[0].name).toBe('Getting Started Guide');
  });

  it('should call getDocsArticle with /articles/{id} endpoint', async () => {
    nock('https://docsapi.helpscout.net')
      .get('/v1/articles/art-99')
      .reply(200, {
        article: {
          id: 'art-99',
          name: 'Test Article',
          status: 'published',
          publicUrl: 'https://example.com/test-article',
          collectionId: 'col-1',
          categories: ['cat-1'],
          related: [],
          viewCount: 42,
          text: '<p>Article content</p>',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'getDocsArticle',
        arguments: { articleId: 'art-99' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.article.id).toBe('art-99');
    expect(response.article.name).toBe('Test Article');
  });

  it('should pass draft as query parameter, not path segment', async () => {
    nock('https://docsapi.helpscout.net')
      .get('/v1/articles/art-draft')
      .query({ draft: true })
      .reply(200, {
        article: {
          id: 'art-draft',
          name: 'Draft Article',
          status: 'draft',
          publicUrl: 'https://example.com/draft-article',
          collectionId: 'col-1',
          categories: [],
          related: [],
          viewCount: 0,
          text: '<p>Draft content</p>',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'getDocsArticle',
        arguments: { articleId: 'art-draft', draft: true },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.article.id).toBe('art-draft');
    expect(response.article.status).toBe('draft');
  });

  it('should call updateDocsArticle with PUT /articles/{id}', async () => {
    nock('https://docsapi.helpscout.net')
      .put('/v1/articles/art-update', {
        name: 'Updated Title',
        status: 'published',
      })
      .reply(200, {
        id: 'art-update',
        name: 'Updated Title',
        status: 'published',
        publicUrl: 'https://example.com/updated',
        collectionId: 'col-1',
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'updateDocsArticle',
        arguments: {
          articleId: 'art-update',
          name: 'Updated Title',
          status: 'published',
        },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.article.id).toBe('art-update');
    expect(response.article.name).toBe('Updated Title');
  });

  it('should call saveDocsArticleDraft with PUT /articles/{id}/drafts', async () => {
    nock('https://docsapi.helpscout.net')
      .put('/v1/articles/art-draft-save/drafts', {
        text: '<p>Draft content</p>',
      })
      .reply(200, {
        id: 'art-draft-save',
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'saveDocsArticleDraft',
        arguments: {
          articleId: 'art-draft-save',
          text: '<p>Draft content</p>',
        },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.draft.id).toBe('art-draft-save');
  });

  it('should call getDocsArticleRevision with GET /revisions/{id}', async () => {
    nock('https://docsapi.helpscout.net')
      .get('/v1/revisions/rev-1')
      .reply(200, {
        id: 'rev-1',
        articleId: 'art-1',
        createdBy: { id: 'user-1', firstName: 'Test' },
        createdAt: '2024-06-01T00:00:00Z',
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'getDocsArticleRevision',
        arguments: { revisionId: 'rev-1' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.revision.id).toBe('rev-1');
  });

  it('should call findDocsRedirect with GET /redirects (not /redirects/find)', async () => {
    nock('https://docsapi.helpscout.net')
      .get('/v1/redirects')
      .query({
        siteId: 'site-1',
        url: '/old/path',
      })
      .reply(200, {
        id: 'redir-1',
        siteId: 'site-1',
        urlMapping: '/old/path',
        redirect: '/new/path',
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'findDocsRedirect',
        arguments: { siteId: 'site-1', url: '/old/path' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.redirect.id).toBe('redir-1');
  });

  it('should call updateDocsCategoryOrder with PUT /collections/{id}/categories', async () => {
    nock('https://docsapi.helpscout.net')
      .put('/v1/collections/col-order/categories', {
        categories: ['cat-a', 'cat-b', 'cat-c'],
      })
      .reply(200, {});

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'updateDocsCategoryOrder',
        arguments: {
          collectionId: 'col-order',
          categoryIds: ['cat-a', 'cat-b', 'cat-c'],
        },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
  });

  it('should call deleteDocsArticleDraft with DELETE /articles/{id}/drafts', async () => {
    process.env.HELPSCOUT_ALLOW_DOCS_DELETE = 'true';

    nock('https://docsapi.helpscout.net')
      .delete('/v1/articles/art-del-draft/drafts')
      .reply(200);

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'deleteDocsArticleDraft',
        arguments: { articleId: 'art-del-draft' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.articleId).toBe('art-del-draft');

    delete process.env.HELPSCOUT_ALLOW_DOCS_DELETE;
  });

  it('should accept legacy draftId param for deleteDocsArticleDraft', async () => {
    process.env.HELPSCOUT_ALLOW_DOCS_DELETE = 'true';

    nock('https://docsapi.helpscout.net')
      .delete('/v1/articles/art-legacy-draft/drafts')
      .reply(200);

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'deleteDocsArticleDraft',
        arguments: { draftId: 'art-legacy-draft' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.articleId).toBe('art-legacy-draft');

    delete process.env.HELPSCOUT_ALLOW_DOCS_DELETE;
  });

  it('should strip CDATA wrapper with trailing whitespace from article text', async () => {
    // Temporarily enable PII to test CDATA stripping on article text
    const { config } = await import('../utils/config.js');
    const origAllowPii = config.security.allowPii;
    (config.security as any).allowPii = true;

    nock('https://docsapi.helpscout.net')
      .get('/v1/articles/art-cdata')
      .reply(200, {
        article: {
          id: 'art-cdata',
          name: 'CDATA Test',
          status: 'published',
          publicUrl: 'https://example.com/cdata-test',
          collectionId: 'col-1',
          categories: [],
          related: [],
          viewCount: 0,
          text: '<![CDATA[<p>Article content</p>]]>\n',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
      });

    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'getDocsArticle',
        arguments: { articleId: 'art-cdata' },
      },
    };

    const result = await toolHandler.callTool(request);
    expect(result.isError).toBeUndefined();
    const response = JSON.parse((result.content[0] as { text: string }).text);
    expect(response.article.text).toBe('<p>Article content</p>');
    expect(response.article.text).not.toContain(']]>');
    expect(response.article.text).not.toContain('CDATA');

    (config.security as any).allowPii = origAllowPii;
  });
});
