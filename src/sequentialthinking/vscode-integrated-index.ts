#!/usr/bin/env node
/**
 * Enhanced Sequential Thinking MCP Server with VS Code LSP Integration
 * Uses existing VS Code extensions and language servers for optimal performance
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import * as fs from 'fs';

// Import VS Code LSP integration
import { createVSCodeLSPClient, VSCodeLanguageServers, isVSCodeExtensionInstalled } from './vscode-lsp-integration.js';

interface EnhancedThoughtData {
  id: number;
  thought: string;
  nextThoughtNeeded: boolean;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  languageContext?: {
    languageId: string;
    filePath?: string;
    codeContext?: string;
    lspInfo?: {
      hover?: any;
      completions?: any;
      diagnostics?: any;
    };
  };
  timestamp: Date;
}

/**
 * Enhanced LSP Client that uses VS Code's existing language servers
 */
class VSCodeIntegratedLSPClient {
  private clients: Map<string, any> = new Map();
  private rootDirectory: string = ".";

  // Public getter for active clients
  get activeLanguages(): string[] {
    return Array.from(this.clients.keys());
  }

  constructor(rootDir: string = ".") {
    this.rootDirectory = rootDir;
  }

  /**
   * Initialize language support using VS Code's existing language servers
   */
  async initializeLanguageSupport(languageIds: string[]): Promise<void> {
    for (const languageId of languageIds) {
      try {
        const client = createVSCodeLSPClient(languageId);
        if (client) {
          await client.start(`file://${this.rootDirectory}`);
          this.clients.set(languageId, client);
          console.log(`✓ Initialized VS Code language server for: ${languageId}`);
        } else {
          console.warn(`⚠ No VS Code language server available for: ${languageId}`);
        }
      } catch (error) {
        console.warn(`Failed to initialize ${languageId} language server:`, error);
      }
    }
  }

