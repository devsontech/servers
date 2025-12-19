import * as fs from 'fs/promises';
import * as path from 'path';
import { KnowledgeNode, ContextSnapshot } from '../core/types.js';
import { SemanticContext } from '../core/types.js';

export class ContextGenerator {
  private readonly SEMANTIC_SIMILARITY_THRESHOLD = 0.7;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.6;

  async generateContextSummary(
    contextData: Record<string, any>,
    summaryType: 'executive' | 'technical' | 'onboarding' | 'handoff',
    audience: 'developer' | 'architect' | 'manager' | 'new-team-member',
    focusAreas: string[] = []
  ): Promise<{
    summary: string;
    keyPoints: string[];
    recommendations: string[];
    metrics: Record<string, number>;
    nextSteps: string[];
  }> {
    const keyPoints: string[] = [];
    const recommendations: string[] = [];
    const metrics: Record<string, number> = {};
    const nextSteps: string[] = [];

    // Extract key metrics from context data
    if (contextData.codebaseAnalysis) {
      const analysis = contextData.codebaseAnalysis;
      metrics.totalFiles = analysis.overview?.totalFiles || 0;
      metrics.totalLines = analysis.overview?.totalLines || 0;
      metrics.averageComplexity = analysis.overview?.complexity?.average || 0;
      metrics.hotspots = analysis.hotspots?.length || 0;
    }

    if (contextData.dependencyGraph) {
      const deps = contextData.dependencyGraph;
      metrics.totalDependencies = deps.metrics?.totalDependencies || 0;
      metrics.externalDependencies = deps.metrics?.externalDependencies || 0;
      metrics.circularDependencies = deps.cycles?.length || 0;
    }

    // Generate audience-specific content
    const summary = this.generateSummaryText(contextData, summaryType, audience, focusAreas);
    keyPoints.push(...this.extractKeyPoints(contextData, summaryType, audience));
    recommendations.push(...this.generateRecommendations(contextData, audience));
    nextSteps.push(...this.generateNextSteps(contextData, summaryType, audience));

    return {
      summary,
      keyPoints,
      recommendations,
      metrics,
      nextSteps,
    };
  }

  async createMentalModel(
    projectPath: string,
    perspective: 'user' | 'developer' | 'architect' | 'tester',
    includeDataFlow: boolean = true,
    includeUserJourney: boolean = false
  ): Promise<{
    conceptMap: Array<{
      concept: string;
      relationships: Array<{ target: string; type: string; strength: number }>;
      importance: number;
      description: string;
    }>;
    dataFlow: Array<{
      source: string;
      target: string;
      dataType: string;
      transformation?: string;
    }>;
    userJourney?: Array<{
      step: string;
      actor: string;
      action: string;
      system: string;
      outcome: string;
    }>;
    visualStructure: {
      layers: string[];
      components: Record<string, string[]>;
      interfaces: string[];
    };
  }> {
    const conceptMap = await this.buildConceptMap(projectPath, perspective);
    const dataFlow = includeDataFlow ? await this.analyzeDataFlow(projectPath, perspective) : [];
    const userJourney = includeUserJourney ? await this.mapUserJourney(projectPath) : undefined;
    const visualStructure = await this.createVisualStructure(projectPath, perspective);

    return {
      conceptMap,
      dataFlow,
      ...(userJourney && { userJourney }),
      visualStructure,
    };
  }

