import { TextResourceContents, Resource } from '@modelcontextprotocol/sdk/types.js';
import { helpScoutDocsClient, DocsPaginatedResponse } from '../utils/helpscout-docs-client.js';
import { DocsSite, DocsCollection, DocsCategory, DocsArticle } from '../schema/types.js';
import { logger } from '../utils/logger.js';

export class DocsResourceHandler {
  async handleDocsResource(uri: string): Promise<TextResourceContents> {
    const url = new URL(uri);
    const protocol = url.protocol.slice(0, -1); // Remove trailing colon
    
    if (protocol !== 'helpscout-docs') {
      throw new Error(`Unsupported protocol: ${protocol}`);
    }

    const path = url.hostname; // For custom protocols like helpscout-docs://, the resource name is in hostname
    const searchParams = Object.fromEntries(url.searchParams.entries());

    logger.info('Handling Docs resource request', { uri, path, params: searchParams });

    switch (path) {
      case 'sites':
        return this.getSitesResource(searchParams);
      case 'collections':
        return this.getCollectionsResource(searchParams);
      case 'categories':
        return this.getCategoriesResource(searchParams);
      case 'articles':
        return this.getArticlesResource(searchParams);
      default:
        throw new Error(`Unknown Docs resource path: ${path}`);
    }
  }

  private async getSitesResource(params: Record<string, string>): Promise<TextResourceContents> {
    try {
      const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsSite>>('/sites', {
        page: parseInt(params.page || '1', 10),
      });

      return {
        uri: 'helpscout-docs://sites',
        mimeType: 'application/json',
        text: JSON.stringify({
          sites: response.items,
          pagination: {
            page: response.page,
            pages: response.pages,
            count: response.count,
          },
        }),
      };
    } catch (error) {
      logger.error('Failed to fetch Docs sites', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private async getCollectionsResource(params: Record<string, string>): Promise<TextResourceContents> {
    try {
      const queryParams: Record<string, unknown> = {
        page: parseInt(params.page || '1', 10),
      };

      if (params.siteId) queryParams.siteId = params.siteId;
      if (params.visibility) queryParams.visibility = params.visibility;
      if (params.sort) queryParams.sort = params.sort;
      if (params.order) queryParams.order = params.order;

      const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsCollection>>('/collections', queryParams);

      return {
        uri: 'helpscout-docs://collections',
        mimeType: 'application/json',
        text: JSON.stringify({
          collections: response.items,
          pagination: {
            page: response.page,
            pages: response.pages,
            count: response.count,
          },
        }),
      };
    } catch (error) {
      logger.error('Failed to fetch Docs collections', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private async getCategoriesResource(params: Record<string, string>): Promise<TextResourceContents> {
    const collectionId = params.collectionId;
    if (!collectionId) {
      throw new Error('collectionId parameter is required for categories resource');
    }

    try {
      const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsCategory>>(
        `/collections/${collectionId}/categories`,
        {
          page: parseInt(params.page || '1', 10),
        }
      );

      return {
        uri: `helpscout-docs://categories?collectionId=${collectionId}`,
        mimeType: 'application/json',
        text: JSON.stringify({
          collectionId,
          categories: response.items,
          pagination: {
            page: response.page,
            pages: response.pages,
            count: response.count,
          },
        }),
      };
    } catch (error) {
      logger.error('Failed to fetch Docs categories', { 
        collectionId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  private async getArticlesResource(params: Record<string, string>): Promise<TextResourceContents> {
    const articleId = params.articleId;
    
    if (articleId) {
      // Get specific article
      try {
        const article = await helpScoutDocsClient.get<DocsArticle>(`/articles/${articleId}`);
        
        return {
          uri: `helpscout-docs://articles?articleId=${articleId}`,
          mimeType: 'application/json',
          text: JSON.stringify(article),
        };
      } catch (error) {
        logger.error('Failed to fetch Docs article', { 
          articleId, 
          error: error instanceof Error ? error.message : String(error) 
        });
        throw error;
      }
    } else if (params.collectionId || params.categoryId) {
      // List articles
      const endpoint = params.collectionId 
        ? `/collections/${params.collectionId}/articles`
        : `/categories/${params.categoryId}/articles`;
      
      try {
        const queryParams: Record<string, unknown> = {
          page: parseInt(params.page || '1', 10),
          pageSize: parseInt(params.pageSize || '50', 10),
        };

        if (params.status) queryParams.status = params.status;
        if (params.sort) queryParams.sort = params.sort;
        if (params.order) queryParams.order = params.order;

        const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsArticle>>(endpoint, queryParams);

        return {
          uri: `helpscout-docs://articles?${params.collectionId ? 'collectionId=' + params.collectionId : 'categoryId=' + params.categoryId}`,
          mimeType: 'application/json',
          text: JSON.stringify({
            articles: response.items,
            pagination: {
              page: response.page,
              pages: response.pages,
              count: response.count,
            },
          }),
        };
      } catch (error) {
        logger.error('Failed to fetch Docs articles', { 
          params, 
          error: error instanceof Error ? error.message : String(error) 
        });
        throw error;
      }
    } else {
      throw new Error('Either articleId, collectionId, or categoryId is required for articles resource');
    }
  }

  async listDocsResources(): Promise<Resource[]> {
    return [
      {
        uri: 'helpscout-docs://sites',
        name: 'Help Scout Docs Sites',
        description: 'All documentation sites accessible to your API key',
        mimeType: 'application/json',
      },
      {
        uri: 'helpscout-docs://collections',
        name: 'Help Scout Docs Collections',
        description: 'Documentation collections (use query parameters to filter by site)',
        mimeType: 'application/json',
      },
      {
        uri: 'helpscout-docs://categories',
        name: 'Help Scout Docs Categories',
        description: 'Categories within a collection (requires collectionId parameter)',
        mimeType: 'application/json',
      },
      {
        uri: 'helpscout-docs://articles',
        name: 'Help Scout Docs Articles',
        description: 'Articles (requires articleId for single article, or collectionId/categoryId for list)',
        mimeType: 'application/json',
      },
    ];
  }
}

export const docsResourceHandler = new DocsResourceHandler();