// Analytics and learning system for SpecKit optimization
import { promises as fs } from 'fs';
import path from 'path';
import { SmartVariable } from '../intelligence/variable-discovery.js';

export interface UsageMetrics {
  templateUsage: Map<string, TemplateMetrics>;
  workflowUsage: Map<string, WorkflowMetrics>;
  variableUsage: Map<string, VariableMetrics>;
  errorMetrics: ErrorMetrics;
  performanceMetrics: PerformanceMetrics;
  userBehavior: UserBehaviorMetrics;
  memoryInsights: MemoryInsights;
}

export interface TemplateMetrics {
  templateName: string;
  totalUsage: number;
  successRate: number;
  averageGenerationTime: number;
  popularVariables: Map<string, number>;
  commonErrors: string[];
  userSatisfactionScore: number;
  lastUsed: string;
  peakUsageHours: number[];
  contextUsage: Map<string, number>;
  validationIssues: number;
  memoryHits: number;
}

export interface WorkflowMetrics {
  workflowId: string;
  workflowName: string;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  stepsAnalytics: Map<string, StepAnalytics>;
  bottleneckSteps: string[];
  userAbandonmentRate: number;
  popularCombinations: string[];
  contextEffectiveness: Map<string, number>;
}

export interface StepAnalytics {
  stepName: string;
  successRate: number;
  averageTime: number;
  commonErrors: string[];
  skipRate: number;
  retryRate: number;
  memoryContribution: number;
}

export interface VariableMetrics {
  variableName: string;
  usageFrequency: number;
  discoveryAccuracy: number;
  userOverrideRate: number;
  memorySourced: boolean;
  contextRelevance: Map<string, number>;
  validationFailureRate: number;
  defaultValueEffectiveness: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Map<string, number>;
  errorsBySeverity: Map<string, number>;
  resolutionRates: Map<string, number>;
  timeToResolution: Map<string, number>;
  preventionEffectiveness: number;
  learningProgress: number;
  userSatisfactionAfterRecovery: number;
}

export interface PerformanceMetrics {
  memoryQueryTime: number[];
  templateGenerationTime: number[];
  validationTime: number[];
  workflowExecutionTime: number[];
  systemResourceUsage: {
    cpuUsage: number[];
    memoryUsage: number[];
    diskIo: number[];
  };
  throughputMetrics: {
    templatesPerMinute: number;
    workflowsPerHour: number;
    variablesDiscoveredPerSecond: number;
  };
}

export interface UserBehaviorMetrics {
  preferredTemplates: string[];
  workflowPatterns: string[];
  timeOfDayUsage: Map<number, number>;
  sessionDuration: number[];
  featureAdoption: Map<string, number>;
  customizationFrequency: number;
  helpSeeking: Map<string, number>;
  productivityGains: {
    timesSaved: number[];
    errorsAvoided: number;
    consistencyImprovement: number;
  };
}

export interface MemoryInsights {
  hitRate: number;
  missRate: number;
  patternAccuracy: number;
  relevanceScores: number[];
  contributionToSuccess: number;
  knowledgeGrowthRate: number;
  contextualRelevance: Map<string, number>;
  userTrustScore: number;
}

export interface LearningInsight {
  id: string;
  type: 'template_optimization' | 'workflow_improvement' | 'variable_prediction' | 'error_prevention' | 'user_experience';
  priority: 'low' | 'medium' | 'high' | 'critical';
  insight: string;
  evidence: any[];
  confidence: number;
  actionable: boolean;
  suggestedAction: string;
  potentialImpact: {
    efficiency: number;
    userSatisfaction: number;
    errorReduction: number;
    timesSavings: number;
  };
  timestamp: string;
}

export interface OptimizationRecommendation {
  id: string;
  category: 'template' | 'workflow' | 'variable' | 'performance' | 'user_experience';
  title: string;
  description: string;
  currentState: any;
  proposedChange: any;
  benefits: string[];
  risks: string[];
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  implementation: {
    steps: string[];
    estimatedTime: number;
    requiredResources: string[];
  };
}

