#!/usr/bin/env node
export declare class HelpScoutMCPServer {
    private server;
    private discoveredInboxes;
    /**
     * Private constructor - use static `create()` factory method instead.
     * This enables async inbox discovery before server instantiation.
     */
    private constructor();
    /**
     * Async factory method for creating the MCP server.
     * Discovers available inboxes and builds dynamic instructions before server creation.
     */
    static create(): Promise<HelpScoutMCPServer>;
    /**
     * Discovers available inboxes and builds server instructions.
     * Called once during server creation to populate instructions sent to MCP clients.
     */
    private static discoverAndBuildInstructions;
    private setupHandlers;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map