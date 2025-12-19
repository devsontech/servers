# Context-Gen: Advanced MCP Server for Agentic Coding

An advanced Model Context Protocol (MCP) server designed to build comprehensive context for AI-assisted development workflows. This server provides intelligent codebase analysis, semantic understanding, architectural pattern detection, and knowledge graph generation to empower agentic coding systems.

## 🚀 Features

### Core Analysis Capabilities
- **Codebase Analysis**: Deep structural analysis with complexity metrics, maintainability indexing, and hotspot detection
- **Dependency Mapping**: Comprehensive dependency graph generation with circular dependency detection and risk assessment
- **Semantic Understanding**: Extract semantic meaning, relationships, and architectural patterns from code
- **Pattern Detection**: Identify architectural patterns (MVC, MVVM, microservices) and anti-patterns

### Intelligent Context Generation
- **Smart Summarization**: Generate audience-specific context summaries (executive, technical, onboarding, handoff)
- **Mental Model Creation**: Build comprehensive mental models from developer, architect, manager, and tester perspectives
- **Knowledge Graphs**: Construct intelligent knowledge graphs with automatic clustering and relationship detection
- **Context Recommendations**: AI-powered recommendations based on task context and user profiles

### Advanced Analysis Tools
- **Quality Analysis**: Comprehensive code quality assessment with configurable thresholds
- **Security Scanning**: Vulnerability detection, secret scanning, and security risk assessment
- **Performance Analysis**: Bottleneck detection and optimization opportunity identification
- **Technical Debt Assessment**: Prioritized technical debt analysis with effort estimation

### Incremental Learning System
- **Context Prioritization**: Dynamic prioritization based on task relevance and user preferences
- **Relevance Scoring**: Multi-factor relevance scoring with configurable weighting
- **Evolution Tracking**: Track how context evolves over time with trend analysis
- **Adaptive Learning**: Learn from user feedback and adapt recommendations

### Collaboration & Documentation
- **Team Handoffs**: Generate comprehensive handoff documentation with risk assessment
- **Onboarding Guides**: Create role-specific onboarding guides with interactive code tours
- **Tribal Knowledge Extraction**: Extract and document implicit knowledge from various sources
- **Context Diffing**: Analyze differences between context snapshots with impact assessment

## 📦 Installation

```bash
cd C:\Users\Devson\Source\Repos\servers\src\context-gen
npm install
npm run build
```

