import { Tool, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createMcpToolError } from '../utils/mcp-errors.js';
import { Injectable, ServiceContainer } from '../utils/service-container.js';
import { isVerbose } from '../utils/config.js';
import { compactTool } from './tool-utils.js';
import { z } from 'zod';

/**
 * Constants for Reports tool operations
 */
const REPORTS_TOOL_CONSTANTS = {
  // Default time ranges
  DEFAULT_DAYS_BACK: 30, // 1 month default
  MAX_DAYS_BACK: 730, // 2 years
  
  // Result limits
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 500,
  
  // Report types
  REPORT_TYPES: {
    CHAT: 'chat',
    EMAIL: 'email',
    PHONE: 'phone',
    USER: 'user',
    TEAM: 'team',
    COMPANY: 'company',
    HAPPINESS: 'happiness',
    DOCS: 'docs',
    CONVERSATIONS: 'conversations',
  } as const,
  
  // View by options
  VIEW_BY: {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
  } as const,
} as const;

const REPORT_TOOL_DESCRIPTIONS: Record<string, string> = {
  getTopArticles: 'Get top Docs articles by views.',
  getReport: 'Get a Help Scout report by type.',
  getHappinessRatings: 'Get individual happiness ratings.',
};

/**
 * Input schemas for Reports tools
 */
export const GetTopArticlesInputSchema = z.object({
  sites: z.array(z.string()).optional()
    .describe('Filter by specific site IDs'),
  collections: z.array(z.string()).optional()
    .describe('Filter by specific collection IDs'),
  limit: z.number().min(1).max(REPORTS_TOOL_CONSTANTS.MAX_LIMIT).default(REPORTS_TOOL_CONSTANTS.DEFAULT_LIMIT)
    .describe(`Number of top articles to return (max ${REPORTS_TOOL_CONSTANTS.MAX_LIMIT})`),
  includeStats: z.boolean().default(true)
    .describe('Include detailed statistics for each article'),
});

// Base schema for all report queries
const BaseReportSchema = z.object({
  start: z.string().datetime()
    .describe('Start date for the report period (ISO 8601)'),
  end: z.string().datetime()
    .describe('End date for the report period (ISO 8601)'),
  previousStart: z.string().datetime().optional()
    .describe('Start date for comparison period (ISO 8601)'),
  previousEnd: z.string().datetime().optional()
    .describe('End date for comparison period (ISO 8601)'),
});

const ReportTypeSchema = z.enum(['chat', 'email', 'phone', 'user', 'company', 'happiness', 'docs']);
const GetReportInputSchema = BaseReportSchema.extend({
  type: ReportTypeSchema,
  mailboxes: z.array(z.string()).optional(),
  folders: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  types: z.array(z.enum(['email', 'chat', 'phone'])).optional(),
  viewBy: z.enum(['day', 'week', 'month']).optional(),
  user: z.string().optional(),
  officeHours: z.boolean().optional(),
  rating: z.array(z.enum(['great', 'ok', 'not-good'])).optional(),
  sites: z.array(z.string()).optional(),
});

// Schema for conversation-related reports (chat, email, phone)
export const GetConversationReportInputSchema = BaseReportSchema.extend({
  mailboxes: z.array(z.string()).optional()
    .describe('Filter by specific mailbox IDs'),
  folders: z.array(z.string()).optional()
    .describe('Filter by specific folder IDs'),
  tags: z.array(z.string()).optional()
    .describe('Filter by specific tag IDs'),
  types: z.array(z.enum(['email', 'chat', 'phone'])).optional()
    .describe('Filter by conversation types'),
  viewBy: z.enum(['day', 'week', 'month']).optional()
    .describe('Group results by time period'),
});

