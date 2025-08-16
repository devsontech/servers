# Multi-Root Workspace Support Guide

## Overview

Enhanced VS Code multi-root workspace support for the Sequential Thinking MCP Server with full solution reference discovery. This provides comprehensive analysis across multiple workspace folders, perfect for complex enterprise development environments.

## 🏗️ **Multi-Root Workspace Features**

### **Automatic Workspace Detection**
- ✅ Detects VS Code multi-root workspace configuration
- ✅ Parses workspace folders from environment variables
- ✅ Supports both single and multi-root workspaces
- ✅ Provides fallback to current directory

### **Cross-Workspace Analysis**
- 🔍 **Search across all workspace folders** simultaneously
- 🗂️ **Workspace-aware file organization** and context
- 🔗 **Cross-project dependency tracking** and analysis
- 📊 **Multi-project architecture visualization**

### **Language Server Integration**
- 🚀 **Per-workspace language servers** for optimal performance
- 🎯 **Workspace-specific context** for each analysis
- 🔧 **Automatic language detection** based on file extensions
- ⚡ **Parallel language server initialization** across workspaces

## 📁 **Supported Workspace Configurations**

### **Enterprise Monorepos**
```
MyCompany-Workspace/
├── backend/
│   ├── MyCompany.Core/
│   ├── MyCompany.API/
│   └── MyCompany.Services/
├── frontend/
│   ├── admin-portal/
│   └── customer-portal/
└── shared/
    ├── models/
    └── utilities/
```

### **Microservices Architecture**
```
Microservices-Workspace/
├── auth-service/
├── payment-service/
├── notification-service/
├── api-gateway/
└── shared-libraries/
```

### **Full-Stack Development**
```
FullStack-Project/
├── client/ (Angular/React)
├── server/ (.NET Core/Node.js)
├── shared/ (TypeScript models)
└── infrastructure/ (Docker/K8s)
```

## ⚙️ **Configuration**

### **VS Code Multi-Root Workspace File (.code-workspace)**
```json
{
  "folders": [
    {
      "name": "Backend",
      "path": "./backend"
    },
    {
      "name": "Frontend",
      "path": "./frontend"
    },
    {
      "name": "Shared",
      "path": "./shared"
    }
  ],
  "settings": {
    "github.copilot.chat.experimental.mcpServers": [
      {
        "name": "multi-root-workspace-thinking",
        "command": "node",
        "args": [
          "c:/path/to/multi-root-workspace-index.js"
        ]
      }
    ]
  }
}
```

### **MCP Configuration (mcpServers.json)**
```json
{
  "mcpServers": {
    "multi-root-workspace-thinking": {
      "command": "node", 
      "args": [
        "c:/Users/Devson/Source/Repos/servers/src/sequentialthinking/dist/multi-root-workspace-index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "VSCODE_WORKSPACE": "${workspaceFolder}",
        "VSCODE_WORKSPACE_FOLDERS": "${workspaceFolders}",
        "VSCODE_WORKSPACE_FILE": "${workspaceFile}",
        "VSCODE_WORKSPACE_NAME": "${workspaceFolderBasename}",
        "ENABLE_MULTI_ROOT": "true"
      }
    }
  }
}
```

## 🛠️ **Available Tools**

### **1. start_thinking**
Enhanced sequential thinking with multi-workspace context

**Parameters:**
- `query` (required): Problem to analyze
- `filePath` (optional): Specific file for analysis (auto-detects workspace)
- `workspaceFolder` (optional): Target specific workspace by name

**Example:**
```json
{
  "tool": "start_thinking",
  "arguments": {
    "query": "Analyze the authentication flow across our microservices",
    "filePath": "C:\\Projects\\MyApp\\auth-service\\Controllers\\AuthController.cs",
    "workspaceFolder": "Backend"
  }
}
```

### **2. workspace_analysis**
Complete multi-root workspace structure analysis

