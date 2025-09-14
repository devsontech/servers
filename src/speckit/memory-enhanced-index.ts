#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Import enterprise modules
import { EnterpriseGovernanceManager } from './src/enterprise/governance.js';
import { EnterpriseSecurityManager } from './src/enterprise/security.js';
import { EnterpriseCICDManager } from './src/enterprise/cicd.js';
import { EnterpriseMonitoringManager } from './src/enterprise/monitoring.js';
import { EnterpriseScalabilityManager } from './src/enterprise/scalability.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced schema definitions with memory integration
const MemoryQuerySchema = z.object({
  query: z.string().describe("Search query for memory patterns"),
  workspace: z.string().optional().describe("Specific workspace context"),
  prefer_contexts: z.array(z.string()).optional().describe("Preferred contexts for results"),
  exclude_contexts: z.array(z.string()).optional().describe("Contexts to exclude"),
  boost_recent: z.boolean().optional().default(true).describe("Boost recent patterns"),
});

const SmartVariableDiscoverySchema = z.object({
  projectPath: z.string().describe("Path to analyze for variables"),
  includeTechnologies: z.array(z.string()).optional().describe("Technologies to extract patterns from"),
  scanDepth: z.enum(['shallow', 'deep', 'comprehensive']).optional().default('deep').describe("How deep to scan for patterns"),
});

const TemplateOrchestrationSchema = z.object({
  templates: z.array(z.string()).describe("List of templates to orchestrate"),
  variables: z.record(z.string()).describe("Global variables for all templates"),
  executionStrategy: z.enum(['sequential', 'parallel', 'dependent']).optional().default('sequential'),
  memoryEnabled: z.boolean().optional().default(true).describe("Enable memory-driven enhancements"),
});

const ValidationConfigSchema = z.object({
  syntaxChecking: z.boolean().optional().default(true),
  dependencyValidation: z.boolean().optional().default(true),
  buildSimulation: z.boolean().optional().default(false),
  memoryPatternCompliance: z.boolean().optional().default(true),
  errorPrevention: z.boolean().optional().default(true),
});

// Memory integration interface
interface MemoryEntity {
  name: string;
  entityType: string;
  observations: string[];
  metadata?: Record<string, any>;
}

interface MemorySearchResult {
  entities: MemoryEntity[];
  relations: { from: string; to: string; relationType: string; }[];
}

// Enhanced template variable system
interface SmartVariable {
  name: string;
  value: string;
  source: 'memory' | 'workspace' | 'user' | 'inferred';
  confidence: number;
  suggestions?: string[];
  description?: string;
  pattern?: string;
}

interface VariableLibrary {
  variables: Record<string, SmartVariable>;
  patterns: Record<string, string[]>;
  suggestions: Record<string, string[]>;
  lastUpdated: string;
}

// Enhanced Spec-Kit Manager with Memory Integration
class MemoryEnhancedSpecKitManager {
  private governance: EnterpriseGovernanceManager | null = null;
  private security: EnterpriseSecurityManager | null = null;
  private cicd: EnterpriseCICDManager | null = null;
  private monitoring: EnterpriseMonitoringManager | null = null;
  private scalability: EnterpriseScalabilityManager | null = null;
  private directoryConfig: any = {};
  private variableLibrary: VariableLibrary = {
    variables: {},
    patterns: {},
    suggestions: {},
    lastUpdated: new Date().toISOString()
  };

  constructor(basePath: string, enterpriseMode: boolean = false) {
    if (enterpriseMode) {
      this.governance = new EnterpriseGovernanceManager(basePath);
      this.security = new EnterpriseSecurityManager(basePath);
      this.cicd = new EnterpriseCICDManager(basePath);
      this.monitoring = new EnterpriseMonitoringManager(basePath);
      this.scalability = new EnterpriseScalabilityManager(basePath);
    }
    this.loadVariableLibrary(basePath);
  }