## 🔧 Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "context-gen": {
      "command": "node",
      "args": ["C:/Users/Devson/Source/Repos/servers/src/context-gen/build/index.js"],
      "env": {}
    }
  }
}
```

## 🛠️ Available Tools

### Core Analysis Tools (5 tools)

#### `analyze_codebase`
Analyze codebase structure, complexity, and quality metrics.

```json
{
  "projectPath": "/path/to/project",
  "includePatterns": ["**/*.ts", "**/*.js"],
  "excludePatterns": ["node_modules/**", "**/*.test.*"],
  "maxDepth": 10,
  "analysisDepth": "deep"
}
```

**Output**: Comprehensive analysis including:
- File structure and complexity metrics
- Language distribution and hotspot detection
- Maintainability index and recommendations
- Quality indicators and improvement suggestions

#### `build_dependency_graph`
Build comprehensive dependency graph with cycle detection.

```json
{
  "projectPath": "/path/to/project",
  "includeExternal": true,
  "detectCircular": true,
  "maxDepth": 5
}
```

**Output**: Dependency analysis including:
- Complete dependency graph with metrics
- Circular dependency detection and resolution paths
- Fan-in/fan-out analysis
- Risk assessment for critical dependencies

#### `extract_semantic_context`
Extract semantic meaning and relationships from code.

```json
{
  "filePath": "/path/to/file.ts",
  "includeRelationships": true,
  "confidenceThreshold": 0.7
}
```

**Output**: Semantic analysis including:
- Extracted entities with purpose and confidence scores
- Relationship mapping between code elements
- Contextual tags and metadata
- Cross-reference analysis

### Context Generation Tools (4 tools)

#### `generate_context_summary`
Generate intelligent, audience-specific context summaries.

```json
{
  "contextData": { "analysis": "...", "files": ["..."] },
  "summaryType": "executive",
  "audience": "technical_lead",
  "focusAreas": ["architecture", "security", "performance"]
}
```

**Output**: Tailored summaries including:
- Executive overview with key metrics
- Technical deep-dives for developers
- Onboarding guides for new team members
- Handoff documentation with risk analysis

#### `create_mental_model`
Create comprehensive mental models from different perspectives.

```json
{
  "projectPath": "/path/to/project",
  "perspective": "architect",
  "includeDataFlow": true,
  "includeUserJourney": true
}
```

**Output**: Mental models including:
- Concept mapping with importance scoring
- Data flow analysis and transformation points
- User journey mapping
- Visual structure representation

#### `build_knowledge_graph`
Build intelligent knowledge graphs with clustering.

```json
{
  "contextSources": [
    { "type": "codebase", "path": "/path/to/code" },
    { "type": "documentation", "path": "/path/to/docs" }
  ],
  "extractionRules": {
    "minConfidence": 0.6,
    "includeInferred": true
  },
  "mergingStrategy": "weighted_union"
}
```

**Output**: Knowledge graphs including:
- Nodes with importance and certainty scores
- Relationship mapping with strength indicators
- Automatic clustering and insights
- Cross-domain knowledge connections

### Advanced Analysis Tools (4 tools)

#### `code_quality_analysis`
Perform comprehensive code quality analysis.

```json
{
  "projectPath": "/path/to/project",
  "thresholds": {
    "complexity": 15,
    "maintainability": 70,
    "testCoverage": 80
  },
  "includeMetrics": ["complexity", "maintainability", "testCoverage", "duplication"]
}
```

#### `security_context_analysis`
Analyze security context and vulnerabilities.

```json
{
  "projectPath": "/path/to/project",
  "scanDepth": "comprehensive",
  "includeSecrets": true,
  "riskAssessment": true
}
```

#### `performance_bottleneck_detection`
Detect performance bottlenecks and optimization opportunities.

```json
{
  "projectPath": "/path/to/project",
  "analysisType": "static",
  "focusAreas": ["database", "api", "memory", "cpu"]
}
```

#### `technical_debt_assessment`
Assess technical debt with prioritization.

```json
{
  "projectPath": "/path/to/project",
  "debtTypes": ["code_smells", "outdated_dependencies", "missing_tests"],
  "prioritizationStrategy": "impact_effort_matrix"
}
```

### Additional Tools (10+ more tools)
- `incremental_learning`: Adaptive learning from user feedback
- `context_prioritization`: Dynamic context prioritization
- `relevance_scoring`: Multi-factor relevance assessment
- `context_evolution_tracking`: Evolution trend analysis
- `save_context_snapshot`: Context persistence with versioning
- `load_context_snapshot`: Context restoration with validation
- `merge_contexts`: Context merging with conflict resolution
- `generate_team_handoff`: Team transition documentation
- `create_onboarding_guide`: Role-specific onboarding
- `extract_tribal_knowledge`: Implicit knowledge extraction
- `context_diff_analysis`: Context change impact analysis

## 🏗️ Architecture

```
context-gen/
├── src/
│   ├── core/
│   │   ├── types.ts              # Core type definitions and schemas
│   │   └── advanced-types.ts     # Advanced analysis schemas
│   ├── analyzers/
│   │   ├── codebase-analyzer.ts  # Codebase structure analysis
│   │   ├── dependency-analyzer.ts # Dependency graph building
│   │   └── semantic-analyzer.ts   # Semantic understanding
│   ├── generators/
│   │   └── context-generator.ts   # Intelligent context generation
│   └── index.ts                   # Main MCP server
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Use Cases