  /**
   * Get code intelligence for a file using VS Code's language servers
   */
  async getCodeIntelligence(filePath: string, line: number = 0, character: number = 0): Promise<any> {
    const languageId = this.detectLanguageFromPath(filePath);
    const client = this.clients.get(languageId);
    
    if (!client) {
      return {
        languageId,
        message: `No language server available for ${languageId}. Install the corresponding VS Code extension.`,
        suggestions: this.getExtensionSuggestions(languageId)
      };
    }

    try {
      const uri = `file://${filePath}`;
      const position = { line, character };

      const [hover, completions, diagnostics] = await Promise.allSettled([
        client.getHover(uri, position),
        client.getCompletions(uri, position),
        client.getDiagnostics(uri)
      ]);

      return {
        languageId,
        hover: hover.status === 'fulfilled' ? hover.value : null,
        completions: completions.status === 'fulfilled' ? completions.value : null,
        diagnostics: diagnostics.status === 'fulfilled' ? diagnostics.value : null,
        extensionInfo: VSCodeLanguageServers[languageId]
      };
    } catch (error) {
      return {
        languageId,
        error: `Language server error: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: this.getExtensionSuggestions(languageId)
      };
    }
  }

  /**
   * Detect language ID from file path - public method
   */
  detectLanguageFromPath(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      // .NET and C#
      'cs': 'csharp',
      'csx': 'csharp',
      'csproj': 'xml',
      'sln': 'csharp',
      'props': 'xml',
      'targets': 'xml',
      'cshtml': 'razor',
      'razor': 'razor',
      
      // TypeScript and JavaScript
      'ts': 'typescript',
      'tsx': 'typescript',
      'mts': 'typescript',
      'cts': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'mjs': 'javascript',
      'cjs': 'javascript',
      
      // Styling
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      
      // Web
      'html': 'html',
      'htm': 'html',
      'xhtml': 'html',
      
      // Configuration
      'json': 'json',
      'jsonc': 'jsonc',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      
      // Other languages
      'py': 'python',
      'pyw': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'ps1': 'powershell',
      'psm1': 'powershell',
      'psd1': 'powershell',
      
      // DevOps
      'dockerfile': 'dockerfile',
      'containerfile': 'dockerfile'
    };

    return languageMap[extension] || 'plaintext';
  }

  /**
   * Get VS Code extension suggestions for a language
   */
  private getExtensionSuggestions(languageId: string): string[] {
    const suggestions: Record<string, string[]> = {
      'csharp': ['ms-dotnettools.csharp', 'ms-dotnettools.csdevkit'],
      'razor': ['ms-dotnettools.csharp'],
      'angular': ['Angular.ng-template'],
      'xml': ['redhat.vscode-xml'],
      'yaml': ['redhat.vscode-yaml'],
      'python': ['ms-python.python'],
      'rust': ['rust-lang.rust-analyzer'],
      'go': ['golang.go'],
      'java': ['redhat.java'],
      'powershell': ['ms-vscode.powershell'],
      'dockerfile': ['ms-azuretools.vscode-docker']
    };

    return suggestions[languageId] || [];
  }

  async shutdown(): Promise<void> {
    for (const [languageId, client] of this.clients) {
      try {
        await client.stop();
      } catch (error) {
        console.warn(`Error stopping ${languageId} client:`, error);
      }
    }
    this.clients.clear();
  }
}

class EnhancedSequentialThinkingServer {
  private thoughtHistory: EnhancedThoughtData[] = [];
  private branches: Record<string, EnhancedThoughtData[]> = {};
  private disableThoughtLogging: boolean;
  private lspClient?: VSCodeIntegratedLSPClient;
  private rootDirectory: string = ".";

  constructor() {
    this.disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
  }

  /**
   * Initialize with VS Code language server integration
   */
  async initialize(rootDir?: string): Promise<void> {
    if (rootDir) {
      this.rootDirectory = rootDir;
    }

    this.lspClient = new VSCodeIntegratedLSPClient(this.rootDirectory);
    
    // Initialize common language servers for .NET/Angular development
    const commonLanguages = [
      'csharp', 'typescript', 'javascript', 'angular', 
      'css', 'scss', 'html', 'json', 'xml', 'yaml'
    ];

    await this.lspClient.initializeLanguageSupport(commonLanguages);
  }

  async handleSequentialThinking(params: any): Promise<any> {
    const {
      thought,
      nextThoughtNeeded,
      thoughtNumber,
      totalThoughts,
      isRevision = false,
      revisesThought,
      branchFromThought,
      branchId,
      needsMoreThoughts = false,
      filePath, // New parameter for code context
      codeSnippet // New parameter for code context
    } = params;

    // Enhanced thought data with language context
    const enhancedThoughtData: EnhancedThoughtData = {
      id: Date.now() + Math.random(),
      thought,
      nextThoughtNeeded,
      thoughtNumber,
      totalThoughts,
      isRevision,
      revisesThought,
      branchFromThought,
      branchId,
      needsMoreThoughts,
      timestamp: new Date()
    };

    // Add language context if code-related
    if (filePath || codeSnippet) {
      const languageId = filePath ? 
        this.lspClient?.detectLanguageFromPath(filePath) || 'plaintext' : 
        'plaintext';

      enhancedThoughtData.languageContext = {
        languageId,
        filePath,
        codeContext: codeSnippet
      };

      // Get LSP information if available
      if (this.lspClient && filePath) {
        try {
          const lspInfo = await this.lspClient.getCodeIntelligence(filePath, 0, 0);
          enhancedThoughtData.languageContext.lspInfo = lspInfo;
        } catch (error) {
          console.warn('Failed to get LSP information:', error);
        }
      }
    }

    // Handle branching logic
    if (branchId) {
      if (!this.branches[branchId]) {
        this.branches[branchId] = [];
      }
      this.branches[branchId].push(enhancedThoughtData);
    } else {
      this.thoughtHistory.push(enhancedThoughtData);
    }

    // Log thought if enabled
    if (!this.disableThoughtLogging) {
      const branchInfo = branchId ? ` [Branch: ${branchId}]` : '';
      const revisionInfo = isRevision ? ` [Revision of thought ${revisesThought}]` : '';
      const languageInfo = enhancedThoughtData.languageContext ? 
        ` [Language: ${enhancedThoughtData.languageContext.languageId}]` : '';
      
      console.log(`💭 Thought ${thoughtNumber}/${totalThoughts}${branchInfo}${revisionInfo}${languageInfo}: ${thought}`);
      
      if (enhancedThoughtData.languageContext?.lspInfo) {
        console.log(`🔍 Code Intelligence: Available for ${enhancedThoughtData.languageContext.languageId}`);
      }
    }

    return {
      success: true,
      thoughtId: enhancedThoughtData.id,
      thoughtNumber,
      totalThoughts,
      nextThoughtNeeded,
      branchId,
      languageContext: enhancedThoughtData.languageContext,
      message: `Thought ${thoughtNumber} recorded successfully` +
        (enhancedThoughtData.languageContext ? ` with ${enhancedThoughtData.languageContext.languageId} language support` : ''),
      thoughtHistory: this.getThoughtSummary()
    };
  }

  private getThoughtSummary() {
    return {
      totalThoughts: this.thoughtHistory.length,
      branches: Object.keys(this.branches).length,
      lastThought: this.thoughtHistory[this.thoughtHistory.length - 1]?.thought.slice(0, 100) + '...',
      supportedLanguages: this.lspClient?.activeLanguages || []
    };
  }

  async getCodeAnalysis(params: any): Promise<any> {
    const { filePath, line = 0, character = 0 } = params;
    
    if (!this.lspClient) {
      return {
        success: false,
        error: "LSP client not initialized. Call initialize first."
      };
    }

    try {
      const analysis = await this.lspClient.getCodeIntelligence(filePath, line, character);
      return {
        success: true,
        filePath,
        position: { line, character },
        analysis,
        availableExtensions: analysis.suggestions || []
      };
    } catch (error) {
      return {
        success: false,
        error: `Code analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: "Ensure the corresponding VS Code extension is installed and the file exists."
      };
    }
  }

