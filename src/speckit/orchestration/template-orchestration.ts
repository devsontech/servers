// Advanced template orchestration system for multi-template workflows
import { promises as fs } from 'fs';
import path from 'path';
import { SmartVariable } from '../intelligence/variable-discovery.js';

export interface TemplateWorkflow {
  id: string;
  name: string;
  description: string;
  templates: TemplateStep[];
  executionStrategy: 'sequential' | 'parallel' | 'dependent' | 'conditional';
  globalVariables: Record<string, string>;
  memoryEnabled: boolean;
  validationConfig: {
    validateEachStep: boolean;
    stopOnError: boolean;
    autoFix: boolean;
  };
  metadata: {
    created: string;
    lastExecuted?: string;
    successRate: number;
    totalExecutions: number;
  };
}

export interface TemplateStep {
  id: string;
  templateName: string;
  templateType: 'spec' | 'plan' | 'tasks' | 'custom';
  variables: Record<string, string>;
  dependsOn: string[]; // IDs of steps this depends on
  condition?: {
    variable: string;
    operator: '==' | '!=' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
    value: string;
  };
  outputMapping?: {
    [outputVar: string]: string; // Map output variables to global variables
  };
  validation?: {
    required: boolean;
    skipOnPreviousSuccess: boolean;
  };
}

export interface OrchestrationResult {
  workflowId: string;
  success: boolean;
  executionTime: number;
  steps: StepResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  outputs: Record<string, any>;
  errors: string[];
  warnings: string[];
}

export interface StepResult {
  stepId: string;
  templateName: string;
  success: boolean;
  executionTime: number;
  outputPath?: string;
  variables: Record<string, string>;
  errors: string[];
  warnings: string[];
  validationResult?: any;
  memoryPatterns?: any[];
  skipped: boolean;
  skipReason?: string;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  category: 'project-setup' | 'feature-development' | 'refactoring' | 'documentation' | 'testing' | 'deployment';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: number; // in minutes
  workflow: Omit<TemplateWorkflow, 'id' | 'metadata'>;
  requiredVariables: string[];
  optionalVariables: string[];
  contexts: string[];
}

export class TemplateOrchestrationEngine {
  private workflows: Map<string, TemplateWorkflow> = new Map();
  private workflowTemplates: Map<string, WorkflowTemplate> = new Map();
  private memoryQueryFunction?: (query: any) => Promise<any>;
  private validationEngine?: any;
  private variableDiscovery?: any;

  constructor(options?: {
    memoryQueryFunction?: (query: any) => Promise<any>;
    validationEngine?: any;
    variableDiscovery?: any;
  }) {
    this.memoryQueryFunction = options?.memoryQueryFunction;
    this.validationEngine = options?.validationEngine;
    this.variableDiscovery = options?.variableDiscovery;
    
    this.initializeBuiltinWorkflowTemplates();
  }

