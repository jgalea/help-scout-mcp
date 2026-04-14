import { TextResourceContents, Resource } from '@modelcontextprotocol/sdk/types.js';
export declare class ResourceHandler {
    handleResource(uri: string): Promise<TextResourceContents>;
    private getInboxesResource;
    private getConversationsResource;
    private getThreadsResource;
    private getClockResource;
    listResources(): Promise<Resource[]>;
}
export declare const resourceHandler: ResourceHandler;
//# sourceMappingURL=index.d.ts.map