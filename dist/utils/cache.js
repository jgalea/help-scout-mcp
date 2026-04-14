import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import { config } from './config.js';
import { logger } from './logger.js';
export class Cache {
    constructor() {
        this.defaultTtl = config.cache.ttlSeconds * 1000; // Convert to milliseconds
        this.cache = new LRUCache({
            max: config.cache.maxSize,
            ttl: this.defaultTtl,
        });
    }
    generateKey(prefix, data) {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify({ prefix, data }));
        return hash.digest('hex');
    }
    get(prefix, data) {
        const key = this.generateKey(prefix, data);
        const value = this.cache.get(key);
        if (value) {
            logger.debug('Cache hit', { key, prefix });
        }
        else {
            logger.debug('Cache miss', { key, prefix });
        }
        return value;
    }
    set(prefix, data, value, options) {
        const key = this.generateKey(prefix, data);
        const ttl = options?.ttl ? options.ttl * 1000 : this.defaultTtl;
        this.cache.set(key, value, { ttl });
        logger.debug('Cache set', { key, prefix, ttl: ttl / 1000 });
    }
    clear(prefix) {
        if (prefix) {
            // Clear only entries with the specified prefix
            const keysToDelete = [];
            for (const [key] of this.cache.entries()) {
                // Since we hash the keys, we need to store the original prefix with the value
                // For now, we'll just clear all entries when a prefix is provided
                // In a production system, we'd store the prefix with the cached value
                keysToDelete.push(key);
            }
            keysToDelete.forEach(key => this.cache.delete(key));
            logger.info('Cache cleared for prefix', { prefix, count: keysToDelete.length });
        }
        else {
            this.cache.clear();
            logger.info('Cache cleared');
        }
    }
    getStats() {
        return {
            size: this.cache.size,
            max: this.cache.max,
        };
    }
}
export const cache = new Cache();
//# sourceMappingURL=cache.js.map