  // Initialize built-in workflow templates
  private initializeBuiltinWorkflowTemplates(): void {
    // Full project setup workflow
    this.workflowTemplates.set('full-project-setup', {
      name: 'Full Project Setup',
      description: 'Complete project initialization with specifications, plans, and tasks',
      category: 'project-setup',
      complexity: 'complex',
      estimatedTime: 15,
      workflow: {
        name: 'Full Project Setup Workflow',
        description: 'Creates complete project structure with memory-enhanced templates',
        templates: [
          {
            id: 'project-spec',
            templateName: 'project-specification',
            templateType: 'spec',
            variables: {},
            dependsOn: [],
            outputMapping: {
              'PROJECT_SCOPE': 'GLOBAL_PROJECT_SCOPE',
              'STAKEHOLDERS': 'GLOBAL_STAKEHOLDERS'
            }
          },
          {
            id: 'architecture-plan',
            templateName: 'architecture-plan',
            templateType: 'plan',
            variables: {},
            dependsOn: ['project-spec'],
            outputMapping: {
              'ARCHITECTURE_DECISION': 'GLOBAL_ARCHITECTURE',
              'TECH_STACK': 'GLOBAL_TECH_STACK'
            }
          },
          {
            id: 'development-tasks',
            templateName: 'development-tasks',
            templateType: 'tasks',
            variables: {},
            dependsOn: ['architecture-plan']
          },
          {
            id: 'testing-plan',
            templateName: 'testing-plan',
            templateType: 'plan',
            variables: {},
            dependsOn: ['architecture-plan'],
            condition: {
              variable: 'TESTING_REQUIRED',
              operator: '==',
              value: 'true'
            }
          }
        ],
        executionStrategy: 'dependent',
        globalVariables: {},
        memoryEnabled: true,
        validationConfig: {
          validateEachStep: true,
          stopOnError: false,
          autoFix: true
        }
      },
      requiredVariables: ['PROJECT_NAME', 'PROJECT_DESCRIPTION'],
      optionalVariables: ['TESTING_REQUIRED', 'COMPLEXITY_LEVEL'],
      contexts: ['project-setup', 'architecture', 'planning']
    });

    // Feature development workflow
    this.workflowTemplates.set('feature-development', {
      name: 'Feature Development Workflow',
      description: 'Complete feature development cycle from specification to implementation',
      category: 'feature-development',
      complexity: 'moderate',
      estimatedTime: 10,
      workflow: {
        name: 'Feature Development Workflow',
        description: 'Creates feature spec, implementation plan, and detailed tasks',
        templates: [
          {
            id: 'feature-spec',
            templateName: 'feature-specification',
            templateType: 'spec',
            variables: {},
            dependsOn: []
          },
          {
            id: 'implementation-plan',
            templateName: 'implementation-plan',
            templateType: 'plan',
            variables: {},
            dependsOn: ['feature-spec']
          },
          {
            id: 'implementation-tasks',
            templateName: 'implementation-tasks',
            templateType: 'tasks',
            variables: {},
            dependsOn: ['implementation-plan']
          }
        ],
        executionStrategy: 'sequential',
        globalVariables: {},
        memoryEnabled: true,
        validationConfig: {
          validateEachStep: true,
          stopOnError: true,
          autoFix: true
        }
      },
      requiredVariables: ['FEATURE_NAME', 'FEATURE_DESCRIPTION'],
      optionalVariables: ['PRIORITY', 'COMPLEXITY', 'DEADLINE'],
      contexts: ['feature-development', 'implementation']
    });

    // Angular component workflow
    this.workflowTemplates.set('angular-component-workflow', {
      name: 'Angular Component Workflow',
      description: 'Complete Angular component development with Carbon Design System integration',
      category: 'feature-development',
      complexity: 'moderate',
      estimatedTime: 8,
      workflow: {
        name: 'Angular Component Workflow',
        description: 'Creates component spec, design integration plan, and implementation tasks',
        templates: [
          {
            id: 'component-spec',
            templateName: 'angular-component-spec',
            templateType: 'spec',
            variables: {},
            dependsOn: []
          },
          {
            id: 'design-integration',
            templateName: 'carbon-design-integration',
            templateType: 'plan',
            variables: {},
            dependsOn: ['component-spec']
          },
          {
            id: 'component-tasks',
            templateName: 'angular-component-tasks',
            templateType: 'tasks',
            variables: {},
            dependsOn: ['design-integration']
          }
        ],
        executionStrategy: 'sequential',
        globalVariables: {
          'FRAMEWORK': 'Angular',
          'DESIGN_SYSTEM': 'Carbon'
        },
        memoryEnabled: true,
        validationConfig: {
          validateEachStep: true,
          stopOnError: false,
          autoFix: true
        }
      },
      requiredVariables: ['COMPONENT_NAME', 'COMPONENT_PURPOSE'],
      optionalVariables: ['COMPONENT_TYPE', 'STYLING_APPROACH'],
      contexts: ['angular', 'carbon-design-system', 'components']
    });
  }

