import { z } from 'zod';
export declare const InboxSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    email: z.ZodString;
    slug: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    email: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
}, {
    id: number;
    name: string;
    email: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
}>;
export declare const ConversationSchema: z.ZodObject<{
    id: z.ZodNumber;
    number: z.ZodNumber;
    subject: z.ZodString;
    status: z.ZodEnum<["active", "pending", "closed", "spam"]>;
    state: z.ZodEnum<["published", "draft"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    closedAt: z.ZodNullable<z.ZodString>;
    assignee: z.ZodNullable<z.ZodObject<{
        id: z.ZodNumber;
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }>>;
    customer: z.ZodObject<{
        id: z.ZodNumber;
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }>;
    mailbox: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
    }, {
        id: number;
        name: string;
    }>;
    tags: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        color: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        color: string;
    }, {
        id: number;
        name: string;
        color: string;
    }>, "many">;
    threads: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    number: number;
    id: number;
    createdAt: string;
    updatedAt: string;
    status: "active" | "pending" | "closed" | "spam";
    subject: string;
    state: "published" | "draft";
    closedAt: string | null;
    assignee: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
    customer: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    };
    mailbox: {
        id: number;
        name: string;
    };
    tags: {
        id: number;
        name: string;
        color: string;
    }[];
    threads: number;
}, {
    number: number;
    id: number;
    createdAt: string;
    updatedAt: string;
    status: "active" | "pending" | "closed" | "spam";
    subject: string;
    state: "published" | "draft";
    closedAt: string | null;
    assignee: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
    customer: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    };
    mailbox: {
        id: number;
        name: string;
    };
    tags: {
        id: number;
        name: string;
        color: string;
    }[];
    threads: number;
}>;
export declare const ThreadSchema: z.ZodObject<{
    id: z.ZodNumber;
    type: z.ZodEnum<["customer", "note", "lineitem", "phone", "message"]>;
    status: z.ZodEnum<["active", "pending", "closed", "spam"]>;
    state: z.ZodEnum<["published", "draft", "hidden"]>;
    action: z.ZodNullable<z.ZodObject<{
        type: z.ZodString;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        text: string;
    }, {
        type: string;
        text: string;
    }>>;
    body: z.ZodString;
    source: z.ZodObject<{
        type: z.ZodString;
        via: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        via: string;
    }, {
        type: string;
        via: string;
    }>;
    customer: z.ZodNullable<z.ZodObject<{
        id: z.ZodNumber;
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }>>;
    createdBy: z.ZodNullable<z.ZodObject<{
        id: z.ZodNumber;
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }>>;
    assignedTo: z.ZodNullable<z.ZodObject<{
        id: z.ZodNumber;
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }, {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    }>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    createdAt: string;
    updatedAt: string;
    type: "message" | "customer" | "note" | "lineitem" | "phone";
    status: "active" | "pending" | "closed" | "spam";
    state: "published" | "draft" | "hidden";
    customer: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
    action: {
        type: string;
        text: string;
    } | null;
    body: string;
    source: {
        type: string;
        via: string;
    };
    createdBy: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
    assignedTo: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
}, {
    id: number;
    createdAt: string;
    updatedAt: string;
    type: "message" | "customer" | "note" | "lineitem" | "phone";
    status: "active" | "pending" | "closed" | "spam";
    state: "published" | "draft" | "hidden";
    customer: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
    action: {
        type: string;
        text: string;
    } | null;
    body: string;
    source: {
        type: string;
        via: string;
    };
    createdBy: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
    assignedTo: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    } | null;
}>;
export declare const SearchInboxesInputSchema: z.ZodObject<{
    query: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    cursor?: string | undefined;
}, {
    query?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
}>;
export declare const SearchConversationsInputSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    inboxId: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "pending", "closed", "spam"]>>;
    statuses: z.ZodOptional<z.ZodArray<z.ZodEnum<["active", "pending", "closed", "spam"]>, "many">>;
    createdAfter: z.ZodOptional<z.ZodString>;
    createdBefore: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
    sort: z.ZodDefault<z.ZodEnum<["createdAt", "modifiedAt", "number"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    searchTerms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    searchIn: z.ZodDefault<z.ZodArray<z.ZodEnum<["body", "subject", "both"]>, "many">>;
    timeframeDays: z.ZodDefault<z.ZodNumber>;
    contentTerms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    subjectTerms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    customerEmail: z.ZodOptional<z.ZodString>;
    emailDomain: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeTranscripts: z.ZodDefault<z.ZodBoolean>;
    transcriptMaxMessages: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sort: "number" | "createdAt" | "modifiedAt";
    limit: number;
    order: "asc" | "desc";
    searchIn: ("subject" | "body" | "both")[];
    timeframeDays: number;
    includeTranscripts: boolean;
    transcriptMaxMessages: number;
    status?: "active" | "pending" | "closed" | "spam" | undefined;
    tags?: string[] | undefined;
    query?: string | undefined;
    cursor?: string | undefined;
    inboxId?: string | undefined;
    tag?: string | undefined;
    statuses?: ("active" | "pending" | "closed" | "spam")[] | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    searchTerms?: string[] | undefined;
    contentTerms?: string[] | undefined;
    subjectTerms?: string[] | undefined;
    customerEmail?: string | undefined;
    emailDomain?: string | undefined;
}, {
    sort?: "number" | "createdAt" | "modifiedAt" | undefined;
    status?: "active" | "pending" | "closed" | "spam" | undefined;
    tags?: string[] | undefined;
    query?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
    inboxId?: string | undefined;
    tag?: string | undefined;
    statuses?: ("active" | "pending" | "closed" | "spam")[] | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    order?: "asc" | "desc" | undefined;
    searchTerms?: string[] | undefined;
    searchIn?: ("subject" | "body" | "both")[] | undefined;
    timeframeDays?: number | undefined;
    contentTerms?: string[] | undefined;
    subjectTerms?: string[] | undefined;
    customerEmail?: string | undefined;
    emailDomain?: string | undefined;
    includeTranscripts?: boolean | undefined;
    transcriptMaxMessages?: number | undefined;
}>;
export declare const GetThreadsInputSchema: z.ZodObject<{
    conversationId: z.ZodString;
    format: z.ZodDefault<z.ZodEnum<["full", "transcript"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
    excludeDrafts: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    conversationId: string;
    format: "full" | "transcript";
    excludeDrafts: boolean;
    cursor?: string | undefined;
}, {
    conversationId: string;
    limit?: number | undefined;
    cursor?: string | undefined;
    format?: "full" | "transcript" | undefined;
    excludeDrafts?: boolean | undefined;
}>;
export declare const GetConversationSummaryInputSchema: z.ZodObject<{
    conversationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
}, {
    conversationId: string;
}>;
export declare const StructuredConversationFilterInputSchema: z.ZodEffects<z.ZodObject<{
    assignedTo: z.ZodOptional<z.ZodNumber>;
    folderId: z.ZodOptional<z.ZodNumber>;
    customerIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    conversationNumber: z.ZodOptional<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["active", "pending", "closed", "spam", "all"]>>;
    inboxId: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    createdAfter: z.ZodOptional<z.ZodString>;
    createdBefore: z.ZodOptional<z.ZodString>;
    modifiedSince: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "modifiedAt", "number", "waitingSince", "customerName", "customerEmail", "mailboxId", "status", "subject"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "pending" | "closed" | "spam" | "all";
    limit: number;
    sortBy: "number" | "createdAt" | "status" | "subject" | "modifiedAt" | "customerEmail" | "waitingSince" | "customerName" | "mailboxId";
    sortOrder: "asc" | "desc";
    assignedTo?: number | undefined;
    cursor?: string | undefined;
    inboxId?: string | undefined;
    tag?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    folderId?: number | undefined;
    customerIds?: number[] | undefined;
    conversationNumber?: number | undefined;
    modifiedSince?: string | undefined;
}, {
    status?: "active" | "pending" | "closed" | "spam" | "all" | undefined;
    assignedTo?: number | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
    inboxId?: string | undefined;
    tag?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    folderId?: number | undefined;
    customerIds?: number[] | undefined;
    conversationNumber?: number | undefined;
    modifiedSince?: string | undefined;
    sortBy?: "number" | "createdAt" | "status" | "subject" | "modifiedAt" | "customerEmail" | "waitingSince" | "customerName" | "mailboxId" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>, {
    status: "active" | "pending" | "closed" | "spam" | "all";
    limit: number;
    sortBy: "number" | "createdAt" | "status" | "subject" | "modifiedAt" | "customerEmail" | "waitingSince" | "customerName" | "mailboxId";
    sortOrder: "asc" | "desc";
    assignedTo?: number | undefined;
    cursor?: string | undefined;
    inboxId?: string | undefined;
    tag?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    folderId?: number | undefined;
    customerIds?: number[] | undefined;
    conversationNumber?: number | undefined;
    modifiedSince?: string | undefined;
}, {
    status?: "active" | "pending" | "closed" | "spam" | "all" | undefined;
    assignedTo?: number | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
    inboxId?: string | undefined;
    tag?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    folderId?: number | undefined;
    customerIds?: number[] | undefined;
    conversationNumber?: number | undefined;
    modifiedSince?: string | undefined;
    sortBy?: "number" | "createdAt" | "status" | "subject" | "modifiedAt" | "customerEmail" | "waitingSince" | "customerName" | "mailboxId" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const ServerTimeSchema: z.ZodObject<{
    isoTime: z.ZodString;
    unixTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    isoTime: string;
    unixTime: number;
}, {
    isoTime: string;
    unixTime: number;
}>;
export declare const ErrorSchema: z.ZodObject<{
    code: z.ZodEnum<["INVALID_INPUT", "NOT_FOUND", "UNAUTHORIZED", "RATE_LIMIT", "UPSTREAM_ERROR"]>;
    message: z.ZodString;
    retryAfter: z.ZodOptional<z.ZodNumber>;
    details: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    code: "INVALID_INPUT" | "NOT_FOUND" | "UNAUTHORIZED" | "RATE_LIMIT" | "UPSTREAM_ERROR";
    message: string;
    details: Record<string, unknown>;
    retryAfter?: number | undefined;
}, {
    code: "INVALID_INPUT" | "NOT_FOUND" | "UNAUTHORIZED" | "RATE_LIMIT" | "UPSTREAM_ERROR";
    message: string;
    retryAfter?: number | undefined;
    details?: Record<string, unknown> | undefined;
}>;
export type Inbox = z.infer<typeof InboxSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type SearchInboxesInput = z.infer<typeof SearchInboxesInputSchema>;
export type SearchConversationsInput = z.infer<typeof SearchConversationsInputSchema>;
export type GetThreadsInput = z.infer<typeof GetThreadsInputSchema>;
export type GetConversationSummaryInput = z.infer<typeof GetConversationSummaryInputSchema>;
export type StructuredConversationFilterInput = z.infer<typeof StructuredConversationFilterInputSchema>;
export type ServerTime = z.infer<typeof ServerTimeSchema>;
export type ApiError = z.infer<typeof ErrorSchema>;
export declare const DocsSiteSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    subdomain: z.ZodString;
    cname: z.ZodNullable<z.ZodString>;
    hasPublicSite: z.ZodBoolean;
    redirDomain: z.ZodNullable<z.ZodString>;
    autoSaveDrafts: z.ZodBoolean;
    logoUrl: z.ZodNullable<z.ZodString>;
    logoWidth: z.ZodNullable<z.ZodString>;
    logoHeight: z.ZodNullable<z.ZodString>;
    status: z.ZodString;
    createdBy: z.ZodNumber;
    updatedBy: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string | null;
    status: string;
    createdBy: number;
    subdomain: string;
    cname: string | null;
    hasPublicSite: boolean;
    redirDomain: string | null;
    autoSaveDrafts: boolean;
    logoUrl: string | null;
    logoWidth: string | null;
    logoHeight: string | null;
    updatedBy: number | null;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string | null;
    status: string;
    createdBy: number;
    subdomain: string;
    cname: string | null;
    hasPublicSite: boolean;
    redirDomain: string | null;
    autoSaveDrafts: boolean;
    logoUrl: string | null;
    logoWidth: string | null;
    logoHeight: string | null;
    updatedBy: number | null;
}>;
export declare const DocsCollectionSchema: z.ZodObject<{
    id: z.ZodString;
    siteId: z.ZodString;
    number: z.ZodNumber;
    slug: z.ZodString;
    visibility: z.ZodEnum<["public", "private"]>;
    order: z.ZodNumber;
    name: z.ZodString;
    description: z.ZodString;
    publicUrl: z.ZodString;
    articleCount: z.ZodNumber;
    publishedArticleCount: z.ZodNumber;
    createdBy: z.ZodNumber;
    updatedBy: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    number: number;
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string | null;
    createdBy: number;
    order: number;
    updatedBy: number | null;
    siteId: string;
    visibility: "public" | "private";
    description: string;
    publicUrl: string;
    articleCount: number;
    publishedArticleCount: number;
}, {
    number: number;
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string | null;
    createdBy: number;
    order: number;
    updatedBy: number | null;
    siteId: string;
    visibility: "public" | "private";
    description: string;
    publicUrl: string;
    articleCount: number;
    publishedArticleCount: number;
}>;
export declare const DocsCategorySchema: z.ZodObject<{
    id: z.ZodString;
    collectionId: z.ZodString;
    number: z.ZodNumber;
    slug: z.ZodString;
    visibility: z.ZodEnum<["public", "private"]>;
    order: z.ZodNumber;
    name: z.ZodString;
    description: z.ZodString;
    publicUrl: z.ZodString;
    articleCount: z.ZodNumber;
    publishedArticleCount: z.ZodNumber;
    createdBy: z.ZodNumber;
    updatedBy: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    number: number;
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string | null;
    createdBy: number;
    order: number;
    updatedBy: number | null;
    visibility: "public" | "private";
    description: string;
    publicUrl: string;
    articleCount: number;
    publishedArticleCount: number;
    collectionId: string;
}, {
    number: number;
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string | null;
    createdBy: number;
    order: number;
    updatedBy: number | null;
    visibility: "public" | "private";
    description: string;
    publicUrl: string;
    articleCount: number;
    publishedArticleCount: number;
    collectionId: string;
}>;
export declare const DocsArticleRefSchema: z.ZodObject<{
    id: z.ZodString;
    number: z.ZodNumber;
    collectionId: z.ZodString;
    status: z.ZodString;
    hasDraft: z.ZodBoolean;
    name: z.ZodString;
    publicUrl: z.ZodString;
    popularity: z.ZodNumber;
    viewCount: z.ZodNumber;
    createdBy: z.ZodNumber;
    updatedBy: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    number: number;
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string | null;
    status: string;
    createdBy: number;
    updatedBy: number | null;
    publicUrl: string;
    collectionId: string;
    hasDraft: boolean;
    popularity: number;
    viewCount: number;
}, {
    number: number;
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string | null;
    status: string;
    createdBy: number;
    updatedBy: number | null;
    publicUrl: string;
    collectionId: string;
    hasDraft: boolean;
    popularity: number;
    viewCount: number;
}>;
export declare const DocsArticleSchema: z.ZodObject<{
    id: z.ZodString;
    number: z.ZodNumber;
    collectionId: z.ZodString;
    slug: z.ZodString;
    status: z.ZodString;
    hasDraft: z.ZodBoolean;
    name: z.ZodString;
    text: z.ZodString;
    categories: z.ZodArray<z.ZodString, "many">;
    related: z.ZodArray<z.ZodString, "many">;
    publicUrl: z.ZodString;
    popularity: z.ZodNumber;
    viewCount: z.ZodNumber;
    createdBy: z.ZodNumber;
    updatedBy: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    number: number;
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string | null;
    status: string;
    text: string;
    createdBy: number;
    updatedBy: number | null;
    publicUrl: string;
    collectionId: string;
    hasDraft: boolean;
    popularity: number;
    viewCount: number;
    categories: string[];
    related: string[];
}, {
    number: number;
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string | null;
    status: string;
    text: string;
    createdBy: number;
    updatedBy: number | null;
    publicUrl: string;
    collectionId: string;
    hasDraft: boolean;
    popularity: number;
    viewCount: number;
    categories: string[];
    related: string[];
}>;
export declare const ListDocsSitesInputSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
}, {
    page?: number | undefined;
}>;
export declare const ListDocsCollectionsInputSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    siteId: z.ZodOptional<z.ZodString>;
    visibility: z.ZodDefault<z.ZodEnum<["all", "public", "private"]>>;
    sort: z.ZodDefault<z.ZodEnum<["number", "visibility", "order", "name", "createdAt", "updatedAt"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    sort: "number" | "name" | "createdAt" | "updatedAt" | "order" | "visibility";
    order: "asc" | "desc";
    visibility: "all" | "public" | "private";
    page: number;
    siteId?: string | undefined;
}, {
    sort?: "number" | "name" | "createdAt" | "updatedAt" | "order" | "visibility" | undefined;
    order?: "asc" | "desc" | undefined;
    siteId?: string | undefined;
    visibility?: "all" | "public" | "private" | undefined;
    page?: number | undefined;
}>;
export declare const ListDocsCategoriesInputSchema: z.ZodObject<{
    collectionId: z.ZodString;
    page: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodDefault<z.ZodEnum<["number", "order", "name", "articleCount", "createdAt", "updatedAt"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    sort: "number" | "name" | "createdAt" | "updatedAt" | "order" | "articleCount";
    order: "asc" | "desc";
    collectionId: string;
    page: number;
}, {
    collectionId: string;
    sort?: "number" | "name" | "createdAt" | "updatedAt" | "order" | "articleCount" | undefined;
    order?: "asc" | "desc" | undefined;
    page?: number | undefined;
}>;
export declare const ListDocsArticlesInputSchema: z.ZodObject<{
    collectionId: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["all", "published", "notpublished"]>>;
    sort: z.ZodDefault<z.ZodEnum<["number", "status", "name", "popularity", "createdAt", "updatedAt"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    pageSize: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sort: "number" | "name" | "createdAt" | "updatedAt" | "status" | "popularity";
    status: "published" | "all" | "notpublished";
    order: "asc" | "desc";
    page: number;
    pageSize: number;
    collectionId?: string | undefined;
    categoryId?: string | undefined;
}, {
    sort?: "number" | "name" | "createdAt" | "updatedAt" | "status" | "popularity" | undefined;
    status?: "published" | "all" | "notpublished" | undefined;
    order?: "asc" | "desc" | undefined;
    collectionId?: string | undefined;
    page?: number | undefined;
    categoryId?: string | undefined;
    pageSize?: number | undefined;
}>;
export declare const GetDocsArticleInputSchema: z.ZodObject<{
    articleId: z.ZodString;
    draft: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    draft: boolean;
    articleId: string;
}, {
    articleId: string;
    draft?: boolean | undefined;
}>;
export declare const UpdateDocsArticleInputSchema: z.ZodObject<{
    articleId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    articleId: string;
    name?: string | undefined;
    status?: string | undefined;
    text?: string | undefined;
    categories?: string[] | undefined;
    related?: string[] | undefined;
}, {
    articleId: string;
    name?: string | undefined;
    status?: string | undefined;
    text?: string | undefined;
    categories?: string[] | undefined;
    related?: string[] | undefined;
}>;
export declare const UpdateDocsCollectionInputSchema: z.ZodObject<{
    collectionId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodEnum<["public", "private"]>>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    collectionId: string;
    name?: string | undefined;
    order?: number | undefined;
    visibility?: "public" | "private" | undefined;
    description?: string | undefined;
}, {
    collectionId: string;
    name?: string | undefined;
    order?: number | undefined;
    visibility?: "public" | "private" | undefined;
    description?: string | undefined;
}>;
export declare const UpdateDocsCategoryInputSchema: z.ZodObject<{
    categoryId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodEnum<["public", "private"]>>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    name?: string | undefined;
    order?: number | undefined;
    visibility?: "public" | "private" | undefined;
    description?: string | undefined;
}, {
    categoryId: string;
    name?: string | undefined;
    order?: number | undefined;
    visibility?: "public" | "private" | undefined;
    description?: string | undefined;
}>;
export declare const CreateReplyInputSchema: z.ZodObject<{
    conversationId: z.ZodString;
    text: z.ZodString;
    customer: z.ZodUnion<[z.ZodObject<{
        id: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: number;
    }, {
        id: number;
    }>, z.ZodObject<{
        email: z.ZodString;
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
    }, {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
    }>]>;
    draft: z.ZodDefault<z.ZodBoolean>;
    user: z.ZodOptional<z.ZodNumber>;
    assignTo: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["active", "closed", "open", "pending", "spam"]>>;
    cc: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    bcc: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    draft: boolean;
    customer: {
        id: number;
    } | {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
    };
    text: string;
    conversationId: string;
    status?: "active" | "pending" | "closed" | "spam" | "open" | undefined;
    user?: number | undefined;
    assignTo?: number | undefined;
    cc?: string[] | undefined;
    bcc?: string[] | undefined;
}, {
    customer: {
        id: number;
    } | {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
    };
    text: string;
    conversationId: string;
    status?: "active" | "pending" | "closed" | "spam" | "open" | undefined;
    draft?: boolean | undefined;
    user?: number | undefined;
    assignTo?: number | undefined;
    cc?: string[] | undefined;
    bcc?: string[] | undefined;
}>;
export type CreateReplyInput = z.infer<typeof CreateReplyInputSchema>;
export declare const CreateNoteInputSchema: z.ZodObject<{
    conversationId: z.ZodString;
    text: z.ZodString;
    user: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["active", "closed", "open", "pending", "spam"]>>;
}, "strip", z.ZodTypeAny, {
    text: string;
    conversationId: string;
    status?: "active" | "pending" | "closed" | "spam" | "open" | undefined;
    user?: number | undefined;
}, {
    text: string;
    conversationId: string;
    status?: "active" | "pending" | "closed" | "spam" | "open" | undefined;
    user?: number | undefined;
}>;
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
export declare const GetConversationInputSchema: z.ZodObject<{
    conversationId: z.ZodString;
    embed: z.ZodOptional<z.ZodArray<z.ZodEnum<["threads"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    embed?: "threads"[] | undefined;
}, {
    conversationId: string;
    embed?: "threads"[] | undefined;
}>;
export type GetConversationInput = z.infer<typeof GetConversationInputSchema>;
export declare const CreateConversationInputSchema: z.ZodObject<{
    subject: z.ZodString;
    type: z.ZodEnum<["email", "phone", "chat"]>;
    mailboxId: z.ZodNumber;
    customer: z.ZodUnion<[z.ZodObject<{
        id: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: number;
    }, {
        id: number;
    }>, z.ZodObject<{
        email: z.ZodString;
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
    }, {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
    }>]>;
    threads: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["customer", "note", "message"]>;
        text: z.ZodString;
        customer: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            id: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: number;
        }, {
            id: number;
        }>, z.ZodObject<{
            email: z.ZodString;
            firstName: z.ZodOptional<z.ZodString>;
            lastName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            email: string;
            firstName?: string | undefined;
            lastName?: string | undefined;
        }, {
            email: string;
            firstName?: string | undefined;
            lastName?: string | undefined;
        }>]>>;
        draft: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "message" | "customer" | "note";
        text: string;
        draft?: boolean | undefined;
        customer?: {
            id: number;
        } | {
            email: string;
            firstName?: string | undefined;
            lastName?: string | undefined;
        } | undefined;
    }, {
        type: "message" | "customer" | "note";
        text: string;
        draft?: boolean | undefined;
        customer?: {
            id: number;
        } | {
            email: string;
            firstName?: string | undefined;
            lastName?: string | undefined;
        } | undefined;
    }>, "many">;
    status: z.ZodDefault<z.ZodEnum<["active", "pending", "closed"]>>;
    assignTo: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    imported: z.ZodOptional<z.ZodBoolean>;
    autoReply: z.ZodOptional<z.ZodBoolean>;
    user: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "email" | "phone" | "chat";
    status: "active" | "pending" | "closed";
    subject: string;
    customer: {
        id: number;
    } | {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
    };
    threads: {
        type: "message" | "customer" | "note";
        text: string;
        draft?: boolean | undefined;
        customer?: {
            id: number;
        } | {
            email: string;
            firstName?: string | undefined;
            lastName?: string | undefined;
        } | undefined;
    }[];
    mailboxId: number;
    createdAt?: string | undefined;
    tags?: string[] | undefined;
    user?: number | undefined;
    assignTo?: number | undefined;
    imported?: boolean | undefined;
    autoReply?: boolean | undefined;
}, {
    type: "email" | "phone" | "chat";
    subject: string;
    customer: {
        id: number;
    } | {
        email: string;
        firstName?: string | undefined;
        lastName?: string | undefined;
    };
    threads: {
        type: "message" | "customer" | "note";
        text: string;
        draft?: boolean | undefined;
        customer?: {
            id: number;
        } | {
            email: string;
            firstName?: string | undefined;
            lastName?: string | undefined;
        } | undefined;
    }[];
    mailboxId: number;
    createdAt?: string | undefined;
    status?: "active" | "pending" | "closed" | undefined;
    tags?: string[] | undefined;
    user?: number | undefined;
    assignTo?: number | undefined;
    imported?: boolean | undefined;
    autoReply?: boolean | undefined;
}>;
export type CreateConversationInput = z.infer<typeof CreateConversationInputSchema>;
export declare const UpdateConversationInputSchema: z.ZodEffects<z.ZodObject<{
    conversationId: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "pending", "closed", "spam"]>>;
    assignTo: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodNull]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    customFields: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        value: string;
    }, {
        id: number;
        value: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    status?: "active" | "pending" | "closed" | "spam" | undefined;
    subject?: string | undefined;
    tags?: string[] | undefined;
    assignTo?: number | null | undefined;
    customFields?: {
        id: number;
        value: string;
    }[] | undefined;
}, {
    conversationId: string;
    status?: "active" | "pending" | "closed" | "spam" | undefined;
    subject?: string | undefined;
    tags?: string[] | undefined;
    assignTo?: number | null | undefined;
    customFields?: {
        id: number;
        value: string;
    }[] | undefined;
}>, {
    conversationId: string;
    status?: "active" | "pending" | "closed" | "spam" | undefined;
    subject?: string | undefined;
    tags?: string[] | undefined;
    assignTo?: number | null | undefined;
    customFields?: {
        id: number;
        value: string;
    }[] | undefined;
}, {
    conversationId: string;
    status?: "active" | "pending" | "closed" | "spam" | undefined;
    subject?: string | undefined;
    tags?: string[] | undefined;
    assignTo?: number | null | undefined;
    customFields?: {
        id: number;
        value: string;
    }[] | undefined;
}>;
export type UpdateConversationInput = z.infer<typeof UpdateConversationInputSchema>;
export type DocsSite = z.infer<typeof DocsSiteSchema>;
export type DocsCollection = z.infer<typeof DocsCollectionSchema>;
export type DocsCategory = z.infer<typeof DocsCategorySchema>;
export type DocsArticleRef = z.infer<typeof DocsArticleRefSchema>;
export type DocsArticle = z.infer<typeof DocsArticleSchema>;
export type ListDocsSitesInput = z.infer<typeof ListDocsSitesInputSchema>;
export type ListDocsCollectionsInput = z.infer<typeof ListDocsCollectionsInputSchema>;
export type ListDocsCategoriesInput = z.infer<typeof ListDocsCategoriesInputSchema>;
export type ListDocsArticlesInput = z.infer<typeof ListDocsArticlesInputSchema>;
export type GetDocsArticleInput = z.infer<typeof GetDocsArticleInputSchema>;
export type UpdateDocsArticleInput = z.infer<typeof UpdateDocsArticleInputSchema>;
export type UpdateDocsCollectionInput = z.infer<typeof UpdateDocsCollectionInputSchema>;
export type UpdateDocsCategoryInput = z.infer<typeof UpdateDocsCategoryInputSchema>;
//# sourceMappingURL=types.d.ts.map