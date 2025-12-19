#!/usr/bin/env node

/**
 * Context-Gen MCP Server - Practical Example Script
 * 
 * This script demonstrates a complete workflow using multiple context generation tools
 * to analyze a real project and generate comprehensive understanding materials.
 * 
 * Usage: node practical-example.js [project-path]
 */

const { ContextGenMCPClient } = require('./lib/client'); // Hypothetical client library
const path = require('path');
const fs = require('fs').promises;

class ContextGenWorkflow {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.client = new ContextGenMCPClient();
    this.results = {
      analysis: null,
      mentalModel: null,
      knowledgeGraph: null,
      patterns: null,
      summary: null
    };
  }

  async run() {
    console.log('🚀 Starting comprehensive context analysis...\n');
    
    try {
      // Step 1: Initial codebase analysis
      await this.analyzeCodebase();
      
      // Step 2: Generate mental model from architect perspective
      await this.generateMentalModel();
      
      // Step 3: Build knowledge graph
      await this.buildKnowledgeGraph();
      
      // Step 4: Detect patterns and anti-patterns
      await this.detectPatterns();
      
      // Step 5: Create team-oriented summary
      await this.createSummary();
      
      // Step 6: Generate final report
      await this.generateReport();
      
      console.log('✅ Context analysis complete! Check ./context-analysis-report.md');
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeCodebase() {
    console.log('📊 Analyzing codebase structure...');
    
    this.results.analysis = await this.client.call('analyze_codebase', {
      projectPath: this.projectPath,
      includeTests: true,
      analysisDepth: 'detailed',
      languageFilters: ['typescript', 'javascript', 'python', 'java'],
      excludePatterns: ['node_modules', 'dist', 'build', '__pycache__']
    });
    
    console.log(`   - Found ${this.results.analysis.summary.totalFiles} files`);
    console.log(`   - ${this.results.analysis.summary.linesOfCode} lines of code`);
    console.log(`   - Languages: ${this.results.analysis.summary.languages.join(', ')}`);
    console.log(`   - Complexity: ${this.results.analysis.summary.complexity}\n`);
  }

  async generateMentalModel() {
    console.log('🧠 Generating mental model...');
    
    this.results.mentalModel = await this.client.call('generate_mental_model', {
      projectPath: this.projectPath,
      perspective: 'architect',
      includeDataFlow: true,
      includeUserJourney: true
    });
    
    console.log(`   - Identified ${this.results.mentalModel.conceptMap.length} key concepts`);
    console.log(`   - Mapped ${this.results.mentalModel.dataFlow.length} data flows`);
    if (this.results.mentalModel.userJourney) {
      console.log(`   - ${this.results.mentalModel.userJourney.length} user journey steps\n`);
    }
  }

  async buildKnowledgeGraph() {
    console.log('🕸️  Building knowledge graph...');
    
    // Get all relevant source files
    const sourceFiles = await this.getAllSourceFiles(this.projectPath);
    
    this.results.knowledgeGraph = await this.client.call('build_knowledge_graph', {
      contextSources: sourceFiles.slice(0, 50), // Limit for demo
      extractionRules: [
        { type: 'pattern', pattern: 'class\\s+(\\w+)', confidence: 0.8 },
        { type: 'concept', pattern: '@description\\s+(.+)', confidence: 0.9 },
        { type: 'decision', pattern: 'TODO:|FIXME:|NOTE:', confidence: 0.7 }
      ],
      mergingStrategy: 'balanced'
    });
    
    console.log(`   - Created ${this.results.knowledgeGraph.nodes.length} knowledge nodes`);
    console.log(`   - Found ${this.results.knowledgeGraph.relationships.length} relationships`);
    console.log(`   - Identified ${this.results.knowledgeGraph.clusters.length} clusters\n`);
  }

  async detectPatterns() {
    console.log('🔍 Detecting architectural patterns...');
    
    this.results.patterns = await this.client.call('detect_patterns', {
      projectPath: this.projectPath,
      patternTypes: ['design', 'architectural', 'anti-pattern'],
      confidenceThreshold: 0.7,
      includeMetrics: true
    });
    
    const goodPatterns = this.results.patterns.detectedPatterns
      .filter(p => p.type !== 'anti-pattern').length;
    const antiPatterns = this.results.patterns.detectedPatterns
      .filter(p => p.type === 'anti-pattern').length;
      
    console.log(`   - Found ${goodPatterns} positive patterns`);
    console.log(`   - Detected ${antiPatterns} anti-patterns`);
    console.log(`   - Maintainability Index: ${this.results.patterns.metrics?.maintainabilityIndex || 'N/A'}\n`);
  }

  async createSummary() {
    console.log('📝 Creating team summary...');
    
    this.results.summary = await this.client.call('create_context_summary', {
      projectPath: this.projectPath,
      targetAudience: 'mixed-team',
      includeQuickStart: true,
      maxComplexity: 'advanced',
      focusAreas: ['core-architecture', 'development-workflow', 'key-decisions']
    });
    
    console.log(`   - Generated executive summary`);
    console.log(`   - Created quick start guide`);
    console.log(`   - Documented ${this.results.summary.learningPath.length} learning phases\n`);
  }

  async generateReport() {
    console.log('📋 Generating comprehensive report...');
    
    const report = this.buildMarkdownReport();
    await fs.writeFile('./context-analysis-report.md', report, 'utf8');
    
    // Also save raw data as JSON
    await fs.writeFile('./context-analysis-data.json', 
      JSON.stringify(this.results, null, 2), 'utf8');
  }

  buildMarkdownReport() {
    const { analysis, mentalModel, knowledgeGraph, patterns, summary } = this.results;
    
    return `# Context Analysis Report

Generated on: ${new Date().toISOString()}
Project: ${this.projectPath}

## Executive Summary

${summary.executiveSummary.projectOverview}

**Key Metrics:**
- **Files:** ${analysis.summary.totalFiles}
- **Lines of Code:** ${analysis.summary.linesOfCode}
- **Languages:** ${analysis.summary.languages.join(', ')}
- **Complexity:** ${analysis.summary.complexity}
- **Maintainability Index:** ${patterns.metrics?.maintainabilityIndex || 'N/A'}

## Architecture Overview

### Core Concepts
${mentalModel.conceptMap.map(concept => 
  `- **${concept.concept}** (${(concept.importance * 100).toFixed(0)}% importance): ${concept.description}`
).join('\n')}

### Data Flow Analysis
${mentalModel.dataFlow.map(flow => 
  `- ${flow.source} → ${flow.target}: ${flow.dataType}${flow.transformation ? ` (${flow.transformation})` : ''}`
).join('\n')}

## Knowledge Graph Insights

**Node Distribution:**
${Object.entries(
  knowledgeGraph.nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {})
).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

**Key Clusters:**
${knowledgeGraph.clusters.map(cluster => 
  `- **${cluster.name}**: ${cluster.nodes.length} nodes (cohesion: ${(cluster.cohesion * 100).toFixed(0)}%)`
).join('\n')}

**AI-Generated Insights:**
${knowledgeGraph.insights.map(insight => 
  `- **${insight.type}**: ${insight.description} (confidence: ${(insight.confidence * 100).toFixed(0)}%)`
).join('\n')}

## Pattern Analysis

### Positive Patterns
${patterns.detectedPatterns
  .filter(p => p.type !== 'anti-pattern')
  .map(pattern => `
#### ${pattern.name}
**Confidence:** ${(pattern.confidence * 100).toFixed(0)}%
**Benefits:** ${pattern.benefits?.join(', ') || 'N/A'}
**Locations:** ${pattern.locations.length} files
`).join('\n')}

### Anti-Patterns (Need Attention)
${patterns.detectedPatterns
  .filter(p => p.type === 'anti-pattern')
  .map(pattern => `
#### ⚠️ ${pattern.name}
**Confidence:** ${(pattern.confidence * 100).toFixed(0)}%
**Impact:** ${pattern.impacts?.join(', ') || 'N/A'}
**Recommendations:** ${pattern.recommendations?.join(', ') || 'See detailed analysis'}
`).join('\n')}

## Team Onboarding Guide

### Quick Start
${summary.quickStart.setupSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

### Learning Path
${summary.learningPath.map(phase => `
#### ${phase.phase}
**Focus:** ${phase.focus}
**Tasks:**
${phase.tasks.map(task => `- ${task}`).join('\n')}
`).join('\n')}

## Technical Recommendations

### High Priority
${this.generateRecommendations().high.map(rec => `- ${rec}`).join('\n')}

### Medium Priority
${this.generateRecommendations().medium.map(rec => `- ${rec}`).join('\n')}

---

*This report was generated automatically using the Context-Gen MCP Server.*
*For questions or updates, re-run the analysis script.*
`;
  }

  generateRecommendations() {
    const high = [];
    const medium = [];
    
    // Analyze anti-patterns for high priority items
    if (this.results.patterns) {
      const antiPatterns = this.results.patterns.detectedPatterns
        .filter(p => p.type === 'anti-pattern');
      
      antiPatterns.forEach(pattern => {
        if (pattern.confidence > 0.8) {
          high.push(`Address ${pattern.name} in ${pattern.locations[0]?.file}`);
        } else {
          medium.push(`Consider refactoring ${pattern.name}`);
        }
      });
    }
    
    // Analyze complexity for recommendations
    if (this.results.analysis?.insights) {
      this.results.analysis.insights.forEach(insight => {
        if (insight.includes('High component complexity')) {
          high.push(insight.replace('High component complexity', 'Reduce complexity'));
        } else {
          medium.push(insight);
        }
      });
    }
    
    // Add knowledge graph insights
    if (this.results.knowledgeGraph?.insights) {
      this.results.knowledgeGraph.insights.forEach(insight => {
        if (insight.impact === 'high') {
          high.push(insight.description);
        } else {
          medium.push(insight.description);
        }
      });
    }
    
    return { high, medium };
  }

  async getAllSourceFiles(projectPath) {
    // Simplified file discovery - in real implementation would be more sophisticated
    const files = [];
    const extensions = ['.ts', '.js', '.py', '.java', '.cs', '.cpp', '.h'];
    
    async function scanDir(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && 
              !['node_modules', 'dist', 'build', '__pycache__'].includes(entry.name)) {
            await scanDir(fullPath);
          } else if (entry.isFile() && 
                     extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    }
    
    await scanDir(projectPath);
    return files;
  }
}

// Example usage scenarios
async function demoWorkflows() {
  console.log('🎯 Context-Gen Demo Workflows\n');
  
  // Scenario 1: New team member onboarding
  console.log('Scenario 1: New Team Member Onboarding');
  console.log('=========================================');
  
  const onboardingWorkflow = new ContextGenWorkflow('./sample-project');
  await onboardingWorkflow.run();
  
  // Scenario 2: Code review assistance  
  console.log('\nScenario 2: Code Review Context');
  console.log('===============================');
  
  const client = new ContextGenMCPClient();
  
  // Analyze specific files that changed in a PR
  const changedFiles = ['./src/auth/AuthService.ts', './src/api/UserController.ts'];
  
  for (const file of changedFiles) {
    const context = await client.call('extract_semantic_context', {
      filePath: file,
      includeComments: true,
      semanticDepth: 'deep'
    });
    
    console.log(`\n📁 ${file}:`);
    console.log(`   Purpose: ${context.entities[0]?.purpose}`);
    console.log(`   Confidence: ${(context.entities[0]?.confidence * 100).toFixed(0)}%`);
    console.log(`   Business Impact: ${context.businessConcepts[0]?.definition}`);
  }
  
  // Scenario 3: Architecture documentation
  console.log('\nScenario 3: Architecture Documentation');
  console.log('=====================================');
  
  const patterns = await client.call('detect_patterns', {
    projectPath: './sample-project',
    patternTypes: ['architectural'],
    confidenceThreshold: 0.8
  });
  
  console.log('Key Architectural Patterns:');
  patterns.detectedPatterns.forEach(pattern => {
    console.log(`   - ${pattern.name}: ${pattern.locations.length} implementations`);
  });
}

// CLI Interface
if (require.main === module) {
  const projectPath = process.argv[2] || './';
  
  if (process.argv.includes('--demo')) {
    demoWorkflows().catch(console.error);
  } else {
    const workflow = new ContextGenWorkflow(projectPath);
    workflow.run().catch(console.error);
  }
}

module.exports = { ContextGenWorkflow };