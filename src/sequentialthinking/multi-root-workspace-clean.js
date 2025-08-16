#!/usr/bin/env node
/**
 * Multi-Root Workspace Sequential Thinking MCP Server
 * Auto-detects workspace structure without relying on VS Code environment variables
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { join, resolve, relative, basename, dirname, isAbsolute } from 'path';
import * as fs from 'fs';
// Import VS Code LSP integration
import { createVSCodeLSPClient } from './vscode-lsp-integration.js';
/**
 * Auto-detecting Multi-Root Workspace LSP Client
 */
class AutoDetectingWorkspaceLSPClient {
    clients = new Map();
    workspaceInfo;
    get activeLanguages() {
        return Array.from(this.clients.keys());
    }
    get workspaceFolders() {
        return this.workspaceInfo.workspaceFolders;
    }
    constructor() {
        this.workspaceInfo = this.detectWorkspaceStructure();
    }
    /**
     * Auto-detect workspace structure using file system analysis
     */
    detectWorkspaceStructure() {
        const workspaceFolders = [];
        const currentDir = process.cwd();
        console.log(`🔍 Auto-detecting workspace structure from: ${currentDir}`);
        // Method 1: Look for .code-workspace files
        const workspaceFile = this.findWorkspaceFile(currentDir);
        if (workspaceFile) {
            const parsedFolders = this.parseWorkspaceFile(workspaceFile);
            workspaceFolders.push(...parsedFolders);
            console.log(`📁 Found .code-workspace file with ${parsedFolders.length} folders`);
        }
        // Method 2: Analyze directory structure for common multi-root patterns
        if (workspaceFolders.length === 0) {
            const detectedFolders = this.detectMultiRootPattern(currentDir);
            workspaceFolders.push(...detectedFolders);
        }
        // Method 3: Fallback to single workspace (current directory)
        if (workspaceFolders.length === 0) {
            workspaceFolders.push({
                uri: `file://${currentDir}`,
                name: basename(currentDir),
                path: currentDir,
                isRoot: true
            });
        }
        const workspaceName = workspaceFile
            ? basename(workspaceFile, '.code-workspace')
            : `Workspace-${basename(currentDir)}`;
        console.log(`🏢 Detected ${workspaceFolders.length} workspace folder(s):`);
        workspaceFolders.forEach((folder, index) => {
            console.log(`  ${index + 1}. ${folder.name} (${folder.path}) ${folder.isRoot ? '[ROOT]' : ''}`);
        });
        return {
            workspaceFolders,
            activeWorkspaceFolder: workspaceFolders.find(f => f.isRoot) || workspaceFolders[0],
            workspaceFile,
            workspaceName,
            totalFolders: workspaceFolders.length
        };
    }
    /**
     * Find .code-workspace file in current or parent directories
     */
    findWorkspaceFile(startDir) {
        let currentDir = startDir;
        let attempts = 0;
        const maxAttempts = 5;
        while (attempts < maxAttempts) {
            try {
                const items = fs.readdirSync(currentDir);
                const workspaceFile = items.find(item => item.endsWith('.code-workspace'));
                if (workspaceFile) {
                    return join(currentDir, workspaceFile);
                }
                const parentDir = dirname(currentDir);
                if (parentDir === currentDir)
                    break;
                currentDir = parentDir;
                attempts++;
            }
            catch (error) {
                break;
            }
        }
        return undefined;
    }
    /**
     * Parse .code-workspace file
     */
    parseWorkspaceFile(workspaceFilePath) {
        const folders = [];
        try {
            const content = fs.readFileSync(workspaceFilePath, 'utf-8');
            const workspace = JSON.parse(content);
            if (workspace.folders && Array.isArray(workspace.folders)) {
                const workspaceDir = dirname(workspaceFilePath);
                workspace.folders.forEach((folder, index) => {
                    let folderPath = folder.path || folder.uri || folder;
                    if (!isAbsolute(folderPath)) {
                        folderPath = resolve(workspaceDir, folderPath);
                    }
                    if (folderPath.startsWith('file://')) {
                        folderPath = folderPath.replace('file://', '');
                    }
                    if (fs.existsSync(folderPath)) {
                        folders.push({
                            uri: `file://${folderPath}`,
                            name: folder.name || basename(folderPath),
                            path: folderPath,
                            isRoot: index === 0
                        });
                    }
                });
            }
        }
        catch (error) {
            console.warn(`Failed to parse workspace file ${workspaceFilePath}:`, error);
        }
        return folders;
    }
    /**
     * Detect multi-root patterns from directory structure
     */
    detectMultiRootPattern(baseDir) {
        const folders = [];
        try {
            const items = fs.readdirSync(baseDir);
            const multiRootIndicators = [
                'frontend', 'backend', 'client', 'server', 'api', 'web', 'mobile',
                'shared', 'common', 'lib', 'libs', 'packages', 'apps', 'services'
            ];
            // Look for common multi-root folder patterns
            for (const item of items) {
                const fullPath = join(baseDir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory() && !item.startsWith('.')) {
                    const hasProjectFiles = this.hasProjectFiles(fullPath);
                    const isMultiRootIndicator = multiRootIndicators.includes(item.toLowerCase());
                    if (hasProjectFiles && (isMultiRootIndicator || folders.length === 0)) {
                        folders.push({
                            uri: `file://${fullPath}`,
                            name: item,
                            path: fullPath,
                            isRoot: folders.length === 0
                        });
                    }
                }
            }
            // If we found multiple project-like folders, it's likely a multi-root setup
            if (folders.length > 1) {
                console.log(`🔍 Detected multi-root pattern with ${folders.length} project folders`);
            }
        }
        catch (error) {
            console.warn('Failed to detect multi-root pattern:', error);
        }
        return folders;
    }
    /**
     * Check if directory contains project files
     */
    hasProjectFiles(dirPath) {
        const projectFiles = [
            'package.json', 'tsconfig.json', '.csproj', '.vbproj', '.fsproj',
            'pom.xml', 'build.gradle', 'Cargo.toml', 'go.mod', 'requirements.txt'
        ];
        try {
            const items = fs.readdirSync(dirPath);
            return projectFiles.some(file => items.some(item => file.startsWith('.') ? item.endsWith(file) : item === file));
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Initialize language support across workspace folders
     */
    async initializeLanguageSupport(languageIds) {
        for (const languageId of languageIds) {
            const languageClients = new Map();
            for (const workspace of this.workspaceInfo.workspaceFolders) {
                try {
                    const client = createVSCodeLSPClient(languageId);
                    if (client) {
                        await client.start(workspace.uri);
                        languageClients.set(workspace.path, client);
                        console.log(`✓ Initialized ${languageId} for workspace: ${workspace.name}`);
                    }
                }
                catch (error) {
                    console.warn(`Failed to initialize ${languageId} for ${workspace.name}:`, error);
                }
            }
            if (languageClients.size > 0) {
                this.clients.set(languageId, languageClients);
            }
        }
    }
    /**
     * Get workspace summary
     */
    getWorkspaceSummary() {
        return {
            workspaceInfo: this.workspaceInfo,
            activeLanguages: this.activeLanguages,
            totalClients: Array.from(this.clients.values()).reduce((sum, clients) => sum + clients.size, 0)
        };
    }
    /**
     * Search across all workspaces
     */
    async searchAcrossWorkspaces(query) {
        const results = [];
        for (const workspace of this.workspaceInfo.workspaceFolders) {
            try {
                const matches = await this.searchInWorkspace(workspace, query);
                results.push({
                    workspace: workspace.name,
                    path: workspace.path,
                    matches
                });
            }
            catch (error) {
                results.push({
                    workspace: workspace.name,
                    path: workspace.path,
                    error: `Search failed: ${error}`
                });
            }
        }
        return {
            query,
            workspacesSearched: this.workspaceInfo.totalFolders,
            totalMatches: results.reduce((sum, r) => sum + (r.matches?.length || 0), 0),
            results
        };
    }
    async searchInWorkspace(workspace, query) {
        const results = [];
        const extensions = ['.ts', '.js', '.tsx', '.jsx', '.cs', '.py', '.java'];
        const searchDir = (dir) => {
            if (!fs.existsSync(dir))
                return;
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    if (['node_modules', '.git', 'bin', 'obj', 'dist'].includes(item))
                        continue;
                    searchDir(fullPath);
                }
                else if (extensions.some(ext => item.endsWith(ext))) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        if (content.toLowerCase().includes(query.toLowerCase())) {
                            results.push({
                                file: fullPath,
                                relativePath: relative(workspace.path, fullPath)
                            });
                        }
                    }
                    catch (error) {
                        // Skip unreadable files
                    }
                }
            }
        };
        searchDir(workspace.path);
        return results.slice(0, 20); // Limit results
    }
}
// Sequential thinking implementation
class EnhancedSequentialThinking {
    thoughts = [];
    thoughtCounter = 0;
    lspClient;
    constructor() {
        this.lspClient = new AutoDetectingWorkspaceLSPClient();
        this.initializeLSP();
    }
    async initializeLSP() {
        const languages = ['typescript', 'javascript', 'csharp', 'python'];
        await this.lspClient.initializeLanguageSupport(languages);
        console.log(`🚀 Multi-root workspace ready with ${this.lspClient.activeLanguages.length} languages`);
    }
    async startThinking(query) {
        const workspaceInfo = this.lspClient.getWorkspaceSummary();
        const thought = {
            id: ++this.thoughtCounter,
            thought: `Analyzing query: ${query}`,
            nextThoughtNeeded: true,
            thoughtNumber: 1,
            totalThoughts: 1,
            workspaceContext: workspaceInfo.workspaceInfo,
            timestamp: new Date()
        };
        this.thoughts.push(thought);
        return thought;
    }
    async analyzeWorkspace() {
        return this.lspClient.getWorkspaceSummary();
    }
    async searchAcrossWorkspaces(query) {
        return await this.lspClient.searchAcrossWorkspaces(query);
    }
}
// Server setup
const server = new Server({
    name: 'multi-root-workspace-thinking',
    version: '1.0.0'
}, {
    capabilities: {
        tools: {},
    },
});
const sequentialThinking = new EnhancedSequentialThinking();
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'start_thinking',
                description: 'Start Multi-Root Workspace Sequential Thinking with auto-detected workspace structure',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'The problem or question to analyze'
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'workspace_analysis',
                description: 'Analyze the auto-detected multi-root workspace structure',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'cross_workspace_search',
                description: 'Search for code patterns across all detected workspace folders',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search term to find across workspaces'
                        }
                    },
                    required: ['query']
                }
            }
        ]
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        if (!args) {
            throw new McpError(ErrorCode.InvalidParams, 'Missing arguments');
        }
        switch (name) {
            case 'start_thinking':
                const query = args.query;
                if (!query) {
                    throw new McpError(ErrorCode.InvalidParams, 'query is required');
                }
                const result = await sequentialThinking.startThinking(query);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            case 'workspace_analysis':
                const analysis = await sequentialThinking.analyzeWorkspace();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(analysis, null, 2)
                        }
                    ]
                };
            case 'cross_workspace_search':
                const searchQuery = args.query;
                if (!searchQuery) {
                    throw new McpError(ErrorCode.InvalidParams, 'query is required');
                }
                const searchResult = await sequentialThinking.searchAcrossWorkspaces(searchQuery);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(searchResult, null, 2)
                        }
                    ]
                };
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Multi-root thinking failed: ${errorMessage}`);
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Multi-Root Sequential Thinking MCP Server running...');
}
main().catch(console.error);
