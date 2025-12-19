/**
 * VS Code Extension Integration Example
 * 
 * This example shows how to integrate the Context-Gen MCP server
 * into a VS Code extension for real-time context assistance.
 */

import * as vscode from 'vscode';
import { ContextGenMCPClient } from './mcp-client';

export class ContextAwareAssistant {
  private client: ContextGenMCPClient;
  private statusBar: vscode.StatusBarItem;
  private contextPanel: vscode.WebviewPanel | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.client = new ContextGenMCPClient();
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.setupCommands(context);
    this.setupEventListeners();
  }

  private setupCommands(context: vscode.ExtensionContext) {
    // Command: Analyze current workspace
    const analyzeWorkspace = vscode.commands.registerCommand('context-gen.analyzeWorkspace', async () => {
      await this.analyzeCurrentWorkspace();
    });

    // Command: Generate context for current file
    const analyzeFile = vscode.commands.registerCommand('context-gen.analyzeFile', async () => {
      await this.analyzeCurrentFile();
    });

    // Command: Show knowledge graph
    const showKnowledgeGraph = vscode.commands.registerCommand('context-gen.showKnowledgeGraph', async () => {
      await this.showKnowledgeGraph();
    });

    // Command: Get context-aware suggestions
    const getContextSuggestions = vscode.commands.registerCommand('context-gen.getSuggestions', async () => {
      await this.getContextualSuggestions();
    });

    context.subscriptions.push(analyzeWorkspace, analyzeFile, showKnowledgeGraph, getContextSuggestions);
  }

  private setupEventListeners() {
    // Auto-analyze on file open
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor) {
        await this.updateContextForFile(editor.document.fileName);
      }
    });

    // Update context on file save
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      await this.updateContextForFile(document.fileName);
    });
  }

  private async analyzeCurrentWorkspace() {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    this.statusBar.text = '$(sync~spin) Analyzing workspace...';
    this.statusBar.show();

    try {
      // Get comprehensive analysis
      const analysis = await this.client.call('analyze_codebase', {
        projectPath: workspaceRoot,
        analysisDepth: 'detailed',
        includeTests: true,
        excludePatterns: ['node_modules', 'dist', 'coverage']
      });

      // Generate mental model
      const mentalModel = await this.client.call('generate_mental_model', {
        projectPath: workspaceRoot,
        perspective: 'developer',
        includeDataFlow: true
      });

      // Detect patterns
      const patterns = await this.client.call('detect_patterns', {
        projectPath: workspaceRoot,
        patternTypes: ['design', 'architectural', 'anti-pattern'],
        confidenceThreshold: 0.7
      });

      // Show results in sidebar
      this.showContextPanel({
        analysis,
        mentalModel,
        patterns
      });

      this.statusBar.text = `$(check) Context ready (${analysis.summary.totalFiles} files)`;
      
      // Show summary notification
      vscode.window.showInformationMessage(
        `Workspace analyzed: ${analysis.summary.totalFiles} files, complexity: ${analysis.summary.complexity}`,
        'View Details'
      ).then((selection) => {
        if (selection === 'View Details') {
          vscode.commands.executeCommand('context-gen.showKnowledgeGraph');
        }
      });

    } catch (error) {
      console.error('Workspace analysis failed:', error);
      vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
      this.statusBar.text = '$(error) Analysis failed';
    }
  }

  private async analyzeCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const fileName = document.fileName;

    try {
      // Extract semantic context for current file
      const semanticContext = await this.client.call('extract_semantic_context', {
        filePath: fileName,
        includeComments: true,
        semanticDepth: 'deep'
      });

      // Show context in hover or sidebar
      this.showFileContext(semanticContext, fileName);

      // Get related files based on context
      const relatedFiles = await this.findRelatedFiles(semanticContext);
      
      if (relatedFiles.length > 0) {
        vscode.window.showInformationMessage(
          `Found ${relatedFiles.length} related files`,
          'Show Related'
        ).then((selection) => {
          if (selection === 'Show Related') {
            this.showRelatedFiles(relatedFiles);
          }
        });
      }

    } catch (error) {
      console.error('File analysis failed:', error);
      vscode.window.showErrorMessage(`File analysis failed: ${error.message}`);
    }
  }

  private async getContextualSuggestions() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const position = editor.selection.active;
    const currentFunction = this.getCurrentFunction(document, position);

    try {
      // Prioritize context based on current cursor position
      const contextSources = await this.getRelatedContexts(currentFunction, document.fileName);
      
      const prioritizedContext = await this.client.call('prioritize_context', {
        contexts: contextSources,
        currentFocus: currentFunction,
        userRole: 'developer',
        timeConstraint: '5minutes'
      });

      // Show context-aware suggestions
      const suggestions = this.generateSuggestions(prioritizedContext, position, document);
      this.showSuggestions(suggestions);

    } catch (error) {
      console.error('Context suggestions failed:', error);
    }
  }

  private async showKnowledgeGraph() {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) return;

    try {
      // Build comprehensive knowledge graph
      const knowledgeGraph = await this.client.call('build_knowledge_graph', {
        contextSources: [workspaceRoot + '/src'],
        mergingStrategy: 'balanced',
        extractionRules: [
          { type: 'pattern', pattern: 'class\\s+(\\w+)', confidence: 0.8 },
          { type: 'concept', pattern: '@description\\s+(.+)', confidence: 0.9 }
        ]
      });

      // Create knowledge graph visualization
      this.createKnowledgeGraphPanel(knowledgeGraph);

    } catch (error) {
      console.error('Knowledge graph creation failed:', error);
      vscode.window.showErrorMessage(`Knowledge graph failed: ${error.message}`);
    }
  }

  private showContextPanel(data: any) {
    if (this.contextPanel) {
      this.contextPanel.reveal();
    } else {
      this.contextPanel = vscode.window.createWebviewPanel(
        'contextGen',
        'Project Context',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );

      this.contextPanel.onDidDispose(() => {
        this.contextPanel = undefined;
      });
    }

    // Generate HTML content for context display
    this.contextPanel.webview.html = this.getWebviewContent(data);
  }

  private getWebviewContent(data: any): string {
    const { analysis, mentalModel, patterns } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Context</title>
        <style>
          body { 
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 20px;
          }
          .section { margin-bottom: 30px; }
          .metric { 
            display: inline-block; 
            margin: 5px 10px; 
            padding: 5px 10px;
            background: var(--vscode-badge-background);
            border-radius: 3px;
          }
          .concept { 
            border-left: 3px solid var(--vscode-textLink-foreground);
            padding-left: 10px;
            margin: 10px 0;
          }
          .pattern {
            padding: 10px;
            margin: 10px 0;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 5px;
          }
          .anti-pattern {
            border-left: 3px solid var(--vscode-errorForeground);
          }
          .good-pattern {
            border-left: 3px solid var(--vscode-testing-iconPassed);
          }
          ul { padding-left: 20px; }
          .insights { 
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>📊 Project Analysis</h1>
        
        <div class="section">
          <h2>Overview</h2>
          <div class="metric">Files: ${analysis.summary.totalFiles}</div>
          <div class="metric">LOC: ${analysis.summary.linesOfCode}</div>
          <div class="metric">Languages: ${analysis.summary.languages.join(', ')}</div>
          <div class="metric">Complexity: ${analysis.summary.complexity}</div>
        </div>

        <div class="section">
          <h2>🧠 Mental Model</h2>
          ${mentalModel.conceptMap.map(concept => `
            <div class="concept">
              <strong>${concept.concept}</strong> (${Math.round(concept.importance * 100)}% importance)
              <p>${concept.description}</p>
              <small>Relationships: ${concept.relationships.map(r => r.target).join(', ')}</small>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>🎯 Detected Patterns</h2>
          ${patterns.detectedPatterns.map(pattern => `
            <div class="pattern ${pattern.type === 'anti-pattern' ? 'anti-pattern' : 'good-pattern'}">
              <strong>${pattern.name}</strong> 
              <span style="float: right;">${Math.round(pattern.confidence * 100)}% confidence</span>
              <p>${pattern.type === 'anti-pattern' ? 
                (pattern.impacts?.join(', ') || 'Negative impact detected') :
                (pattern.benefits?.join(', ') || 'Positive pattern detected')
              }</p>
              <small>${pattern.locations.length} location(s)</small>
            </div>
          `).join('')}
        </div>

        ${analysis.insights ? `
        <div class="section">
          <h2>💡 Key Insights</h2>
          <div class="insights">
            <ul>
              ${analysis.insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h2>🔧 Quick Actions</h2>
          <button onclick="vscode.postMessage({command: 'showGraph'})">View Knowledge Graph</button>
          <button onclick="vscode.postMessage({command: 'generateDocs'})">Generate Documentation</button>
          <button onclick="vscode.postMessage({command: 'exportReport'})">Export Report</button>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          
          // Handle button clicks
          document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
              const command = e.target.getAttribute('onclick');
              if (command) {
                eval(command);
              }
            }
          });
        </script>
      </body>
      </html>
    `;
  }

  private async updateContextForFile(fileName: string) {
    if (!fileName.endsWith('.ts') && !fileName.endsWith('.js')) return;

    try {
      // Quick semantic analysis for file
      const context = await this.client.call('extract_semantic_context', {
        filePath: fileName,
        semanticDepth: 'shallow',
        includeComments: false
      });

      // Update status bar with file context
      const mainEntity = context.entities[0];
      if (mainEntity) {
        this.statusBar.text = `$(symbol-class) ${mainEntity.entity} - ${mainEntity.purpose.substring(0, 50)}...`;
        this.statusBar.tooltip = `Context: ${mainEntity.purpose}`;
      }

    } catch (error) {
      // Silently fail for background updates
      console.log('Background context update failed:', error.message);
    }
  }

  private getCurrentFunction(document: vscode.TextDocument, position: vscode.Position): string {
    // Simple function detection - in real implementation would use AST parsing
    const text = document.getText();
    const lines = text.split('\n');
    
    for (let i = position.line; i >= 0; i--) {
      const line = lines[i];
      const functionMatch = line.match(/function\s+(\w+)|(\w+)\s*\(/);
      if (functionMatch) {
        return functionMatch[1] || functionMatch[2] || 'unknown';
      }
    }
    
    return 'unknown';
  }

  private async getRelatedContexts(currentFunction: string, fileName: string): Promise<any[]> {
    // In real implementation, would analyze imports, dependencies, and call graphs
    return [
      {
        id: currentFunction,
        type: 'function',
        complexity: 0.7,
        lastModified: new Date().toISOString()
      }
    ];
  }

  private generateSuggestions(prioritizedContext: any, position: vscode.Position, document: vscode.TextDocument): string[] {
    const suggestions = [];
    
    if (prioritizedContext.prioritizedContexts && prioritizedContext.prioritizedContexts.length > 0) {
      const topContext = prioritizedContext.prioritizedContexts[0];
      suggestions.push(`Most relevant context: ${topContext.id} (${Math.round(topContext.relevanceScore * 100)}% relevance)`);
      suggestions.push(`Estimated learning time: ${topContext.estimatedTime}`);
      suggestions.push(`Reason: ${topContext.reasoning}`);
    }

    return suggestions;
  }

  private showSuggestions(suggestions: string[]) {
    if (suggestions.length > 0) {
      vscode.window.showInformationMessage(
        suggestions[0],
        ...suggestions.slice(1, 3).map(s => s.split(':')[0])
      );
    }
  }

  private async findRelatedFiles(semanticContext: any): Promise<string[]> {
    // Analyze relationships to find related files
    const relatedFiles: string[] = [];
    
    if (semanticContext.entities) {
      for (const entity of semanticContext.entities) {
        if (entity.relationships) {
          // In real implementation, would map relationships to actual files
          relatedFiles.push(...entity.relationships.slice(0, 3));
        }
      }
    }

    return relatedFiles;
  }

  private showRelatedFiles(files: string[]) {
    vscode.window.showQuickPick(files, {
      placeHolder: 'Select a related file to open',
      canPickMany: false
    }).then((selected) => {
      if (selected) {
        // In real implementation, would open the actual file
        vscode.window.showInformationMessage(`Would open: ${selected}`);
      }
    });
  }

  private showFileContext(context: any, fileName: string) {
    const entity = context.entities[0];
    if (entity) {
      vscode.window.showInformationMessage(
        `${entity.entity}: ${entity.purpose}`,
        'Show Details'
      ).then((selection) => {
        if (selection === 'Show Details') {
          this.showContextPanel({ fileContext: context, fileName });
        }
      });
    }
  }

  private createKnowledgeGraphPanel(knowledgeGraph: any) {
    const panel = vscode.window.createWebviewPanel(
      'knowledgeGraph',
      'Knowledge Graph',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = this.getKnowledgeGraphHTML(knowledgeGraph);
  }

  private getKnowledgeGraphHTML(graph: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Knowledge Graph</title>
        <script src="https://d3js.org/d3.v7.min.js"></script>
        <style>
          body { margin: 0; background: var(--vscode-editor-background); }
          svg { width: 100%; height: 100vh; }
          .node circle { stroke: var(--vscode-textLink-foreground); stroke-width: 2px; }
          .node text { font: 12px var(--vscode-font-family); fill: var(--vscode-foreground); }
          .link { stroke: var(--vscode-textSeparator-foreground); stroke-width: 1px; }
        </style>
      </head>
      <body>
        <svg></svg>
        <script>
          const nodes = ${JSON.stringify(graph.nodes.map((node: any) => ({
            id: node.id,
            title: node.title,
            type: node.type,
            importance: node.importance
          })))};
          
          const links = ${JSON.stringify(graph.relationships.map((rel: any) => ({
            source: rel.source,
            target: rel.target,
            type: rel.type,
            strength: rel.strength
          })))};

          // D3.js graph visualization
          const svg = d3.select('svg');
          const width = window.innerWidth;
          const height = window.innerHeight;

          const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));

          const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('class', 'link');

          const node = svg.append('g')
            .selectAll('.node')
            .data(nodes)
            .enter().append('g')
            .attr('class', 'node')
            .call(d3.drag()
              .on('start', dragstarted)
              .on('drag', dragged)
              .on('end', dragended));

          node.append('circle')
            .attr('r', d => 5 + d.importance * 10)
            .style('fill', d => d.type === 'concept' ? '#4CAF50' : '#2196F3');

          node.append('text')
            .attr('dx', 12)
            .attr('dy', '.35em')
            .text(d => d.title);

          simulation.on('tick', () => {
            link
              .attr('x1', d => d.source.x)
              .attr('y1', d => d.source.y)
              .attr('x2', d => d.target.x)
              .attr('y2', d => d.target.y);

            node
              .attr('transform', d => \`translate(\${d.x},\${d.y})\`);
          });

          function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          }

          function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
          }

          function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }
        </script>
      </body>
      </html>
    `;
  }

  public dispose() {
    this.statusBar.dispose();
    if (this.contextPanel) {
      this.contextPanel.dispose();
    }
    this.client.dispose();
  }
}

// Extension activation function
export function activate(context: vscode.ExtensionContext) {
  console.log('Context-Gen extension is now active!');
  
  const assistant = new ContextAwareAssistant(context);
  
  // Register assistant for disposal
  context.subscriptions.push({
    dispose: () => assistant.dispose()
  });

  // Auto-analyze workspace on activation
  if (vscode.workspace.workspaceFolders) {
    vscode.commands.executeCommand('context-gen.analyzeWorkspace');
  }
}

export function deactivate() {
  console.log('Context-Gen extension deactivated');
}