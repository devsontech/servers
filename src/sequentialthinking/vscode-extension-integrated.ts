#!/usr/bin/env node
/**
 * Enhanced VS Code MCP Server - True Extension Integration
 * This version runs as a VS Code extension to truly leverage existing language servers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * VS Code Extension API Integration
 * This approach works when running inside VS Code's extension host
 */
class VSCodeExtensionIntegration {
  private vscode: any;
  private activeWorkspaces: any[] = [];

  constructor() {
    try {
      // This only works when running as a VS Code extension
      this.vscode = require('vscode');
      this.initializeWorkspaces();
    } catch (error) {
      console.warn('VS Code API not available - running in standalone mode');
      this.vscode = null;
    }
  }

  private initializeWorkspaces(): void {
    if (!this.vscode) return;

    // Get all open workspace folders
    this.activeWorkspaces = this.vscode.workspace.workspaceFolders || [];
    console.log(`Found ${this.activeWorkspaces.length} open workspace(s)`);
  }

  /**
   * Get code intelligence using VS Code's active language service
   */
  async getCodeIntelligence(filePath: string, position: { line: number; character: number }): Promise<any> {
    if (!this.vscode) {
      return {
        error: 'VS Code API not available',
        suggestion: 'This feature requires running as a VS Code extension'
      };
    }

    try {
      // Open the document in VS Code
      const document = await this.vscode.workspace.openTextDocument(this.vscode.Uri.file(filePath));
      
      // Get language service information
      const vscodePosition = new this.vscode.Position(position.line, position.character);
      
      // Get hover information using VS Code's language service
      const hover = await this.vscode.languages.getHover(document, vscodePosition);
      
      // Get completions
      const completions = await this.vscode.languages.getCompletionItems(document, vscodePosition);
      
      // Get diagnostics
      const diagnostics = this.vscode.languages.getDiagnostics(document.uri);

      return {
        filePath,
        language: document.languageId,
        hover: hover ? {
          contents: hover.contents.map((c: any) => c.value || c).join('\n'),
          range: hover.range
        } : null,
        completions: completions ? completions.map((c: any) => ({
          label: c.label,
          kind: c.kind,
          detail: c.detail,
          documentation: c.documentation
        })) : [],
        diagnostics: diagnostics ? diagnostics.map((d: any) => ({
          message: d.message,
          severity: d.severity,
          range: d.range,
          source: d.source
        })) : [],
        activeExtensions: this.getActiveLanguageExtensions(document.languageId)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        error: `Failed to analyze file: ${errorMessage}`,
        filePath
      };
    }
  }

