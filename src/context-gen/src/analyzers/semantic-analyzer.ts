import * as fs from 'fs/promises';
import * as path from 'path';
import { SemanticContext, ArchitecturalPattern, ArchitecturalAnalysis } from '../core/types.js';

export class SemanticAnalyzer {
  private readonly COMMON_PATTERNS = {
    mvc: {
      keywords: ['model', 'view', 'controller', 'mvc'],
      structure: ['models/', 'views/', 'controllers/'],
    },
    mvvm: {
      keywords: ['model', 'view', 'viewmodel', 'mvvm'],
      structure: ['models/', 'views/', 'viewmodels/'],
    },
    microservices: {
      keywords: ['service', 'microservice', 'api', 'gateway'],
      structure: ['services/', 'gateway/', 'api/'],
    },
    layered: {
      keywords: ['layer', 'tier', 'presentation', 'business', 'data'],
      structure: ['presentation/', 'business/', 'data/', 'domain/'],
    },
    hexagonal: {
      keywords: ['port', 'adapter', 'hexagonal', 'domain'],
      structure: ['domain/', 'ports/', 'adapters/', 'infrastructure/'],
    },
  };

  async extractSemanticContext(
    filePath: string,
    includeRelationships: boolean = true,
    confidenceThreshold: number = 0.7
  ): Promise<SemanticContext[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const contexts: SemanticContext[] = [];
    
    // Extract different types of semantic entities
    const functions = await this.extractFunctionContext(content, filePath);
    const classes = await this.extractClassContext(content, filePath);
    const variables = await this.extractVariableContext(content, filePath);
    const modules = await this.extractModuleContext(content, filePath);

    contexts.push(...functions, ...classes, ...variables, ...modules);

    // Filter by confidence threshold
    const filteredContexts = contexts.filter(c => c.confidence >= confidenceThreshold);

    // Extract relationships if requested
    if (includeRelationships) {
      for (const context of filteredContexts) {
        context.relationships = await this.extractRelationships(context, content, filteredContexts);
      }
    }

    return filteredContexts;
  }

  private async extractFunctionContext(content: string, filePath: string): Promise<SemanticContext[]> {
    const contexts: SemanticContext[] = [];
    const functionRegex = /(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*\{)/g;
    
    let match;
    const lines = content.split('\n');
    
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2];
      if (!functionName) continue;

      const lineNumber = this.getLineNumber(content, match.index);
      const purpose = this.inferFunctionPurpose(functionName, this.getContextAroundLine(lines, lineNumber, 3));
      
      contexts.push({
        entity: functionName,
        type: 'function',
        purpose,
        relationships: [],
        tags: this.extractTags(functionName, purpose),
        confidence: this.calculateConfidence(functionName, purpose, 'function'),
        location: {
          file: filePath,
          line: lineNumber,
          column: match.index - this.getLineStart(content, match.index),
        },
      });
    }

