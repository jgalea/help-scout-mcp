import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ApiError } from '../schema/types.js';
/**
 * Creates a standardized MCP error response for tool calls
 */
export declare function createMcpToolError(error: unknown, context: {
    toolName: string;
    requestId: string;
    duration?: number;
}): CallToolResult;
/**
 * Creates a standardized MCP error response for resource handlers
 */
export declare function createMcpResourceError(error: unknown, context: {
    resourceUri: string;
    requestId?: string;
}): {
    type: 'text';
    text: string;
};
/**
 * Type guard to check if an error is our structured ApiError
 */
export declare function isApiError(error: unknown): error is ApiError;
/**
 * Extracts actionable suggestions from API errors for LLM agents
 */
export declare function getErrorSuggestion(error: ApiError): string;
//# sourceMappingURL=mcp-errors.d.ts.map