export class AnalyticsLearningSystem {
  private metrics!: UsageMetrics; // Will be initialized in initializeMetrics()
  private learningInsights: Map<string, LearningInsight> = new Map();
  private optimizationRecommendations: Map<string, OptimizationRecommendation> = new Map();
  private dataCollectionEnabled: boolean = true;
  private privacyMode: boolean = false;
  private memoryQueryFunction?: (query: any) => Promise<any>;
  private persistencePath: string;

  constructor(options?: {
    memoryQueryFunction?: (query: any) => Promise<any>;
    persistencePath?: string;
    privacyMode?: boolean;
  }) {
    this.memoryQueryFunction = options?.memoryQueryFunction;
    this.persistencePath = options?.persistencePath || path.join(process.cwd(), '.speckit-analytics');
    this.privacyMode = options?.privacyMode || false;
    
    this.initializeMetrics();
    this.startPeriodicAnalysis();
  }

  // Initialize metrics structure
  private initializeMetrics(): void {
    this.metrics = {
      templateUsage: new Map(),
      workflowUsage: new Map(),
      variableUsage: new Map(),
      errorMetrics: {
        totalErrors: 0,
        errorsByType: new Map(),
        errorsBySeverity: new Map(),
        resolutionRates: new Map(),
        timeToResolution: new Map(),
        preventionEffectiveness: 0,
        learningProgress: 0,
        userSatisfactionAfterRecovery: 0
      },
      performanceMetrics: {
        memoryQueryTime: [],
        templateGenerationTime: [],
        validationTime: [],
        workflowExecutionTime: [],
        systemResourceUsage: {
          cpuUsage: [],
          memoryUsage: [],
          diskIo: []
        },
        throughputMetrics: {
          templatesPerMinute: 0,
          workflowsPerHour: 0,
          variablesDiscoveredPerSecond: 0
        }
      },
      userBehavior: {
        preferredTemplates: [],
        workflowPatterns: [],
        timeOfDayUsage: new Map(),
        sessionDuration: [],
        featureAdoption: new Map(),
        customizationFrequency: 0,
        helpSeeking: new Map(),
        productivityGains: {
          timesSaved: [],
          errorsAvoided: 0,
          consistencyImprovement: 0
        }
      },
      memoryInsights: {
        hitRate: 0,
        missRate: 0,
        patternAccuracy: 0,
        relevanceScores: [],
        contributionToSuccess: 0,
        knowledgeGrowthRate: 0,
        contextualRelevance: new Map(),
        userTrustScore: 0
      }
    };
  }

  // Record template usage
  recordTemplateUsage(
    templateName: string,
    context: {
      variables: Record<string, any>;
      generationTime: number;
      success: boolean;
      validationIssues: number;
      memoryHits: number;
      userContext?: string;
      errors?: string[];
    }
  ): void {
    if (!this.dataCollectionEnabled) return;

    let templateMetrics = this.metrics.templateUsage.get(templateName);
    if (!templateMetrics) {
      templateMetrics = {
        templateName,
        totalUsage: 0,
        successRate: 0,
        averageGenerationTime: 0,
        popularVariables: new Map(),
        commonErrors: [],
        userSatisfactionScore: 0,
        lastUsed: '',
        peakUsageHours: [],
        contextUsage: new Map(),
        validationIssues: 0,
        memoryHits: 0
      };
      this.metrics.templateUsage.set(templateName, templateMetrics);
    }

    // Update metrics
    templateMetrics.totalUsage++;
    templateMetrics.successRate = this.updateRate(templateMetrics.successRate, templateMetrics.totalUsage, context.success ? 1 : 0);
    templateMetrics.averageGenerationTime = this.updateAverage(templateMetrics.averageGenerationTime, templateMetrics.totalUsage, context.generationTime);
    templateMetrics.validationIssues += context.validationIssues;
    templateMetrics.memoryHits += context.memoryHits;
    templateMetrics.lastUsed = new Date().toISOString();

    // Record variable usage
    Object.keys(context.variables).forEach(varName => {
      const currentCount = templateMetrics!.popularVariables.get(varName) || 0;
      templateMetrics!.popularVariables.set(varName, currentCount + 1);
      this.recordVariableUsage(varName, templateName, context.variables[varName]);
    });

    // Record context usage
    if (context.userContext) {
      const currentCount = templateMetrics.contextUsage.get(context.userContext) || 0;
      templateMetrics.contextUsage.set(context.userContext, currentCount + 1);
    }

    // Record errors
    if (context.errors) {
      templateMetrics.commonErrors.push(...context.errors);
      // Keep only recent errors (last 50)
      if (templateMetrics.commonErrors.length > 50) {
        templateMetrics.commonErrors = templateMetrics.commonErrors.slice(-50);
      }
    }

    // Record peak usage hours
    const currentHour = new Date().getHours();
    if (!templateMetrics.peakUsageHours.includes(currentHour)) {
      templateMetrics.peakUsageHours.push(currentHour);
    }
  }

