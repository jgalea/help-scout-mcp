export interface Config {
    helpscout: {
        apiKey: string;
        clientId?: string;
        clientSecret?: string;
        baseUrl: string;
        defaultInboxId?: string;
        docsApiKey?: string;
        docsBaseUrl?: string;
        allowDocsDelete?: boolean;
        defaultDocsCollectionId?: string;
        defaultDocsSiteId?: string;
        disableDocs?: boolean;
        replySpacing?: 'compact' | 'relaxed';
        allowSendReply?: boolean;
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
        verbose: boolean;
    };
    connectionPool: {
        maxSockets: number;
        maxFreeSockets: number;
        timeout: number;
        keepAlive: boolean;
        keepAliveMsecs: number;
    };
}
export declare const config: Config;
/**
 * Resolve whether a tool call should return verbose (full API) responses.
 * Per-tool `verbose` param overrides the global HELPSCOUT_VERBOSE_RESPONSES env var.
 */
export declare function isVerbose(args: unknown): boolean;
export declare function validateConfig(): void;
//# sourceMappingURL=config.d.ts.map