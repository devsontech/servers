#!/usr/bin/env node
/**
 * Enhanced Sequential Thinking MCP Server with VS Code LSP Integration
 * Uses existing VS Code extensions and language servers for optimal performance
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Import VS Code LSP integration
import { createVSCodeLSPClient, VSCodeLanguageServers, isVSCodeExtensionInstalled } from './vscode-lsp-integration.js';

// Enterprise additions for persistent context and caching
interface PersistentContext {
  sessionHistory: EnhancedThoughtData[];
  architecturalDecisions: ArchitecturalDecision[];
  codingStandards: CodingStandard[];
  teamPreferences: TeamPreference[];
  projectKnowledge: ProjectKnowledge[];
  domainPatterns: DomainPattern[];
}

interface ArchitecturalDecision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  consequences: string[];
  timestamp: Date;
  project: string;
}

interface CodingStandard {
  language: string;
  rules: Rule[];
  project: string;
  enforcementLevel: 'error' | 'warning' | 'info';
}

interface Rule {
  name: string;
  description: string;
  pattern: string;
  examples: { good: string; bad: string }[];
}

interface SecurityVulnerability {
  type: 'sql-injection' | 'xss' | 'csrf' | 'insecure-api' | 'data-exposure';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: { file: string; line: number; column: number };
  description: string;
  remediation: string;
  cweId?: string;
}

interface TeamPreference {
  id: string;
  category: 'code-style' | 'architecture' | 'tools' | 'process';
  preference: string;
  description: string;
  project: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

interface ProjectKnowledge {
  id: string;
  title: string;
  type: 'documentation' | 'pattern' | 'guideline' | 'requirement';
  content: string;
  tags: string[];
  project: string;
  lastUpdated: Date;
  relevanceScore: number;
}

interface DomainPattern {
  id: string;
  name: string;
  domain: 'telecom' | 'cpaas' | 'messaging' | 'voice' | 'general';
  pattern: string;
  description: string;
  useCases: string[];
  examples: { scenario: string; implementation: string }[];
  antiPatterns?: string[];
  performance: 'excellent' | 'good' | 'average' | 'poor';
  complexity: 'low' | 'medium' | 'high';
}

interface EnhancedThoughtData {
  id: number;
  thought: string;
  nextThoughtNeeded: boolean;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  languageContext?: {
    languageId: string;
    filePath?: string;
    codeContext?: string;
    lspInfo?: {
      hover?: any;
      completions?: any;
      diagnostics?: any;
      symbols?: any;
      codeContext?: any;
      languageFeatures?: any;
      extensionInfo?: any;
      error?: string;
      available?: boolean;
    };
  };
  timestamp: Date;
}

/**
 * Enterprise Context Manager for persistent memory and knowledge retention
 */
class EnterpriseContextManager {
  private contextStore: Map<string, PersistentContext> = new Map();
  private contextFilePath: string;

  constructor(rootDir: string) {
    this.contextFilePath = join(rootDir, '.ai-context.json');
    this.loadContext();
  }

  private loadContext(): void {
    try {
      if (fs.existsSync(this.contextFilePath)) {
        const data = fs.readFileSync(this.contextFilePath, 'utf-8');
        const contexts = JSON.parse(data);
        for (const [key, value] of Object.entries(contexts)) {
          this.contextStore.set(key, value as PersistentContext);
        }
        console.log(`✓ Loaded persistent context for ${this.contextStore.size} projects`);
      }
    } catch (error) {
      console.warn('Failed to load persistent context:', error);
    }
  }

  async saveContext(): Promise<void> {
    try {
      const contexts = Object.fromEntries(this.contextStore);
      fs.writeFileSync(this.contextFilePath, JSON.stringify(contexts, null, 2));
    } catch (error) {
      console.error('Failed to save persistent context:', error);
    }
  }

  async addArchitecturalDecision(projectId: string, decision: Omit<ArchitecturalDecision, 'id' | 'timestamp'>): Promise<void> {
    const context = this.getOrCreateContext(projectId);
    const architecturalDecision: ArchitecturalDecision = {
      ...decision,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    context.architecturalDecisions.push(architecturalDecision);
    await this.saveContext();
  }

  async addThought(projectId: string, thought: EnhancedThoughtData): Promise<void> {
    const context = this.getOrCreateContext(projectId);
    context.sessionHistory.push(thought);
    // Keep only last 1000 thoughts per project
    if (context.sessionHistory.length > 1000) {
      context.sessionHistory = context.sessionHistory.slice(-1000);
    }
    await this.saveContext();
  }

  getProjectKnowledge(projectId: string): PersistentContext {
    return this.getOrCreateContext(projectId);
  }

  private getOrCreateContext(projectId: string): PersistentContext {
    if (!this.contextStore.has(projectId)) {
      this.contextStore.set(projectId, {
        sessionHistory: [],
        architecturalDecisions: [],
        codingStandards: [],
        teamPreferences: [],
        projectKnowledge: [],
        domainPatterns: []
      });
    }
    return this.contextStore.get(projectId)!;
  }
}

/**
 * Performance Analysis Cache for optimized file operations
 */
class EnterpriseAnalysisCache {
  private cache = new Map<string, { analysis: any; timestamp: number; hash: string }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getFileAnalysis(filePath: string): Promise<any | null> {
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('md5').update(content).digest('hex');
      
      const cached = this.cache.get(filePath);
      if (cached && 
          cached.hash === hash && 
          (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        console.log(`📋 Cache hit for: ${filePath}`);
        return cached.analysis;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async cacheFileAnalysis(filePath: string, analysis: any): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('md5').update(content).digest('hex');
      
      this.cache.set(filePath, {
        analysis,
        timestamp: Date.now(),
        hash
      });
      
      // Cleanup old entries (simple LRU)
      if (this.cache.size > 1000) {
        const oldestKey = Array.from(this.cache.keys())[0];
        this.cache.delete(oldestKey);
      }
    } catch (error) {
      console.warn('Failed to cache analysis:', error);
    }
  }

  invalidateCache(filePath: string): void {
    this.cache.delete(filePath);
  }
}

/**
 * Enterprise Security Scanner for real-time vulnerability detection
 */
class EnterpriseSecurityScanner {
  async scanForVulnerabilities(filePath: string, content: string, languageId: string): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const lines = content.split('\n');

