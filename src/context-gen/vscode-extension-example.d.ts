import * as vscode from 'vscode';
export declare class ContextAwareAssistant {
    private client;
    private statusBar;
    private contextPanel;
    constructor(context: vscode.ExtensionContext);
    private setupCommands;
    private setupEventListeners;
    private analyzeCurrentWorkspace;
    private analyzeCurrentFile;
    private getContextualSuggestions;
    private showKnowledgeGraph;
    private showContextPanel;
    private getWebviewContent;
    private updateContextForFile;
    private getCurrentFunction;
    private getRelatedContexts;
    private generateSuggestions;
    private showSuggestions;
    private findRelatedFiles;
    private showRelatedFiles;
    private showFileContext;
    private createKnowledgeGraphPanel;
    private getKnowledgeGraphHTML;
    dispose(): void;
}
export declare function activate(context: vscode.ExtensionContext): void;
export declare function deactivate(): void;