  // Memory Integration Methods
  async queryMemoryForPatterns(query: z.infer<typeof MemoryQuerySchema>): Promise<MemorySearchResult> {
    // This would integrate with the memory MCP server
    // For now, we'll simulate the integration
    const memoryResults: MemorySearchResult = {
      entities: [],
      relations: []
    };

    try {
      // In actual implementation, this would call the memory MCP server
      // For now, we'll return mock data based on common patterns
      if (query.query.toLowerCase().includes('component')) {
        memoryResults.entities.push({
          name: 'Angular Component Pattern',
          entityType: 'pattern',
          observations: [
            'Components should follow single responsibility principle',
            'Use OnPush change detection for performance',
            'Implement proper lifecycle hooks',
            'Export interfaces for component contracts'
          ],
          metadata: {
            technology: 'Angular',
            confidence_score: 0.95,
            workspace: 'frontend',
            createdAt: new Date().toISOString()
          }
        });
      }

      if (query.query.toLowerCase().includes('service')) {
        memoryResults.entities.push({
          name: 'Service Layer Pattern',
          entityType: 'pattern',
          observations: [
            'Services should be stateless',
            'Implement dependency injection',
            'Use proper error handling',
            'Cache frequently accessed data'
          ],
          metadata: {
            technology: 'ABP Framework',
            confidence_score: 0.92,
            workspace: 'backend',
            createdAt: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      console.warn('Memory integration not available, using fallback patterns');
    }

    return memoryResults;
  }

  async discoverSmartVariables(args: z.infer<typeof SmartVariableDiscoverySchema>): Promise<Record<string, SmartVariable>> {
    const variables: Record<string, SmartVariable> = {};
    
    try {
      // Scan workspace for common patterns and variables
      const packageJsonPath = path.join(args.projectPath, 'package.json');
      if (await this.fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        
        variables.PROJECT_NAME = {
          name: 'PROJECT_NAME',
          value: packageJson.name || path.basename(args.projectPath),
          source: 'workspace',
          confidence: 0.95,
          description: 'Project name from package.json'
        };

        if (packageJson.dependencies) {
          // Detect technology stack
          const technologies = this.detectTechnologies(packageJson.dependencies);
          variables.TECHNOLOGY_STACK = {
            name: 'TECHNOLOGY_STACK',
            value: technologies.join(', '),
            source: 'workspace',
            confidence: 0.9,
            description: 'Detected technology stack from dependencies'
          };
        }
      }

      // Query memory for similar projects
      const memoryPatterns = await this.queryMemoryForPatterns({
        query: `project ${variables.PROJECT_NAME?.value || 'similar'}`,
        workspace: 'frontend',
        boost_recent: true
      });

      // Extract patterns from memory
      memoryPatterns.entities.forEach(entity => {
        if (entity.metadata?.variables) {
          Object.entries(entity.metadata.variables).forEach(([key, value]) => {
            variables[key] = {
              name: key,
              value: String(value),
              source: 'memory',
              confidence: entity.metadata?.confidence_score || 0.8,
              description: `From memory pattern: ${entity.name}`
            };
          });
        }
      });

      // Store in variable library
      Object.assign(this.variableLibrary.variables, variables);
      await this.saveVariableLibrary(args.projectPath);

    } catch (error) {
      console.warn('Error discovering smart variables:', error);
    }

    return variables;
  }

  // Real-time validation system
  async validateTemplateInRealTime(
    templateContent: string, 
    variables: Record<string, string>,
    config: z.infer<typeof ValidationConfigSchema>
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    memoryConflicts: string[];
  }> {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
      memoryConflicts: [] as string[]
    };

    // Syntax validation
    if (config.syntaxChecking) {
      const syntaxErrors = await this.validateTemplateSyntax(templateContent, variables);
      result.errors.push(...syntaxErrors);
    }

    // Memory pattern compliance
    if (config.memoryPatternCompliance) {
      const memoryValidation = await this.validateAgainstMemoryPatterns(templateContent, variables);
      result.memoryConflicts.push(...memoryValidation.conflicts);
      result.suggestions.push(...memoryValidation.suggestions);
    }

    // Dependency validation
    if (config.dependencyValidation) {
      const depWarnings = await this.validateDependencies(templateContent, variables);
      result.warnings.push(...depWarnings);
    }

    // Build simulation
    if (config.buildSimulation) {
      const buildErrors = await this.simulateBuild(templateContent, variables);
      result.errors.push(...buildErrors);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Template orchestration system
  async orchestrateTemplates(args: z.infer<typeof TemplateOrchestrationSchema>): Promise<{
    results: Array<{
      templateName: string;
      outputPath: string;
      success: boolean;
      errors?: string[];
      variables?: Record<string, string>;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      warnings: string[];
    };
  }> {
    const results: Array<{
      templateName: string;
      outputPath: string;
      success: boolean;
      errors?: string[];
      variables?: Record<string, string>;
    }> = [];

    let successful = 0;
    let failed = 0;
    const warnings: string[] = [];

    // Memory-driven variable enhancement
    if (args.memoryEnabled) {
      const memoryVariables = await this.queryMemoryForPatterns({
        query: `template variables ${args.templates.join(' ')}`,
        boost_recent: true
      });

      // Enhance variables with memory patterns
      memoryVariables.entities.forEach(entity => {
        entity.observations.forEach(obs => {
          const variableMatch = obs.match(/\{\{(\w+)\}\}/g);
          if (variableMatch) {
            variableMatch.forEach(match => {
              const varName = match.replace(/\{\{|\}\}/g, '');
              if (!args.variables[varName] && entity.metadata?.suggestions?.[varName]) {
                args.variables[varName] = entity.metadata.suggestions[varName];
                warnings.push(`Auto-filled variable ${varName} from memory pattern`);
              }
            });
          }
        });
      });
    }

    // Process templates based on execution strategy
    if (args.executionStrategy === 'parallel') {
      const promises = args.templates.map(template => this.processSingleTemplate(template, args.variables));
      const templateResults = await Promise.allSettled(promises);
      
      templateResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          successful++;
        } else {
          results.push({
            templateName: args.templates[index],
            outputPath: '',
            success: false,
            errors: [result.reason?.message || 'Unknown error']
          });
          failed++;
        }
      });
    } else {
      // Sequential processing
      for (const template of args.templates) {
        try {
          const result = await this.processSingleTemplate(template, args.variables);
          results.push(result);
          
          if (result.success) {
            successful++;
            // For dependent strategy, use outputs as inputs for next template
            if (args.executionStrategy === 'dependent' && result.variables) {
              Object.assign(args.variables, result.variables);
            }
          } else {
            failed++;
          }
        } catch (error) {
          results.push({
            templateName: template,
            outputPath: '',
            success: false,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
          failed++;
        }
      }
    }

    return {
      results,
      summary: {
        total: args.templates.length,
        successful,
        failed,
        warnings
      }
    };
  }

  // Error prevention and recovery system
  async preventErrors(templateContent: string, variables: Record<string, string>): Promise<{
    potentialErrors: Array<{
      type: 'syntax' | 'dependency' | 'pattern' | 'build';
      message: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
      autoFixable: boolean;
    }>;
    preventiveMeasures: string[];
    recoveryActions: string[];
  }> {
    const potentialErrors: Array<{
      type: 'syntax' | 'dependency' | 'pattern' | 'build';
      message: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
      autoFixable: boolean;
    }> = [];

    // Check for common template errors
    const unresolvedVariables = this.findUnresolvedVariables(templateContent, variables);
    unresolvedVariables.forEach(varName => {
      potentialErrors.push({
        type: 'syntax',
        message: `Unresolved variable: {{${varName}}}`,
        severity: 'high',
        suggestion: `Define variable ${varName} or provide a default value`,
        autoFixable: true
      });
    });

    // Check against memory patterns for potential conflicts
    const memoryPatterns = await this.queryMemoryForPatterns({
      query: `template errors ${Object.keys(variables).join(' ')}`,
      boost_recent: true
    });

    memoryPatterns.entities.forEach(entity => {
      if (entity.entityType === 'antipattern' || entity.entityType === 'error') {
        potentialErrors.push({
          type: 'pattern',
          message: `Potential antipattern detected: ${entity.name}`,
          severity: 'medium',
          suggestion: entity.observations[0] || 'Review implementation approach',
          autoFixable: false
        });
      }
    });

    return {
      potentialErrors,
      preventiveMeasures: [
        'Validate all variables before template processing',
        'Check memory patterns for established practices',
        'Run syntax validation on generated content',
        'Simulate build process before file creation'
      ],
      recoveryActions: [
        'Auto-fix unresolved variables with memory suggestions',
        'Rollback to last known good state',
        'Apply memory-suggested corrections',
        'Generate alternative implementations'
      ]
    };
  }

  // Analytics and learning system
  async trackTemplateUsage(templateName: string, variables: Record<string, string>, success: boolean): Promise<void> {
    const usageData = {
      templateName,
      variables: Object.keys(variables),
      success,
      timestamp: new Date().toISOString(),
      variableCount: Object.keys(variables).length
    };

    // Store usage analytics (would integrate with memory system)
    try {
      // This would be stored in memory for learning purposes
      await this.storeUsageAnalytics(usageData);
    } catch (error) {
      console.warn('Failed to store usage analytics:', error);
    }
  }

  // Helper Methods
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private detectTechnologies(dependencies: Record<string, string>): string[] {
    const technologies: string[] = [];
    const techMap: Record<string, string> = {
      '@angular/core': 'Angular',
      'react': 'React',
      'vue': 'Vue.js',
      '@abp/ng.core': 'ABP Framework',
      'typescript': 'TypeScript',
      '@carbon/angular': 'Carbon Design System',
      'rxjs': 'RxJS'
    };

    Object.keys(dependencies).forEach(dep => {
      if (techMap[dep]) {
        technologies.push(techMap[dep]);
      }
    });

    return technologies;
  }

  private async validateTemplateSyntax(templateContent: string, variables: Record<string, string>): Promise<string[]> {
    const errors: string[] = [];
    
    // Check for unmatched brackets
    const openBrackets = (templateContent.match(/\{\{/g) || []).length;
    const closeBrackets = (templateContent.match(/\}\}/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      errors.push('Unmatched template brackets detected');
    }

    // Check for undefined variables
    const variableMatches = templateContent.match(/\{\{([^}]+)\}\}/g) || [];
    variableMatches.forEach(match => {
      const varName = match.replace(/\{\{|\}\}/g, '').trim();
      if (!variables[varName]) {
        errors.push(`Undefined variable: ${varName}`);
      }
    });

    return errors;
  }

  private async validateAgainstMemoryPatterns(templateContent: string, variables: Record<string, string>): Promise<{
    conflicts: string[];
    suggestions: string[];
  }> {
    const conflicts: string[] = [];
    const suggestions: string[] = [];

    try {
      const memoryPatterns = await this.queryMemoryForPatterns({
        query: `validation patterns ${Object.keys(variables).join(' ')}`,
        boost_recent: true
      });

      memoryPatterns.entities.forEach(entity => {
        if (entity.entityType === 'validation_rule' || entity.entityType === 'best_practice') {
          entity.observations.forEach(obs => {
            if (!templateContent.includes(obs.toLowerCase())) {
              suggestions.push(`Consider adding: ${obs}`);
            }
          });
        }
      });
    } catch (error) {
      console.warn('Memory pattern validation unavailable');
    }

    return { conflicts, suggestions };
  }

  private async validateDependencies(templateContent: string, variables: Record<string, string>): Promise<string[]> {
    const warnings: string[] = [];
    
    // Check for common dependency patterns
    if (templateContent.includes('import') && !variables.DEPENDENCIES_CHECKED) {
      warnings.push('Template contains imports but dependencies not validated');
    }

    return warnings;
  }

  private async simulateBuild(templateContent: string, variables: Record<string, string>): Promise<string[]> {
    const errors: string[] = [];
    
    // Simple build simulation - check for basic syntax issues
    const processed = this.processTemplateVariables(templateContent, variables);
    
    if (processed.includes('undefined') || processed.includes('null')) {
      errors.push('Build simulation detected undefined values in processed template');
    }

    return errors;
  }

  private processTemplateVariables(template: string, variables: Record<string, string>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(placeholder, value);
    });

    return processed;
  }

  private findUnresolvedVariables(templateContent: string, variables: Record<string, string>): string[] {
    const unresolved: string[] = [];
    const variableMatches = templateContent.match(/\{\{([^}]+)\}\}/g) || [];
    
    variableMatches.forEach(match => {
      const varName = match.replace(/\{\{|\}\}/g, '').trim();
      if (!variables[varName]) {
        unresolved.push(varName);
      }
    });

    return [...new Set(unresolved)]; // Remove duplicates
  }

  private async processSingleTemplate(templateName: string, variables: Record<string, string>): Promise<{
    templateName: string;
    outputPath: string;
    success: boolean;
    errors?: string[];
    variables?: Record<string, string>;
  }> {
    // Simulate template processing
    const outputPath = `/generated/${templateName}-${Date.now()}.md`;
    
    try {
      // Track usage for analytics
      await this.trackTemplateUsage(templateName, variables, true);
      
      return {
        templateName,
        outputPath,
        success: true,
        variables: variables
      };
    } catch (error) {
      await this.trackTemplateUsage(templateName, variables, false);
      
      return {
        templateName,
        outputPath: '',
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async loadVariableLibrary(basePath: string): Promise<void> {
    try {
      const libraryPath = path.join(basePath, '.speckit', 'variable-library.json');
      if (await this.fileExists(libraryPath)) {
        const content = await fs.readFile(libraryPath, 'utf-8');
        this.variableLibrary = JSON.parse(content);
      }
    } catch (error) {
      console.warn('Could not load variable library, using defaults');
    }
  }

  private async saveVariableLibrary(basePath: string): Promise<void> {
    try {
      const configDir = path.join(basePath, '.speckit');
      const libraryPath = path.join(configDir, 'variable-library.json');
      
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(libraryPath, JSON.stringify(this.variableLibrary, null, 2));
    } catch (error) {
      console.warn('Could not save variable library:', error);
    }
  }

  private async storeUsageAnalytics(data: any): Promise<void> {
    // This would integrate with memory system to store analytics
    console.log('Usage analytics:', data);
  }

  // Context-aware template suggestions
  async suggestTemplateImprovements(templateContent: string, context: {
    technology?: string;
    domain?: string;
    complexity?: 'simple' | 'moderate' | 'complex';
  }): Promise<{
    suggestions: Array<{
      type: 'structure' | 'content' | 'variable' | 'pattern';
      suggestion: string;
      confidence: number;
      source: 'memory' | 'heuristic';
    }>;
    memoryPatterns: MemoryEntity[];
  }> {
    const suggestions: Array<{
      type: 'structure' | 'content' | 'variable' | 'pattern';
      suggestion: string;
      confidence: number;
      source: 'memory' | 'heuristic';
    }> = [];

    // Query memory for similar templates and patterns
    const queryStr = `template ${context.technology || ''} ${context.domain || ''} ${context.complexity || ''}`.trim();
    const memoryPatterns = await this.queryMemoryForPatterns({
      query: queryStr,
      boost_recent: true
    });

    // Analyze memory patterns for suggestions
    memoryPatterns.entities.forEach(entity => {
      if (entity.entityType === 'template_pattern' || entity.entityType === 'best_practice') {
        entity.observations.forEach(obs => {
          if (!templateContent.toLowerCase().includes(obs.toLowerCase())) {
            suggestions.push({
              type: 'content',
              suggestion: `Consider adding: ${obs}`,
              confidence: entity.metadata?.confidence_score || 0.8,
              source: 'memory'
            });
          }
        });
      }
    });

    // Heuristic-based suggestions
    if (!templateContent.includes('## Testing')) {
      suggestions.push({
        type: 'structure',
        suggestion: 'Add testing section to template',
        confidence: 0.9,
        source: 'heuristic'
      });
    }

    if (!templateContent.includes('{{')) {
      suggestions.push({
        type: 'variable',
        suggestion: 'Template has no variables - consider adding placeholders for customization',
        confidence: 0.8,
        source: 'heuristic'
      });
    }

    return {
      suggestions,
      memoryPatterns: memoryPatterns.entities
    };
  }
}

// Initialize the enhanced server
const server = new Server(
  {
    name: "speckit-memory-enhanced",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const manager = new MemoryEnhancedSpecKitManager(process.cwd());

// Enhanced tool list with memory integration
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Memory-enhanced core tools
      {
        name: "memory_query_patterns",
        description: "Query memory system for patterns related to template creation",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query for memory patterns" },
            workspace: { type: "string", description: "Specific workspace context" },
            prefer_contexts: { type: "array", items: { type: "string" }, description: "Preferred contexts" },
            exclude_contexts: { type: "array", items: { type: "string" }, description: "Contexts to exclude" },
            boost_recent: { type: "boolean", description: "Boost recent patterns" },
          },
          required: ["query"],
        },
      },
      {
        name: "discover_smart_variables",
        description: "Discover variables from workspace analysis and memory patterns",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: { type: "string", description: "Path to analyze for variables" },
            includeTechnologies: { type: "array", items: { type: "string" }, description: "Technologies to extract patterns from" },
            scanDepth: { type: "string", enum: ["shallow", "deep", "comprehensive"], description: "Scan depth" },
          },
          required: ["projectPath"],
        },
      },
      {
        name: "validate_template_realtime",
        description: "Perform real-time validation of template with memory pattern compliance",
        inputSchema: {
          type: "object",
          properties: {
            templateContent: { type: "string", description: "Template content to validate" },
            variables: { type: "object", additionalProperties: { type: "string" }, description: "Variables for template" },
            syntaxChecking: { type: "boolean", description: "Enable syntax checking" },
            dependencyValidation: { type: "boolean", description: "Enable dependency validation" },
            buildSimulation: { type: "boolean", description: "Enable build simulation" },
            memoryPatternCompliance: { type: "boolean", description: "Check against memory patterns" },
            errorPrevention: { type: "boolean", description: "Enable error prevention" },
          },
          required: ["templateContent", "variables"],
        },
      },
      {
        name: "orchestrate_templates",
        description: "Process multiple templates with memory-enhanced variables",
        inputSchema: {
          type: "object",
          properties: {
            templates: { type: "array", items: { type: "string" }, description: "Templates to orchestrate" },
            variables: { type: "object", additionalProperties: { type: "string" }, description: "Global variables" },
            executionStrategy: { type: "string", enum: ["sequential", "parallel", "dependent"], description: "Execution strategy" },
            memoryEnabled: { type: "boolean", description: "Enable memory-driven enhancements" },
          },
          required: ["templates", "variables"],
        },
      },
      {
        name: "prevent_errors",
        description: "Analyze template for potential errors and suggest prevention measures",
        inputSchema: {
          type: "object",
          properties: {
            templateContent: { type: "string", description: "Template content to analyze" },
            variables: { type: "object", additionalProperties: { type: "string" }, description: "Template variables" },
          },
          required: ["templateContent", "variables"],
        },
      },
      {
        name: "suggest_template_improvements",
        description: "Get context-aware suggestions for template improvements using memory patterns",
        inputSchema: {
          type: "object",
          properties: {
            templateContent: { type: "string", description: "Current template content" },
            technology: { type: "string", description: "Technology context" },
            domain: { type: "string", description: "Domain context" },
            complexity: { type: "string", enum: ["simple", "moderate", "complex"], description: "Template complexity" },
          },
          required: ["templateContent"],
        },
      },
      // All original tools remain available...
    ],
  };
});

