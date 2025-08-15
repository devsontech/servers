# VS Code Setup Guide - Enhanced Sequential Thinking with Existing Language Servers

This guide shows how to set up the Enhanced Sequential Thinking MCP Server to work with **VS Code's existing language servers** for optimal performance and integration.

## 🎯 **Key Advantage: Use Existing VS Code Extensions**

Instead of installing separate language servers, this enhanced version leverages the language servers that are already built into VS Code or available through your existing extensions. This means:

✅ **No duplicate installations** - Use what you already have  
✅ **Better performance** - Optimized VS Code integration  
✅ **Automatic updates** - Language servers update with VS Code/extensions  
✅ **Consistent experience** - Same language support as your editor  

## 📋 **Prerequisites**

### Required Extensions for Full .NET/Angular Support

Install these popular VS Code extensions to enable comprehensive language support:

#### **Essential Extensions:**
```bash
# .NET Development - Choose one:
code --install-extension ms-dotnettools.csdevkit  # Full .NET experience (recommended)
# OR
code --install-extension ms-dotnettools.csharp    # Basic C# support

# Angular Development  
code --install-extension Angular.ng-template

# Configuration Files
code --install-extension redhat.vscode-xml
code --install-extension redhat.vscode-yaml
```

#### **Optional but Recommended:**
```bash
# Enhanced development experience
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-vscode.powershell
code --install-extension ms-python.python
```

### **Built-in Language Support** (No installation needed)
VS Code already includes these language servers:
- **TypeScript/JavaScript** - Built into VS Code
- **CSS/SCSS/LESS/Sass** - Built into VS Code  
- **HTML** - Built into VS Code
- **JSON/JSONC** - Built into VS Code

## 🚀 **Setup Instructions**

### **Step 1: Build the Enhanced Server**

```powershell
# Navigate to the sequential thinking directory
cd "C:\Users\Devson\Source\Repos\servers\src\sequentialthinking"

# Install dependencies
npm install

# Build the VS Code integrated version
npx tsc vscode-integrated-index.ts --target es2020 --module commonjs --outDir dist --moduleResolution node
npx tsc vscode-lsp-integration.ts --target es2020 --module commonjs --outDir dist --moduleResolution node
```

### **Step 2: Configure GitHub Copilot for MCP**

Create or update your MCP configuration file:

**Location:** `%APPDATA%\Code\User\globalStorage\github.copilot-chat\mcpServers.json`

```json
{
  "mcpServers": {
    "enhanced-sequential-thinking": {
      "command": "node",
      "args": ["C:\\Users\\Devson\\Source\\Repos\\servers\\src\\sequentialthinking\\dist\\vscode-integrated-index.js"],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "false"
      }
    }
  }
}
```

### **Step 3: Restart VS Code**

1. Close all VS Code instances
2. Restart VS Code
3. The MCP server will automatically connect to GitHub Copilot

## 💻 **Usage Examples**

### **Basic Problem Solving with Code Context**

```typescript
// In GitHub Copilot Chat, use the @enhanced-sequential-thinking tool:

// Example 1: Analyzing C# Authentication Flow
{
  "thought": "I need to analyze why the authentication is failing in this ABP application",
  "nextThoughtNeeded": true,
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "filePath": "C:\\MyProject\\src\\MyApp.Application\\Auth\\AuthAppService.cs"
}
```

### **Frontend Integration Analysis**

```typescript
// Example 2: Angular Component Issue
{
  "thought": "The Angular component isn't receiving data from the .NET API endpoint",
  "nextThoughtNeeded": true,
  "thoughtNumber": 1,
  "totalThoughts": 4,
  "filePath": "C:\\MyProject\\angular\\src\\app\\auth\\auth.component.ts",
  "codeSnippet": "constructor(private authService: AuthService) {}"
}
```

### **Configuration File Analysis**

```typescript
// Example 3: Project Configuration
{
  "thought": "The dependency injection configuration might be causing issues",
  "nextThoughtNeeded": true,
  "thoughtNumber": 2,
  "totalThoughts": 5,
  "filePath": "C:\\MyProject\\src\\MyApp.Web\\MyAppWebModule.cs"
}
```

## 🔍 **Available Tools**

### **1. `sequentialthinking`** 
Advanced problem-solving with code intelligence
- Automatic language detection
- Real-time code analysis via VS Code extensions
- Context-aware suggestions