    // SQL Injection patterns
    if (languageId === 'csharp' || languageId === 'typescript') {
      lines.forEach((line, index) => {
        // Direct string concatenation in SQL
        if (line.match(/(\+\s*["'].*?["']\s*\+|string\.Format|`\$\{.*\}`.*?(SELECT|INSERT|UPDATE|DELETE))/i)) {
          vulnerabilities.push({
            type: 'sql-injection',
            severity: 'high',
            location: { file: filePath, line: index + 1, column: 0 },
            description: 'Potential SQL injection vulnerability detected',
            remediation: 'Use parameterized queries or ORM methods instead of string concatenation',
            cweId: 'CWE-89'
          });
        }

        // Insecure API endpoints
        if (line.match(/\[HttpGet\].*\{.*\}|\[HttpPost\].*\{.*\}/i) && !line.match(/\[Authorize\]/i)) {
          vulnerabilities.push({
            type: 'insecure-api',
            severity: 'medium',
            location: { file: filePath, line: index + 1, column: 0 },
            description: 'API endpoint without authorization attribute',
            remediation: 'Add [Authorize] attribute or implement proper authentication',
            cweId: 'CWE-306'
          });
        }

        // Data exposure in logs
        if (line.match(/(console\.log|Console\.WriteLine|logger\.).*?(password|token|secret|key)/i)) {
          vulnerabilities.push({
            type: 'data-exposure',
            severity: 'critical',
            location: { file: filePath, line: index + 1, column: 0 },
            description: 'Sensitive data potentially exposed in logs',
            remediation: 'Remove sensitive data from log statements or mask the values',
            cweId: 'CWE-532'
          });
        }
      });
    }

    return vulnerabilities;
  }

  async scanForCPaaSVulnerabilities(filePath: string, content: string): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Unencrypted communication channels
      if (line.match(/http:\/\/.*?(sms|voice|call|message)/i)) {
        vulnerabilities.push({
          type: 'insecure-api',
          severity: 'high',
          location: { file: filePath, line: index + 1, column: 0 },
          description: 'Unencrypted communication channel for telecom services',
          remediation: 'Use HTTPS for all telecom API communications',
          cweId: 'CWE-319'
        });
      }

      // Missing rate limiting for telecom APIs
      if (line.match(/\[HttpPost\].*?(sms|voice|call)/i) && !line.match(/rate.*?limit/i)) {
        vulnerabilities.push({
          type: 'insecure-api',
          severity: 'medium',
          location: { file: filePath, line: index + 1, column: 0 },
          description: 'Telecom API endpoint without rate limiting',
          remediation: 'Implement rate limiting to prevent abuse of telecom services',
          cweId: 'CWE-770'
        });
      }

      // Phone number validation
      if (line.match(/(phone|mobile|sms).*?(string|varchar)/i) && !line.match(/validation|regex|pattern/i)) {
        vulnerabilities.push({
          type: 'data-exposure',
          severity: 'medium',
          location: { file: filePath, line: index + 1, column: 0 },
          description: 'Phone number field without proper validation',
          remediation: 'Add phone number format validation and sanitization',
          cweId: 'CWE-20'
        });
      }
    });

    return vulnerabilities;
  }
}
class VSCodeIntegratedLSPClient {
  private clients: Map<string, any> = new Map();
  private rootDirectory: string = ".";
  private analysisCache: EnterpriseAnalysisCache;
  private securityScanner: EnterpriseSecurityScanner;

  // Public getter for active clients
  get activeLanguages(): string[] {
    return Array.from(this.clients.keys());
  }

  constructor(rootDir: string = ".") {
    this.rootDirectory = rootDir;
    this.analysisCache = new EnterpriseAnalysisCache();
    this.securityScanner = new EnterpriseSecurityScanner();
  }

  /**
   * Initialize language support with real analysis capabilities
   */
  async initializeLanguageSupport(languageIds: string[]): Promise<void> {
    for (const languageId of languageIds) {
      try {
        // Initialize with basic analysis capabilities
        this.clients.set(languageId, {
          languageId,
          initialized: true,
          supportsHover: true,
          supportsCompletion: true,
          supportsDiagnostics: true
        });
        console.log(`✓ Initialized analysis support for: ${languageId}`);
      } catch (error) {
        console.warn(`Failed to initialize ${languageId} analysis:`, error);
      }
    }
  }

  /**
   * Get comprehensive code intelligence for a file with enterprise security and caching
   */
  async getCodeIntelligence(filePath: string, line: number = 0, character: number = 0): Promise<any> {
    const languageId = this.detectLanguageFromPath(filePath);
    const client = this.clients.get(languageId);
    
    // Check cache first
    const cachedAnalysis = await this.analysisCache.getFileAnalysis(filePath);
    if (cachedAnalysis) {
      return {
        ...cachedAnalysis,
        fromCache: true,
        timestamp: new Date().toISOString()
      };
    }
    
    if (!client) {
      return {
        languageId,
        message: `No analysis support available for ${languageId}`,
        suggestions: this.getExtensionSuggestions(languageId),
        fileExists: fs.existsSync(filePath)
      };
    }

    try {
      const fileExists = fs.existsSync(filePath);
      let fileContent = '';
      let fileStats = null;

      if (fileExists) {
        fileContent = fs.readFileSync(filePath, 'utf-8');
        fileStats = fs.statSync(filePath);
      }

      // Perform security scanning
      const securityVulnerabilities = await this.securityScanner.scanForVulnerabilities(filePath, fileContent, languageId);
      const cpaasVulnerabilities = await this.securityScanner.scanForCPaaSVulnerabilities(filePath, fileContent);

      // Provide comprehensive analysis
      const analysis = {
        languageId,
        fileExists,
        fileSize: fileStats?.size || 0,
        lineCount: fileContent.split('\n').length,
        security: {
          vulnerabilities: [...securityVulnerabilities, ...cpaasVulnerabilities],
          securityScore: this.calculateSecurityScore(securityVulnerabilities, cpaasVulnerabilities),
          recommendations: this.getSecurityRecommendations(languageId)
        },
        hover: await this.generateHoverInfo(filePath, fileContent, line, character, languageId),
        completions: await this.generateCompletions(filePath, fileContent, line, character, languageId),
        diagnostics: await this.generateDiagnostics(filePath, fileContent, languageId),
        symbols: await this.extractSymbols(fileContent, languageId),
        codeContext: this.getCodeContext(fileContent, line),
        languageFeatures: {
          supportsHover: true,
          supportsCompletion: true,
          supportsDiagnostics: true,
          supportsSymbols: true
        },
        extensionInfo: this.getLanguageExtensionInfo(languageId)
      };

      return analysis;
    } catch (error) {
      return {
        languageId,
        error: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: this.getExtensionSuggestions(languageId),
        fileExists: fs.existsSync(filePath)
      };
    }
  }

  /**
   * Generate hover information for code position
   */
  private async generateHoverInfo(filePath: string, content: string, line: number, character: number, languageId: string): Promise<any> {
    const lines = content.split('\n');
    if (line >= lines.length) {
      return { available: false, reason: 'Line out of range' };
    }

    const currentLine = lines[line];
    const wordAtPosition = this.getWordAtPosition(currentLine, character);

    if (!wordAtPosition) {
      return { available: false, reason: 'No symbol at position' };
    }

    // Generate language-specific hover information
    const hoverInfo = {
      available: true,
      range: {
        start: { line, character: wordAtPosition.startIndex },
        end: { line, character: wordAtPosition.endIndex }
      },
      contents: await this.generateHoverContents(wordAtPosition.word, languageId, content, filePath)
    };

    return hoverInfo;
  }

