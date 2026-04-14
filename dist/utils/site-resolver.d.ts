import { DocsSite } from '../schema/types.js';
export interface SiteMatch {
    site: DocsSite;
    matchScore: number;
    matchReason: string;
}
export declare class SiteResolver {
    private sites;
    private lastFetch;
    private readonly CACHE_DURATION;
    /**
     * Resolve a site from natural language input
     * @param input User input that might contain site names
     * @param defaultSiteId Optional default site ID from config
     * @returns Best matching site or null
     */
    resolveSite(input: string, defaultSiteId?: string): Promise<SiteMatch | null>;
    /**
     * Get all available sites
     */
    getAllSites(): Promise<DocsSite[]>;
    /**
     * Clear cached data to force refresh
     */
    clearCache(): void;
    /**
     * Ensure we have loaded sites data
     */
    private ensureDataLoaded;
}
export declare const siteResolver: SiteResolver;
//# sourceMappingURL=site-resolver.d.ts.map