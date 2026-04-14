import { Tool, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ServiceContainer } from '../utils/service-container.js';
export declare class ToolHandler {
    private callHistory;
    private currentUserQuery?;
    private docsToolHandler;
    private reportsToolHandler;
    constructor(container?: ServiceContainer);
    /**
     * Strip a raw Help Scout conversation object down to the fields that matter.
     * The API returns huge objects with _links, _embedded, tag styles, photo URLs,
     * closedByUser, source metadata, etc. — none of which the LLM needs.
     */
    private slimConversation;
    /**
     * Fetch multiple pages from the Help Scout conversations API until we reach
     * the desired count or run out of pages. Help Scout ignores the `size` param
     * and always returns ~25 conversations per page, so we must paginate to get
     * more than 25 results.
     */
    private fetchConversationPages;
    /**
     * Fetch multiple pages of threads from a conversation until we reach
     * the desired count or run out of pages.
     */
    private fetchThreadPages;
    /**
     * Escape special characters in Help Scout query syntax to prevent injection
     */
    private escapeQueryTerm;
    /**
     * Append a createdAt date range to an existing Help Scout query string.
     * Help Scout has no native createdAfter/createdBefore URL params, so we
     * use query syntax: (createdAt:[start TO end]).
     */
    private appendCreatedAtFilter;
    /**
     * Apply client-side createdBefore filter (Help Scout API does not support this natively).
     */
    private applyCreatedBeforeFilter;
    /**
     * Build pagination info that distinguishes filtered count from API total.
     */
    private buildFilteredPagination;
    /**
     * Set the current user query for context-aware validation
     */
    setUserContext(userQuery: string): void;
    listTools(): Promise<Tool[]>;
    callTool(request: CallToolRequest): Promise<CallToolResult>;
    private searchInboxes;
    private searchConversations;
    /**
     * Keyword search: multi-status parallel search across active/pending/closed
     */
    private searchConversationsKeyword;
    /**
     * Structured search: builds Help Scout query syntax with field prefixes
     */
    private searchConversationsStructured;
    /**
     * Simple/list search: filter by status, date, inbox, tag
     */
    private searchConversationsList;
    /**
     * Post-process a searchConversations result to attach transcripts.
     * Works with all three search paths (keyword, structured, list).
     */
    private enrichWithTranscripts;
    private getConversationSummary;
    /**
     * Extract clean message from Help Scout Beacon form HTML.
     * Beacon forms come in two variants:
     * 1. Hidden span + form table: actual message in <span style="display: none">
     * 2. Form table only: Q&A pairs, last long answer is the message body
     * Both may have a "View Full Ticket" source link to preserve.
     */
    private cleanBeaconForm;
    /**
     * Shared TurndownService instance for HTML → Markdown conversion.
     */
    private static turndown;
    /**
     * Convert HTML to Markdown for transcript output.
     */
    private htmlToMarkdown;
    /**
     * Build a transcript from threads: filter to customer/staff messages,
     * strip HTML, respect redaction, sort chronologically.
     */
    private buildTranscript;
    /**
     * For an array of conversations, fetch threads and build transcripts in parallel.
     */
    private attachTranscripts;
    private getThreads;
    private getAttachment;
    private getServerTime;
    /**
     * Calculate time range for search
     * Note: Help Scout API requires ISO 8601 format WITHOUT milliseconds
     */
    private calculateTimeRange;
    /**
     * Build Help Scout search query from terms and search locations (with injection protection)
     */
    private buildSearchQuery;
    private searchSingleStatus;
    private structuredConversationFilter;
    /**
     * Convert HTML to Help Scout's native format.
     *
     * Help Scout renders replies as text with `<br><br>` between paragraphs,
     * not `<p>` tags. Block elements (ul, ol, blockquote) have built-in CSS
     * margins, so breaks around them are tuned to avoid double-spacing.
     *
     * Relaxed (default): `<br>` after blocks, `<br><br>` before blockquotes.
     * Compact: no extra breaks around blocks.
     */
    /**
     * Get a single conversation by ID
     */
    private getConversation;
    /**
     * Create a new conversation
     */
    private createConversation;
    /**
     * Update a conversation's subject, status, assignee, tags, or custom fields.
     *
     * Help Scout uses three separate endpoints:
     * - PATCH /conversations/{id} with JSONPatch for subject, status, assignTo
     * - PUT /conversations/{id}/tags for tags (replaces all)
     * - PUT /conversations/{id}/fields for custom fields (replaces all)
     */
    private updateConversation;
    private formatReplyHtml;
    /**
     * Create a reply on a conversation (draft by default)
     */
    private createReply;
    /**
     * Create an internal note on a conversation
     */
    private createNote;
}
export declare const toolHandler: ToolHandler;
//# sourceMappingURL=index.d.ts.map