  // Create a new workflow from template
  async createWorkflowFromTemplate(
    templateName: string, 
    variables: Record<string, string>,
    customizations?: {
      name?: string;
      description?: string;
      additionalSteps?: TemplateStep[];
      executionStrategy?: TemplateWorkflow['executionStrategy'];
    }
  ): Promise<TemplateWorkflow> {
    const template = this.workflowTemplates.get(templateName);
    if (!template) {
      throw new Error(`Workflow template '${templateName}' not found`);
    }

    // Validate required variables
    const missingVars = template.requiredVariables.filter(varName => !variables[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    const workflowId = `${templateName}-${Date.now()}`;
    const now = new Date().toISOString();

    const workflow: TemplateWorkflow = {
      id: workflowId,
      name: customizations?.name || `${template.name} - ${now}`,
      description: customizations?.description || template.description,
      templates: [
        ...template.workflow.templates,
        ...(customizations?.additionalSteps || [])
      ],
      executionStrategy: customizations?.executionStrategy || template.workflow.executionStrategy,
      globalVariables: {
        ...template.workflow.globalVariables,
        ...variables
      },
      memoryEnabled: template.workflow.memoryEnabled,
      validationConfig: template.workflow.validationConfig,
      metadata: {
        created: now,
        successRate: 0,
        totalExecutions: 0
      }
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  // Execute a workflow
  async executeWorkflow(
    workflowId: string,
    context?: {
      projectPath?: string;
      outputDirectory?: string;
      dryRun?: boolean;
    }
  ): Promise<OrchestrationResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow '${workflowId}' not found`);
    }

    const startTime = Date.now();
    const result: OrchestrationResult = {
      workflowId,
      success: true,
      executionTime: 0,
      steps: [],
      summary: {
        total: workflow.templates.length,
        successful: 0,
        failed: 0,
        skipped: 0
      },
      outputs: {},
      errors: [],
      warnings: []
    };

    try {
      // Update workflow metadata
      workflow.metadata.totalExecutions++;
      workflow.metadata.lastExecuted = new Date().toISOString();

      // Memory-enhanced variable discovery
      if (workflow.memoryEnabled && this.memoryQueryFunction) {
        await this.enhanceVariablesWithMemory(workflow, context);
      }

      // Execute based on strategy
      switch (workflow.executionStrategy) {
        case 'sequential':
          await this.executeSequential(workflow, result, context);
          break;
        case 'parallel':
          await this.executeParallel(workflow, result, context);
          break;
        case 'dependent':
          await this.executeDependent(workflow, result, context);
          break;
        case 'conditional':
          await this.executeConditional(workflow, result, context);
          break;
      }

      // Update success rate
      workflow.metadata.successRate = 
        (workflow.metadata.successRate * (workflow.metadata.totalExecutions - 1) + 
         (result.success ? 1 : 0)) / workflow.metadata.totalExecutions;

    } catch (error) {
      result.success = false;
      result.errors.push(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  // Memory-enhanced variable discovery
  private async enhanceVariablesWithMemory(
    workflow: TemplateWorkflow, 
    context?: any
  ): Promise<void> {
    if (!this.memoryQueryFunction) return;

    try {
      // Query memory for patterns related to this workflow
      const memoryResults = await this.memoryQueryFunction({
        query: `workflow ${workflow.name} template variables`,
        boost_recent: true,
        prefer_contexts: ['template', 'workflow', 'variables']
      });

      // Extract variable suggestions from memory
      if (memoryResults.entities) {
        memoryResults.entities.forEach((entity: any) => {
          if (entity.metadata?.variables) {
            Object.entries(entity.metadata.variables).forEach(([key, value]) => {
              if (!workflow.globalVariables[key]) {
                workflow.globalVariables[key] = String(value);
              }
            });
          }
        });
      }

      // Use variable discovery if available
      if (this.variableDiscovery && context?.projectPath) {
        const discoveredVars = await this.variableDiscovery.analyzeWorkspace(
          context.projectPath,
          { scanDepth: 'deep', memoryPatterns: memoryResults.entities }
        );

        // Merge discovered variables
        Object.entries(discoveredVars.variables).forEach(([key, smartVar]: [string, any]) => {
          if (!workflow.globalVariables[key] && smartVar.confidence > 0.7) {
            workflow.globalVariables[key] = smartVar.value;
          }
        });
      }

    } catch (error) {
      console.warn('Memory enhancement failed:', error);
    }
  }

  // Sequential execution strategy
  private async executeSequential(
    workflow: TemplateWorkflow,
    result: OrchestrationResult,
    context?: any
  ): Promise<void> {
    for (const template of workflow.templates) {
      const stepResult = await this.executeStep(workflow, template, result, context);
      result.steps.push(stepResult);

      if (stepResult.success) {
        result.summary.successful++;
        // Merge output variables into global variables
        this.mergeOutputVariables(workflow, template, stepResult);
      } else {
        result.summary.failed++;
        if (workflow.validationConfig.stopOnError) {
          result.success = false;
          result.errors.push(`Workflow stopped due to step failure: ${template.templateName}`);
          break;
        }
      }

      if (stepResult.skipped) {
        result.summary.skipped++;
      }
    }
  }

  // Parallel execution strategy
  private async executeParallel(
    workflow: TemplateWorkflow,
    result: OrchestrationResult,
    context?: any
  ): Promise<void> {
    const promises = workflow.templates.map(template => 
      this.executeStep(workflow, template, result, context)
    );

    const stepResults = await Promise.allSettled(promises);
    
    stepResults.forEach((settledResult, index) => {
      if (settledResult.status === 'fulfilled') {
        const stepResult = settledResult.value;
        result.steps.push(stepResult);

        if (stepResult.success) {
          result.summary.successful++;
          this.mergeOutputVariables(workflow, workflow.templates[index], stepResult);
        } else {
          result.summary.failed++;
        }

        if (stepResult.skipped) {
          result.summary.skipped++;
        }
      } else {
        result.summary.failed++;
        result.errors.push(`Step failed: ${settledResult.reason}`);
      }
    });
  }

  // Dependent execution strategy
  private async executeDependent(
    workflow: TemplateWorkflow,
    result: OrchestrationResult,
    context?: any
  ): Promise<void> {
    const executed: Set<string> = new Set();
    const remaining = new Map(workflow.templates.map(t => [t.id, t]));

    while (remaining.size > 0) {
      let progressMade = false;

      for (const [templateId, template] of remaining.entries()) {
        // Check if all dependencies are satisfied
        const canExecute = template.dependsOn.every(depId => executed.has(depId));
        
        if (canExecute) {
          const stepResult = await this.executeStep(workflow, template, result, context);
          result.steps.push(stepResult);

          if (stepResult.success) {
            result.summary.successful++;
            executed.add(templateId);
            remaining.delete(templateId);
            this.mergeOutputVariables(workflow, template, stepResult);
            progressMade = true;
          } else {
            result.summary.failed++;
            if (workflow.validationConfig.stopOnError) {
              result.success = false;
              result.errors.push(`Dependency chain broken at step: ${template.templateName}`);
              return;
            }
            remaining.delete(templateId);
            progressMade = true;
          }

          if (stepResult.skipped) {
            result.summary.skipped++;
            executed.add(templateId);
            remaining.delete(templateId);
            progressMade = true;
          }
        }
      }

      if (!progressMade) {
        result.success = false;
        result.errors.push('Circular dependency or unsatisfied dependencies detected');
        break;
      }
    }
  }

  // Conditional execution strategy
  private async executeConditional(
    workflow: TemplateWorkflow,
    result: OrchestrationResult,
    context?: any
  ): Promise<void> {
    for (const template of workflow.templates) {
      // Check condition if present
      if (template.condition && !this.evaluateCondition(template.condition, workflow.globalVariables)) {
        const stepResult: StepResult = {
          stepId: template.id,
          templateName: template.templateName,
          success: true,
          executionTime: 0,
          variables: template.variables,
          errors: [],
          warnings: [],
          skipped: true,
          skipReason: 'Condition not met'
        };
        
        result.steps.push(stepResult);
        result.summary.skipped++;
        continue;
      }

      const stepResult = await this.executeStep(workflow, template, result, context);
      result.steps.push(stepResult);

      if (stepResult.success) {
        result.summary.successful++;
        this.mergeOutputVariables(workflow, template, stepResult);
      } else {
        result.summary.failed++;
      }

      if (stepResult.skipped) {
        result.summary.skipped++;
      }
    }
  }

  // Execute a single template step
  private async executeStep(
    workflow: TemplateWorkflow,
    template: TemplateStep,
    orchestrationResult: OrchestrationResult,
    context?: any
  ): Promise<StepResult> {
    const startTime = Date.now();
    const stepResult: StepResult = {
      stepId: template.id,
      templateName: template.templateName,
      success: false,
      executionTime: 0,
      variables: { ...workflow.globalVariables, ...template.variables },
      errors: [],
      warnings: [],
      skipped: false
    };

    try {
      // Validation before execution
      if (workflow.validationConfig.validateEachStep && this.validationEngine) {
        const validationResult = await this.validationEngine.validate(
          '', // Template content would be loaded here
          stepResult.variables,
          {
            enableSyntaxValidation: true,
            enableSemanticValidation: true,
            enablePatternValidation: workflow.memoryEnabled,
            enableDependencyValidation: true,
            enableBuildSimulation: false,
            memoryIntegration: workflow.memoryEnabled,
            autoFix: workflow.validationConfig.autoFix
          }
        );

        stepResult.validationResult = validationResult;
        
        if (!validationResult.passed && workflow.validationConfig.stopOnError) {
          stepResult.errors.push('Pre-execution validation failed');
          stepResult.executionTime = Date.now() - startTime;
          return stepResult;
        }

        stepResult.warnings.push(...validationResult.warnings.map((w: any) => w.message));
      }

      // Simulate template execution (in real implementation, this would generate actual files)
      const outputPath = context?.outputDirectory 
        ? path.join(context.outputDirectory, `${template.templateName}-${Date.now()}.md`)
        : `/generated/${template.templateName}-${Date.now()}.md`;

      stepResult.outputPath = outputPath;
      stepResult.success = true;

      // Extract memory patterns if memory is enabled
      if (workflow.memoryEnabled && this.memoryQueryFunction) {
        try {
          const memoryResults = await this.memoryQueryFunction({
            query: `template ${template.templateName} patterns`,
            boost_recent: true
          });
          stepResult.memoryPatterns = memoryResults.entities || [];
        } catch (error) {
          stepResult.warnings.push('Memory pattern extraction failed');
        }
      }

    } catch (error) {
      stepResult.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    stepResult.executionTime = Date.now() - startTime;
    return stepResult;
  }

  // Evaluate condition
  private evaluateCondition(condition: TemplateStep['condition'], variables: Record<string, string>): boolean {
    if (!condition) return true;

    const value = variables[condition.variable];

    switch (condition.operator) {
      case '==':
        return value === condition.value;
      case '!=':
        return value !== condition.value;
      case 'contains':
        return value?.includes(condition.value) || false;
      case 'not_contains':
        return !value?.includes(condition.value);
      case 'exists':
        return value !== undefined && value !== '';
      case 'not_exists':
        return value === undefined || value === '';
      default:
        return false;
    }
  }

  // Merge output variables
  private mergeOutputVariables(
    workflow: TemplateWorkflow,
    template: TemplateStep,
    stepResult: StepResult
  ): void {
    if (template.outputMapping) {
      Object.entries(template.outputMapping).forEach(([outputVar, globalVar]) => {
        if (stepResult.variables[outputVar]) {
          workflow.globalVariables[globalVar] = stepResult.variables[outputVar];
        }
      });
    }
  }

  // Workflow management methods
  getWorkflow(workflowId: string): TemplateWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  listWorkflows(): TemplateWorkflow[] {
    return Array.from(this.workflows.values());
  }

  deleteWorkflow(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  // Workflow template management
  getWorkflowTemplate(templateName: string): WorkflowTemplate | undefined {
    return this.workflowTemplates.get(templateName);
  }

  listWorkflowTemplates(filter?: {
    category?: string;
    complexity?: string;
    contexts?: string[];
  }): WorkflowTemplate[] {
    let templates = Array.from(this.workflowTemplates.values());

    if (filter) {
      if (filter.category) {
        templates = templates.filter(t => t.category === filter.category);
      }
      if (filter.complexity) {
        templates = templates.filter(t => t.complexity === filter.complexity);
      }
      if (filter.contexts) {
        templates = templates.filter(t => 
          filter.contexts!.some(context => t.contexts.includes(context))
        );
      }
    }

    return templates;
  }

  // Analytics
  getWorkflowAnalytics(): {
    totalWorkflows: number;
    totalExecutions: number;
    averageSuccessRate: number;
    mostUsedTemplates: Array<{ name: string; usage: number }>;
    averageExecutionTime: number;
  } {
    const workflows = Array.from(this.workflows.values());
    const totalWorkflows = workflows.length;
    const totalExecutions = workflows.reduce((sum, w) => sum + w.metadata.totalExecutions, 0);
    const averageSuccessRate = workflows.length > 0 
      ? workflows.reduce((sum, w) => sum + w.metadata.successRate, 0) / workflows.length 
      : 0;

    // Count template usage
    const templateUsage = new Map<string, number>();
    workflows.forEach(workflow => {
      workflow.templates.forEach(template => {
        const current = templateUsage.get(template.templateName) || 0;
        templateUsage.set(template.templateName, current + workflow.metadata.totalExecutions);
      });
    });

    const mostUsedTemplates = Array.from(templateUsage.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, usage]) => ({ name, usage }));

    return {
      totalWorkflows,
      totalExecutions,
      averageSuccessRate,
      mostUsedTemplates,
      averageExecutionTime: 0 // Would be calculated from execution history
    };
  }

  // Save/Load workflows
  async saveWorkflows(filePath: string): Promise<void> {
    const data = {
      workflows: Array.from(this.workflows.entries()),
      timestamp: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async loadWorkflows(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (data.workflows) {
        this.workflows.clear();
        data.workflows.forEach(([id, workflow]: [string, TemplateWorkflow]) => {
          this.workflows.set(id, workflow);
        });
      }
    } catch (error) {
      throw new Error(`Failed to load workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default TemplateOrchestrationEngine;