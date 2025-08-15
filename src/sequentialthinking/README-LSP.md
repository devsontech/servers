# Sequential Thinking MCP Server with LSP Integration

An enhanced MCP server implementation that provides a tool for dynamic and reflective problem-solving through a structured thinking process, now with comprehensive Language Server Protocol (LSP) integration for .NET Core/ABP Framework and Angular 17+ development.

## Features

### Core Sequential Thinking Features
- Break down complex problems into manageable steps
- Revise and refine thoughts as understanding deepens
- Branch into alternative paths of reasoning
- Adjust the total number of thoughts dynamically
- Generate and verify solution hypotheses

### Comprehensive LSP Integration for .NET/Angular Development
- **Full .NET Stack Support**: C#, Razor Pages, XML project files, configuration
- **Complete Angular/Frontend Stack**: TypeScript, JavaScript, HTML, SCSS/CSS/Sass/Less
- **Configuration Intelligence**: JSON, JSONC, YAML, XML, INI files
- **DevOps Integration**: Docker, PowerShell, Shell scripts
- **Multi-language Support**: Python, Rust, Go, Java, and more
- **Real-time Analysis**: Get hover information, completions, and diagnostics
- **Framework Awareness**: ABP patterns, Angular components, .NET conventions

## Tools

### sequential_thinking (Enhanced)

Facilitates a detailed, step-by-step thinking process with optional code analysis capabilities.

**Core Inputs:**
- `thought` (string): The current thinking step
- `nextThoughtNeeded` (boolean): Whether another thought step is needed
- `thoughtNumber` (integer): Current thought number
- `totalThoughts` (integer): Estimated total thoughts needed
- `isRevision` (boolean, optional): Whether this revises previous thinking
- `revisesThought` (integer, optional): Which thought is being reconsidered
- `branchFromThought` (integer, optional): Branching point thought number
- `branchId` (string, optional): Branch identifier
- `needsMoreThoughts` (boolean, optional): If more thoughts are needed

**LSP Enhancement:**
- `code_analysis` (object, optional): Code analysis request with:
  - `file_path` (string): Path to the file to analyze
  - `line` (integer): Line number (1-based)
  - `column` (integer): Column position (1-based)
  - `operation` (string): Type of analysis (`hover`, `completion`, `diagnostics`, `definitions`)
  - `language_id` (string, optional): Programming language identifier

### initialize_lsp

Initialize LSP server for code analysis capabilities.

**Inputs:**
- `lsp_server_path` (string): Path to LSP server executable or language identifier
- `root_directory` (string, optional): Root directory for the LSP server

## Usage Examples

### Usage Examples for .NET/Angular Development

#### Example 1: Initialize for .NET Core Project
```json
{
  "tool": "initialize_lsp",
  "arguments": {
    "lsp_server_path": "csharp",
    "root_directory": "C:\\MyProjects\\MyAbpApp"
  }
}
```

#### Example 2: Analyze C# Controller
```json
{
  "tool": "sequentialthinking",
  "arguments": {
    "thought": "Let me analyze this ABP Application Service to understand its functionality and check for any issues",
    "thoughtNumber": 1,
    "totalThoughts": 4,
    "nextThoughtNeeded": true,
    "code_analysis": {
      "file_path": "C:\\MyProjects\\MyAbpApp\\src\\MyApp.Application\\Products\\ProductAppService.cs",
      "line": 25,
      "column": 15,
      "operation": "hover",
      "language_id": "csharp"
    }
  }
}
```

#### Example 3: Debug Angular Component
```json
{
  "tool": "sequentialthinking",
  "arguments": {
    "thought": "This Angular component isn't working as expected. Let me check the TypeScript logic and see what properties are available",
    "thoughtNumber": 1,
    "totalThoughts": 3,
    "nextThoughtNeeded": true,
    "code_analysis": {
      "file_path": "C:\\MyProjects\\MyAbpApp\\angular\\src\\app\\products\\product-list.component.ts",
      "line": 42,
      "column": 18,
      "operation": "completion",
      "language_id": "typescript"
    }
  }
}
```

#### Example 4: Analyze SCSS Styling
```json
{
  "tool": "sequentialthinking", 
  "arguments": {
    "thought": "The styling for this component looks off. Let me check the SCSS file for any issues or missing properties",
    "thoughtNumber": 2,
    "totalThoughts": 3,
    "nextThoughtNeeded": true,
    "code_analysis": {
      "file_path": "C:\\MyProjects\\MyAbpApp\\angular\\src\\app\\products\\product-list.component.scss",
      "line": 15,
      "column": 8,
      "operation": "diagnostics",
      "language_id": "scss"
    }
  }
}
```

