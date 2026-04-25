import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import { config } from './config.js';
import { logger } from './logger.js';

export interface CacheOptions {
  ttl?: number;
}

/**
 * Replace dynamic ID segments in a cache prefix with placeholders so
 * debug logs don't leak customer ticket IDs / user IDs back into stderr.
 * `GET:/conversations/12345/threads` -> `GET:/conversations/:id/threads`.
 */
function shapePrefix(prefix: string): string {
  return prefix.replace(/\/\d+/g, '/:id');
}

export class Cache {
  private cache: LRUCache<string, any>;
  private defaultTtl: number;
  // Reverse index: prefix -> set of hashed keys. Maintained in sync with
  // the LRU's contents so clear(prefix) actually targets the matching
  // entries instead of nuking everything.
  private prefixIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.defaultTtl = config.cache.ttlSeconds * 1000; // Convert to milliseconds
    this.cache = new LRUCache<string, any>({
      max: config.cache.maxSize,
      ttl: this.defaultTtl,
      // Keep the prefix index in sync when the LRU evicts or expires
      // entries on its own. The disposeAfter variant fires after the
      // entry is fully removed from the LRU.
      disposeAfter: (_value, key) => {
        this.removeKeyFromIndex(key as string);
      },
    });
  }

  private generateKey(prefix: string, data: unknown): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify({ prefix, data }));
    return hash.digest('hex');
  }

  private addKeyToIndex(prefix: string, key: string): void {
    let set = this.prefixIndex.get(prefix);
    if (!set) {
      set = new Set<string>();
      this.prefixIndex.set(prefix, set);
    }
    set.add(key);
  }

  private removeKeyFromIndex(key: string): void {
    for (const [prefix, set] of this.prefixIndex.entries()) {
      if (set.delete(key) && set.size === 0) {
        this.prefixIndex.delete(prefix);
      }
    }
  }

  get<T>(prefix: string, data: unknown): T | undefined {
    const key = this.generateKey(prefix, data);
    const value = this.cache.get(key) as T | undefined;

    if (value) {
      logger.debug('Cache hit', { key, prefix: shapePrefix(prefix) });
    } else {
      logger.debug('Cache miss', { key, prefix: shapePrefix(prefix) });
    }

    return value;
  }

  set<T>(prefix: string, data: unknown, value: T, options?: CacheOptions): void {
    const key = this.generateKey(prefix, data);
    const ttl = options?.ttl ? options.ttl * 1000 : this.defaultTtl;

    this.cache.set(key, value, { ttl });
    this.addKeyToIndex(prefix, key);
    logger.debug('Cache set', { key, prefix: shapePrefix(prefix), ttl: ttl / 1000 });
  }

  clear(prefix?: string): void {
    if (prefix) {
      // Targeted clear: only entries written under this exact prefix.
      // Previously this purged the whole LRU regardless of prefix and
      // the comment admitted as much.
      const keys = this.prefixIndex.get(prefix);
      let count = 0;
      if (keys) {
        for (const key of keys) {
          this.cache.delete(key);
          count++;
        }
        this.prefixIndex.delete(prefix);
      }
      logger.info('Cache cleared for prefix', { prefix: shapePrefix(prefix), count });
    } else {
      this.cache.clear();
      this.prefixIndex.clear();
      logger.info('Cache cleared');
    }
  }

  getStats(): { size: number; max: number } {
    return {
      size: this.cache.size,
      max: this.cache.max,
    };
  }
}

export const cache = new Cache();