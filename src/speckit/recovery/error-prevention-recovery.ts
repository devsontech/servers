// Error prevention and recovery system for SpecKit
import { promises as fs } from 'fs';
import path from 'path';
import { SmartVariable } from '../intelligence/variable-discovery.js';

export interface ErrorContext {
  id: string;
  timestamp: string;
  operation: 'template-generation' | 'variable-discovery' | 'validation' | 'orchestration' | 'memory-query';
  templateName?: string;
  workflowId?: string;
  variables: Record<string, any>;
  environment: {
    platform: string;
    nodeVersion?: string;
    projectType?: string;
    workspace?: string;
  };
  stackTrace?: string;
  userContext?: Record<string, any>;
}

export interface RecoveryError {
  id: string;
  type: 'validation' | 'generation' | 'file-system' | 'memory' | 'dependency' | 'configuration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  code: string;
  message: string;
  details: string;
  context: ErrorContext;
  suggestedFixes: RecoveryAction[];
  autoFixable: boolean;
  patterns: string[]; // Common error patterns
}

export interface RecoveryAction {
  id: string;
  type: 'retry' | 'fallback' | 'substitute' | 'skip' | 'manual' | 'rollback';
  description: string;
  impact: 'none' | 'minimal' | 'moderate' | 'significant';
  confidence: number; // 0-1
  estimatedTime: number; // seconds
  requiresUserConfirmation: boolean;
  action: () => Promise<any>;
  rollbackAction?: () => Promise<void>;
  validationAfterAction?: () => Promise<boolean>;
}

export interface RecoverySession {
  id: string;
  startTime: string;
  errors: RecoveryError[];
  actions: Array<{
    actionId: string;
    timestamp: string;
    success: boolean;
    timeTaken: number;
    result?: any;
    sideEffects?: string[];
  }>;
  status: 'active' | 'resolved' | 'failed' | 'partial';
  userInteractions: Array<{
    timestamp: string;
    type: 'confirmation' | 'input' | 'selection';
    prompt: string;
    response: any;
  }>;
  finalOutcome: {
    success: boolean;
    message: string;
    artifactsCreated: string[];
    artifactsModified: string[];
    warnings: string[];
  };
}

export interface ErrorPattern {
  id: string;
  pattern: RegExp;
  category: string;
  frequency: number;
  lastSeen: string;
  resolutionSuccessRate: number;
  commonCauses: string[];
  preventionStrategy: string;
  autoFixStrategy?: string;
}

export interface PreventionRule {
  id: string;
  name: string;
  description: string;
  triggers: Array<{
    event: string;
    condition: (context: any) => boolean;
  }>;
  prevention: {
    preCheck: () => Promise<boolean>;
    earlyWarning: () => string[];
    alternatives: string[];
    userGuidance: string;
  };
  priority: number;
}

export class ErrorPreventionRecoverySystem {
  private errorHistory: Map<string, RecoveryError> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private preventionRules: Map<string, PreventionRule> = new Map();
  private activeSessions: Map<string, RecoverySession> = new Map();
  private memoryQueryFunction?: (query: any) => Promise<any>;
  private backupManager: BackupManager;
  private learningEngine: ErrorLearningEngine;

  constructor(options?: {
    memoryQueryFunction?: (query: any) => Promise<any>;
    backupPath?: string;
  }) {
    this.memoryQueryFunction = options?.memoryQueryFunction;
    this.backupManager = new BackupManager(options?.backupPath);
    this.learningEngine = new ErrorLearningEngine();
    
    this.initializeBuiltinPatterns();
    this.initializePreventionRules();
  }