  async buildKnowledgeGraph(
    contextSources: string[],
    extractionRules: Array<{ type: string; pattern: string; confidence: number }> = [],
    mergingStrategy: 'conservative' | 'aggressive' | 'balanced' = 'balanced'
  ): Promise<{
    nodes: KnowledgeNode[];
    relationships: Array<{
      source: string;
      target: string;
      type: string;
      strength: number;
      evidence: string[];
    }>;
    clusters: Array<{
      name: string;
      nodes: string[];
      cohesion: number;
    }>;
    insights: Array<{
      type: string;
      description: string;
      confidence: number;
      supportingEvidence: string[];
    }>;
  }> {
    const nodes: KnowledgeNode[] = [];
    const relationships: Array<{
      source: string;
      target: string;
      type: string;
      strength: number;
      evidence: string[];
    }> = [];

    // Process each context source
    for (const source of contextSources) {
      try {
        if (source.endsWith('.json')) {
          // Process JSON context data
          const data = JSON.parse(await fs.readFile(source, 'utf-8'));
          const extractedNodes = await this.extractKnowledgeFromData(data, source);
          nodes.push(...extractedNodes);
        } else if (await this.isFileOrDirectory(source)) {
          // Process file or directory
          const extractedNodes = await this.extractKnowledgeFromCode(source, extractionRules);
          nodes.push(...extractedNodes);
        } else {
          // Treat as URL or other resource
          console.warn(`Unsupported context source type: ${source}`);
        }
      } catch (error) {
        console.warn(`Failed to process context source ${source}:`, error);
      }
    }

    // Merge duplicate nodes based on strategy
    const mergedNodes = this.mergeKnowledgeNodes(nodes, mergingStrategy);

    // Build relationships between nodes
    for (let i = 0; i < mergedNodes.length; i++) {
      for (let j = i + 1; j < mergedNodes.length; j++) {
        const node1 = mergedNodes[i];
        const node2 = mergedNodes[j];
        if (!node1 || !node2) continue;
        
        const relationship = this.analyzeNodeRelationship(node1, node2);
        if (relationship.strength > this.SEMANTIC_SIMILARITY_THRESHOLD) {
          relationships.push({
            source: node1.id,
            target: node2.id,
            type: relationship.type,
            strength: relationship.strength,
            evidence: relationship.evidence,
          });
        }
      }
    }

    // Identify clusters
    const clusters = this.identifyClusters(mergedNodes, relationships);

    // Generate insights
    const insights = this.generateKnowledgeInsights(mergedNodes, relationships, clusters);

    return {
      nodes: mergedNodes,
      relationships,
      clusters,
      insights,
    };
  }

  private generateSummaryText(
    contextData: Record<string, any>,
    summaryType: string,
    audience: string,
    focusAreas: string[]
  ): string {
    const sections: string[] = [];

    // Project overview section
    const projectName = contextData.projectName || 'Project';
    sections.push(`# ${projectName} - ${summaryType.charAt(0).toUpperCase() + summaryType.slice(1)} Summary`);

    if (summaryType === 'executive') {
      sections.push(this.generateExecutiveSummary(contextData));
    } else if (summaryType === 'technical') {
      sections.push(this.generateTechnicalSummary(contextData, audience));
    } else if (summaryType === 'onboarding') {
      sections.push(this.generateOnboardingSummary(contextData));
    } else if (summaryType === 'handoff') {
      sections.push(this.generateHandoffSummary(contextData));
    }

    // Focus areas
    if (focusAreas.length > 0) {
      sections.push('\\n## Focus Areas');
      for (const area of focusAreas) {
        if (contextData[area]) {
          sections.push(`\\n### ${area}`);
          sections.push(this.summarizeContextArea(contextData[area], audience));
        }
      }
    }

    return sections.join('\\n');
  }

  private generateExecutiveSummary(contextData: Record<string, any>): string {
    const parts: string[] = ['## Executive Overview'];

    if (contextData.codebaseAnalysis) {
      const analysis = contextData.codebaseAnalysis;
      const health = this.assessCodebaseHealth(analysis);
      parts.push(`**Codebase Health:** ${health.score}/100 (${health.grade})`);
      parts.push(`**Scale:** ${analysis.overview?.totalFiles || 0} files, ${Math.round((analysis.overview?.totalLines || 0) / 1000)}k lines of code`);
    }

    if (contextData.technicalDebt) {
      const debt = contextData.technicalDebt;
      parts.push(`**Technical Debt:** ${debt.overall?.level || 'Unknown'} level, estimated ${debt.overall?.estimatedCost || 'unknown'} to address`);
    }

    if (contextData.dependencyGraph) {
      const deps = contextData.dependencyGraph;
      parts.push(`**Dependencies:** ${deps.metrics?.totalDependencies || 0} total, ${deps.cycles?.length || 0} circular dependencies`);
    }

    return parts.join('\\n');
  }