  /**
   * Search across all open workspaces
   */
  async searchInOpenWorkspaces(query: string): Promise<any> {
    if (!this.vscode || this.activeWorkspaces.length === 0) {
      return {
        error: 'No open workspaces found',
        suggestion: 'Open a project in VS Code first'
      };
    }

    const results = [];
    
    for (const workspace of this.activeWorkspaces) {
      try {
        // Use VS Code's search API
        const files = await this.vscode.workspace.findFiles(
          new this.vscode.RelativePattern(workspace, '**/*.{cs,ts,tsx,js,jsx,razor,cshtml}'),
          new this.vscode.RelativePattern(workspace, '**/node_modules/**'),
          100 // Limit results
        );

        for (const file of files) {
          const document = await this.vscode.workspace.openTextDocument(file);
          const text = document.getText();
          
          if (text.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              workspace: workspace.name,
              file: file.fsPath,
              language: document.languageId,
              matches: this.findMatches(text, query)
            });
          }
        }
      } catch (error) {
        console.warn(`Error searching workspace ${workspace.name}:`, error);
      }
    }

    return {
      query,
      workspacesSearched: this.activeWorkspaces.length,
      totalMatches: results.length,
      results
    };
  }

  private findMatches(text: string, query: string): Array<{
    line: number;
    content: string;
    context: {
      before: string;
      after: string;
    };
  }> {
    const lines = text.split('\n');
    const matches: Array<{
      line: number;
      content: string;
      context: {
        before: string;
        after: string;
      };
    }> = [];
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          line: index + 1,
          content: line.trim(),
          context: {
            before: lines[index - 1]?.trim() || '',
            after: lines[index + 1]?.trim() || ''
          }
        });
      }
    });
    
    return matches.slice(0, 5); // Limit to 5 matches per file
  }

  private getActiveLanguageExtensions(languageId: string): any[] {
    if (!this.vscode) return [];

    const relevantExtensions = this.vscode.extensions.all.filter((ext: any) => {
      const contributes = ext.packageJSON.contributes;
      if (!contributes) return false;
      
      // Check if extension contributes to this language
      const languages = contributes.languages || [];
      const grammars = contributes.grammars || [];
      
      return languages.some((lang: any) => lang.id === languageId) ||
             grammars.some((grammar: any) => grammar.language === languageId);
    });

    return relevantExtensions.map((ext: any) => ({
      id: ext.id,
      displayName: ext.packageJSON.displayName || ext.packageJSON.name,
      version: ext.packageJSON.version,
      isActive: ext.isActive
    }));
  }

  /**
   * Get information about current VS Code session
   */
  getVSCodeInfo(): any {
    if (!this.vscode) {
      return {
        integrated: false,
        message: 'Running in standalone mode'
      };
    }

    return {
      integrated: true,
      version: this.vscode.version,
      workspaces: this.activeWorkspaces.map(ws => ({
        name: ws.name,
        path: ws.uri.fsPath
      })),
      activeEditor: this.vscode.window.activeTextEditor ? {
        fileName: this.vscode.window.activeTextEditor.document.fileName,
        languageId: this.vscode.window.activeTextEditor.document.languageId
      } : null,
      extensions: {
        csharp: this.vscode.extensions.getExtension('ms-dotnettools.csharp')?.isActive || false,
        csdevkit: this.vscode.extensions.getExtension('ms-dotnettools.csdevkit')?.isActive || false,
        angular: this.vscode.extensions.getExtension('Angular.ng-template')?.isActive || false
      }
    };
  }
}

// Enhanced server with VS Code integration
class EnhancedVSCodeMCPServer {
  private vsCodeIntegration: VSCodeExtensionIntegration;

  constructor() {
    this.vsCodeIntegration = new VSCodeExtensionIntegration();
  }

  async analyzeCodeWithVSCode(params: any): Promise<any> {
    const { filePath, line = 0, character = 0, query } = params;

    if (query) {
      // Search across open workspaces
      return await this.vsCodeIntegration.searchInOpenWorkspaces(query);
    } else if (filePath) {
      // Analyze specific file
      return await this.vsCodeIntegration.getCodeIntelligence(filePath, { line, character });
    } else {
      return {
        error: 'Either filePath or query is required'
      };
    }
  }

  async getVSCodeStatus(): Promise<any> {
    return this.vsCodeIntegration.getVSCodeInfo();
  }
}

// Server setup
const server = new Server(
  {
    name: 'enhanced-vscode-integrated-server',
    version: '3.0.0'
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const vsCodeServer = new EnhancedVSCodeMCPServer();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_with_vscode',
        description: `Analyze code using VS Code's active language services and search across open workspaces.

This tool truly integrates with VS Code when running as an extension, providing:
- Real code intelligence from active C# DevKit, Angular Language Service, etc.
- Search across all currently open workspace folders
- Access to active editor context
- Live diagnostics from VS Code

Usage:
1. For code analysis: Provide 'filePath' and optionally 'line'/'character'
2. For workspace search: Provide 'query' to search across open projects`,
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to file for analysis'
            },
            line: {
              type: 'integer',
              minimum: 0,
              description: 'Line number (0-based)'
            },
            character: {
              type: 'integer', 
              minimum: 0,
              description: 'Character position (0-based)'
            },
            query: {
              type: 'string',
              description: 'Search query for workspace search'
            }
          }
        }
      },
      {
        name: 'vscode_status',
        description: 'Get information about VS Code integration status and active extensions',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'analyze_with_vscode':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await vsCodeServer.analyzeCodeWithVSCode(args), null, 2)
            }
          ]
        };

      case 'vscode_status':
        return {
          content: [
            {
              type: 'text', 
              text: JSON.stringify(await vsCodeServer.getVSCodeStatus(), null, 2)
            }
          ]
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Enhanced VS Code Integrated MCP Server running...');
}

main().catch(console.error);