#### Example 5: Check Project Configuration
```json
{
  "tool": "sequentialthinking",
  "arguments": {
    "thought": "Let me examine the project file to understand the dependencies and configuration",
    "thoughtNumber": 1,
    "totalThoughts": 2,
    "nextThoughtNeeded": true,
    "code_analysis": {
      "file_path": "C:\\MyProjects\\MyAbpApp\\src\\MyApp.Web\\MyApp.Web.csproj",
      "line": 12,
      "column": 5,
      "operation": "hover",
      "language_id": "xml"
    }
  }
}
```

#### Example 6: Analyze Angular Configuration
```json
{
  "tool": "sequentialthinking",
  "arguments": {
    "thought": "The build is failing. Let me check the Angular configuration for any misconfigurations",
    "thoughtNumber": 1,
    "totalThoughts": 2,
    "nextThoughtNeeded": true,
    "code_analysis": {
      "file_path": "C:\\MyProjects\\MyAbpApp\\angular\\angular.json",
      "line": 25,
      "column": 10,
      "operation": "diagnostics",
      "language_id": "jsonc"
    }
  }
}
```

## Supported Languages & Technologies

### .NET Core/ABP Framework Stack
- **C# (.cs)**: Full IntelliSense, refactoring, debugging support via OmniSharp
- **Razor Pages (.cshtml, .razor)**: Syntax highlighting, IntelliSense for Razor syntax
- **Project Files (.csproj, .sln, .props, .targets)**: XML-based project structure analysis
- **Configuration (.config, web.config, appsettings.json)**: Configuration file intelligence
- **Resources (.resx)**: Resource file management

### Angular 17+ Frontend Stack  
- **TypeScript (.ts, .tsx)**: Full Angular-aware TypeScript support
- **JavaScript (.js, .jsx)**: ES6+ and React support
- **HTML (.html)**: Angular template analysis and IntelliSense
- **SCSS (.scss)**: Advanced Sass preprocessing with Angular integration
- **CSS (.css)**: Standard CSS with modern features
- **Sass (.sass)**: Indented Sass syntax support
- **Less (.less)**: Less preprocessing support

### Configuration & Data Files
- **JSON (.json)**: Standard JSON with schema validation
- **JSONC (.jsonc)**: JSON with comments (tsconfig.json, angular.json, etc.)
- **YAML (.yml, .yaml)**: YAML configuration files
- **XML (.xml, .xsd, .xsl, .xslt)**: XML documents and schemas
- **TOML (.toml)**: Tom's Obvious, Minimal Language
- **INI (.ini)**: Configuration files
- **Environment (.env)**: Environment variables

### DevOps & Tooling
- **Docker (Dockerfile, .dockerignore)**: Container configuration
- **PowerShell (.ps1, .psm1)**: Windows automation scripts
- **Shell Scripts (.sh, .bash, .zsh)**: Unix shell scripting
- **Batch Files (.bat, .cmd)**: Windows batch scripting

### Database & Backend
- **SQL (.sql, .mysql, .pgsql)**: Database queries and scripts
- **Python (.py)**: Backend services and scripting
- **Go (.go)**: Microservices and APIs
- **Java (.java, .kt)**: Enterprise applications
- **Rust (.rs)**: System programming

### Documentation
- **Markdown (.md, .mdx)**: Documentation and README files
- **Plain Text (.txt)**: General text files

### Built-in LSP Server Support

#### .NET Development
- **OmniSharp**: C# language server with full .NET Core support
- **Razor Language Server (rzls)**: Razor Pages and Blazor components
- **XML Language Server (LemMinX)**: Project files, configuration, documentation

#### Frontend Development  
- **TypeScript Language Server**: TypeScript/JavaScript with Angular awareness
- **Angular Language Server**: Angular-specific features and templates
- **CSS Language Server**: SCSS, Sass, Less, and standard CSS
- **HTML Language Server**: HTML templates with framework integration
- **JSON Language Server**: Configuration files with schema validation

#### Additional Languages
- **Python Language Server (pylsp)**: Python development
- **Rust Analyzer**: Rust programming
- **Go Language Server (gopls)**: Go development
- **Java Language Server (jdtls)**: Java enterprise development

#### DevOps & Configuration
- **YAML Language Server**: Kubernetes, Docker Compose, CI/CD
- **Docker Language Server**: Dockerfile and containerization
- **PowerShell Language Server**: Windows automation

## Installation

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- .NET SDK (6.0 or later) for C# development
- Angular CLI (17+) for Angular development
- Required LSP servers for your technology stack:

```bash
# .NET Development
# Install OmniSharp (C#)
dotnet tool install --global omnisharp

# Frontend Development  
# TypeScript/JavaScript Language Server
npm install -g typescript-language-server typescript

# Angular Language Server
npm install -g @angular/language-server

# CSS/SCSS Language Servers
npm install -g vscode-css-language-server
npm install -g vscode-html-language-server
npm install -g vscode-json-language-server

# Configuration & DevOps
npm install -g yaml-language-server
npm install -g docker-langserver

# XML Language Server (for .csproj, .sln files)
# Download from: https://github.com/eclipse/lemminx/releases

# Optional: Additional Language Servers
pip install python-lsp-server  # Python
rustup component add rust-analyzer  # Rust
go install golang.org/x/tools/gopls@latest  # Go
```

### Build from Source

```bash
# Clone and navigate to the sequential thinking directory
cd src/sequentialthinking

# Install dependencies
npm install

# Build the LSP-enhanced version
npm run build:lsp
```

## Configuration

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

#### With TypeScript Support
```json
{
  "mcpServers": {
    "sequential-thinking-lsp": {
      "command": "node",
      "args": [
        "/path/to/servers/src/sequentialthinking/dist/lsp-enhanced-index.js"
      ],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "false"
      }
    }
  }
}
```

#### Docker Version
```json
{
  "mcpServers": {
    "sequentialthinking-lsp": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v", "/path/to/project:/workspace",
        "mcp/sequentialthinking-lsp"
      ]
    }
  }
}
```

### Usage with VS Code

VS Code has built-in support for MCP servers through GitHub Copilot. Here's how to set it up:

#### Method 1: User-level Configuration (Recommended)

1. Open VS Code
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run command: `MCP: Open User Configuration`
4. Add the server configuration to your `mcp.json`:

```json
{
  "servers": {
    "sequential-thinking-lsp": {
      "command": "node",
      "args": [
        "/path/to/servers/src/sequentialthinking/dist/lsp-enhanced-index.js"
      ],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "false",
        "DEBUG": "true"
      }
    }
  }
}
```

#### Method 2: Workspace Configuration

Create `.vscode/mcp.json` in your workspace root:

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

#### Method 3: Using NPX (if published)

```json
{
  "servers": {
    "sequential-thinking-lsp": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-sequential-thinking-lsp"
      ]
    }
  }
}
```

#### VS Code Setup Steps

1. **Install GitHub Copilot Extension** (if not already installed)
2. **Build the LSP-enhanced server**:
   ```bash
   cd src/sequentialthinking
   npm install
   npm run build:lsp
   ```
3. **Configure MCP server** using one of the methods above
4. **Restart VS Code** to load the new configuration
5. **Verify connection** by checking the MCP status in the Command Palette

## VS Code Integration Guide

### Prerequisites
- VS Code with GitHub Copilot extension installed
- Node.js installed on your system
- Built LSP-enhanced server (see Installation section)

### Step-by-Step Setup

#### 1. Build the Server
```bash
cd /path/to/servers/src/sequentialthinking
npm install
npm run build:lsp
```

#### 2. Configure MCP in VS Code
Open Command Palette (`Ctrl+Shift+P`) → `MCP: Open User Configuration`

Add this configuration:
```json
{
  "servers": {
    "sequential-thinking-lsp": {
      "command": "node",
      "args": [
        "C:\\Users\\Devson\\Source\\Repos\\servers\\src\\sequentialthinking\\dist\\lsp-enhanced-index.js"
      ],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "false",
        "DEBUG": "false"
      }
    }
  }
}
```

#### 3. Verify Installation
1. Restart VS Code
2. Open Command Palette → `MCP: List Connected Servers`
3. You should see `sequential-thinking-lsp` in the list

### Using the Tool in VS Code

#### Basic Usage with GitHub Copilot Chat

1. **Open Copilot Chat** (`Ctrl+Shift+I`)

2. **Initialize LSP for your project**:
   ```
   @sequential-thinking-lsp initialize_lsp with arguments:
   {
     "lsp_server_path": "typescript",
     "root_directory": "/path/to/your/project"
   }
   ```

3. **Start sequential thinking with code analysis**:
   ```
   @sequential-thinking-lsp sequentialthinking with arguments:
   {
     "thought": "I need to understand this function's behavior",
     "thoughtNumber": 1,
     "totalThoughts": 3,
     "nextThoughtNeeded": true,
     "code_analysis": {
       "file_path": "/path/to/your/file.ts",
       "line": 42,
       "column": 10,
       "operation": "hover",
       "language_id": "typescript"
     }
   }
   ```

#### Advanced Workflow Example