  // Record workflow usage
  recordWorkflowUsage(
    workflowId: string,
    workflowName: string,
    context: {
      executionTime: number;
      success: boolean;
      steps: Array<{
        name: string;
        success: boolean;
        time: number;
        errors: string[];
        skipped: boolean;
        retried: boolean;
        memoryContribution: number;
      }>;
      userAbandoned: boolean;
      contextEffectiveness?: number;
    }
  ): void {
    if (!this.dataCollectionEnabled) return;

    let workflowMetrics = this.metrics.workflowUsage.get(workflowId);
    if (!workflowMetrics) {
      workflowMetrics = {
        workflowId,
        workflowName,
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        stepsAnalytics: new Map(),
        bottleneckSteps: [],
        userAbandonmentRate: 0,
        popularCombinations: [],
        contextEffectiveness: new Map()
      };
      this.metrics.workflowUsage.set(workflowId, workflowMetrics);
    }

    // Update workflow metrics
    workflowMetrics.totalExecutions++;
    workflowMetrics.successRate = this.updateRate(workflowMetrics.successRate, workflowMetrics.totalExecutions, context.success ? 1 : 0);
    workflowMetrics.averageExecutionTime = this.updateAverage(workflowMetrics.averageExecutionTime, workflowMetrics.totalExecutions, context.executionTime);
    workflowMetrics.userAbandonmentRate = this.updateRate(workflowMetrics.userAbandonmentRate, workflowMetrics.totalExecutions, context.userAbandoned ? 1 : 0);

    // Update step analytics
    context.steps.forEach(step => {
      let stepAnalytics = workflowMetrics!.stepsAnalytics.get(step.name);
      if (!stepAnalytics) {
        stepAnalytics = {
          stepName: step.name,
          successRate: 0,
          averageTime: 0,
          commonErrors: [],
          skipRate: 0,
          retryRate: 0,
          memoryContribution: 0
        };
        workflowMetrics!.stepsAnalytics.set(step.name, stepAnalytics);
      }

      stepAnalytics.successRate = this.updateRate(stepAnalytics.successRate, workflowMetrics!.totalExecutions, step.success ? 1 : 0);
      stepAnalytics.averageTime = this.updateAverage(stepAnalytics.averageTime, workflowMetrics!.totalExecutions, step.time);
      stepAnalytics.skipRate = this.updateRate(stepAnalytics.skipRate, workflowMetrics!.totalExecutions, step.skipped ? 1 : 0);
      stepAnalytics.retryRate = this.updateRate(stepAnalytics.retryRate, workflowMetrics!.totalExecutions, step.retried ? 1 : 0);
      stepAnalytics.memoryContribution = this.updateAverage(stepAnalytics.memoryContribution, workflowMetrics!.totalExecutions, step.memoryContribution);
      stepAnalytics.commonErrors.push(...step.errors);
      
      // Keep only recent errors
      if (stepAnalytics.commonErrors.length > 20) {
        stepAnalytics.commonErrors = stepAnalytics.commonErrors.slice(-20);
      }
    });

    // Identify bottleneck steps (steps taking longer than 2x average)
    const avgTime = context.executionTime / context.steps.length;
    const bottlenecks = context.steps
      .filter(step => step.time > avgTime * 2)
      .map(step => step.name);
    
    workflowMetrics.bottleneckSteps = [...new Set([...workflowMetrics.bottleneckSteps, ...bottlenecks])];
  }

