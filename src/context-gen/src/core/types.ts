import { z } from 'zod';

// Core context types
export const FileContextSchema = z.object({
  path: z.string(),
  type: z.enum(['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust', 'other']),
  size: z.number(),
  lastModified: z.string(),
  encoding: z.string().default('utf-8'),
  lines: z.number(),
  functions: z.array(z.string()).default([]),
  classes: z.array(z.string()).default([]),
  imports: z.array(z.string()).default([]),
  exports: z.array(z.string()).default([]),
  complexity: z.number().default(0),
  maintainabilityIndex: z.number().default(0),
});

export const DependencyNodeSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  type: z.enum(['internal', 'external', 'builtin']),
  path: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  dependents: z.array(z.string()).default([]),
  cyclic: z.boolean().default(false),
  weight: z.number().default(1),
});

export const SemanticContextSchema = z.object({
  entity: z.string(),
  type: z.enum(['function', 'class', 'variable', 'module', 'interface', 'type']),
  purpose: z.string(),
  relationships: z.array(z.object({
    target: z.string(),
    type: z.enum(['calls', 'extends', 'implements', 'uses', 'defines']),
    strength: z.number().min(0).max(1),
  })).default([]),
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  location: z.object({
    file: z.string(),
    line: z.number(),
    column: z.number(),
  }),
});

export const ArchitecturalPatternSchema = z.object({
  pattern: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  components: z.array(z.object({
    name: z.string(),
    role: z.string(),
    files: z.array(z.string()),
  })),
  violations: z.array(z.object({
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    files: z.array(z.string()),
  })).default([]),
});

export const KnowledgeNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['concept', 'pattern', 'decision', 'constraint', 'goal']),
  title: z.string(),
  description: z.string(),
  importance: z.number().min(0).max(1),
  certainty: z.number().min(0).max(1),
  sources: z.array(z.string()),
  connections: z.array(z.object({
    target: z.string(),
    relationship: z.string(),
    strength: z.number().min(0).max(1),
  })).default([]),
  tags: z.array(z.string()).default([]),
  lastUpdated: z.string(),
});

export const ContextSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  timestamp: z.string(),
  projectRoot: z.string(),
  files: z.array(FileContextSchema),
  dependencies: z.array(DependencyNodeSchema),
  semanticContext: z.array(SemanticContextSchema),
  patterns: z.array(ArchitecturalPatternSchema),
  knowledgeGraph: z.array(KnowledgeNodeSchema),
  metrics: z.object({
    totalFiles: z.number(),
    totalLines: z.number(),
    averageComplexity: z.number(),
    technicalDebtRatio: z.number(),
    testCoverage: z.number().optional(),
  }),
  version: z.string().default('1.0.0'),
});

// Tool input schemas
export const AnalyzeCodebaseSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  includePatterns: z.array(z.string()).default(['**/*.{ts,js,py,java,cs,go,rs}']).describe('File patterns to include'),
  excludePatterns: z.array(z.string()).default(['node_modules/**', '*.test.*', '*.spec.*']).describe('File patterns to exclude'),
  maxDepth: z.number().default(10).describe('Maximum directory depth to analyze'),
  analysisDepth: z.enum(['shallow', 'medium', 'deep']).default('medium').describe('Depth of analysis to perform'),
});

export const BuildDependencyGraphSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  includeExternal: z.boolean().default(true).describe('Include external dependencies in the graph'),
  detectCircular: z.boolean().default(true).describe('Detect and highlight circular dependencies'),
  maxDepth: z.number().default(5).describe('Maximum depth for dependency traversal'),
});

export const ExtractSemanticContextSchema = z.object({
  filePath: z.string().describe('Path to the specific file to analyze'),
  includeRelationships: z.boolean().default(true).describe('Extract relationships between entities'),
  confidenceThreshold: z.number().min(0).max(1).default(0.7).describe('Minimum confidence threshold for extracted context'),
});

export const AnalyzePatternsSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  patternTypes: z.array(z.enum(['mvc', 'mvvm', 'microservices', 'layered', 'hexagonal', 'event-driven', 'pipe-filter'])).default(['mvc', 'layered']).describe('Architectural patterns to detect'),
  includeAntiPatterns: z.boolean().default(true).describe('Also detect anti-patterns and violations'),
});

export const DetectArchitectureSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  analysisLevel: z.enum(['component', 'module', 'system']).default('module').describe('Level of architectural analysis'),
  generateVisualization: z.boolean().default(false).describe('Generate architectural visualization data'),
});

export const GenerateContextSummarySchema = z.object({
  contextData: z.record(z.any()).describe('Context data to summarize'),
  summaryType: z.enum(['executive', 'technical', 'onboarding', 'handoff']).describe('Type of summary to generate'),
  audience: z.enum(['developer', 'architect', 'manager', 'new-team-member']).describe('Target audience for the summary'),
  focusAreas: z.array(z.string()).default([]).describe('Specific areas to focus on in the summary'),
});

export const CreateMentalModelSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  perspective: z.enum(['user', 'developer', 'architect', 'tester']).describe('Perspective for the mental model'),
  includeDataFlow: z.boolean().default(true).describe('Include data flow analysis'),
  includeUserJourney: z.boolean().default(false).describe('Include user journey mapping'),
});

