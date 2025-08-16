import { join } from 'path';
import * as os from 'os';
/**
 * Get VS Code extension directory based on platform
 */
function getVSCodeExtensionsDir() {
    const platform = os.platform();
    const homeDir = os.homedir();
    switch (platform) {
        case 'win32':
            return join(homeDir, '.vscode', 'extensions');
        case 'darwin':
            return join(homeDir, '.vscode', 'extensions');
        case 'linux':
            return join(homeDir, '.vscode', 'extensions');
        default:
            return join(homeDir, '.vscode', 'extensions');
    }
}
/**
 * Configuration for using VS Code's built-in and extension language servers
 */
export const VSCodeLanguageServers = {
    // C# - Uses C# DevKit extension (ms-dotnettools.csharp)
    'csharp': {
        extensionId: 'ms-dotnettools.csharp',
        serverPath: 'Microsoft.CodeAnalysis.LanguageServer',
        args: ['--stdio'],
        workspaceConfig: {
            'dotnet.server.useOmnisharp': false,
            'csharp.semanticHighlighting.enabled': true
        }
    },
    // TypeScript - Built into VS Code
    'typescript': {
        extensionId: 'vscode.typescript-language-features',
        serverPath: 'typescript-language-server',
        args: ['--stdio', '--log-level', '2'],
        workspaceConfig: {
            'typescript.preferences.includePackageJsonAutoImports': 'auto',
            'typescript.suggest.autoImports': true
        }
    },
    // JavaScript - Built into VS Code  
    'javascript': {
        extensionId: 'vscode.typescript-language-features',
        serverPath: 'typescript-language-server',
        args: ['--stdio', '--log-level', '2'],
        workspaceConfig: {
            'javascript.preferences.includePackageJsonAutoImports': 'auto',
            'javascript.suggest.autoImports': true
        }
    },
    // Angular - Angular Language Service extension
    'angular': {
        extensionId: 'Angular.ng-template',
        serverPath: '@angular/language-server',
        args: ['--stdio', '--tsProbeLocations', './node_modules', '--ngProbeLocations', './node_modules'],
        workspaceConfig: {
            'angular.enableTemplateLanguageService': true,
            'angular.log': 'verbose'
        }
    },
    // CSS - Built into VS Code
    'css': {
        extensionId: 'vscode.css-language-features',
        serverPath: 'vscode-css-language-server',
        args: ['--stdio'],
        workspaceConfig: {
            'css.validate': true,
            'css.lint.enabled': true
        }
    },
    // SCSS - Built into VS Code
    'scss': {
        extensionId: 'vscode.css-language-features',
        serverPath: 'vscode-css-language-server',
        args: ['--stdio'],
        workspaceConfig: {
            'scss.validate': true,
            'scss.lint.enabled': true
        }
    },
    // HTML - Built into VS Code
    'html': {
        extensionId: 'vscode.html-language-features',
        serverPath: 'vscode-html-language-server',
        args: ['--stdio'],
        workspaceConfig: {
            'html.validate.scripts': true,
            'html.validate.styles': true
        }
    },
    // JSON - Built into VS Code
    'json': {
        extensionId: 'vscode.json-language-features',
        serverPath: 'vscode-json-language-server',
        args: ['--stdio'],
        workspaceConfig: {
            'json.validate.enable': true,
            'json.schemaDownload.enable': true
        }
    },
    // Razor - C# DevKit extension
    'razor': {
        extensionId: 'ms-dotnettools.csharp',
        serverPath: 'rzls',
        args: ['--stdio'],
        workspaceConfig: {
            'razor.languageServer.debug': false,
            'razor.format.enable': true
        }
    },
    // XML - Red Hat XML extension (widely used)
    'xml': {
        extensionId: 'redhat.vscode-xml',
        serverPath: 'lemminx',
        args: [],
        workspaceConfig: {
            'xml.validation.enabled': true,
            'xml.format.enabled': true
        }
    },
    // YAML - Red Hat YAML extension
    'yaml': {
        extensionId: 'redhat.vscode-yaml',
        serverPath: 'yaml-language-server',
        args: ['--stdio'],
        workspaceConfig: {
            'yaml.validate': true,
            'yaml.format.enable': true
        }
    },
    // Python - Python extension (ms-python.python)
    'python': {
        extensionId: 'ms-python.python',
        serverPath: 'pylsp', // or 'python-lsp-server'
        args: [],
        workspaceConfig: {
            'python.linting.enabled': true,
            'python.analysis.autoImportCompletions': true
        }
    },
    // PowerShell - PowerShell extension
    'powershell': {
        extensionId: 'ms-vscode.powershell',
        serverPath: 'powershell-editor-services',
        args: [],
        workspaceConfig: {
            'powershell.integratedConsole.showOnStartup': false,
            'powershell.codeFormatting.preset': 'OTBS'
        }
    }
};
/**
 * Find the actual path to a VS Code extension's language server
 */