// Schema for user/team reports
export const GetUserReportInputSchema = BaseReportSchema.extend({
  user: z.string().optional()
    .describe('User ID for individual report'),
  mailboxes: z.array(z.string()).optional()
    .describe('Filter by specific mailbox IDs'),
  tags: z.array(z.string()).optional()
    .describe('Filter by specific tag IDs'),
  types: z.array(z.enum(['email', 'chat', 'phone'])).optional()
    .describe('Filter by conversation types'),
  viewBy: z.enum(['day', 'week', 'month']).optional()
    .describe('Group results by time period'),
  officeHours: z.boolean().optional()
    .describe('Filter by office hours only'),
});

// Schema for company reports
export const GetCompanyReportInputSchema = BaseReportSchema.extend({
  mailboxes: z.array(z.string()).optional()
    .describe('Filter by specific mailbox IDs'),
  tags: z.array(z.string()).optional()
    .describe('Filter by specific tag IDs'),
  types: z.array(z.enum(['email', 'chat', 'phone'])).optional()
    .describe('Filter by conversation types'),
  viewBy: z.enum(['day', 'week', 'month']).optional()
    .describe('Group results by time period'),
});

// Schema for happiness reports
export const GetHappinessReportInputSchema = BaseReportSchema.extend({
  mailboxes: z.array(z.string()).optional()
    .describe('Filter by specific mailbox IDs'),
  folders: z.array(z.string()).optional()
    .describe('Filter by specific folder IDs'),
  tags: z.array(z.string()).optional()
    .describe('Filter by specific tag IDs'),
  types: z.array(z.enum(['email', 'chat', 'phone'])).optional()
    .describe('Filter by conversation types'),
  rating: z.array(z.enum(['great', 'ok', 'not-good'])).optional()
    .describe('Filter by specific ratings (note: API uses "ok" and "not-good", not "okay" and "bad")'),
  viewBy: z.enum(['day', 'week', 'month']).optional()
    .describe('Group results by time period'),
});

// Schema for docs reports
export const GetDocsReportInputSchema = BaseReportSchema.extend({
  sites: z.array(z.string()).optional()
    .describe('Filter by specific Docs site IDs'),
});

/**
 * Types for Reports API responses
 */

// Common report metrics
export interface ReportMetrics {
  count?: number;
  previousCount?: number;
  percentChange?: number;
  trend?: 'up' | 'down' | 'neutral';
}

// Base report response structure
export interface BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    [key: string]: any;
  };
  previous?: {
    startDate: string;
    endDate: string;
    [key: string]: any;
  };
  comparison?: {
    [key: string]: ReportMetrics;
  };
}

// Conversation report response (chat, email, phone)
export interface ConversationReportResponse extends BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    totalConversations: number;
    newConversations: number;
    customers: number;
    conversationsPerDay: number;
    busiestDay?: {
      date: string;
      conversations: number;
    };
    tags?: Array<{
      id: string;
      name: string;
      count: number;
    }>;
    resolutionTime?: {
      avg: number;
      min: number;
      max: number;
    };
    responseTime?: {
      avg: number;
      firstResponseAvg: number;
    };
  };
}

// User/Team report response
export interface UserReportResponse extends BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    totalReplies: number;
    conversationsHandled: number;
    customersHelped: number;
    happinessScore?: number;
    avgResponseTime?: number;
    avgResolutionTime?: number;
    repliesPerConversation?: number;
  };
  users?: Array<{
    id: string;
    name: string;
    email: string;
    stats: {
      replies: number;
      conversationsHandled: number;
      customersHelped: number;
      happinessScore?: number;
    };
  }>;
}

// Company report response
export interface CompanyReportResponse extends BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    totalCustomers: number;
    totalConversations: number;
    teamMembers: number;
    avgConversationsPerCustomer: number;
    avgRepliesPerConversation: number;
  };
  topCustomers?: Array<{
    id: string;
    name: string;
    email: string;
    conversationCount: number;
  }>;
}

