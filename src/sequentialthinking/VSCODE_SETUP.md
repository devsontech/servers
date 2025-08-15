# VS Code Setup Guide for Sequential Thinking MCP with .NET/Angular LSP

This guide provides comprehensive setup instructions for using the Sequential Thinking MCP server with LSP integration in Visual Studio Code, specifically optimized for .NET Core/ABP Framework and Angular 17+ development.

## Quick Start

### 1. Prerequisites
- ✅ VS Code with GitHub Copilot extension
- ✅ Node.js (v16+) installed
- ✅ .NET SDK (6.0+) for C# development
- ✅ Angular CLI (17+) for frontend development
- ✅ Required LSP servers for .NET/Angular stack

### 2. Install LSP Servers for .NET/Angular Development

```bash
# .NET Development Stack
dotnet tool install --global omnisharp  # C# Language Server

# Frontend Development Stack
npm install -g typescript-language-server typescript  # TypeScript/JavaScript
npm install -g @angular/language-server  # Angular-specific features
npm install -g vscode-css-language-server  # SCSS, CSS, Sass, Less
npm install -g vscode-html-language-server  # HTML templates
npm install -g vscode-json-language-server  # JSON configuration files

# DevOps & Configuration
npm install -g yaml-language-server  # YAML files (Docker Compose, etc.)
npm install -g docker-langserver  # Docker files

# XML Language Server (for .csproj, .sln files)
# Download from: https://github.com/eclipse/lemminx/releases

# Optional: Additional languages
pip install python-lsp-server  # Python backend services
rustup component add rust-analyzer  # Rust (if needed)
go install golang.org/x/tools/gopls@latest  # Go microservices
```

### 3. Build the Sequential Thinking LSP Server

```bash
cd C:\Users\Devson\Source\Repos\servers\src\sequentialthinking
npm install
npm run build:lsp
```

### 4. Configure MCP in VS Code

#### Option A: User Configuration (Global)
1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type and select: `MCP: Open User Configuration`
3. Copy the contents from `vscode-mcp-config.json` to your MCP configuration
4. Update the path if needed

#### Option B: Workspace Configuration (Project-specific)
1. Create `.vscode/mcp.json` in your project root
2. Copy this configuration:

```json
{
  "servers": {
    "sequential-thinking-lsp": {
      "command": "node", 
      "args": [
        "${workspaceFolder}/../servers/src/sequentialthinking/dist/lsp-enhanced-index.js"
      ],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "false"
      }
    }
  }
}
```

### 5. Restart VS Code

After adding the configuration, restart VS Code to load the new MCP server.

### 6. Verify Setup

1. Press `Ctrl+Shift+P`
2. Type: `MCP: List Connected Servers`
3. You should see `sequential-thinking-lsp` in the list

## Usage Examples

### Basic Sequential Thinking in Copilot Chat

Open Copilot Chat (`Ctrl+Shift+I`) and try these examples:

#### Example 1: Initialize LSP for TypeScript Project
```
@sequential-thinking-lsp Use initialize_lsp tool:
{
  "lsp_server_path": "typescript",
  "root_directory": "C:\\Users\\Devson\\myproject"
}
```

#### Example 2: Analyze a Function
```
@sequential-thinking-lsp Use sequentialthinking tool to help me understand this function:

{
  "thought": "I need to analyze this function to understand its purpose and identify any issues",
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "nextThoughtNeeded": true,
  "code_analysis": {
    "file_path": "C:\\Users\\Devson\\myproject\\src\\utils.ts",
    "line": 25,
    "column": 10,
    "operation": "hover",
    "language_id": "typescript"
  }
}
```

#### Example 3: Debug with Diagnostics
```
@sequential-thinking-lsp Continue sequential thinking:

{
  "thought": "Now let me check for any errors or warnings in this file",
  "thoughtNumber": 2,
  "totalThoughts": 3, 
  "nextThoughtNeeded": true,
  "code_analysis": {
    "file_path": "C:\\Users\\Devson\\myproject\\src\\utils.ts",
    "operation": "diagnostics"
  }
}
```

### Advanced Usage Patterns

#### Multi-file Analysis
```
Help me understand the relationship between these files using sequential thinking:

@sequential-thinking-lsp sequentialthinking {
  "thought": "Let me start by examining the main entry point",
  "thoughtNumber": 1,
  "totalThoughts": 4,
  "nextThoughtNeeded": true,
  "code_analysis": {
    "file_path": "C:\\Users\\Devson\\myproject\\src\\index.ts",
    "line": 1,
    "column": 1,
    "operation": "hover"
  }
}
```