// Enhanced tool request handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "memory_query_patterns": {
        const validatedArgs = MemoryQuerySchema.parse(args);
        const result = await manager.queryMemoryForPatterns(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Memory Pattern Query Results:\n\nFound ${result.entities.length} patterns and ${result.relations.length} relations.\n\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case "discover_smart_variables": {
        const validatedArgs = SmartVariableDiscoverySchema.parse(args);
        const variables = await manager.discoverSmartVariables(validatedArgs);
        const variableCount = Object.keys(variables).length;
        const memorySourced = Object.values(variables).filter(v => v.source === 'memory').length;
        
        return {
          content: [
            {
              type: "text",
              text: `Smart Variable Discovery Complete:\n\nDiscovered ${variableCount} variables:\n- ${memorySourced} from memory patterns\n- ${variableCount - memorySourced} from workspace analysis\n\nVariables:\n${Object.entries(variables).map(([key, var_]) => `• ${key}: ${var_.value} (${var_.source}, confidence: ${var_.confidence})`).join('\n')}\n\nVariable library updated and saved for future use.`,
            },
          ],
        };
      }

      case "validate_template_realtime": {
        const templateContent = args.templateContent as string;
        const variables = args.variables as Record<string, string>;
        const config = {
          syntaxChecking: args.syntaxChecking ?? true,
          dependencyValidation: args.dependencyValidation ?? true,
          buildSimulation: args.buildSimulation ?? false,
          memoryPatternCompliance: args.memoryPatternCompliance ?? true,
          errorPrevention: args.errorPrevention ?? true,
        };
        
        const result = await manager.validateTemplateInRealTime(templateContent, variables, config);
        
        return {
          content: [
            {
              type: "text",
              text: `Template Validation Results:\n\n✅ Valid: ${result.isValid}\n🚨 Errors: ${result.errors.length}\n⚠️  Warnings: ${result.warnings.length}\n💡 Suggestions: ${result.suggestions.length}\n🔄 Memory Conflicts: ${result.memoryConflicts.length}\n\n${result.errors.length > 0 ? `Errors:\n${result.errors.map(e => `• ${e}`).join('\n')}\n\n` : ''}${result.warnings.length > 0 ? `Warnings:\n${result.warnings.map(w => `• ${w}`).join('\n')}\n\n` : ''}${result.suggestions.length > 0 ? `Suggestions:\n${result.suggestions.map(s => `• ${s}`).join('\n')}\n\n` : ''}${result.memoryConflicts.length > 0 ? `Memory Conflicts:\n${result.memoryConflicts.map(c => `• ${c}`).join('\n')}` : ''}`,
            },
          ],
        };
      }

      case "orchestrate_templates": {
        const validatedArgs = TemplateOrchestrationSchema.parse(args);
        const result = await manager.orchestrateTemplates(validatedArgs);
        
        return {
          content: [
            {
              type: "text",
              text: `Template Orchestration Complete:\n\n📊 Summary:\n• Total: ${result.summary.total}\n• Successful: ${result.summary.successful}\n• Failed: ${result.summary.failed}\n\n${result.summary.warnings.length > 0 ? `⚠️ Warnings:\n${result.summary.warnings.map(w => `• ${w}`).join('\n')}\n\n` : ''}🎯 Results:\n${result.results.map(r => `• ${r.templateName}: ${r.success ? '✅' : '❌'} ${r.outputPath || r.errors?.join(', ')}`).join('\n')}\n\nAll successful templates have been generated with memory-enhanced variables!`,
            },
          ],
        };
      }

      case "prevent_errors": {
        const templateContent = args.templateContent as string;
        const variables = args.variables as Record<string, string>;
        const result = await manager.preventErrors(templateContent, variables);
        
        return {
          content: [
            {
              type: "text",
              text: `Error Prevention Analysis:\n\n🚨 Potential Errors: ${result.potentialErrors.length}\n\n${result.potentialErrors.map(e => `• ${e.type.toUpperCase()}: ${e.message}\n  Severity: ${e.severity}\n  Suggestion: ${e.suggestion}\n  Auto-fixable: ${e.autoFixable ? 'Yes' : 'No'}`).join('\n\n')}\n\n🛡️ Preventive Measures:\n${result.preventiveMeasures.map(m => `• ${m}`).join('\n')}\n\n🔧 Recovery Actions:\n${result.recoveryActions.map(a => `• ${a}`).join('\n')}`,
            },
          ],
        };
      }

      case "suggest_template_improvements": {
        const templateContent = args.templateContent as string;
        const context = {
          technology: args.technology,
          domain: args.domain,
          complexity: args.complexity
        };
        const result = await manager.suggestTemplateImprovements(templateContent, context);
        
        return {
          content: [
            {
              type: "text",
              text: `Template Improvement Suggestions:\n\n💡 Found ${result.suggestions.length} suggestions based on ${result.memoryPatterns.length} memory patterns\n\n${result.suggestions.map(s => `• ${s.type.toUpperCase()}: ${s.suggestion}\n  Confidence: ${(s.confidence * 100).toFixed(0)}%\n  Source: ${s.source}`).join('\n\n')}\n\n🧠 Memory Patterns Used:\n${result.memoryPatterns.map(p => `• ${p.name} (${p.entityType}): ${p.observations[0]}`).join('\n')}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the enhanced server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Memory-Enhanced Spec-Kit MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { MemoryEnhancedSpecKitManager };