// Happiness report response
export interface HappinessReportResponse extends BaseReportResponse {
  current: {
    startDate: string;
    endDate: string;
    happinessScore: number;
    totalRatings: number;
    greatCount: number;
    okayCount: number;
    badCount: number;
  };
  ratings?: Array<{
    id: string;
    rating: 'great' | 'ok' | 'not-good';
    customerName: string;
    customerEmail: string;
    conversationId: string;
    comments?: string;
    createdAt: string;
  }>;
}

// Docs report response
export interface DocsReportResponse {
  current: {
    visitors: number;
    browseAction: number;
    sentAnEmailResult: number;
    foundAnAnswerResult: number;
    searchAction: number;
    failedResult: number;
    docsViewedPerVisit: number;
  };
  popularSearches?: Array<{
    count: number;
    id: string;
    results: number;
  }>;
  failedSearches?: Array<{
    count: number;
    id: string;
  }>;
  topArticles?: Array<{
    count: number;
    name: string;
    siteId: string;
    id: string;
    collectionId: string;
  }>;
  topCategories?: Array<{
    count: number;
    name: string;
    siteId: string;
    id: string;
    articles: number;
  }>;
  deltas?: {
    failedResult: number;
    docsViewedPerVisit: number;
    foundAnAnswerResult: number;
    visitors: number;
    browseAction: number;
    searchAction: number;
    sentAnEmailResult: number;
  };
}

export interface TopArticle {
  id: string;
  title: string;
  collectionId: string;
  collectionName?: string;
  siteId?: string;
  siteName?: string;
  views: number;
  visitors: number;
  avgTimeOnPage?: number;
  bounceRate?: number;
  url?: string;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
}

type ReportType = z.infer<typeof ReportTypeSchema>;
type GetReportInput = z.infer<typeof GetReportInputSchema>;

export class ReportsToolHandler extends Injectable {
  constructor(container?: ServiceContainer) {
    super(container);
  }

