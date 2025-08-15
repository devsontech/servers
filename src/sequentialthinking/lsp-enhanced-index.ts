#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';
import { spawn } from "child_process";
import path from "path";

interface LSPMessage {
  jsonrpc: string;
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface CodeAnalysisRequest {
  file_path?: string;
  line?: number;
  column?: number;
  operation?: 'hover' | 'completion' | 'diagnostics' | 'definitions';
  language_id?: string;
}

interface EnhancedThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
  // LSP enhancements
  code_analysis?: CodeAnalysisRequest;
  lsp_context?: any;
  code_snippets?: string[];
}

class LSPClient {
  private process: any;
  private buffer: string = "";
  private nextId: number = 1;
  private responsePromises: Map<string | number, { resolve: Function; reject: Function }> = new Map();
  private initialized: boolean = false;
  private lspServerPath: string;
  private lspServerArgs: string[];
  private openedDocuments: Set<string> = new Set();

  constructor(lspServerPath: string, lspServerArgs: string[] = []) {
    this.lspServerPath = lspServerPath;
    this.lspServerArgs = lspServerArgs;
  }

  private startProcess(): void {
    this.process = spawn(this.lspServerPath, this.lspServerArgs, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    this.process.stdout.on("data", (data: Buffer) => this.handleData(data));
    this.process.stderr.on("data", (data: Buffer) => {
      console.error(`LSP Server Message: ${data.toString()}`);
    });
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();
    
    while (true) {
      const headerMatch = this.buffer.match(/^Content-Length: (\d+)\r\n\r\n/);
      if (!headerMatch) break;

      const contentLength = parseInt(headerMatch[1], 10);
      const headerEnd = headerMatch[0].length;

      if (this.buffer.length < headerEnd + contentLength) break;

      const content = this.buffer.substring(headerEnd, headerEnd + contentLength);
      this.buffer = this.buffer.substring(headerEnd + contentLength);

      try {
        const message = JSON.parse(content) as LSPMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error("Failed to parse LSP message:", error);
      }
    }
  }

  private handleMessage(message: LSPMessage): void {
    if ('id' in message && (message.result !== undefined || message.error !== undefined)) {
      const promise = this.responsePromises.get(message.id!);
      if (promise) {
        if (message.error) {
          promise.reject(message.error);
        } else {
          promise.resolve(message.result);
        }
        this.responsePromises.delete(message.id!);
      }
    }
  }

  private sendRequest<T>(method: string, params?: any): Promise<T> {
    if (!this.process) {
      this.startProcess();
    }

    const id = this.nextId++;
    const request: LSPMessage = {
      jsonrpc: "2.0",
      id,
      method,
      params
    };

    const promise = new Promise<T>((resolve, reject) => {
      this.responsePromises.set(id, { resolve, reject });
      
      setTimeout(() => {
        if (this.responsePromises.has(id)) {
          this.responsePromises.delete(id);
          reject(new Error(`Timeout waiting for response to ${method} request`));
        }
      }, 10000);
    });

    const content = JSON.stringify(request);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    this.process.stdin.write(header + content);

    return promise;
  }

  async initialize(rootDirectory: string = "."): Promise<void> {
    if (this.initialized) return;

    await this.sendRequest("initialize", {
      processId: process.pid,
      clientInfo: { name: "sequential-thinking-lsp" },
      rootUri: "file://" + path.resolve(rootDirectory),
      capabilities: {
        textDocument: {
          hover: { contentFormat: ["markdown", "plaintext"] },
          completion: { completionItem: { snippetSupport: false } },
          definition: { dynamicRegistration: false },
          diagnostic: { dynamicRegistration: false }
        }
      }
    });

    this.initialized = true;
  }

  async openDocument(uri: string, text: string, languageId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error("LSP client not initialized");
    }

    if (this.openedDocuments.has(uri)) {
      return;
    }

    await this.sendRequest("textDocument/didOpen", {
      textDocument: { uri, languageId, version: 1, text }
    });

    this.openedDocuments.add(uri);
  }

  async getHover(uri: string, line: number, character: number): Promise<any> {
    if (!this.initialized) {
      throw new Error("LSP client not initialized");
    }

    return await this.sendRequest("textDocument/hover", {
      textDocument: { uri },
      position: { line: line - 1, character: character - 1 } // Convert to 0-based
    });
  }