  async getSupportedLanguages(): Promise<any> {
    const supportedLanguages = Object.keys(VSCodeLanguageServers);
    const activeLanguages = this.lspClient?.activeLanguages || [];

    return {
      supported: supportedLanguages.map(lang => ({
        languageId: lang,
        extensionId: VSCodeLanguageServers[lang].extensionId,
        active: activeLanguages.includes(lang)
      })),
      recommendations: [
        'Install "C# Dev Kit" (ms-dotnettools.csdevkit) for full .NET support',
        'Install "Angular Language Service" (Angular.ng-template) for Angular development',
        'Install "XML" (redhat.vscode-xml) for project file support',
        'Install "YAML" (redhat.vscode-yaml) for configuration files'
      ]
    };
  }

  async shutdown(): Promise<void> {
    if (this.lspClient) {
      await this.lspClient.shutdown();
    }
  }
}

// Server setup
const server = new Server(
  {
    name: 'enhanced-sequential-thinking-server',
    version: '2.0.0'
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const sequentialThinkingServer = new EnhancedSequentialThinkingServer();

// Initialize on startup
sequentialThinkingServer.initialize().catch(console.error);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'sequentialthinking',
        description: `Advanced problem-solving through dynamic sequential thinking with VS Code language server integration.

This enhanced tool provides intelligent code analysis alongside thought processes for .NET Core/ABP Framework and Angular 17+ development.

Key Features:
- 🧠 Dynamic thought planning with branching and revision capabilities
- 🔧 Integration with VS Code's existing language servers  
- 💻 Real-time code intelligence for C#, TypeScript, SCSS, and more
- 🏗️ Optimized for enterprise .NET/Angular development workflows
- 📊 Automatic language detection and context-aware assistance

Language Support (via VS Code extensions):
- C# (.cs, .csx) - Requires "C# Dev Kit" extension
- Project files (.csproj, .sln) - XML language server
- Razor Pages (.cshtml, .razor) - C# extension
- TypeScript/JavaScript (.ts, .tsx, .js) - Built into VS Code
- Angular templates (.html, .ts) - "Angular Language Service" extension  
- SCSS/CSS (.scss, .css, .sass) - Built into VS Code
- JSON (.json, .jsonc) - Built into VS Code
- XML (.xml, .config) - "XML" extension by Red Hat
- YAML (.yml, .yaml) - "YAML" extension by Red Hat

Usage Examples:

1. Basic Problem Solving:
{
  "thought": "I need to analyze the user authentication flow in this ABP application",
  "nextThoughtNeeded": true,
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "filePath": "/src/MyApp.Application/Auth/AuthService.cs"
}

2. Code-Specific Analysis:
{
  "thought": "The dependency injection configuration might be causing the service resolution issue",
  "nextThoughtNeeded": true, 
  "thoughtNumber": 2,
  "totalThoughts": 5,
  "filePath": "/src/MyApp.Web/Program.cs",
  "codeSnippet": "builder.Services.AddScoped<IAuthService, AuthService>();"
}

3. Frontend Integration:
{
  "thought": "The Angular component isn't receiving data from the .NET API endpoint",
  "nextThoughtNeeded": true,
  "thoughtNumber": 1,
  "totalThoughts": 4,
  "filePath": "/angular/src/app/auth/auth.component.ts"
}`,
        inputSchema: {
          type: 'object',
          properties: {
            thought: {
              type: 'string',
              description: 'Your current thinking step. Can include analysis, revisions, questions, or realizations about code or architecture.'
            },
            nextThoughtNeeded: {
              type: 'boolean',
              description: 'Whether another thought step is needed'
            },
            thoughtNumber: {
              type: 'integer',
              minimum: 1,
              description: 'Current thought number in sequence'
            },
            totalThoughts: {
              type: 'integer', 
              minimum: 1,
              description: 'Estimated total thoughts needed (can be adjusted)'
            },
            isRevision: {
              type: 'boolean',
              description: 'Whether this revises previous thinking'
            },
            revisesThought: {
              type: 'integer',
              minimum: 1,
              description: 'Which thought number is being reconsidered'
            },
            branchFromThought: {
              type: 'integer',
              minimum: 1,
              description: 'Thought number to branch from'
            },
            branchId: {
              type: 'string',
              description: 'Branch identifier for parallel thinking paths'
            },
            needsMoreThoughts: {
              type: 'boolean',
              description: 'If more thoughts are needed beyond current estimate'
            },
            filePath: {
              type: 'string',
              description: 'File path for code context (enables language server features)'
            },
            codeSnippet: {
              type: 'string',
              description: 'Code snippet for analysis context'
            }
          },
          required: ['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts']
        }
      },
      {
        name: 'analyze_code',
        description: `Get intelligent code analysis using VS Code's language servers.

Provides hover information, completions, diagnostics, and suggestions for code files.
Automatically detects language and uses appropriate VS Code extension.

Supports all major languages used in .NET/Angular development.`,
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the code file to analyze'
            },
            line: {
              type: 'integer',
              minimum: 0,
              description: 'Line number for context (0-based)'
            },
            character: {
              type: 'integer',
              minimum: 0,
              description: 'Character position for context (0-based)'
            }
          },
          required: ['filePath']
        }
      },
      {
        name: 'get_supported_languages',
        description: `List all supported programming languages and their VS Code extension requirements.

Shows which language servers are active and provides installation recommendations for missing extensions.`,
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
      case 'sequentialthinking':
        return { 
          content: [
            { 
              type: 'text', 
              text: JSON.stringify(await sequentialThinkingServer.handleSequentialThinking(args), null, 2) 
            }
          ]
        };

      case 'analyze_code':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await sequentialThinkingServer.getCodeAnalysis(args), null, 2)
            }
          ]
        };

      case 'get_supported_languages':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await sequentialThinkingServer.getSupportedLanguages(), null, 2)
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

// Cleanup on exit
process.on('SIGINT', async () => {
  await sequentialThinkingServer.shutdown();
  process.exit(0);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Enhanced Sequential Thinking MCP Server with VS Code LSP Integration running...');
}

main().catch(console.error);
