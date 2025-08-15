#!/usr/bin/env node

/**
 * Example usage of Sequential Thinking MCP Server with LSP Integration
 * 
 * This demonstrates how to use the enhanced sequential thinking tool
 * with code analysis capabilities for debugging and problem-solving.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

class SequentialThinkingLSPExample {
  constructor() {
    this.client = null;
    this.serverProcess = null;
  }

  async start() {
    console.log('🚀 Starting Sequential Thinking MCP Server with LSP...');
    
    // Start the MCP server
    this.serverProcess = spawn('node', ['lsp-enhanced-index.js'], {
      cwd: './dist',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Set up error handling
    this.serverProcess.stderr.on('data', (data) => {
      console.log(`📋 Server: ${data.toString().trim()}`);
    });

    // Create client and transport
    const transport = new StdioClientTransport({
      readable: this.serverProcess.stdout,
      writable: this.serverProcess.stdin
    });

    this.client = new Client(
      {
        name: "sequential-thinking-lsp-example",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    await this.client.connect(transport);
    console.log('✅ Connected to MCP server');
  }

  async initializeLSP() {
    console.log('\n🔧 Initializing LSP server...');
    
    const result = await this.client.callTool({
      name: 'initialize_lsp',
      arguments: {
        lsp_server_path: 'typescript',
        root_directory: process.cwd()
      }
    });

    console.log('LSP Initialization Result:', result.content[0].text);
  }

  async demonstrateSequentialThinking() {
    console.log('\n🧠 Starting sequential thinking with code analysis...');

    // Example: Analyzing a TypeScript function
    const exampleCodePath = './example.ts';
    
    // Thought 1: Initial analysis
    let result = await this.client.callTool({
      name: 'sequentialthinking',
      arguments: {
        thought: "I need to understand what this function does and identify potential issues. Let me start by getting hover information at the function declaration.",
        thoughtNumber: 1,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        code_analysis: {
          file_path: exampleCodePath,
          line: 5,
          column: 10,
          operation: 'hover',
          language_id: 'typescript'
        }
      }
    });

    console.log('\n💭 Thought 1 Result:');
    console.log(JSON.parse(result.content[0].text));

    // Thought 2: Check for errors
    result = await this.client.callTool({
      name: 'sequentialthinking',
      arguments: {
        thought: "Now let me check for any diagnostics or errors in this file that might indicate problems.",
        thoughtNumber: 2,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        code_analysis: {
          file_path: exampleCodePath,
          operation: 'diagnostics',
          language_id: 'typescript'
        }
      }
    });

    console.log('\n💭 Thought 2 Result:');
    console.log(JSON.parse(result.content[0].text));

    // Thought 3: Explore completions
    result = await this.client.callTool({
      name: 'sequentialthinking',
      arguments: {
        thought: "Let me see what methods and properties are available at this position to understand the API better.",
        thoughtNumber: 3,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        code_analysis: {
          file_path: exampleCodePath,
          line: 8,
          column: 15,
          operation: 'completion',
          language_id: 'typescript'
        }
      }
    });

    console.log('\n💭 Thought 3 Result:');
    console.log(JSON.parse(result.content[0].text));

    // Thought 4: Final conclusion
    result = await this.client.callTool({
      name: 'sequentialthinking',
      arguments: {
        thought: "Based on my analysis of the code using LSP information, I can now provide recommendations for improvement and identify any issues.",
        thoughtNumber: 4,
        totalThoughts: 4,
        nextThoughtNeeded: false
      }
    });

    console.log('\n💭 Final Thought Result:');
    console.log(JSON.parse(result.content[0].text));
  }

  async demonstrateAdvancedThinking() {
    console.log('\n🎯 Demonstrating advanced thinking with branching...');

    // Main thought
    let result = await this.client.callTool({
      name: 'sequentialthinking',
      arguments: {
        thought: "I'm analyzing this complex function and I see two potential approaches to optimize it.",
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      }
    });

    console.log('\n💭 Main Thought 1:');
    console.log(JSON.parse(result.content[0].text));

    // Branch A
    result = await this.client.callTool({
      name: 'sequentialthinking',
      arguments: {
        thought: "Branch A: Let me explore the performance optimization approach by checking what methods are available.",
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true,
        branchFromThought: 1,
        branchId: 'performance-optimization',
        code_analysis: {
          file_path: './example.ts',
          line: 12,
          column: 8,
          operation: 'completion',
          language_id: 'typescript'
        }
      }
    });

    console.log('\n🌿 Branch A Result:');
    console.log(JSON.parse(result.content[0].text));

    // Branch B  
    result = await this.client.callTool({
      name: 'sequentialthinking',
      arguments: {
        thought: "Branch B: Alternatively, let me check for type safety issues by examining the function signature.",
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true,
        branchFromThought: 1,
        branchId: 'type-safety',
        code_analysis: {
          file_path: './example.ts',
          line: 5,
          column: 1,
          operation: 'hover',
          language_id: 'typescript'
        }
      }
    });

    console.log('\n🌿 Branch B Result:');
    console.log(JSON.parse(result.content[0].text));
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.client) {
      await this.client.close();
    }
    
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
    
    console.log('✅ Cleanup completed');
  }
}

// Create example TypeScript file for analysis
const exampleCode = `
// Example TypeScript function for analysis
interface User {
  id: number;
  name: string;
}

function processUser(user: User): string {
  // This function has potential issues
  const result = user.name.toLowerCase();
  return result + user.id;
}

// Usage example
const myUser = { id: 1, name: "John" };
console.log(processUser(myUser));
`;

// Run the example
async function runExample() {
  // Create example file
  const fs = await import('fs/promises');
  await fs.writeFile('./example.ts', exampleCode);
  console.log('📝 Created example.ts file for analysis');

  const example = new SequentialThinkingLSPExample();
  
  try {
    await example.start();
    await example.initializeLSP();
    await example.demonstrateSequentialThinking();
    await example.demonstrateAdvancedThinking();
  } catch (error) {
    console.error('❌ Example failed:', error);
  } finally {
    await example.cleanup();
    // Clean up example file
    try {
      await fs.unlink('./example.ts');
      console.log('🗑️  Cleaned up example.ts');
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample();
}
