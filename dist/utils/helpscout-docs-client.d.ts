import { AxiosError } from 'axios';
import FormData from 'form-data';
interface RequestMetadata {
    requestId: string;
    startTime: number;
}
interface RetryConfig {
    retries: number;
    retryDelay: number;
    maxRetryDelay: number;
    retryCondition?: (error: AxiosError) => boolean;
}
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        metadata?: RequestMetadata;
        retryConfig?: RetryConfig;
    }
}
/**
 * Connection pool configuration for HTTP agents
 */
interface ConnectionPoolConfig {
    maxSockets: number;
    maxFreeSockets: number;
    timeout: number;
    keepAlive: boolean;
    keepAliveMsecs: number;
}
export interface DocsPageInfo {
    page: number;
    pages: number;
    count: number;
}
export interface DocsPaginatedResponse<T> {
    page: number;
    pages: number;
    count: number;
    items: T[];
}
export declare class HelpScoutDocsClient {
    private client;
    private apiKey;
    private httpAgent;
    private httpsAgent;
    private defaultRetryConfig;
    constructor(poolConfig?: Partial<ConnectionPoolConfig>);
    private sleep;
    private calculateRetryDelay;
    private executeWithRetry;
    private setupInterceptors;
    private ensureAuthenticated;
    private transformError;
    get<T>(endpoint: string, params?: Record<string, unknown>, cacheOptions?: {
        ttl?: number;
    }): Promise<T>;
    private getDefaultCacheTtl;
    testConnection(): Promise<boolean>;
    /**
     * Get connection pool statistics for monitoring
     */
    getPoolStats(): {
        http: {
            sockets: number;
            freeSockets: number;
            pending: number;
        };
        https: {
            sockets: number;
            freeSockets: number;
            pending: number;
        };
    };
    /**
     * Gracefully close all connections in the pool
     */
    closePool(): Promise<void>;
    /**
     * Clear idle connections to free up resources
     */
    clearIdleConnections(): void;
    /**
     * Log current connection pool status for monitoring
     */
    logPoolStatus(): void;
    /**
     * Get the Docs API key (ensures authentication first).
     */
    getApiKey(): Promise<string>;
    /**
     * Post multipart/form-data to the Help Scout Docs API.
     * Used for file uploads (article assets, settings assets, article uploads).
     * @param endpoint The API endpoint
     * @param formData The FormData instance to send
     * @returns Promise with the response data
     */
    postFormData<T>(endpoint: string, formData: FormData): Promise<T>;
    /**
     * Update a resource in the Help Scout Docs API
     * @param endpoint The API endpoint to update
     * @param data The data to send in the request body
     * @returns Promise with the updated resource
     */
    update<T>(endpoint: string, data: Record<string, unknown>): Promise<T>;
    /**
     * Create a resource in the Help Scout Docs API
     * @param endpoint The API endpoint to create at
     * @param data The data to send in the request body
     * @returns Promise with the created resource
     */
    create<T>(endpoint: string, data: Record<string, unknown>): Promise<T>;
    /**
     * Delete a resource in the Help Scout Docs API
     * @param endpoint The API endpoint to delete
     * @param requireConfirmation Whether to require explicit confirmation flag
     * @returns Promise<void>
     * @throws Error if deletion is attempted without proper confirmation
     */
    delete(endpoint: string, requireConfirmation?: boolean): Promise<void>;
}
export declare const helpScoutDocsClient: HelpScoutDocsClient;
export {};
//# sourceMappingURL=helpscout-docs-client.d.ts.map