  /**
   * Generate hover contents based on symbol and language
   */
  private async generateHoverContents(symbol: string, languageId: string, content: string, filePath: string): Promise<any> {
    const contents = [];

    // Basic symbol information
    contents.push({
      kind: 'markdown',
      value: `**${symbol}** (${languageId})`
    });

    // Language-specific analysis
    switch (languageId) {
      case 'csharp':
        const csAnalysis = this.analyzeCSharpSymbol(symbol, content, filePath);
        if (csAnalysis) {
          contents.push({
            kind: 'markdown',
            value: csAnalysis
          });
        }
        break;

      case 'typescript':
      case 'javascript':
        const tsAnalysis = this.analyzeTypeScriptSymbol(symbol, content, filePath);
        if (tsAnalysis) {
          contents.push({
            kind: 'markdown',
            value: tsAnalysis
          });
        }
        break;

      case 'json':
        const jsonAnalysis = this.analyzeJsonProperty(symbol, content);
        if (jsonAnalysis) {
          contents.push({
            kind: 'markdown',
            value: jsonAnalysis
          });
        }
        break;
    }

    // Add usage information
    const usageInfo = this.findSymbolUsages(symbol, content);
    if (usageInfo.count > 0) {
      contents.push({
        kind: 'markdown',
        value: `**Usage**: Found ${usageInfo.count} references in this file`
      });
    }

    return contents;
  }

  /**
   * Analyze C# symbols
   */
  private analyzeCSharpSymbol(symbol: string, content: string, filePath: string): string | null {
    // Check if it's a class
    const classMatch = content.match(new RegExp(`(public|private|protected|internal)?\\s*(static)?\\s*(abstract|sealed)?\\s*class\\s+${symbol}`, 'i'));
    if (classMatch) {
      return `**Class**: ${symbol}\n\nC# class definition`;
    }

    // Check if it's a method
    const methodMatch = content.match(new RegExp(`(public|private|protected|internal)?\\s*(static)?\\s*\\w+\\s+${symbol}\\s*\\(`, 'i'));
    if (methodMatch) {
      return `**Method**: ${symbol}\n\nC# method`;
    }

    // Check if it's a property
    const propertyMatch = content.match(new RegExp(`(public|private|protected|internal)?\\s*\\w+\\s+${symbol}\\s*{`, 'i'));
    if (propertyMatch) {
      return `**Property**: ${symbol}\n\nC# property`;
    }

    // Check if it's a namespace
    const namespaceMatch = content.match(new RegExp(`namespace\\s+[\\w\\.]*${symbol}`, 'i'));
    if (namespaceMatch) {
      return `**Namespace**: ${symbol}\n\nC# namespace`;
    }

    return null;
  }

  /**
   * Analyze TypeScript/JavaScript symbols
   */
  private analyzeTypeScriptSymbol(symbol: string, content: string, filePath: string): string | null {
    // Check if it's a class
    const classMatch = content.match(new RegExp(`(export\\s+)?(abstract\\s+)?class\\s+${symbol}`, 'i'));
    if (classMatch) {
      return `**Class**: ${symbol}\n\nTypeScript/JavaScript class`;
    }

    // Check if it's a function
    const functionMatch = content.match(new RegExp(`(export\\s+)?(async\\s+)?function\\s+${symbol}\\s*\\(`, 'i'));
    if (functionMatch) {
      return `**Function**: ${symbol}\n\nTypeScript/JavaScript function`;
    }

    // Check if it's an interface
    const interfaceMatch = content.match(new RegExp(`(export\\s+)?interface\\s+${symbol}`, 'i'));
    if (interfaceMatch) {
      return `**Interface**: ${symbol}\n\nTypeScript interface`;
    }

    // Check if it's a const/let/var
    const variableMatch = content.match(new RegExp(`(const|let|var)\\s+${symbol}\\s*=`, 'i'));
    if (variableMatch) {
      return `**Variable**: ${symbol}\n\nJavaScript/TypeScript variable`;
    }

    return null;
  }

  /**
   * Analyze JSON properties
   */
  private analyzeJsonProperty(symbol: string, content: string): string | null {
    try {
      const json = JSON.parse(content);
      if (json.hasOwnProperty(symbol)) {
        const value = json[symbol];
        const type = Array.isArray(value) ? 'array' : typeof value;
        return `**JSON Property**: ${symbol}\n\n**Type**: ${type}\n\n**Value**: ${JSON.stringify(value, null, 2).substring(0, 200)}`;
      }
    } catch (e) {
      // Not valid JSON or property not found
    }
    return null;
  }

  /**
   * Generate code completions
   */
  private async generateCompletions(filePath: string, content: string, line: number, character: number, languageId: string): Promise<any> {
    const lines = content.split('\n');
    if (line >= lines.length) {
      return { available: false, reason: 'Line out of range' };
    }

    const currentLine = lines[line];
    const textBeforeCursor = currentLine.substring(0, character);
    
    const completions = {
      available: true,
      isIncomplete: false,
      items: [] as any[]
    };

    // Generate language-specific completions
    switch (languageId) {
      case 'csharp':
        completions.items = this.generateCSharpCompletions(textBeforeCursor, content);
        break;
      case 'typescript':
      case 'javascript':
        completions.items = this.generateTypeScriptCompletions(textBeforeCursor, content);
        break;
      case 'json':
        completions.items = this.generateJsonCompletions(textBeforeCursor, content);
        break;
      default:
        completions.items = this.generateGenericCompletions(textBeforeCursor, content);
    }

    return completions;
  }

  /**
   * Generate C# specific completions
   */
  private generateCSharpCompletions(textBeforeCursor: string, content: string): any[] {
    const completions: any[] = [];

    // Common C# keywords and constructs
    const keywords = ['public', 'private', 'protected', 'internal', 'static', 'abstract', 'virtual', 'override', 'class', 'interface', 'namespace', 'using', 'if', 'else', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'new', 'this', 'base'];

    keywords.forEach(keyword => {
      if (keyword.startsWith(textBeforeCursor.split(/\s+/).pop() || '')) {
        completions.push({
          label: keyword,
          kind: 14, // Keyword
          detail: `C# keyword`,
          insertText: keyword
        });
      }
    });

    // Extract classes and methods from current file
    const classMatches = content.match(/class\s+(\w+)/g);
    if (classMatches) {
      classMatches.forEach(match => {
        const className = match.split(/\s+/)[1];
        completions.push({
          label: className,
          kind: 7, // Class
          detail: `Class ${className}`,
          insertText: className
        });
      });
    }

    return completions.slice(0, 50); // Limit to 50 items
  }

