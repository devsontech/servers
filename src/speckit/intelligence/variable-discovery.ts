// Intelligent variable discovery and management system for SpecKit
import { promises as fs } from 'fs';
import path from 'path';

export interface SmartVariable {
  name: string;
  value: string;
  source: 'memory' | 'workspace' | 'user' | 'inferred' | 'pattern';
  confidence: number;
  suggestions?: string[];
  description?: string;
  pattern?: string;
  lastUpdated: string;
  usageCount: number;
  contexts: string[];
}

export interface VariablePattern {
  pattern: RegExp;
  generator: (context: any) => string;
  description: string;
  contexts: string[];
}

export interface VariableLibrary {
  variables: Record<string, SmartVariable>;
  patterns: Record<string, VariablePattern>;
  globalSuggestions: Record<string, string[]>;
  lastUpdated: string;
  version: string;
}

export interface WorkspaceAnalysisResult {
  technologies: string[];
  frameworks: string[];
  projectType: string;
  architecture?: string;
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
  metadata: Record<string, any>;
}

export class IntelligentVariableDiscovery {
  private variableLibrary: VariableLibrary;
  private memoryPatterns: any[] = [];
  private builtinPatterns: VariablePattern[];

  constructor(libraryPath?: string) {
    this.variableLibrary = {
      variables: {},
      patterns: {},
      globalSuggestions: {},
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };

    this.builtinPatterns = this.initializeBuiltinPatterns();
    
    if (libraryPath) {
      this.loadLibrary(libraryPath);
    }
  }

  // Initialize built-in variable patterns
  private initializeBuiltinPatterns(): VariablePattern[] {
    return [
      {
        pattern: /PROJECT[_\-]?NAME/i,
        generator: (context: any) => context.packageJson?.name || path.basename(context.projectPath) || 'MyProject',
        description: 'Project name from package.json or directory name',
        contexts: ['project', 'general']
      },
      {
        pattern: /AUTHOR[_\-]?(NAME)?/i,
        generator: (context: any) => context.packageJson?.author?.name || context.gitConfig?.name || 'Developer',
        description: 'Author name from package.json or git config',
        contexts: ['project', 'metadata']
      },
      {
        pattern: /VERSION/i,
        generator: (context: any) => context.packageJson?.version || '1.0.0',
        description: 'Version from package.json',
        contexts: ['project', 'versioning']
      },
      {
        pattern: /DESCRIPTION/i,
        generator: (context: any) => context.packageJson?.description || `${context.projectName} description`,
        description: 'Project description from package.json',
        contexts: ['project', 'metadata']
      },
      {
        pattern: /TECHNOLOGY[_\-]?STACK/i,
        generator: (context: any) => this.generateTechnologyStack(context),
        description: 'Technology stack based on dependencies',
        contexts: ['technology', 'architecture']
      },
      {
        pattern: /FRAMEWORK/i,
        generator: (context: any) => this.detectPrimaryFramework(context),
        description: 'Primary framework detected from dependencies',
        contexts: ['technology', 'framework']
      },
      {
        pattern: /BUILD[_\-]?COMMAND/i,
        generator: (context: any) => context.packageJson?.scripts?.build || 'npm run build',
        description: 'Build command from package.json scripts',
        contexts: ['build', 'scripts']
      },
      {
        pattern: /TEST[_\-]?COMMAND/i,
        generator: (context: any) => context.packageJson?.scripts?.test || 'npm test',
        description: 'Test command from package.json scripts',
        contexts: ['testing', 'scripts']
      },
      {
        pattern: /API[_\-]?URL/i,
        generator: (context: any) => context.env?.API_URL || context.config?.apiUrl || 'https://api.example.com',
        description: 'API URL from environment or config',
        contexts: ['api', 'configuration']
      },
      {
        pattern: /DATABASE[_\-]?URL/i,
        generator: (context: any) => context.env?.DATABASE_URL || 'postgresql://localhost:5432/database',
        description: 'Database URL from environment variables',
        contexts: ['database', 'configuration']
      },
      {
        pattern: /PORT/i,
        generator: (context: any) => context.env?.PORT || context.packageJson?.config?.port || '3000',
        description: 'Port number from environment or package config',
        contexts: ['server', 'configuration']
      }
    ];
  }