  // Record variable usage
  recordVariableUsage(
    variableName: string,
    templateName: string,
    value: any,
    context?: {
      discoveryAccuracy?: number;
      userOverridden?: boolean;
      memorySourced?: boolean;
      validationFailed?: boolean;
      userContext?: string;
    }
  ): void {
    if (!this.dataCollectionEnabled || this.privacyMode) return;

    let variableMetrics = this.metrics.variableUsage.get(variableName);
    if (!variableMetrics) {
      variableMetrics = {
        variableName,
        usageFrequency: 0,
        discoveryAccuracy: 0,
        userOverrideRate: 0,
        memorySourced: false,
        contextRelevance: new Map(),
        validationFailureRate: 0,
        defaultValueEffectiveness: 0
      };
      this.metrics.variableUsage.set(variableName, variableMetrics);
    }

    variableMetrics.usageFrequency++;
    
    if (context) {
      if (context.discoveryAccuracy !== undefined) {
        variableMetrics.discoveryAccuracy = this.updateAverage(
          variableMetrics.discoveryAccuracy, 
          variableMetrics.usageFrequency, 
          context.discoveryAccuracy
        );
      }
      
      if (context.userOverridden) {
        variableMetrics.userOverrideRate = this.updateRate(
          variableMetrics.userOverrideRate, 
          variableMetrics.usageFrequency, 
          1
        );
      }
      
      if (context.memorySourced) {
        variableMetrics.memorySourced = true;
      }
      
      if (context.validationFailed) {
        variableMetrics.validationFailureRate = this.updateRate(
          variableMetrics.validationFailureRate, 
          variableMetrics.usageFrequency, 
          1
        );
      }
      
      if (context.userContext) {
        const currentRelevance = variableMetrics.contextRelevance.get(context.userContext) || 0;
        variableMetrics.contextRelevance.set(context.userContext, currentRelevance + 1);
      }
    }
  }

  // Record performance metrics
  recordPerformanceMetric(
    type: 'memoryQuery' | 'templateGeneration' | 'validation' | 'workflowExecution',
    time: number,
    context?: any
  ): void {
    if (!this.dataCollectionEnabled) return;

    switch (type) {
      case 'memoryQuery':
        this.metrics.performanceMetrics.memoryQueryTime.push(time);
        break;
      case 'templateGeneration':
        this.metrics.performanceMetrics.templateGenerationTime.push(time);
        break;
      case 'validation':
        this.metrics.performanceMetrics.validationTime.push(time);
        break;
      case 'workflowExecution':
        this.metrics.performanceMetrics.workflowExecutionTime.push(time);
        break;
    }

    // Keep only recent measurements (last 1000)
    Object.values(this.metrics.performanceMetrics).forEach(metricArray => {
      if (Array.isArray(metricArray) && metricArray.length > 1000) {
        metricArray.splice(0, metricArray.length - 1000);
      }
    });
  }