  private generateTechnicalSummary(contextData: Record<string, any>, audience: string): string {
    const parts: string[] = ['## Technical Overview'];

    if (contextData.architecturalAnalysis) {
      const arch = contextData.architecturalAnalysis;
      parts.push(`**Architecture:** ${arch.detectedPatterns?.map((p: any) => p.pattern).join(', ') || 'No clear pattern detected'}`);
      
      if (arch.modularity) {
        parts.push(`**Modularity:** Cohesion: ${Math.round(arch.modularity.cohesion * 100)}%, Coupling: ${Math.round(arch.modularity.coupling * 100)}%`);
      }
    }

    if (contextData.qualityAnalysis) {
      const quality = contextData.qualityAnalysis;
      parts.push(`**Code Quality:** Overall score ${quality.overview?.overallScore || 'N/A'}, grade ${quality.overview?.grade || 'N/A'}`);
    }

    if (contextData.performanceAnalysis) {
      const perf = contextData.performanceAnalysis;
      parts.push(`**Performance:** ${perf.bottlenecks?.length || 0} bottlenecks identified, ${perf.overview?.criticalIssues || 0} critical issues`);
    }

    if (audience === 'architect') {
      parts.push('\\n### Architectural Considerations');
      if (contextData.architecturalAnalysis?.recommendations) {
        contextData.architecturalAnalysis.recommendations.forEach((rec: string) => parts.push(`- ${rec}`));
      }
    }

    return parts.join('\\n');
  }

  private generateOnboardingSummary(contextData: Record<string, any>): string {
    const parts: string[] = ['## Onboarding Guide'];

    parts.push('### Project Structure');
    if (contextData.codebaseAnalysis?.overview?.languages) {
      const languages = Object.entries(contextData.codebaseAnalysis.overview.languages);
      parts.push('**Primary Technologies:**');
      languages.forEach(([lang, count]) => parts.push(`- ${lang}: ${count} files`));
    }

    parts.push('\\n### Key Components');
    if (contextData.architecturalAnalysis?.detectedPatterns) {
      contextData.architecturalAnalysis.detectedPatterns.forEach((pattern: any) => {
        parts.push(`**${pattern.pattern.toUpperCase()}:**`);
        pattern.components?.forEach((comp: any) => {
          parts.push(`- ${comp.name}: ${comp.role} (${comp.files?.length || 0} files)`);
        });
      });
    }

    parts.push('\\n### Getting Started');
    parts.push('1. Set up development environment');
    parts.push('2. Review architectural documentation');
    parts.push('3. Explore key modules and their relationships');
    parts.push('4. Run tests to understand expected behavior');

    return parts.join('\\n');
  }

  private generateHandoffSummary(contextData: Record<string, any>): string {
    const parts: string[] = ['## Handoff Summary'];

    parts.push('### Current State');
    if (contextData.codebaseAnalysis) {
      const hotspots = contextData.codebaseAnalysis.hotspots || [];
      if (hotspots.length > 0) {
        parts.push(`**Hotspots:** ${hotspots.length} files requiring attention`);
        hotspots.slice(0, 3).forEach((spot: any) => {
          parts.push(`- ${spot.path}: ${spot.issues.join(', ')}`);
        });
      }
    }

    if (contextData.technicalDebt) {
      parts.push('\\n### Technical Debt');
      const debt = contextData.technicalDebt;
      parts.push(`**Priority Items:** ${debt.prioritizedBacklog?.length || 0} items in backlog`);
      debt.prioritizedBacklog?.slice(0, 5).forEach((item: any) => {
        parts.push(`${item.rank}. ${item.item} (${item.effort}, ROI: ${item.roi})`);
      });
    }

    parts.push('\\n### Immediate Actions Required');
    if (contextData.securityAnalysis?.findings) {
      const criticalFindings = contextData.securityAnalysis.findings.filter((f: any) => f.severity === 'critical');
      if (criticalFindings.length > 0) {
        parts.push(`- Address ${criticalFindings.length} critical security findings`);
      }
    }

    return parts.join('\\n');
  }

