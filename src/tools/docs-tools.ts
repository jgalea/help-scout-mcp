import { Tool, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DocsPaginatedResponse } from '../utils/helpscout-docs-client.js';
import { createMcpToolError } from '../utils/mcp-errors.js';
import { Injectable, ServiceContainer } from '../utils/service-container.js';
import { z } from 'zod';
import {
  DocsSite,
  DocsCollection,
  DocsCategory,
  DocsArticleRef,
  DocsArticle,
  ListDocsCategoriesInputSchema,
  ListDocsArticlesInputSchema,
  GetDocsArticleInputSchema,
  UpdateDocsArticleInputSchema,
  UpdateDocsCollectionInputSchema,
  UpdateDocsCategoryInputSchema,
} from '../schema/types.js';

/**
 * Constants for Docs tool operations
 */
const DOCS_TOOL_CONSTANTS = {
  // API pagination defaults
  DEFAULT_PAGE_SIZE: 100,  // Use max page size by default for better performance
  MAX_PAGE_SIZE: 100,
  
  // Cache configuration
  DEFAULT_CACHE_TTL: 600, // 10 minutes for docs content
  
  // Sort defaults
  DEFAULT_COLLECTION_SORT: 'order',
  DEFAULT_CATEGORY_SORT: 'order',
  DEFAULT_ARTICLE_SORT: 'createdAt',
} as const;

export class DocsToolHandler extends Injectable {
  constructor(container?: ServiceContainer) {
    super(container);
  }

