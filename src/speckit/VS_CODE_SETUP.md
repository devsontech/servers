# VS Code MCP Server Setup Guide

## Quick Setup

Add this configuration to your VS Code MCP settings:

```json
{
  "mcpServers": {
    "speckit": {
      "command": "node",
      "args": ["C:\\Users\\Devson\\Source\\Repos\\servers\\src\\speckit\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Step-by-Step Setup Instructions

### 1. Ensure the Server is Built

First, make sure the Spec-Kit MCP server is compiled:

```bash
cd "C:\Users\Devson\Source\Repos\servers\src\speckit"
npm run build
```

### 2. Configure VS Code MCP Settings

#### Option A: User Settings (Recommended)
1. Open VS Code
2. Press `Ctrl+Shift+P` to open Command Palette
3. Type "Preferences: Open User Settings (JSON)"
4. Add the MCP server configuration to your settings:

```json
{
  "mcp.servers": {
    "speckit": {
      "command": "node",
      "args": ["C:\\Users\\Devson\\Source\\Repos\\servers\\src\\speckit\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Option B: Workspace Settings
1. In your workspace root, create/edit `.vscode/settings.json`
2. Add the same configuration as above

### 3. Alternative Configuration Formats

#### Using npm script:
```json
{
  "mcp.servers": {
    "speckit": {
      "command": "npm",
      "args": ["run", "start"],
      "cwd": "C:\\Users\\Devson\\Source\\Repos\\servers\\src\\speckit",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Using absolute path with environment variables:
```json
{
  "mcp.servers": {
    "speckit": {
      "command": "node",
      "args": ["${workspaceFolder}/../servers/src/speckit/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

### 4. Configuration Options

#### Development Mode (with debugging):
```json
{
  "mcp.servers": {
    "speckit-dev": {
      "command": "node",
      "args": [
        "--inspect=9229",
        "C:\\Users\\Devson\\Source\\Repos\\servers\\src\\speckit\\dist\\index.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "mcp:*",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

#### Multiple Configurations:
```json
{
  "mcp.servers": {
    "speckit-prod": {
      "command": "node",
      "args": ["C:\\Users\\Devson\\Source\\Repos\\servers\\src\\speckit\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "speckit-dev": {
      "command": "node",
      "args": [
        "--inspect=9229", 
        "C:\\Users\\Devson\\Source\\Repos\\servers\\src\\speckit\\dist\\index.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

## Available Tools

Once configured, you'll have access to these Spec-Kit tools in VS Code:

### Project Management
- `init_project` - Initialize new SDD project
- `configure_directories` - Configure custom directory structure

### Specification Management
- `create_specification` - Create feature specifications
- `update_specification` - Update existing specifications
- `get_specification` - Retrieve specification content
- `list_specifications` - List all specifications

### Implementation Planning
- `create_implementation_plan` - Generate implementation plans
- `update_implementation_plan` - Update existing plans
- `get_implementation_plan` - Retrieve plan content
- `list_implementation_plans` - List all plans

### Task Management
- `create_tasks` - Create task breakdowns
- `update_tasks` - Update task lists
- `get_tasks` - Retrieve task content
- `list_tasks` - List all tasks

### Template Management
- `create_custom_template` - Create custom templates
- `generate_template` - Generate context-aware templates
- `list_templates` - List available templates
- `apply_template` - Apply templates with variables

### Enterprise Features
- `execute_governance_task` - Governance workflows
- `execute_security_task` - Security assessments
- `execute_cicd_task` - CI/CD management
- `execute_monitoring_task` - Monitoring setup
- `execute_scalability_task` - Scalability analysis

## Verification

### 1. Check Server Status
After adding the configuration, restart VS Code and check if the MCP server is running:

1. Open VS Code Developer Tools (`Help > Toggle Developer Tools`)
2. Check the Console for MCP server startup messages
3. Look for "Spec-Kit MCP Server" initialization logs

### 2. Test Tool Access
Try using a simple tool to verify the connection:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Look for MCP tool commands
3. Try running `init_project` or `list_templates`

### 3. Debug Connection Issues
If the server doesn't start:

1. Check the file path exists: `C:\Users\Devson\Source\Repos\servers\src\speckit\dist\index.js`
2. Verify Node.js is in your PATH
3. Check VS Code logs for error messages
4. Try running the server manually: `node "C:\Users\Devson\Source\Repos\servers\src\speckit\dist\index.js"`

## Troubleshooting

### Common Issues

#### 1. File Path Not Found
**Error**: `ENOENT: no such file or directory`
**Solution**: 
- Verify the path: `C:\Users\Devson\Source\Repos\servers\src\speckit\dist\index.js`
- Run `npm run build` to ensure the dist folder exists

#### 2. Node.js Not Found
**Error**: `'node' is not recognized`
**Solution**: 
- Install Node.js or ensure it's in your PATH
- Use full path to node.exe: `"C:\\Program Files\\nodejs\\node.exe"`

#### 3. Permission Issues
**Error**: `EACCES: permission denied`
**Solution**: 
- Run VS Code as administrator
- Check file permissions on the dist folder

#### 4. Server Crashes
**Error**: Server starts but immediately crashes
**Solution**: 
- Check dependencies: `npm install`
- Check for TypeScript compilation errors: `npm run build`
- Enable debug logging: `"DEBUG": "mcp:*"`

### Debug Configuration

For troubleshooting, use this debug configuration:

```json
{
  "mcp.servers": {
    "speckit-debug": {
      "command": "node",
      "args": [
        "--inspect=9229",
        "C:\\Users\\Devson\\Source\\Repos\\servers\\src\\speckit\\dist\\index.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "mcp:*",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Advanced Configuration

### Environment Variables
Set additional environment variables for customization:

```json
{
  "mcp.servers": {
    "speckit": {
      "command": "node",
      "args": ["C:\\Users\\Devson\\Source\\Repos\\servers\\src\\speckit\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production",
        "SPECKIT_DEFAULT_AI": "claude",
        "SPECKIT_ENTERPRISE_MODE": "true",
        "SPECKIT_LOG_LEVEL": "info"
      }
    }
  }
}
```

### Multiple Workspace Support
For multi-root workspaces:

```json
{
  "mcp.servers": {
    "speckit": {
      "command": "node",
      "args": ["C:\\Users\\Devson\\Source\\Repos\\servers\\src\\speckit\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production"
      },
      "workspaces": ["workspace1", "workspace2"]
    }
  }
}
```

## Next Steps

1. **Configure the server** using one of the configurations above
2. **Restart VS Code** to load the MCP server
3. **Initialize a project** using `init_project` tool
4. **Configure directories** using `configure_directories` if needed
5. **Start creating specifications** with the SDD methodology

## Support

For issues with the Spec-Kit MCP server:
1. Check the server logs in VS Code Developer Tools
2. Verify all dependencies are installed: `npm install`
3. Ensure the server builds successfully: `npm run build`
4. Test the server manually: `node dist/index.js`