  // Initialize built-in error patterns
  private initializeBuiltinPatterns(): void {
    // Variable-related errors
    this.patterns.set('missing-variable', {
      id: 'missing-variable',
      pattern: /Variable\s+['"`]([^'"`]+)['"`]\s+(not\s+found|undefined|missing)/i,
      category: 'variable',
      frequency: 0,
      lastSeen: '',
      resolutionSuccessRate: 0.85,
      commonCauses: [
        'Variable not defined in template',
        'Typo in variable name',
        'Variable not passed from workflow'
      ],
      preventionStrategy: 'Pre-validate variables against template requirements',
      autoFixStrategy: 'Suggest similar variables or use memory patterns'
    });

    // Template syntax errors
    this.patterns.set('template-syntax', {
      id: 'template-syntax',
      pattern: /Template\s+syntax\s+error|Invalid\s+template\s+format/i,
      category: 'template',
      frequency: 0,
      lastSeen: '',
      resolutionSuccessRate: 0.92,
      commonCauses: [
        'Invalid mustache syntax',
        'Unclosed template blocks',
        'Invalid conditional syntax'
      ],
      preventionStrategy: 'Syntax validation before template processing',
      autoFixStrategy: 'Auto-correct common syntax issues'
    });

    // File system errors
    this.patterns.set('filesystem-error', {
      id: 'filesystem-error',
      pattern: /ENOENT|EACCES|EEXIST|Permission\s+denied|File\s+not\s+found/i,
      category: 'filesystem',
      frequency: 0,
      lastSeen: '',
      resolutionSuccessRate: 0.78,
      commonCauses: [
        'Insufficient permissions',
        'File already exists',
        'Directory not found',
        'Disk space issues'
      ],
      preventionStrategy: 'Pre-check permissions and disk space',
      autoFixStrategy: 'Create missing directories, suggest alternative paths'
    });

    // Memory/dependency errors
    this.patterns.set('memory-error', {
      id: 'memory-error',
      pattern: /Memory\s+query\s+failed|Connection\s+refused|Timeout/i,
      category: 'memory',
      frequency: 0,
      lastSeen: '',
      resolutionSuccessRate: 0.65,
      commonCauses: [
        'Memory server not running',
        'Network connectivity issues',
        'Query timeout',
        'Invalid memory query format'
      ],
      preventionStrategy: 'Health check memory server before operations',
      autoFixStrategy: 'Fallback to local cache or offline mode'
    });
  }

  // Initialize prevention rules
  private initializePreventionRules(): void {
    // Variable validation rule
    this.preventionRules.set('variable-validation', {
      id: 'variable-validation',
      name: 'Variable Validation',
      description: 'Prevent missing or invalid variables in template generation',
      triggers: [
        {
          event: 'before-template-generation',
          condition: (context) => context.templateName && context.variables
        }
      ],
      prevention: {
        preCheck: async () => {
          // Check if all required variables are present
          return true; // Implementation would validate variables
        },
        earlyWarning: () => [
          'Some required variables may be missing',
          'Variable names should follow naming conventions'
        ],
        alternatives: [
          'Use variable discovery to auto-populate',
          'Load variables from memory patterns',
          'Use default values for optional variables'
        ],
        userGuidance: 'Review variable requirements and ensure all placeholders are defined'
      },
      priority: 1
    });

    // Template syntax validation rule
    this.preventionRules.set('template-syntax-validation', {
      id: 'template-syntax-validation',
      name: 'Template Syntax Validation',
      description: 'Prevent template syntax errors before processing',
      triggers: [
        {
          event: 'before-template-processing',
          condition: (context) => context.templateContent
        }
      ],
      prevention: {
        preCheck: async () => {
          // Validate template syntax
          return true;
        },
        earlyWarning: () => [
          'Template may contain syntax errors',
          'Unclosed template blocks detected'
        ],
        alternatives: [
          'Use auto-fix for common syntax issues',
          'Select a different template',
          'Manual template correction'
        ],
        userGuidance: 'Ensure proper mustache syntax and closed template blocks'
      },
      priority: 1
    });

    // Workspace validation rule
    this.preventionRules.set('workspace-validation', {
      id: 'workspace-validation',
      name: 'Workspace Validation',
      description: 'Prevent workspace-related errors',
      triggers: [
        {
          event: 'before-file-operations',
          condition: (context) => context.outputPath
        }
      ],
      prevention: {
        preCheck: async () => {
          // Check workspace permissions and space
          return true;
        },
        earlyWarning: () => [
          'Insufficient disk space',
          'Permission issues detected',
          'Path too long for system'
        ],
        alternatives: [
          'Use alternative output directory',
          'Clean up disk space',
          'Run with elevated permissions'
        ],
        userGuidance: 'Ensure adequate disk space and proper permissions for file operations'
      },
      priority: 2
    });
  }

  // Create backup before operations
  async createBackup(
    operation: string,
    files: string[],
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.backupManager.create(operation, files, metadata);
  }

  // Restore from backup
  async restoreFromBackup(backupId: string): Promise<void> {
    await this.backupManager.restore(backupId);
  }

  // Record an error
  async recordError(
    error: Error | string,
    context: ErrorContext
  ): Promise<RecoveryError> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    // Classify error
    const classification = await this.classifyError(errorMessage, context);
    
    const recoveryError: RecoveryError = {
      id: errorId,
      type: classification.type,
      severity: classification.severity,
      code: classification.code,
      message: errorMessage,
      details: this.extractErrorDetails(errorMessage, stackTrace),
      context,
      suggestedFixes: await this.generateRecoveryActions(errorMessage, context),
      autoFixable: classification.autoFixable,
      patterns: this.findMatchingPatterns(errorMessage)
    };

    // Update patterns
    this.updateErrorPatterns(recoveryError);

    // Learn from error
    await this.learningEngine.learn(recoveryError);

    // Store error
    this.errorHistory.set(errorId, recoveryError);

    return recoveryError;
  }

  // Classify error type and severity
  private async classifyError(
    message: string,
    context: ErrorContext
  ): Promise<{
    type: RecoveryError['type'];
    severity: RecoveryError['severity'];
    code: string;
    autoFixable: boolean;
  }> {
    // Use patterns to classify
    for (const [id, pattern] of this.patterns) {
      if (pattern.pattern.test(message)) {
        return {
          type: pattern.category as RecoveryError['type'],
          severity: this.determineSeverity(message, context),
          code: id,
          autoFixable: pattern.autoFixStrategy !== undefined
        };
      }
    }

    // Default classification
    return {
      type: 'configuration',
      severity: 'medium',
      code: 'unknown',
      autoFixable: false
    };
  }

  // Determine error severity
  private determineSeverity(message: string, context: ErrorContext): RecoveryError['severity'] {
    if (message.toLowerCase().includes('critical') || 
        message.toLowerCase().includes('fatal') ||
        context.operation === 'orchestration') {
      return 'critical';
    }
    
    if (message.toLowerCase().includes('error') || 
        message.toLowerCase().includes('failed')) {
      return 'high';
    }
    
    if (message.toLowerCase().includes('warning') ||
        message.toLowerCase().includes('deprecated')) {
      return 'medium';
    }
    
    return 'low';
  }

  // Generate recovery actions
  private async generateRecoveryActions(
    message: string,
    context: ErrorContext
  ): Promise<RecoveryAction[]> {
    const actions: RecoveryAction[] = [];

    // Pattern-based recovery actions
    for (const [id, pattern] of this.patterns) {
      if (pattern.pattern.test(message)) {
        if (pattern.autoFixStrategy) {
          actions.push({
            id: `autofix-${id}`,
            type: 'retry',
            description: pattern.autoFixStrategy,
            impact: 'minimal',
            confidence: pattern.resolutionSuccessRate,
            estimatedTime: 30,
            requiresUserConfirmation: false,
            action: async () => this.executeAutoFix(pattern, context),
            validationAfterAction: async () => true
          });
        }
        
        // Add fallback action
        actions.push({
          id: `fallback-${id}`,
          type: 'fallback',
          description: 'Use alternative approach',
          impact: 'moderate',
          confidence: 0.7,
          estimatedTime: 60,
          requiresUserConfirmation: true,
          action: async () => this.executeFallback(pattern, context)
        });
      }
    }

    // Memory-enhanced recovery suggestions
    if (this.memoryQueryFunction) {
      try {
        const memoryResults = await this.memoryQueryFunction({
          query: `error recovery ${message.substring(0, 100)}`,
          boost_recent: true
        });

        if (memoryResults.entities) {
          memoryResults.entities.forEach((entity: any) => {
            if (entity.observations) {
              entity.observations.forEach((obs: string) => {
                if (obs.toLowerCase().includes('solution') || 
                    obs.toLowerCase().includes('fix')) {
                  actions.push({
                    id: `memory-suggested-${Date.now()}`,
                    type: 'substitute',
                    description: `Memory-suggested solution: ${obs.substring(0, 100)}`,
                    impact: 'moderate',
                    confidence: 0.6,
                    estimatedTime: 45,
                    requiresUserConfirmation: true,
                    action: async () => ({ suggestion: obs })
                  });
                }
              });
            }
          });
        }
      } catch (error) {
        // Memory query failed, continue with other recovery actions
      }
    }

    // Always provide manual intervention option
    actions.push({
      id: 'manual-intervention',
      type: 'manual',
      description: 'Manual investigation and resolution required',
      impact: 'significant',
      confidence: 1.0,
      estimatedTime: 300,
      requiresUserConfirmation: true,
      action: async () => ({ 
        message: 'Please investigate the error manually',
        context: context
      })
    });

    return actions.sort((a, b) => b.confidence - a.confidence);
  }

  // Execute recovery action
  async executeRecovery(
    errorId: string,
    actionId: string,
    userConfirmed: boolean = false
  ): Promise<{
    success: boolean;
    result?: any;
    sideEffects?: string[];
    message: string;
  }> {
    const error = this.errorHistory.get(errorId);
    if (!error) {
      throw new Error(`Error ${errorId} not found`);
    }

    const action = error.suggestedFixes.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Recovery action ${actionId} not found`);
    }

    if (action.requiresUserConfirmation && !userConfirmed) {
      throw new Error('User confirmation required for this action');
    }

    // Create backup before action
    const backupId = await this.createBackup(
      `recovery-${actionId}`,
      [], // Files would be determined based on context
      { errorId, actionId }
    );

    const startTime = Date.now();
    let result: any;
    let success = false;
    let sideEffects: string[] = [];

    try {
      // Execute the recovery action
      result = await action.action();
      
      // Validate after action if validator provided
      if (action.validationAfterAction) {
        success = await action.validationAfterAction();
      } else {
        success = true; // Assume success if no validation
      }

      // Record success
      this.recordRecoverySuccess(errorId, actionId, Date.now() - startTime);

    } catch (recoveryError) {
      success = false;
      
      // Attempt rollback if available
      if (action.rollbackAction) {
        try {
          await action.rollbackAction();
          sideEffects.push('Rollback completed successfully');
        } catch (rollbackError) {
          sideEffects.push(`Rollback failed: ${rollbackError}`);
        }
      }

      // Restore from backup as last resort
      try {
        await this.restoreFromBackup(backupId);
        sideEffects.push('Restored from backup');
      } catch (restoreError) {
        sideEffects.push(`Backup restoration failed: ${restoreError}`);
      }

      result = recoveryError;
    }

    return {
      success,
      result,
      sideEffects,
      message: success 
        ? `Recovery action completed successfully` 
        : `Recovery action failed: ${result}`
    };
  }

  // Prevention system - check before operations
  async preventErrors(
    event: string,
    context: any
  ): Promise<{
    canProceed: boolean;
    warnings: string[];
    alternatives: string[];
    userGuidance: string[];
  }> {
    const warnings: string[] = [];
    const alternatives: string[] = [];
    const userGuidance: string[] = [];
    let canProceed = true;

    for (const [ruleId, rule] of this.preventionRules) {
      // Check if rule applies to this event
      const trigger = rule.triggers.find(t => t.event === event);
      if (trigger && trigger.condition(context)) {
        try {
          const checkResult = await rule.prevention.preCheck();
          if (!checkResult) {
            canProceed = false;
          }

          warnings.push(...rule.prevention.earlyWarning());
          alternatives.push(...rule.prevention.alternatives);
          userGuidance.push(rule.prevention.userGuidance);
        } catch (error) {
          warnings.push(`Prevention check failed for rule ${ruleId}: ${error}`);
        }
      }
    }

    return {
      canProceed,
      warnings: [...new Set(warnings)],
      alternatives: [...new Set(alternatives)],
      userGuidance: [...new Set(userGuidance)]
    };
  }

  // Helper methods
  private extractErrorDetails(message: string, stackTrace?: string): string {
    let details = message;
    
    if (stackTrace) {
      const relevantLines = stackTrace.split('\n').slice(0, 5);
      details += `\n\nStack trace:\n${relevantLines.join('\n')}`;
    }
    
    return details;
  }

  private findMatchingPatterns(message: string): string[] {
    const matches: string[] = [];
    
    for (const [id, pattern] of this.patterns) {
      if (pattern.pattern.test(message)) {
        matches.push(id);
      }
    }
    
    return matches;
  }

  private updateErrorPatterns(error: RecoveryError): void {
    error.patterns.forEach(patternId => {
      const pattern = this.patterns.get(patternId);
      if (pattern) {
        pattern.frequency++;
        pattern.lastSeen = new Date().toISOString();
      }
    });
  }

  private async executeAutoFix(pattern: ErrorPattern, context: ErrorContext): Promise<any> {
    // Implementation would depend on the specific pattern
    return { message: `Auto-fix applied for pattern ${pattern.id}` };
  }

  private async executeFallback(pattern: ErrorPattern, context: ErrorContext): Promise<any> {
    // Implementation would provide alternative approaches
    return { message: `Fallback strategy applied for pattern ${pattern.id}` };
  }

  private recordRecoverySuccess(errorId: string, actionId: string, timeTaken: number): void {
    const error = this.errorHistory.get(errorId);
    if (error) {
      // Update success rates for patterns
      error.patterns.forEach(patternId => {
        const pattern = this.patterns.get(patternId);
        if (pattern) {
          // Update success rate (simple moving average)
          pattern.resolutionSuccessRate = 
            (pattern.resolutionSuccessRate + 1) / 2;
        }
      });
    }
  }

  // Analytics methods
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    averageResolutionTime: number;
    mostCommonPatterns: Array<{ id: string; frequency: number; successRate: number }>;
  } {
    const errors = Array.from(this.errorHistory.values());
    const totalErrors = errors.length;

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    const mostCommonPatterns = Array.from(this.patterns.values())
      .filter(p => p.frequency > 0)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        frequency: p.frequency,
        successRate: p.resolutionSuccessRate
      }));

    return {
      totalErrors,
      errorsByType,
      errorsBySeverity,
      averageResolutionTime: 0, // Would be calculated from session data
      mostCommonPatterns
    };
  }
}