export const BuildKnowledgeGraphSchema = z.object({
  contextSources: z.array(z.string()).describe('Sources of context data (file paths, URLs, etc.)'),
  extractionRules: z.array(z.object({
    type: z.string(),
    pattern: z.string(),
    confidence: z.number().min(0).max(1),
  })).default([]).describe('Custom rules for knowledge extraction'),
  mergingStrategy: z.enum(['conservative', 'aggressive', 'balanced']).default('balanced').describe('Strategy for merging conflicting information'),
});

export const IncrementalLearningSchema = z.object({
  previousSnapshot: z.string().optional().describe('Path to previous context snapshot'),
  changes: z.array(z.object({
    file: z.string(),
    type: z.enum(['added', 'modified', 'deleted']),
    timestamp: z.string(),
  })).describe('List of changes since last analysis'),
  learningRate: z.number().min(0).max(1).default(0.1).describe('Rate of learning adaptation'),
});

export const ContextPrioritizationSchema = z.object({
  contextItems: z.array(z.record(z.any())).describe('Context items to prioritize'),
  currentTask: z.string().optional().describe('Current task or objective'),
  userPreferences: z.object({
    preferredLanguages: z.array(z.string()).default([]),
    experienceLevel: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate'),
    focusAreas: z.array(z.string()).default([]),
  }).describe('User preferences for prioritization'),
});

export const SaveContextSnapshotSchema = z.object({
  snapshot: ContextSnapshotSchema.describe('Context snapshot to save'),
  filePath: z.string().optional().describe('File path to save snapshot (defaults to project-based naming)'),
  compress: z.boolean().default(true).describe('Compress the snapshot for storage'),
});

export const LoadContextSnapshotSchema = z.object({
  filePath: z.string().describe('Path to the context snapshot file'),
  validateIntegrity: z.boolean().default(true).describe('Validate snapshot integrity on load'),
});

export const MergeContextsSchema = z.object({
  contexts: z.array(z.string()).describe('Paths to context snapshots to merge'),
  strategy: z.enum(['union', 'intersection', 'weighted', 'latest']).default('weighted').describe('Merging strategy'),
  weights: z.array(z.number()).optional().describe('Weights for weighted merging strategy'),
});

export const GenerateTeamHandoffSchema = z.object({
  contextSnapshot: z.string().describe('Path to context snapshot'),
  handoffType: z.enum(['sprint', 'project', 'maintenance', 'emergency']).describe('Type of handoff'),
  targetTeam: z.string().describe('Target team or individual'),
  includeTechnicalDebt: z.boolean().default(true).describe('Include technical debt analysis'),
  includeRisks: z.boolean().default(true).describe('Include risk assessment'),
});

export const CreateOnboardingGuideSchema = z.object({
  projectPath: z.string().describe('Path to the project root directory'),
  targetRole: z.enum(['developer', 'qa', 'devops', 'designer', 'manager']).describe('Target role for onboarding'),
  experienceLevel: z.enum(['junior', 'mid', 'senior']).describe('Experience level of the person being onboarded'),
  includeSetupInstructions: z.boolean().default(true).describe('Include environment setup instructions'),
  includeCodeTour: z.boolean().default(true).describe('Include guided code tour'),
});

export const ExtractTribalKnowledgeSchema = z.object({
  sources: z.array(z.object({
    type: z.enum(['code', 'comments', 'docs', 'commits', 'issues']),
    path: z.string(),
  })).describe('Sources to extract tribal knowledge from'),
  extractionMethod: z.enum(['pattern-based', 'ml-based', 'heuristic']).default('heuristic').describe('Method for knowledge extraction'),
  confidenceThreshold: z.number().min(0).max(1).default(0.6).describe('Minimum confidence for extracted knowledge'),
});

export const ContextDiffAnalysisSchema = z.object({
  beforeSnapshot: z.string().describe('Path to the before context snapshot'),
  afterSnapshot: z.string().describe('Path to the after context snapshot'),
  diffType: z.enum(['structural', 'semantic', 'quality', 'all']).default('all').describe('Type of diff analysis to perform'),
  includeImpactAnalysis: z.boolean().default(true).describe('Include impact analysis of changes'),
});

// Export type definitions
export type FileContext = z.infer<typeof FileContextSchema>;
export type DependencyNode = z.infer<typeof DependencyNodeSchema>;
export type SemanticContext = z.infer<typeof SemanticContextSchema>;
export type ArchitecturalPattern = z.infer<typeof ArchitecturalPatternSchema>;
export type KnowledgeNode = z.infer<typeof KnowledgeNodeSchema>;
export type ContextSnapshot = z.infer<typeof ContextSnapshotSchema>;

// Analysis result types
export interface CodebaseAnalysis {
  overview: {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>;
    complexity: {
      average: number;
      median: number;
      high: string[];
    };
  };
  files: FileContext[];
  hotspots: {
    path: string;
    issues: string[];
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: Array<{
    from: string;
    to: string;
    type: string;
    weight: number;
  }>;
  cycles: string[][];
  metrics: {
    totalDependencies: number;
    externalDependencies: number;
    depth: number;
    fanIn: Record<string, number>;
    fanOut: Record<string, number>;
  };
}

export interface ArchitecturalAnalysis {
  detectedPatterns: ArchitecturalPattern[];
  layering: {
    layers: Array<{
      name: string;
      components: string[];
      dependencies: string[];
    }>;
    violations: Array<{
      description: string;
      components: string[];
    }>;
  };
  modularity: {
    cohesion: number;
    coupling: number;
    instability: number;
  };
  recommendations: string[];
}