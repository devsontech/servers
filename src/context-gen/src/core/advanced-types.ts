import { z } from 'zod';

// Quality analysis schemas
export const CodeQualityAnalysisSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  metrics: z.array(z.enum(['complexity', 'maintainability', 'readability', 'testability', 'duplication'])).default(['complexity', 'maintainability']).describe('Quality metrics to analyze'),
  thresholds: z.object({
    complexityMax: z.number().default(10),
    maintainabilityMin: z.number().default(60),
    duplicationMax: z.number().default(5),
  }).optional().describe('Custom thresholds for quality metrics'),
});

export const SecurityContextAnalysisSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  scanTypes: z.array(z.enum(['vulnerabilities', 'secrets', 'permissions', 'dependencies', 'code-patterns'])).default(['vulnerabilities', 'dependencies']).describe('Types of security analysis to perform'),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium').describe('Risk tolerance level for findings'),
  includeThirdParty: z.boolean().default(true).describe('Include third-party dependency security analysis'),
});

export const PerformanceBottleneckDetectionSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  analysisTypes: z.array(z.enum(['cpu', 'memory', 'io', 'network', 'database', 'algorithmic'])).default(['cpu', 'memory', 'algorithmic']).describe('Types of performance analysis'),
  profilingData: z.string().optional().describe('Path to profiling data file if available'),
  targetMetrics: z.object({
    responseTimeMax: z.number().optional(),
    memoryUsageMax: z.number().optional(),
    cpuUsageMax: z.number().optional(),
  }).optional().describe('Target performance metrics'),
});

export const TechnicalDebtAssessmentSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  debtTypes: z.array(z.enum(['code', 'design', 'test', 'documentation', 'infrastructure'])).default(['code', 'design', 'test']).describe('Types of technical debt to assess'),
  prioritizationCriteria: z.array(z.enum(['business-impact', 'fix-effort', 'risk', 'frequency'])).default(['business-impact', 'risk']).describe('Criteria for debt prioritization'),
  includeEstimates: z.boolean().default(true).describe('Include effort estimates for debt remediation'),
});

// Context recommendation schemas
export const ContextRecommendationEngineSchema = z.object({
  currentContext: z.record(z.any()).describe('Current context state'),
  task: z.string().describe('Current task or objective'),
  userProfile: z.object({
    role: z.enum(['developer', 'architect', 'tester', 'manager']),
    experience: z.enum(['junior', 'mid', 'senior']),
    preferences: z.array(z.string()).default([]),
  }).describe('User profile information'),
  maxRecommendations: z.number().default(10).describe('Maximum number of recommendations to return'),
});

export const RelevanceScoringSchema = z.object({
  contextItems: z.array(z.record(z.any())).describe('Context items to score'),
  query: z.string().describe('Query or task description for relevance scoring'),
  scoringFactors: z.object({
    semanticSimilarity: z.number().min(0).max(1).default(0.4),
    recency: z.number().min(0).max(1).default(0.2),
    popularity: z.number().min(0).max(1).default(0.2),
    userBehavior: z.number().min(0).max(1).default(0.2),
  }).describe('Weights for different scoring factors'),
});

export const ContextEvolutionTrackingSchema = z.object({
  baselineSnapshot: z.string().describe('Path to baseline context snapshot'),
  currentState: z.record(z.any()).describe('Current context state'),
  trackingPeriod: z.enum(['day', 'week', 'month', 'quarter']).default('week').describe('Tracking period for evolution analysis'),
  evolutionMetrics: z.array(z.enum(['complexity', 'size', 'dependencies', 'patterns', 'quality'])).default(['complexity', 'dependencies']).describe('Metrics to track evolution'),
});

// Advanced result types
export interface QualityAnalysisResult {
  overview: {
    overallScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    metrics: Record<string, number>;
  };
  fileScores: Array<{
    path: string;
    scores: Record<string, number>;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      line?: number;
    }>;
  }>;
  trends: Array<{
    metric: string;
    direction: 'improving' | 'stable' | 'degrading';
    change: number;
  }>;
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    category: string;
    description: string;
    estimatedEffort: string;
    files: string[];
  }>;
}