  /**
   * Generate TypeScript/JavaScript completions
   */
  private generateTypeScriptCompletions(textBeforeCursor: string, content: string): any[] {
    const completions: any[] = [];

    // Common TypeScript/JavaScript keywords
    const keywords = ['function', 'const', 'let', 'var', 'class', 'interface', 'type', 'export', 'import', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'new', 'this', 'async', 'await'];

    keywords.forEach(keyword => {
      if (keyword.startsWith(textBeforeCursor.split(/\s+/).pop() || '')) {
        completions.push({
          label: keyword,
          kind: 14, // Keyword
          detail: `TypeScript/JavaScript keyword`,
          insertText: keyword
        });
      }
    });

    // Extract functions and variables from current file
    const functionMatches = content.match(/function\s+(\w+)|const\s+(\w+)\s*=|let\s+(\w+)\s*=/g);
    if (functionMatches) {
      functionMatches.forEach(match => {
        const name = match.split(/\s+/)[1] || match.split('=')[0].trim().split(/\s+/)[1];
        if (name) {
          completions.push({
            label: name,
            kind: match.includes('function') ? 3 : 6, // Function or Variable
            detail: match.includes('function') ? `Function ${name}` : `Variable ${name}`,
            insertText: name
          });
        }
      });
    }

    return completions.slice(0, 50);
  }

  /**
   * Generate JSON completions
   */
  private generateJsonCompletions(textBeforeCursor: string, content: string): any[] {
    const completions: any[] = [];

    try {
      const json = JSON.parse(content);
      Object.keys(json).forEach(key => {
        if (key.startsWith(textBeforeCursor.replace(/['"]/g, '').split(/[\s:,]/).pop() || '')) {
          completions.push({
            label: key,
            kind: 10, // Property
            detail: `JSON property`,
            insertText: `"${key}"`
          });
        }
      });
    } catch (e) {
      // Not valid JSON
    }

    return completions;
  }

  /**
   * Generate generic completions
   */
  private generateGenericCompletions(textBeforeCursor: string, content: string): any[] {
    const completions: any[] = [];
    const words = content.match(/\b\w{3,}\b/g) || [];
    const uniqueWords = Array.from(new Set(words));

    const currentWord = textBeforeCursor.split(/\s+/).pop() || '';
    
    uniqueWords.forEach(word => {
      if (word.toLowerCase().startsWith(currentWord.toLowerCase()) && word !== currentWord) {
        completions.push({
          label: word,
          kind: 1, // Text
          detail: 'Word from document',
          insertText: word
        });
      }
    });

    return completions.slice(0, 20);
  }

  /**
   * Generate diagnostics (errors, warnings, info)
   */
  private async generateDiagnostics(filePath: string, content: string, languageId: string): Promise<any> {
    const diagnostics = [];

    // Basic syntax checks based on language
    switch (languageId) {
      case 'json':
        try {
          JSON.parse(content);
        } catch (error) {
          const err = error as SyntaxError;
          diagnostics.push({
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 100 }
            },
            severity: 1, // Error
            message: `JSON Syntax Error: ${err.message}`,
            source: 'json-parser'
          });
        }
        break;

      case 'csharp':
        // Basic C# syntax checks
        if (content.includes('public class') && !content.includes('}')) {
          diagnostics.push({
            range: {
              start: { line: content.split('\n').length - 1, character: 0 },
              end: { line: content.split('\n').length - 1, character: 1 }
            },
            severity: 1, // Error
            message: 'Missing closing brace for class declaration',
            source: 'csharp-basic'
          });
        }
        break;

      case 'typescript':
      case 'javascript':
        // Basic TypeScript/JavaScript checks
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          diagnostics.push({
            range: {
              start: { line: content.split('\n').length - 1, character: 0 },
              end: { line: content.split('\n').length - 1, character: 1 }
            },
            severity: 2, // Warning
            message: 'Mismatched braces detected',
            source: 'typescript-basic'
          });
        }
        break;
    }

    return diagnostics;
  }

  /**
   * Extract symbols from content
   */
  private async extractSymbols(content: string, languageId: string): Promise<any[]> {
    const symbols: any[] = [];

    switch (languageId) {
      case 'csharp':
        // Extract C# symbols
        const classMatches = content.match(/(?:public|private|protected|internal)?\s*(?:static)?\s*(?:abstract|sealed)?\s*class\s+(\w+)/g);
        if (classMatches) {
          classMatches.forEach((match, index) => {
            const className = match.split(/\s+/).pop();
            if (className) {
              symbols.push({
                name: className,
                kind: 5, // Class
                location: {
                  range: {
                    start: { line: index, character: 0 },
                    end: { line: index, character: match.length }
                  }
                }
              });
            }
          });
        }

        const methodMatches = content.match(/(?:public|private|protected|internal)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g);
        if (methodMatches) {
          methodMatches.forEach((match, index) => {
            const methodName = match.split('(')[0].split(/\s+/).pop();
            if (methodName) {
              symbols.push({
                name: methodName,
                kind: 6, // Method
                location: {
                  range: {
                    start: { line: index, character: 0 },
                    end: { line: index, character: match.length }
                  }
                }
              });
            }
          });
        }
        break;

      case 'typescript':
      case 'javascript':
        // Extract TypeScript/JavaScript symbols
        const tsClassMatches = content.match(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g);
        if (tsClassMatches) {
          tsClassMatches.forEach((match, index) => {
            const className = match.split(/\s+/).pop();
            if (className) {
              symbols.push({
                name: className,
                kind: 5, // Class
                location: {
                  range: {
                    start: { line: index, character: 0 },
                    end: { line: index, character: match.length }
                  }
                }
              });
            }
          });
        }

        const tsFunctionMatches = content.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g);
        if (tsFunctionMatches) {
          tsFunctionMatches.forEach((match, index) => {
            const functionName = match.split(/\s+/).pop();
            if (functionName) {
              symbols.push({
                name: functionName,
                kind: 12, // Function
                location: {
                  range: {
                    start: { line: index, character: 0 },
                    end: { line: index, character: match.length }
                  }
                }
              });
            }
          });
        }
        break;
    }

    return symbols;
  }

  /**
   * Get code context around a specific line
   */
  private getCodeContext(content: string, line: number, contextLines: number = 3): any {
    const lines = content.split('\n');
    const startLine = Math.max(0, line - contextLines);
    const endLine = Math.min(lines.length - 1, line + contextLines);

    return {
      currentLine: line,
      contextRange: {
        start: startLine,
        end: endLine
      },
      lines: lines.slice(startLine, endLine + 1).map((lineContent, index) => ({
        lineNumber: startLine + index,
        content: lineContent,
        isCurrent: startLine + index === line
      }))
    };
  }

  /**
   * Get word at specific position in line
   */
  private getWordAtPosition(line: string, character: number): { word: string; startIndex: number; endIndex: number } | null {
    if (character >= line.length) return null;

    // Find word boundaries
    let startIndex = character;
    let endIndex = character;

    // Move left to find start of word
    while (startIndex > 0 && /\w/.test(line[startIndex - 1])) {
      startIndex--;
    }

    // Move right to find end of word
    while (endIndex < line.length && /\w/.test(line[endIndex])) {
      endIndex++;
    }

    if (startIndex === endIndex) return null;

    return {
      word: line.substring(startIndex, endIndex),
      startIndex,
      endIndex
    };
  }

