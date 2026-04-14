import axios from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { config } from './config.js';
import { logger } from './logger.js';
import { cache } from './cache.js';
/**
 * Default connection pool settings optimized for Help Scout Docs API
 */
const DEFAULT_POOL_CONFIG = {
    maxSockets: 20, // Lower than main API due to different rate limits
    maxFreeSockets: 5, // Lower idle connections
    timeout: 30000, // Socket timeout (30s)
    keepAlive: true, // Enable HTTP keep-alive
    keepAliveMsecs: 1000, // Keep-alive probe interval
};
export class HelpScoutDocsClient {
    constructor(poolConfig = {}) {
        this.apiKey = null;
        this.defaultRetryConfig = {
            retries: 3,
            retryDelay: 1000, // 1 second
            maxRetryDelay: 10000, // 10 seconds
            retryCondition: (error) => {
                // Retry on network errors, timeouts, and 5xx responses
                return !error.response ||
                    error.code === 'ECONNABORTED' ||
                    (error.response.status >= 500 && error.response.status < 600) ||
                    error.response.status === 429; // Rate limits
            }
        };
        // Merge default pool config with any custom settings
        const finalPoolConfig = { ...DEFAULT_POOL_CONFIG, ...poolConfig };
        // Create HTTP agents with connection pooling
        this.httpAgent = new HttpAgent({
            keepAlive: finalPoolConfig.keepAlive,
            keepAliveMsecs: finalPoolConfig.keepAliveMsecs,
            maxSockets: finalPoolConfig.maxSockets,
            maxFreeSockets: finalPoolConfig.maxFreeSockets,
            timeout: finalPoolConfig.timeout,
        });
        this.httpsAgent = new HttpsAgent({
            keepAlive: finalPoolConfig.keepAlive,
            keepAliveMsecs: finalPoolConfig.keepAliveMsecs,
            maxSockets: finalPoolConfig.maxSockets,
            maxFreeSockets: finalPoolConfig.maxFreeSockets,
            timeout: finalPoolConfig.timeout,
        });
        // Create Axios instance with connection pooling agents
        this.client = axios.create({
            baseURL: config.helpscout.docsBaseUrl || 'https://docsapi.helpscout.net/v1/',
            timeout: 30000,
            httpAgent: this.httpAgent,
            httpsAgent: this.httpsAgent,
            // Additional connection optimizations
            maxRedirects: 5,
            validateStatus: (status) => status < 500, // Don't throw on 4xx errors, handle them in transformError
        });
        this.setupInterceptors();
        logger.info('Help Scout Docs HTTP connection pool initialized', {
            maxSockets: finalPoolConfig.maxSockets,
            maxFreeSockets: finalPoolConfig.maxFreeSockets,
            keepAlive: finalPoolConfig.keepAlive,
            timeout: finalPoolConfig.timeout,
        });
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    calculateRetryDelay(attempt, baseDelay, maxDelay) {
        // Exponential backoff with jitter
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
        return Math.min(exponentialDelay + jitter, maxDelay);
    }
    async executeWithRetry(operation, retryConfig = this.defaultRetryConfig) {
        let lastError;
        for (let attempt = 0; attempt <= retryConfig.retries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                // Don't retry if it's the last attempt
                if (attempt === retryConfig.retries) {
                    break;
                }
                // Check if we should retry this error
                if (!retryConfig.retryCondition?.(lastError)) {
                    break;
                }
                // Handle rate limits specially
                if (lastError.response?.status === 429) {
                    const retryAfter = parseInt(lastError.response.headers['retry-after'] || '60', 10) * 1000;
                    const delay = Math.min(retryAfter, retryConfig.maxRetryDelay);
                    logger.warn('Docs API rate limit hit, waiting before retry', {
                        attempt: attempt + 1,
                        retryAfter: delay,
                        requestId: lastError.config?.metadata?.requestId,
                    });
                    await this.sleep(delay);
                }
                else {
                    // Standard exponential backoff
                    const delay = this.calculateRetryDelay(attempt, retryConfig.retryDelay, retryConfig.maxRetryDelay);
                    logger.warn('Docs API request failed, retrying', {
                        attempt: attempt + 1,
                        totalAttempts: retryConfig.retries + 1,
                        delay,
                        error: lastError.message,
                        status: lastError.response?.status,
                        requestId: lastError.config?.metadata?.requestId,
                    });
                    await this.sleep(delay);
                }
            }
        }
        // lastError should always be defined here since we only reach this point after catching an error
        throw lastError || new Error('Request failed without error details');
    }
    setupInterceptors() {
        // Request interceptor for authentication
        this.client.interceptors.request.use(async (config) => {
            await this.ensureAuthenticated();
            // Help Scout Docs API uses Basic Auth with API key as username
            if (this.apiKey) {
                config.auth = {
                    username: this.apiKey,
                    password: 'X', // Dummy password as per docs
                };
            }
            const requestId = Math.random().toString(36).substring(7);
            config.metadata = { requestId, startTime: Date.now() };
            logger.debug('Docs API request', {
                requestId,
                method: config.method?.toUpperCase(),
                url: config.url,
            });
            return config;
        });
        // Response interceptor for logging and error handling
        this.client.interceptors.response.use((response) => {
            const duration = response.config.metadata ? Date.now() - response.config.metadata.startTime : 0;
            logger.debug('Docs API response', {
                requestId: response.config.metadata?.requestId || 'unknown',
                status: response.status,
                duration,
            });
            return response;
        }, (error) => {
            const duration = error.config?.metadata ? Date.now() - error.config.metadata.startTime : 0;
            const requestId = error.config?.metadata?.requestId || 'unknown';
            logger.error('Docs API error', {
                requestId,
                status: error.response?.status,
                message: error.message,
                duration,
            });
            return Promise.reject(this.transformError(error));
        });
    }
    async ensureAuthenticated() {
        // Check if we have a Docs API key configured
        if (!this.apiKey) {
            this.apiKey = config.helpscout.docsApiKey || null;
            if (!this.apiKey) {
                throw new Error('Help Scout Docs API key not configured. ' +
                    'Set HELPSCOUT_DOCS_API_KEY environment variable.');
            }
            logger.info('Using Help Scout Docs API key for authentication');
        }
    }
    transformError(error) {
        const requestId = error.config?.metadata?.requestId || 'unknown';
        const url = error.config?.url;
        const method = error.config?.method?.toUpperCase();
        if (error.response?.status === 401) {
            return {
                code: 'UNAUTHORIZED',
                message: 'Help Scout Docs authentication failed. Please check your Docs API key.',
                details: {
                    requestId,
                    url,
                    method,
                    suggestion: 'Verify HELPSCOUT_DOCS_API_KEY is valid',
                },
            };
        }
        if (error.response?.status === 403) {
            return {
                code: 'UNAUTHORIZED',
                message: 'Access forbidden. Insufficient permissions for this Help Scout Docs resource.',
                details: {
                    requestId,
                    url,
                    method,
                    suggestion: 'Check if your Docs API key has access to this site or collection',
                },
            };
        }
        if (error.response?.status === 404) {
            return {
                code: 'NOT_FOUND',
                message: 'Help Scout Docs resource not found. The requested article, collection, or category does not exist.',
                details: {
                    requestId,
                    url,
                    method,
                    suggestion: 'Verify the ID is correct and the resource exists',
                },
            };
        }
        if (error.response?.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
            return {
                code: 'RATE_LIMIT',
                message: `Help Scout Docs API rate limit exceeded. Please wait ${retryAfter} ${retryAfter === 1 ? 'second' : 'seconds'} before retrying.`,
                retryAfter,
                details: {
                    requestId,
                    url,
                    method,
                    suggestion: 'Reduce request frequency or implement request batching',
                },
            };
        }
        if (error.response?.status === 422) {
            const responseData = error.response.data || {};
            return {
                code: 'INVALID_INPUT',
                message: `Help Scout Docs API validation error: ${responseData.message || 'Invalid request data'}`,
                details: {
                    requestId,
                    url,
                    method,
                    validationErrors: responseData.errors || responseData,
                    suggestion: 'Check the request parameters match Help Scout Docs API requirements',
                },
            };
        }
        if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
            const responseData = error.response.data || {};
            return {
                code: 'INVALID_INPUT',
                message: `Help Scout Docs API client error: ${responseData.message || 'Invalid request'}`,
                details: {
                    requestId,
                    url,
                    method,
                    statusCode: error.response.status,
                    apiResponse: responseData,
                },
            };
        }
        if (error.code === 'ECONNABORTED') {
            return {
                code: 'UPSTREAM_ERROR',
                message: 'Help Scout Docs API request timed out. The service may be experiencing high load.',
                details: {
                    requestId,
                    url,
                    method,
                    errorCode: error.code,
                    suggestion: 'Request will be automatically retried with exponential backoff',
                },
            };
        }
        if (error.response?.status && error.response.status >= 500) {
            return {
                code: 'UPSTREAM_ERROR',
                message: `Help Scout Docs API server error (${error.response.status}). The service is temporarily unavailable.`,
                details: {
                    requestId,
                    url,
                    method,
                    statusCode: error.response.status,
                    suggestion: 'Request will be automatically retried with exponential backoff',
                },
            };
        }
        return {
            code: 'UPSTREAM_ERROR',
            message: `Help Scout Docs API error: ${error.message || 'Unknown upstream service error'}`,
            details: {
                requestId,
                url,
                method,
                errorCode: error.code,
                suggestion: 'Check your network connection and Help Scout Docs service status',
            },
        };
    }
    async get(endpoint, params, cacheOptions) {
        const cacheKey = `DOCS:GET:${endpoint}`;
        const cachedResult = cache.get(cacheKey, params);
        if (cachedResult) {
            return cachedResult;
        }
        const response = await this.executeWithRetry(() => this.client.get(endpoint, { params }));
        // Handle different response structures from the Docs API
        let data = response.data;
        // Log the response structure for debugging
        logger.debug('Docs API response structure', {
            endpoint,
            hasData: !!data,
            dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
            hasItems: data && typeof data === 'object' && 'items' in data,
            hasCollections: data && typeof data === 'object' && 'collections' in data,
            hasSites: data && typeof data === 'object' && 'sites' in data,
        });
        // The collections endpoint wraps the response in a 'collections' object
        if (endpoint === '/collections' && data && typeof data === 'object' && 'collections' in data) {
            logger.debug('Unwrapping collections response');
            data = data.collections;
        }
        // The sites endpoint might wrap the response in a 'sites' object OR already be properly structured
        if (endpoint === '/sites' && data && typeof data === 'object') {
            logger.debug('Sites endpoint response', {
                hasSites: 'sites' in data,
                hasItems: 'items' in data,
                hasPage: 'page' in data,
                hasPages: 'pages' in data,
                hasCount: 'count' in data,
                dataKeys: Object.keys(data),
            });
            // If it already has the correct paginated structure, leave it alone
            if ('items' in data && 'page' in data && 'pages' in data && 'count' in data) {
                logger.debug('Sites response already has correct paginated structure');
                // Data is already in the correct format, no unwrapping needed
            }
            // If it has a 'sites' property, unwrap it
            else if ('sites' in data) {
                logger.debug('Unwrapping sites response', {
                    sitesType: Array.isArray(data.sites) ? 'array' : typeof data.sites,
                    sitesLength: Array.isArray(data.sites) ? data.sites.length : 'N/A'
                });
                const unwrappedData = data;
                // If the response has both sites array and pagination info, restructure it
                if (Array.isArray(unwrappedData.sites)) {
                    data = {
                        items: unwrappedData.sites,
                        page: unwrappedData.page || 1,
                        pages: unwrappedData.pages || 1,
                        count: unwrappedData.count || unwrappedData.sites.length
                    };
                }
                else if (unwrappedData.sites && typeof unwrappedData.sites === 'object') {
                    // If sites is an object with items inside
                    data = unwrappedData.sites;
                }
            }
        }
        // The categories endpoint might wrap the response in a 'categories' object
        if (endpoint.includes('/categories') && data && typeof data === 'object' && 'categories' in data) {
            logger.debug('Unwrapping categories response');
            data = data.categories;
        }
        // The articles endpoint might wrap the response in an 'articles' object (list)
        // or an 'article' object (single)
        if (endpoint.includes('/articles') && data && typeof data === 'object') {
            if ('articles' in data) {
                logger.debug('Unwrapping articles (plural) response');
                data = data.articles;
            }
            else if ('article' in data) {
                logger.debug('Unwrapping article (singular) response');
                data = data.article;
            }
        }
        if (cacheOptions?.ttl || cacheOptions?.ttl === 0) {
            cache.set(cacheKey, params, data, { ttl: cacheOptions.ttl });
        }
        else {
            // Default cache TTL based on endpoint
            const defaultTtl = this.getDefaultCacheTtl(endpoint);
            cache.set(cacheKey, params, data, { ttl: defaultTtl });
        }
        return data;
    }
    getDefaultCacheTtl(endpoint) {
        if (endpoint.includes('/articles'))
            return 600; // 10 minutes for articles
        if (endpoint.includes('/collections'))
            return 1440; // 24 hours for collections
        if (endpoint.includes('/categories'))
            return 1440; // 24 hours for categories
        if (endpoint.includes('/sites'))
            return 1440; // 24 hours for sites
        return 600; // Default 10 minutes
    }
    async testConnection() {
        try {
            // Try to get sites first as the most basic test
            const response = await this.get('/sites', { page: 1 });
            logger.info('Docs API connection test', {
                success: true,
                siteCount: response.items?.length || 0,
                hasItems: !!response.items
            });
            return true;
        }
        catch (error) {
            logger.error('Docs connection test failed', {
                error: error instanceof Error ? error.message : String(error),
                errorCode: error.code,
                status: error.response?.status
            });
            return false;
        }
    }
    /**
     * Get connection pool statistics for monitoring
     */
    getPoolStats() {
        return {
            http: {
                sockets: Object.keys(this.httpAgent.sockets).length,
                freeSockets: Object.keys(this.httpAgent.freeSockets).length,
                pending: Object.keys(this.httpAgent.requests).length,
            },
            https: {
                sockets: Object.keys(this.httpsAgent.sockets).length,
                freeSockets: Object.keys(this.httpsAgent.freeSockets).length,
                pending: Object.keys(this.httpsAgent.requests).length,
            },
        };
    }
    /**
     * Gracefully close all connections in the pool
     */
    async closePool() {
        logger.info('Closing Docs HTTP connection pool');
        // Agent.destroy() is synchronous and immediately closes connections
        this.httpAgent.destroy();
        this.httpsAgent.destroy();
        // Give a small delay to ensure connections are cleaned up
        await this.sleep(100);
        logger.info('All Docs HTTP connections closed');
    }
    /**
     * Clear idle connections to free up resources
     */
    clearIdleConnections() {
        const stats = this.getPoolStats();
        // Force destroy all agent connections by recreating them
        this.httpAgent.destroy();
        this.httpsAgent.destroy();
        // Recreate agents with same configuration
        const poolConfig = {
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 20,
            maxFreeSockets: 5,
            timeout: 30000,
        };
        this.httpAgent = new HttpAgent(poolConfig);
        this.httpsAgent = new HttpsAgent(poolConfig);
        logger.debug('Cleared Docs idle connections', {
            clearedHttp: stats.http.freeSockets,
            clearedHttps: stats.https.freeSockets,
        });
    }
    /**
     * Log current connection pool status for monitoring
     */
    logPoolStatus() {
        const stats = this.getPoolStats();
        logger.debug('Docs connection pool status', stats);
    }
    /**
     * Get the Docs API key (ensures authentication first).
     */
    async getApiKey() {
        await this.ensureAuthenticated();
        if (!this.apiKey) {
            throw new Error('Help Scout Docs API key not configured.');
        }
        return this.apiKey;
    }
    /**
     * Post multipart/form-data to the Help Scout Docs API.
     * Used for file uploads (article assets, settings assets, article uploads).
     * @param endpoint The API endpoint
     * @param formData The FormData instance to send
     * @returns Promise with the response data
     */
    async postFormData(endpoint, formData) {
        await this.ensureAuthenticated();
        const response = await this.executeWithRetry(() => this.client.post(endpoint, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        }));
        return response.data;
    }
    /**
     * Update a resource in the Help Scout Docs API
     * @param endpoint The API endpoint to update
     * @param data The data to send in the request body
     * @returns Promise with the updated resource
     */
    async update(endpoint, data) {
        const response = await this.executeWithRetry(() => this.client.put(endpoint, data));
        // Clear cache for this endpoint after update
        const cacheKey = `DOCS:GET:${endpoint}`;
        cache.clear(cacheKey);
        return response.data;
    }
    /**
     * Create a resource in the Help Scout Docs API
     * @param endpoint The API endpoint to create at
     * @param data The data to send in the request body
     * @returns Promise with the created resource
     */
    async create(endpoint, data) {
        const response = await this.executeWithRetry(() => this.client.post(endpoint, data));
        // Clear cache for the parent collection endpoint
        const parentEndpoint = endpoint.substring(0, endpoint.lastIndexOf('/'));
        const cacheKey = `DOCS:GET:${parentEndpoint}`;
        cache.clear(cacheKey);
        return response.data;
    }
    /**
     * Delete a resource in the Help Scout Docs API
     * @param endpoint The API endpoint to delete
     * @param requireConfirmation Whether to require explicit confirmation flag
     * @returns Promise<void>
     * @throws Error if deletion is attempted without proper confirmation
     */
    async delete(endpoint, requireConfirmation = true) {
        if (requireConfirmation && !config.helpscout.allowDocsDelete) {
            throw new Error('Deletion operations are disabled by default for safety. ' +
                'Set HELPSCOUT_ALLOW_DOCS_DELETE=true to enable deletion operations.');
        }
        await this.executeWithRetry(() => this.client.delete(endpoint));
        // Clear cache for this endpoint and parent collection
        const cacheKey = `DOCS:GET:${endpoint}`;
        cache.clear(cacheKey);
        const parentEndpoint = endpoint.substring(0, endpoint.lastIndexOf('/'));
        const parentCacheKey = `DOCS:GET:${parentEndpoint}`;
        cache.clear(parentCacheKey);
    }
}
// Create client instance with connection pool config from environment
export const helpScoutDocsClient = new HelpScoutDocsClient(config.connectionPool);
//# sourceMappingURL=helpscout-docs-client.js.map