  private extractKeyPoints(contextData: Record<string, any>, summaryType: string, audience: string): string[] {
    const keyPoints: string[] = [];

    if (contextData.codebaseAnalysis) {
      const analysis = contextData.codebaseAnalysis;
      keyPoints.push(`Codebase contains ${analysis.overview?.totalFiles || 0} files across ${Object.keys(analysis.overview?.languages || {}).length} programming languages`);
      
      if (analysis.overview?.complexity?.high?.length > 0) {
        keyPoints.push(`${analysis.overview.complexity.high.length} files have high complexity and may need refactoring`);
      }
    }

    if (contextData.dependencyGraph?.cycles?.length > 0) {
      keyPoints.push(`${contextData.dependencyGraph.cycles.length} circular dependencies detected that should be resolved`);
    }

    if (contextData.architecturalAnalysis?.detectedPatterns?.length > 0) {
      const patterns = contextData.architecturalAnalysis.detectedPatterns.map((p: any) => p.pattern).join(', ');
      keyPoints.push(`Architecture follows ${patterns} pattern(s)`);
    }

    return keyPoints;
  }

  private generateRecommendations(contextData: Record<string, any>, audience: string): string[] {
    const recommendations: string[] = [];

    // Aggregate recommendations from various analyses
    if (contextData.codebaseAnalysis?.recommendations) {
      recommendations.push(...contextData.codebaseAnalysis.recommendations);
    }

    if (contextData.architecturalAnalysis?.recommendations) {
      recommendations.push(...contextData.architecturalAnalysis.recommendations);
    }

    if (contextData.qualityAnalysis?.recommendations) {
      contextData.qualityAnalysis.recommendations.forEach((rec: any) => {
        if (rec.priority === 'high' || audience === 'architect') {
          recommendations.push(`${rec.category}: ${rec.description} (${rec.estimatedEffort})`);
        }
      });
    }

    return recommendations.slice(0, 10); // Limit to top 10
  }

  private generateNextSteps(contextData: Record<string, any>, summaryType: string, audience: string): string[] {
    const nextSteps: string[] = [];

    if (summaryType === 'onboarding') {
      nextSteps.push('Review project documentation and setup instructions');
      nextSteps.push('Familiarize yourself with the main architectural components');
      nextSteps.push('Run the test suite to understand expected behavior');
      nextSteps.push('Identify a small task or bug fix to start contributing');
    } else if (summaryType === 'handoff') {
      nextSteps.push('Address any critical security or performance issues');
      nextSteps.push('Review and prioritize technical debt backlog');
      nextSteps.push('Update documentation based on recent changes');
      nextSteps.push('Ensure all tests are passing and CI/CD is stable');
    } else if (audience === 'architect') {
      nextSteps.push('Evaluate architectural patterns and consistency');
      nextSteps.push('Plan refactoring for high-complexity components');
      nextSteps.push('Design scalability improvements');
    } else {
      nextSteps.push('Address high-priority code quality issues');
      nextSteps.push('Resolve circular dependencies');
      nextSteps.push('Improve test coverage in critical areas');
    }

    return nextSteps;
  }