  /**
   * List all Docs-related tools
   */
  async listDocsTools(): Promise<Tool[]> {
    return [
      {
        name: 'listDocsSites',
        description: 'List all Help Scout Docs sites or search for a specific site. Supports natural language queries like "find GravityKit site"',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query to search for specific sites (e.g. "GravityKit", "TrustedLogin")',
            },
            page: {
              type: 'number',
              description: 'Page number to retrieve',
              minimum: 1,
              default: 1,
            },
          },
        },
      },
      {
        name: 'listDocsCollections',
        description: 'List collections in Help Scout Docs. Supports natural language queries like "GravityKit collections"',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query to identify the site (e.g. "GravityKit", "TrustedLogin site")',
            },
            siteId: {
              type: 'string',
              description: 'Specific site ID (overrides query)',
            },
            visibility: {
              type: 'string',
              enum: ['all', 'public', 'private'],
              description: 'Filter by visibility',
              default: 'all',
            },
            sort: {
              type: 'string',
              enum: ['number', 'visibility', 'order', 'name', 'createdAt', 'updatedAt'],
              default: DOCS_TOOL_CONSTANTS.DEFAULT_COLLECTION_SORT,
              description: 'Sort field',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'asc',
              description: 'Sort order',
            },
            page: {
              type: 'number',
              description: 'Page number to retrieve',
              minimum: 1,
              default: 1,
            },
            pageSize: {
              type: 'number',
              description: `Number of collections per page (max ${DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE})`,
              minimum: 1,
              maximum: DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE,
              default: DOCS_TOOL_CONSTANTS.DEFAULT_PAGE_SIZE,
            },
          },
        },
      },
      {
        name: 'listDocsCategories',
        description: 'List categories within a specific collection',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: {
              type: 'string',
              description: 'The collection ID to list categories for',
            },
            sort: {
              type: 'string',
              enum: ['number', 'order', 'name', 'articleCount', 'createdAt', 'updatedAt'],
              default: DOCS_TOOL_CONSTANTS.DEFAULT_CATEGORY_SORT,
              description: 'Sort field',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'asc',
              description: 'Sort order',
            },
            page: {
              type: 'number',
              description: 'Page number to retrieve',
              minimum: 1,
              default: 1,
            },
          },
          required: ['collectionId'],
        },
      },
      {
        name: 'listDocsArticlesByCollection',
        description: 'List articles within a specific collection',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: {
              type: 'string',
              description: 'The collection ID to list articles for',
            },
            status: {
              type: 'string',
              enum: ['all', 'published', 'notpublished'],
              description: 'Filter by article status',
              default: 'all',
            },
            sort: {
              type: 'string',
              enum: ['number', 'status', 'name', 'popularity', 'createdAt', 'updatedAt'],
              default: DOCS_TOOL_CONSTANTS.DEFAULT_ARTICLE_SORT,
              description: 'Sort field',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
              description: 'Sort order',
            },
            page: {
              type: 'number',
              description: 'Page number to retrieve',
              minimum: 1,
              default: 1,
            },
            pageSize: {
              type: 'number',
              description: `Number of articles per page (max ${DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE})`,
              minimum: 1,
              maximum: DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE,
              default: DOCS_TOOL_CONSTANTS.DEFAULT_PAGE_SIZE,
            },
          },
          required: ['collectionId'],
        },
      },
      {
        name: 'listDocsArticlesByCategory',
        description: 'List articles within a specific category',
        inputSchema: {
          type: 'object',
          properties: {
            categoryId: {
              type: 'string',
              description: 'The category ID to list articles for',
            },
            status: {
              type: 'string',
              enum: ['all', 'published', 'notpublished'],
              description: 'Filter by article status',
              default: 'all',
            },
            sort: {
              type: 'string',
              enum: ['number', 'status', 'name', 'popularity', 'createdAt', 'updatedAt'],
              default: DOCS_TOOL_CONSTANTS.DEFAULT_ARTICLE_SORT,
              description: 'Sort field',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
              description: 'Sort order',
            },
            page: {
              type: 'number',
              description: 'Page number to retrieve',
              minimum: 1,
              default: 1,
            },
            pageSize: {
              type: 'number',
              description: `Number of articles per page (max ${DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE})`,
              minimum: 1,
              maximum: DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE,
              default: DOCS_TOOL_CONSTANTS.DEFAULT_PAGE_SIZE,
            },
          },
          required: ['categoryId'],
        },
      },
      {
        name: 'getDocsArticle',
        description: 'Get full article content including text, categories, and related articles',
        inputSchema: {
          type: 'object',
          properties: {
            articleId: {
              type: 'string',
              description: 'The article ID to retrieve',
            },
            draft: {
              type: 'boolean',
              description: 'Retrieve draft version if available',
              default: false,
            },
          },
          required: ['articleId'],
        },
      },
      {
        name: 'updateDocsArticle',
        description: 'Update an existing article (name, text, status, categories, or related articles)',
        inputSchema: {
          type: 'object',
          properties: {
            articleId: {
              type: 'string',
              description: 'The article ID to update',
            },
            name: {
              type: 'string',
              description: 'New article title/name',
            },
            text: {
              type: 'string',
              description: 'New article content (HTML)',
            },
            status: {
              type: 'string',
              description: 'New article status',
            },
            categories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of category IDs for the article',
            },
            related: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of related article IDs',
            },
          },
          required: ['articleId'],
        },
      },
      {
        name: 'updateDocsCollection',
        description: 'Update collection properties (name, description, visibility, order)',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: {
              type: 'string',
              description: 'The collection ID to update',
            },
            name: {
              type: 'string',
              description: 'New collection name',
            },
            description: {
              type: 'string',
              description: 'New collection description',
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private'],
              description: 'Collection visibility',
            },
            order: {
              type: 'number',
              description: 'Display order (lower numbers appear first)',
            },
          },
          required: ['collectionId'],
        },
      },
      {
        name: 'updateDocsCategory',
        description: 'Update category properties (name, description, visibility, order)',
        inputSchema: {
          type: 'object',
          properties: {
            categoryId: {
              type: 'string',
              description: 'The category ID to update',
            },
            name: {
              type: 'string',
              description: 'New category name',
            },
            description: {
              type: 'string',
              description: 'New category description',
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private'],
              description: 'Category visibility',
            },
            order: {
              type: 'number',
              description: 'Display order (lower numbers appear first)',
            },
          },
          required: ['categoryId'],
        },
      },
      {
        name: 'getTopDocsArticles',
        description: 'Get the most popular Help Scout Docs articles sorted by views/popularity. Supports natural language queries like "top GravityKit articles"',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query to identify the collection (e.g. "GravityKit docs", "TrustedLogin articles")',
            },
            collectionId: {
              type: 'string',
              description: 'Optional: Specific collection ID (overrides query)',
            },
            limit: {
              type: 'number',
              description: 'Number of top articles to return (default: 100)',
              minimum: 1,
              maximum: 200,
              default: 100,
            },
            status: {
              type: 'string',
              enum: ['all', 'published', 'notpublished'],
              description: 'Filter by article status',
              default: 'published',
            },
          },
        },
      },
      {
        name: 'testDocsConnection',
        description: 'Test the Help Scout Docs API connection and authentication',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'clearDocsCache',
        description: 'Clear the Docs API cache to force fresh data retrieval',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'listAllDocsCollections',
        description: 'List all available Docs collections across all sites with their names for easy reference',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'getSiteCollections',
        description: 'Get collections for a specific site using natural language. Supports queries like "GravityKit collections"',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query to identify the site (e.g. "GravityKit", "TrustedLogin site")',
            },
            siteId: {
              type: 'string',
              description: 'Optional: Specific site ID (overrides query)',
            },
          },
        },
      },
      {
        name: 'searchDocsArticles',
        description: 'Search for articles across all Help Scout Docs sites using keywords',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query/keywords to find articles',
            },
            collectionId: {
              type: 'string',
              description: 'Optional: Limit search to specific collection',
            },
            categoryId: {
              type: 'string',
              description: 'Optional: Limit search to specific category',
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private', 'all'],
              description: 'Filter by visibility',
              default: 'all',
            },
            status: {
              type: 'string',
              enum: ['all', 'published', 'notpublished'],
              description: 'Filter by status',
              default: 'published',
            },
            page: {
              type: 'number',
              description: 'Page number to retrieve',
              minimum: 1,
              default: 1,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'createDocsArticle',
        description: 'Create a new Help Scout Docs article',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: {
              type: 'string',
              description: 'Collection ID where the article will be created',
            },
            name: {
              type: 'string',
              description: 'Article title',
            },
            text: {
              type: 'string',
              description: 'Article content (HTML)',
            },
            categoryIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Category IDs to assign the article to',
            },
            status: {
              type: 'string',
              enum: ['published', 'notpublished'],
              description: 'Publication status',
              default: 'notpublished',
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private'],
              description: 'Article visibility',
              default: 'public',
            },
            slug: {
              type: 'string',
              description: 'URL slug for the article',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for the article',
            },
          },
          required: ['collectionId', 'name', 'text'],
        },
      },
      {
        name: 'deleteDocsArticle',
        description: 'Delete a Help Scout Docs article',
        inputSchema: {
          type: 'object',
          properties: {
            articleId: {
              type: 'string',
              description: 'ID of the article to delete',
            },
          },
          required: ['articleId'],
        },
      },
      {
        name: 'updateDocsViewCount',
        description: 'Update the view count for a Help Scout Docs article',
        inputSchema: {
          type: 'object',
          properties: {
            articleId: {
              type: 'string',
              description: 'ID of the article to update view count',
            },
            count: {
              type: 'number',
              description: 'Number of views to add (default: 1)',
              minimum: 1,
              default: 1,
            },
          },
          required: ['articleId'],
        },
      },
      {
        name: 'listRelatedDocsArticles',
        description: 'Get articles related to a specific article',
        inputSchema: {
          type: 'object',
          properties: {
            articleId: {
              type: 'string',
              description: 'ID of the article to find related articles for',
            },
            status: {
              type: 'string',
              enum: ['all', 'published', 'notpublished'],
              description: 'Filter by status',
              default: 'published',
            },
            sort: {
              type: 'string',
              enum: ['updatedAt', 'createdAt', 'name', 'popularity', 'order'],
              description: 'Sort field',
              default: 'popularity',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order',
              default: 'desc',
            },
          },
          required: ['articleId'],
        },
      },
      {
        name: 'createDocsCategory',
        description: 'Create a new category in a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: {
              type: 'string',
              description: 'Collection ID where the category will be created',
            },
            name: {
              type: 'string',
              description: 'Category name',
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private'],
              description: 'Category visibility',
              default: 'public',
            },
            order: {
              type: 'number',
              description: 'Display order for the category',
            },
          },
          required: ['collectionId', 'name'],
        },
      },
      {
        name: 'deleteDocsCategory',
        description: 'Delete a category from a collection',
        inputSchema: {
          type: 'object',
          properties: {
            categoryId: {
              type: 'string',
              description: 'ID of the category to delete',
            },
          },
          required: ['categoryId'],
        },
      },
      {
        name: 'createDocsCollection',
        description: 'Create a new collection in a site',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: {
              type: 'string',
              description: 'Site ID where the collection will be created',
            },
            name: {
              type: 'string',
              description: 'Collection name',
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private'],
              description: 'Collection visibility',
              default: 'public',
            },
            order: {
              type: 'number',
              description: 'Display order for the collection',
            },
          },
          required: ['siteId', 'name'],
        },
      },
      {
        name: 'deleteDocsCollection',
        description: 'Delete a collection from a site',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: {
              type: 'string',
              description: 'ID of the collection to delete',
            },
          },
          required: ['collectionId'],
        },
      },
      // Article Revisions
      {
        name: 'listDocsArticleRevisions',
        description: 'List all revisions for a specific article with metadata about changes',
        inputSchema: {
          type: 'object',
          properties: {
            articleId: { type: 'string', description: 'The article ID to get revisions for' },
            page: { type: 'number', default: 1, description: 'Page number for pagination' },
          },
          required: ['articleId'],
        },
      },
      {
        name: 'getDocsArticleRevision',
        description: 'Get a specific revision of an article by revision ID',
        inputSchema: {
          type: 'object',
          properties: {
            revisionId: { type: 'string', description: 'The revision ID to retrieve' },
            draft: { type: 'boolean', default: false, description: 'If true, get the latest draft version' },
          },
          required: ['revisionId'],
        },
      },
      // Article Drafts
      {
        name: 'saveDocsArticleDraft',
        description: 'Save a draft version of an article',
        inputSchema: {
          type: 'object',
          properties: {
            articleId: { type: 'string', description: 'The article ID to save draft for' },
            text: { type: 'string', description: 'The draft article content (HTML)' },
            name: { type: 'string', description: 'The draft article title' },
          },
          required: ['articleId', 'text'],
        },
      },
      {
        name: 'deleteDocsArticleDraft',
        description: 'Delete a draft version of an article',
        inputSchema: {
          type: 'object',
          properties: {
            draftId: { type: 'string', description: 'The draft ID to delete' },
          },
          required: ['draftId'],
        },
      },
      // Article Upload
      {
        name: 'uploadDocsArticle',
        description: 'Upload an article from a file (HTML or Markdown)',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: { type: 'string', description: 'Collection ID where article will be created' },
            filePath: { type: 'string', description: 'Path to the file to upload' },
            name: { type: 'string', description: 'Article title' },
            categoryIds: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Category IDs to assign to the article' 
            },
            status: { 
              type: 'string', 
              enum: ['published', 'notpublished'],
              default: 'notpublished',
              description: 'Article status' 
            },
          },
          required: ['collectionId', 'filePath', 'name'],
        },
      },
      // Assets
      {
        name: 'createDocsArticleAsset',
        description: 'Upload an asset (image, file) for use in articles',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: { type: 'string', description: 'Collection ID for the asset' },
            filePath: { type: 'string', description: 'Path to the file to upload' },
            fileName: { type: 'string', description: 'Name for the uploaded file' },
          },
          required: ['collectionId', 'filePath'],
        },
      },
      {
        name: 'createDocsSettingsAsset',
        description: 'Upload an asset for site settings (logo, favicon)',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'Site ID for the asset' },
            filePath: { type: 'string', description: 'Path to the file to upload' },
            assetType: { 
              type: 'string', 
              enum: ['logo', 'favicon', 'other'],
              description: 'Type of settings asset' 
            },
          },
          required: ['siteId', 'filePath', 'assetType'],
        },
      },
      // Single Resource Getters
      {
        name: 'getDocsCategory',
        description: 'Get a single category by ID',
        inputSchema: {
          type: 'object',
          properties: {
            categoryId: { type: 'string', description: 'The category ID to retrieve' },
          },
          required: ['categoryId'],
        },
      },
      {
        name: 'getDocsCollection',
        description: 'Get a single collection by ID',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: { type: 'string', description: 'The collection ID to retrieve' },
          },
          required: ['collectionId'],
        },
      },
      {
        name: 'getDocsSite',
        description: 'Get a single site by ID',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'The site ID to retrieve' },
          },
          required: ['siteId'],
        },
      },
      // Category Order
      {
        name: 'updateDocsCategoryOrder',
        description: 'Update the display order of categories within a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collectionId: { type: 'string', description: 'Collection ID containing the categories' },
            categoryIds: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Array of category IDs in desired order' 
            },
          },
          required: ['collectionId', 'categoryIds'],
        },
      },
      // Redirects
      {
        name: 'listDocsRedirects',
        description: 'List all redirects for a site',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'Site ID to list redirects for' },
            page: { type: 'number', default: 1, description: 'Page number for pagination' },
          },
          required: ['siteId'],
        },
      },
      {
        name: 'getDocsRedirect',
        description: 'Get a single redirect by ID',
        inputSchema: {
          type: 'object',
          properties: {
            redirectId: { type: 'string', description: 'The redirect ID to retrieve' },
          },
          required: ['redirectId'],
        },
      },
      {
        name: 'findDocsRedirect',
        description: 'Find a redirect by URL',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'Site ID to search in' },
            url: { type: 'string', description: 'URL to find redirect for' },
          },
          required: ['siteId', 'url'],
        },
      },
      {
        name: 'createDocsRedirect',
        description: 'Create a new redirect',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'Site ID for the redirect' },
            urlMapping: { type: 'string', description: 'Source URL pattern' },
            redirect: { type: 'string', description: 'Target URL' },
            type: { 
              type: 'number', 
              enum: [301, 302],
              default: 301,
              description: 'HTTP redirect code' 
            },
          },
          required: ['siteId', 'urlMapping', 'redirect'],
        },
      },
      {
        name: 'updateDocsRedirect',
        description: 'Update an existing redirect',
        inputSchema: {
          type: 'object',
          properties: {
            redirectId: { type: 'string', description: 'The redirect ID to update' },
            urlMapping: { type: 'string', description: 'Source URL pattern' },
            redirect: { type: 'string', description: 'Target URL' },
            type: { 
              type: 'number', 
              enum: [301, 302],
              description: 'HTTP redirect code' 
            },
          },
          required: ['redirectId'],
        },
      },
      {
        name: 'deleteDocsRedirect',
        description: 'Delete a redirect',
        inputSchema: {
          type: 'object',
          properties: {
            redirectId: { type: 'string', description: 'The redirect ID to delete' },
          },
          required: ['redirectId'],
        },
      },
      // Site Management
      {
        name: 'createDocsSite',
        description: 'Create a new Docs site',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Site name' },
            subdomain: { type: 'string', description: 'Site subdomain' },
            cname: { type: 'string', description: 'Custom domain (optional)' },
            logoUrl: { type: 'string', description: 'URL to site logo' },
          },
          required: ['name', 'subdomain'],
        },
      },
      {
        name: 'updateDocsSite',
        description: 'Update an existing Docs site',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'The site ID to update' },
            name: { type: 'string', description: 'Site name' },
            subdomain: { type: 'string', description: 'Site subdomain' },
            cname: { type: 'string', description: 'Custom domain' },
            logoUrl: { type: 'string', description: 'URL to site logo' },
          },
          required: ['siteId'],
        },
      },
      {
        name: 'deleteDocsSite',
        description: 'Delete a Docs site',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'The site ID to delete' },
          },
          required: ['siteId'],
        },
      },
      // Site Restrictions
      {
        name: 'getDocsSiteRestrictions',
        description: 'Get access restrictions for a Docs site',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'The site ID to get restrictions for' },
          },
          required: ['siteId'],
        },
      },
      {
        name: 'updateDocsSiteRestrictions',
        description: 'Update access restrictions for a Docs site',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'The site ID to update restrictions for' },
            restricted: { type: 'boolean', description: 'Whether the site requires authentication' },
            allowedDomains: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Email domains allowed access' 
            },
            ssoEnabled: { type: 'boolean', description: 'Enable SSO for the site' },
          },
          required: ['siteId'],
        },
      },
    ];
  }

  /**
   * Call a Docs tool
   */
  async callDocsTool(request: CallToolRequest): Promise<CallToolResult> {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    const { logger } = this.services.resolve(['logger']);
    
    logger.info('Docs tool call started', {
      requestId,
      toolName: request.params.name,
      arguments: request.params.arguments,
    });

    try {
      let result: CallToolResult;

      switch (request.params.name) {
        case 'listDocsSites':
          result = await this.listDocsSites(request.params.arguments || {});
          break;
        case 'listDocsCollections':
          result = await this.listDocsCollections(request.params.arguments || {});
          break;
        case 'listDocsCategories':
          result = await this.listDocsCategories(request.params.arguments || {});
          break;
        case 'listDocsArticlesByCollection':
          result = await this.listDocsArticlesByCollection(request.params.arguments || {});
          break;
        case 'listDocsArticlesByCategory':
          result = await this.listDocsArticlesByCategory(request.params.arguments || {});
          break;
        case 'getDocsArticle':
          result = await this.getDocsArticle(request.params.arguments || {});
          break;
        case 'updateDocsArticle':
          result = await this.updateDocsArticle(request.params.arguments || {});
          break;
        case 'updateDocsCollection':
          result = await this.updateDocsCollection(request.params.arguments || {});
          break;
        case 'updateDocsCategory':
          result = await this.updateDocsCategory(request.params.arguments || {});
          break;
        case 'getTopDocsArticles':
          result = await this.getTopDocsArticles(request.params.arguments || {});
          break;
        case 'testDocsConnection':
          result = await this.testDocsConnection();
          break;
        case 'clearDocsCache':
          result = await this.clearDocsCache();
          break;
        case 'listAllDocsCollections':
          result = await this.listAllDocsCollections();
          break;
        case 'getSiteCollections':
          result = await this.getSiteCollections(request.params.arguments || {});
          break;
        case 'searchDocsArticles':
          result = await this.searchDocsArticles(request.params.arguments || {});
          break;
        case 'createDocsArticle':
          result = await this.createDocsArticle(request.params.arguments || {});
          break;
        case 'deleteDocsArticle':
          result = await this.deleteDocsArticle(request.params.arguments || {});
          break;
        case 'updateDocsViewCount':
          result = await this.updateDocsViewCount(request.params.arguments || {});
          break;
        case 'listRelatedDocsArticles':
          result = await this.listRelatedDocsArticles(request.params.arguments || {});
          break;
        case 'createDocsCategory':
          result = await this.createDocsCategory(request.params.arguments || {});
          break;
        case 'deleteDocsCategory':
          result = await this.deleteDocsCategory(request.params.arguments || {});
          break;
        case 'createDocsCollection':
          result = await this.createDocsCollection(request.params.arguments || {});
          break;
        case 'deleteDocsCollection':
          result = await this.deleteDocsCollection(request.params.arguments || {});
          break;
        // Article Revisions
        case 'listDocsArticleRevisions':
          result = await this.listDocsArticleRevisions(request.params.arguments || {});
          break;
        case 'getDocsArticleRevision':
          result = await this.getDocsArticleRevision(request.params.arguments || {});
          break;
        // Article Drafts
        case 'saveDocsArticleDraft':
          result = await this.saveDocsArticleDraft(request.params.arguments || {});
          break;
        case 'deleteDocsArticleDraft':
          result = await this.deleteDocsArticleDraft(request.params.arguments || {});
          break;
        // Article Upload
        case 'uploadDocsArticle':
          result = await this.uploadDocsArticle(request.params.arguments || {});
          break;
        // Assets
        case 'createDocsArticleAsset':
          result = await this.createDocsArticleAsset(request.params.arguments || {});
          break;
        case 'createDocsSettingsAsset':
          result = await this.createDocsSettingsAsset(request.params.arguments || {});
          break;
        // Single Resource Getters
        case 'getDocsCategory':
          result = await this.getDocsCategory(request.params.arguments || {});
          break;
        case 'getDocsCollection':
          result = await this.getDocsCollection(request.params.arguments || {});
          break;
        case 'getDocsSite':
          result = await this.getDocsSite(request.params.arguments || {});
          break;
        // Category Order
        case 'updateDocsCategoryOrder':
          result = await this.updateDocsCategoryOrder(request.params.arguments || {});
          break;
        // Redirects
        case 'listDocsRedirects':
          result = await this.listDocsRedirects(request.params.arguments || {});
          break;
        case 'getDocsRedirect':
          result = await this.getDocsRedirect(request.params.arguments || {});
          break;
        case 'findDocsRedirect':
          result = await this.findDocsRedirect(request.params.arguments || {});
          break;
        case 'createDocsRedirect':
          result = await this.createDocsRedirect(request.params.arguments || {});
          break;
        case 'updateDocsRedirect':
          result = await this.updateDocsRedirect(request.params.arguments || {});
          break;
        case 'deleteDocsRedirect':
          result = await this.deleteDocsRedirect(request.params.arguments || {});
          break;
        // Site Management
        case 'createDocsSite':
          result = await this.createDocsSite(request.params.arguments || {});
          break;
        case 'updateDocsSite':
          result = await this.updateDocsSite(request.params.arguments || {});
          break;
        case 'deleteDocsSite':
          result = await this.deleteDocsSite(request.params.arguments || {});
          break;
        // Site Restrictions
        case 'getDocsSiteRestrictions':
          result = await this.getDocsSiteRestrictions(request.params.arguments || {});
          break;
        case 'updateDocsSiteRestrictions':
          result = await this.updateDocsSiteRestrictions(request.params.arguments || {});
          break;
        default:
          throw new Error(`Unknown Docs tool: ${request.params.name}`);
      }

      const duration = Date.now() - startTime;
      
      logger.info('Docs tool call completed', {
        requestId,
        toolName: request.params.name,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return createMcpToolError(error, {
        toolName: request.params.name,
        requestId,
        duration,
      });
    }
  }

  private async listDocsSites(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      query: z.string().optional(),
      page: z.number().default(1),
    }).parse(args);
    
    const { helpScoutDocsClient, logger } = this.services.resolve(['helpScoutDocsClient', 'logger']);
    
    const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsSite>>('/sites', {
      page: input.page,
    });
    
    // Log the response structure
    logger.info('listDocsSites response structure', {
      hasItems: !!response.items,
      itemsLength: response.items?.length || 0,
      responseKeys: Object.keys(response),
      page: response.page,
      pages: response.pages,
      count: response.count
    });
    
    // If there's a query, filter the results
    let filteredSites = response.items || [];
    const scoredSites: Array<{ site: DocsSite; score: number; reason: string }> = [];
    
    if (input.query && filteredSites.length > 0) {
      // Score each site against the query
      
      for (const site of filteredSites) {
        // Temporarily set the sites in resolver to just this one to get its score
        const tempResolver = new (await import('../utils/site-resolver.js')).SiteResolver();
        // @ts-ignore - accessing private property for scoring
        tempResolver.sites = [site];
        
        const match = await tempResolver.resolveSite(input.query, undefined);
        if (match && match.matchScore > 0) {
          scoredSites.push({
            site,
            score: match.matchScore,
            reason: match.matchReason
          });
        }
      }
      
      // Sort by score and filter to only matched sites
      scoredSites.sort((a, b) => b.score - a.score);
      filteredSites = scoredSites.map(s => s.site);
    }

    // Check if the response has any items
    if (!filteredSites || filteredSites.length === 0) {
      logger.warn('No Docs sites found. This could indicate:', {
        reasons: [
          '1. The API key lacks Docs permissions',
          '2. No Docs sites are configured in the Help Scout account',
          '3. The account does not have Help Scout Docs enabled'
        ]
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sites: [],
              pagination: response.page ? {
                page: response.page,
                pages: response.pages || 0,
                count: response.count || 0,
              } : {},
              warning: 'No Help Scout Docs sites found. Please verify:',
              troubleshooting: [
                '1. Your API key has Docs permissions (check at https://secure.helpscout.net/authentication/api)',
                '2. Help Scout Docs is enabled for your account',
                '3. At least one Docs site exists in your account',
                '4. The HELPSCOUT_DOCS_API_KEY environment variable is set correctly'
              ],
              usage: 'Once sites are available, use the "id" field from these sites when filtering collections',
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            sites: filteredSites,
            ...(input.query && { 
              matchInfo: scoredSites.map(s => ({
                site: s.site.name || s.site.subdomain || s.site.id,
                score: s.score,
                reason: s.reason
              }))
            }),
            pagination: {
              page: response.page,
              pages: response.pages,
              count: response.count,
            },
            usage: 'Use the "id" field from these sites when filtering collections',
          }, null, 2),
        },
      ],
    };
  }

  private async listDocsCollections(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      query: z.string().optional(),
      siteId: z.string().optional(),
      visibility: z.enum(['all', 'public', 'private']).default('all'),
      sort: z.string().default(DOCS_TOOL_CONSTANTS.DEFAULT_COLLECTION_SORT),
      order: z.enum(['asc', 'desc']).default('asc'),
      page: z.number().default(1),
      pageSize: z.number().min(1).max(DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE).default(DOCS_TOOL_CONSTANTS.DEFAULT_PAGE_SIZE),
    }).parse(args);
    
    const { helpScoutDocsClient, config, logger } = this.services.resolve(['helpScoutDocsClient', 'config', 'logger']);
    
    // Import site resolver
    const { siteResolver } = await import('../utils/site-resolver.js');
    
    // Determine which site to use
    let targetSiteId = input.siteId;
    let siteName: string | undefined;
    
    // If no specific site ID provided, try to resolve from query or use default
    if (!targetSiteId && (input.query || config.helpscout.defaultDocsSiteId)) {
      const match = await siteResolver.resolveSite(
        input.query || '',
        config.helpscout.defaultDocsSiteId
      );
      
      if (match) {
        targetSiteId = match.site.id;
        siteName = match.site.name || match.site.subdomain;
        
        logger.info('Resolved site from query', {
          query: input.query,
          site: siteName,
          matchReason: match.matchReason
        });
      }
    }
    
    const params: Record<string, unknown> = {
      page: input.page,
      pageSize: input.pageSize,
      sort: input.sort,
      order: input.order,
    };

    if (targetSiteId) {
      params.siteId = targetSiteId;
    }

    if (input.visibility !== 'all') {
      params.visibility = input.visibility;
    }

    try {
      logger.info('Fetching Docs collections', { params });
      const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsCollection>>('/collections', params);
      
      logger.debug('Collections response', { 
        hasItems: !!response.items,
        itemCount: response.items?.length || 0,
        responseKeys: Object.keys(response)
      });

      // Check if we have collections
      if (!response.items || response.items.length === 0) {
        // If no siteId was provided, suggest getting sites first
        if (!input.siteId) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  collections: [],
                  pagination: response.page ? {
                    page: response.page,
                    pages: response.pages || 0,
                    count: response.count || 0,
                  } : {},
                  warning: 'No collections found. Try specifying a siteId parameter.',
                  suggestion: 'First use listDocsSites to get available site IDs, then pass a siteId to this tool',
                }, null, 2),
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                collections: [],
                site: {
                  id: targetSiteId,
                  name: siteName,
                },
                query: input.query,
                pagination: response.page ? {
                  page: response.page,
                  pages: response.pages || 0,
                  count: response.count || 0,
                } : {},
                warning: 'No collections found for this site.',
                troubleshooting: [
                  '1. Verify the site is correct',
                  '2. Check if collections exist for this site in Help Scout',
                  '3. Ensure your API key has access to this site\'s collections'
                ],
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              collections: response.items,
              site: targetSiteId ? {
                id: targetSiteId,
                name: siteName,
              } : undefined,
              query: input.query,
              pagination: {
                page: response.page,
                pages: response.pages,
                count: response.count,
              },
              usage: 'Use the "id" field to access categories and articles within these collections',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Failed to get collections', { error, params });
      throw error;
    }
  }

  private async listDocsCategories(args: unknown): Promise<CallToolResult> {
    const input = ListDocsCategoriesInputSchema.parse(args);
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsCategory>>(
      `/collections/${input.collectionId}/categories`,
      {
        page: input.page,
        sort: input.sort,
        order: input.order,
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            categories: response.items,
            collectionId: input.collectionId,
            pagination: {
              page: response.page,
              pages: response.pages,
              count: response.count,
            },
            usage: 'Use the "id" field to list articles within these categories',
          }, null, 2),
        },
      ],
    };
  }

  private async listDocsArticlesByCollection(args: unknown): Promise<CallToolResult> {
    const input = ListDocsArticlesInputSchema.parse(args);
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    const params: Record<string, unknown> = {
      page: input.page,
      pageSize: input.pageSize,
      sort: input.sort,
      order: input.order,
    };

    if (input.status !== 'all') {
      params.status = input.status;
    }

    const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsArticleRef>>(
      `/collections/${input.collectionId}/articles`,
      params
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            articles: response.items,
            collectionId: input.collectionId,
            pagination: {
              page: response.page,
              pages: response.pages,
              count: response.count,
            },
            usage: 'Use getDocsArticle with the "id" field to retrieve full article content',
          }, null, 2),
        },
      ],
    };
  }

  private async listDocsArticlesByCategory(args: unknown): Promise<CallToolResult> {
    const input = ListDocsArticlesInputSchema.parse(args);
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    const params: Record<string, unknown> = {
      page: input.page,
      pageSize: input.pageSize,
      sort: input.sort,
      order: input.order,
    };

    if (input.status !== 'all') {
      params.status = input.status;
    }

    const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsArticleRef>>(
      `/categories/${input.categoryId}/articles`,
      params
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            articles: response.items,
            categoryId: input.categoryId,
            pagination: {
              page: response.page,
              pages: response.pages,
              count: response.count,
            },
            usage: 'Use getDocsArticle with the "id" field to retrieve full article content',
          }, null, 2),
        },
      ],
    };
  }

  private async getDocsArticle(args: unknown): Promise<CallToolResult> {
    const input = GetDocsArticleInputSchema.parse(args);
    const { helpScoutDocsClient, config } = this.services.resolve(['helpScoutDocsClient', 'config']);
    
    const endpoint = input.draft ? `/articles/${input.articleId}/draft` : `/articles/${input.articleId}`;
    const article = await helpScoutDocsClient.get<DocsArticle>(endpoint);

    // Handle PII redaction for article content
    const processedArticle = {
      ...article,
      text: config.security.allowPii ? article.text : '[REDACTED - Set ALLOW_PII=true to view article content]',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            article: processedArticle,
            usage: 'Use updateDocsArticle to modify this article',
          }, null, 2),
        },
      ],
    };
  }

  private async updateDocsArticle(args: unknown): Promise<CallToolResult> {
    const input = UpdateDocsArticleInputSchema.parse(args);
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    // Build update payload
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.text !== undefined) updateData.text = input.text;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.categories !== undefined) updateData.categories = input.categories;
    if (input.related !== undefined) updateData.related = input.related;

    const updatedArticle = await helpScoutDocsClient.update<DocsArticle>(
      `/articles/${input.articleId}`,
      updateData
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            article: updatedArticle,
            updated: Object.keys(updateData),
          }, null, 2),
        },
      ],
    };
  }

  private async updateDocsCollection(args: unknown): Promise<CallToolResult> {
    const input = UpdateDocsCollectionInputSchema.parse(args);
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    // Build update payload
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;
    if (input.order !== undefined) updateData.order = input.order;

    const updatedCollection = await helpScoutDocsClient.update<DocsCollection>(
      `/collections/${input.collectionId}`,
      updateData
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            collection: updatedCollection,
            updated: Object.keys(updateData),
          }, null, 2),
        },
      ],
    };
  }

  private async updateDocsCategory(args: unknown): Promise<CallToolResult> {
    const input = UpdateDocsCategoryInputSchema.parse(args);
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    // Build update payload
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;
    if (input.order !== undefined) updateData.order = input.order;

    const updatedCategory = await helpScoutDocsClient.update<DocsCategory>(
      `/categories/${input.categoryId}`,
      updateData
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            category: updatedCategory,
            updated: Object.keys(updateData),
          }, null, 2),
        },
      ],
    };
  }

  private async getTopDocsArticles(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      query: z.string().optional(),
      collectionId: z.string().optional(),
      limit: z.number().min(1).max(200).default(100),
      status: z.enum(['all', 'published', 'notpublished']).default('published'),
    }).parse(args);
    
    const { helpScoutDocsClient, config, logger } = this.services.resolve(['helpScoutDocsClient', 'config', 'logger']);
    
    // Import collection resolver
    const { collectionResolver } = await import('../utils/collection-resolver.js');
    
    try {
      // Determine which collection to use
      let targetCollectionId = input.collectionId;
      let collectionName: string | undefined;
      let siteName: string | undefined;
      
      // If no specific collection ID provided, try to resolve from query or use default
      if (!targetCollectionId && (input.query || config.helpscout.defaultDocsCollectionId)) {
        const match = await collectionResolver.resolveCollection(
          input.query || '',
          config.helpscout.defaultDocsCollectionId
        );
        
        if (match) {
          targetCollectionId = match.collection.id;
          collectionName = match.collection.name;
          siteName = match.site.name || match.site.subdomain;
          
          logger.info('Resolved collection from query', {
            query: input.query,
            collection: collectionName,
            site: siteName,
            matchReason: match.matchReason
          });
        }
      }
      
      // Set up parameters for API call
      const params: Record<string, unknown> = {
        page: 1,
        pageSize: Math.min(input.limit, DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE),
        sort: 'popularity', // Sort by popularity (views)
        order: 'desc',
      };

      if (input.status !== 'all') {
        params.status = input.status;
      }

      let response: DocsPaginatedResponse<DocsArticleRef>;
      let allArticles: DocsArticleRef[] = [];
      
      if (targetCollectionId) {
        // Get articles from specific collection
        // If we need more than one page worth, paginate
        let page = 1;
        let hasMore = true;
        
        while (hasMore && allArticles.length < input.limit) {
          const pageParams = { ...params, page };
          const pageResponse = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsArticleRef>>(
            `/collections/${targetCollectionId}/articles`,
            pageParams
          );
          
          if (pageResponse.items) {
            allArticles.push(...pageResponse.items);
          }
          
          hasMore = page < pageResponse.pages;
          page++;
          
          // Stop if we have enough articles
          if (allArticles.length >= input.limit) {
            allArticles = allArticles.slice(0, input.limit);
            hasMore = false;
          }
        }
        
        // Create a response object for consistency
        response = {
          items: allArticles,
          page: 1,
          pages: Math.ceil(allArticles.length / (params.pageSize as number)),
          count: allArticles.length
        };
      } else {
        // Try to get all articles across all sites
        // First, get all sites
        const sitesResponse = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsSite>>('/sites', {
          page: 1,
        });

        if (!sitesResponse.items || sitesResponse.items.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'No Docs sites found',
                  message: 'Unable to retrieve top articles because no Help Scout Docs sites are available.',
                  troubleshooting: [
                    '1. Verify your HELPSCOUT_DOCS_API_KEY is set correctly',
                    '2. Check that your API key has Docs permissions at https://secure.helpscout.net/authentication/api',
                    '3. Ensure Help Scout Docs is enabled for your account',
                    '4. Confirm at least one Docs site exists in your account'
                  ],
                  alternativeApproach: 'If you know a specific collection ID, you can pass it as a parameter to this tool',
                }, null, 2),
              },
            ],
          };
        }

        // Get collections from the first site
        const siteId = sitesResponse.items[0].id;
        const collectionsResponse = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsCollection>>(
          '/collections',
          { siteId, page: 1, pageSize: DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE }
        );

        if (!collectionsResponse.items || collectionsResponse.items.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'No collections found',
                  message: 'No collections found in the available Docs site.',
                  siteId,
                  suggestion: 'Create collections in your Help Scout Docs to start tracking article popularity',
                }, null, 2),
              },
            ],
          };
        }

        // Aggregate articles from all collections
        const allArticles: DocsArticleRef[] = [];
        for (const collection of collectionsResponse.items.slice(0, 5)) { // Limit to first 5 collections
          try {
            const articlesResponse = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsArticleRef>>(
              `/collections/${collection.id}/articles`,
              params
            );
            if (articlesResponse.items) {
              allArticles.push(...articlesResponse.items);
            }
          } catch (error) {
            logger.warn(`Failed to get articles from collection ${collection.id}`, { error });
          }
        }

        // Sort all articles by popularity and take top N
        const sortedArticles = allArticles
          .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
          .slice(0, input.limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                topArticles: sortedArticles.map(article => ({
                  id: article.id,
                  title: article.name,
                  slug: (article as any).slug || article.id,
                  status: article.status,
                  views: article.viewCount || 0,
                  collectionId: article.collectionId,
                  createdAt: article.createdAt,
                  updatedAt: article.updatedAt,
                })),
                totalArticles: sortedArticles.length,
                collectionsSearched: collectionsResponse.items.slice(0, 5).length,
                note: 'Articles sorted by popularity (view count)',
              }, null, 2),
            },
          ],
        };
      }

      // Return articles from specific collection
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              topArticles: response.items.map(article => ({
                id: article.id,
                title: article.name,
                slug: (article as any).slug || article.id,
                status: article.status,
                views: article.viewCount || 0,
                collectionId: article.collectionId,
                createdAt: article.createdAt,
                updatedAt: article.updatedAt,
              })),
              totalArticles: response.count,
              pagination: {
                page: response.page,
                pages: response.pages,
                count: response.count,
              },
              collection: {
                id: targetCollectionId,
                name: collectionName,
                site: siteName,
              },
              query: input.query,
              note: 'Articles sorted by popularity (view count)',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error('Failed to get top Docs articles', { error });
      
      // Provide helpful error message
      if (error instanceof Error && error.message.includes('401')) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Authentication failed',
                message: 'Unable to authenticate with Help Scout Docs API.',
                troubleshooting: [
                  '1. Verify HELPSCOUT_DOCS_API_KEY is set correctly',
                  '2. Check that the API key is valid and not expired',
                  '3. Ensure the API key has Docs permissions'
                ],
                apiKeyFormat: 'The API key should be a string like "1234567890abcdef"',
              }, null, 2),
            },
          ],
        };
      }
      
      throw error;
    }
  }

  private async testDocsConnection(): Promise<CallToolResult> {
    const { helpScoutDocsClient, config, logger } = this.services.resolve(['helpScoutDocsClient', 'config', 'logger']);
    
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      configuration: {
        hasDocsApiKey: !!config.helpscout.docsApiKey,
        docsApiKeyLength: config.helpscout.docsApiKey?.length || 0,
        docsBaseUrl: config.helpscout.docsBaseUrl,
      },
      tests: {}
    };

    // Test 1: Check configuration
    if (!config.helpscout.docsApiKey) {
      results.tests.configuration = {
        success: false,
        error: 'HELPSCOUT_DOCS_API_KEY environment variable is not set'
      };
    } else {
      results.tests.configuration = {
        success: true,
        message: 'Docs API key is configured'
      };
    }

    // Test 2: Test API connection
    try {
      const connectionTest = await helpScoutDocsClient.testConnection();
      results.tests.connection = {
        success: connectionTest,
        message: connectionTest ? 'Successfully connected to Docs API' : 'Connection test failed'
      };
    } catch (error) {
      results.tests.connection = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 3: Try to get sites
    try {
      const sitesResponse = await helpScoutDocsClient.get<any>('/sites', { page: 1 });
      
      // Log the exact response structure
      logger.info('Sites API raw response', {
        responseType: typeof sitesResponse,
        responseKeys: sitesResponse && typeof sitesResponse === 'object' ? Object.keys(sitesResponse) : [],
        hasItems: !!(sitesResponse && sitesResponse.items),
        itemsLength: sitesResponse?.items?.length || 0,
        firstItem: sitesResponse?.items?.[0],
      });
      
      results.tests.sites = {
        success: true,
        siteCount: sitesResponse.items?.length || 0,
        sites: sitesResponse.items || [],
        rawResponse: sitesResponse,
        responseStructure: {
          type: typeof sitesResponse,
          keys: sitesResponse && typeof sitesResponse === 'object' ? Object.keys(sitesResponse) : [],
        }
      };
      
      // Test 3a: If we have sites, try to get collections from the first one
      if (sitesResponse.items && sitesResponse.items.length > 0) {
        const firstSiteId = sitesResponse.items[0].id;
        try {
          const collectionsResponse = await helpScoutDocsClient.get<any>('/collections', { 
            siteId: firstSiteId,
            page: 1 
          });
          results.tests.collections = {
            success: true,
            siteId: firstSiteId,
            collectionCount: collectionsResponse.items?.length || 0,
            collections: collectionsResponse.items || []
          };
        } catch (error: any) {
          results.tests.collections = {
            success: false,
            siteId: firstSiteId,
            error: error.message || 'Unknown error',
            statusCode: error.response?.status,
            errorCode: error.code,
            details: error.details
          };
        }
      }
    } catch (error: any) {
      results.tests.sites = {
        success: false,
        error: error.message || 'Unknown error',
        statusCode: error.response?.status,
        errorCode: error.code
      };
    }

    // Test 4: Try a raw request to debug authentication
    try {
      const axios = (await import('axios')).default;
      const testResponse = await axios.get('https://docsapi.helpscout.net/v1/sites', {
        auth: {
          username: config.helpscout.docsApiKey || '',
          password: 'X'
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HelpScout-MCP-Server'
        }
      });
      
      results.tests.rawRequest = {
        success: true,
        status: testResponse.status,
        hasData: !!testResponse.data,
        dataKeys: Object.keys(testResponse.data || {})
      };
    } catch (error: any) {
      results.tests.rawRequest = {
        success: false,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      };
    }

    // Determine overall status
    const allTestsPassed = Object.values(results.tests).every((test: any) => test.success);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ...results,
            summary: {
              allTestsPassed,
              recommendation: allTestsPassed 
                ? 'Docs API is properly configured and accessible'
                : 'There are issues with the Docs API configuration or access. Check the test results above.',
              nextSteps: !allTestsPassed ? [
                'Verify HELPSCOUT_DOCS_API_KEY is set correctly',
                'Check that the API key has proper permissions at https://secure.helpscout.net/settings/docs/code',
                'Ensure Help Scout Docs is enabled for your account',
                'Confirm at least one Docs site exists in your account'
              ] : []
            }
          }, null, 2),
        },
      ],
    };
  }

  private async clearDocsCache(): Promise<CallToolResult> {
    const { cache } = this.services.resolve(['cache']);
    
    // Clear all docs-related cache entries
    // Since we can't iterate over cache keys, we'll clear common patterns
    const endpointsToClean = [
      'DOCS:GET:/sites',
      'DOCS:GET:/collections',
      'DOCS:GET:/categories',
      'DOCS:GET:/articles',
    ];
    
    for (const key of endpointsToClean) {
      try {
        cache.clear(key);
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Docs API cache cleared',
            clearedPatterns: endpointsToClean,
            note: 'Next API calls will fetch fresh data from Help Scout',
          }, null, 2),
        },
      ],
    };
  }

  private async listAllDocsCollections(): Promise<CallToolResult> {
    const { collectionResolver } = await import('../utils/collection-resolver.js');
    
    try {
      const collectionsMap = await collectionResolver.getAllCollections();
      
      const result: any[] = [];
      for (const [site, collections] of collectionsMap) {
        result.push({
          site: {
            id: site.id,
            name: site.name || site.subdomain,
            subdomain: site.subdomain,
          },
          collections: collections.map(col => ({
            id: col.id,
            name: col.name,
            slug: col.slug,
            articleCount: col.articleCount,
            publishedArticleCount: col.publishedArticleCount,
            visibility: col.visibility,
          }))
        });
      }
      
      // Sort by site name
      result.sort((a, b) => (a.site.name || '').localeCompare(b.site.name || ''));
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sites: result,
              totalSites: result.length,
              totalCollections: result.reduce((sum, site) => sum + site.collections.length, 0),
              usage: 'Use collection names in natural language queries or collection IDs for direct access',
              examples: [
                'getTopDocsArticles with query: "GravityKit articles"',
                'getTopDocsArticles with query: "TrustedLogin docs"',
                'getTopDocsArticles with collectionId: "<specific-id>"'
              ]
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to list collections',
              message: error instanceof Error ? error.message : String(error),
              suggestion: 'Try running clearDocsCache first, then retry'
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getSiteCollections(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      query: z.string().optional(),
      siteId: z.string().optional(),
    }).parse(args);
    
    const { helpScoutDocsClient, config } = this.services.resolve(['helpScoutDocsClient', 'config']);
    
    try {
      let targetSiteId: string;
      let matchInfo: any = null;
      
      // If siteId is provided directly, use it
      if (input.siteId) {
        targetSiteId = input.siteId;
      } 
      // If query is provided, use NLP to find the site
      else if (input.query) {
        const { siteResolver } = await import('../utils/site-resolver.js');
        const siteMatch = await siteResolver.resolveSite(
          input.query,
          config.helpscout.defaultDocsSiteId
        );
        
        if (!siteMatch) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'No matching site found',
                  query: input.query,
                  suggestion: 'Try using "listDocsSites" to see available sites',
                }, null, 2),
              },
            ],
          };
        }
        
        targetSiteId = siteMatch.site.id;
        matchInfo = {
          matchedSite: siteMatch.site.name || siteMatch.site.subdomain,
          matchScore: siteMatch.matchScore,
          matchReason: siteMatch.matchReason,
        };
      }
      // Use default site if available
      else if (config.helpscout.defaultDocsSiteId) {
        targetSiteId = config.helpscout.defaultDocsSiteId;
        matchInfo = {
          note: 'Using default site from configuration',
        };
      }
      // No way to determine site
      else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'No site specified',
                suggestion: 'Provide either a query, siteId, or configure HELPSCOUT_DEFAULT_DOCS_SITE_ID',
              }, null, 2),
            },
          ],
        };
      }
      
      // Fetch collections for the site
      const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsCollection>>('/collections', {
        siteId: targetSiteId,
        page: 1,
        pageSize: DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE,
      });
      
      const collections = response.items || [];
      
      // Get site details if we need them
      const sitesResponse = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsSite>>('/sites', {
        page: 1,
      });
      
      const site = sitesResponse.items?.find(s => s.id === targetSiteId);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              site: {
                id: targetSiteId,
                name: site?.name || site?.subdomain || 'Unknown',
                subdomain: site?.subdomain,
              },
              ...(matchInfo && { matchInfo }),
              collections: collections.map(col => ({
                id: col.id,
                name: col.name,
                slug: col.slug,
                articleCount: col.articleCount,
                publishedArticleCount: col.publishedArticleCount,
                visibility: col.visibility,
                order: col.order,
              })),
              totalCollections: collections.length,
              page: response.page || 1,
              totalPages: response.pages || 1,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get site collections',
              message: error instanceof Error ? error.message : String(error),
              input,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async searchDocsArticles(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      query: z.string(),
      collectionId: z.string().optional(),
      categoryId: z.string().optional(),
      visibility: z.enum(['public', 'private', 'all']).default('all'),
      status: z.enum(['all', 'published', 'notpublished']).default('published'),
      page: z.number().default(1),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const params: Record<string, unknown> = {
        query: input.query,
        page: input.page,
        pageSize: DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE,
      };
      
      if (input.collectionId) params.collectionId = input.collectionId;
      if (input.categoryId) params.categoryId = input.categoryId;
      if (input.visibility !== 'all') params.visibility = input.visibility;
      if (input.status !== 'all') params.status = input.status;
      
      const response = await helpScoutDocsClient.get<DocsPaginatedResponse<any>>('/articles/search', params);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query: input.query,
              results: response.items || [],
              pagination: {
                page: response.page,
                pages: response.pages,
                count: response.count,
              },
              filters: {
                collectionId: input.collectionId,
                categoryId: input.categoryId,
                visibility: input.visibility,
                status: input.status,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to search articles',
              message: error instanceof Error ? error.message : String(error),
              query: input.query,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async createDocsArticle(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      collectionId: z.string(),
      name: z.string(),
      text: z.string(),
      categoryIds: z.array(z.string()).optional(),
      status: z.enum(['published', 'notpublished']).default('notpublished'),
      visibility: z.enum(['public', 'private']).default('public'),
      slug: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const articleData: any = {
        collectionId: input.collectionId,
        name: input.name,
        text: input.text,
        status: input.status,
        visibility: input.visibility,
      };
      
      if (input.categoryIds) articleData.categories = input.categoryIds;
      if (input.slug) articleData.slug = input.slug;
      if (input.tags) articleData.tags = input.tags;
      
      const response = await helpScoutDocsClient.create<any>('/articles', articleData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Article created successfully',
              article: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create article',
              message: error instanceof Error ? error.message : String(error),
              input,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async deleteDocsArticle(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      articleId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient, config } = this.services.resolve(['helpScoutDocsClient', 'config']);
    
    // Check if deletion is allowed
    if (!config.helpscout.allowDocsDelete) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Article deletion is disabled',
              message: 'Set HELPSCOUT_ALLOW_DOCS_DELETE=true to enable article deletion',
            }, null, 2),
          },
        ],
      };
    }
    
    try {
      await helpScoutDocsClient.delete(`/articles/${input.articleId}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Article deleted successfully',
              articleId: input.articleId,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to delete article',
              message: error instanceof Error ? error.message : String(error),
              articleId: input.articleId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async updateDocsViewCount(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      articleId: z.string(),
      count: z.number().min(1).default(1),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      await helpScoutDocsClient.update(`/articles/${input.articleId}/views`, {
        count: input.count,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'View count updated successfully',
              articleId: input.articleId,
              viewsAdded: input.count,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to update view count',
              message: error instanceof Error ? error.message : String(error),
              articleId: input.articleId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async listRelatedDocsArticles(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      articleId: z.string(),
      status: z.enum(['all', 'published', 'notpublished']).default('published'),
      sort: z.enum(['updatedAt', 'createdAt', 'name', 'popularity', 'order']).default('popularity'),
      order: z.enum(['asc', 'desc']).default('desc'),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const params: Record<string, unknown> = {
        status: input.status,
        sort: input.sort,
        order: input.order,
        pageSize: DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE,
      };
      
      const response = await helpScoutDocsClient.get<DocsPaginatedResponse<DocsArticleRef>>(
        `/articles/${input.articleId}/related`,
        params
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              articleId: input.articleId,
              relatedArticles: response.items || [],
              count: response.count || 0,
              filters: {
                status: input.status,
                sort: input.sort,
                order: input.order,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get related articles',
              message: error instanceof Error ? error.message : String(error),
              articleId: input.articleId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async createDocsCategory(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      collectionId: z.string(),
      name: z.string(),
      visibility: z.enum(['public', 'private']).default('public'),
      order: z.number().optional(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const categoryData: any = {
        collectionId: input.collectionId,
        name: input.name,
        visibility: input.visibility,
      };
      
      if (input.order !== undefined) categoryData.order = input.order;
      
      const response = await helpScoutDocsClient.create<any>('/categories', categoryData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Category created successfully',
              category: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create category',
              message: error instanceof Error ? error.message : String(error),
              input,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async deleteDocsCategory(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      categoryId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient, config } = this.services.resolve(['helpScoutDocsClient', 'config']);
    
    // Check if deletion is allowed
    if (!config.helpscout.allowDocsDelete) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Category deletion is disabled',
              message: 'Set HELPSCOUT_ALLOW_DOCS_DELETE=true to enable category deletion',
            }, null, 2),
          },
        ],
      };
    }
    
    try {
      await helpScoutDocsClient.delete(`/categories/${input.categoryId}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Category deleted successfully',
              categoryId: input.categoryId,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to delete category',
              message: error instanceof Error ? error.message : String(error),
              categoryId: input.categoryId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async createDocsCollection(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
      name: z.string(),
      visibility: z.enum(['public', 'private']).default('public'),
      order: z.number().optional(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const collectionData: any = {
        siteId: input.siteId,
        name: input.name,
        visibility: input.visibility,
      };
      
      if (input.order !== undefined) collectionData.order = input.order;
      
      const response = await helpScoutDocsClient.create<any>('/collections', collectionData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Collection created successfully',
              collection: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create collection',
              message: error instanceof Error ? error.message : String(error),
              input,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async deleteDocsCollection(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      collectionId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient, config } = this.services.resolve(['helpScoutDocsClient', 'config']);
    
    // Check if deletion is allowed
    if (!config.helpscout.allowDocsDelete) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Collection deletion is disabled',
              message: 'Set HELPSCOUT_ALLOW_DOCS_DELETE=true to enable collection deletion',
            }, null, 2),
          },
        ],
      };
    }
    
    try {
      await helpScoutDocsClient.delete(`/collections/${input.collectionId}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Collection deleted successfully',
              collectionId: input.collectionId,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to delete collection',
              message: error instanceof Error ? error.message : String(error),
              collectionId: input.collectionId,
            }, null, 2),
          },
        ],
      };
    }
  }

  // Article Revisions implementations
  private async listDocsArticleRevisions(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      articleId: z.string(),
      page: z.number().default(1),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const response = await helpScoutDocsClient.get<DocsPaginatedResponse<any>>(
        `/articles/${input.articleId}/revisions`,
        { page: input.page, pageSize: DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE }
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              articleId: input.articleId,
              revisions: response.items || [],
              pagination: {
                page: response.page,
                pages: response.pages,
                count: response.count,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to list article revisions',
              message: error instanceof Error ? error.message : String(error),
              articleId: input.articleId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getDocsArticleRevision(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      revisionId: z.string(),
      draft: z.boolean().default(false),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const params: Record<string, unknown> = {};
      if (input.draft) params.draft = true;
      
      const response = await helpScoutDocsClient.get<any>(
        `/articles/revisions/${input.revisionId}`,
        params
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              revision: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get article revision',
              message: error instanceof Error ? error.message : String(error),
              revisionId: input.revisionId,
            }, null, 2),
          },
        ],
      };
    }
  }

  // Article Drafts implementations
  private async saveDocsArticleDraft(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      articleId: z.string(),
      text: z.string(),
      name: z.string().optional(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const draftData: any = {
        text: input.text,
      };
      if (input.name) draftData.name = input.name;
      
      const response = await helpScoutDocsClient.create<any>(
        `/articles/${input.articleId}/drafts`,
        draftData
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Draft saved successfully',
              draft: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to save article draft',
              message: error instanceof Error ? error.message : String(error),
              articleId: input.articleId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async deleteDocsArticleDraft(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      draftId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient, config } = this.services.resolve(['helpScoutDocsClient', 'config']);
    
    if (!config.helpscout.allowDocsDelete) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Draft deletion is disabled',
              message: 'Set HELPSCOUT_ALLOW_DOCS_DELETE=true to enable draft deletion',
            }, null, 2),
          },
        ],
      };
    }
    
    try {
      await helpScoutDocsClient.delete(`/articles/drafts/${input.draftId}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Draft deleted successfully',
              draftId: input.draftId,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to delete article draft',
              message: error instanceof Error ? error.message : String(error),
              draftId: input.draftId,
            }, null, 2),
          },
        ],
      };
    }
  }

  // Article Upload implementation
  private async uploadDocsArticle(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      collectionId: z.string(),
      filePath: z.string(),
      name: z.string(),
      categoryIds: z.array(z.string()).optional(),
      status: z.enum(['published', 'notpublished']).default('notpublished'),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      // Read the file content
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(input.filePath, 'utf-8');
      
      // Detect if it's markdown and convert to HTML if needed
      let htmlContent = fileContent;
      if (input.filePath.endsWith('.md') || input.filePath.endsWith('.markdown')) {
        // Simple markdown to HTML conversion (in production, use a proper markdown parser)
        htmlContent = `<p>${fileContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      }
      
      const articleData: any = {
        collectionId: input.collectionId,
        name: input.name,
        text: htmlContent,
        status: input.status,
      };
      
      if (input.categoryIds) articleData.categories = input.categoryIds;
      
      const response = await helpScoutDocsClient.create<any>('/articles/upload', articleData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Article uploaded successfully',
              article: response,
              sourceFile: input.filePath,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to upload article',
              message: error instanceof Error ? error.message : String(error),
              filePath: input.filePath,
            }, null, 2),
          },
        ],
      };
    }
  }

  // Assets implementations
  private async createDocsArticleAsset(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      collectionId: z.string(),
      filePath: z.string(),
      fileName: z.string().optional(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      // Note: File upload requires multipart/form-data which may need special handling
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const fileBuffer = await fs.readFile(input.filePath);
      const fileName = input.fileName || path.basename(input.filePath);
      
      // This is a simplified implementation - actual file upload would require FormData
      const response = await helpScoutDocsClient.create<any>('/assets/article', {
        collectionId: input.collectionId,
        fileName: fileName,
        // In a real implementation, this would be a file upload
        fileData: fileBuffer.toString('base64'),
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Article asset created successfully',
              asset: response,
              fileName: fileName,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create article asset',
              message: error instanceof Error ? error.message : String(error),
              filePath: input.filePath,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async createDocsSettingsAsset(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
      filePath: z.string(),
      assetType: z.enum(['logo', 'favicon', 'other']),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const fileBuffer = await fs.readFile(input.filePath);
      const fileName = path.basename(input.filePath);
      
      const response = await helpScoutDocsClient.create<any>('/assets/settings', {
        siteId: input.siteId,
        assetType: input.assetType,
        fileName: fileName,
        fileData: fileBuffer.toString('base64'),
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Settings asset created successfully',
              asset: response,
              assetType: input.assetType,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create settings asset',
              message: error instanceof Error ? error.message : String(error),
              filePath: input.filePath,
              assetType: input.assetType,
            }, null, 2),
          },
        ],
      };
    }
  }

  // Single Resource Getters implementations
  private async getDocsCategory(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      categoryId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const response = await helpScoutDocsClient.get<DocsCategory>(
        `/categories/${input.categoryId}`
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              category: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get category',
              message: error instanceof Error ? error.message : String(error),
              categoryId: input.categoryId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getDocsCollection(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      collectionId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const response = await helpScoutDocsClient.get<DocsCollection>(
        `/collections/${input.collectionId}`
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              collection: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get collection',
              message: error instanceof Error ? error.message : String(error),
              collectionId: input.collectionId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getDocsSite(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const response = await helpScoutDocsClient.get<DocsSite>(
        `/sites/${input.siteId}`
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              site: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get site',
              message: error instanceof Error ? error.message : String(error),
              siteId: input.siteId,
            }, null, 2),
          },
        ],
      };
    }
  }

  // Category Order implementation
  private async updateDocsCategoryOrder(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      collectionId: z.string(),
      categoryIds: z.array(z.string()),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      await helpScoutDocsClient.update('/categories/order', {
        collectionId: input.collectionId,
        categories: input.categoryIds,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Category order updated successfully',
              collectionId: input.collectionId,
              newOrder: input.categoryIds,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to update category order',
              message: error instanceof Error ? error.message : String(error),
              collectionId: input.collectionId,
            }, null, 2),
          },
        ],
      };
    }
  }

  // Redirects implementations
  private async listDocsRedirects(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
      page: z.number().default(1),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const response = await helpScoutDocsClient.get<DocsPaginatedResponse<any>>(
        `/redirects/site/${input.siteId}`,
        { page: input.page, pageSize: DOCS_TOOL_CONSTANTS.MAX_PAGE_SIZE }
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              siteId: input.siteId,
              redirects: response.items || [],
              pagination: {
                page: response.page,
                pages: response.pages,
                count: response.count,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to list redirects',
              message: error instanceof Error ? error.message : String(error),
              siteId: input.siteId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async getDocsRedirect(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      redirectId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const response = await helpScoutDocsClient.get<any>(
        `/redirects/${input.redirectId}`
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              redirect: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get redirect',
              message: error instanceof Error ? error.message : String(error),
              redirectId: input.redirectId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async findDocsRedirect(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
      url: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const response = await helpScoutDocsClient.get<any>('/redirects/find', {
        siteId: input.siteId,
        url: input.url,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              redirect: response,
              searchUrl: input.url,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to find redirect',
              message: error instanceof Error ? error.message : String(error),
              siteId: input.siteId,
              url: input.url,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async createDocsRedirect(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
      urlMapping: z.string(),
      redirect: z.string(),
      type: z.number().refine(val => val === 301 || val === 302).default(301),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const response = await helpScoutDocsClient.create<any>('/redirects', {
        siteId: input.siteId,
        urlMapping: input.urlMapping,
        redirect: input.redirect,
        type: input.type,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Redirect created successfully',
              redirect: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create redirect',
              message: error instanceof Error ? error.message : String(error),
              input,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async updateDocsRedirect(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      redirectId: z.string(),
      urlMapping: z.string().optional(),
      redirect: z.string().optional(),
      type: z.number().refine(val => val === 301 || val === 302).optional(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const updateData: any = {};
      if (input.urlMapping) updateData.urlMapping = input.urlMapping;
      if (input.redirect) updateData.redirect = input.redirect;
      if (input.type) updateData.type = input.type;
      
      const response = await helpScoutDocsClient.update<any>(
        `/redirects/${input.redirectId}`,
        updateData
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Redirect updated successfully',
              redirect: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to update redirect',
              message: error instanceof Error ? error.message : String(error),
              redirectId: input.redirectId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async deleteDocsRedirect(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      redirectId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient, config } = this.services.resolve(['helpScoutDocsClient', 'config']);
    
    if (!config.helpscout.allowDocsDelete) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Redirect deletion is disabled',
              message: 'Set HELPSCOUT_ALLOW_DOCS_DELETE=true to enable redirect deletion',
            }, null, 2),
          },
        ],
      };
    }
    
    try {
      await helpScoutDocsClient.delete(`/redirects/${input.redirectId}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Redirect deleted successfully',
              redirectId: input.redirectId,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to delete redirect',
              message: error instanceof Error ? error.message : String(error),
              redirectId: input.redirectId,
            }, null, 2),
          },
        ],
      };
    }
  }

  // Site Management implementations
  private async createDocsSite(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      name: z.string(),
      subdomain: z.string(),
      cname: z.string().optional(),
      logoUrl: z.string().optional(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const siteData: any = {
        name: input.name,
        subdomain: input.subdomain,
      };
      if (input.cname) siteData.cname = input.cname;
      if (input.logoUrl) siteData.logoUrl = input.logoUrl;
      
      const response = await helpScoutDocsClient.create<any>('/sites', siteData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Site created successfully',
              site: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to create site',
              message: error instanceof Error ? error.message : String(error),
              input,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async updateDocsSite(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
      name: z.string().optional(),
      subdomain: z.string().optional(),
      cname: z.string().optional(),
      logoUrl: z.string().optional(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.subdomain) updateData.subdomain = input.subdomain;
      if (input.cname !== undefined) updateData.cname = input.cname;
      if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
      
      const response = await helpScoutDocsClient.update<any>(
        `/sites/${input.siteId}`,
        updateData
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Site updated successfully',
              site: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to update site',
              message: error instanceof Error ? error.message : String(error),
              siteId: input.siteId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async deleteDocsSite(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient, config } = this.services.resolve(['helpScoutDocsClient', 'config']);
    
    if (!config.helpscout.allowDocsDelete) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Site deletion is disabled',
              message: 'Set HELPSCOUT_ALLOW_DOCS_DELETE=true to enable site deletion',
            }, null, 2),
          },
        ],
      };
    }
    
    try {
      await helpScoutDocsClient.delete(`/sites/${input.siteId}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Site deleted successfully',
              siteId: input.siteId,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to delete site',
              message: error instanceof Error ? error.message : String(error),
              siteId: input.siteId,
            }, null, 2),
          },
        ],
      };
    }
  }

  // Site Restrictions implementations
  private async getDocsSiteRestrictions(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const response = await helpScoutDocsClient.get<any>(
        `/sites/${input.siteId}/restrictions`
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              siteId: input.siteId,
              restrictions: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to get site restrictions',
              message: error instanceof Error ? error.message : String(error),
              siteId: input.siteId,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async updateDocsSiteRestrictions(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      siteId: z.string(),
      restricted: z.boolean().optional(),
      allowedDomains: z.array(z.string()).optional(),
      ssoEnabled: z.boolean().optional(),
    }).parse(args);
    
    const { helpScoutDocsClient } = this.services.resolve(['helpScoutDocsClient']);
    
    try {
      const updateData: any = {};
      if (input.restricted !== undefined) updateData.restricted = input.restricted;
      if (input.allowedDomains) updateData.allowedDomains = input.allowedDomains;
      if (input.ssoEnabled !== undefined) updateData.ssoEnabled = input.ssoEnabled;
      
      const response = await helpScoutDocsClient.update<any>(
        `/sites/${input.siteId}/restrictions`,
        updateData
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Site restrictions updated successfully',
              siteId: input.siteId,
              restrictions: response,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to update site restrictions',
              message: error instanceof Error ? error.message : String(error),
              siteId: input.siteId,
            }, null, 2),
          },
        ],
      };
    }
  }
}

// Class is already exported above