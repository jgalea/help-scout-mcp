import { Prompt, GetPromptRequest, GetPromptResult } from '@modelcontextprotocol/sdk/types.js';
export declare class PromptHandler {
    listPrompts(): Promise<Prompt[]>;
    getPrompt(request: GetPromptRequest): Promise<GetPromptResult>;
    private helpScoutBestPractices;
    private searchLast7Days;
    private findUrgentTags;
    private listInboxActivity;
}
export declare const promptHandler: PromptHandler;
//# sourceMappingURL=index.d.ts.map