    return contexts;
  }

  private async extractClassContext(content: string, filePath: string): Promise<SemanticContext[]> {
    const contexts: SemanticContext[] = [];
    const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    
    let match;
    const lines = content.split('\n');
    
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      if (!className) continue;
      
      const matchIndex = match.index ?? 0;
      const lineNumber = this.getLineNumber(content, matchIndex);
      const purpose = this.inferClassPurpose(className, this.getContextAroundLine(lines, lineNumber, 5));
      
      contexts.push({
        entity: className,
        type: 'class',
        purpose,
        relationships: [],
        tags: this.extractTags(className, purpose),
        confidence: this.calculateConfidence(className, purpose, 'class'),
        location: {
          file: filePath,
          line: lineNumber,
          column: matchIndex - this.getLineStart(content, matchIndex),
        },
      });
    }

    return contexts;
  }

  private async extractVariableContext(content: string, filePath: string): Promise<SemanticContext[]> {
    const contexts: SemanticContext[] = [];
    // Focus on significant variables (constants, exports, etc.)
    const varRegex = /(?:export\s+)?(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=/g;
    
    let match;
    const lines = content.split('\n');
    
    while ((match = varRegex.exec(content)) !== null) {
      const varName = match[1];
      if (!varName) continue;
      
      const matchIndex = match.index ?? 0;
      const lineNumber = this.getLineNumber(content, matchIndex);
      const purpose = this.inferVariablePurpose(varName, this.getContextAroundLine(lines, lineNumber, 2));
      
      contexts.push({
        entity: varName,
        type: 'variable',
        purpose,
        relationships: [],
        tags: this.extractTags(varName, purpose),
        confidence: this.calculateConfidence(varName, purpose, 'variable'),
        location: {
          file: filePath,
          line: lineNumber,
          column: matchIndex - this.getLineStart(content, matchIndex),
        },
      });
    }

    return contexts;
  }

  private async extractModuleContext(content: string, filePath: string): Promise<SemanticContext[]> {
    const contexts: SemanticContext[] = [];
    const moduleName = path.basename(filePath, path.extname(filePath));
    const purpose = this.inferModulePurpose(moduleName, content);
    
    contexts.push({
      entity: moduleName,
      type: 'module',
      purpose,
      relationships: [],
      tags: this.extractTags(moduleName, purpose),
      confidence: this.calculateConfidence(moduleName, purpose, 'module'),
      location: {
        file: filePath,
        line: 1,
        column: 0,
      },
    });

    return contexts;
  }

  private async extractRelationships(
    context: SemanticContext,
    content: string,
    allContexts: SemanticContext[]
  ): Promise<Array<{ target: string; type: 'calls' | 'extends' | 'implements' | 'uses' | 'defines'; strength: number }>> {
    const relationships: Array<{ target: string; type: 'calls' | 'extends' | 'implements' | 'uses' | 'defines'; strength: number }> = [];
    
    // Find function calls
    if (context.type === 'function') {
      const callRegex = new RegExp(`${context.entity}\\s*\\(`, 'g');
      const callMatches = content.match(callRegex);
      if (callMatches) {
        for (const otherContext of allContexts) {
          if (otherContext.entity !== context.entity && content.includes(otherContext.entity)) {
            relationships.push({
              target: otherContext.entity,
              type: 'calls',
              strength: Math.min(callMatches.length / 10, 1), // Normalize to 0-1
            });
          }
        }
      }
    }

    // Find inheritance relationships
    if (context.type === 'class') {
      const extendsRegex = new RegExp(`class\\s+${context.entity}\\s+extends\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)`, 'g');
      const extendsMatch = extendsRegex.exec(content);
      if (extendsMatch?.[1]) {
        relationships.push({
          target: extendsMatch[1],
          type: 'extends',
          strength: 1.0,
        });
      }

      const implementsRegex = new RegExp(`class\\s+${context.entity}\\s+implements\\s+([a-zA-Z_$][a-zA-Z0-9_$,\\s]*)`, 'g');
      const implementsMatch = implementsRegex.exec(content);
      if (implementsMatch?.[1]) {
        const interfaces = implementsMatch[1].split(',').map(i => i.trim());
        for (const iface of interfaces) {
          relationships.push({
            target: iface,
            type: 'implements',
            strength: 1.0,
          });
        }
      }
    }

    // Find usage relationships
    for (const otherContext of allContexts) {
      if (otherContext.entity !== context.entity) {
        const usageRegex = new RegExp(otherContext.entity, 'g');
        const usageMatches = content.match(usageRegex);
        if (usageMatches && usageMatches.length > 1) {
          relationships.push({
            target: otherContext.entity,
            type: 'uses',
            strength: Math.min(usageMatches.length / 5, 1),
          });
        }
      }
    }

    return relationships;
  }

  async analyzePatterns(
    projectPath: string,
    patternTypes: Array<keyof typeof SemanticAnalyzer.prototype.COMMON_PATTERNS> = ['mvc', 'layered'],
    includeAntiPatterns: boolean = true
  ): Promise<ArchitecturalAnalysis> {
    const detectedPatterns: ArchitecturalPattern[] = [];
    
    // Analyze directory structure
    const directories = await this.getDirectoryStructure(projectPath);
    const files = await this.getAllFiles(projectPath);

    for (const patternType of patternTypes) {
      const pattern = this.COMMON_PATTERNS[patternType];
      const confidence = await this.calculatePatternConfidence(pattern, directories, files, projectPath);
      
      if (confidence > 0.3) {
        const components = await this.identifyPatternComponents(pattern, directories, files, projectPath);
        const violations = includeAntiPatterns ? await this.detectPatternViolations(patternType, components, files) : [];

        detectedPatterns.push({
          pattern: patternType,
          confidence,
          evidence: await this.collectPatternEvidence(pattern, directories, files),
          components,
          violations,
        });
      }
    }

    // Analyze layering
    const layering = await this.analyzeLayering(directories, files, projectPath);
    const modularity = await this.calculateModularity(files, projectPath);

    return {
      detectedPatterns,
      layering,
      modularity,
      recommendations: this.generateArchitecturalRecommendations(detectedPatterns, layering, modularity),
    };
  }

  private inferFunctionPurpose(name: string, context: string): string {
    const name_lower = name.toLowerCase();
    
    if (name_lower.startsWith('get') || name_lower.startsWith('fetch')) {
      return 'Retrieves or fetches data';
    } else if (name_lower.startsWith('set') || name_lower.startsWith('update')) {
      return 'Updates or modifies data';
    } else if (name_lower.startsWith('create') || name_lower.startsWith('make')) {
      return 'Creates new data or objects';
    } else if (name_lower.startsWith('delete') || name_lower.startsWith('remove')) {
      return 'Deletes or removes data';
    } else if (name_lower.startsWith('is') || name_lower.startsWith('has') || name_lower.startsWith('can')) {
      return 'Performs validation or checking';
    } else if (name_lower.startsWith('calculate') || name_lower.startsWith('compute')) {
      return 'Performs calculations or computations';
    } else if (name_lower.includes('handler') || name_lower.includes('callback')) {
      return 'Handles events or callbacks';
    } else if (context.includes('async') || context.includes('await') || context.includes('Promise')) {
      return 'Performs asynchronous operations';
    }
    
    return 'Performs general processing logic';
  }

  private inferClassPurpose(name: string, context: string): string {
    const name_lower = name.toLowerCase();
    
    if (name_lower.includes('service')) {
      return 'Provides business logic services';
    } else if (name_lower.includes('controller')) {
      return 'Handles request/response logic';
    } else if (name_lower.includes('model') || name_lower.includes('entity')) {
      return 'Represents data structure or domain entity';
    } else if (name_lower.includes('repository') || name_lower.includes('dao')) {
      return 'Manages data access and persistence';
    } else if (name_lower.includes('factory')) {
      return 'Creates and manages object instances';
    } else if (name_lower.includes('manager') || name_lower.includes('handler')) {
      return 'Manages specific system functionality';
    } else if (name_lower.includes('validator')) {
      return 'Validates data and business rules';
    } else if (name_lower.includes('util') || name_lower.includes('helper')) {
      return 'Provides utility functions and helpers';
    } else if (context.includes('extends') || context.includes('implements')) {
      return 'Extends or implements other classes/interfaces';
    }
    
    return 'Encapsulates related functionality and data';
  }

  private inferVariablePurpose(name: string, context: string): string {
    const name_lower = name.toLowerCase();
    
    if (name_lower.includes('config') || name_lower.includes('setting')) {
      return 'Configuration or settings constant';
    } else if (name_lower.includes('url') || name_lower.includes('endpoint')) {
      return 'URL or API endpoint definition';
    } else if (name_lower.includes('error') || name_lower.includes('message')) {
      return 'Error or message constant';
    } else if (name_lower.includes('default')) {
      return 'Default value or configuration';
    } else if (name_lower.includes('max') || name_lower.includes('min') || name_lower.includes('limit')) {
      return 'Limit or boundary constant';
    } else if (context.includes('export')) {
      return 'Exported constant or configuration';
    }
    
    return 'Application constant or configuration value';
  }

  private inferModulePurpose(name: string, content: string): string {
    const name_lower = name.toLowerCase();
    const hasExports = content.includes('export');
    const hasClasses = content.includes('class ');
    const hasFunctions = content.includes('function ') || content.includes('=>');
    
    if (name_lower.includes('test') || name_lower.includes('spec')) {
      return 'Test module for automated testing';
    } else if (name_lower.includes('config')) {
      return 'Configuration module';
    } else if (name_lower.includes('util') || name_lower.includes('helper')) {
      return 'Utility functions and helper methods';
    } else if (name_lower.includes('service')) {
      return 'Service layer implementation';
    } else if (name_lower.includes('controller')) {
      return 'Request handling and routing logic';
    } else if (name_lower.includes('model') || name_lower.includes('schema')) {
      return 'Data models and schemas';
    } else if (name_lower === 'index') {
      return hasExports ? 'Module entry point and exports' : 'Application entry point';
    } else if (hasClasses && hasFunctions) {
      return 'Mixed implementation with classes and functions';
    } else if (hasClasses) {
      return 'Object-oriented implementation module';
    } else if (hasFunctions) {
      return 'Functional implementation module';
    }
    
    return 'General purpose implementation module';
  }

  private extractTags(name: string, purpose: string): string[] {
    const tags: string[] = [];
    const name_lower = name.toLowerCase();
    const purpose_lower = purpose.toLowerCase();
    
    // Extract tags from name patterns
    if (name_lower.includes('api') || name_lower.includes('service')) tags.push('service');
    if (name_lower.includes('test') || name_lower.includes('spec')) tags.push('testing');
    if (name_lower.includes('util') || name_lower.includes('helper')) tags.push('utility');
    if (name_lower.includes('config')) tags.push('configuration');
    if (name_lower.includes('model') || name_lower.includes('entity')) tags.push('data');
    if (name_lower.includes('controller')) tags.push('controller');
    if (name_lower.includes('validator')) tags.push('validation');
    
    // Extract tags from purpose
    if (purpose_lower.includes('async')) tags.push('async');
    if (purpose_lower.includes('data')) tags.push('data');
    if (purpose_lower.includes('validation')) tags.push('validation');
    if (purpose_lower.includes('error')) tags.push('error-handling');
    if (purpose_lower.includes('calculation')) tags.push('computation');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private calculateConfidence(name: string, purpose: string, type: string): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on naming conventions
    if (this.followsNamingConvention(name, type)) confidence += 0.2;
    
    // Increase confidence based on purpose clarity
    if (purpose.length > 20 && !purpose.includes('general')) confidence += 0.2;
    
    // Adjust based on context
    if (type === 'function' && (name.startsWith('get') || name.startsWith('set'))) confidence += 0.1;
    if (type === 'class' && name.endsWith('Service') || name.endsWith('Controller')) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  private followsNamingConvention(name: string, type: string): boolean {
    if (type === 'class') {
      return /^[A-Z][a-zA-Z0-9]*$/.test(name); // PascalCase
    } else if (type === 'function') {
      return /^[a-z][a-zA-Z0-9]*$/.test(name); // camelCase
    } else if (type === 'variable') {
      return /^[A-Z_][A-Z0-9_]*$/.test(name); // UPPER_SNAKE_CASE for constants
    }
    return true;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private getLineStart(content: string, index: number): number {
    const beforeIndex = content.substring(0, index);
    const lastNewline = beforeIndex.lastIndexOf('\n');
    return lastNewline === -1 ? 0 : lastNewline + 1;
  }

  private getContextAroundLine(lines: string[], lineNumber: number, radius: number): string {
    const start = Math.max(0, lineNumber - radius - 1);
    const end = Math.min(lines.length, lineNumber + radius);
    return lines.slice(start, end).join('\n');
  }

  // Additional helper methods for architectural analysis
  private async getDirectoryStructure(projectPath: string): Promise<string[]> {
    const directories: string[] = [];
    
    const scanDirectory = async (dirPath: string, relativePath: string = ''): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const relativeDir = path.join(relativePath, entry.name);
            directories.push(relativeDir);
            await scanDirectory(path.join(dirPath, entry.name), relativeDir);
          }
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${dirPath}:`, error);
      }
    };

    await scanDirectory(projectPath);
    return directories;
  }

  private async getAllFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && /\.(ts|js|py|java|cs|go|rs)$/.test(entry.name)) {
            files.push(path.relative(projectPath, fullPath));
          }
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${dirPath}:`, error);
      }
    };

    await scanDirectory(projectPath);
    return files;
  }

  private async calculatePatternConfidence(
    pattern: { keywords: string[]; structure: string[] },
    directories: string[],
    files: string[],
    projectPath: string
  ): Promise<number> {
    let confidence = 0;
    let totalChecks = 0;

    // Check directory structure
    for (const expectedDir of pattern.structure) {
      totalChecks++;
      const normalizedExpected = expectedDir.replace('/', '');
      if (directories.some(dir => dir.includes(normalizedExpected))) {
        confidence += 0.3;
      }
    }

    // Check file names and content
    for (const keyword of pattern.keywords) {
      totalChecks++;
      const keywordFound = files.some(file => 
        file.toLowerCase().includes(keyword.toLowerCase())
      );
      if (keywordFound) {
        confidence += 0.2;
      }
    }

    return totalChecks > 0 ? Math.min(1.0, confidence / totalChecks) : 0;
  }

  private async identifyPatternComponents(
    pattern: { keywords: string[]; structure: string[] },
    directories: string[],
    files: string[],
    projectPath: string
  ): Promise<Array<{ name: string; role: string; files: string[] }>> {
    const components: Array<{ name: string; role: string; files: string[] }> = [];

    for (const expectedDir of pattern.structure) {
      const normalizedExpected = expectedDir.replace('/', '');
      const matchingDirs = directories.filter(dir => dir.includes(normalizedExpected));
      
      for (const dir of matchingDirs) {
        const role = this.inferComponentRole(normalizedExpected);
        const componentFiles = files.filter(file => file.startsWith(dir + '/'));
        
        if (componentFiles.length > 0) {
          components.push({
            name: dir,
            role,
            files: componentFiles,
          });
        }
      }
    }

    return components;
  }

  private inferComponentRole(dirName: string): string {
    const name_lower = dirName.toLowerCase();
    
    if (name_lower.includes('model')) return 'Data models and entities';
    if (name_lower.includes('view')) return 'User interface and presentation';
    if (name_lower.includes('controller')) return 'Request handling and business logic';
    if (name_lower.includes('service')) return 'Business services and logic';
    if (name_lower.includes('repository') || name_lower.includes('data')) return 'Data access layer';
    if (name_lower.includes('domain')) return 'Domain logic and entities';
    if (name_lower.includes('adapter')) return 'External system adapters';
    if (name_lower.includes('port')) return 'Interface definitions';
    
    return 'General application component';
  }

  private async detectPatternViolations(
    patternType: string,
    components: Array<{ name: string; role: string; files: string[] }>,
    files: string[]
  ): Promise<Array<{ description: string; severity: 'low' | 'medium' | 'high'; files: string[] }>> {
    const violations: Array<{ description: string; severity: 'low' | 'medium' | 'high'; files: string[] }> = [];

    // This is a simplified implementation - in practice, you'd have more sophisticated rules
    if (patternType === 'mvc') {
      // Check for controllers calling models directly (should go through services)
      const controllerFiles = files.filter(f => f.toLowerCase().includes('controller'));
      const modelFiles = files.filter(f => f.toLowerCase().includes('model'));
      
      if (controllerFiles.length > 0 && modelFiles.length > 0) {
        violations.push({
          description: 'Controllers may be directly accessing models instead of using services',
          severity: 'medium',
          files: controllerFiles,
        });
      }
    }

    if (patternType === 'layered') {
      // Check for cross-layer dependencies
      const presentationFiles = files.filter(f => f.includes('presentation') || f.includes('ui'));
      const dataFiles = files.filter(f => f.includes('data') || f.includes('repository'));
      
      if (presentationFiles.length > 0 && dataFiles.length > 0) {
        violations.push({
          description: 'Presentation layer may be directly accessing data layer',
          severity: 'high',
          files: [...presentationFiles, ...dataFiles],
        });
      }
    }

    return violations;
  }

  private async collectPatternEvidence(
    pattern: { keywords: string[]; structure: string[] },
    directories: string[],
    files: string[]
  ): Promise<string[]> {
    const evidence: string[] = [];

    // Directory structure evidence
    for (const expectedDir of pattern.structure) {
      const normalizedExpected = expectedDir.replace('/', '');
      const matchingDirs = directories.filter(dir => dir.includes(normalizedExpected));
      if (matchingDirs.length > 0) {
        evidence.push(`Found expected directory structure: ${matchingDirs.join(', ')}`);
      }
    }

    // File naming evidence
    for (const keyword of pattern.keywords) {
      const matchingFiles = files.filter(file => file.toLowerCase().includes(keyword.toLowerCase()));
      if (matchingFiles.length > 0) {
        evidence.push(`Found files with ${keyword} pattern: ${matchingFiles.slice(0, 3).join(', ')}${matchingFiles.length > 3 ? '...' : ''}`);
      }
    }

    return evidence;
  }

  private async analyzeLayering(
    directories: string[],
    files: string[],
    projectPath: string
  ): Promise<{
    layers: Array<{ name: string; components: string[]; dependencies: string[] }>;
    violations: Array<{ description: string; components: string[] }>;
  }> {
    const layers: Array<{ name: string; components: string[]; dependencies: string[] }> = [];
    const violations: Array<{ description: string; components: string[] }> = [];

    // Identify common layers
    const layerPatterns = [
      { name: 'Presentation', patterns: ['ui', 'view', 'component', 'presentation'] },
      { name: 'Business', patterns: ['service', 'business', 'logic', 'domain'] },
      { name: 'Data', patterns: ['data', 'repository', 'dao', 'persistence'] },
      { name: 'Infrastructure', patterns: ['infrastructure', 'config', 'util'] },
    ];

    for (const layerPattern of layerPatterns) {
      const components = directories.filter(dir => 
        layerPattern.patterns.some(pattern => dir.toLowerCase().includes(pattern))
      );
      
      if (components.length > 0) {
        layers.push({
          name: layerPattern.name,
          components,
          dependencies: [], // Would be populated by dependency analysis
        });
      }
    }

    return { layers, violations };
  }

  private async calculateModularity(files: string[], projectPath: string): Promise<{
    cohesion: number;
    coupling: number;
    instability: number;
  }> {
    // Simplified modularity calculation
    // In practice, you'd analyze actual dependencies and relationships
    
    const totalFiles = files.length;
    const avgFilesPerDir = totalFiles / Math.max(1, files.length / 10); // Rough estimate
    
    return {
      cohesion: Math.min(1.0, avgFilesPerDir / 20), // Higher is better
      coupling: Math.max(0.0, 1.0 - (avgFilesPerDir / 50)), // Lower is better
      instability: 0.5, // Would require detailed dependency analysis
    };
  }

  private generateArchitecturalRecommendations(
    patterns: ArchitecturalPattern[],
    layering: { layers: any[]; violations: any[] },
    modularity: { cohesion: number; coupling: number; instability: number }
  ): string[] {
    const recommendations: string[] = [];

    if (patterns.length === 0) {
      recommendations.push('Consider adopting a clear architectural pattern (MVC, layered, etc.) to improve code organization');
    }

    if (layering.violations.length > 0) {
      recommendations.push('Address layer violations to maintain proper separation of concerns');
    }

    if (modularity.cohesion < 0.5) {
      recommendations.push('Improve module cohesion by grouping related functionality together');
    }

    if (modularity.coupling > 0.7) {
      recommendations.push('Reduce coupling between modules to improve maintainability');
    }

    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.7);
    if (highConfidencePatterns.length > 1) {
      recommendations.push('Multiple architectural patterns detected - consider consolidating to a single consistent approach');
    }

    return recommendations;
  }
}