### For AI Development Agents
- **Context Building**: Gradually build comprehensive context for complex coding tasks
- **Codebase Understanding**: Quickly understand large, unfamiliar codebases
- **Architectural Analysis**: Analyze and document system architecture
- **Quality Assessment**: Continuous quality monitoring and improvement suggestions

### For Development Teams
- **Onboarding**: Accelerate new developer onboarding with generated guides
- **Knowledge Transfer**: Capture and transfer tribal knowledge
- **Technical Debt Management**: Systematic technical debt assessment and prioritization
- **Security Analysis**: Continuous security context analysis

### For Project Management
- **Risk Assessment**: Identify architectural and dependency risks
- **Progress Tracking**: Track context evolution and project maturity
- **Team Handoffs**: Smooth transition documentation
- **Decision Documentation**: Capture and reference architectural decisions

## 🔬 Advanced Features

### Intelligent Analysis
- **AST Parsing**: Deep code structure analysis using Acorn parser
- **NLP Processing**: Natural language processing for semantic understanding
- **Pattern Recognition**: Machine learning-based architectural pattern detection
- **Graph Algorithms**: Advanced graph analysis for dependency and knowledge graphs

### Adaptive Learning
- **Feedback Integration**: Learn from user interactions and feedback
- **Context Prioritization**: Dynamic prioritization based on task relevance
- **Recommendation Engine**: AI-powered context and action recommendations
- **Evolution Tracking**: Track how context and understanding evolve over time

### Collaboration Support
- **Multi-Perspective Analysis**: Generate context from different role perspectives
- **Team Integration**: Support for distributed team collaboration
- **Knowledge Extraction**: Extract implicit knowledge from various sources
- **Documentation Generation**: Automated documentation with different audiences in mind

## 🚀 Getting Started

1. **Basic Codebase Analysis**:
   ```json
   {
     "tool": "analyze_codebase",
     "arguments": {
       "projectPath": "/your/project/path",
       "analysisDepth": "comprehensive"
     }
   }
   ```

2. **Generate Context Summary**:
   ```json
   {
     "tool": "generate_context_summary",
     "arguments": {
       "summaryType": "technical",
       "audience": "developer",
       "focusAreas": ["architecture", "patterns"]
     }
   }
   ```

3. **Build Knowledge Graph**:
   ```json
   {
     "tool": "build_knowledge_graph",
     "arguments": {
       "contextSources": [{"type": "codebase", "path": "/your/project"}],
       "extractionRules": {"minConfidence": 0.7}
     }
   }
   ```

## 🔧 Development

### Build and Test
```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Type checking
npm run type-check
```

### Adding New Tools
1. Define schemas in `src/core/types.ts` or `src/core/advanced-types.ts`
2. Implement analysis logic in appropriate analyzer class
3. Add tool registration in `src/index.ts`
4. Update documentation

## 📊 Performance

- **Analysis Speed**: Optimized AST parsing with configurable depth limits
- **Memory Usage**: Efficient memory management with streaming analysis
- **Scalability**: Supports large codebases (1M+ LOC) with incremental processing
- **Caching**: Intelligent caching of analysis results for repeated operations

## 🤝 Contributing

This is an advanced MCP server designed for agentic coding workflows. Contributions welcome for:
- New analysis algorithms
- Additional architectural pattern detection
- Enhanced semantic understanding
- Integration with new development tools
- Performance optimizations

## 📄 License

MIT License - see LICENSE file for details.

## 🎉 Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP Protocol implementation
- [Acorn](https://github.com/acornjs/acorn) - JavaScript AST parsing
- [Natural](https://github.com/NaturalNode/natural) - Natural language processing
- [Zod](https://github.com/colinhacks/zod) - Schema validation

---

**Context-Gen** - Empowering AI-assisted development with intelligent context building 🤖✨