  // Comprehensive workspace analysis
  async analyzeWorkspace(projectPath: string, options: {
    scanDepth?: 'shallow' | 'deep' | 'comprehensive';
    includeTechnologies?: string[];
    memoryPatterns?: any[];
  } = {}): Promise<WorkspaceAnalysisResult & { variables: Record<string, SmartVariable> }> {
    const { scanDepth = 'deep', includeTechnologies = [], memoryPatterns = [] } = options;
    
    this.memoryPatterns = memoryPatterns;
    
    const analysis: WorkspaceAnalysisResult = {
      technologies: [],
      frameworks: [],
      projectType: 'unknown',
      dependencies: {},
      scripts: {},
      metadata: {}
    };

    const variables: Record<string, SmartVariable> = {};
    const context: any = { projectPath };

    try {
      // Analyze package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await this.fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        context.packageJson = packageJson;
        
        analysis.dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        analysis.scripts = packageJson.scripts || {};
        analysis.metadata = {
          name: packageJson.name,
          version: packageJson.version,
          description: packageJson.description,
          author: packageJson.author
        };

        // Detect technologies and frameworks
        analysis.technologies = this.detectTechnologies(analysis.dependencies);
        analysis.frameworks = this.detectFrameworks(analysis.dependencies);
        analysis.projectType = this.detectProjectType(packageJson, analysis.dependencies);
      }

      // Analyze configuration files
      if (scanDepth !== 'shallow') {
        await this.analyzeConfigurationFiles(projectPath, analysis, context);
      }

      // Analyze source code structure
      if (scanDepth === 'comprehensive') {
        await this.analyzeSourceCode(projectPath, analysis, context);
      }

      // Load environment variables
      await this.loadEnvironmentVariables(projectPath, context);

      // Load git configuration
      await this.loadGitConfiguration(projectPath, context);

      // Generate variables using patterns
      const generatedVars = await this.generateVariablesFromPatterns(context);
      Object.assign(variables, generatedVars);

      // Extract variables from memory patterns
      const memoryVars = this.extractVariablesFromMemory(memoryPatterns, context);
      Object.assign(variables, memoryVars);

      // Suggest variables based on project type and technology
      const suggestedVars = this.generateContextualVariables(analysis, context);
      Object.assign(variables, suggestedVars);

      // Update variable library
      this.updateVariableLibrary(variables);

    } catch (error) {
      console.warn('Error during workspace analysis:', error);
    }

