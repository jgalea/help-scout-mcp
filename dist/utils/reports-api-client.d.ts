import { HelpScoutClient } from './helpscout-client.js';
/**
 * Wrapper class for Help Scout Reports API that handles response unwrapping
 */
export declare class ReportsApiClient {
    private client;
    constructor(client: HelpScoutClient);
    /**
     * Get a report from the Help Scout Reports API
     * The Reports API returns responses wrapped in a 'report' object
     */
    getReport<T>(endpoint: string, params?: Record<string, unknown>): Promise<T>;
}
//# sourceMappingURL=reports-api-client.d.ts.map