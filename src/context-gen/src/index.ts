#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Import our analyzers and generators
import { CodebaseAnalyzer } from './analyzers/codebase-analyzer.js';
import { DependencyAnalyzer } from './analyzers/dependency-analyzer.js';
import { SemanticAnalyzer } from './analyzers/semantic-analyzer.js';
import { ContextGenerator } from './generators/context-generator.js';
import { AdvancedAnalyzer } from './advanced-analyzer.js';

// Import schemas
import {
  AnalyzeCodebaseSchema,
  BuildDependencyGraphSchema,
  ExtractSemanticContextSchema,
  AnalyzePatternsSchema,
  DetectArchitectureSchema,
  GenerateContextSummarySchema,
  CreateMentalModelSchema,
  BuildKnowledgeGraphSchema,
  IncrementalLearningSchema,
  ContextPrioritizationSchema,
  SaveContextSnapshotSchema,
  LoadContextSnapshotSchema,
  MergeContextsSchema,
  GenerateTeamHandoffSchema,
  CreateOnboardingGuideSchema,
  ExtractTribalKnowledgeSchema,
  ContextDiffAnalysisSchema,
} from './core/types.js';

import {
  CodeQualityAnalysisSchema,
  SecurityContextAnalysisSchema,
  PerformanceBottleneckDetectionSchema,
  TechnicalDebtAssessmentSchema,
  ContextRecommendationEngineSchema,
  RelevanceScoringSchema,
  ContextEvolutionTrackingSchema,
} from './core/advanced-types.js';

// Initialize analyzers and generators
const codebaseAnalyzer = new CodebaseAnalyzer();
const dependencyAnalyzer = new DependencyAnalyzer();
const semanticAnalyzer = new SemanticAnalyzer();
const contextGenerator = new ContextGenerator();
const advancedAnalyzer = new AdvancedAnalyzer();