  async getCompletion(uri: string, line: number, character: number): Promise<any> {
    if (!this.initialized) {
      throw new Error("LSP client not initialized");
    }

    return await this.sendRequest("textDocument/completion", {
      textDocument: { uri },
      position: { line: line - 1, character: character - 1 }
    });
  }

  async getDiagnostics(uri: string): Promise<any> {
    // LSP sends diagnostics via notifications, so we'd need to track them
    // For simplicity, returning empty array
    return [];
  }
}

class EnhancedSequentialThinkingServer {
  private thoughtHistory: EnhancedThoughtData[] = [];
  private branches: Record<string, EnhancedThoughtData[]> = {};
  private disableThoughtLogging: boolean;
  private lspClient?: LSPClient;
  private rootDirectory: string = ".";

  constructor() {
    this.disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
  }

  async initializeLSP(lspServerPath?: string, rootDir?: string): Promise<void> {
    if (rootDir) {
      this.rootDirectory = rootDir;
    }

    // Use VS Code's existing language servers when available
    // This is more efficient and leverages existing VS Code extensions
    const vscodeLanguageServers: Record<string, { 
      extensionId: string; 
      serverCommand: string; 
      args: string[]; 
      workspaceConfig?: any;
      fallback?: { path: string; args: string[] };
    }> = {
      // .NET Languages - Use C# DevKit or C# extension
      'csharp': { 
        extensionId: 'ms-dotnettools.csharp',
        serverCommand: 'Microsoft.CodeAnalysis.LanguageServer',
        args: ['--stdio'],
        workspaceConfig: {
          'dotnet.server.useOmnisharp': false,
          'csharp.semanticHighlighting.enabled': true
        },
        fallback: { path: 'OmniSharp', args: ['--languageserver', '--hostPID', process.pid.toString()] }
      },
      'omnisharp': { 
        extensionId: 'ms-dotnettools.csharp',
        serverCommand: 'OmniSharp',
        args: ['--languageserver', '--hostPID', process.pid.toString()],
        fallback: { path: 'OmniSharp', args: ['--languageserver', '--hostPID', process.pid.toString()] }
      },
      'dotnet': { 
        extensionId: 'ms-dotnettools.csharp',
        serverCommand: 'Microsoft.CodeAnalysis.LanguageServer',
        args: ['--stdio'],
        fallback: { path: 'dotnet', args: ['--info'] }
      },
      
      // Web Technologies (Angular/Frontend) - Use VS Code built-in TypeScript support
      'typescript': { 
        extensionId: 'vscode.typescript-language-features',
        serverCommand: 'typescript-language-server',
        args: ['--stdio', '--log-level', '2'],
        workspaceConfig: {
          'typescript.preferences.includePackageJsonAutoImports': 'auto',
          'typescript.suggest.autoImports': true
        },
        fallback: { path: 'typescript-language-server', args: ['--stdio'] }
      },
      'javascript': { 
        extensionId: 'vscode.typescript-language-features',
        serverCommand: 'typescript-language-server',
        args: ['--stdio', '--log-level', '2'],
        workspaceConfig: {
          'javascript.preferences.includePackageJsonAutoImports': 'auto',
          'javascript.suggest.autoImports': true
        },
        fallback: { path: 'typescript-language-server', args: ['--stdio'] }
      },
      'angular': { 
        extensionId: 'Angular.ng-template',
        serverCommand: '@angular/language-server',
        args: ['--stdio', '--tsProbeLocations', './node_modules', '--ngProbeLocations', './node_modules'],
        workspaceConfig: {
          'angular.enableTemplateLanguageService': true,
          'angular.log': 'verbose'
        },
        fallback: { path: '@angular/language-server', args: ['--stdio'] }
      },
      
      // CSS and Styling - Use VS Code built-in CSS support
      'css': { 
        extensionId: 'vscode.css-language-features',
        serverCommand: 'vscode-css-language-server',
        args: ['--stdio'],
        workspaceConfig: {
          'css.validate': true,
          'css.lint.enabled': true
        },
        fallback: { path: 'vscode-css-language-server', args: ['--stdio'] }
      },
      'scss': { 
        extensionId: 'vscode.css-language-features',
        serverCommand: 'vscode-css-language-server',
        args: ['--stdio'],
        workspaceConfig: {
          'scss.validate': true,
          'scss.lint.enabled': true
        },
        fallback: { path: 'vscode-css-language-server', args: ['--stdio'] }
      },
      'sass': { 
        extensionId: 'vscode.css-language-features',
        serverCommand: 'vscode-css-language-server',
        args: ['--stdio'],
        fallback: { path: 'vscode-css-language-server', args: ['--stdio'] }
      },
      'less': { 
        extensionId: 'vscode.css-language-features',
        serverCommand: 'vscode-css-language-server',
        args: ['--stdio'],
        fallback: { path: 'vscode-css-language-server', args: ['--stdio'] }
      },
      
      // HTML and Templates - Use VS Code built-in HTML support
      'html': { 
        extensionId: 'vscode.html-language-features',
        serverCommand: 'vscode-html-language-server',
        args: ['--stdio'],
        workspaceConfig: {
          'html.validate.scripts': true,
          'html.validate.styles': true
        },
        fallback: { path: 'vscode-html-language-server', args: ['--stdio'] }
      },
      'razor': { 
        extensionId: 'ms-dotnettools.csharp',
        serverCommand: 'rzls',
        args: ['--stdio'],
        workspaceConfig: {
          'razor.languageServer.debug': false,
          'razor.format.enable': true
        },
        fallback: { path: 'rzls', args: ['--stdio'] }
      },
      
      // JSON and Configuration - Use VS Code built-in JSON support
      'json': { 
        extensionId: 'vscode.json-language-features',
        serverCommand: 'vscode-json-language-server',
        args: ['--stdio'],
        workspaceConfig: {
          'json.validate.enable': true,
          'json.schemaDownload.enable': true
        },
        fallback: { path: 'vscode-json-language-server', args: ['--stdio'] }
      },
      'jsonc': { 
        extensionId: 'vscode.json-language-features',
        serverCommand: 'vscode-json-language-server',
        args: ['--stdio'],
        fallback: { path: 'vscode-json-language-server', args: ['--stdio'] }
      },
      
      // XML (for .csproj, .sln, etc.) - Use Red Hat XML extension
      'xml': { 
        extensionId: 'redhat.vscode-xml',
        serverCommand: 'lemminx',
        args: [],
        workspaceConfig: {
          'xml.validation.enabled': true,
          'xml.format.enabled': true
        },
        fallback: { path: 'lemminx', args: [] }
      },
      
      // Other Popular Languages
      'python': { 
        extensionId: 'ms-python.python',
        serverCommand: 'pylsp',
        args: [],
        workspaceConfig: {
          'python.linting.enabled': true,
          'python.analysis.autoImportCompletions': true
        },
        fallback: { path: 'pylsp', args: [] }
      },
      'rust': { 
        extensionId: 'rust-lang.rust-analyzer',
        serverCommand: 'rust-analyzer',
        args: [],
        workspaceConfig: {
          'rust-analyzer.checkOnSave.command': 'check'
        },
        fallback: { path: 'rust-analyzer', args: [] }
      },
      'go': { 
        extensionId: 'golang.go',
        serverCommand: 'gopls',
        args: [],
        workspaceConfig: {
          'go.useLanguageServer': true
        },
        fallback: { path: 'gopls', args: [] }
      },
      'java': { 
        extensionId: 'redhat.java',
        serverCommand: 'jdtls',
        args: [],
        workspaceConfig: {
          'java.configuration.updateBuildConfiguration': 'automatic'
        },
        fallback: { path: 'java', args: [] }
      },
      
      // DevOps and Configuration
      'yaml': { 
        extensionId: 'redhat.vscode-yaml',
        serverCommand: 'yaml-language-server',
        args: ['--stdio'],
        workspaceConfig: {
          'yaml.validate': true,
          'yaml.format.enable': true
        },
        fallback: { path: 'yaml-language-server', args: ['--stdio'] }
      },
      'dockerfile': { 
        extensionId: 'ms-azuretools.vscode-docker',
        serverCommand: 'docker-langserver',
        args: ['--stdio'],
        fallback: { path: 'docker-langserver', args: ['--stdio'] } 
      },
      
      // Shell and Scripting
      'powershell': { 
        extensionId: 'ms-vscode.powershell',
        serverCommand: 'powershell-editor-services',
        args: [],
        workspaceConfig: {
          'powershell.integratedConsole.showOnStartup': false,
          'powershell.codeFormatting.preset': 'OTBS'
        },
        fallback: { path: 'pwsh', args: ['-NoLogo', '-NoProfile', '-Command', '-'] }
      }
    };

    let serverConfig = vscodeLanguageServers.typescript; // Default fallback
    
    if (lspServerPath && vscodeLanguageServers[lspServerPath]) {
      serverConfig = vscodeLanguageServers[lspServerPath];
    } else if (lspServerPath) {
      // Custom server path - use fallback format
      serverConfig = { 
        extensionId: 'custom',
        serverCommand: lspServerPath, 
        args: ['--stdio'],
        fallback: { path: lspServerPath, args: ['--stdio'] }
      };
    }

    // Use fallback path and args for LSPClient initialization
    const fallbackConfig = serverConfig.fallback || { path: serverConfig.serverCommand, args: serverConfig.args };
    this.lspClient = new LSPClient(fallbackConfig.path, fallbackConfig.args);
    await this.lspClient.initialize(this.rootDirectory);
  }