export interface SecurityAnalysisResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  findings: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    location: {
      file: string;
      line?: number;
      column?: number;
    };
    remediation: string;
    cwe?: string;
    cvss?: number;
  }>;
  dependencies: Array<{
    name: string;
    version: string;
    vulnerabilities: Array<{
      id: string;
      severity: string;
      description: string;
      fixedIn?: string;
    }>;
  }>;
  summary: {
    totalFindings: number;
    bySeverity: Record<string, number>;
    categories: Record<string, number>;
  };
}

export interface PerformanceAnalysisResult {
  overview: {
    overallScore: number;
    bottleneckCount: number;
    criticalIssues: number;
  };
  bottlenecks: Array<{
    type: 'cpu' | 'memory' | 'io' | 'network' | 'database' | 'algorithmic';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: {
      file: string;
      function?: string;
      line?: number;
    };
    impact: {
      estimated: string;
      confidence: number;
    };
    suggestions: string[];
  }>;
  metrics: {
    complexity: Record<string, number>;
    memoryUsage: Record<string, number>;
    algorithmicEfficiency: Record<string, string>;
  };
  recommendations: Array<{
    priority: number;
    description: string;
    expectedImprovement: string;
    implementation: string;
  }>;
}

export interface TechnicalDebtResult {
  overall: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    estimatedCost: string;
  };
  categories: Array<{
    type: string;
    items: Array<{
      id: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      location: string[];
      effort: string;
      priority: number;
      businessImpact: string;
      technicalRisk: string;
    }>;
  }>;
  prioritizedBacklog: Array<{
    rank: number;
    item: string;
    category: string;
    effort: string;
    impact: string;
    roi: number;
  }>;
  trends: {
    debtGrowth: number;
    resolutionRate: number;
    newDebtRate: number;
  };
}

export interface ContextRecommendation {
  id: string;
  type: 'file' | 'function' | 'pattern' | 'documentation' | 'example';
  title: string;
  description: string;
  relevanceScore: number;
  context: {
    path?: string;
    lineStart?: number;
    lineEnd?: number;
    preview?: string;
  };
  reasoning: string;
  tags: string[];
  relatedItems: string[];
}

export interface LearningInsight {
  type: 'pattern' | 'antipattern' | 'best-practice' | 'optimization' | 'refactoring';
  confidence: number;
  description: string;
  evidence: string[];
  applicability: {
    contexts: string[];
    conditions: string[];
    exceptions: string[];
  };
  impact: {
    quality: number;
    maintainability: number;
    performance: number;
    security: number;
  };
}

// Additional types for the advanced analyzer
export interface AdvancedAnalysisOptions {
  includeComplexity?: boolean;
  includeCoverage?: boolean;
  includeSmells?: boolean;
  includeOWASP?: boolean;
  includeCWE?: boolean;
  scanDependencies?: boolean;
  analyzeAsync?: boolean;
  analyzeDatabaseCalls?: boolean;
  analyzeLoops?: boolean;
  memoryAnalysis?: boolean;
  includeDocumentation?: boolean;
  includeTestDebt?: boolean;
  includeArchitecturalDebt?: boolean;
  includeCodeDebt?: boolean;
  thresholds?: {
    complexity?: number;
    lines?: number;
    [key: string]: number | undefined;
  };
}

export interface QualityMetrics {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    average: number;
    distribution: Record<string, number>;
  };
  maintainability: {
    index: number;
    score: 'excellent' | 'good' | 'moderate' | 'difficult' | 'unmaintainable';
    factors: {
      complexity: string;
      size: string;
      duplication: string;
    };
  };
  testCoverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  codeSmells: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    location: {
      file: string;
      line: number;
    };
    description: string;
    impact: string;
  }>;
  metrics: {
    totalFiles: number;
    totalLines: number;
    totalFunctions: number;
    averageLinesPerFile: number;
    averageFunctionsPerFile: number;
  };
  recommendations: string[];
}

export interface SecurityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    file: string;
    line: number;
    column: number;
  };
  description: string;
  cwe: string;
  owasp: string;
  remediation: string;
}

export interface PerformanceBottleneck {
  type: string;
  severity: 'low' | 'medium' | 'high';
  location: {
    file: string;
    line: number;
    function: string;
  };
  description: string;
  impact: string;
  suggestion: string;
}

export interface TechnicalDebt {
  type: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  location: {
    file: string;
    line: number;
    function: string;
  };
  description: string;
  impact: string;
  estimatedHours: number;
  priority: string;
  tags: string[];
}