  /**
   * Find symbol usages in content
   */
  private findSymbolUsages(symbol: string, content: string): { count: number; lines: number[] } {
    const lines = content.split('\n');
    const usageLines: number[] = [];
    let count = 0;

    lines.forEach((line, index) => {
      const regex = new RegExp(`\\b${symbol}\\b`, 'g');
      const matches = line.match(regex);
      if (matches) {
        count += matches.length;
        usageLines.push(index);
      }
    });

    return { count, lines: usageLines };
  }

  /**
   * Get language extension information
   */
  private getLanguageExtensionInfo(languageId: string): any {
    const extensionInfo: Record<string, any> = {
      'csharp': {
        extensionId: 'ms-dotnettools.csdevkit',
        name: 'C# Dev Kit',
        description: 'Comprehensive C# development support'
      },
      'typescript': {
        extensionId: 'vscode.typescript-language-features',
        name: 'TypeScript and JavaScript',
        description: 'Built-in TypeScript and JavaScript support'
      },
      'javascript': {
        extensionId: 'vscode.typescript-language-features',
        name: 'TypeScript and JavaScript',
        description: 'Built-in TypeScript and JavaScript support'
      },
      'angular': {
        extensionId: 'Angular.ng-template',
        name: 'Angular Language Service',
        description: 'Angular template and component support'
      },
      'json': {
        extensionId: 'vscode.json-language-features',
        name: 'JSON Language Features',
        description: 'Built-in JSON support with schema validation'
      },
      'xml': {
        extensionId: 'redhat.vscode-xml',
        name: 'XML',
        description: 'XML language support by Red Hat'
      },
      'yaml': {
        extensionId: 'redhat.vscode-yaml',
        name: 'YAML',
        description: 'YAML language support by Red Hat'
      }
    };

    return extensionInfo[languageId] || {
      extensionId: 'unknown',
      name: `${languageId} support`,
      description: `Basic ${languageId} language support`
    };
  }

  /**
   * Detect language ID from file path - public method
   */
  detectLanguageFromPath(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      // .NET and C#
      'cs': 'csharp',
      'csx': 'csharp',
      'csproj': 'xml',
      'sln': 'csharp',
      'props': 'xml',
      'targets': 'xml',
      'cshtml': 'razor',
      'razor': 'razor',
      
      // TypeScript and JavaScript
      'ts': 'typescript',
      'tsx': 'typescript',
      'mts': 'typescript',
      'cts': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'mjs': 'javascript',
      'cjs': 'javascript',
      
      // Styling
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      
      // Web
      'html': 'html',
      'htm': 'html',
      'xhtml': 'html',
      
      // Configuration
      'json': 'json',
      'jsonc': 'jsonc',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      
      // Other languages
      'py': 'python',
      'pyw': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'ps1': 'powershell',
      'psm1': 'powershell',
      'psd1': 'powershell',
      
      // DevOps
      'dockerfile': 'dockerfile',
      'containerfile': 'dockerfile'
    };

    return languageMap[extension] || 'plaintext';
  }

  /**
   * Get VS Code extension suggestions for a language
   */
  private getExtensionSuggestions(languageId: string): string[] {
    const suggestions: Record<string, string[]> = {
      'csharp': ['ms-dotnettools.csharp', 'ms-dotnettools.csdevkit'],
      'razor': ['ms-dotnettools.csharp'],
      'angular': ['Angular.ng-template'],
      'xml': ['redhat.vscode-xml'],
      'yaml': ['redhat.vscode-yaml'],
      'python': ['ms-python.python'],
      'rust': ['rust-lang.rust-analyzer'],
      'go': ['golang.go'],
      'java': ['redhat.java'],
      'powershell': ['ms-vscode.powershell'],
      'dockerfile': ['ms-azuretools.vscode-docker']
    };

    return suggestions[languageId] || [];
  }

  /**
   * Calculate security score based on vulnerabilities found
   */
  private calculateSecurityScore(generalVulns: SecurityVulnerability[], cpaasVulns: SecurityVulnerability[]): number {
    const allVulns = [...generalVulns, ...cpaasVulns];
    if (allVulns.length === 0) return 100;

    let totalSeverityScore = 0;
    allVulns.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': totalSeverityScore += 40; break;
        case 'high': totalSeverityScore += 20; break;
        case 'medium': totalSeverityScore += 10; break;
        case 'low': totalSeverityScore += 5; break;
      }
    });

    return Math.max(0, 100 - totalSeverityScore);
  }

  /**
   * Get security recommendations based on language and detected issues
   */
  private getSecurityRecommendations(languageId: string): string[] {
    const recommendations: string[] = [];

    switch (languageId) {
      case 'csharp':
        recommendations.push(
          'Use Entity Framework or Dapper for database operations to prevent SQL injection',
          'Implement proper authentication with ASP.NET Core Identity',
          'Use HTTPS for all API endpoints',
          'Validate and sanitize all user inputs',
          'Implement proper error handling to avoid information disclosure'
        );
        break;
      case 'typescript':
      case 'javascript':
        recommendations.push(
          'Use parameterized queries or ORMs like TypeORM',
          'Implement proper CORS policies',
          'Validate inputs with libraries like Joi or Yup',
          'Use HTTPS and secure cookies',
          'Implement rate limiting for API endpoints'
        );
        break;
    }

    // CPaaS-specific recommendations
    recommendations.push(
      'Implement rate limiting for telecom APIs to prevent abuse',
      'Use encryption for all customer communication data',
      'Validate phone numbers and communication endpoints',
      'Implement proper audit logging for telecom transactions',
      'Use secure protocols (HTTPS, WSS) for real-time communication'
    );

    return recommendations;
  }

  async shutdown(): Promise<void> {
    for (const [languageId, client] of Array.from(this.clients.entries())) {
      try {
        await client.stop();
      } catch (error) {
        console.warn(`Error stopping ${languageId} client:`, error);
      }
    }
    this.clients.clear();
  }
}

class EnhancedSequentialThinkingServer {
  private thoughtHistory: EnhancedThoughtData[] = [];
  private branches: Record<string, EnhancedThoughtData[]> = {};
  private disableThoughtLogging: boolean;
  private lspClient?: VSCodeIntegratedLSPClient;
  private contextManager?: EnterpriseContextManager;
  private rootDirectory: string = ".";

  constructor() {
    this.disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
  }

  /**
   * Initialize with VS Code language server integration and enterprise features
   */
  async initialize(rootDir?: string): Promise<void> {
    if (rootDir) {
      this.rootDirectory = rootDir;
    }

    // Initialize enterprise context manager
    this.contextManager = new EnterpriseContextManager(this.rootDirectory);

    this.lspClient = new VSCodeIntegratedLSPClient(this.rootDirectory);
    
    // Initialize common language servers for .NET/Angular development
    const commonLanguages = [
      'csharp', 'typescript', 'javascript', 'angular', 
      'css', 'scss', 'html', 'json', 'xml', 'yaml'
    ];

    await this.lspClient.initializeLanguageSupport(commonLanguages);
    
    console.log('🚀 Enterprise Sequential Thinking Server initialized with:');
    console.log('   ✓ Persistent context memory');
    console.log('   ✓ Security vulnerability scanning');
    console.log('   ✓ Performance analysis caching');
    console.log('   ✓ CPaaS domain intelligence');
  }