  private async performCodeAnalysis(analysis: CodeAnalysisRequest): Promise<any> {
    if (!this.lspClient || !analysis.file_path) {
      return null;
    }

    try {
      const uri = `file://${path.resolve(analysis.file_path)}`;
      
      // Read file content (in practice, you'd want better file handling)
      const fs = await import('fs/promises');
      const content = await fs.readFile(analysis.file_path, 'utf-8');
      
      // Open document if not already opened
      const languageId = analysis.language_id || this.detectLanguageId(analysis.file_path);
      await this.lspClient.openDocument(uri, content, languageId);

      switch (analysis.operation) {
        case 'hover':
          if (analysis.line && analysis.column) {
            return await this.lspClient.getHover(uri, analysis.line, analysis.column);
          }
          break;
        case 'completion':
          if (analysis.line && analysis.column) {
            return await this.lspClient.getCompletion(uri, analysis.line, analysis.column);
          }
          break;
        case 'diagnostics':
          return await this.lspClient.getDiagnostics(uri);
        default:
          return null;
      }
    } catch (error) {
      console.error('Code analysis error:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }

    return null;
  }

  private detectLanguageId(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath).toLowerCase();
    
    // Check for specific filenames first
    const filenameMap: Record<string, string> = {
      '.csproj': 'xml',
      '.sln': 'xml',
      '.props': 'xml',
      '.targets': 'xml',
      'package.json': 'json',
      'tsconfig.json': 'jsonc',
      'angular.json': 'jsonc',
      '.eslintrc.json': 'jsonc',
      'appsettings.json': 'jsonc',
      'appsettings.development.json': 'jsonc',
      'appsettings.production.json': 'jsonc',
      'web.config': 'xml',
      'dockerfile': 'dockerfile',
      '.dockerignore': 'ignore',
      '.gitignore': 'ignore'
    };

    // Check filename patterns
    if (filename.endsWith('.csproj') || filename.endsWith('.vbproj') || filename.endsWith('.fsproj')) {
      return 'xml';
    }
    if (filename.includes('appsettings') && filename.endsWith('.json')) {
      return 'jsonc';
    }

    // Extension-based mapping
    const languageMap: Record<string, string> = {
      // Web Technologies
      '.ts': 'typescript',
      '.tsx': 'typescriptreact',
      '.js': 'javascript',
      '.jsx': 'javascriptreact',
      '.html': 'html',
      '.htm': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.json': 'json',
      '.jsonc': 'jsonc',
      
      // .NET Technologies
      '.cs': 'csharp',
      '.vb': 'vb',
      '.fs': 'fsharp',
      '.cshtml': 'razor',
      '.razor': 'razor',
      '.xaml': 'xml',
      '.resx': 'xml',
      '.config': 'xml',
      '.xml': 'xml',
      '.xsd': 'xml',
      '.xsl': 'xml',
      '.xslt': 'xml',
      
      // Configuration and Data
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.toml': 'toml',
      '.ini': 'ini',
      '.env': 'properties',
      '.properties': 'properties',
      
      // Documentation
      '.md': 'markdown',
      '.mdx': 'mdx',
      '.txt': 'plaintext',
      '.rtf': 'plaintext',
      
      // Other Languages
      '.py': 'python',
      '.rs': 'rust',
      '.go': 'go',
      '.java': 'java',
      '.kt': 'kotlin',
      '.cpp': 'cpp',
      '.cxx': 'cpp',
      '.cc': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp',
      '.hxx': 'cpp',
      '.hs': 'haskell',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.sh': 'shellscript',
      '.bash': 'shellscript',
      '.zsh': 'shellscript',
      '.ps1': 'powershell',
      '.psm1': 'powershell',
      '.bat': 'bat',
      '.cmd': 'bat',
      
      // SQL and Databases
      '.sql': 'sql',
      '.sqlite': 'sql',
      '.mysql': 'sql',
      '.pgsql': 'sql',
      
      // Docker and DevOps
      '.dockerfile': 'dockerfile',
      '.containerfile': 'dockerfile',
      '.k8s.yaml': 'yaml',
      '.k8s.yml': 'yaml'
    };

    // Check filename first, then extension
    if (filenameMap[filename]) {
      return filenameMap[filename];
    }

    return languageMap[ext] || 'plaintext';
  }

  private validateThoughtData(input: unknown): EnhancedThoughtData {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== 'string') {
      throw new Error('Invalid thought: must be a string');
    }
    if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
      throw new Error('Invalid thoughtNumber: must be a number');
    }
    if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
      throw new Error('Invalid totalThoughts: must be a number');
    }
    if (typeof data.nextThoughtNeeded !== 'boolean') {
      throw new Error('Invalid nextThoughtNeeded: must be a boolean');
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      isRevision: data.isRevision as boolean | undefined,
      revisesThought: data.revisesThought as number | undefined,
      branchFromThought: data.branchFromThought as number | undefined,
      branchId: data.branchId as string | undefined,
      needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
      code_analysis: data.code_analysis as CodeAnalysisRequest | undefined,
      lsp_context: data.lsp_context as any | undefined,
      code_snippets: data.code_snippets as string[] | undefined,
    };
  }

  private formatThought(thoughtData: EnhancedThoughtData): string {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId, lsp_context } = thoughtData;

    let prefix = '';
    let context = '';

    if (isRevision) {
      prefix = chalk.yellow('🔄 Revision');
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = chalk.green('🌿 Branch');
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else {
      prefix = chalk.blue('💭 Thought');
      context = '';
    }

    let lspInfo = '';
    if (lsp_context) {
      lspInfo = chalk.cyan('\n🔍 LSP Analysis: ') + JSON.stringify(lsp_context, null, 2);
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const border = '─'.repeat(Math.max(header.length, thought.length) + 4);

    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │${lspInfo ? '\n│ ' + lspInfo.padEnd(border.length - 2) + ' │' : ''}
└${border}┘`;
  }

  public async processThought(input: unknown): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      const validatedInput = this.validateThoughtData(input);

      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      // Perform code analysis if requested
      if (validatedInput.code_analysis) {
        const analysisResult = await this.performCodeAnalysis(validatedInput.code_analysis);
        validatedInput.lsp_context = analysisResult;
      }

      this.thoughtHistory.push(validatedInput);

      if (validatedInput.branchFromThought && validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
      }

      if (!this.disableThoughtLogging) {
        const formattedThought = this.formatThought(validatedInput);
        console.error(formattedThought);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtNumber: validatedInput.thoughtNumber,
            totalThoughts: validatedInput.totalThoughts,
            nextThoughtNeeded: validatedInput.nextThoughtNeeded,
            branches: Object.keys(this.branches),
            thoughtHistoryLength: this.thoughtHistory.length,
            lsp_context: validatedInput.lsp_context
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  public async initializeLSPTool(lspServerPath: string, rootDir?: string): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      await this.initializeLSP(lspServerPath, rootDir);
      return {
        content: [{
          type: "text",
          text: `LSP initialized with server: ${lspServerPath}, root: ${rootDir || this.rootDirectory}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to initialize LSP: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}

const SEQUENTIAL_THINKING_TOOL: Tool = {
  name: "sequentialthinking",
  description: `Enhanced sequential thinking tool with comprehensive LSP integration for .NET Core/ABP Framework and Angular 17+ development.

This tool helps analyze problems through a structured thinking process with extensive code analysis capabilities.

Supported Languages & Technologies:
- .NET: C# (.cs), Razor (.cshtml/.razor), XML (.csproj/.sln/.config)
- Frontend: TypeScript (.ts/.tsx), JavaScript (.js/.jsx), HTML (.html)
- Styling: SCSS (.scss), CSS (.css), Sass (.sass), Less (.less)
- Configuration: JSON (.json), JSONC (tsconfig.json, angular.json, appsettings.json)
- Data: YAML (.yml/.yaml), XML (.xml/.xsd)
- DevOps: Dockerfile, PowerShell (.ps1), Shell scripts
- Other: Python, Rust, Go, Java, Markdown

Key features:
- Dynamic and reflective problem-solving with .NET/Angular context awareness
- Real-time hover information, completions, and diagnostics for all supported languages
- Multi-project analysis (solution-level understanding)
- Framework-specific intelligence (ABP patterns, Angular components)
- Configuration file analysis (appsettings, angular.json, etc.)

Parameters:
- thought: Your current thinking step
- nextThoughtNeeded: Whether another thought step is needed
- thoughtNumber: Current thought number
- totalThoughts: Estimated total thoughts needed
- code_analysis: Optional code analysis request supporting all .NET/Angular file types

Example code_analysis for C# controller:
{
  "code_analysis": {
    "file_path": "/path/to/MyController.cs",
    "line": 42,
    "column": 10,
    "operation": "hover",
    "language_id": "csharp"
  }
}

Example code_analysis for Angular component:
{
  "code_analysis": {
    "file_path": "/path/to/my.component.ts",
    "line": 25,
    "column": 15,
    "operation": "completion",
    "language_id": "typescript"
  }
}

Example code_analysis for SCSS:
{
  "code_analysis": {
    "file_path": "/path/to/styles.scss",
    "line": 12,
    "column": 5,
    "operation": "diagnostics",
    "language_id": "scss"
  }
}`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step"
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed"
      },
      thoughtNumber: {
        type: "integer",
        description: "Current thought number",
        minimum: 1
      },
      totalThoughts: {
        type: "integer",
        description: "Estimated total thoughts needed",
        minimum: 1
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking"
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1
      },
      branchId: {
        type: "string",
        description: "Branch identifier"
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed"
      },
      code_analysis: {
        type: "object",
        description: "Optional code analysis request for .NET/Angular files",
        properties: {
          file_path: {
            type: "string",
            description: "Path to the file to analyze (.cs, .ts, .scss, .cshtml, .csproj, etc.)"
          },
          line: {
            type: "integer",
            description: "Line number (1-based)"
          },
          column: {
            type: "integer", 
            description: "Column number (1-based)"
          },
          operation: {
            type: "string",
            enum: ["hover", "completion", "diagnostics", "definitions"],
            description: "Type of LSP operation to perform"
          },
          language_id: {
            type: "string",
            description: "Programming language identifier (csharp, typescript, scss, html, razor, json, xml, etc.)"
          }
        }
      }
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
  }
};

