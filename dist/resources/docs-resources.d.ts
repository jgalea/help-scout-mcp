import { TextResourceContents, Resource } from '@modelcontextprotocol/sdk/types.js';
export declare class DocsResourceHandler {
    handleDocsResource(uri: string): Promise<TextResourceContents>;
    private getSitesResource;
    private getCollectionsResource;
    private getCategoriesResource;
    private getArticlesResource;
    listDocsResources(): Promise<Resource[]>;
}
export declare const docsResourceHandler: DocsResourceHandler;
//# sourceMappingURL=docs-resources.d.ts.map