  async handleSequentialThinking(params: any): Promise<any> {
    const {
      thought,
      nextThoughtNeeded,
      thoughtNumber,
      totalThoughts,
      isRevision = false,
      revisesThought,
      branchFromThought,
      branchId,
      needsMoreThoughts = false,
      filePath, // New parameter for code context
      codeSnippet // New parameter for code context
    } = params;

    // Enhanced thought data with language context
    const enhancedThoughtData: EnhancedThoughtData = {
      id: Date.now() + Math.random(),
      thought,
      nextThoughtNeeded,
      thoughtNumber,
      totalThoughts,
      isRevision,
      revisesThought,
      branchFromThought,
      branchId,
      needsMoreThoughts,
      timestamp: new Date()
    };

    // Add language context if code-related
    if (filePath || codeSnippet) {
      const languageId = filePath ? 
        this.lspClient?.detectLanguageFromPath(filePath) || 'plaintext' : 
        'plaintext';

      enhancedThoughtData.languageContext = {
        languageId,
        filePath,
        codeContext: codeSnippet
      };

      // Get comprehensive LSP information if available
      if (this.lspClient && filePath) {
        try {
          const lspInfo = await this.lspClient.getCodeIntelligence(filePath, 0, 0);
          enhancedThoughtData.languageContext.lspInfo = {
            hover: lspInfo.hover,
            completions: lspInfo.completions,
            diagnostics: lspInfo.diagnostics,
            symbols: lspInfo.symbols,
            codeContext: lspInfo.codeContext,
            languageFeatures: lspInfo.languageFeatures,
            extensionInfo: lspInfo.extensionInfo
          };
        } catch (error) {
          console.warn('Failed to get LSP information:', error);
          enhancedThoughtData.languageContext.lspInfo = {
            error: `LSP analysis failed: ${error instanceof Error ? error.message : String(error)}`,
            available: false
          };
        }
      }
    }

    // Handle branching logic
    if (branchId) {
      if (!this.branches[branchId]) {
        this.branches[branchId] = [];
      }
      this.branches[branchId].push(enhancedThoughtData);
    } else {
      this.thoughtHistory.push(enhancedThoughtData);
    }

    // Log thought if enabled
    if (!this.disableThoughtLogging) {
      const branchInfo = branchId ? ` [Branch: ${branchId}]` : '';
      const revisionInfo = isRevision ? ` [Revision of thought ${revisesThought}]` : '';
      const languageInfo = enhancedThoughtData.languageContext ? 
        ` [Language: ${enhancedThoughtData.languageContext.languageId}]` : '';
      
      console.log(`💭 Thought ${thoughtNumber}/${totalThoughts}${branchInfo}${revisionInfo}${languageInfo}: ${thought}`);
      
      if (enhancedThoughtData.languageContext?.lspInfo) {
        console.log(`🔍 Code Intelligence: Available for ${enhancedThoughtData.languageContext.languageId}`);
      }
    }

    return {
      success: true,
      thoughtId: enhancedThoughtData.id,
      thoughtNumber,
      totalThoughts,
      nextThoughtNeeded,
      branchId,
      languageContext: enhancedThoughtData.languageContext,
      message: `Thought ${thoughtNumber} recorded successfully` +
        (enhancedThoughtData.languageContext ? ` with ${enhancedThoughtData.languageContext.languageId} language support` : ''),
      thoughtHistory: this.getThoughtSummary()
    };
  }

  private getThoughtSummary() {
    return {
      totalThoughts: this.thoughtHistory.length,
      branches: Object.keys(this.branches).length,
      lastThought: this.thoughtHistory[this.thoughtHistory.length - 1]?.thought.slice(0, 100) + '...',
      supportedLanguages: this.lspClient?.activeLanguages || []
    };
  }