### **2. `analyze_code`**
Direct code analysis for any file
- Hover information 
- Code completions
- Diagnostic information
- Extension recommendations

### **3. `get_supported_languages`**
View all supported languages and extension status
- Shows active language servers
- Lists required extensions
- Provides installation recommendations

## 📊 **Language Support Matrix**

| Language | Extension Required | Auto-Detection |
|----------|-------------------|----------------|
| **C#** | `ms-dotnettools.csdevkit` | ✅ `.cs`, `.csx` |
| **Razor** | `ms-dotnettools.csharp` | ✅ `.cshtml`, `.razor` |
| **TypeScript** | Built-in | ✅ `.ts`, `.tsx`, `.mts` |
| **JavaScript** | Built-in | ✅ `.js`, `.jsx`, `.mjs` |
| **Angular** | `Angular.ng-template` | ✅ `.html` (Angular) |
| **SCSS** | Built-in | ✅ `.scss`, `.sass` |
| **CSS** | Built-in | ✅ `.css`, `.less` |
| **HTML** | Built-in | ✅ `.html`, `.htm` |
| **JSON** | Built-in | ✅ `.json`, `.jsonc` |
| **XML** | `redhat.vscode-xml` | ✅ `.xml`, `.csproj` |
| **YAML** | `redhat.vscode-yaml` | ✅ `.yml`, `.yaml` |
| **PowerShell** | `ms-vscode.powershell` | ✅ `.ps1`, `.psm1` |

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. "No language server available"**
**Solution:** Install the required VS Code extension:
```bash
# For C# files:
code --install-extension ms-dotnettools.csdevkit

# For Angular:
code --install-extension Angular.ng-template

# For XML (.csproj files):
code --install-extension redhat.vscode-xml
```

#### **2. "MCP server not found"**
**Solution:** Check your configuration path:
- Ensure the path in `mcpServers.json` points to the correct `.js` file
- Verify the file exists after building
- Restart VS Code completely

#### **3. "Language detection not working"**
**Solution:** The tool detects languages by file extension:
- Use full file paths: `C:\MyProject\src\file.cs`
- Ensure file extensions are correct
- Check supported extensions in the language matrix above

### **Performance Tips**

1. **Install only needed extensions** - Don't install unused language extensions
2. **Use specific file paths** - Helps with accurate language detection  
3. **Close unused projects** - Reduces VS Code resource usage
4. **Update extensions regularly** - Ensures latest language server features

## 🌟 **Advanced Features**

### **Branching Thoughts for Complex Problems**

```typescript
// Main analysis branch
{
  "thought": "Investigating authentication flow",
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "filePath": "C:\\MyProject\\src\\Auth\\AuthService.cs"
}

// Create branch for specific issue
{
  "thought": "The JWT token validation might be the issue",
  "thoughtNumber": 1,
  "totalThoughts": 2,
  "branchFromThought": 1,
  "branchId": "jwt-investigation",
  "filePath": "C:\\MyProject\\src\\Auth\\JwtTokenValidator.cs"
}
```

### **Code Intelligence Features**

When you provide a `filePath`, the tool automatically:
- **Detects the programming language**
- **Provides hover information** for symbols under cursor
- **Suggests code completions** 
- **Shows diagnostic information** (errors, warnings)
- **Recommends VS Code extensions** if needed

## 🎓 **Best Practices**

1. **Always provide file paths** when analyzing code-related issues
2. **Use specific, absolute paths** for best language detection
3. **Keep VS Code extensions updated** for latest language features
4. **Use branching for complex multi-part problems**
5. **Leverage code snippets** for targeted analysis

## 📚 **Integration Examples**

### **.NET Core / ABP Framework**
- Analysis of dependency injection configurations
- Entity framework queries and mappings  
- API controller implementations
- Background service implementations

### **Angular 17+**
- Component lifecycle issues
- Service dependency problems
- Routing configuration
- Template binding problems
- State management with signals

### **Full-Stack Integration**
- API endpoint consumption from Angular
- Authentication flow between frontend/backend
- Configuration consistency across layers
- Build and deployment pipeline issues

---

## 🆘 **Support**

If you encounter issues:
1. Check the [Language Support Matrix](#-language-support-matrix)
2. Verify required extensions are installed
3. Ensure file paths are absolute and correct
4. Restart VS Code after configuration changes
5. Check VS Code's Output panel for error details
