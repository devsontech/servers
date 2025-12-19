import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
// import { Minimatch } from 'minimatch';
// import ignore from 'ignore';
import * as acorn from 'acorn';
import { simple as simpleWalk } from 'acorn-walk';
import { FileContext, CodebaseAnalysis } from '../core/types.js';

export class CodebaseAnalyzer {
  private ignorePatterns: string[] = [];

  constructor() {
    this.initializeIgnorePatterns();
  }

  private initializeIgnorePatterns(): void {
    const commonIgnorePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '*.log',
      '*.tmp',
      '.env*',
      'coverage/**',
      '.vscode/**',
      '.idea/**',
    ];
    this.ignorePatterns = commonIgnorePatterns;
  }

  async analyzeCodebase(
    projectPath: string,
    includePatterns: string[] = ['**/*.{ts,js,py,java,cs,go,rs}'],
    excludePatterns: string[] = ['node_modules/**', '*.test.*', '*.spec.*'],
    maxDepth: number = 10,
    analysisDepth: 'shallow' | 'medium' | 'deep' = 'medium'
  ): Promise<CodebaseAnalysis> {
    const files = await this.findFiles(projectPath, includePatterns, excludePatterns, maxDepth);
    const fileContexts: FileContext[] = [];
    const hotspots: Array<{ path: string; issues: string[]; severity: 'low' | 'medium' | 'high' }> = [];
    
    let totalLines = 0;
    const languageStats: Record<string, number> = {};
    const complexityScores: number[] = [];

    for (const filePath of files) {
      try {
        const fileContext = await this.analyzeFile(filePath, projectPath, analysisDepth);
        fileContexts.push(fileContext);
        
        totalLines += fileContext.lines;
        languageStats[fileContext.type] = (languageStats[fileContext.type] || 0) + 1;
        complexityScores.push(fileContext.complexity);

        // Identify hotspots (high complexity, large files, etc.)
        const issues = this.identifyFileIssues(fileContext);
        if (issues.length > 0) {
          hotspots.push({
            path: fileContext.path,
            issues: issues.map(i => i.description),
            severity: this.calculateSeverity(issues),
          });
        }
      } catch (error) {
        console.warn(`Failed to analyze file ${filePath}:`, error);
      }
    }

    const averageComplexity = complexityScores.length > 0 
      ? complexityScores.reduce((sum, c) => sum + c, 0) / complexityScores.length 
      : 0;
    
    const medianComplexity = this.calculateMedian(complexityScores);
    const highComplexityFiles = fileContexts
      .filter(f => f.complexity > averageComplexity * 2)
      .map(f => f.path);

    return {
      overview: {
        totalFiles: fileContexts.length,
        totalLines,
        languages: languageStats,
        complexity: {
          average: averageComplexity,
          median: medianComplexity,
          high: highComplexityFiles,
        },
      },
      files: fileContexts,
      hotspots,
      recommendations: this.generateRecommendations(fileContexts, hotspots),
    };
  }

  private async findFiles(
    projectPath: string,
    includePatterns: string[],
    excludePatterns: string[],
    maxDepth: number
  ): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const pattern of includePatterns) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        maxDepth,
        ignore: excludePatterns,
      });
      allFiles.push(...matches);
    }

    // Remove duplicates and apply ignore patterns
    const uniqueFiles = [...new Set(allFiles)];
    return uniqueFiles.filter(file => {
      const relativePath = path.relative(projectPath, file);
      return !this.shouldIgnoreFile(relativePath);
    });
  }

  private shouldIgnoreFile(relativePath: string): boolean {
    return this.ignorePatterns.some(pattern => {
      return relativePath.includes(pattern.replace('/**', '').replace('**/', ''));
    });
  }

  private async analyzeFile(
    filePath: string,
    projectRoot: string,
    depth: 'shallow' | 'medium' | 'deep'
  ): Promise<FileContext> {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const extension = path.extname(filePath);
    const fileType = this.determineFileType(extension);

    const baseContext: FileContext = {
      path: path.relative(projectRoot, filePath),
      type: fileType,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      encoding: 'utf-8',
      lines,
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      complexity: 0,
      maintainabilityIndex: 0,
    };

    if (depth === 'shallow') {
      return baseContext;
    }

    // Perform deeper analysis based on file type
    if (fileType === 'typescript' || fileType === 'javascript') {
      return await this.analyzeJavaScriptFile(baseContext, content, depth);
    } else if (fileType === 'python') {
      return await this.analyzePythonFile(baseContext, content, depth);
    }

    return baseContext;
  }

  private async analyzeJavaScriptFile(
    baseContext: FileContext,
    content: string,
    depth: 'medium' | 'deep'
  ): Promise<FileContext> {
    try {
      const ast = acorn.parse(content, {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowHashBang: true,
        allowReturnOutsideFunction: true,
      });

      const functions: string[] = [];
      const classes: string[] = [];
      const imports: string[] = [];
      const exports: string[] = [];
      let complexity = 0;

      const self = this;
      simpleWalk(ast, {
        FunctionDeclaration(node: any) {
          if (node.id) functions.push(node.id.name);
          complexity += self.calculateCyclomaticComplexity(node);
        },
        ArrowFunctionExpression(node: any) {
          complexity += self.calculateCyclomaticComplexity(node);
        },
        FunctionExpression(node: any) {
          complexity += self.calculateCyclomaticComplexity(node);
        },
        ClassDeclaration(node: any) {
          if (node.id) classes.push(node.id.name);
        },
        ImportDeclaration(node: any) {
          if (node.source) imports.push(node.source.value);
        },
        ExportNamedDeclaration(node: any) {
          if (node.source) exports.push(node.source.value);
        },
        ExportDefaultDeclaration(node: any) {
          exports.push('default');
        },
      });

      return {
        ...baseContext,
        functions,
        classes,
        imports,
        exports,
        complexity,
        maintainabilityIndex: this.calculateMaintainabilityIndex(baseContext.lines, complexity, functions.length + classes.length),
      };
    } catch (error) {
      console.warn(`Failed to parse JavaScript file ${baseContext.path}:`, error);
      return baseContext;
    }
  }

  private async analyzePythonFile(
    baseContext: FileContext,
    content: string,
    depth: 'medium' | 'deep'
  ): Promise<FileContext> {
    // Basic Python analysis using regex patterns
    // For a production system, you'd want to use a proper Python AST parser
    const functionMatches = content.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g) || [];
    const classMatches = content.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g) || [];
    const importMatches = content.match(/(?:from\s+[a-zA-Z0-9_.]+\s+)?import\s+([a-zA-Z0-9_., ]+)/g) || [];

    const functions = functionMatches.map(m => m.replace('def ', ''));
    const classes = classMatches.map(m => m.replace('class ', '').split(':')[0]?.trim() || '');
    const imports = importMatches.map(m => m.split('import')[1]?.trim() || '');

    // Simple complexity estimation for Python
    const complexity = this.estimatePythonComplexity(content);

    return {
      ...baseContext,
      functions,
      classes,
      imports,
      exports: [], // Python exports are implicit
      complexity,
      maintainabilityIndex: this.calculateMaintainabilityIndex(baseContext.lines, complexity, functions.length + classes.length),
    };
  }

  private calculateCyclomaticComplexity(node: any): number {
    let complexity = 1; // Base complexity

    // Count decision points
    const decisionNodes = ['IfStatement', 'ConditionalExpression', 'LogicalExpression', 
                          'SwitchCase', 'WhileStatement', 'ForStatement', 'ForInStatement', 
                          'ForOfStatement', 'DoWhileStatement', 'CatchClause'];

    const countComplexity = (n: any) => {
      if (decisionNodes.includes(n.type)) {
        complexity++;
      }
      if (n.type === 'LogicalExpression' && (n.operator === '&&' || n.operator === '||')) {
        complexity++;
      }
    };

    // Simple traversal to count complexity
    const traverse = (n: any) => {
      if (!n || typeof n !== 'object') return;
      countComplexity(n);
      Object.values(n).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(traverse);
        } else if (value && typeof value === 'object') {
          traverse(value);
        }
      });
    };

    traverse(node.body);
    return complexity;
  }

  private estimatePythonComplexity(content: string): number {
    let complexity = 1;
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('if ') || trimmed.startsWith('elif ')) complexity++;
      if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) complexity++;
      if (trimmed.startsWith('try:') || trimmed.startsWith('except ')) complexity++;
      if (trimmed.includes(' and ') || trimmed.includes(' or ')) complexity++;
    }

    return complexity;
  }

  private calculateMaintainabilityIndex(lines: number, complexity: number, entities: number): number {
    // Simplified maintainability index calculation
    // Real formula: MI = 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)
    const halsteadVolume = Math.max(entities * 10, 1); // Simplified
    const mi = 171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(Math.max(lines, 1));
    return Math.max(0, Math.min(100, mi));
  }

  private determineFileType(extension: string): FileContext['type'] {
    const typeMap: Record<string, FileContext['type']> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
    };
    return typeMap[extension.toLowerCase()] || 'other';
  }

  private identifyFileIssues(fileContext: FileContext): Array<{ description: string; severity: 'low' | 'medium' | 'high' }> {
    const issues: Array<{ description: string; severity: 'low' | 'medium' | 'high' }> = [];

    if (fileContext.complexity > 20) {
      issues.push({ description: 'High cyclomatic complexity', severity: 'high' });
    } else if (fileContext.complexity > 10) {
      issues.push({ description: 'Moderate cyclomatic complexity', severity: 'medium' });
    }

    if (fileContext.lines > 1000) {
      issues.push({ description: 'Very large file', severity: 'high' });
    } else if (fileContext.lines > 500) {
      issues.push({ description: 'Large file', severity: 'medium' });
    }

    if (fileContext.maintainabilityIndex < 20) {
      issues.push({ description: 'Low maintainability index', severity: 'high' });
    } else if (fileContext.maintainabilityIndex < 40) {
      issues.push({ description: 'Below average maintainability', severity: 'medium' });
    }

    if (fileContext.functions.length > 50) {
      issues.push({ description: 'Too many functions in single file', severity: 'medium' });
    }

    return issues;
  }

  private calculateSeverity(issues: Array<{ severity: 'low' | 'medium' | 'high' }>): 'low' | 'medium' | 'high' {
    const hasHigh = issues.some(i => i.severity === 'high');
    const hasMedium = issues.some(i => i.severity === 'medium');
    
    if (hasHigh) return 'high';
    if (hasMedium) return 'medium';
    return 'low';
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
      : sorted[middle] ?? 0;
  }

  private generateRecommendations(
    files: FileContext[],
    hotspots: Array<{ path: string; issues: string[]; severity: 'low' | 'medium' | 'high' }>
  ): string[] {
    const recommendations: string[] = [];

    if (hotspots.filter(h => h.severity === 'high').length > 0) {
      recommendations.push('Prioritize refactoring files with high complexity to improve maintainability');
    }

    const largeFiles = files.filter(f => f.lines > 500);
    if (largeFiles.length > files.length * 0.1) {
      recommendations.push('Consider breaking down large files into smaller, more focused modules');
    }

    const lowMaintainability = files.filter(f => f.maintainabilityIndex < 40);
    if (lowMaintainability.length > 0) {
      recommendations.push('Improve code readability and reduce complexity in files with low maintainability scores');
    }

    const averageComplexity = files.reduce((sum, f) => sum + f.complexity, 0) / files.length;
    if (averageComplexity > 10) {
      recommendations.push('Overall codebase complexity is high - consider implementing coding standards and complexity limits');
    }

    if (files.some(f => f.functions.length === 0 && f.classes.length === 0 && f.lines > 50)) {
      recommendations.push('Some files appear to lack proper structure - consider organizing code into functions and classes');
    }

    return recommendations;
  }
}