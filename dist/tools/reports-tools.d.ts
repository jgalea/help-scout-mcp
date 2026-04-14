import { Tool, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Injectable, ServiceContainer } from '../utils/service-container.js';
import { z } from 'zod';
/**
 * Input schemas for Reports tools
 */
export declare const GetTopArticlesInputSchema: z.ZodObject<{
    sites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    collections: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    limit: z.ZodDefault<z.ZodNumber>;
    includeStats: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    includeStats: boolean;
    collections?: string[] | undefined;
    sites?: string[] | undefined;
}, {
    limit?: number | undefined;
    collections?: string[] | undefined;
    sites?: string[] | undefined;
    includeStats?: boolean | undefined;
}>;
export declare const GetConversationReportInputSchema: z.ZodObject<{
    start: z.ZodString;
    end: z.ZodString;
    previousStart: z.ZodOptional<z.ZodString>;
    previousEnd: z.ZodOptional<z.ZodString>;
} & {
    mailboxes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    folders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    types: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "chat", "phone"]>, "many">>;
    viewBy: z.ZodOptional<z.ZodEnum<["day", "week", "month"]>>;
}, "strip", z.ZodTypeAny, {
    end: string;
    start: string;
    tags?: string[] | undefined;
    mailboxes?: string[] | undefined;
    folders?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
    types?: ("email" | "phone" | "chat")[] | undefined;
    viewBy?: "day" | "week" | "month" | undefined;
}, {
    end: string;
    start: string;
    tags?: string[] | undefined;
    mailboxes?: string[] | undefined;
    folders?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
    types?: ("email" | "phone" | "chat")[] | undefined;
    viewBy?: "day" | "week" | "month" | undefined;
}>;
export declare const GetUserReportInputSchema: z.ZodObject<{
    start: z.ZodString;
    end: z.ZodString;
    previousStart: z.ZodOptional<z.ZodString>;
    previousEnd: z.ZodOptional<z.ZodString>;
} & {
    user: z.ZodOptional<z.ZodString>;
    mailboxes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    types: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "chat", "phone"]>, "many">>;
    viewBy: z.ZodOptional<z.ZodEnum<["day", "week", "month"]>>;
    officeHours: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    end: string;
    start: string;
    tags?: string[] | undefined;
    user?: string | undefined;
    mailboxes?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
    types?: ("email" | "phone" | "chat")[] | undefined;
    viewBy?: "day" | "week" | "month" | undefined;
    officeHours?: boolean | undefined;
}, {
    end: string;
    start: string;
    tags?: string[] | undefined;
    user?: string | undefined;
    mailboxes?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
    types?: ("email" | "phone" | "chat")[] | undefined;
    viewBy?: "day" | "week" | "month" | undefined;
    officeHours?: boolean | undefined;
}>;
export declare const GetCompanyReportInputSchema: z.ZodObject<{
    start: z.ZodString;
    end: z.ZodString;
    previousStart: z.ZodOptional<z.ZodString>;
    previousEnd: z.ZodOptional<z.ZodString>;
} & {
    mailboxes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    types: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "chat", "phone"]>, "many">>;
    viewBy: z.ZodOptional<z.ZodEnum<["day", "week", "month"]>>;
}, "strip", z.ZodTypeAny, {
    end: string;
    start: string;
    tags?: string[] | undefined;
    mailboxes?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
    types?: ("email" | "phone" | "chat")[] | undefined;
    viewBy?: "day" | "week" | "month" | undefined;
}, {
    end: string;
    start: string;
    tags?: string[] | undefined;
    mailboxes?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
    types?: ("email" | "phone" | "chat")[] | undefined;
    viewBy?: "day" | "week" | "month" | undefined;
}>;
export declare const GetHappinessReportInputSchema: z.ZodObject<{
    start: z.ZodString;
    end: z.ZodString;
    previousStart: z.ZodOptional<z.ZodString>;
    previousEnd: z.ZodOptional<z.ZodString>;
} & {
    mailboxes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    folders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    types: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "chat", "phone"]>, "many">>;
    rating: z.ZodOptional<z.ZodArray<z.ZodEnum<["great", "ok", "not-good"]>, "many">>;
    viewBy: z.ZodOptional<z.ZodEnum<["day", "week", "month"]>>;
}, "strip", z.ZodTypeAny, {
    end: string;
    start: string;
    tags?: string[] | undefined;
    mailboxes?: string[] | undefined;
    folders?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
    rating?: ("great" | "ok" | "not-good")[] | undefined;
    types?: ("email" | "phone" | "chat")[] | undefined;
    viewBy?: "day" | "week" | "month" | undefined;
}, {
    end: string;
    start: string;
    tags?: string[] | undefined;
    mailboxes?: string[] | undefined;
    folders?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
    rating?: ("great" | "ok" | "not-good")[] | undefined;
    types?: ("email" | "phone" | "chat")[] | undefined;
    viewBy?: "day" | "week" | "month" | undefined;
}>;
export declare const GetDocsReportInputSchema: z.ZodObject<{
    start: z.ZodString;
    end: z.ZodString;
    previousStart: z.ZodOptional<z.ZodString>;
    previousEnd: z.ZodOptional<z.ZodString>;
} & {
    sites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    end: string;
    start: string;
    sites?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
}, {
    end: string;
    start: string;
    sites?: string[] | undefined;
    previousEnd?: string | undefined;
    previousStart?: string | undefined;
}>;
/**
 * Types for Reports API responses
 */
export interface ReportMetrics {
    count?: number;
    previousCount?: number;
    percentChange?: number;
    trend?: 'up' | 'down' | 'neutral';
}
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
export declare class ReportsToolHandler extends Injectable {
    constructor(container?: ServiceContainer);
    /**
     * List all Reports-related tools
     */
    listReportsTools(): Promise<Tool[]>;
    /**
     * Call a Reports tool
     */
    callReportsTool(request: CallToolRequest): Promise<CallToolResult>;
    private getTopArticles;
    private withReportType;
    private buildBaseParams;
    private addCsvParam;
    private getReport;
    private getHappinessRatings;
}
//# sourceMappingURL=reports-tools.d.ts.map