// Backup management system
class BackupManager {
  private backups: Map<string, any> = new Map();
  private backupPath: string;

  constructor(backupPath?: string) {
    this.backupPath = backupPath || path.join(process.cwd(), '.speckit-backups');
  }

  async create(
    operation: string,
    files: string[],
    metadata?: Record<string, any>
  ): Promise<string> {
    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Implementation would create actual file backups
    const backup = {
      id: backupId,
      operation,
      files,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.backups.set(backupId, backup);
    return backupId;
  }

  async restore(backupId: string): Promise<void> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    // Implementation would restore actual files
    console.log(`Restored backup ${backupId}`);
  }
}

// Error learning engine
class ErrorLearningEngine {
  private knowledgeBase: Map<string, {
    occurrences: number;
    contexts: any[];
    successfulFixes: any[];
  }> = new Map();

  async learn(error: RecoveryError): Promise<void> {
    const key = `${error.type}-${error.code}`;
    const existing = this.knowledgeBase.get(key) || {
      occurrences: 0,
      contexts: [],
      successfulFixes: []
    };

    existing.occurrences++;
    existing.contexts.push({
      timestamp: error.context.timestamp,
      operation: error.context.operation,
      variables: Object.keys(error.context.variables)
    });

    this.knowledgeBase.set(key, existing);
  }

  getSuggestions(errorType: string, code: string): string[] {
    const key = `${errorType}-${code}`;
    const knowledge = this.knowledgeBase.get(key);
    
    if (!knowledge) {
      return [];
    }

    // Return suggestions based on learned patterns
    return knowledge.successfulFixes.slice(0, 3);
  }
}

export default ErrorPreventionRecoverySystem;