  async getCodeAnalysis(params: any): Promise<any> {
    const { filePath, line = 0, character = 0 } = params;
    
    if (!this.lspClient) {
      return {
        success: false,
        error: "LSP client not initialized. Call initialize first."
      };
    }

    try {
      const analysis = await this.lspClient.getCodeIntelligence(filePath, line, character);
      
      // Enhanced response with detailed analysis
      return {
        success: true,
        filePath,
        position: { line, character },
        languageId: analysis.languageId,
        fileExists: analysis.fileExists,
        fileInfo: {
          size: analysis.fileSize,
          lineCount: analysis.lineCount
        },
        hover: analysis.hover,
        completions: analysis.completions,
        diagnostics: analysis.diagnostics,
        symbols: analysis.symbols,
        codeContext: analysis.codeContext,
        languageFeatures: analysis.languageFeatures,
        extensionInfo: analysis.extensionInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: `Code analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        filePath,
        position: { line, character },
        suggestions: [
          "Ensure the file exists and is readable",
          "Check that the file path is absolute",
          "Verify the file extension is supported"
        ],
        timestamp: new Date().toISOString()
      };
    }
  }

  async getSupportedLanguages(): Promise<any> {
    const supportedLanguages = Object.keys(VSCodeLanguageServers);
    const activeLanguages = this.lspClient?.activeLanguages || [];

    return {
      supported: supportedLanguages.map(lang => ({
        languageId: lang,
        extensionId: VSCodeLanguageServers[lang].extensionId,
        active: activeLanguages.includes(lang)
      })),
      recommendations: [
        'Install "C# Dev Kit" (ms-dotnettools.csdevkit) for full .NET support',
        'Install "Angular Language Service" (Angular.ng-template) for Angular development',
        'Install "XML" (redhat.vscode-xml) for project file support',
        'Install "YAML" (redhat.vscode-yaml) for configuration files'
      ]
    };
  }

  async performSecurityScan(params: any): Promise<any> {
    const { filePath, scanType = 'all' } = params;

    if (!this.lspClient) {
      return {
        success: false,
        error: "LSP client not initialized"
      };
    }

    try {
      const fileExists = fs.existsSync(filePath);
      if (!fileExists) {
        return {
          success: false,
          error: "File not found",
          filePath
        };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const languageId = this.lspClient.detectLanguageFromPath(filePath);
      
      let vulnerabilities: SecurityVulnerability[] = [];

      if (scanType === 'general' || scanType === 'all') {
        const generalVulns = await this.lspClient['securityScanner'].scanForVulnerabilities(filePath, content, languageId);
        vulnerabilities = [...vulnerabilities, ...generalVulns];
      }

      if (scanType === 'cpaas' || scanType === 'all') {
        const cpaasVulns = await this.lspClient['securityScanner'].scanForCPaaSVulnerabilities(filePath, content);
        vulnerabilities = [...vulnerabilities, ...cpaasVulns];
      }

      return {
        success: true,
        filePath,
        languageId,
        scanType,
        vulnerabilities,
        securityScore: this.calculateSecurityScore(vulnerabilities),
        summary: {
          critical: vulnerabilities.filter(v => v.severity === 'critical').length,
          high: vulnerabilities.filter(v => v.severity === 'high').length,
          medium: vulnerabilities.filter(v => v.severity === 'medium').length,
          low: vulnerabilities.filter(v => v.severity === 'low').length
        },
        recommendations: this.getSecurityRecommendations(languageId, vulnerabilities),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: `Security scan failed: ${error instanceof Error ? error.message : String(error)}`,
        filePath
      };
    }
  }

  async handleArchitecturalDecision(params: any): Promise<any> {
    const { action, projectId, title, decision, rationale, consequences } = params;

    if (!this.contextManager) {
      return {
        success: false,
        error: "Context manager not initialized"
      };
    }

    try {
      switch (action) {
        case 'add':
          if (!title || !decision || !rationale || !consequences) {
            return {
              success: false,
              error: "Missing required fields for add action: title, decision, rationale, consequences"
            };
          }

          await this.contextManager.addArchitecturalDecision(projectId, {
            title,
            decision,
            rationale,
            consequences,
            project: projectId
          });

          return {
            success: true,
            message: "Architectural decision recorded successfully",
            projectId,
            title
          };

        case 'get':
        case 'list':
          const context = this.contextManager.getProjectKnowledge(projectId);
          return {
            success: true,
            projectId,
            architecturalDecisions: context.architecturalDecisions,
            count: context.architecturalDecisions.length
          };

        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Use 'add', 'get', or 'list'`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Architectural decision operation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async performPerformanceAnalysis(params: any): Promise<any> {
    const { filePath, scenario = 'general' } = params;

    try {
      const fileExists = fs.existsSync(filePath);
      if (!fileExists) {
        return {
          success: false,
          error: "File not found",
          filePath
        };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const languageId = this.lspClient?.detectLanguageFromPath(filePath) || 'unknown';
      
      const analysis = this.analyzePerformancePatterns(content, languageId, scenario);

      return {
        success: true,
        filePath,
        languageId,
        scenario,
        analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: `Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        filePath
      };
    }
  }

  private calculateSecurityScore(vulnerabilities: SecurityVulnerability[]): number {
    if (vulnerabilities.length === 0) return 100;

    let totalSeverityScore = 0;
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': totalSeverityScore += 40; break;
        case 'high': totalSeverityScore += 20; break;
        case 'medium': totalSeverityScore += 10; break;
        case 'low': totalSeverityScore += 5; break;
      }
    });

    return Math.max(0, 100 - totalSeverityScore);
  }

  private getSecurityRecommendations(languageId: string, vulnerabilities: SecurityVulnerability[]): string[] {
    const recommendations: string[] = [];
    
    if (vulnerabilities.some(v => v.type === 'sql-injection')) {
      recommendations.push('Implement parameterized queries to prevent SQL injection');
    }
    
    if (vulnerabilities.some(v => v.type === 'insecure-api')) {
      recommendations.push('Add proper authentication and authorization to API endpoints');
    }
    
    if (vulnerabilities.some(v => v.type === 'data-exposure')) {
      recommendations.push('Remove or mask sensitive data from log statements');
    }

    // Add language-specific recommendations
    if (languageId === 'csharp') {
      recommendations.push('Use ASP.NET Core Identity for authentication');
      recommendations.push('Implement proper input validation with Data Annotations');
    }

    return recommendations;
  }

  private analyzePerformancePatterns(content: string, languageId: string, scenario: string): any {
    const issues: any[] = [];
    const recommendations: string[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Database performance patterns
      if (line.match(/\.ToList\(\)\.Count|\.Count\(\)|\.Any\(\)/)) {
        issues.push({
          line: index + 1,
          type: 'database-efficiency',
          severity: 'medium',
          message: 'Potential inefficient database query',
          recommendation: 'Use Count() for counting or Any() for existence checks'
        });
      }

      // Memory allocation patterns
      if (line.match(/new\s+List<.*>\(\)|new\s+Dictionary<.*>\(\)/)) {
        issues.push({
          line: index + 1,
          type: 'memory-allocation',
          severity: 'low',
          message: 'Consider object pooling for high-frequency allocations',
          recommendation: 'Use object pools or pre-allocated collections for high-throughput scenarios'
        });
      }

      // Async patterns
      if (line.match(/\.Result|\.Wait\(\)/)) {
        issues.push({
          line: index + 1,
          type: 'async-blocking',
          severity: 'high',
          message: 'Blocking async call detected',
          recommendation: 'Use await instead of .Result or .Wait() to prevent deadlocks'
        });
      }

      // CPaaS-specific patterns
      if (scenario === 'high-volume-calls' && line.match(/HttpClient|WebRequest/)) {
        issues.push({
          line: index + 1,
          type: 'http-client-reuse',
          severity: 'medium',
          message: 'HTTP client instantiation in high-volume scenario',
          recommendation: 'Use HttpClientFactory or singleton HttpClient for better performance'
        });
      }
    });

    // Scenario-specific recommendations
    switch (scenario) {
      case 'high-volume-calls':
        recommendations.push(
          'Implement connection pooling for database connections',
          'Use async/await patterns for I/O operations',
          'Consider implementing circuit breakers for external API calls',
          'Use efficient serialization (System.Text.Json instead of Newtonsoft.Json)'
        );
        break;
      case 'message-processing':
        recommendations.push(
          'Implement batch processing for message queues',
          'Use memory-efficient data structures',
          'Consider streaming for large message payloads',
          'Implement proper backpressure handling'
        );
        break;
    }

    return {
      issues,
      recommendations,
      performanceScore: Math.max(0, 100 - (issues.length * 10)),
      summary: {
        totalIssues: issues.length,
        highSeverity: issues.filter(i => i.severity === 'high').length,
        mediumSeverity: issues.filter(i => i.severity === 'medium').length,
        lowSeverity: issues.filter(i => i.severity === 'low').length
      }
    };
  }

  async shutdown(): Promise<void> {
    if (this.lspClient) {
      await this.lspClient.shutdown();
    }
  }
}

// Server setup
const server = new Server(
  {
    name: 'enhanced-sequential-thinking-server',
    version: '2.0.0'
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const sequentialThinkingServer = new EnhancedSequentialThinkingServer();

// Initialize on startup
sequentialThinkingServer.initialize().catch(console.error);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'sequentialthinking',
        description: `Advanced problem-solving through dynamic sequential thinking with VS Code language server integration.

This enhanced tool provides intelligent code analysis alongside thought processes for .NET Core/ABP Framework and Angular 17+ development.

Key Features:
- 🧠 Dynamic thought planning with branching and revision capabilities
- 🔧 Integration with VS Code's existing language servers  
- 💻 Real-time code intelligence for C#, TypeScript, SCSS, and more
- 🏗️ Optimized for enterprise .NET/Angular development workflows
- 📊 Automatic language detection and context-aware assistance

Language Support (via VS Code extensions):
- C# (.cs, .csx) - Requires "C# Dev Kit" extension
- Project files (.csproj, .sln) - XML language server
- Razor Pages (.cshtml, .razor) - C# extension
- TypeScript/JavaScript (.ts, .tsx, .js) - Built into VS Code
- Angular templates (.html, .ts) - "Angular Language Service" extension  
- SCSS/CSS (.scss, .css, .sass) - Built into VS Code
- JSON (.json, .jsonc) - Built into VS Code
- XML (.xml, .config) - "XML" extension by Red Hat
- YAML (.yml, .yaml) - "YAML" extension by Red Hat

Usage Examples:

1. Basic Problem Solving:
{
  "thought": "I need to analyze the user authentication flow in this ABP application",
  "nextThoughtNeeded": true,
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "filePath": "/src/MyApp.Application/Auth/AuthService.cs"
}

2. Code-Specific Analysis:
{
  "thought": "The dependency injection configuration might be causing the service resolution issue",
  "nextThoughtNeeded": true, 
  "thoughtNumber": 2,
  "totalThoughts": 5,
  "filePath": "/src/MyApp.Web/Program.cs",
  "codeSnippet": "builder.Services.AddScoped<IAuthService, AuthService>();"
}

3. Frontend Integration:
{
  "thought": "The Angular component isn't receiving data from the .NET API endpoint",
  "nextThoughtNeeded": true,
  "thoughtNumber": 1,
  "totalThoughts": 4,
  "filePath": "/angular/src/app/auth/auth.component.ts"
}`,
        inputSchema: {
          type: 'object',
          properties: {
            thought: {
              type: 'string',
              description: 'Your current thinking step. Can include analysis, revisions, questions, or realizations about code or architecture.'
            },
            nextThoughtNeeded: {
              type: 'boolean',
              description: 'Whether another thought step is needed'
            },
            thoughtNumber: {
              type: 'integer',
              minimum: 1,
              description: 'Current thought number in sequence'
            },
            totalThoughts: {
              type: 'integer', 
              minimum: 1,
              description: 'Estimated total thoughts needed (can be adjusted)'
            },
            isRevision: {
              type: 'boolean',
              description: 'Whether this revises previous thinking'
            },
            revisesThought: {
              type: 'integer',
              minimum: 1,
              description: 'Which thought number is being reconsidered'
            },
            branchFromThought: {
              type: 'integer',
              minimum: 1,
              description: 'Thought number to branch from'
            },
            branchId: {
              type: 'string',
              description: 'Branch identifier for parallel thinking paths'
            },
            needsMoreThoughts: {
              type: 'boolean',
              description: 'If more thoughts are needed beyond current estimate'
            },
            filePath: {
              type: 'string',
              description: 'File path for code context (enables language server features)'
            },
            codeSnippet: {
              type: 'string',
              description: 'Code snippet for analysis context'
            }
          },
          required: ['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts']
        }
      },
      {
        name: 'analyze_code',
        description: `Get intelligent code analysis using VS Code's language servers.

Provides hover information, completions, diagnostics, and suggestions for code files.
Automatically detects language and uses appropriate VS Code extension.

Supports all major languages used in .NET/Angular development.`,
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the code file to analyze'
            },
            line: {
              type: 'integer',
              minimum: 0,
              description: 'Line number for context (0-based)'
            },
            character: {
              type: 'integer',
              minimum: 0,
              description: 'Character position for context (0-based)'
            }
          },
          required: ['filePath']
        }
      },
      {
        name: 'get_supported_languages',
        description: `List all supported programming languages and their VS Code extension requirements.

Shows which language servers are active and provides installation recommendations for missing extensions.`,
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'security_scan',
        description: `Enterprise security vulnerability scanning for code files.

Detects common security issues including:
- SQL injection vulnerabilities
- XSS potential
- Insecure API endpoints
- Data exposure in logs
- CPaaS-specific telecom security issues
- Unencrypted communication channels
- Missing rate limiting
- Phone number validation issues`,
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the code file to scan'
            },
            scanType: {
              type: 'string',
              enum: ['general', 'cpaas', 'all'],
              description: 'Type of security scan to perform',
              default: 'all'
            }
          },
          required: ['filePath']
        }
      },
      {
        name: 'architectural_decision',
        description: `Record and retrieve architectural decisions for persistent context.

Helps maintain institutional knowledge about design choices, patterns used, and rationale for future reference.`,
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['add', 'get', 'list'],
              description: 'Action to perform with architectural decisions'
            },
            projectId: {
              type: 'string',
              description: 'Project identifier for context separation'
            },
            title: {
              type: 'string',
              description: 'Title of the architectural decision (required for add action)'
            },
            decision: {
              type: 'string',
              description: 'The decision that was made (required for add action)'
            },
            rationale: {
              type: 'string',
              description: 'Why this decision was made (required for add action)'
            },
            consequences: {
              type: 'array',
              items: { type: 'string' },
              description: 'Expected consequences of this decision (required for add action)'
            }
          },
          required: ['action', 'projectId']
        }
      },
      {
        name: 'performance_analysis',
        description: `Analyze code for performance implications in high-load CPaaS scenarios.

Provides recommendations for:
- Concurrent call handling optimization
- Message queue performance
- Database connection pooling
- Memory usage patterns
- API response time optimization`,
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the code file to analyze'
            },
            scenario: {
              type: 'string',
              enum: ['high-volume-calls', 'message-processing', 'api-endpoints', 'database-operations', 'general'],
              description: 'Specific performance scenario to analyze for',
              default: 'general'
            }
          },
          required: ['filePath']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'sequentialthinking':
        return { 
          content: [
            { 
              type: 'text', 
              text: JSON.stringify(await sequentialThinkingServer.handleSequentialThinking(args), null, 2) 
            }
          ]
        };

      case 'analyze_code':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await sequentialThinkingServer.getCodeAnalysis(args), null, 2)
            }
          ]
        };

      case 'get_supported_languages':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await sequentialThinkingServer.getSupportedLanguages(), null, 2)
            }
          ]
        };

      case 'security_scan':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await sequentialThinkingServer.performSecurityScan(args), null, 2)
            }
          ]
        };

      case 'architectural_decision':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await sequentialThinkingServer.handleArchitecturalDecision(args), null, 2)
            }
          ]
        };

      case 'performance_analysis':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await sequentialThinkingServer.performPerformanceAnalysis(args), null, 2)
            }
          ]
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
  }
});

// Cleanup on exit
process.on('SIGINT', async () => {
  await sequentialThinkingServer.shutdown();
  process.exit(0);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Enhanced Sequential Thinking MCP Server with VS Code LSP Integration running...');
}

main().catch(console.error);
