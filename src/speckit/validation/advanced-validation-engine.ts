// Advanced validation and error prevention system for SpecKit
import { promises as fs } from 'fs';
import path from 'path';

export interface ValidationRule {
  name: string;
  type: 'syntax' | 'semantic' | 'pattern' | 'dependency' | 'build';
  severity: 'error' | 'warning' | 'info';
  check: (content: string, variables: Record<string, string>, context?: any) => ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  suggestions?: string[];
  autoFix?: {
    possible: boolean;
    action: string;
    replacement?: string;
  };
}

export interface LiveValidationConfig {
  enableSyntaxValidation: boolean;
  enableSemanticValidation: boolean;
  enablePatternValidation: boolean;
  enableDependencyValidation: boolean;
  enableBuildSimulation: boolean;
  memoryIntegration: boolean;
  autoFix: boolean;
}

export class AdvancedValidationEngine {
  private rules: ValidationRule[] = [];
  private memoryPatterns: any[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize comprehensive validation rules
  private initializeDefaultRules(): void {
    this.rules = [
      // Syntax validation rules
      {
        name: 'template-brackets-balanced',
        type: 'syntax',
        severity: 'error',
        check: (content: string) => {
          const openBrackets = (content.match(/\{\{/g) || []).length;
          const closeBrackets = (content.match(/\}\}/g) || []).length;
          
          return {
            passed: openBrackets === closeBrackets,
            message: openBrackets === closeBrackets 
              ? 'Template brackets are properly balanced'
              : `Unbalanced template brackets: ${openBrackets} open, ${closeBrackets} close`,
            autoFix: {
              possible: false,
              action: 'Manually balance template brackets'
            }
          };
        }
      },
      
      {
        name: 'variable-resolution',
        type: 'syntax',
        severity: 'error',
        check: (content: string, variables: Record<string, string>) => {
          const unresolvedVars = this.findUnresolvedVariables(content, variables);
          
          return {
            passed: unresolvedVars.length === 0,
            message: unresolvedVars.length === 0
              ? 'All variables are properly resolved'
              : `Unresolved variables: ${unresolvedVars.join(', ')}`,
            suggestions: unresolvedVars.map(v => `Define variable: ${v}`),
            autoFix: {
              possible: true,
              action: 'Generate default values for unresolved variables'
            }
          };
        }
      },

      // Semantic validation rules
      {
        name: 'consistent-naming',
        type: 'semantic',
        severity: 'warning',
        check: (content: string, variables: Record<string, string>) => {
          const namingPatterns = this.analyzeNamingPatterns(content, variables);
          const inconsistencies = namingPatterns.inconsistencies;
          
          return {
            passed: inconsistencies.length === 0,
            message: inconsistencies.length === 0
              ? 'Naming conventions are consistent'
              : `Naming inconsistencies detected: ${inconsistencies.join(', ')}`,
            suggestions: inconsistencies.map(i => `Consider standardizing: ${i}`)
          };
        }
      },

      // Pattern validation rules
      {
        name: 'memory-pattern-compliance',
        type: 'pattern',
        severity: 'warning',
        check: (content: string, variables: Record<string, string>, context?: any) => {
          const violations = this.checkMemoryPatternCompliance(content, variables, context?.memoryPatterns || []);
          
          return {
            passed: violations.length === 0,
            message: violations.length === 0
              ? 'Content follows established memory patterns'
              : `Pattern violations detected: ${violations.length}`,
            suggestions: violations.map(v => `Consider following pattern: ${v}`)
          };
        }
      },

      // Dependency validation rules
      {
        name: 'dependency-availability',
        type: 'dependency',
        severity: 'error',
        check: (content: string, variables: Record<string, string>, context?: any) => {
          const missingDeps = this.checkDependencyAvailability(content, variables, context?.projectPath);
          
          return {
            passed: missingDeps.length === 0,
            message: missingDeps.length === 0
              ? 'All dependencies are available'
              : `Missing dependencies: ${missingDeps.join(', ')}`,
            suggestions: missingDeps.map(d => `Install dependency: ${d}`),
            autoFix: {
              possible: true,
              action: 'Generate package.json with required dependencies'
            }
          };
        }
      },

      // Build simulation rules
      {
        name: 'typescript-compilation',
        type: 'build',
        severity: 'error',
        check: (content: string, variables: Record<string, string>) => {
          const tsErrors = this.simulateTypeScriptCompilation(content, variables);
          
          return {
            passed: tsErrors.length === 0,
            message: tsErrors.length === 0
              ? 'TypeScript compilation would succeed'
              : `TypeScript compilation errors: ${tsErrors.length}`,
            suggestions: tsErrors.map(e => `Fix TypeScript error: ${e}`)
          };
        }
      }
    ];
  }

  // Add custom validation rule
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  // Remove validation rule
  removeRule(ruleName: string): void {
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
  }

  // Perform comprehensive validation
  async validate(
    content: string, 
    variables: Record<string, string>, 
    config: LiveValidationConfig,
    context?: {
      projectPath?: string;
      memoryPatterns?: any[];
      technology?: string;
    }
  ): Promise<{
    passed: boolean;
    errors: ValidationResult[];
    warnings: ValidationResult[];
    info: ValidationResult[];
    summary: {
      totalChecks: number;
      passedChecks: number;
      failedChecks: number;
    };
    autoFixSuggestions: Array<{
      rule: string;
      action: string;
      possible: boolean;
    }>;
  }> {
    const results = {
      passed: true,
      errors: [] as ValidationResult[],
      warnings: [] as ValidationResult[],
      info: [] as ValidationResult[],
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0
      },
      autoFixSuggestions: [] as Array<{
        rule: string;
        action: string;
        possible: boolean;
      }>
    };

    // Filter rules based on configuration
    const activeRules = this.rules.filter(rule => {
      switch (rule.type) {
        case 'syntax': return config.enableSyntaxValidation;
        case 'semantic': return config.enableSemanticValidation;
        case 'pattern': return config.enablePatternValidation && config.memoryIntegration;
        case 'dependency': return config.enableDependencyValidation;
        case 'build': return config.enableBuildSimulation;
        default: return true;
      }
    });

    // Execute validation rules
    for (const rule of activeRules) {
      results.summary.totalChecks++;
      
      try {
        const result = rule.check(content, variables, context);
        
        if (result.passed) {
          results.summary.passedChecks++;
        } else {
          results.summary.failedChecks++;
          results.passed = false;

          // Categorize result by severity
          switch (rule.severity) {
            case 'error':
              results.errors.push({ ...result, message: `[${rule.name}] ${result.message}` });
              break;
            case 'warning':
              results.warnings.push({ ...result, message: `[${rule.name}] ${result.message}` });
              break;
            case 'info':
              results.info.push({ ...result, message: `[${rule.name}] ${result.message}` });
              break;
          }

          // Collect auto-fix suggestions
          if (result.autoFix && config.autoFix) {
            results.autoFixSuggestions.push({
              rule: rule.name,
              action: result.autoFix.action,
              possible: result.autoFix.possible
            });
          }
        }
      } catch (error) {
        results.summary.failedChecks++;
        results.passed = false;
        results.errors.push({
          passed: false,
          message: `[${rule.name}] Validation rule failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return results;
  }

  // Helper methods for validation rules
  private findUnresolvedVariables(content: string, variables: Record<string, string>): string[] {
    const variableMatches = content.match(/\{\{([^}]+)\}\}/g) || [];
    const unresolved: string[] = [];
    
    variableMatches.forEach(match => {
      const varName = match.replace(/\{\{|\}\}/g, '').trim();
      if (!variables[varName]) {
        unresolved.push(varName);
      }
    });

    return [...new Set(unresolved)];
  }

  private analyzeNamingPatterns(content: string, variables: Record<string, string>): {
    patterns: Record<string, string[]>;
    inconsistencies: string[];
  } {
    const patterns: Record<string, string[]> = {
      camelCase: [],
      PascalCase: [],
      snake_case: [],
      'kebab-case': [],
      UPPER_CASE: []
    };
    
    const inconsistencies: string[] = [];
    
    // Analyze variable names
    Object.keys(variables).forEach(varName => {
      if (/^[a-z][a-zA-Z0-9]*$/.test(varName)) {
        patterns.camelCase.push(varName);
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(varName)) {
        patterns.PascalCase.push(varName);
      } else if (/^[a-z0-9_]+$/.test(varName)) {
        patterns.snake_case.push(varName);
      } else if (/^[a-z0-9-]+$/.test(varName)) {
        patterns['kebab-case'].push(varName);
      } else if (/^[A-Z0-9_]+$/.test(varName)) {
        patterns.UPPER_CASE.push(varName);
      } else {
        inconsistencies.push(`Inconsistent naming: ${varName}`);
      }
    });

    // Check for mixed patterns
    const nonEmptyPatterns = Object.entries(patterns).filter(([, vars]) => vars.length > 0);
    if (nonEmptyPatterns.length > 2) {
      inconsistencies.push('Multiple naming conventions used');
    }

    return { patterns, inconsistencies };
  }

  private checkMemoryPatternCompliance(content: string, variables: Record<string, string>, memoryPatterns: any[]): string[] {
    const violations: string[] = [];
    
    memoryPatterns.forEach(pattern => {
      if (pattern.entityType === 'best_practice' || pattern.entityType === 'pattern') {
        pattern.observations.forEach((obs: string) => {
          // Check if the observation/pattern is followed
          if (obs.toLowerCase().includes('should') && !content.toLowerCase().includes(obs.split(' ')[0].toLowerCase())) {
            violations.push(obs);
          }
        });
      }
    });

    return violations;
  }

  private checkDependencyAvailability(content: string, variables: Record<string, string>, projectPath?: string): string[] {
    const missingDeps: string[] = [];
    
    // Extract import statements
    const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
    const dependencies = new Set<string>();
    
    importMatches.forEach(match => {
      const depMatch = match.match(/from\s+['"]([^'"]+)['"]/);
      if (depMatch && depMatch[1] && !depMatch[1].startsWith('.') && !depMatch[1].startsWith('/')) {
        // Extract package name (handle scoped packages)
        const packageName = depMatch[1].startsWith('@') 
          ? depMatch[1].split('/').slice(0, 2).join('/')
          : depMatch[1].split('/')[0];
        dependencies.add(packageName);
      }
    });

    // Check if dependencies exist in project (simplified check)
    dependencies.forEach(dep => {
      // In a real implementation, this would check package.json or node_modules
      if (!this.isCommonDependency(dep)) {
        missingDeps.push(dep);
      }
    });

    return missingDeps;
  }

  private isCommonDependency(dep: string): boolean {
    const commonDeps = [
      '@angular/core', '@angular/common', 'rxjs', 'typescript',
      'react', 'vue', 'lodash', 'moment', 'axios'
    ];
    return commonDeps.includes(dep);
  }

  private simulateTypeScriptCompilation(content: string, variables: Record<string, string>): string[] {
    const errors: string[] = [];
    const processed = this.processVariables(content, variables);
    
    // Simple TypeScript syntax checks
    if (processed.includes('let ') && processed.includes('const ')) {
      const letMatches = processed.match(/let\s+(\w+)/g) || [];
      const constMatches = processed.match(/const\s+(\w+)/g) || [];
      
      letMatches.forEach(letVar => {
        const varName = letVar.replace('let ', '');
        constMatches.forEach(constVar => {
          const constName = constVar.replace('const ', '');
          if (varName === constName) {
            errors.push(`Variable '${varName}' declared as both let and const`);
          }
        });
      });
    }

    // Check for missing type annotations in function parameters
    const functionMatches = processed.match(/function\s+\w+\([^)]*\)/g) || [];
    functionMatches.forEach(func => {
      if (!func.includes(':') && func.includes('(')) {
        errors.push(`Function parameters missing type annotations: ${func}`);
      }
    });

    // Check for undefined variables
    if (processed.includes('undefined')) {
      errors.push('Template contains undefined values after variable substitution');
    }

    return errors;
  }

  private processVariables(content: string, variables: Record<string, string>): string {
    let processed = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(placeholder, value);
    });

    return processed;
  }

  // Real-time validation for streaming content
  async validateStream(
    contentStream: AsyncIterable<string>,
    variables: Record<string, string>,
    config: LiveValidationConfig,
    onValidation?: (result: ValidationResult) => void
  ): Promise<void> {
    let accumulatedContent = '';
    
    for await (const chunk of contentStream) {
      accumulatedContent += chunk;
      
      // Perform lightweight validation on accumulated content
      const quickValidation = await this.validate(accumulatedContent, variables, {
        ...config,
        enableBuildSimulation: false // Skip heavy validation in streaming mode
      });
      
      // Report issues immediately
      if (onValidation && !quickValidation.passed) {
        const latestError = [...quickValidation.errors, ...quickValidation.warnings][0];
        if (latestError) {
          onValidation(latestError);
        }
      }
    }

    // Final comprehensive validation
    if (config.enableBuildSimulation) {
      const finalValidation = await this.validate(accumulatedContent, variables, config);
      if (onValidation && !finalValidation.passed) {
        const criticalErrors = finalValidation.errors.filter(e => e.message.includes('build') || e.message.includes('compilation'));
        criticalErrors.forEach(error => onValidation(error));
      }
    }
  }

  // Auto-fix functionality
  async autoFix(
    content: string,
    variables: Record<string, string>,
    validationResult: ValidationResult
  ): Promise<{
    fixedContent: string;
    fixedVariables: Record<string, string>;
    appliedFixes: string[];
  }> {
    let fixedContent = content;
    let fixedVariables = { ...variables };
    const appliedFixes: string[] = [];

    if (validationResult.autoFix?.possible) {
      switch (validationResult.autoFix.action) {
        case 'Generate default values for unresolved variables':
          const unresolved = this.findUnresolvedVariables(content, variables);
          unresolved.forEach(varName => {
            if (!fixedVariables[varName]) {
              fixedVariables[varName] = this.generateDefaultValue(varName);
              appliedFixes.push(`Generated default value for ${varName}`);
            }
          });
          break;

        case 'Fix TypeScript compilation errors':
          // Apply TypeScript fixes
          if (validationResult.autoFix.replacement) {
            fixedContent = validationResult.autoFix.replacement;
            appliedFixes.push('Applied TypeScript compilation fixes');
          }
          break;
      }
    }

    return { fixedContent, fixedVariables, appliedFixes };
  }

  private generateDefaultValue(varName: string): string {
    const commonDefaults: Record<string, string> = {
      'PROJECT_NAME': 'MyProject',
      'AUTHOR': 'Developer',
      'VERSION': '1.0.0',
      'DESCRIPTION': 'Project description',
      'TECHNOLOGY_STACK': 'TypeScript, Node.js',
      'BUILD_COMMAND': 'npm run build',
      'TEST_COMMAND': 'npm test'
    };

    if (commonDefaults[varName]) {
      return commonDefaults[varName];
    }

    // Generate based on variable name pattern
    if (varName.includes('NAME')) return 'DefaultName';
    if (varName.includes('VERSION')) return '1.0.0';
    if (varName.includes('URL') || varName.includes('ENDPOINT')) return 'https://example.com';
    if (varName.includes('PORT')) return '3000';
    if (varName.includes('PATH')) return './';
    if (varName.includes('COMMAND')) return 'npm run command';

    return 'TODO: Define this value';
  }
}

// Export the validation engine
export default AdvancedValidationEngine;