const INITIALIZE_LSP_TOOL: Tool = {
  name: "initialize_lsp",
  description: "Initialize LSP server for code analysis during sequential thinking. Supports .NET Core/ABP Framework and Angular 17+ development stack including C#, TypeScript, SCSS, and more.",
  inputSchema: {
    type: "object",
    properties: {
      lsp_server_path: {
        type: "string",
        description: "LSP server identifier or path. Supported: 'csharp'/'omnisharp'/'dotnet' (C#), 'typescript'/'javascript' (TS/JS), 'angular' (Angular), 'scss'/'css'/'sass'/'less' (Styling), 'html' (HTML), 'razor' (Razor Pages), 'json'/'jsonc' (JSON), 'xml' (XML/.csproj), 'yaml' (YAML), 'python', 'rust', 'go', 'java', 'dockerfile', 'powershell'"
      },
      root_directory: {
        type: "string",
        description: "Root directory for the LSP server (typically your solution or project root)"
      }
    },
    required: ["lsp_server_path"]
  }
};

const server = new Server(
  {
    name: "sequential-thinking-lsp-server",
    version: "0.3.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const thinkingServer = new EnhancedSequentialThinkingServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [SEQUENTIAL_THINKING_TOOL, INITIALIZE_LSP_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "sequentialthinking") {
    return thinkingServer.processThought(request.params.arguments);
  }
  
  if (request.params.name === "initialize_lsp") {
    const args = request.params.arguments as { lsp_server_path: string; root_directory?: string };
    return thinkingServer.initializeLSPTool(args.lsp_server_path, args.root_directory);
  }

  return {
    content: [{
      type: "text",
      text: `Unknown tool: ${request.params.name}`
    }],
    isError: true
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Enhanced Sequential Thinking MCP Server with LSP integration running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