export function findVSCodeLanguageServer(languageId) {
    const config = VSCodeLanguageServers[languageId];
    if (!config)
        return null;
    const extensionsDir = getVSCodeExtensionsDir();
    try {
        // For built-in extensions, they might be in a different location
        if (config.extensionId.startsWith('vscode.')) {
            // These are built-in, use the system's VS Code installation
            return config;
        }
        // For third-party extensions, look in the extensions directory
        const extensionPattern = config.extensionId.replace('.', '\\.');
        // Extension directories usually have version numbers appended
        // We'll return the config as-is and let the caller handle path resolution
        return config;
    }
    catch (error) {
        console.warn(`Could not find VS Code extension: ${config.extensionId}`);
        return null;
    }
}
/**
 * Enhanced LSP Client that can use VS Code's language servers
 */
export class VSCodeLSPClient {
    process;
    languageId;
    config;
    messageId = 1;
    constructor(languageId, config) {
        this.languageId = languageId;
        this.config = config;
    }
    async start(rootUri) {
        // Try to use the language server via VS Code's extension host
        // This approach integrates with VS Code's existing language servers
        try {
            // Option 1: Use VS Code's built-in language servers via extension API
            if (this.isVSCodeBuiltIn()) {
                await this.startBuiltInServer(rootUri);
            }
            else {
                // Option 2: Use extension-provided language servers
                await this.startExtensionServer(rootUri);
            }
        }
        catch (error) {
            console.warn(`Failed to start VS Code language server for ${this.languageId}:`, error);
            throw error;
        }
    }
    isVSCodeBuiltIn() {
        return this.config.extensionId.startsWith('vscode.');
    }
    async startBuiltInServer(rootUri) {
        // For built-in language servers, we can often access them through VS Code's API
        // This would require running within VS Code's extension context
        console.log(`Starting built-in VS Code language server for ${this.languageId}`);
        // In a VS Code extension context, you would use:
        // const extension = vscode.extensions.getExtension(this.config.extensionId);
        // const api = extension?.exports;
    }
    async startExtensionServer(rootUri) {
        // For extension-provided language servers, find the executable
        const extensionsDir = getVSCodeExtensionsDir();
        console.log(`Starting extension language server for ${this.languageId}`);
        // This would require more complex logic to find the actual server executable
        // within the extension directory structure
    }
    async sendRequest(method, params) {
        // Implementation would depend on how we're communicating with the language server
        // Either through VS Code's extension API or direct process communication
        return {};
    }
    async getHover(uri, position) {
        return this.sendRequest('textDocument/hover', {
            textDocument: { uri },
            position
        });
    }
    async getCompletions(uri, position) {
        return this.sendRequest('textDocument/completion', {
            textDocument: { uri },
            position
        });
    }
    async getDiagnostics(uri) {
        // VS Code handles diagnostics automatically
        return [];
    }
    async stop() {
        if (this.process) {
            this.process.kill();
            this.process = undefined;
        }
    }
}
/**
 * Factory function to create LSP clients for VS Code integration
 */
export function createVSCodeLSPClient(languageId) {
    const config = findVSCodeLanguageServer(languageId);
    if (!config) {
        console.warn(`No VS Code language server configuration found for: ${languageId}`);
        return null;
    }
    return new VSCodeLSPClient(languageId, config);
}
/**
 * Check if a specific VS Code extension is installed
 */
export async function isVSCodeExtensionInstalled(extensionId) {
    // In a VS Code extension context, you would use:
    // return vscode.extensions.getExtension(extensionId) !== undefined;
    // For now, assume extensions are available if commonly used
    const commonExtensions = [
        'ms-dotnettools.csharp',
        'Angular.ng-template',
        'redhat.vscode-xml',
        'redhat.vscode-yaml',
        'ms-python.python',
        'ms-vscode.powershell'
    ];
    return commonExtensions.includes(extensionId);
}
