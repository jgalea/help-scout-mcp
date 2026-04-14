import { DocsSite, DocsCollection } from '../schema/types.js';
export interface CollectionMatch {
    collection: DocsCollection;
    site: DocsSite;
    matchScore: number;
    matchReason: string;
}
export declare class CollectionResolver {
    private sites;
    private collections;
    private lastFetch;
    private readonly CACHE_DURATION;
    /**
     * Resolve a collection from natural language input
     * @param input User input that might contain collection/site names
     * @param defaultCollectionId Optional default collection ID from config
     * @returns Best matching collection or null
     */
    resolveCollection(input: string, defaultCollectionId?: string): Promise<CollectionMatch | null>;
    /**
     * Get all available collections grouped by site
     */
    getAllCollections(): Promise<Map<DocsSite, DocsCollection[]>>;
    /**
     * Clear cached data to force refresh
     */
    clearCache(): void;
    /**
     * Ensure we have loaded sites and collections data
     */
    private ensureDataLoaded;
}
export declare const collectionResolver: CollectionResolver;
//# sourceMappingURL=collection-resolver.d.ts.map