**Returns:**
```json
{
  "workspaceInfo": {
    "workspaceFolders": [
      {
        "uri": "file:///C:/Projects/MyApp/backend",
        "name": "backend",
        "path": "C:\\Projects\\MyApp\\backend",
        "isRoot": true
      }
    ],
    "totalFolders": 3,
    "workspaceFile": "C:\\Projects\\MyApp\\workspace.code-workspace"
  },
  "activeLanguages": ["typescript", "csharp", "python"],
  "totalClients": 9
}
```

### **3. cross_workspace_search**
Search for code patterns across all workspace folders

**Example:**
```json
{
  "tool": "cross_workspace_search", 
  "arguments": {
    "query": "AuthService"
  }
}
```

**Returns:**
```json
{
  "query": "AuthService",
  "workspacesSearched": 3,
  "totalMatches": 12,
  "results": [
    {
      "workspace": "Backend",
      "path": "C:\\Projects\\MyApp\\backend",
      "matches": [
        {
          "file": "C:\\Projects\\MyApp\\backend\\Services\\AuthService.cs",
          "relativePath": "Services\\AuthService.cs",
          "matches": [
            {
              "line": 23,
              "content": "public class AuthService : IAuthService",
              "context": {
                "before": "namespace MyApp.Services {",
                "after": "    private readonly IUserRepository _userRepo;"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 🎯 **Use Cases**

### **Enterprise Development**
```typescript
// Analyze complex enterprise solution
{
  "tool": "start_thinking",
  "arguments": {
    "query": "Review the ABP Framework implementation across our solution",
    "workspaceFolder": "Backend"
  }
}

// Search for shared interfaces
{
  "tool": "cross_workspace_search",
  "arguments": {
    "query": "IApplicationService"
  }
}
```

### **Microservices Architecture**
```typescript
// Analyze service dependencies
{
  "tool": "workspace_analysis"
}

// Find cross-service communication patterns  
{
  "tool": "cross_workspace_search",
  "arguments": {
    "query": "HttpClient"
  }
}
```

### **Full-Stack Development**
```typescript
// Analyze shared models between frontend/backend
{
  "tool": "cross_workspace_search",
  "arguments": {
    "query": "UserModel"
  }
}

// Review API contract consistency
{
  "tool": "start_thinking",
  "arguments": {
    "query": "Validate API contracts between Angular client and .NET API",
    "filePath": "C:\\Project\\frontend\\src\\services\\user.service.ts"
  }
}
```

## 🚀 **Advanced Features**

### **Workspace-Aware Context**
- Each analysis includes the originating workspace folder
- Relative paths within workspace for cleaner results
- Cross-workspace dependency mapping

### **Parallel Language Server Support**
- Multiple C# language servers for different .NET projects
- TypeScript servers for frontend and backend Node.js projects
- Python servers for data processing and automation scripts

### **Intelligent File Organization**
- Automatic workspace folder detection based on file paths
- Smart fallback to root workspace when path doesn't match
- Support for symbolic links and junction points

### **Performance Optimization**
- Language servers initialized only for active workspaces
- Cached workspace analysis for repeated queries
- Selective search across relevant workspace folders

## 🔧 **Environment Variables**

The tool automatically detects these VS Code-provided environment variables:

- `VSCODE_WORKSPACE_FOLDERS`: JSON array or semicolon-separated folder paths
- `VSCODE_WORKSPACE_FILE`: Path to .code-workspace file
- `VSCODE_WORKSPACE_NAME`: Active workspace name
- `VSCODE_WORKSPACE`: Current workspace folder (single-root fallback)
- `ENABLE_MULTI_ROOT`: Explicitly enable multi-root features

## ⚡ **Performance Tips**

### **Optimize Search Queries**
- Use specific terms rather than broad searches
- Target specific workspace folders when possible
- Limit search to relevant file extensions

### **Language Server Management**
- Language servers auto-initialize based on file types found
- Unused language servers are not started
- Graceful degradation when language servers unavailable

### **Memory Management**
- Workspace analysis results are cached
- Language server connections reused across requests
- Automatic cleanup of unused resources

This multi-root workspace support transforms how you work with complex, multi-project development environments, providing seamless analysis and context across your entire solution architecture.