  /**
   * List all Reports-related tools
   */
  async listReportsTools(): Promise<Tool[]> {
    const tools: Tool[] = [
      {
        name: 'getTopArticles',
        description: REPORT_TOOL_DESCRIPTIONS.getTopArticles,
        inputSchema: {
          type: 'object',
          properties: {
            sites: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific site IDs',
            },
            collections: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by specific collection IDs',
            },
            limit: {
              type: 'number',
              minimum: 1,
              maximum: REPORTS_TOOL_CONSTANTS.MAX_LIMIT,
              default: REPORTS_TOOL_CONSTANTS.DEFAULT_LIMIT,
              description: `Number of top articles to return (max ${REPORTS_TOOL_CONSTANTS.MAX_LIMIT})`,
            },
            includeStats: {
              type: 'boolean',
              default: true,
              description: 'Include detailed statistics for each article',
            },
          },
        },
      },
      {
        name: 'getReport',
        description: REPORT_TOOL_DESCRIPTIONS.getReport,
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['chat', 'email', 'phone', 'user', 'company', 'happiness', 'docs'],
            },
            start: {
              type: 'string',
              format: 'date-time',
            },
            end: {
              type: 'string',
              format: 'date-time',
            },
            previousStart: {
              type: 'string',
              format: 'date-time',
            },
            previousEnd: {
              type: 'string',
              format: 'date-time',
            },
            mailboxes: {
              type: 'array',
              items: { type: 'string' },
            },
            folders: {
              type: 'array',
              items: { type: 'string' },
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            user: {
              type: 'string',
            },
            types: {
              type: 'array',
              items: { 
                type: 'string',
                enum: ['email', 'chat', 'phone'],
              },
            },
            viewBy: {
              type: 'string',
              enum: ['day', 'week', 'month'],
            },
            officeHours: {
              type: 'boolean',
            },
            rating: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['great', 'ok', 'not-good'],
              },
            },
            sites: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['type', 'start', 'end'],
        },
      },
      {
        name: 'getHappinessRatings',
        description: REPORT_TOOL_DESCRIPTIONS.getHappinessRatings,
        inputSchema: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
            },
            end: {
              type: 'string',
              format: 'date-time',
            },
            mailboxes: {
              type: 'array',
              items: { type: 'string' },
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['email', 'chat', 'phone'],
              },
            },
            rating: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['great', 'ok', 'not-good', 'all'],
              },
            },
            page: {
              type: 'number',
              minimum: 1,
              default: 1,
            },
            sortField: {
              type: 'string',
              enum: ['rating', 'createdAt', 'modifiedAt'],
              default: 'createdAt',
            },
            sortOrder: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
          },
          required: ['start', 'end'],
        },
      },
    ];

    return tools.map(tool => compactTool(tool, REPORT_TOOL_DESCRIPTIONS[tool.name]));
  }

  /**
   * Call a Reports tool
   */
  async callReportsTool(request: CallToolRequest): Promise<CallToolResult> {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    const { logger } = this.services.resolve(['logger']);
    
    logger.info('Reports tool call started', {
      requestId,
      toolName: request.params.name,
      arguments: request.params.arguments,
    });

    try {
      let result: CallToolResult;

      switch (request.params.name) {
        case 'getTopArticles':
          result = await this.getTopArticles(request.params.arguments || {});
          break;
        case 'getReport':
        case 'getChatReport':
        case 'getEmailReport':
        case 'getPhoneReport':
        case 'getUserReport':
        case 'getCompanyReport':
        case 'getHappinessReport':
        case 'getDocsReport':
          result = await this.getReport(this.withReportType(request.params.name, request.params.arguments || {}));
          break;
        case 'getHappinessRatings':
          result = await this.getHappinessRatings(request.params.arguments || {});
          break;
        default:
          throw new Error(`Unknown Reports tool: ${request.params.name}`);
      }

      const duration = Date.now() - startTime;
      
      logger.info('Reports tool call completed', {
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

  private async getTopArticles(args: unknown): Promise<CallToolResult> {
    const input = GetTopArticlesInputSchema.parse(args);
    const { logger, config, helpScoutDocsClient } = this.services.resolve(['logger', 'config', 'helpScoutDocsClient']);

    try {
      // First, check if we have Docs API key
      if (!config.helpscout.docsApiKey) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Docs API key not configured. Set HELPSCOUT_DOCS_API_KEY environment variable.',
              }),
            },
          ],
        };
      }

      // We'll need to get articles from collections or sites
      // First, let's get all sites if no specific collections are provided
      const allArticles: any[] = [];
      
      if (input.collections && input.collections.length > 0) {
        // Get articles from specific collections
        for (const collectionId of input.collections) {
          logger.info('Fetching articles from collection', { collectionId });
          const response = await helpScoutDocsClient.get<any>(`/collections/${collectionId}/articles`, {
            page: 1,
            pageSize: 100,
            sort: 'popularity',
            order: 'desc',
            status: 'published',
          });
          
          if (response.items) {
            allArticles.push(...response.items);
          }
        }
      } else if (input.sites && input.sites.length > 0) {
        // Get articles from specific sites
        for (const siteId of input.sites) {
          // First get collections for the site
          logger.info('Fetching collections for site', { siteId });
          const collectionsResponse = await helpScoutDocsClient.get<any>(`/collections`, {
            siteId,
            page: 1,
            pageSize: 100,
          });
          
          // Then get articles from each collection
          if (collectionsResponse.items) {
            for (const collection of collectionsResponse.items) {
              logger.info('Fetching articles from collection', { collectionId: collection.id, siteId });
              const articlesResponse = await helpScoutDocsClient.get<any>(`/collections/${collection.id}/articles`, {
                page: 1,
                pageSize: 100,
                sort: 'popularity',
                order: 'desc',
                status: 'published',
              });
              
              if (articlesResponse.items) {
                allArticles.push(...articlesResponse.items);
              }
            }
          }
        }
      } else {
        // No specific collections or sites provided, get from all sites
        logger.info('Fetching all sites');
        const sitesResponse = await helpScoutDocsClient.get<any>('/sites', { page: 1 });
        
        if (sitesResponse.items) {
          for (const site of sitesResponse.items) {
            // Get collections for each site
            const collectionsResponse = await helpScoutDocsClient.get<any>(`/collections`, {
              siteId: site.id,
              page: 1,
              pageSize: 100,
            });
            
            if (collectionsResponse.items) {
              for (const collection of collectionsResponse.items) {
                logger.info('Fetching articles from collection', { collectionId: collection.id, siteId: site.id });
                const articlesResponse = await helpScoutDocsClient.get<any>(`/collections/${collection.id}/articles`, {
                  page: 1,
                  pageSize: 100,
                  sort: 'popularity',
                  order: 'desc',
                  status: 'published',
                });
                
                if (articlesResponse.items) {
                  allArticles.push(...articlesResponse.items);
                }
              }
            }
          }
        }
      }

      // Sort all articles by viewCount/popularity and get top N
      const sortedArticles = allArticles
        .sort((a: any, b: any) => (b.viewCount || b.popularity || 0) - (a.viewCount || a.popularity || 0))
        .slice(0, input.limit);

      // Check if we found any articles
      if (sortedArticles.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'No articles found',
              }),
            },
          ],
        };
      }

      // Format the response using Docs API structure
      const topArticles = isVerbose(args) ? sortedArticles : sortedArticles.map((article: any) => ({
        id: article.id,
        title: article.name,
        collectionId: article.collectionId,
        views: article.viewCount || article.popularity || 0,
        url: article.publicUrl,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalArticles: sortedArticles.length,
              topArticles: isVerbose(args) ? topArticles : (input.includeStats ? topArticles : topArticles.map((a: any) => ({
                id: a.id,
                title: a.title || a.name,
                views: a.views || a.viewCount || 0,
                url: a.url || a.publicUrl,
              }))),
            }),
          },
        ],
      };
    } catch (error) {
      logger.error('Docs API error', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch articles',
              message: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
      };
    }
  }

  private withReportType(name: string, args: unknown): unknown {
    const payload = (args && typeof args === 'object') ? { ...(args as Record<string, unknown>) } : {};
    const aliasToType: Record<string, ReportType> = {
      getChatReport: 'chat',
      getEmailReport: 'email',
      getPhoneReport: 'phone',
      getUserReport: 'user',
      getCompanyReport: 'company',
      getHappinessReport: 'happiness',
      getDocsReport: 'docs',
    };

    return payload.type ? payload : { ...payload, type: aliasToType[name] };
  }

  private buildBaseParams(input: GetReportInput): Record<string, unknown> {
    const params: Record<string, unknown> = {
      start: input.start,
      end: input.end,
    };

    if (input.previousStart && input.previousEnd) {
      params.previousStart = input.previousStart;
      params.previousEnd = input.previousEnd;
    }

    return params;
  }

  private addCsvParam(params: Record<string, unknown>, key: string, values?: string[]): void {
    if (values && values.length > 0) {
      params[key] = values.join(',');
    }
  }

  private async getReport(args: unknown): Promise<CallToolResult> {
    const input = GetReportInputSchema.parse(args);
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    const params = this.buildBaseParams(input);

    let endpoint = '';
    let errorLabel = '';

    switch (input.type) {
      case 'chat':
      case 'email':
      case 'phone':
        endpoint = `/reports/${input.type}`;
        errorLabel = `${input.type[0].toUpperCase()}${input.type.slice(1)} report`;
        this.addCsvParam(params, 'mailboxes', input.mailboxes);
        this.addCsvParam(params, 'folders', input.folders);
        this.addCsvParam(params, 'tags', input.tags);
        if (input.viewBy) params.viewBy = input.viewBy;
        break;
      case 'user':
        endpoint = '/reports/user';
        errorLabel = 'User report';
        if (input.user) params.user = input.user;
        this.addCsvParam(params, 'mailboxes', input.mailboxes);
        this.addCsvParam(params, 'tags', input.tags);
        this.addCsvParam(params, 'types', input.types);
        if (input.viewBy) params.viewBy = input.viewBy;
        if (input.officeHours !== undefined) params.officeHours = input.officeHours;
        break;
      case 'company':
        endpoint = '/reports/company';
        errorLabel = 'Company report';
        this.addCsvParam(params, 'mailboxes', input.mailboxes);
        this.addCsvParam(params, 'tags', input.tags);
        this.addCsvParam(params, 'types', input.types);
        if (input.viewBy) params.viewBy = input.viewBy;
        break;
      case 'happiness':
        endpoint = '/reports/happiness';
        errorLabel = 'Happiness report';
        this.addCsvParam(params, 'mailboxes', input.mailboxes);
        this.addCsvParam(params, 'folders', input.folders);
        this.addCsvParam(params, 'tags', input.tags);
        this.addCsvParam(params, 'types', input.types);
        this.addCsvParam(params, 'rating', input.rating);
        if (input.viewBy) params.viewBy = input.viewBy;
        break;
      case 'docs':
        endpoint = '/reports/docs';
        errorLabel = 'Docs report';
        params.resolution = 'day';
        this.addCsvParam(params, 'sites', input.sites);
        break;
    }

    try {
      logger.info('Calling Help Scout Reports API', { endpoint, params, type: input.type });

      if (input.type === 'docs') {
        let response: unknown = null;
        try {
          response = await reportsApiClient.getReport<DocsReportResponse>(endpoint, params);
        } catch (error: unknown) {
          logger.error('Failed to get docs report', { error: error instanceof Error ? error.message : String(error) });
        }

        if (!response || response === 'Unknown URL' || typeof response !== 'object' || !('current' in response)) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'Docs Reports endpoint not found. The /v2/reports/docs endpoint may not be available for your plan.',
                }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ report: response as DocsReportResponse }),
            },
          ],
        };
      }

      const response = await reportsApiClient.getReport<
        ConversationReportResponse | UserReportResponse | CompanyReportResponse | HappinessReportResponse
      >(endpoint, params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ report: response }),
          },
        ],
      };
    } catch (error) {
      logger.error('Reports API error', { error, type: input.type });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Failed to fetch ${errorLabel}`,
              message: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
      };
    }
  }

  private async getHappinessRatings(args: unknown): Promise<CallToolResult> {
    const input = z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
      mailboxes: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      types: z.array(z.enum(['email', 'chat', 'phone'])).optional(),
      rating: z.array(z.enum(['great', 'ok', 'not-good', 'all'])).optional(),
      page: z.number().min(1).default(1),
      sortField: z.enum(['rating', 'createdAt', 'modifiedAt']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }).parse(args);
    
    const { reportsApiClient, logger } = this.services.resolve(['reportsApiClient', 'logger']);
    
    try {
      // Build query parameters
      const params: Record<string, unknown> = {
        start: input.start,
        end: input.end,
        page: input.page,
        sortField: input.sortField,
        sortOrder: input.sortOrder,
      };

      if (input.mailboxes && input.mailboxes.length > 0) {
        params.mailboxes = input.mailboxes.join(',');
      }

      if (input.tags && input.tags.length > 0) {
        params.tags = input.tags.join(',');
      }

      if (input.types && input.types.length > 0) {
        params.types = input.types.join(',');
      }

      if (input.rating && input.rating.length > 0) {
        params.rating = input.rating.join(',');
      }

      // The happiness ratings endpoint for individual ratings
      logger.info('Calling Help Scout Reports API for Happiness ratings', { endpoint: '/reports/happiness/ratings', params });
      const response = await reportsApiClient.getReport<any>('/reports/happiness/ratings', params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ratings: response,
            }),
          },
        ],
      };
    } catch (error) {
      logger.error('Happiness Ratings API error', { error });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to fetch Happiness ratings',
              message: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
      };
    }
  }
}
