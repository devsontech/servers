# Setting Up Enhanced Memory MCP Server in VS Code

This guide will help you set up the enhanced memory MCP server (with metadata support and advanced search) in VS Code.

## Method 1: VS Code Settings (Recommended)

1. **Open VS Code Settings** (Ctrl+,)
2. **Search for "mcp"** in the settings
3. **Add the memory server configuration** by editing your `settings.json`:

### Option A: Edit settings.json directly
Press `Ctrl+Shift+P` → type "Preferences: Open User Settings (JSON)" → add:

```json
{
  "mcp.servers": {
    "memory-enhanced": {
      "command": "node",
      "args": ["C:\\Users\\Devson\\Source\\Repos\\servers\\src\\memory\\dist\\index.js"],
      "env": {
        "MEMORY_FILE_PATH": "C:\\Users\\Devson\\memory.json"
      }
    }
  }
}
```

### Option B: Using the UI
1. Open Settings (Ctrl+,)
2. Search for "mcp"
3. Click "Edit in settings.json" next to "Mcp: Servers"
4. Add the configuration above

## Method 2: Using a Batch Script (Alternative)

Create a batch file for easier execution:

1. Create `memory-server.bat` in `C:\\Users\\Devson\\`:
```batch
@echo off
cd /d "C:\\Users\\Devson\\Source\\Repos\\servers\\src\\memory"
node dist/index.js
```

2. In VS Code settings.json:
```json
{
  "mcp.servers": {
    "memory-enhanced": {
      "command": "C:\\Users\\Devson\\memory-server.bat",
      "env": {
        "MEMORY_FILE_PATH": "C:\\Users\\Devson\\memory.json"
      }
    }
  }
}
```

## Configuration Options

### Memory File Location
You can customize where the memory file is stored by changing `MEMORY_FILE_PATH`:

```json
"env": {
  "MEMORY_FILE_PATH": "D:\\MyProjects\\ai-memory.json"
}
```

### Server Name
Change the server name to something more descriptive:

```json
{
  "mcp.servers": {
    "my-enhanced-memory": {
      // ... rest of config
    }
  }
}
```

## Testing the Setup

1. **Restart VS Code** after adding the configuration
2. **Open a chat with Copilot**
3. **Test the memory server** by asking Copilot to:
   - Create some entities with metadata
   - Search for entities
   - List entity types

### Example Test Commands:
- "Create an entity for John Doe with metadata about his skills"
- "Search for entities related to JavaScript"
- "List all entity types in memory"
- "Update metadata for an existing entity"

## Features Available

Your enhanced memory server now includes:

✅ **Basic memory operations** (create, read, update, delete entities and relations)
✅ **Metadata support** - Store structured data with entities
✅ **Advanced search** - Handles long queries by breaking them into keywords
✅ **Search in metadata** - Finds entities based on metadata content
✅ **Entity type listing** - Get all unique entity and relation types
✅ **Metadata updates** - Update entity metadata without recreating entities

## Troubleshooting

### Server not starting?
- Check that Node.js is installed: `node --version`
- Verify the path to the compiled JavaScript is correct
- Check VS Code's Output panel for MCP server logs

### Memory file not found?
- The memory file will be created automatically on first use
- Ensure the directory exists where you specified `MEMORY_FILE_PATH`

### Permission issues?
- Make sure the memory file location is writable
- Try using a different directory (like your Documents folder)

## Advanced Usage

### Environment Variables
```json
"env": {
  "MEMORY_FILE_PATH": "C:\\Users\\Devson\\memory.json",
  "DISABLE_THOUGHT_LOGGING": "false"
}
```

### Multiple Memory Servers
You can run multiple memory servers with different memory files:

```json
{
  "mcp.servers": {
    "work-memory": {
      "command": "node",
      "args": ["C:\\Users\\Devson\\Source\\Repos\\servers\\src\\memory\\dist\\index.js"],
      "env": {
        "MEMORY_FILE_PATH": "C:\\Users\\Devson\\work-memory.json"
      }
    },
    "personal-memory": {
      "command": "node", 
      "args": ["C:\\Users\\Devson\\Source\\Repos\\servers\\src\\memory\\dist\\index.js"],
      "env": {
        "MEMORY_FILE_PATH": "C:\\Users\\Devson\\personal-memory.json"
      }
    }
  }
}
```