  private async buildConceptMap(
    projectPath: string,
    perspective: 'user' | 'developer' | 'architect' | 'tester'
  ): Promise<Array<{
    concept: string;
    relationships: Array<{ target: string; type: string; strength: number }>;
    importance: number;
    description: string;
  }>> {
    const concepts: Array<{
      concept: string;
      relationships: Array<{ target: string; type: string; strength: number }>;
      importance: number;
      description: string;
    }> = [];

    // This would typically analyze the codebase to extract concepts
    // For now, returning a simplified structure
    const baseComponents = ['User Interface', 'Business Logic', 'Data Layer', 'External APIs'];
    
    baseComponents.forEach((component, index) => {
      concepts.push({
        concept: component,
        relationships: [],
        importance: 1.0 - (index * 0.1),
        description: this.getComponentDescription(component, perspective),
      });
    });

    // Add relationships between concepts
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const concept1 = concepts[i];
        const concept2 = concepts[j];
        if (!concept1 || !concept2) continue;
        
        const strength = this.calculateConceptRelationship(concept1.concept, concept2.concept);
        if (strength > 0.5) {
          concept1.relationships.push({
            target: concept2.concept,
            type: 'interacts_with',
            strength,
          });
        }
      }
    }

    return concepts;
  }

  private async analyzeDataFlow(
    projectPath: string,
    perspective: 'user' | 'developer' | 'architect' | 'tester'
  ): Promise<Array<{
    source: string;
    target: string;
    dataType: string;
    transformation?: string;
  }>> {
    // Simplified data flow analysis
    return [
      { source: 'User Input', target: 'Validation Layer', dataType: 'User Data', transformation: 'Validation & Sanitization' },
      { source: 'Validation Layer', target: 'Business Logic', dataType: 'Validated Data', transformation: 'Business Rules Applied' },
      { source: 'Business Logic', target: 'Data Layer', dataType: 'Domain Objects', transformation: 'Persistence Mapping' },
      { source: 'Data Layer', target: 'Database', dataType: 'SQL/NoSQL Queries', transformation: 'Data Storage' },
    ];
  }

  private async mapUserJourney(projectPath: string): Promise<Array<{
    step: string;
    actor: string;
    action: string;
    system: string;
    outcome: string;
  }>> {
    // Simplified user journey mapping
    return [
      { step: '1', actor: 'User', action: 'Submits request', system: 'Web Interface', outcome: 'Request validated' },
      { step: '2', actor: 'System', action: 'Processes request', system: 'Business Layer', outcome: 'Business rules applied' },
      { step: '3', actor: 'System', action: 'Stores data', system: 'Data Layer', outcome: 'Data persisted' },
      { step: '4', actor: 'System', action: 'Returns response', system: 'Web Interface', outcome: 'User receives feedback' },
    ];
  }

  private async createVisualStructure(
    projectPath: string,
    perspective: 'user' | 'developer' | 'architect' | 'tester'
  ): Promise<{
    layers: string[];
    components: Record<string, string[]>;
    interfaces: string[];
  }> {
    return {
      layers: ['Presentation', 'Business', 'Data', 'Infrastructure'],
      components: {
        'Presentation': ['Controllers', 'Views', 'Components'],
        'Business': ['Services', 'Domain Models', 'Business Rules'],
        'Data': ['Repositories', 'Data Access', 'Caching'],
        'Infrastructure': ['Configuration', 'Logging', 'External APIs'],
      },
      interfaces: ['REST API', 'GraphQL', 'Database Interface', 'Message Queue'],
    };
  }

  private assessCodebaseHealth(analysis: any): { score: number; grade: string } {
    let score = 100;
    
    if (analysis.overview?.complexity?.average > 10) score -= 20;
    if (analysis.hotspots?.length > analysis.overview?.totalFiles * 0.1) score -= 15;
    if (analysis.overview?.complexity?.high?.length > 0) score -= 10;
    
    score = Math.max(0, score);
    
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    return { score, grade };
  }

  private summarizeContextArea(areaData: any, audience: string): string {
    // Generic context area summarization
    if (typeof areaData === 'object' && areaData !== null) {
      const keys = Object.keys(areaData);
      const summary = keys.slice(0, 3).map(key => `${key}: ${this.formatValue(areaData[key])}`).join(', ');
      return summary;
    }
    return String(areaData);
  }

  private formatValue(value: any): string {
    if (Array.isArray(value)) {
      return `${value.length} items`;
    } else if (typeof value === 'object' && value !== null) {
      return `${Object.keys(value).length} properties`;
    }
    return String(value);
  }

  private async extractKnowledgeFromData(data: any, source: string): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = [];
    const timestamp = new Date().toISOString();

    // Extract knowledge from structured data
    if (data.functions) {
      data.functions.forEach((func: any, index: number) => {
        nodes.push({
          id: `${source}-func-${index}`,
          type: 'concept',
          title: func.name || `Function ${index}`,
          description: func.purpose || 'Function implementation',
          importance: func.complexity ? Math.min(1.0, func.complexity / 20) : 0.5,
          certainty: 0.8,
          sources: [source],
          connections: [],
          tags: ['function', 'code'],
          lastUpdated: timestamp,
        });
      });
    }

    if (data.classes) {
      data.classes.forEach((cls: any, index: number) => {
        nodes.push({
          id: `${source}-class-${index}`,
          type: 'concept',
          title: cls.name || `Class ${index}`,
          description: cls.purpose || 'Class definition',
          importance: 0.7,
          certainty: 0.8,
          sources: [source],
          connections: [],
          tags: ['class', 'code'],
          lastUpdated: timestamp,
        });
      });
    }

    return nodes;
  }

  private async extractKnowledgeFromCode(source: string, rules: Array<{ type: string; pattern: string; confidence: number }>): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = [];
    
    try {
      const stats = await fs.stat(source);
      
      if (stats.isDirectory()) {
        // Process directory
        const files = await fs.readdir(source);
        for (const file of files.slice(0, 10)) { // Limit to prevent overwhelming
          const filePath = path.join(source, file);
          const fileNodes = await this.extractKnowledgeFromCode(filePath, rules);
          nodes.push(...fileNodes);
        }
      } else {
        // Process file
        const content = await fs.readFile(source, 'utf-8');
        const fileName = path.basename(source);
        
        nodes.push({
          id: `file-${fileName}`,
          type: 'concept',
          title: fileName,
          description: `Source file: ${fileName}`,
          importance: 0.6,
          certainty: 1.0,
          sources: [source],
          connections: [],
          tags: ['file', 'source'],
          lastUpdated: new Date().toISOString(),
        });

        // Apply extraction rules
        for (const rule of rules) {
          const regex = new RegExp(rule.pattern, 'g');
          const matches = content.match(regex);
          if (matches) {
            matches.forEach((match, index) => {
              nodes.push({
                id: `${fileName}-${rule.type}-${index}`,
                type: 'pattern',
                title: `${rule.type}: ${match.substring(0, 50)}`,
                description: `Found ${rule.type} pattern in ${fileName}`,
                importance: 0.4,
                certainty: rule.confidence,
                sources: [source],
                connections: [],
                tags: [rule.type, 'pattern'],
                lastUpdated: new Date().toISOString(),
              });
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to extract knowledge from ${source}:`, error);
    }

    return nodes;
  }

  private mergeKnowledgeNodes(nodes: KnowledgeNode[], strategy: 'conservative' | 'aggressive' | 'balanced'): KnowledgeNode[] {
    const nodeMap = new Map<string, KnowledgeNode>();
    
    for (const node of nodes) {
      const existingNode = Array.from(nodeMap.values()).find(n => 
        this.calculateSimilarity(n.title, node.title) > this.getSimilarityThreshold(strategy)
      );

      if (existingNode) {
        // Merge nodes
        existingNode.sources = [...new Set([...existingNode.sources, ...node.sources])];
        existingNode.tags = [...new Set([...existingNode.tags, ...node.tags])];
        existingNode.importance = Math.max(existingNode.importance, node.importance);
        existingNode.certainty = (existingNode.certainty + node.certainty) / 2;
        existingNode.description = existingNode.description.length > node.description.length ? 
          existingNode.description : node.description;
      } else {
        nodeMap.set(node.id, node);
      }
    }

    return Array.from(nodeMap.values());
  }

  private getSimilarityThreshold(strategy: string): number {
    switch (strategy) {
      case 'conservative': return 0.9;
      case 'aggressive': return 0.6;
      case 'balanced': return 0.75;
      default: return 0.75;
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple string similarity calculation
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return 1 - (distance / maxLen);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]! + 1,
          matrix[j - 1]![i]! + 1,
          matrix[j - 1]![i - 1]! + cost
        );
      }
    }
    
    return matrix[str2.length]![str1.length]!;
  }

  private analyzeNodeRelationship(node1: KnowledgeNode, node2: KnowledgeNode): {
    type: string;
    strength: number;
    evidence: string[];
  } {
    const evidence: string[] = [];
    let strength = 0;
    let relationType = 'related_to';

    // Check tag overlap
    const commonTags = node1.tags.filter(tag => node2.tags.includes(tag));
    if (commonTags.length > 0) {
      strength += 0.3 * (commonTags.length / Math.max(node1.tags.length, node2.tags.length));
      evidence.push(`Shared tags: ${commonTags.join(', ')}`);
    }

    // Check source overlap
    const commonSources = node1.sources.filter(source => node2.sources.includes(source));
    if (commonSources.length > 0) {
      strength += 0.4;
      evidence.push(`Common sources: ${commonSources.length}`);
    }

    // Check title similarity
    const titleSimilarity = this.calculateSimilarity(node1.title, node2.title);
    if (titleSimilarity > 0.3) {
      strength += 0.3 * titleSimilarity;
      evidence.push(`Title similarity: ${Math.round(titleSimilarity * 100)}%`);
    }

    // Determine relationship type based on node types
    if (node1.type === 'concept' && node2.type === 'pattern') {
      relationType = 'implements';
    } else if (node1.type === 'decision' && node2.type === 'constraint') {
      relationType = 'constrains';
    }

    return { type: relationType, strength: Math.min(1.0, strength), evidence };
  }

  private identifyClusters(
    nodes: KnowledgeNode[], 
    relationships: Array<{ source: string; target: string; strength: number }>
  ): Array<{ name: string; nodes: string[]; cohesion: number }> {
    const clusters: Array<{ name: string; nodes: string[]; cohesion: number }> = [];
    const visited = new Set<string>();

    // Simple clustering based on strong relationships
    for (const node of nodes) {
      if (visited.has(node.id)) continue;

      const cluster = { name: node.title, nodes: [node.id], cohesion: 0 };
      visited.add(node.id);

      // Find strongly connected nodes
      const strongRelationships = relationships.filter(
        r => (r.source === node.id || r.target === node.id) && r.strength > 0.7
      );

      for (const rel of strongRelationships) {
        const otherId = rel.source === node.id ? rel.target : rel.source;
        if (!visited.has(otherId)) {
          cluster.nodes.push(otherId);
          visited.add(otherId);
        }
      }

      if (cluster.nodes.length > 1) {
        cluster.cohesion = this.calculateClusterCohesion(cluster.nodes, relationships);
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  private calculateClusterCohesion(nodeIds: string[], relationships: Array<{ source: string; target: string; strength: number }>): number {
    if (nodeIds.length < 2) return 1.0;

    const internalRelationships = relationships.filter(
      r => nodeIds.includes(r.source) && nodeIds.includes(r.target)
    );

    const maxPossibleRelationships = (nodeIds.length * (nodeIds.length - 1)) / 2;
    const avgStrength = internalRelationships.reduce((sum, r) => sum + r.strength, 0) / 
                       Math.max(1, internalRelationships.length);

    return (internalRelationships.length / maxPossibleRelationships) * avgStrength;
  }

  private generateKnowledgeInsights(
    nodes: KnowledgeNode[],
    relationships: Array<{ source: string; target: string; type: string; strength: number }>,
    clusters: Array<{ name: string; nodes: string[]; cohesion: number }>
  ): Array<{
    type: string;
    description: string;
    confidence: number;
    supportingEvidence: string[];
  }> {
    const insights: Array<{
      type: string;
      description: string;
      confidence: number;
      supportingEvidence: string[];
    }> = [];

    // Analyze node distribution
    const typeDistribution = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantType = Object.entries(typeDistribution)
      .sort(([,a], [,b]) => b - a)[0];

    if (dominantType && dominantType[1] > nodes.length * 0.5) {
      insights.push({
        type: 'pattern',
        description: `Knowledge base is heavily focused on ${dominantType[0]} nodes (${Math.round(dominantType[1] / nodes.length * 100)}%)`,
        confidence: 0.8,
        supportingEvidence: [`${dominantType[1]} of ${nodes.length} nodes are ${dominantType[0]} type`],
      });
    }

    // Analyze clustering
    const wellFormedClusters = clusters.filter(c => c.cohesion > 0.6);
    if (wellFormedClusters.length > 0) {
      insights.push({
        type: 'best-practice',
        description: `Knowledge shows good modularity with ${wellFormedClusters.length} well-formed conceptual clusters`,
        confidence: 0.7,
        supportingEvidence: wellFormedClusters.map(c => `${c.name}: ${c.nodes.length} nodes, ${Math.round(c.cohesion * 100)}% cohesion`),
      });
    }

    // Analyze relationship patterns
    const strongRelationships = relationships.filter(r => r.strength > 0.8);
    if (strongRelationships.length > relationships.length * 0.3) {
      insights.push({
        type: 'pattern',
        description: 'Knowledge elements show strong interconnections, indicating good conceptual coherence',
        confidence: 0.75,
        supportingEvidence: [`${strongRelationships.length} of ${relationships.length} relationships are strong (>80%)`],
      });
    }

    return insights;
  }

  private getComponentDescription(component: string, perspective: string): string {
    const descriptions = {
      'User Interface': {
        'user': 'The part of the application you interact with directly',
        'developer': 'Frontend components and user interaction handlers',
        'architect': 'Presentation layer responsible for user experience',
        'tester': 'UI elements that need functional and usability testing',
      },
      'Business Logic': {
        'user': 'The core functionality that processes your requests',
        'developer': 'Service classes and domain logic implementation',
        'architect': 'Core business rules and domain model',
        'tester': 'Business rules that require unit and integration testing',
      },
      'Data Layer': {
        'user': 'Where your information is stored and managed',
        'developer': 'Database access and data persistence logic',
        'architect': 'Data access patterns and storage architecture',
        'tester': 'Data integrity and persistence testing requirements',
      },
      'External APIs': {
        'user': 'Connections to other services and systems',
        'developer': 'Third-party service integrations and API clients',
        'architect': 'External system interfaces and integration patterns',
        'tester': 'API contracts and integration testing scenarios',
      },
    };

    return (descriptions as any)[component]?.[perspective] || 'System component';
  }

  private calculateConceptRelationship(concept1: string, concept2: string): number {
    // Define relationship strengths between different concepts
    const relationships: Record<string, Record<string, number>> = {
      'User Interface': {
        'Business Logic': 0.9,
        'Data Layer': 0.3,
        'External APIs': 0.6,
      },
      'Business Logic': {
        'User Interface': 0.9,
        'Data Layer': 0.8,
        'External APIs': 0.7,
      },
      'Data Layer': {
        'User Interface': 0.3,
        'Business Logic': 0.8,
        'External APIs': 0.4,
      },
      'External APIs': {
        'User Interface': 0.6,
        'Business Logic': 0.7,
        'Data Layer': 0.4,
      },
    };

    return relationships[concept1]?.[concept2] || 0.2;
  }

  private async isFileOrDirectory(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}