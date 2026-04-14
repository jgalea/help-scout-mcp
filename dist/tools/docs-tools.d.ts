import { Tool, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Injectable, ServiceContainer } from '../utils/service-container.js';
export declare class DocsToolHandler extends Injectable {
    constructor(container?: ServiceContainer);
    /**
     * List all Docs-related tools
     */
    listDocsTools(): Promise<Tool[]>;
    /**
     * Call a Docs tool
     */
    callDocsTool(request: CallToolRequest): Promise<CallToolResult>;
    private listDocsSites;
    private listDocsCollections;
    private listDocsCategories;
    private listDocsArticles;
    private getDocsArticle;
    private updateDocsArticle;
    private updateDocsEntity;
    private getTopDocsArticles;
    private testDocsConnection;
    private clearDocsCache;
    private listAllDocsCollections;
    private getSiteCollections;
    private searchDocsArticles;
    private createDocsArticle;
    private deleteDocsArticle;
    private updateDocsViewCount;
    private listRelatedDocsArticles;
    private createDocsCategory;
    private deleteDocsCategory;
    private createDocsCollection;
    private deleteDocsCollection;
    private listDocsArticleRevisions;
    private getDocsArticleRevision;
    private saveDocsArticleDraft;
    private deleteDocsArticleDraft;
    private uploadDocsArticle;
    private createDocsArticleAsset;
    private createDocsSettingsAsset;
    private getDocsEntity;
    private updateDocsCategoryOrder;
    private listDocsRedirects;
    private getDocsRedirect;
    private findDocsRedirect;
    private createDocsRedirect;
    private updateDocsRedirect;
    private deleteDocsRedirect;
    private createDocsSite;
    private updateDocsSite;
    private deleteDocsSite;
    private getDocsSiteRestrictions;
    private updateDocsSiteRestrictions;
}
//# sourceMappingURL=docs-tools.d.ts.map