// Create the MCP server
const server = new Server(
  {
    name: 'context-gen',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Core Analysis Tools
      {
        name: 'analyze_codebase',
        description: 'Analyze codebase structure, complexity, and quality metrics with configurable depth',
        inputSchema: zodToJsonSchema(AnalyzeCodebaseSchema),
      },
      {
        name: 'build_dependency_graph',
        description: 'Build comprehensive dependency graph with cycle detection and risk analysis',
        inputSchema: zodToJsonSchema(BuildDependencyGraphSchema),
      },
      {
        name: 'extract_semantic_context',
        description: 'Extract semantic meaning and relationships from code files',
        inputSchema: zodToJsonSchema(ExtractSemanticContextSchema),
      },
      {
        name: 'analyze_patterns',
        description: 'Detect architectural patterns and anti-patterns in codebase',
        inputSchema: zodToJsonSchema(AnalyzePatternsSchema),
      },
      {
        name: 'detect_architecture',
        description: 'Analyze and document system architecture with visualization support',
        inputSchema: zodToJsonSchema(DetectArchitectureSchema),
      },

      // Context Generation Tools
      {
        name: 'generate_context_summary',
        description: 'Generate intelligent context summaries tailored to specific audiences and use cases',
        inputSchema: zodToJsonSchema(GenerateContextSummarySchema),
      },
      {
        name: 'create_mental_model',
        description: 'Create comprehensive mental models from different perspectives with data flow analysis',
        inputSchema: zodToJsonSchema(CreateMentalModelSchema),
      },
      {
        name: 'build_knowledge_graph',
        description: 'Build intelligent knowledge graphs from multiple context sources with clustering',
        inputSchema: zodToJsonSchema(BuildKnowledgeGraphSchema),
      },
      {
        name: 'context_recommendation_engine',
        description: 'Provide intelligent context recommendations based on current task and user profile',
        inputSchema: zodToJsonSchema(ContextRecommendationEngineSchema),
      },

      // Advanced Analysis Tools
      {
        name: 'code_quality_analysis',
        description: 'Perform comprehensive code quality analysis with custom thresholds and metrics',
        inputSchema: zodToJsonSchema(CodeQualityAnalysisSchema),
      },
      {
        name: 'security_context_analysis',
        description: 'Analyze security context including vulnerabilities, secrets, and risk assessment',
        inputSchema: zodToJsonSchema(SecurityContextAnalysisSchema),
      },
      {
        name: 'performance_bottleneck_detection',
        description: 'Detect performance bottlenecks and optimization opportunities',
        inputSchema: zodToJsonSchema(PerformanceBottleneckDetectionSchema),
      },
      {
        name: 'technical_debt_assessment',
        description: 'Assess technical debt with prioritization and effort estimation',
        inputSchema: zodToJsonSchema(TechnicalDebtAssessmentSchema),
      },

      // Incremental Learning Tools
      {
        name: 'incremental_learning',
        description: 'Incrementally learn and adapt context based on changes and feedback',
        inputSchema: zodToJsonSchema(IncrementalLearningSchema),
      },
      {
        name: 'context_prioritization',
        description: 'Prioritize context items based on task relevance and user preferences',
        inputSchema: zodToJsonSchema(ContextPrioritizationSchema),
      },
      {
        name: 'relevance_scoring',
        description: 'Score context items for relevance using multiple factors and weighting',
        inputSchema: zodToJsonSchema(RelevanceScoringSchema),
      },
      {
        name: 'context_evolution_tracking',
        description: 'Track how context evolves over time with trend analysis',
        inputSchema: zodToJsonSchema(ContextEvolutionTrackingSchema),
      },

      // Context Persistence Tools
      {
        name: 'save_context_snapshot',
        description: 'Save context snapshots with compression and versioning support',
        inputSchema: zodToJsonSchema(SaveContextSnapshotSchema),
      },
      {
        name: 'load_context_snapshot',
        description: 'Load context snapshots with integrity validation',
        inputSchema: zodToJsonSchema(LoadContextSnapshotSchema),
      },
      {
        name: 'merge_contexts',
        description: 'Merge multiple context snapshots using different strategies',
        inputSchema: zodToJsonSchema(MergeContextsSchema),
      },

      // Collaboration Tools
      {
        name: 'generate_team_handoff',
        description: 'Generate comprehensive team handoff documentation with risk assessment',
        inputSchema: zodToJsonSchema(GenerateTeamHandoffSchema),
      },
      {
        name: 'create_onboarding_guide',
        description: 'Create role-specific onboarding guides with interactive code tours',
        inputSchema: zodToJsonSchema(CreateOnboardingGuideSchema),
      },
      {
        name: 'extract_tribal_knowledge',
        description: 'Extract and document tribal knowledge from various sources',
        inputSchema: zodToJsonSchema(ExtractTribalKnowledgeSchema),
      },
      {
        name: 'context_diff_analysis',
        description: 'Analyze differences between context snapshots with impact assessment',
        inputSchema: zodToJsonSchema(ContextDiffAnalysisSchema),
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  try {
    switch (name) {
      // Core Analysis Tools
      case 'analyze_codebase': {
        const { projectPath, includePatterns, excludePatterns, maxDepth, analysisDepth } = args as any;
        const result = await codebaseAnalyzer.analyzeCodebase(
          projectPath,
          includePatterns,
          excludePatterns,
          maxDepth,
          analysisDepth
        );
        return {
          content: [
            {
              type: 'text',
              text: `# Codebase Analysis Results

## Overview
- **Total Files:** ${result.overview.totalFiles}
- **Total Lines:** ${result.overview.totalLines.toLocaleString()}
- **Languages:** ${Object.entries(result.overview.languages).map(([lang, count]) => `${lang} (${count})`).join(', ')}
- **Average Complexity:** ${result.overview.complexity.average.toFixed(2)}
- **High Complexity Files:** ${result.overview.complexity.high.length}

## Hotspots (${result.hotspots.length})
${result.hotspots.slice(0, 5).map(spot => 
  `- **${spot.path}** (${spot.severity}): ${spot.issues.join(', ')}`
).join('\\n')}

## Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\\n')}

## Detailed Analysis
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }

      case 'build_dependency_graph': {
        const { projectPath, includeExternal, detectCircular, maxDepth } = args as any;
        const result = await dependencyAnalyzer.buildDependencyGraph(
          projectPath,
          includeExternal,
          detectCircular,
          maxDepth
        );
        return {
          content: [
            {
              type: 'text',
              text: `# Dependency Graph Analysis

## Metrics
- **Total Dependencies:** ${result.metrics.totalDependencies}
- **External Dependencies:** ${result.metrics.externalDependencies}
- **Dependency Depth:** ${result.metrics.depth}
- **Circular Dependencies:** ${result.cycles.length}

## Circular Dependencies
${result.cycles.length > 0 ? 
  result.cycles.map((cycle, i) => `${i + 1}. ${cycle.join(' → ')}`).join('\\n') : 
  'No circular dependencies detected ✅'
}

## Top Dependencies by Fan-In
${Object.entries(result.metrics.fanIn)
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .slice(0, 10)
  .map(([name, count]) => `- **${name}:** ${count} dependents`)
  .join('\\n')}

## Detailed Graph Data
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }

      case 'extract_semantic_context': {
        const { filePath, includeRelationships, confidenceThreshold } = args as any;
        const result = await semanticAnalyzer.extractSemanticContext(
          filePath,
          includeRelationships,
          confidenceThreshold
        );
        return {
          content: [
            {
              type: 'text',
              text: `# Semantic Context Analysis

## Extracted Entities (${result.length})

${result.map(context => `
### ${context.entity} (${context.type})
- **Purpose:** ${context.purpose}
- **Confidence:** ${Math.round(context.confidence * 100)}%
- **Location:** ${context.location.file}:${context.location.line}
- **Tags:** ${context.tags.join(', ')}
${context.relationships.length > 0 ? 
  `- **Relationships:** ${context.relationships.map(rel => 
    `${rel.target} (${rel.type}, ${Math.round(rel.strength * 100)}%)`
  ).join(', ')}` : ''
}
`).join('\\n')}

## Raw Data
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }

      case 'analyze_patterns': {
        const { projectPath, patternTypes, includeAntiPatterns } = args as any;
        const result = await semanticAnalyzer.analyzePatterns(
          projectPath,
          patternTypes,
          includeAntiPatterns
        );
        return {
          content: [
            {
              type: 'text',
              text: `# Architectural Pattern Analysis

## Detected Patterns (${result.detectedPatterns.length})

${result.detectedPatterns.map(pattern => `
### ${pattern.pattern.toUpperCase()} Pattern
- **Confidence:** ${Math.round(pattern.confidence * 100)}%
- **Evidence:** ${pattern.evidence.join(', ')}
- **Components:** ${pattern.components.length}

#### Components
${pattern.components.map(comp => 
  `- **${comp.name}:** ${comp.role} (${comp.files.length} files)`
).join('\\n')}

${pattern.violations.length > 0 ? `#### Violations
${pattern.violations.map(v => 
  `- **${v.severity.toUpperCase()}:** ${v.description}`
).join('\\n')}` : ''}
`).join('\\n')}

## Layering Analysis
${result.layering.layers.map(layer => 
  `- **${layer.name}:** ${layer.components.join(', ')}`
).join('\\n')}

## Modularity Metrics
- **Cohesion:** ${Math.round(result.modularity.cohesion * 100)}%
- **Coupling:** ${Math.round(result.modularity.coupling * 100)}%
- **Instability:** ${Math.round(result.modularity.instability * 100)}%

## Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\\n')}

## Complete Analysis
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }

      case 'generate_context_summary': {
        const { contextData, summaryType, audience, focusAreas } = args as any;
        const result = await contextGenerator.generateContextSummary(
          contextData,
          summaryType,
          audience,
          focusAreas
        );
        return {
          content: [
            {
              type: 'text',
              text: `${result.summary}

## Key Metrics
${Object.entries(result.metrics).map(([key, value]) => 
  `- **${key}:** ${typeof value === 'number' ? value.toLocaleString() : value}`
).join('\\n')}

## Key Points
${result.keyPoints.map(point => `- ${point}`).join('\\n')}

## Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\\n')}

## Next Steps
${result.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\\n')}`,
            },
          ],
        };
      }

      case 'create_mental_model': {
        const { projectPath, perspective, includeDataFlow, includeUserJourney } = args as any;
        const result = await contextGenerator.createMentalModel(
          projectPath,
          perspective,
          includeDataFlow,
          includeUserJourney
        );
        return {
          content: [
            {
              type: 'text',
              text: `# Mental Model - ${perspective.charAt(0).toUpperCase() + perspective.slice(1)} Perspective

## Concept Map
${result.conceptMap.map(concept => `
### ${concept.concept}
- **Description:** ${concept.description}
- **Importance:** ${Math.round(concept.importance * 100)}%
- **Relationships:** ${concept.relationships.map(rel => 
  `${rel.target} (${rel.type}, ${Math.round(rel.strength * 100)}%)`
).join(', ')}
`).join('\\n')}

${includeDataFlow ? `## Data Flow
${result.dataFlow.map(flow => 
  `- **${flow.source}** → **${flow.target}** (${flow.dataType})${flow.transformation ? ` via ${flow.transformation}` : ''}`
).join('\\n')}` : ''}

${includeUserJourney && result.userJourney ? `## User Journey
${result.userJourney.map(step => 
  `${step.step}. **${step.actor}** ${step.action} via **${step.system}** → *${step.outcome}*`
).join('\\n')}` : ''}

## Visual Structure
### Layers
${result.visualStructure.layers.map(layer => `- ${layer}`).join('\\n')}

### Components
${Object.entries(result.visualStructure.components).map(([layer, components]) => 
  `- **${layer}:** ${components.join(', ')}`
).join('\\n')}

### Interfaces
${result.visualStructure.interfaces.map(iface => `- ${iface}`).join('\\n')}

## Complete Model Data
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }

      case 'build_knowledge_graph': {
        const { contextSources, extractionRules, mergingStrategy } = args as any;
        const result = await contextGenerator.buildKnowledgeGraph(
          contextSources,
          extractionRules,
          mergingStrategy
        );
        return {
          content: [
            {
              type: 'text',
              text: `# Knowledge Graph

## Overview
- **Nodes:** ${result.nodes.length}
- **Relationships:** ${result.relationships.length}
- **Clusters:** ${result.clusters.length}
- **Insights:** ${result.insights.length}

## Key Insights
${result.insights.map(insight => `
### ${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
${insight.description} (${Math.round(insight.confidence * 100)}% confidence)

**Evidence:**
${insight.supportingEvidence.map(evidence => `- ${evidence}`).join('\\n')}
`).join('\\n')}

## Clusters
${result.clusters.map(cluster => 
  `- **${cluster.name}:** ${cluster.nodes.length} nodes, ${Math.round(cluster.cohesion * 100)}% cohesion`
).join('\\n')}

## Top Nodes by Importance
${result.nodes
  .sort((a, b) => b.importance - a.importance)
  .slice(0, 10)
  .map(node => 
    `- **${node.title}** (${node.type}): ${Math.round(node.importance * 100)}% importance, ${Math.round(node.certainty * 100)}% certainty`
  ).join('\\n')}

## Strongest Relationships
${result.relationships
  .sort((a, b) => b.strength - a.strength)
  .slice(0, 10)
  .map(rel => 
    `- **${rel.source}** → **${rel.target}** (${rel.type}, ${Math.round(rel.strength * 100)}%)`
  ).join('\\n')}

## Complete Graph Data
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }

      // Advanced analysis tools
      case 'code_quality_analysis': {
        const { projectPath, metrics, thresholds } = args as any;
        const result = await advancedAnalyzer.analyzeCodeQuality(projectPath, {
          includeComplexity: metrics?.includes('complexity') ?? true,
          includeCoverage: metrics?.includes('maintainability') ?? true,
          includeSmells: metrics?.includes('readability') ?? true,
          thresholds
        });
        return {
          content: [
            {
              type: 'text',
              text: `# Code Quality Analysis

## Overview
- **Maintainability Index:** ${result.maintainability.index}/100 (${result.maintainability.score})
- **Cyclomatic Complexity:** ${result.complexity.cyclomatic} (avg: ${Math.round(result.complexity.average)})
- **Test Coverage:** ${result.testCoverage.lines}%
- **Code Smells:** ${result.codeSmells.length}

## Quality Metrics
- **Total Files:** ${result.metrics.totalFiles}
- **Total Lines:** ${result.metrics.totalLines}
- **Total Functions:** ${result.metrics.totalFunctions}
- **Avg Lines/File:** ${result.metrics.averageLinesPerFile}

## Complexity Distribution
${Object.entries(result.complexity.distribution).map(([range, count]) => 
  `- **${range}:** ${count} files`
).join('\\n')}

## Code Smells (${result.codeSmells.length})
${result.codeSmells.slice(0, 10).map(smell => 
  `- **${smell.type}** (${smell.severity}): ${smell.description} at ${smell.location.file}:${smell.location.line}`
).join('\\n')}

## Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\\n')}

## Detailed Analysis
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }

      case 'security_context_analysis': {
        const { projectPath, scanTypes, riskTolerance, includeThirdParty } = args as any;
        const result = await advancedAnalyzer.analyzeSecurityContext(projectPath, {
          includeOWASP: scanTypes?.includes('vulnerabilities') ?? true,
          includeCWE: scanTypes?.includes('code-patterns') ?? true,
          scanDependencies: includeThirdParty ?? true
        });
        return {
          content: [
            {
              type: 'text',
              text: `# Security Context Analysis

## Risk Assessment
- **Overall Risk Level:** ${result.riskLevel.toUpperCase()}
- **Total Vulnerabilities:** ${result.vulnerabilities.length}
- **OWASP Compliance Score:** ${result.compliance.owasp.score}%

## Vulnerabilities by Severity
${Object.entries(result.vulnerabilities.reduce((acc: Record<string, number>, vuln) => {
  acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
  return acc;
}, {})).map(([severity, count]) => 
  `- **${severity.charAt(0).toUpperCase() + severity.slice(1)}:** ${count}`
).join('\\n')}

## Critical Issues (Top 10)
${result.vulnerabilities
  .filter(v => v.severity === 'high' || v.severity === 'critical')
  .slice(0, 10)
  .map(vuln => 
    `- **${vuln.type}** (${vuln.severity}): ${vuln.description}\\n  📍 ${vuln.location.file}:${vuln.location.line}\\n  🔧 ${vuln.remediation}`
  ).join('\\n\\n')}

## OWASP Coverage
- **Tests Passed:** ${result.compliance.owasp.passed}
- **Tests Failed:** ${result.compliance.owasp.failed}
- **Coverage Score:** ${result.compliance.owasp.score}%

## CWE Analysis
- **Covered:** ${result.compliance.cwe.covered.join(', ')}
- **Missing:** ${result.compliance.cwe.missing.join(', ')}

## Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\\n')}

## Detailed Analysis
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }
      
      case 'performance_bottleneck_detection': {
        const { projectPath, analysisTypes, targetMetrics } = args as any;
        const result = await advancedAnalyzer.detectPerformanceBottlenecks(projectPath, {
          analyzeAsync: analysisTypes?.includes('cpu') ?? true,
          analyzeDatabaseCalls: analysisTypes?.includes('database') ?? true,
          analyzeLoops: analysisTypes?.includes('algorithmic') ?? true,
          memoryAnalysis: analysisTypes?.includes('memory') ?? true
        });
        return {
          content: [
            {
              type: 'text',
              text: `# Performance Bottleneck Analysis

## Overview
- **Total Bottlenecks:** ${result.bottlenecks.length}
- **Performance Hotspots:** ${result.hotspots.length}
- **Critical Issues:** ${result.hotspots.filter(h => h.severity === 'high').length}

## Performance Metrics
- **Async Patterns:** ${result.metrics.asyncPatterns}
- **Synchronous Operations:** ${result.metrics.syncOperations}
- **Database Calls:** ${result.metrics.databaseCalls}
- **Network Requests:** ${result.metrics.networkRequests}
- **Heavy Loops:** ${result.metrics.heavyLoops}

## Critical Bottlenecks
${result.bottlenecks
  .filter(b => b.severity === 'high')
  .slice(0, 10)
  .map(bottleneck => 
    `### ${bottleneck.type.replace('_', ' ').toUpperCase()} (${bottleneck.severity})
**Location:** ${bottleneck.location.file}:${bottleneck.location.line} in \`${bottleneck.location.function}\`
**Issue:** ${bottleneck.description}
**Impact:** ${bottleneck.impact}
**Suggestion:** ${bottleneck.suggestion}
`).join('\\n')}

## Performance Hotspots
${result.hotspots.slice(0, 10).map(hotspot => 
  `- **${hotspot.function}** (${hotspot.severity}) in ${hotspot.file}\\n  Issues: ${hotspot.issues.join(', ')}\\n  Suggestions: ${hotspot.suggestions.join(', ')}`
).join('\\n\\n')}

## Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\\n')}

## Detailed Analysis
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }

      case 'technical_debt_assessment': {
        const { projectPath, debtTypes, prioritizationCriteria, includeEstimates } = args as any;
        const result = await advancedAnalyzer.assessTechnicalDebt(projectPath, {
          includeCodeDebt: debtTypes?.includes('code') ?? true,
          includeArchitecturalDebt: debtTypes?.includes('infrastructure') ?? true,
          includeTestDebt: debtTypes?.includes('test') ?? true,
          includeDocumentation: debtTypes?.includes('documentation') ?? true
        });
        return {
          content: [
            {
              type: 'text',
              text: `# Technical Debt Assessment

## Summary
- **Total Debt Items:** ${result.summary.total}
- **Estimated Hours:** ${result.summary.estimatedHours}
- **Interest Rate:** ${result.summary.interestRate}%

## Debt by Category
${Object.entries(result.summary.byCategory).map(([category, count]) => 
  `- **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${count} items`
).join('\\n')}

## Debt by Severity
${Object.entries(result.summary.bySeverity).map(([severity, count]) => 
  `- **${severity.charAt(0).toUpperCase() + severity.slice(1)}:** ${count} items`
).join('\\n')}

## High Priority Items (Top 10)
${result.prioritization.slice(0, 10).map((item, index) => 
  `${index + 1}. **${item.item.type}** (Priority: ${item.priority})
   📍 ${item.item.location.file}:${item.item.location.line}
   📝 ${item.item.description}
   ⏱️ ${item.item.estimatedHours}h
   💡 ${item.reasoning}
`).join('\\n')}

## Payoff Strategy

### Quick Wins (≤2 hours)
${result.payoffStrategy.quickWins.slice(0, 5).map(item => 
  `- **${item.type}**: ${item.description} (${item.estimatedHours}h)`
).join('\\n')}

### Major Refactors (2-20 hours)
${result.payoffStrategy.majorRefactors.slice(0, 5).map(item => 
  `- **${item.type}**: ${item.description} (${item.estimatedHours}h)`
).join('\\n')}

### Long-term Goals (>20 hours)
${result.payoffStrategy.longTermGoals.slice(0, 3).map(item => 
  `- **${item.type}**: ${item.description} (${item.estimatedHours}h)`
).join('\\n')}

## Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\\n')}

## Detailed Analysis
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
            },
          ],
        };
      }

      case 'detect_architecture':
        return {
          content: [
            {
              type: 'text',
              text: `Architecture Detection (placeholder):
This tool will detect architectural patterns and styles.
Arguments received:\n\n${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      case 'context_evolution_tracking':
        return {
          content: [
            {
              type: 'text',
              text: `Context Evolution Tracking (placeholder):
This tool will track context evolution over time.
Arguments received:\n\n${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      case 'extract_tribal_knowledge':
        return {
          content: [
            {
              type: 'text',
              text: `Tribal Knowledge Extraction (placeholder):
This tool will extract undocumented tribal knowledge from the codebase.
Arguments received:\n\n${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      case 'incremental_learning':
        return {
          content: [
            {
              type: 'text',
              text: `Incremental Learning (placeholder):
This tool will support incremental learning and adaptation.
Arguments received:\n\n${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Tool "${name}" is not yet fully implemented. This is a placeholder response.\n\nArguments received:\n\n${JSON.stringify(args, null, 2)}`,
            },
          ],
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${errorMessage}

Please check your input parameters and try again. If the error persists, this may indicate a bug in the tool implementation.

Arguments provided:
\`\`\`json
${JSON.stringify(args, null, 2)}
\`\`\``,
        },
      ],
    };
  }
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Advanced Context Generation MCP Server running on stdio');
  console.error('Available tools: 21 advanced context analysis and generation tools');
  console.error('Capabilities: codebase analysis, dependency mapping, semantic understanding, knowledge graphs, incremental learning');
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});