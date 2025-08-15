# .NET Solution Reference Discovery - Complete Usage Guide

## Overview

The Solution Reference Discovery MCP tool provides comprehensive analysis of .NET solution files, offering full reference discovery, dependency analysis, and symbol searching across entire codebases.

## Key Features

### 🔍 **Complete Solution Analysis**
- **Project Discovery**: Automatically finds all projects in a solution
- **Dependency Mapping**: Maps project-to-project dependencies
- **Build Order Calculation**: Determines correct build sequence
- **Package Analysis**: Lists all NuGet package dependencies
- **Source File Inventory**: Catalogs all source files across projects

### 🎯 **Symbol Reference Search**
- **Cross-Project Search**: Find symbol usage across the entire solution
- **Impact Analysis**: Understand the scope of changes before refactoring
- **Architecture Review**: Identify coupling between projects
- **Documentation**: Generate usage reports for classes/methods

### 📊 **Comprehensive Reporting**
- **Project Types**: Identifies Web, Console, Library, etc.
- **Framework Targets**: Shows .NET versions for each project
- **Dependency Graphs**: Visual representation of project relationships
- **Package Dependencies**: Complete package dependency tree

## Configuration

### 1. VS Code Integration

Add to your VS Code `settings.json`:

```json
{
  "github.copilot.chat.experimental.mcpServers": [
    {
      "name": "solution-reference-discovery",
      "command": "node",
      "args": [
        "c:/Users/Devson/Source/Repos/servers/src/sequentialthinking/dist/solution-reference-discovery.js"
      ]
    }
  ]
}
```

### 2. GitHub Copilot Configuration

Create or update `%APPDATA%/Code/User/globalStorage/github.copilot-chat/mcpServers.json`:

```json
{
  "mcpServers": {
    "solution-reference-discovery": {
      "command": "node",
      "args": [
        "c:/path/to/your/solution-reference-discovery.js"
      ]
    }
  }
}
```

## Usage Examples

### Complete Solution Analysis

```typescript
// Analyze entire solution
{
  "tool": "analyze_solution",
  "arguments": {
    "solutionPath": "C:\\MyProject\\MyCompany.MyProduct.sln"
  }
}
```

**Sample Output:**
```json
{
  "summary": {
    "solution": "MyCompany.MyProduct",
    "projectCount": 8,
    "totalSourceFiles": 247,
    "buildOrder": [
      "MyCompany.Core",
      "MyCompany.Domain", 
      "MyCompany.Application",
      "MyCompany.Infrastructure",
      "MyCompany.Web",
      "MyCompany.Tests"
    ]
  },
  "projects": [
    {
      "name": "MyCompany.Core",
      "type": "Class Library",
      "framework": "net8.0",
      "sourceFiles": 23,
      "packageReferences": 5,
      "projectReferences": 0
    }
  ]
}
```

### Symbol Reference Discovery

```typescript
// Find all references to a class
{
  "tool": "find_symbol_references", 
  "arguments": {
    "solutionPath": "C:\\MyProject\\Solution.sln",
    "symbolName": "AuthService"
  }
}
```

**Sample Output:**
```json
{
  "symbol": "AuthService",
  "totalReferences": 15,
  "references": [
    {
      "file": "C:\\MyProject\\Controllers\\AccountController.cs",
      "line": 23,
      "content": "private readonly AuthService _authService;",
      "project": "MyCompany.Web"
    },
    {
      "file": "C:\\MyProject\\Services\\UserService.cs", 
      "line": 45,
      "content": "var result = await _authService.AuthenticateAsync(user);",
      "project": "MyCompany.Application"
    }
  ]
}
```

## Practical Use Cases

### 🏗️ **Architecture Analysis**
```bash
# Analyze solution architecture
"Analyze the solution at C:\\MyProject\\ECommerce.sln and show me the dependency graph"

# Result: Complete project relationships, build order, and coupling analysis
```

### 🔄 **Refactoring Planning**
```bash
# Before major refactoring
"Find all references to UserManager across C:\\MyProject\\Solution.sln"

# Result: Every usage location, helping plan safe refactoring
```

### 📦 **Dependency Management**
```bash
# Package analysis
"Analyze C:\\MyProject\\Solution.sln and show me all NuGet package dependencies"

# Result: Complete package inventory with versions across all projects
```

### 🧪 **Impact Analysis**
```bash
# Change impact assessment
"Search for IPaymentService references in C:\\MyProject\\Solution.sln"

# Result: All implementations and usages, showing change impact
```

### 🏢 **Enterprise Solutions**
```bash
# Large solution analysis
"Analyze the ABP Framework solution at C:\\MyCompany\\Enterprise.sln"

# Result: 
# - 25+ projects analyzed
# - Complete dependency tree
# - Build order optimization
# - Package consolidation opportunities
```

## Integration with Sequential Thinking

### Combined Analysis Workflow

```json
{
  "mcpServers": {
    "solution-discovery": {
      "command": "node",
      "args": ["./dist/solution-reference-discovery.js"]
    },
    "sequential-thinking": {
      "command": "node", 
      "args": ["./dist/vscode-integrated-index.js"]
    }
  }
}
```

**Workflow Example:**
1. **Discover**: `analyze_solution` → Get complete project structure  
2. **Think**: `sequential_thinking` → Plan changes with full context
3. **Search**: `find_symbol_references` → Validate impact scope
4. **Execute**: Apply changes with confidence

## Advanced Features

### 🎯 **Project Type Detection**
- **ASP.NET Core Web**: API and MVC projects
- **Console Applications**: Command-line tools
- **Class Libraries**: Shared code projects  
- **Test Projects**: Unit and integration tests
- **Worker Services**: Background services

### 📈 **Build Optimization**
- **Parallel Build Paths**: Identify projects that can build simultaneously
- **Dependency Cycles**: Detect and report circular dependencies
- **Critical Path Analysis**: Find build bottlenecks

### 🔒 **Security Analysis**
- **Package Vulnerabilities**: Identify outdated packages
- **Dependency Chains**: Trace transitive dependencies
- **License Compliance**: Package license inventory

## Troubleshooting

### Common Issues

1. **Solution Not Found**
   ```
   Error: Solution file not found: C:\Path\To\Solution.sln
   ```
   - Verify the path exists and is accessible
   - Use absolute paths for reliability

2. **Project Parse Errors**
   ```
   Warning: Could not parse project: MyProject.csproj
   ```
   - Check project file is valid XML
   - Ensure .NET SDK is installed

3. **Large Solutions**
   ```
   Note: Analysis may take time for solutions with 50+ projects
   ```
   - Results are cached for performance
   - Consider analyzing specific projects individually

### Performance Tips

- **Incremental Analysis**: Focus on specific project subsets
- **Symbol Search Optimization**: Use specific symbol names vs wildcards
- **File Filtering**: Exclude test files for production analysis

## Integration Examples

### Enterprise .NET Solutions
- **Microservices**: Analyze service dependencies
- **Shared Libraries**: Track usage across services
- **ABP Framework**: Navigate complex modular structures

### Angular + .NET Projects  
- **Full Stack**: Analyze both frontend and backend dependencies
- **Shared Models**: Find TypeScript/C# model usage
- **API Contracts**: Validate client-server coupling

This tool transforms how you understand and navigate complex .NET solutions, providing the insights needed for confident architectural decisions and refactoring.