    return { ...analysis, variables };
  }

  // Generate variables from built-in patterns
  private async generateVariablesFromPatterns(context: any): Promise<Record<string, SmartVariable>> {
    const variables: Record<string, SmartVariable> = {};
    const now = new Date().toISOString();

    for (const pattern of this.builtinPatterns) {
      try {
        const value = pattern.generator(context);
        const varName = this.patternToVariableName(pattern.pattern);
        
        variables[varName] = {
          name: varName,
          value: value,
          source: 'pattern',
          confidence: 0.9,
          description: pattern.description,
          pattern: pattern.pattern.source,
          lastUpdated: now,
          usageCount: 0,
          contexts: pattern.contexts
        };
      } catch (error) {
        console.warn(`Error generating variable for pattern ${pattern.pattern}:`, error);
      }
    }

    return variables;
  }

  // Extract variables from memory patterns
  private extractVariablesFromMemory(memoryPatterns: any[], context: any): Record<string, SmartVariable> {
    const variables: Record<string, SmartVariable> = {};
    const now = new Date().toISOString();

    memoryPatterns.forEach(pattern => {
      if (pattern.metadata && pattern.metadata.variables) {
        Object.entries(pattern.metadata.variables).forEach(([key, value]) => {
          variables[key] = {
            name: key,
            value: String(value),
            source: 'memory',
            confidence: pattern.metadata.confidence_score || 0.8,
            description: `From memory pattern: ${pattern.name}`,
            lastUpdated: now,
            usageCount: 0,
            contexts: pattern.metadata.contexts || ['memory']
          };
        });
      }

      // Extract variable suggestions from observations
      pattern.observations?.forEach((obs: string) => {
        const variableMatches = obs.match(/\{\{([^}]+)\}\}/g);
        if (variableMatches) {
          variableMatches.forEach((match: string) => {
            const varName = match.replace(/\{\{|\}\}/g, '');
            if (!variables[varName]) {
              const suggestedValue = this.inferVariableValue(varName, obs, context);
              variables[varName] = {
                name: varName,
                value: suggestedValue,
                source: 'memory',
                confidence: 0.7,
                description: `Inferred from memory observation: ${obs.substring(0, 50)}...`,
                lastUpdated: now,
                usageCount: 0,
                contexts: ['memory', 'inferred']
              };
            }
          });
        }
      });
    });

    return variables;
  }

  // Generate contextual variables based on project analysis
  private generateContextualVariables(analysis: WorkspaceAnalysisResult, context: any): Record<string, SmartVariable> {
    const variables: Record<string, SmartVariable> = {};
    const now = new Date().toISOString();

    // Technology-specific variables
    if (analysis.technologies.includes('Angular')) {
      variables.ANGULAR_VERSION = {
        name: 'ANGULAR_VERSION',
        value: this.extractVersionFromDependencies(analysis.dependencies, '@angular/core') || '17+',
        source: 'inferred',
        confidence: 0.85,
        description: 'Angular version from dependencies',
        lastUpdated: now,
        usageCount: 0,
        contexts: ['angular', 'technology']
      };
    }

    if (analysis.technologies.includes('ABP Framework')) {
      variables.ABP_VERSION = {
        name: 'ABP_VERSION',
        value: this.extractVersionFromDependencies(analysis.dependencies, '@abp/ng.core') || '9.0',
        source: 'inferred',
        confidence: 0.85,
        description: 'ABP Framework version from dependencies',
        lastUpdated: now,
        usageCount: 0,
        contexts: ['abp', 'framework']
      };
    }

    // Project type specific variables
    if (analysis.projectType === 'web') {
      variables.DEFAULT_ROUTE = {
        name: 'DEFAULT_ROUTE',
        value: '/',
        source: 'inferred',
        confidence: 0.7,
        description: 'Default route for web application',
        lastUpdated: now,
        usageCount: 0,
        contexts: ['web', 'routing']
      };
    }

    // Architecture specific variables
    if (analysis.architecture === 'microservices') {
      variables.SERVICE_PORT = {
        name: 'SERVICE_PORT',
        value: this.generateServicePort(context.packageJson?.name),
        source: 'inferred',
        confidence: 0.6,
        description: 'Generated service port for microservice',
        lastUpdated: now,
        usageCount: 0,
        contexts: ['microservices', 'architecture']
      };
    }

    return variables;
  }

  // Smart variable suggestions based on context
  async suggestVariables(
    templateContent: string, 
    existingVariables: Record<string, string>,
    context: {
      projectType?: string;
      technology?: string;
      domain?: string;
    } = {}
  ): Promise<Record<string, SmartVariable>> {
    const suggestions: Record<string, SmartVariable> = {};
    const now = new Date().toISOString();

    // Find undefined variables in template
    const undefinedVars = this.findUndefinedVariables(templateContent, existingVariables);

    for (const varName of undefinedVars) {
      const suggestion = this.generateSmartSuggestion(varName, context, existingVariables);
      
      suggestions[varName] = {
        name: varName,
        value: suggestion.value,
        source: suggestion.source,
        confidence: suggestion.confidence,
        description: suggestion.description,
        suggestions: suggestion.alternatives,
        lastUpdated: now,
        usageCount: 0,
        contexts: suggestion.contexts
      };
    }

    return suggestions;
  }

  // Variable value prediction using ML-like heuristics
  private generateSmartSuggestion(
    varName: string, 
    context: any, 
    existingVars: Record<string, string>
  ): {
    value: string;
    source: SmartVariable['source'];
    confidence: number;
    description: string;
    alternatives: string[];
    contexts: string[];
  } {
    const alternatives: string[] = [];
    let value = '';
    let confidence = 0.5;
    let source: SmartVariable['source'] = 'inferred';
    let description = `Inferred value for ${varName}`;
    let contexts = ['inferred'];

    // Check built-in patterns
    const matchingPattern = this.builtinPatterns.find(p => p.pattern.test(varName));
    if (matchingPattern) {
      try {
        value = matchingPattern.generator(context);
        confidence = 0.8;
        source = 'pattern';
        description = matchingPattern.description;
        contexts = matchingPattern.contexts;
      } catch (error) {
        // Fall back to heuristic generation
      }
    }

    // Heuristic-based generation
    if (!value) {
      if (varName.includes('NAME')) {
        value = context.projectName || 'DefaultName';
        alternatives.push('MyProject', 'Application', 'Service');
      } else if (varName.includes('URL') || varName.includes('ENDPOINT')) {
        value = 'https://api.example.com';
        alternatives.push('http://localhost:3000', 'https://localhost:3001', '/api/v1');
      } else if (varName.includes('PORT')) {
        value = '3000';
        alternatives.push('8080', '5000', '4200');
      } else if (varName.includes('VERSION')) {
        value = '1.0.0';
        alternatives.push('0.1.0', '2.0.0', 'latest');
      } else if (varName.includes('PATH')) {
        value = './';
        alternatives.push('src/', 'dist/', 'build/');
      } else if (varName.includes('COMMAND')) {
        value = 'npm run command';
        alternatives.push('yarn command', 'pnpm command', 'bun command');
      } else {
        // Use similar variables as reference
        const similarVar = this.findSimilarVariable(varName, existingVars);
        if (similarVar) {
          value = similarVar;
          confidence = 0.6;
          description = `Similar to existing variable pattern`;
        } else {
          value = 'TODO: Define this value';
          confidence = 0.3;
        }
      }
    }

    return { value, source, confidence, description, alternatives, contexts };
  }

  // Helper methods
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
      'rxjs': 'RxJS',
      'express': 'Express.js',
      'next': 'Next.js',
      'nuxt': 'Nuxt.js',
      '@nestjs/core': 'NestJS'
    };

    Object.keys(dependencies).forEach(dep => {
      if (techMap[dep]) {
        technologies.push(techMap[dep]);
      }
    });

    return [...new Set(technologies)];
  }

  private detectFrameworks(dependencies: Record<string, string>): string[] {
    const frameworks: string[] = [];
    const frameworkMap: Record<string, string> = {
      '@angular/core': 'Angular',
      'react': 'React',
      'vue': 'Vue.js',
      '@abp/ng.core': 'ABP Framework',
      '@nestjs/core': 'NestJS',
      'express': 'Express.js',
      'next': 'Next.js',
      'nuxt': 'Nuxt.js'
    };

    Object.keys(dependencies).forEach(dep => {
      if (frameworkMap[dep]) {
        frameworks.push(frameworkMap[dep]);
      }
    });

    return [...new Set(frameworks)];
  }

  private detectProjectType(packageJson: any, dependencies: Record<string, string>): string {
    if (dependencies['@angular/core']) return 'web';
    if (dependencies['react'] || dependencies['vue']) return 'web';
    if (dependencies['express'] || dependencies['@nestjs/core']) return 'api';
    if (dependencies['electron']) return 'desktop';
    if (packageJson.bin) return 'cli';
    if (packageJson.main && !packageJson.scripts?.start) return 'library';
    
    return 'unknown';
  }

  private async analyzeConfigurationFiles(projectPath: string, analysis: WorkspaceAnalysisResult, context: any): Promise<void> {
    // Analyze tsconfig.json
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    if (await this.fileExists(tsconfigPath)) {
      const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf-8'));
      context.tsconfig = tsconfig;
      analysis.metadata.typescript = true;
      
      if (tsconfig.compilerOptions?.target) {
        analysis.metadata.typescriptTarget = tsconfig.compilerOptions.target;
      }
    }

    // Analyze angular.json
    const angularConfigPath = path.join(projectPath, 'angular.json');
    if (await this.fileExists(angularConfigPath)) {
      const angularConfig = JSON.parse(await fs.readFile(angularConfigPath, 'utf-8'));
      context.angularConfig = angularConfig;
      analysis.architecture = 'spa';
      analysis.metadata.angular = true;
    }
  }

  private async analyzeSourceCode(projectPath: string, analysis: WorkspaceAnalysisResult, context: any): Promise<void> {
    // This would be a comprehensive source code analysis
    // For now, we'll do a simplified version
    const srcPath = path.join(projectPath, 'src');
    if (await this.fileExists(srcPath)) {
      try {
        const srcContents = await fs.readdir(srcPath, { withFileTypes: true });
        const directories = srcContents.filter(item => item.isDirectory()).map(item => item.name);
        
        context.sourceStructure = directories;
        
        // Infer architecture from structure
        if (directories.includes('components') && directories.includes('services')) {
          analysis.architecture = 'component-based';
        }
        if (directories.includes('modules')) {
          analysis.architecture = 'modular';
        }
      } catch (error) {
        console.warn('Could not analyze source code structure:', error);
      }
    }
  }

  private async loadEnvironmentVariables(projectPath: string, context: any): Promise<void> {
    const envPath = path.join(projectPath, '.env');
    if (await this.fileExists(envPath)) {
      try {
        const envContent = await fs.readFile(envPath, 'utf-8');
        const envVars: Record<string, string> = {};
        
        envContent.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            envVars[key.trim()] = value.trim().replace(/['"]/g, '');
          }
        });
        
        context.env = envVars;
      } catch (error) {
        console.warn('Could not load environment variables:', error);
      }
    }
  }

  private async loadGitConfiguration(projectPath: string, context: any): Promise<void> {
    try {
      // This would read git config, for now we'll use a placeholder
      context.gitConfig = {
        name: 'Developer',
        email: 'developer@example.com'
      };
    } catch (error) {
      console.warn('Could not load git configuration:', error);
    }
  }

  private generateTechnologyStack(context: any): string {
    const technologies = [];
    
    if (context.packageJson?.dependencies) {
      const deps = context.packageJson.dependencies;
      
      if (deps['@angular/core']) technologies.push('Angular');
      if (deps['typescript']) technologies.push('TypeScript');
      if (deps['rxjs']) technologies.push('RxJS');
      if (deps['@carbon/angular']) technologies.push('Carbon Design System');
      if (deps['@abp/ng.core']) technologies.push('ABP Framework');
    }

    return technologies.length > 0 ? technologies.join(', ') : 'JavaScript, Node.js';
  }

  private detectPrimaryFramework(context: any): string {
    if (context.packageJson?.dependencies) {
      const deps = context.packageJson.dependencies;
      
      if (deps['@angular/core']) return 'Angular';
      if (deps['react']) return 'React';
      if (deps['vue']) return 'Vue.js';
      if (deps['@nestjs/core']) return 'NestJS';
      if (deps['express']) return 'Express.js';
    }

    return 'None';
  }

  private patternToVariableName(pattern: RegExp): string {
    const source = pattern.source;
    // Extract the main part and convert to uppercase
    const cleaned = source
      .replace(/[\[\]()^$.*+?{}|\\]/g, '')  // Remove regex chars
      .replace(/[_\-]?\?/g, '_')            // Handle optional separators
      .toUpperCase();
    
    return cleaned;
  }

  private extractVersionFromDependencies(dependencies: Record<string, string>, packageName: string): string | null {
    const version = dependencies[packageName];
    if (!version) return null;
    
    // Clean up version string (remove ^, ~, etc.)
    return version.replace(/[^0-9.]/g, '');
  }

  private generateServicePort(serviceName?: string): string {
    if (!serviceName) return '3000';
    
    // Generate a consistent port based on service name hash
    let hash = 0;
    for (let i = 0; i < serviceName.length; i++) {
      const char = serviceName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Ensure port is in valid range (3000-9999)
    const port = 3000 + Math.abs(hash % 7000);
    return port.toString();
  }

  private findUndefinedVariables(templateContent: string, existingVariables: Record<string, string>): string[] {
    const variableMatches = templateContent.match(/\{\{([^}]+)\}\}/g) || [];
    const undefined_vars: string[] = [];
    
    variableMatches.forEach(match => {
      const varName = match.replace(/\{\{|\}\}/g, '').trim();
      if (!existingVariables[varName]) {
        undefined_vars.push(varName);
      }
    });

    return [...new Set(undefined_vars)];
  }

  private findSimilarVariable(varName: string, existingVars: Record<string, string>): string | null {
    const existingKeys = Object.keys(existingVars);
    
    // Find variables with similar names
    const similar = existingKeys.find(key => {
      const similarity = this.calculateStringSimilarity(varName.toLowerCase(), key.toLowerCase());
      return similarity > 0.6; // 60% similarity threshold
    });

    return similar ? existingVars[similar] : null;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private inferVariableValue(varName: string, observation: string, context: any): string {
    // Try to infer variable value from context of the observation
    if (observation.includes('component') && varName.includes('COMPONENT')) {
      return 'MyComponent';
    }
    
    if (observation.includes('service') && varName.includes('SERVICE')) {
      return 'MyService';
    }
    
    if (observation.includes('module') && varName.includes('MODULE')) {
      return 'MyModule';
    }

    // Default inference based on variable name
    return this.generateSmartSuggestion(varName, context, {}).value;
  }

  private updateVariableLibrary(variables: Record<string, SmartVariable>): void {
    // Update existing variables or add new ones
    Object.entries(variables).forEach(([key, variable]) => {
      if (this.variableLibrary.variables[key]) {
        // Update existing variable
        this.variableLibrary.variables[key] = {
          ...this.variableLibrary.variables[key],
          ...variable,
          usageCount: this.variableLibrary.variables[key].usageCount + 1
        };
      } else {
        // Add new variable
        this.variableLibrary.variables[key] = variable;
      }
    });

    this.variableLibrary.lastUpdated = new Date().toISOString();
  }

  private async loadLibrary(libraryPath: string): Promise<void> {
    try {
      if (await this.fileExists(libraryPath)) {
        const content = await fs.readFile(libraryPath, 'utf-8');
        this.variableLibrary = { ...this.variableLibrary, ...JSON.parse(content) };
      }
    } catch (error) {
      console.warn('Could not load variable library:', error);
    }
  }

  // Public methods for library management
  async saveLibrary(libraryPath: string): Promise<void> {
    try {
      const dir = path.dirname(libraryPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(libraryPath, JSON.stringify(this.variableLibrary, null, 2));
    } catch (error) {
      console.warn('Could not save variable library:', error);
    }
  }

  getLibrary(): VariableLibrary {
    return { ...this.variableLibrary };
  }

  getVariable(name: string): SmartVariable | undefined {
    return this.variableLibrary.variables[name];
  }

  addVariable(variable: SmartVariable): void {
    this.variableLibrary.variables[variable.name] = variable;
    this.variableLibrary.lastUpdated = new Date().toISOString();
  }

  removeVariable(name: string): void {
    delete this.variableLibrary.variables[name];
    this.variableLibrary.lastUpdated = new Date().toISOString();
  }

  // Get usage analytics for variables
  getUsageAnalytics(): {
    totalVariables: number;
    mostUsed: Array<{ name: string; usageCount: number }>;
    bySource: Record<string, number>;
    byContext: Record<string, number>;
    averageConfidence: number;
  } {
    const variables = Object.values(this.variableLibrary.variables);
    
    const mostUsed = variables
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(v => ({ name: v.name, usageCount: v.usageCount }));

    const bySource: Record<string, number> = {};
    const byContext: Record<string, number> = {};
    let totalConfidence = 0;

    variables.forEach(variable => {
      bySource[variable.source] = (bySource[variable.source] || 0) + 1;
      totalConfidence += variable.confidence;
      
      variable.contexts.forEach(context => {
        byContext[context] = (byContext[context] || 0) + 1;
      });
    });

    return {
      totalVariables: variables.length,
      mostUsed,
      bySource,
      byContext,
      averageConfidence: variables.length > 0 ? totalConfidence / variables.length : 0
    };
  }
}

export default IntelligentVariableDiscovery;