#### Branch Analysis for Different Approaches
```
@sequential-thinking-lsp sequentialthinking {
  "thought": "I see two potential solutions - let me explore the first approach",
  "thoughtNumber": 2,
  "totalThoughts": 4,
  "nextThoughtNeeded": true,
  "branchFromThought": 1,
  "branchId": "approach-a",
  "code_analysis": {
    "file_path": "C:\\Users\\Devson\\myproject\\src\\solution-a.ts",
    "line": 15,
    "column": 5,
    "operation": "completion"
  }
}
```

## Practical Workflows for .NET/Angular Development

### Workflow 1: ABP Framework Bug Investigation
1. **Initialize C# LSP** for the ABP solution
2. **Analyze the problematic Application Service** using hover info
3. **Check for compilation errors** via diagnostics
4. **Explore available methods** through completions
5. **Document findings** and recommendations

### Workflow 2: Angular Component Debugging
1. **Initialize TypeScript LSP** for the Angular project  
2. **Examine component TypeScript logic** for binding issues
3. **Check template HTML** for syntax errors
4. **Analyze SCSS styles** for layout problems
5. **Review Angular configuration** if build issues occur

### Workflow 3: Full-Stack Feature Development
1. **Start with C# backend analysis** (Controllers, Services, Entities)
2. **Branch into frontend implementation** (Components, Services, Models)
3. **Analyze configuration files** (appsettings.json, angular.json)
4. **Check styling and templates** (SCSS, HTML)
5. **Verify integration points** between frontend and backend

### Workflow 4: Performance Optimization
1. **Profile C# code** for bottlenecks using hover information
2. **Analyze Angular component lifecycle** methods
3. **Check SCSS compilation** for unused styles
4. **Review database queries** in Entity Framework code
5. **Document optimization recommendations**

## Troubleshooting

### Common Issues

**❌ Server not found in MCP list**
- Check that the path in configuration is correct and absolute
- Ensure you ran `npm run build:lsp` successfully
- Restart VS Code after configuration changes

**❌ LSP initialization fails**
- Install required LSP servers for your language
- Use absolute paths in `file_path` arguments
- Check that the `root_directory` exists and is accessible

**❌ Code analysis returns errors**
- Ensure files exist at specified paths
- Verify line/column numbers are valid (1-based)
- Check that the language_id matches the file type

**❌ Permissions issues on Windows**
- Use forward slashes or properly escaped backslashes in paths
- Run VS Code as administrator if needed
- Ensure Node.js has execution permissions

### Debug Mode

Enable detailed logging by updating your MCP config:
```json
{
  "servers": {
    "sequential-thinking-lsp": {
      "command": "node",
      "args": ["..."],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "false",
        "DEBUG": "true",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

Check logs in VS Code:
1. `View` → `Output`  
2. Select `MCP` from dropdown
3. Look for sequential-thinking-lsp messages

## Tips for Best Results

1. **Always initialize LSP first** before using code analysis
2. **Use absolute file paths** to avoid path resolution issues  
3. **Start with hover operations** to understand code context
4. **Use diagnostics** to catch errors early
5. **Leverage branching** for exploring multiple solutions
6. **Be specific with line/column positions** for accurate results

## Language-Specific Notes for .NET/Angular

### C# (.cs files)
- Requires `omnisharp` language server
- Excellent IntelliSense for .NET Core, ABP Framework patterns
- Supports dependency injection, entity framework, and ABP-specific attributes
- Provides refactoring suggestions and code fixes

### Razor Pages (.cshtml, .razor files)  
- Requires `rzls` (Razor Language Server)
- Mixed HTML/C# syntax support
- Blazor component intelligence
- Server-side and client-side Blazor support

### TypeScript/Angular (.ts, .tsx files)
- Requires `typescript-language-server` and `@angular/language-server`
- Angular-specific decorators and lifecycle methods
- Dependency injection support
- Component, service, and module IntelliSense

### SCSS/CSS (.scss, .sass, .css files)
- Requires `vscode-css-language-server`
- Angular component scoped styles
- Bootstrap and Angular Material integration
- SCSS mixins, functions, and variables support

### Project Files (.csproj, .sln files)
- Uses XML language server (`lemminx`)
- NuGet package reference intelligence
- Build target and property support
- Multi-project solution analysis

### Configuration Files
- **appsettings.json**: JSON with ABP configuration schema
- **angular.json**: Angular workspace configuration
- **package.json**: Node.js dependencies and scripts
- **tsconfig.json**: TypeScript compiler options

### HTML Templates (.html files)
- Angular template syntax support
- Component binding intelligence
- Directive and pipe completion
- Template reference variable support

Remember to:
1. **Use absolute paths** for all file references
2. **Initialize the appropriate LSP server** before analysis
3. **Match language_id** to your file type correctly
4. **Consider framework-specific patterns** (ABP, Angular) in your analysis