1. **Debug a function**:
   ```
   Help me debug this function using sequential thinking:
   
   @sequential-thinking-lsp sequentialthinking {
     "thought": "Let me first get hover information to understand the function signature",
     "thoughtNumber": 1,
     "totalThoughts": 4,
     "nextThoughtNeeded": true,
     "code_analysis": {
       "file_path": "C:\\Users\\Devson\\myproject\\src\\utils.ts",
       "line": 15,
       "column": 9,
       "operation": "hover"
     }
   }
   ```

2. **Continue with diagnostics**:
   ```
   @sequential-thinking-lsp sequentialthinking {
     "thought": "Now let me check for any errors or warnings in this file",
     "thoughtNumber": 2,
     "totalThoughts": 4,
     "nextThoughtNeeded": true,
     "code_analysis": {
       "file_path": "C:\\Users\\Devson\\myproject\\src\\utils.ts",
       "operation": "diagnostics"
     }
   }
   ```

### Workspace-Specific Configuration

For project-specific setup, create `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "sequential-thinking-lsp": {
      "command": "node",
      "args": [
        "${workspaceFolder}\\..\\servers\\src\\sequentialthinking\\dist\\lsp-enhanced-index.js"
      ],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "false"
      }
    }
  }
}
```

### Troubleshooting VS Code Integration

#### Common Issues

1. **Server not appearing in MCP list**:
   - Check the file path is correct and absolute
   - Ensure the server is built: `npm run build:lsp`
   - Restart VS Code after configuration changes

2. **LSP initialization fails**:
   - Make sure required LSP servers are installed:
     ```bash
     npm install -g typescript-language-server typescript
     pip install python-lsp-server
     ```
   - Use absolute paths in file_path arguments

3. **Permission errors**:
   - Ensure Node.js has permission to execute the script
   - On Windows, use forward slashes or escaped backslashes in paths

#### Debug Mode

Enable debug mode for detailed logging:
```json
{
  "servers": {
    "sequential-thinking-lsp": {
      "command": "node",
      "args": [
        "C:\\Users\\Devson\\Source\\Repos\\servers\\src\\sequentialthinking\\dist\\lsp-enhanced-index.js"
      ],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "false",
        "DEBUG": "true",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

Then check VS Code's Output panel → "MCP" channel for detailed logs.
   ```json
   {
     "tool": "initialize_lsp",
     "arguments": {
       "lsp_server_path": "typescript",
       "root_directory": "/path/to/my-project"
     }
   }
   ```

2. **Start Sequential Thinking with Code Analysis**:
   ```json
   {
     "tool": "sequentialthinking", 
     "arguments": {
       "thought": "I need to understand what this function does before debugging the issue",
       "thoughtNumber": 1,
       "totalThoughts": 4,
       "nextThoughtNeeded": true,
       "code_analysis": {
         "file_path": "/path/to/my-project/src/buggy-function.ts",
         "line": 25,
         "column": 10,
         "operation": "hover"
       }
     }
   }
   ```

3. **Continue with Diagnostics Analysis**:
   ```json
   {
     "tool": "sequentialthinking",
     "arguments": {
       "thought": "Let me check for any diagnostics or errors in this file",
       "thoughtNumber": 2, 
       "totalThoughts": 4,
       "nextThoughtNeeded": true,
       "code_analysis": {
         "file_path": "/path/to/my-project/src/buggy-function.ts",
         "operation": "diagnostics"
       }
     }
   }
   ```

## Benefits of LSP Integration

1. **Enhanced Code Understanding**: Access real-time type information, documentation, and code intelligence during the thinking process

2. **Context-Aware Problem Solving**: Analyze specific code locations while reasoning about problems

3. **Multi-Language Support**: Work with different programming languages using their respective LSP servers

4. **Real-time Feedback**: Get immediate diagnostics and completion suggestions while thinking

5. **File-based Analysis**: Open and analyze specific files without leaving the thinking context

6. **Intelligent Debugging**: Combine logical reasoning with code analysis for better problem-solving

## Building Docker Image

```bash
docker build -t mcp/sequentialthinking-lsp -f src/sequentialthinking/Dockerfile-lsp .
```

## Environment Variables

- `DISABLE_THOUGHT_LOGGING`: Set to `"true"` to disable thought output logging
- `DEBUG`: Set to `"true"` for verbose debugging output
- `LOG_LEVEL`: Set logging level (`debug`, `info`, `warn`, `error`)

## Comparison with Standard Version

| Feature | Standard Version | LSP-Enhanced Version |
|---------|------------------|---------------------|
| Sequential Thinking | ✅ | ✅ |
| Code Analysis | ❌ | ✅ |
| Multi-language Support | ❌ | ✅ |
| Real-time Diagnostics | ❌ | ✅ |
| Code Completion | ❌ | ✅ |
| Hover Information | ❌ | ✅ |
| File Context | ❌ | ✅ |

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
