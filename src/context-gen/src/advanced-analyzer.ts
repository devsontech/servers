import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@typescript-eslint/typescript-estree';
import { glob } from 'glob';
import {
  QualityMetrics,
  SecurityIssue,
  PerformanceBottleneck,
  TechnicalDebt,
  AdvancedAnalysisOptions,
} from './core/advanced-types.js';

export class AdvancedAnalyzer {
  /**
   * Analyzes code quality metrics including complexity, maintainability, and test coverage
   */
  async analyzeCodeQuality(
    projectPath: string,
    options: AdvancedAnalysisOptions = {}
  ): Promise<QualityMetrics> {
    const {
      includeComplexity = true,
      includeCoverage = true,
      includeSmells = true,
      thresholds = {}
    } = options;

    const sourceFiles = await this.findSourceFiles(projectPath);
    let totalComplexity = 0;
    let totalLines = 0;
    let totalFunctions = 0;
    const codeSmells: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      file: string;
      line: number;
      description: string;
    }> = [];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;
      totalLines += lines;

      try {
        const ast = parse(content, {
          loc: true,
          range: true,
          errorOnUnknownASTType: false,
        });

        // Calculate cyclomatic complexity
        if (includeComplexity) {
          const complexity = this.calculateComplexity(ast);
          totalComplexity += complexity;
        }

        // Count functions
        const functionCount = this.countFunctions(ast);
        totalFunctions += functionCount;

        // Detect code smells
        if (includeSmells) {
          const smells = this.detectCodeSmells(ast, filePath, content);
          codeSmells.push(...smells);
        }
      } catch (error) {
        // Skip files that can't be parsed
        console.warn(`Could not parse ${filePath}: ${error}`);
      }
    }

    // Calculate test coverage (mock implementation)
    let testCoverage = 0;
    if (includeCoverage) {
      testCoverage = await this.calculateTestCoverage(projectPath);
    }

    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      totalComplexity,
      totalLines,
      totalFunctions
    );

    return {
      complexity: {
        cyclomatic: totalComplexity,
        cognitive: Math.floor(totalComplexity * 1.2),
        average: totalFunctions > 0 ? totalComplexity / totalFunctions : 0,
        distribution: this.getComplexityDistribution(sourceFiles)
      },
      maintainability: {
        index: maintainabilityIndex,
        score: this.getMaintainabilityScore(maintainabilityIndex),
        factors: {
          complexity: totalComplexity > (thresholds.complexity || 10) ? 'high' : 'normal',
          size: totalLines > (thresholds.lines || 10000) ? 'large' : 'normal',
          duplication: codeSmells.filter(s => s.type === 'duplication').length > 5 ? 'high' : 'low'
        }
      },
      testCoverage: {
        lines: testCoverage,
        branches: testCoverage * 0.9,
        functions: testCoverage * 0.95,
        statements: testCoverage * 0.92
      },
      codeSmells: codeSmells.map(smell => ({
        type: smell.type,
        severity: smell.severity,
        location: {
          file: smell.file,
          line: smell.line
        },
        description: smell.description,
        impact: this.getSmellImpact(smell.type, smell.severity)
      })),
      metrics: {
        totalFiles: sourceFiles.length,
        totalLines,
        totalFunctions,
        averageLinesPerFile: Math.round(totalLines / sourceFiles.length),
        averageFunctionsPerFile: Math.round(totalFunctions / sourceFiles.length)
      },
      recommendations: this.generateQualityRecommendations(
        maintainabilityIndex,
        testCoverage,
        codeSmells.length,
        totalComplexity
      )
    };
  }

  /**
   * Performs security context analysis to identify vulnerabilities
   */
  async analyzeSecurityContext(
    projectPath: string,
    options: AdvancedAnalysisOptions = {}
  ): Promise<{
    vulnerabilities: SecurityIssue[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    compliance: {
      owasp: { passed: number; failed: number; score: number };
      cwe: { covered: string[]; missing: string[] };
    };
    recommendations: string[];
  }> {
    const {
      includeOWASP = true,
      includeCWE = true,
      scanDependencies = true
    } = options;

    const sourceFiles = await this.findSourceFiles(projectPath);
    const vulnerabilities: SecurityIssue[] = [];
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    // Scan source files for security issues
    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileVulnerabilities = this.scanFileForVulnerabilities(filePath, content);
      vulnerabilities.push(...fileVulnerabilities);
      
      fileVulnerabilities.forEach(vuln => {
        if (vuln.severity === 'high' || vuln.severity === 'critical') highRiskCount++;
        else if (vuln.severity === 'medium') mediumRiskCount++;
        else lowRiskCount++;
      });
    }

    // Scan dependencies if requested
    if (scanDependencies) {
      const depVulnerabilities = await this.scanDependencyVulnerabilities(projectPath);
      vulnerabilities.push(...depVulnerabilities);
    }

    // Calculate overall risk level
    const riskLevel = this.calculateSecurityRiskLevel(highRiskCount, mediumRiskCount, lowRiskCount);

    // OWASP compliance check
    const owaspCompliance = includeOWASP ? this.checkOWASPCompliance(vulnerabilities) : { passed: 0, failed: 0, score: 0 };

    // CWE coverage analysis
    const cweAnalysis = includeCWE ? this.analyzeCWECoverage(vulnerabilities) : { covered: [], missing: [] };

    return {
      vulnerabilities,
      riskLevel,
      compliance: {
        owasp: owaspCompliance,
        cwe: cweAnalysis
      },
      recommendations: this.generateSecurityRecommendations(vulnerabilities, riskLevel)
    };
  }

  /**
   * Detects performance bottlenecks in the codebase
   */
  async detectPerformanceBottlenecks(
    projectPath: string,
    options: AdvancedAnalysisOptions = {}
  ): Promise<{
    bottlenecks: PerformanceBottleneck[];
    hotspots: Array<{
      file: string;
      function: string;
      severity: 'low' | 'medium' | 'high';
      issues: string[];
      suggestions: string[];
    }>;
    metrics: {
      asyncPatterns: number;
      syncOperations: number;
      databaseCalls: number;
      networkRequests: number;
      heavyLoops: number;
    };
    recommendations: string[];
  }> {
    const {
      analyzeAsync = true,
      analyzeDatabaseCalls = true,
      analyzeLoops = true,
      memoryAnalysis = true
    } = options;

    const sourceFiles = await this.findSourceFiles(projectPath);
    const bottlenecks: PerformanceBottleneck[] = [];
    const hotspots: Array<{
      file: string;
      function: string;
      severity: 'low' | 'medium' | 'high';
      issues: string[];
      suggestions: string[];
    }> = [];

    let asyncPatterns = 0;
    let syncOperations = 0;
    let databaseCalls = 0;
    let networkRequests = 0;
    let heavyLoops = 0;

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      try {
        const ast = parse(content, {
          loc: true,
          range: true,
          errorOnUnknownASTType: false,
        });

        // Analyze async patterns
        if (analyzeAsync) {
          const asyncIssues = this.analyzeAsyncPatterns(ast, filePath);
          asyncPatterns += asyncIssues.patterns;
          syncOperations += asyncIssues.syncOps;
          bottlenecks.push(...asyncIssues.bottlenecks);
        }

        // Analyze database calls
        if (analyzeDatabaseCalls) {
          const dbIssues = this.analyzeDatabaseCalls(ast, filePath);
          databaseCalls += dbIssues.calls;
          bottlenecks.push(...dbIssues.bottlenecks);
        }

        // Analyze loops and iterations
        if (analyzeLoops) {
          const loopIssues = this.analyzeLoops(ast, filePath);
          heavyLoops += loopIssues.heavy;
          bottlenecks.push(...loopIssues.bottlenecks);
        }

        // Analyze network requests
        const networkIssues = this.analyzeNetworkRequests(ast, filePath);
        networkRequests += networkIssues.requests;
        bottlenecks.push(...networkIssues.bottlenecks);

        // Identify performance hotspots
        const fileHotspots = this.identifyPerformanceHotspots(ast, filePath);
        hotspots.push(...fileHotspots);

      } catch (error) {
        console.warn(`Could not analyze performance for ${filePath}: ${error}`);
      }
    }

    return {
      bottlenecks,
      hotspots,
      metrics: {
        asyncPatterns,
        syncOperations,
        databaseCalls,
        networkRequests,
        heavyLoops
      },
      recommendations: this.generatePerformanceRecommendations(bottlenecks, hotspots)
    };
  }

  /**
   * Assesses technical debt in the codebase
   */
  async assessTechnicalDebt(
    projectPath: string,
    options: AdvancedAnalysisOptions = {}
  ): Promise<{
    debt: TechnicalDebt[];
    summary: {
      total: number;
      byCategory: Record<string, number>;
      bySeverity: Record<string, number>;
      estimatedHours: number;
      interestRate: number;
    };
    prioritization: Array<{
      item: TechnicalDebt;
      priority: number;
      reasoning: string;
    }>;
    payoffStrategy: {
      quickWins: TechnicalDebt[];
      majorRefactors: TechnicalDebt[];
      longTermGoals: TechnicalDebt[];
    };
    recommendations: string[];
  }> {
    const {
      includeDocumentation = true,
      includeTestDebt = true,
      includeArchitecturalDebt = true,
      includeCodeDebt = true
    } = options;

    const sourceFiles = await this.findSourceFiles(projectPath);
    const debt: TechnicalDebt[] = [];
    const categories: Record<string, number> = {};
    const severities: Record<string, number> = {};
    let totalEstimatedHours = 0;

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      try {
        const ast = parse(content, {
          loc: true,
          range: true,
          errorOnUnknownASTType: false,
        });

        // Analyze code debt
        if (includeCodeDebt) {
          const codeDebt = this.analyzeCodeDebt(ast, filePath, content);
          debt.push(...codeDebt);
        }

        // Analyze test debt
        if (includeTestDebt) {
          const testDebt = this.analyzeTestDebt(ast, filePath);
          debt.push(...testDebt);
        }

        // Analyze documentation debt
        if (includeDocumentation) {
          const docDebt = this.analyzeDocumentationDebt(ast, filePath, content);
          debt.push(...docDebt);
        }

      } catch (error) {
        console.warn(`Could not analyze technical debt for ${filePath}: ${error}`);
      }
    }

    // Analyze architectural debt
    if (includeArchitecturalDebt) {
      const archDebt = await this.analyzeArchitecturalDebt(projectPath);
      debt.push(...archDebt);
    }

    // Calculate summary statistics
    debt.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
      severities[item.severity] = (severities[item.severity] || 0) + 1;
      totalEstimatedHours += item.estimatedHours;
    });

    // Calculate interest rate (compound effect of debt)
    const interestRate = this.calculateDebtInterestRate(debt);

    // Prioritize debt items
    const prioritization = this.prioritizeDebtItems(debt);

    // Create payoff strategy
    const payoffStrategy = this.createDebtPayoffStrategy(debt);

    return {
      debt,
      summary: {
        total: debt.length,
        byCategory: categories,
        bySeverity: severities,
        estimatedHours: totalEstimatedHours,
        interestRate
      },
      prioritization,
      payoffStrategy,
      recommendations: this.generateDebtRecommendations(debt, interestRate)
    };
  }

  // Helper methods for quality analysis
  private async findSourceFiles(projectPath: string): Promise<string[]> {
    const patterns = ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'];
    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*']
      });
      files.push(...matches);
    }
    
    return [...new Set(files)];
  }

  private calculateComplexity(ast: any): number {
    let complexity = 1; // Base complexity
    
    // Traverse AST and count decision points
    const traverse = (node: any) => {
      if (!node) return;
      
      switch (node.type) {
        case 'IfStatement':
        case 'ConditionalExpression':
        case 'SwitchCase':
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
        case 'CatchClause':
          complexity++;
          break;
        case 'LogicalExpression':
          if (node.operator === '&&' || node.operator === '||') {
            complexity++;
          }
          break;
      }
      
      // Recursively traverse child nodes
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(traverse);
        } else if (typeof child === 'object' && child !== null) {
          traverse(child);
        }
      }
    };
    
    traverse(ast);
    return complexity;
  }

  private countFunctions(ast: any): number {
    let count = 0;
    
    const traverse = (node: any) => {
      if (!node) return;
      
      if (node.type === 'FunctionDeclaration' || 
          node.type === 'FunctionExpression' || 
          node.type === 'ArrowFunctionExpression' ||
          node.type === 'MethodDefinition') {
        count++;
      }
      
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(traverse);
        } else if (typeof child === 'object' && child !== null) {
          traverse(child);
        }
      }
    };
    
    traverse(ast);
    return count;
  }

  private detectCodeSmells(ast: any, filePath: string, content: string): Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    file: string;
    line: number;
    description: string;
  }> {
    const smells: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      file: string;
      line: number;
      description: string;
    }> = [];

    // Check for long methods
    const lines = content.split('\n');
    if (lines.length > 100) {
      smells.push({
        type: 'long_method',
        severity: 'medium',
        file: filePath,
        line: 1,
        description: `File is too long (${lines.length} lines)`
      });
    }

    // Check for TODO/FIXME comments
    lines.forEach((line, index) => {
      if (line.includes('TODO') || line.includes('FIXME')) {
        smells.push({
          type: 'todo_comment',
          severity: 'low',
          file: filePath,
          line: index + 1,
          description: 'TODO or FIXME comment found'
        });
      }
    });

    return smells;
  }

  private async calculateTestCoverage(projectPath: string): Promise<number> {
    // Mock test coverage calculation
    // In a real implementation, you'd integrate with coverage tools
    const testFiles = await glob('**/*.test.*', { cwd: projectPath });
    const sourceFiles = await this.findSourceFiles(projectPath);
    
    if (sourceFiles.length === 0) return 0;
    
    // Simple heuristic: coverage based on test file ratio
    const coverageRatio = Math.min(testFiles.length / sourceFiles.length, 1);
    return Math.round(coverageRatio * 85); // Mock coverage percentage
  }

  private calculateMaintainabilityIndex(complexity: number, lines: number, functions: number): number {
    // Simplified maintainability index calculation
    const volume = Math.log2(functions + 1) * lines;
    const complexity_factor = Math.log(complexity + 1);
    const index = Math.max(0, (171 - 5.2 * complexity_factor - 0.23 * volume) * 100 / 171);
    return Math.round(index);
  }

  private getMaintainabilityScore(index: number): 'excellent' | 'good' | 'moderate' | 'difficult' | 'unmaintainable' {
    if (index >= 85) return 'excellent';
    if (index >= 70) return 'good';
    if (index >= 50) return 'moderate';
    if (index >= 25) return 'difficult';
    return 'unmaintainable';
  }

  private getComplexityDistribution(files: string[]): Record<string, number> {
    // Mock complexity distribution
    return {
      'low (1-5)': Math.floor(files.length * 0.6),
      'medium (6-10)': Math.floor(files.length * 0.3),
      'high (11-20)': Math.floor(files.length * 0.08),
      'very_high (21+)': Math.floor(files.length * 0.02)
    };
  }

  private getSmellImpact(type: string, severity: 'low' | 'medium' | 'high'): string {
    const impacts: Record<string, Record<string, string>> = {
      long_method: {
        low: 'Minor readability impact',
        medium: 'Moderate maintenance burden',
        high: 'Significant refactoring needed'
      },
      todo_comment: {
        low: 'Documentation reminder',
        medium: 'Pending work item',
        high: 'Critical issue to address'
      }
    };
    
    return impacts[type]?.[severity] || 'Unknown impact';
  }

  private generateQualityRecommendations(
    maintainabilityIndex: number,
    testCoverage: number,
    smellCount: number,
    complexity: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (maintainabilityIndex < 50) {
      recommendations.push('Consider refactoring complex methods to improve maintainability');
    }
    
    if (testCoverage < 70) {
      recommendations.push('Increase test coverage to at least 70%');
    }
    
    if (smellCount > 10) {
      recommendations.push('Address code smells to improve code quality');
    }
    
    if (complexity > 100) {
      recommendations.push('Break down complex functions into smaller, more manageable pieces');
    }
    
    return recommendations;
  }

  // Security analysis helper methods
  private scanFileForVulnerabilities(filePath: string, content: string): SecurityIssue[] {
    const vulnerabilities: SecurityIssue[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for SQL injection patterns
      if (line.match(/SELECT.*\+.*FROM|INSERT.*\+.*VALUES/i)) {
        vulnerabilities.push({
          type: 'sql_injection',
          severity: 'high',
          location: { file: filePath, line: index + 1, column: 1 },
          description: 'Potential SQL injection vulnerability detected',
          cwe: 'CWE-89',
          owasp: 'A03:2021 – Injection',
          remediation: 'Use parameterized queries or prepared statements'
        });
      }
      
      // Check for XSS patterns
      if (line.match(/innerHTML.*\+|document\.write\(/i)) {
        vulnerabilities.push({
          type: 'xss',
          severity: 'medium',
          location: { file: filePath, line: index + 1, column: 1 },
          description: 'Potential XSS vulnerability detected',
          cwe: 'CWE-79',
          owasp: 'A03:2021 – Injection',
          remediation: 'Sanitize user input and use safe DOM manipulation methods'
        });
      }
      
      // Check for hardcoded secrets
      if (line.match(/password\s*=\s*['"]|api_key\s*=\s*['"]|secret\s*=\s*['"]/i)) {
        vulnerabilities.push({
          type: 'hardcoded_secret',
          severity: 'high',
          location: { file: filePath, line: index + 1, column: 1 },
          description: 'Hardcoded secret detected',
          cwe: 'CWE-798',
          owasp: 'A07:2021 – Identification and Authentication Failures',
          remediation: 'Move secrets to environment variables or secure configuration'
        });
      }
    });
    
    return vulnerabilities;
  }

  private async scanDependencyVulnerabilities(projectPath: string): Promise<SecurityIssue[]> {
    // Mock dependency vulnerability scanning
    const vulnerabilities: SecurityIssue[] = [];
    
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Mock vulnerability for demo purposes
        if (dependencies['lodash'] && dependencies['lodash'].startsWith('^4.17.0')) {
          vulnerabilities.push({
            type: 'vulnerable_dependency',
            severity: 'medium',
            location: { file: packageJsonPath, line: 1, column: 1 },
            description: 'Lodash version has known vulnerabilities',
            cwe: 'CWE-1104',
            owasp: 'A06:2021 – Vulnerable and Outdated Components',
            remediation: 'Update lodash to version 4.17.21 or later'
          });
        }
      }
    } catch (error) {
      console.warn('Could not scan dependencies:', error);
    }
    
    return vulnerabilities;
  }

  private calculateSecurityRiskLevel(high: number, medium: number, low: number): 'low' | 'medium' | 'high' | 'critical' {
    if (high > 5) return 'critical';
    if (high > 0 || medium > 10) return 'high';
    if (medium > 3 || low > 20) return 'medium';
    return 'low';
  }

  private checkOWASPCompliance(vulnerabilities: SecurityIssue[]): { passed: number; failed: number; score: number } {
    const owaspCategories = new Set(vulnerabilities.map(v => v.owasp));
    const totalCategories = 10; // OWASP Top 10
    const failed = owaspCategories.size;
    const passed = totalCategories - failed;
    const score = Math.round((passed / totalCategories) * 100);
    
    return { passed, failed, score };
  }

  private analyzeCWECoverage(vulnerabilities: SecurityIssue[]): { covered: string[]; missing: string[] } {
    const covered = [...new Set(vulnerabilities.map(v => v.cwe))];
    const commonCWEs = ['CWE-79', 'CWE-89', 'CWE-22', 'CWE-352', 'CWE-798', 'CWE-1104'];
    const missing = commonCWEs.filter(cwe => !covered.includes(cwe));
    
    return { covered, missing };
  }

  private generateSecurityRecommendations(vulnerabilities: SecurityIssue[], riskLevel: string): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Immediately address high-severity vulnerabilities');
      recommendations.push('Implement security code review process');
    }
    
    if (vulnerabilities.some(v => v.type === 'sql_injection')) {
      recommendations.push('Implement parameterized queries across all database interactions');
    }
    
    if (vulnerabilities.some(v => v.type === 'xss')) {
      recommendations.push('Implement input validation and output encoding');
    }
    
    if (vulnerabilities.some(v => v.type === 'hardcoded_secret')) {
      recommendations.push('Move all secrets to secure configuration management');
    }
    
    recommendations.push('Regular security dependency updates');
    recommendations.push('Implement automated security scanning in CI/CD');
    
    return recommendations;
  }

  // Performance analysis helper methods
  private analyzeAsyncPatterns(ast: any, filePath: string): {
    patterns: number;
    syncOps: number;
    bottlenecks: PerformanceBottleneck[];
  } {
    let patterns = 0;
    let syncOps = 0;
    const bottlenecks: PerformanceBottleneck[] = [];
    
    const traverse = (node: any) => {
      if (!node) return;
      
      if (node.type === 'AwaitExpression') {
        patterns++;
      } else if (node.type === 'CallExpression') {
        const callee = node.callee;
        if (callee.type === 'MemberExpression' && 
            callee.property.name && 
            ['readFileSync', 'writeFileSync', 'execSync'].includes(callee.property.name)) {
          syncOps++;
          bottlenecks.push({
            type: 'synchronous_operation',
            severity: 'medium',
            location: { file: filePath, line: node.loc?.start.line || 1, function: 'unknown' },
            description: `Synchronous operation: ${callee.property.name}`,
            impact: 'Blocks event loop and reduces concurrency',
            suggestion: `Replace ${callee.property.name} with async equivalent`
          });
        }
      }
      
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(traverse);
        } else if (typeof child === 'object' && child !== null) {
          traverse(child);
        }
      }
    };
    
    traverse(ast);
    return { patterns, syncOps, bottlenecks };
  }

  private analyzeDatabaseCalls(ast: any, filePath: string): {
    calls: number;
    bottlenecks: PerformanceBottleneck[];
  } {
    let calls = 0;
    const bottlenecks: PerformanceBottleneck[] = [];
    
    const traverse = (node: any) => {
      if (!node) return;
      
      if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
        const methodName = node.callee.property.name;
        if (['query', 'execute', 'find', 'findOne', 'save', 'update', 'delete'].includes(methodName)) {
          calls++;
          
          // Check for N+1 query pattern (simplified detection)
          let parent = node.parent;
          while (parent && parent.type !== 'ForStatement' && parent.type !== 'WhileStatement') {
            parent = parent.parent;
          }
          
          if (parent) {
            bottlenecks.push({
              type: 'n_plus_one_query',
              severity: 'high',
              location: { file: filePath, line: node.loc?.start.line || 1, function: 'unknown' },
              description: 'Potential N+1 query pattern detected',
              impact: 'Multiple database queries in loop causing performance degradation',
              suggestion: 'Use batch queries or eager loading to reduce database calls'
            });
          }
        }
      }
      
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((c) => {
            if (typeof c === 'object' && c !== null) {
              c.parent = node;
              traverse(c);
            }
          });
        } else if (typeof child === 'object' && child !== null) {
          child.parent = node;
          traverse(child);
        }
      }
    };
    
    traverse(ast);
    return { calls, bottlenecks };
  }

  private analyzeLoops(ast: any, filePath: string): {
    heavy: number;
    bottlenecks: PerformanceBottleneck[];
  } {
    let heavy = 0;
    const bottlenecks: PerformanceBottleneck[] = [];
    
    const traverse = (node: any) => {
      if (!node) return;
      
      if (['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForInStatement', 'ForOfStatement'].includes(node.type)) {
        // Check for nested loops
        let nestedLoopCount = 0;
        const countNestedLoops = (n: any) => {
          if (!n) return;
          if (['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForInStatement', 'ForOfStatement'].includes(n.type)) {
            nestedLoopCount++;
          }
          for (const key in n) {
            const child = n[key];
            if (Array.isArray(child)) {
              child.forEach(countNestedLoops);
            } else if (typeof child === 'object' && child !== null) {
              countNestedLoops(child);
            }
          }
        };
        countNestedLoops(node.body);
        
        if (nestedLoopCount > 1) {
          heavy++;
          bottlenecks.push({
            type: 'nested_loop',
            severity: nestedLoopCount > 2 ? 'high' : 'medium',
            location: { file: filePath, line: node.loc?.start.line || 1, function: 'unknown' },
            description: `${nestedLoopCount + 1}-level nested loop detected`,
            impact: `O(n^${nestedLoopCount + 1}) time complexity`,
            suggestion: 'Consider algorithmic optimization or caching to reduce complexity'
          });
        }
      }
      
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(traverse);
        } else if (typeof child === 'object' && child !== null) {
          traverse(child);
        }
      }
    };
    
    traverse(ast);
    return { heavy, bottlenecks };
  }

  private analyzeNetworkRequests(ast: any, filePath: string): {
    requests: number;
    bottlenecks: PerformanceBottleneck[];
  } {
    let requests = 0;
    const bottlenecks: PerformanceBottleneck[] = [];
    
    const traverse = (node: any) => {
      if (!node) return;
      
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        if ((callee.type === 'Identifier' && ['fetch', 'axios', 'request'].includes(callee.name)) ||
            (callee.type === 'MemberExpression' && 
             ['get', 'post', 'put', 'delete', 'patch'].includes(callee.property.name))) {
          requests++;
          
          // Check if request is in a loop
          let parent = node.parent;
          while (parent) {
            if (['ForStatement', 'WhileStatement', 'ForInStatement', 'ForOfStatement'].includes(parent.type)) {
              bottlenecks.push({
                type: 'multiple_http_requests',
                severity: 'medium',
                location: { file: filePath, line: node.loc?.start.line || 1, function: 'unknown' },
                description: 'HTTP request inside loop detected',
                impact: 'Multiple sequential network requests causing latency',
                suggestion: 'Consider batch requests or parallel processing'
              });
              break;
            }
            parent = parent.parent;
          }
        }
      }
      
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((c) => {
            if (typeof c === 'object' && c !== null) {
              c.parent = node;
              traverse(c);
            }
          });
        } else if (typeof child === 'object' && child !== null) {
          child.parent = node;
          traverse(child);
        }
      }
    };
    
    traverse(ast);
    return { requests, bottlenecks };
  }

  private identifyPerformanceHotspots(ast: any, filePath: string): Array<{
    file: string;
    function: string;
    severity: 'low' | 'medium' | 'high';
    issues: string[];
    suggestions: string[];
  }> {
    const hotspots: Array<{
      file: string;
      function: string;
      severity: 'low' | 'medium' | 'high';
      issues: string[];
      suggestions: string[];
    }> = [];
    
    const traverse = (node: any, functionName: string = 'anonymous') => {
      if (!node) return;
      
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
        const name = node.id?.name || functionName;
        const issues: string[] = [];
        const suggestions: string[] = [];
        
        // Analyze function body for performance issues
        let complexity = this.calculateComplexity(node);
        if (complexity > 10) {
          issues.push(`High cyclomatic complexity: ${complexity}`);
          suggestions.push('Break down function into smaller components');
        }
        
        if (issues.length > 0) {
          hotspots.push({
            file: filePath,
            function: name,
            severity: complexity > 20 ? 'high' : complexity > 10 ? 'medium' : 'low',
            issues,
            suggestions
          });
        }
      }
      
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((c) => traverse(c, functionName));
        } else if (typeof child === 'object' && child !== null) {
          traverse(child, functionName);
        }
      }
    };
    
    traverse(ast);
    return hotspots;
  }

  private generatePerformanceRecommendations(
    bottlenecks: PerformanceBottleneck[],
    hotspots: Array<{ severity: string; issues: string[] }>
  ): string[] {
    const recommendations: string[] = [];
    
    if (bottlenecks.some(b => b.type === 'synchronous_operation')) {
      recommendations.push('Replace synchronous operations with asynchronous alternatives');
    }
    
    if (bottlenecks.some(b => b.type === 'n_plus_one_query')) {
      recommendations.push('Implement query batching and eager loading for database operations');
    }
    
    if (bottlenecks.some(b => b.type === 'nested_loop')) {
      recommendations.push('Optimize algorithms with nested loops using better data structures');
    }
    
    if (bottlenecks.some(b => b.type === 'multiple_http_requests')) {
      recommendations.push('Implement request batching and parallel processing for network calls');
    }
    
    if (hotspots.some(h => h.severity === 'high')) {
      recommendations.push('Refactor high-complexity functions to improve performance');
    }
    
    recommendations.push('Implement performance monitoring and profiling');
    recommendations.push('Consider caching strategies for frequently accessed data');
    
    return recommendations;
  }

  // Technical debt analysis helper methods
  private analyzeCodeDebt(ast: any, filePath: string, content: string): TechnicalDebt[] {
    const debt: TechnicalDebt[] = [];
    const lines = content.split('\n');
    
    // Check for code duplication (simplified)
    const duplicatedBlocks = this.findDuplicatedCode(content);
    if (duplicatedBlocks.length > 0) {
      const firstDuplicate = duplicatedBlocks[0];
      if (firstDuplicate) {
        debt.push({
          type: 'code_duplication',
          category: 'design',
          severity: 'medium',
          location: { file: filePath, line: firstDuplicate.line, function: 'multiple' },
          description: `${duplicatedBlocks.length} duplicated code blocks found`,
          impact: 'Increased maintenance burden and inconsistency risk',
          estimatedHours: duplicatedBlocks.length * 2,
          priority: 'medium',
          tags: ['refactoring', 'maintainability']
        });
      }
    }
    
    // Check for large functions
    const traverse = (node: any) => {
      if (!node) return;
      
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        const startLine = node.loc?.start.line || 1;
        const endLine = node.loc?.end.line || 1;
        const functionLines = endLine - startLine;
        
        if (functionLines > 50) {
          debt.push({
            type: 'large_function',
            category: 'design',
            severity: functionLines > 100 ? 'high' : 'medium',
            location: { file: filePath, line: startLine, function: node.id?.name || 'anonymous' },
            description: `Function is too large (${functionLines} lines)`,
            impact: 'Difficult to understand, test, and maintain',
            estimatedHours: Math.ceil(functionLines / 20),
            priority: 'medium',
            tags: ['refactoring', 'complexity']
          });
        }
      }
      
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(traverse);
        } else if (typeof child === 'object' && child !== null) {
          traverse(child);
        }
      }
    };
    
    traverse(ast);
    return debt;
  }

  private analyzeTestDebt(ast: any, filePath: string): TechnicalDebt[] {
    const debt: TechnicalDebt[] = [];
    
    // Check if file is a test file
    if (!filePath.includes('.test.') && !filePath.includes('.spec.')) {
      const functionCount = this.countFunctions(ast);
      if (functionCount > 0) {
        debt.push({
          type: 'missing_tests',
          category: 'testing',
          severity: 'medium',
          location: { file: filePath, line: 1, function: 'all' },
          description: `${functionCount} functions without corresponding tests`,
          impact: 'Reduced confidence in code changes and potential bugs',
          estimatedHours: functionCount * 0.5,
          priority: 'high',
          tags: ['testing', 'coverage']
        });
      }
    }
    
    return debt;
  }

  private analyzeDocumentationDebt(ast: any, filePath: string, content: string): TechnicalDebt[] {
    const debt: TechnicalDebt[] = [];
    
    // Check for functions without JSDoc
    const traverse = (node: any) => {
      if (!node) return;
      
      if (node.type === 'FunctionDeclaration' && node.id?.name) {
        const functionStart = node.loc?.start.line || 1;
        const lines = content.split('\n');
        const precedingLine = lines[functionStart - 2] || '';
        
        if (!precedingLine.trim().startsWith('/**') && !precedingLine.trim().startsWith('//')) {
          debt.push({
            type: 'missing_documentation',
            category: 'documentation',
            severity: 'low',
            location: { file: filePath, line: functionStart, function: node.id.name },
            description: `Function '${node.id.name}' lacks documentation`,
            impact: 'Reduced code comprehension for team members',
            estimatedHours: 0.25,
            priority: 'low',
            tags: ['documentation', 'maintainability']
          });
        }
      }
      
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(traverse);
        } else if (typeof child === 'object' && child !== null) {
          traverse(child);
        }
      }
    };
    
    traverse(ast);
    return debt;
  }

  private async analyzeArchitecturalDebt(projectPath: string): Promise<TechnicalDebt[]> {
    const debt: TechnicalDebt[] = [];
    
    // Check for outdated dependencies
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Mock check for outdated packages
        let outdatedCount = 0;
        for (const [pkg, version] of Object.entries(dependencies)) {
          if (typeof version === 'string' && version.startsWith('^')) {
            const versionNumber = version.substring(1).split('.')[0];
            if (versionNumber && parseInt(versionNumber) < 3) {
              outdatedCount++;
            }
          }
        }
        
        if (outdatedCount > 0) {
          debt.push({
            type: 'outdated_dependencies',
            category: 'architecture',
            severity: 'medium',
            location: { file: packageJsonPath, line: 1, function: 'dependencies' },
            description: `${outdatedCount} potentially outdated dependencies`,
            impact: 'Security vulnerabilities and missing features',
            estimatedHours: outdatedCount * 1,
            priority: 'high',
            tags: ['dependencies', 'security', 'maintenance']
          });
        }
      }
    } catch (error) {
      console.warn('Could not analyze dependencies:', error);
    }
    
    return debt;
  }

  private findDuplicatedCode(content: string): Array<{ line: number; block: string }> {
    // Simplified duplication detection
    const lines = content.split('\n');
    const duplicates: Array<{ line: number; block: string }> = [];
    
    for (let i = 0; i < lines.length - 5; i++) {
      const block = lines.slice(i, i + 5).join('\n').trim();
      if (block.length > 50) {
        for (let j = i + 5; j < lines.length - 5; j++) {
          const otherBlock = lines.slice(j, j + 5).join('\n').trim();
          if (block === otherBlock && block.length > 0) {
            duplicates.push({ line: i + 1, block });
            break;
          }
        }
      }
    }
    
    return duplicates;
  }

  private prioritizeDebtItems(debt: TechnicalDebt[]): Array<{
    item: TechnicalDebt;
    priority: number;
    reasoning: string;
  }> {
    return debt.map(item => {
      let priority = 50; // Base priority
      
      // Adjust based on severity
      if (item.severity === 'high') priority += 30;
      else if (item.severity === 'medium') priority += 15;
      
      // Adjust based on category
      if (item.category === 'security') priority += 25;
      else if (item.category === 'architecture') priority += 20;
      else if (item.category === 'testing') priority += 15;
      
      // Adjust based on estimated hours (lower hours = higher priority for quick wins)
      if (item.estimatedHours < 2) priority += 10;
      else if (item.estimatedHours > 10) priority -= 5;
      
      const reasoning = `Priority calculated based on severity (${item.severity}), category (${item.category}), and effort (${item.estimatedHours}h)`;
      
      return { item, priority: Math.min(100, Math.max(0, priority)), reasoning };
    }).sort((a, b) => b.priority - a.priority);
  }

  private createDebtPayoffStrategy(debt: TechnicalDebt[]): {
    quickWins: TechnicalDebt[];
    majorRefactors: TechnicalDebt[];
    longTermGoals: TechnicalDebt[];
  } {
    const quickWins = debt.filter(d => d.estimatedHours <= 2);
    const majorRefactors = debt.filter(d => d.estimatedHours > 2 && d.estimatedHours <= 20);
    const longTermGoals = debt.filter(d => d.estimatedHours > 20);
    
    return { quickWins, majorRefactors, longTermGoals };
  }

  private calculateDebtInterestRate(debt: TechnicalDebt[]): number {
    // Calculate compound interest rate of technical debt
    let totalImpact = 0;
    let highSeverityCount = 0;
    
    debt.forEach(item => {
      if (item.severity === 'high') {
        totalImpact += 3;
        highSeverityCount++;
      } else if (item.severity === 'medium') {
        totalImpact += 2;
      } else {
        totalImpact += 1;
      }
    });
    
    // Calculate interest rate as percentage
    const baseRate = Math.min(50, totalImpact);
    const compoundEffect = Math.min(20, highSeverityCount * 2);
    
    return Math.round(baseRate + compoundEffect);
  }

  private generateDebtRecommendations(debt: TechnicalDebt[], interestRate: number): string[] {
    const recommendations: string[] = [];
    
    if (interestRate > 40) {
      recommendations.push('Critical: Technical debt is severely impacting development velocity');
      recommendations.push('Allocate 50% of development time to debt reduction');
    } else if (interestRate > 25) {
      recommendations.push('High debt levels detected - dedicate sprint cycles to debt reduction');
      recommendations.push('Implement code review standards to prevent new debt');
    } else {
      recommendations.push('Moderate debt levels - address during regular development cycles');
    }
    
    const quickWins = debt.filter(d => d.estimatedHours <= 2);
    if (quickWins.length > 0) {
      recommendations.push(`Start with ${quickWins.length} quick wins to build momentum`);
    }
    
    const securityDebt = debt.filter(d => d.category === 'security');
    if (securityDebt.length > 0) {
      recommendations.push('Prioritize security-related debt items immediately');
    }
    
    recommendations.push('Establish debt tracking and regular review processes');
    recommendations.push('Set team debt reduction targets and metrics');
    
    return recommendations;
  }
}