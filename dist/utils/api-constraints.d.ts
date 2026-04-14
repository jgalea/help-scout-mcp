/**
 * Help Scout API Constraints and Validation Rules
 *
 * This module implements reverse logic validation based on Help Scout API requirements.
 * By understanding what the API expects, we can guide AI agents to make correct calls.
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
    requiredPrerequisites?: string[];
}
export interface ToolCallContext {
    toolName: string;
    arguments: Record<string, unknown>;
    userQuery?: string;
    previousCalls?: string[];
}
/**
 * Help Scout API Constraints derived from actual API behavior
 */
export declare class HelpScoutAPIConstraints {
    /**
     * Validate a tool call based on Help Scout API constraints
     */
    static validateToolCall(context: ToolCallContext): ValidationResult;
    /**
     * CRITICAL: searchConversations has specific API requirements
     */
    private static validateSearchConversations;
    /**
     * Validate conversation summary calls
     */
    private static validateConversationSummary;
    /**
     * Validate getThreads calls
     */
    private static validateGetThreads;
    /**
     * Validate createReply calls
     */
    private static validateCreateReply;
    /**
     * Validate getConversation calls
     */
    private static validateGetConversation;
    /**
     * Validate createConversation calls
     */
    private static validateCreateConversation;
    /**
     * Validate updateConversation calls
     */
    private static validateUpdateConversation;
    /**
     * Detect if user query mentions an inbox by name
     */
    private static detectInboxMention;
    /**
     * Generate validation guidance for tool responses
     */
    static generateToolGuidance(toolName: string, result: any, _context: ToolCallContext): string[];
}
/**
 * Common Help Scout API error patterns and solutions
 */
export declare const API_ERROR_SOLUTIONS: {
    readonly 'Invalid mailbox ID': "Use searchInboxes to get valid inbox IDs";
    readonly 'No conversations found': "Try different status values or broader search terms";
    readonly 'Invalid date format': "Use ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ";
    readonly 'Missing conversation ID': "Get conversation ID from search results first";
    readonly 'Rate limit exceeded': "Wait and retry - the system handles this automatically";
};
//# sourceMappingURL=api-constraints.d.ts.map