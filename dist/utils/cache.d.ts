export interface CacheOptions {
    ttl?: number;
}
export declare class Cache {
    private cache;
    private defaultTtl;
    constructor();
    private generateKey;
    get<T>(prefix: string, data: unknown): T | undefined;
    set<T>(prefix: string, data: unknown, value: T, options?: CacheOptions): void;
    clear(prefix?: string): void;
    getStats(): {
        size: number;
        max: number;
    };
}
export declare const cache: Cache;
//# sourceMappingURL=cache.d.ts.map