  // Generate learning insights
  async generateLearningInsights(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Template optimization insights
    insights.push(...await this.analyzeTemplateUsagePatterns());
    
    // Workflow improvement insights
    insights.push(...await this.analyzeWorkflowEfficiency());
    
    // Variable prediction insights
    insights.push(...await this.analyzeVariablePatterns());
    
    // Error prevention insights
    insights.push(...await this.analyzeErrorPatterns());
    
    // User experience insights
    insights.push(...await this.analyzeUserBehavior());
    
    // Memory system insights
    insights.push(...await this.analyzeMemoryEffectiveness());

    // Store insights
    insights.forEach(insight => {
      this.learningInsights.set(insight.id, insight);
    });

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  // Analyze template usage patterns
  private async analyzeTemplateUsagePatterns(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    for (const [templateName, metrics] of this.metrics.templateUsage) {
      // Low success rate insight
      if (metrics.successRate < 0.8 && metrics.totalUsage > 10) {
        insights.push({
          id: `template-low-success-${templateName}`,
          type: 'template_optimization',
          priority: 'high',
          insight: `Template '${templateName}' has a low success rate (${(metrics.successRate * 100).toFixed(1)}%)`,
          evidence: [
            { successRate: metrics.successRate, totalUsage: metrics.totalUsage },
            { commonErrors: metrics.commonErrors.slice(-5) }
          ],
          confidence: 0.9,
          actionable: true,
          suggestedAction: 'Review template structure, improve variable validation, and add better error handling',
          potentialImpact: {
            efficiency: 0.3,
            userSatisfaction: 0.4,
            errorReduction: 0.5,
            timesSavings: 0.2
          },
          timestamp: new Date().toISOString()
        });
      }

      // High validation issues insight
      if (metrics.validationIssues > metrics.totalUsage * 0.5) {
        insights.push({
          id: `template-validation-issues-${templateName}`,
          type: 'template_optimization',
          priority: 'medium',
          insight: `Template '${templateName}' frequently triggers validation issues`,
          evidence: [
            { validationIssues: metrics.validationIssues, totalUsage: metrics.totalUsage }
          ],
          confidence: 0.8,
          actionable: true,
          suggestedAction: 'Improve template syntax and add pre-validation checks',
          potentialImpact: {
            efficiency: 0.2,
            userSatisfaction: 0.3,
            errorReduction: 0.4,
            timesSavings: 0.1
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  // Analyze workflow efficiency
  private async analyzeWorkflowEfficiency(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    for (const [workflowId, metrics] of this.metrics.workflowUsage) {
      // High abandonment rate
      if (metrics.userAbandonmentRate > 0.3) {
        insights.push({
          id: `workflow-abandonment-${workflowId}`,
          type: 'workflow_improvement',
          priority: 'high',
          insight: `Workflow '${metrics.workflowName}' has high user abandonment rate (${(metrics.userAbandonmentRate * 100).toFixed(1)}%)`,
          evidence: [
            { abandonmentRate: metrics.userAbandonmentRate },
            { bottleneckSteps: metrics.bottleneckSteps }
          ],
          confidence: 0.85,
          actionable: true,
          suggestedAction: 'Simplify workflow steps, reduce bottlenecks, and improve user guidance',
          potentialImpact: {
            efficiency: 0.4,
            userSatisfaction: 0.5,
            errorReduction: 0.2,
            timesSavings: 0.3
          },
          timestamp: new Date().toISOString()
        });
      }

      // Bottleneck analysis
      if (metrics.bottleneckSteps.length > 0) {
        insights.push({
          id: `workflow-bottlenecks-${workflowId}`,
          type: 'workflow_improvement',
          priority: 'medium',
          insight: `Workflow '${metrics.workflowName}' has performance bottlenecks`,
          evidence: [
            { bottleneckSteps: metrics.bottleneckSteps },
            { averageExecutionTime: metrics.averageExecutionTime }
          ],
          confidence: 0.75,
          actionable: true,
          suggestedAction: `Optimize steps: ${metrics.bottleneckSteps.join(', ')}`,
          potentialImpact: {
            efficiency: 0.3,
            userSatisfaction: 0.2,
            errorReduction: 0.1,
            timesSavings: 0.4
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  // Analyze variable patterns
  private async analyzeVariablePatterns(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    for (const [variableName, metrics] of this.metrics.variableUsage) {
      // High override rate
      if (metrics.userOverrideRate > 0.5 && metrics.usageFrequency > 10) {
        insights.push({
          id: `variable-override-${variableName}`,
          type: 'variable_prediction',
          priority: 'medium',
          insight: `Variable '${variableName}' is frequently overridden by users (${(metrics.userOverrideRate * 100).toFixed(1)}%)`,
          evidence: [
            { overrideRate: metrics.userOverrideRate },
            { discoveryAccuracy: metrics.discoveryAccuracy }
          ],
          confidence: 0.7,
          actionable: true,
          suggestedAction: 'Improve variable discovery algorithm or update default values',
          potentialImpact: {
            efficiency: 0.2,
            userSatisfaction: 0.3,
            errorReduction: 0.1,
            timesSavings: 0.2
          },
          timestamp: new Date().toISOString()
        });
      }

      // Low discovery accuracy
      if (metrics.discoveryAccuracy < 0.6 && metrics.usageFrequency > 5) {
        insights.push({
          id: `variable-accuracy-${variableName}`,
          type: 'variable_prediction',
          priority: 'high',
          insight: `Variable '${variableName}' has low discovery accuracy (${(metrics.discoveryAccuracy * 100).toFixed(1)}%)`,
          evidence: [
            { discoveryAccuracy: metrics.discoveryAccuracy },
            { usageFrequency: metrics.usageFrequency }
          ],
          confidence: 0.8,
          actionable: true,
          suggestedAction: 'Enhance variable discovery with more context patterns and memory integration',
          potentialImpact: {
            efficiency: 0.3,
            userSatisfaction: 0.4,
            errorReduction: 0.2,
            timesSavings: 0.3
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  // Analyze error patterns
  private async analyzeErrorPatterns(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    const errorMetrics = this.metrics.errorMetrics;
    
    // High error rate
    if (errorMetrics.totalErrors > 100 && errorMetrics.preventionEffectiveness < 0.7) {
      insights.push({
        id: 'error-prevention-effectiveness',
        type: 'error_prevention',
        priority: 'critical',
        insight: `Error prevention system effectiveness is below threshold (${(errorMetrics.preventionEffectiveness * 100).toFixed(1)}%)`,
        evidence: [
          { totalErrors: errorMetrics.totalErrors },
          { preventionEffectiveness: errorMetrics.preventionEffectiveness },
          { errorsByType: Object.fromEntries(errorMetrics.errorsByType) }
        ],
        confidence: 0.9,
        actionable: true,
        suggestedAction: 'Update prevention rules and improve error pattern recognition',
        potentialImpact: {
          efficiency: 0.4,
          userSatisfaction: 0.5,
          errorReduction: 0.6,
          timesSavings: 0.3
        },
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  // Analyze user behavior
  private async analyzeUserBehavior(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    const behavior = this.metrics.userBehavior;
    
    // Feature adoption analysis
    const lowAdoptionFeatures = Array.from(behavior.featureAdoption.entries())
      .filter(([feature, adoption]) => adoption < 0.3)
      .map(([feature]) => feature);

    if (lowAdoptionFeatures.length > 0) {
      insights.push({
        id: 'feature-adoption-low',
        type: 'user_experience',
        priority: 'medium',
        insight: `Several features have low adoption rates: ${lowAdoptionFeatures.join(', ')}`,
        evidence: [
          { lowAdoptionFeatures: lowAdoptionFeatures },
          { featureAdoption: Object.fromEntries(behavior.featureAdoption) }
        ],
        confidence: 0.75,
        actionable: true,
        suggestedAction: 'Improve feature discoverability, add tutorials, and gather user feedback',
        potentialImpact: {
          efficiency: 0.2,
          userSatisfaction: 0.4,
          errorReduction: 0.1,
          timesSavings: 0.2
        },
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  // Analyze memory system effectiveness
  private async analyzeMemoryEffectiveness(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    const memoryInsights = this.metrics.memoryInsights;
    
    // Low hit rate
    if (memoryInsights.hitRate < 0.6) {
      insights.push({
        id: 'memory-hit-rate-low',
        type: 'template_optimization',
        priority: 'high',
        insight: `Memory system hit rate is low (${(memoryInsights.hitRate * 100).toFixed(1)}%)`,
        evidence: [
          { hitRate: memoryInsights.hitRate },
          { patternAccuracy: memoryInsights.patternAccuracy }
        ],
        confidence: 0.8,
        actionable: true,
        suggestedAction: 'Improve memory indexing, update query algorithms, and enhance pattern recognition',
        potentialImpact: {
          efficiency: 0.3,
          userSatisfaction: 0.2,
          errorReduction: 0.2,
          timesSavings: 0.4
        },
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  // Generate optimization recommendations
  async generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    const insights = await this.generateLearningInsights();

    // Convert high-priority insights to recommendations
    const highPriorityInsights = insights.filter(i => i.priority === 'high' || i.priority === 'critical');

    for (const insight of highPriorityInsights) {
      const recommendation: OptimizationRecommendation = {
        id: `rec-${insight.id}`,
        category: this.mapInsightTypeToCategory(insight.type),
        title: insight.insight,
        description: `Based on analytics data: ${insight.suggestedAction}`,
        currentState: insight.evidence[0],
        proposedChange: {
          action: insight.suggestedAction,
          expectedOutcome: insight.potentialImpact
        },
        benefits: this.generateBenefits(insight.potentialImpact),
        risks: ['Implementation complexity', 'Potential temporary disruption'],
        effort: this.determineEffort(insight.type),
        impact: this.determineImpact(insight.potentialImpact),
        implementation: {
          steps: this.generateImplementationSteps(insight),
          estimatedTime: this.estimateImplementationTime(insight.type),
          requiredResources: ['Developer time', 'Testing environment']
        }
      };

      recommendations.push(recommendation);
    }

    // Store recommendations
    recommendations.forEach(rec => {
      this.optimizationRecommendations.set(rec.id, rec);
    });

    return recommendations.sort((a, b) => {
      const impactWeight = { low: 1, medium: 2, high: 3 };
      const effortWeight = { low: 3, medium: 2, high: 1 };
      
      const scoreA = impactWeight[a.impact] * effortWeight[a.effort];
      const scoreB = impactWeight[b.impact] * effortWeight[b.effort];
      
      return scoreB - scoreA;
    });
  }

  // Helper methods
  private updateRate(currentRate: number, totalCount: number, newValue: number): number {
    return ((currentRate * (totalCount - 1)) + newValue) / totalCount;
  }

  private updateAverage(currentAvg: number, totalCount: number, newValue: number): number {
    return ((currentAvg * (totalCount - 1)) + newValue) / totalCount;
  }

  private mapInsightTypeToCategory(type: LearningInsight['type']): OptimizationRecommendation['category'] {
    switch (type) {
      case 'template_optimization': return 'template';
      case 'workflow_improvement': return 'workflow';
      case 'variable_prediction': return 'variable';
      case 'error_prevention': return 'performance';
      case 'user_experience': return 'user_experience';
      default: return 'performance';
    }
  }

  private generateBenefits(impact: LearningInsight['potentialImpact']): string[] {
    const benefits: string[] = [];
    
    if (impact.efficiency > 0.2) benefits.push(`${(impact.efficiency * 100).toFixed(0)}% efficiency improvement`);
    if (impact.userSatisfaction > 0.2) benefits.push(`${(impact.userSatisfaction * 100).toFixed(0)}% user satisfaction increase`);
    if (impact.errorReduction > 0.2) benefits.push(`${(impact.errorReduction * 100).toFixed(0)}% error reduction`);
    if (impact.timesSavings > 0.2) benefits.push(`${(impact.timesSavings * 100).toFixed(0)}% time savings`);
    
    return benefits;
  }

  private determineEffort(type: LearningInsight['type']): OptimizationRecommendation['effort'] {
    switch (type) {
      case 'template_optimization': return 'medium';
      case 'workflow_improvement': return 'high';
      case 'variable_prediction': return 'medium';
      case 'error_prevention': return 'high';
      case 'user_experience': return 'low';
      default: return 'medium';
    }
  }

  private determineImpact(potentialImpact: LearningInsight['potentialImpact']): OptimizationRecommendation['impact'] {
    const totalImpact = potentialImpact.efficiency + potentialImpact.userSatisfaction + 
                       potentialImpact.errorReduction + potentialImpact.timesSavings;
    
    if (totalImpact > 1.0) return 'high';
    if (totalImpact > 0.6) return 'medium';
    return 'low';
  }

  private generateImplementationSteps(insight: LearningInsight): string[] {
    const baseSteps = [
      'Analyze current implementation',
      'Design improvement strategy',
      'Implement changes',
      'Test thoroughly',
      'Deploy and monitor'
    ];

    switch (insight.type) {
      case 'template_optimization':
        return [
          'Review template structure and variables',
          'Identify common failure patterns',
          'Improve template syntax and validation',
          'Test with historical data',
          'Deploy updated template'
        ];
      case 'workflow_improvement':
        return [
          'Analyze workflow bottlenecks',
          'Redesign problematic steps',
          'Optimize execution strategy',
          'Test workflow performance',
          'Update workflow configuration'
        ];
      default:
        return baseSteps;
    }
  }

  private estimateImplementationTime(type: LearningInsight['type']): number {
    switch (type) {
      case 'template_optimization': return 4; // hours
      case 'workflow_improvement': return 8;
      case 'variable_prediction': return 6;
      case 'error_prevention': return 12;
      case 'user_experience': return 2;
      default: return 4;
    }
  }

  // Start periodic analysis
  private startPeriodicAnalysis(): void {
    // Run analysis every hour
    setInterval(async () => {
      try {
        await this.generateLearningInsights();
        await this.persistMetrics();
      } catch (error) {
        console.warn('Periodic analysis failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  // Persistence methods
  async persistMetrics(): Promise<void> {
    if (!this.dataCollectionEnabled) return;

    try {
      const data = {
        metrics: this.serializeMetrics(),
        insights: Array.from(this.learningInsights.values()),
        recommendations: Array.from(this.optimizationRecommendations.values()),
        timestamp: new Date().toISOString()
      };

      await fs.mkdir(this.persistencePath, { recursive: true });
      await fs.writeFile(
        path.join(this.persistencePath, 'analytics.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.warn('Failed to persist metrics:', error);
    }
  }

  private serializeMetrics(): any {
    return {
      templateUsage: Object.fromEntries(this.metrics.templateUsage),
      workflowUsage: Object.fromEntries(this.metrics.workflowUsage),
      variableUsage: Object.fromEntries(this.metrics.variableUsage),
      errorMetrics: {
        ...this.metrics.errorMetrics,
        errorsByType: Object.fromEntries(this.metrics.errorMetrics.errorsByType),
        errorsBySeverity: Object.fromEntries(this.metrics.errorMetrics.errorsBySeverity),
        resolutionRates: Object.fromEntries(this.metrics.errorMetrics.resolutionRates),
        timeToResolution: Object.fromEntries(this.metrics.errorMetrics.timeToResolution)
      },
      performanceMetrics: this.metrics.performanceMetrics,
      userBehavior: {
        ...this.metrics.userBehavior,
        timeOfDayUsage: Object.fromEntries(this.metrics.userBehavior.timeOfDayUsage),
        featureAdoption: Object.fromEntries(this.metrics.userBehavior.featureAdoption),
        helpSeeking: Object.fromEntries(this.metrics.userBehavior.helpSeeking)
      },
      memoryInsights: {
        ...this.metrics.memoryInsights,
        contextualRelevance: Object.fromEntries(this.metrics.memoryInsights.contextualRelevance)
      }
    };
  }

  // Public API methods
  getMetrics(): UsageMetrics {
    return this.metrics;
  }

  getInsights(): LearningInsight[] {
    return Array.from(this.learningInsights.values());
  }

  getRecommendations(): OptimizationRecommendation[] {
    return Array.from(this.optimizationRecommendations.values());
  }

  setDataCollection(enabled: boolean): void {
    this.dataCollectionEnabled = enabled;
  }

  setPrivacyMode(enabled: boolean): void {
    this.privacyMode = enabled;
  }
}

export default AnalyticsLearningSystem;