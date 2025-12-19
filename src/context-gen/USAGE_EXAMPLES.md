# Context-Gen MCP Server - Usage Examples

This document provides comprehensive examples of how to use the advanced context generation tools in real-world scenarios. Each example shows the tool parameters, expected workflow, and sample outputs.

## Table of Contents

1. [Getting Started - Basic Analysis](#getting-started)
2. [Codebase Understanding Workflow](#codebase-understanding)
3. [Knowledge Extraction & Graph Building](#knowledge-extraction)
4. [Pattern Recognition & Architecture Analysis](#pattern-recognition)
5. [Team Onboarding & Documentation](#team-onboarding)
6. [Advanced Context Management](#advanced-context)
7. [Real-World Integration Examples](#integration-examples)

---

## Getting Started {#getting-started}

### Basic Codebase Analysis

**Scenario:** You're joining a new project and need to understand a complex React/Node.js application.

```json
{
  "tool": "analyze_codebase",
  "arguments": {
    "projectPath": "/path/to/your/project",
    "includeTests": true,
    "analysisDepth": "detailed",
    "languageFilters": ["typescript", "javascript", "json"]
  }
}
```

**Expected Output:**
```json
{
  "summary": {
    "totalFiles": 247,
    "linesOfCode": 15420,
    "languages": ["TypeScript", "JavaScript", "JSON", "CSS"],
    "frameworks": ["React", "Express", "Jest"],
    "complexity": "medium-high"
  },
  "fileStructure": {
    "components": ["UserProfile", "Dashboard", "Navigation"],
    "services": ["ApiService", "AuthService", "DataService"],
    "utilities": ["DateUtils", "ValidationUtils", "ConfigManager"]
  },
  "dependencies": [
    { "name": "@types/react", "version": "^18.0.0", "category": "devDependency" },
    { "name": "express", "version": "^4.18.0", "category": "dependency" }
  ],
  "insights": [
    "High component complexity in Dashboard.tsx (complexity score: 8.2)",
    "Missing TypeScript types in 12 files",
    "Potential circular dependency between UserService and DataService"
  ]
}
```

---

## Codebase Understanding Workflow {#codebase-understanding}

### Step 1: Generate Mental Model

**Use Case:** Create a conceptual understanding of a microservices architecture.

```json
{
  "tool": "generate_mental_model",
  "arguments": {
    "projectPath": "/microservices/project",
    "perspective": "architect",
    "includeDataFlow": true,
    "includeUserJourney": true
  }
}
```

**Sample Output:**
```json
{
  "conceptMap": [
    {
      "concept": "API Gateway",
      "relationships": [
        { "target": "User Service", "type": "routes_to", "strength": 0.9 },
        { "target": "Order Service", "type": "routes_to", "strength": 0.8 }
      ],
      "importance": 0.95,
      "description": "Central entry point for all client requests"
    },
    {
      "concept": "User Service",
      "relationships": [
        { "target": "Database", "type": "persists_to", "strength": 0.9 },
        { "target": "Auth Service", "type": "validates_with", "strength": 0.8 }
      ],
      "importance": 0.85,
      "description": "Manages user authentication and profile data"
    }
  ],
  "dataFlow": [
    {
      "source": "Client",
      "target": "API Gateway",
      "dataType": "HTTP Request",
      "transformation": "Route resolution and load balancing"
    },
    {
      "source": "API Gateway",
      "target": "User Service",
      "dataType": "Authenticated Request",
      "transformation": "JWT validation and user context injection"
    }
  ],
  "userJourney": [
    {
      "step": "Login Request",
      "actor": "End User",
      "action": "POST /auth/login",
      "system": "API Gateway → Auth Service",
      "outcome": "JWT token issued"
    }
  ]
}
```

### Step 2: Extract Semantic Context

**Use Case:** Understand the business logic and domain concepts.

```json
{
  "tool": "extract_semantic_context",
  "arguments": {
    "filePath": "/src/services/OrderService.ts",
    "includeComments": true,
    "semanticDepth": "deep",
    "domainFocus": "e-commerce"
  }
}
```

**Sample Output:**
```json
{
  "entities": [
    {
      "entity": "OrderProcessor",
      "type": "class",
      "purpose": "Handles order lifecycle management including validation, payment processing, and fulfillment coordination",
      "relationships": ["PaymentGateway", "InventoryService", "ShippingService"],
      "tags": ["business-logic", "transaction", "workflow"],
      "confidence": 0.92
    }
  ],
  "businessConcepts": [
    {
      "concept": "Order Fulfillment",
      "definition": "Complete process from order placement to delivery",
      "stakeholders": ["customer", "warehouse", "shipping-partner"],
      "businessRules": [
        "Orders must be validated before payment",
        "Inventory must be reserved upon successful payment",
        "Shipping notifications sent within 2 hours of dispatch"
      ]
    }
  ]
}
```

---

## Knowledge Extraction & Graph Building {#knowledge-extraction}

### Building a Knowledge Graph

**Scenario:** Create a comprehensive knowledge graph from multiple codebases and documentation.

```json
{
  "tool": "build_knowledge_graph",
  "arguments": {
    "contextSources": [
      "/project/src",
      "/project/docs",
      "/project/tests",
      "/project/README.md"
    ],
    "extractionRules": [
      { "type": "pattern", "pattern": "class\\s+(\\w+)", "confidence": 0.8 },
      { "type": "concept", "pattern": "@description\\s+(.+)", "confidence": 0.9 },
      { "type": "decision", "pattern": "TODO:|FIXME:|NOTE:", "confidence": 0.7 }
    ],
    "mergingStrategy": "balanced"
  }
}
```

**Sample Output:**
```json
{
  "nodes": [
    {
      "id": "node_001",
      "type": "concept",
      "title": "Authentication Flow",
      "description": "Multi-step process for user identity verification",
      "importance": 0.85,
      "certainty": 0.92,
      "sources": ["/src/auth/AuthService.ts", "/docs/security.md"],
      "connections": [
        { "target": "node_005", "relationship": "implements", "strength": 0.9 },
        { "target": "node_012", "relationship": "depends_on", "strength": 0.7 }
      ],
      "tags": ["security", "authentication", "user-management"]
    }
  ],
  "relationships": [
    {
      "source": "node_001",
      "target": "node_005",
      "type": "implements",
      "strength": 0.9,
      "evidence": [
        "AuthService.authenticate() method implements the flow",
        "Security documentation references this implementation"
      ]
    }
  ],
  "clusters": [
    {
      "name": "Security Components",
      "nodes": ["node_001", "node_005", "node_012"],
      "cohesion": 0.78
    }
  ],
  "insights": [
    {
      "type": "pattern",
      "description": "Strong clustering around authentication and authorization concepts",
      "confidence": 0.89,
      "impact": "high"
    },
    {
      "type": "gap",
      "description": "Limited documentation for error handling patterns",
      "confidence": 0.76,
      "impact": "medium"
    }
  ]
}
```

---

## Pattern Recognition & Architecture Analysis {#pattern-recognition}

### Detecting Architectural Patterns

**Use Case:** Identify design patterns and architectural decisions in a large codebase.

```json
{
  "tool": "detect_patterns",
  "arguments": {
    "projectPath": "/enterprise/app",
    "patternTypes": ["design", "architectural", "anti-pattern"],
    "confidenceThreshold": 0.7,
    "includeMetrics": true
  }
}
```

**Sample Output:**
```json
{
  "detectedPatterns": [
    {
      "name": "Repository Pattern",
      "type": "design",
      "confidence": 0.94,
      "locations": [
        {
          "file": "/src/data/UserRepository.ts",
          "evidence": "Interface-based data access abstraction with concrete implementations"
        },
        {
          "file": "/src/data/OrderRepository.ts", 
          "evidence": "Consistent repository interface implementation"
        }
      ],
      "benefits": [
        "Decouples business logic from data access",
        "Enables easy testing with mock repositories",
        "Provides consistent data access patterns"
      ]
    },
    {
      "name": "God Object",
      "type": "anti-pattern",
      "confidence": 0.81,
      "locations": [
        {
          "file": "/src/services/ApplicationService.ts",
          "evidence": "Single class with 47 methods and 1,240 lines of code"
        }
      ],
      "impacts": [
        "High coupling and low cohesion",
        "Difficult to maintain and test",
        "Violates Single Responsibility Principle"
      ],
      "recommendations": [
        "Split into focused service classes",
        "Extract related functionality into separate modules",
        "Apply Interface Segregation Principle"
      ]
    }
  ],
  "architecturalDecisions": [
    {
      "decision": "Microservices Architecture",
      "rationale": "Service boundaries identified based on business domains",
      "tradeoffs": {
        "benefits": ["Scalability", "Technology diversity", "Team autonomy"],
        "costs": ["Network complexity", "Data consistency challenges", "Operational overhead"]
      }
    }
  ],
  "metrics": {
    "cyclomaticComplexity": {
      "average": 4.2,
      "highest": { "file": "ApplicationService.ts", "value": 23 }
    },
    "maintainabilityIndex": 67.3,
    "technicalDebt": "medium"
  }
}
```

---

## Team Onboarding & Documentation {#team-onboarding}

### Progressive Context Building

**Scenario:** Create incremental learning materials for new team members.

```json
{
  "tool": "create_context_summary",
  "arguments": {
    "projectPath": "/team/project",
    "targetAudience": "new-developer",
    "includeQuickStart": true,
    "maxComplexity": "intermediate",
    "focusAreas": ["core-architecture", "development-workflow", "testing-approach"]
  }
}
```

**Sample Output:**
```json
{
  "executiveSummary": {
    "projectOverview": "E-commerce platform built with React frontend and Node.js microservices backend",
    "keyTechnologies": ["React 18", "Node.js", "PostgreSQL", "Docker", "Kubernetes"],
    "teamSize": 8,
    "developmentStage": "active-development"
  },
  "quickStart": {
    "prerequisites": ["Node.js 18+", "Docker", "Git"],
    "setupSteps": [
      "Clone repository: git clone [repo-url]",
      "Install dependencies: npm install",
      "Start services: docker-compose up -d",
      "Run application: npm run dev"
    ],
    "firstTask": {
      "title": "Add a new API endpoint",
      "description": "Create a simple GET endpoint to familiarize with the codebase",
      "estimatedTime": "2-3 hours",
      "files": ["/src/routes/api.ts", "/src/controllers/ExampleController.ts"]
    }
  },
  "coreArchitecture": {
    "overview": "Clean Architecture with domain-driven design principles",
    "layers": [
      {
        "name": "Presentation Layer",
        "description": "React components and API routes",
        "keyFiles": ["/src/components", "/src/routes"]
      },
      {
        "name": "Business Logic Layer", 
        "description": "Domain services and use cases",
        "keyFiles": ["/src/services", "/src/domain"]
      },
      {
        "name": "Data Access Layer",
        "description": "Repositories and database access",
        "keyFiles": ["/src/repositories", "/src/data"]
      }
    ]
  },
  "learningPath": [
    {
      "phase": "Week 1",
      "focus": "Environment setup and basic understanding",
      "tasks": [
        "Set up development environment",
        "Run existing tests",
        "Explore main application flow",
        "Review code style guidelines"
      ]
    },
    {
      "phase": "Week 2", 
      "focus": "Feature development and testing",
      "tasks": [
        "Implement a simple feature",
        "Write unit tests",
        "Participate in code review",
        "Deploy to staging environment"
      ]
    }
  ]
}
```

### Generate Tribal Knowledge

**Use Case:** Extract and document implicit team knowledge.

```json
{
  "tool": "extract_tribal_knowledge",
  "arguments": {
    "sources": [
      "/project/src",
      "/project/docs",
      "/project/.github"
    ],
    "includeComments": true,
    "includeCommitMessages": true,
    "timeRange": "6months",
    "knowledgeTypes": ["workarounds", "gotchas", "best-practices", "decisions"]
  }
}
```

**Sample Output:**
```json
{
  "workarounds": [
    {
      "issue": "Database connection pooling in tests",
      "solution": "Use TEST_DB_POOL_SIZE=1 to prevent connection exhaustion",
      "source": "comment in test/setup.ts",
      "author": "senior-dev-jane",
      "dateDiscovered": "2024-08-15"
    }
  ],
  "gotchas": [
    {
      "area": "Authentication middleware",
      "description": "JWT tokens expire after 1 hour in production but 8 hours in development",
      "impact": "Can cause confusion when testing auth flows",
      "source": "config/auth.js comment",
      "severity": "medium"
    }
  ],
  "bestPractices": [
    {
      "practice": "Always use transaction wrapper for multi-step database operations",
      "reasoning": "Prevents partial data corruption on failures",
      "examples": ["/src/services/OrderService.ts:145", "/src/services/PaymentService.ts:89"],
      "adoptionRate": 0.87
    }
  ],
  "decisionHistory": [
    {
      "decision": "Chose PostgreSQL over MongoDB",
      "date": "2024-03-10",
      "reasoning": "Strong consistency requirements for financial data",
      "alternatives": ["MongoDB", "MySQL"],
      "outcome": "Successful, no regrets",
      "source": "docs/architectural-decisions.md"
    }
  ]
}
```

---

## Advanced Context Management {#advanced-context}

### Context Prioritization

**Scenario:** Prioritize learning based on current development focus.

```json
{
  "tool": "prioritize_context",
  "arguments": {
    "contexts": [
      {
        "id": "auth-system",
        "type": "system",
        "complexity": 0.7,
        "lastModified": "2024-09-10"
      },
      {
        "id": "payment-processing", 
        "type": "feature",
        "complexity": 0.9,
        "lastModified": "2024-09-14"
      },
      {
        "id": "ui-components",
        "type": "interface",
        "complexity": 0.4,
        "lastModified": "2024-09-12"
      }
    ],
    "currentFocus": "payment-processing",
    "userRole": "backend-developer",
    "timeConstraint": "2hours"
  }
}
```

**Sample Output:**
```json
{
  "prioritizedContexts": [
    {
      "id": "payment-processing",
      "priority": 1,
      "relevanceScore": 0.95,
      "estimatedTime": "90 minutes",
      "reasoning": "Direct match with current focus, recently modified, high business impact"
    },
    {
      "id": "auth-system", 
      "priority": 2,
      "relevanceScore": 0.72,
      "estimatedTime": "45 minutes",
      "reasoning": "Often integrates with payment flows, moderate complexity"
    },
    {
      "id": "ui-components",
      "priority": 3,
      "relevanceScore": 0.31,
      "estimatedTime": "20 minutes",
      "reasoning": "Less relevant for backend developer, simpler concepts"
    }
  ],
  "studyPlan": {
    "phase1": {
      "duration": "60 minutes",
      "focus": "Payment processing core logic and error handling"
    },
    "phase2": {
      "duration": "30 minutes", 
      "focus": "Authentication integration points"
    },
    "phase3": {
      "duration": "30 minutes",
      "focus": "Review related test cases and edge conditions"
    }
  }
}
```

### Context Evolution Tracking

**Use Case:** Track how understanding and codebase evolve over time.

```json
{
  "tool": "track_context_evolution",
  "arguments": {
    "snapshotIds": [
      "snapshot_2024_08_15",
      "snapshot_2024_09_01", 
      "snapshot_2024_09_15"
    ],
    "analysisType": "comprehensive",
    "includeMetrics": true
  }
}
```

**Sample Output:**
```json
{
  "evolution": {
    "codebaseGrowth": {
      "filesAdded": 23,
      "filesModified": 67,
      "filesRemoved": 3,
      "linesOfCodeChange": "+2,847"
    },
    "conceptualChanges": [
      {
        "concept": "User Authentication",
        "changeType": "enhanced",
        "details": "Added OAuth2 support and multi-factor authentication",
        "impact": "high",
        "dateRange": "2024-08-15 to 2024-09-01"
      },
      {
        "concept": "Payment Processing",
        "changeType": "refactored",
        "details": "Extracted payment gateway abstractions",
        "impact": "medium",
        "dateRange": "2024-09-01 to 2024-09-15"
      }
    ],
    "architecturalShifts": [
      {
        "shift": "Monolith to Microservices Migration",
        "progress": "45%",
        "services": ["UserService", "PaymentService", "OrderService"],
        "remainingMonolithModules": ["ReportingModule", "AdminModule"]
      }
    ]
  },
  "trends": {
    "complexityTrend": "increasing",
    "maintainabilityTrend": "stable",
    "testCoverageTrend": "improving",
    "documentationTrend": "improving"
  },
  "recommendations": [
    {
      "area": "Technical Debt",
      "priority": "high",
      "action": "Address growing complexity in OrderService",
      "estimatedEffort": "1 week"
    },
    {
      "area": "Documentation",
      "priority": "medium", 
      "action": "Document new OAuth2 integration patterns",
      "estimatedEffort": "2 days"
    }
  ]
}
```

---

## Real-World Integration Examples {#integration-examples}

### IDE Integration Workflow

**Scenario:** Using context-gen tools in VS Code for active development.

```typescript
// Example VS Code extension integration
import { ContextGenClient } from '@modelcontextprotocol/client-context-gen';

class ContextAwareAssistant {
  private client: ContextGenClient;

  async analyzeCurrentWorkspace() {
    // Get current project context
    const analysis = await this.client.call('analyze_codebase', {
      projectPath: vscode.workspace.rootPath,
      analysisDepth: 'focused',
      includeTests: false
    });

    // Generate mental model for current file
    const activeFile = vscode.window.activeTextEditor?.document.fileName;
    if (activeFile) {
      const mentalModel = await this.client.call('extract_semantic_context', {
        filePath: activeFile,
        includeComments: true,
        semanticDepth: 'shallow'
      });
      
      // Show context in sidebar
      this.showContextPanel(analysis, mentalModel);
    }
  }

  async helpWithCurrentTask() {
    // Prioritize relevant context based on current cursor position
    const currentFunction = this.getCurrentFunction();
    const context = await this.client.call('prioritize_context', {
      contexts: await this.getRelatedContexts(currentFunction),
      currentFocus: currentFunction,
      timeConstraint: '5minutes'
    });

    return context.prioritizedContexts[0]; // Most relevant context
  }
}
```

### CI/CD Pipeline Integration

```yaml
# .github/workflows/context-analysis.yml
name: Context Analysis
on: [push, pull_request]

jobs:
  analyze-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Context-Gen
        run: npm install -g @modelcontextprotocol/server-context-gen
        
      - name: Analyze Codebase Changes
        run: |
          context-gen analyze_codebase \
            --project-path . \
            --analysis-depth detailed \
            --output analysis.json
            
      - name: Detect Pattern Violations
        run: |
          context-gen detect_patterns \
            --project-path . \
            --pattern-types anti-pattern \
            --confidence-threshold 0.8 \
            --output patterns.json
            
      - name: Generate Context Summary for PR
        if: github.event_name == 'pull_request'
        run: |
          context-gen create_context_summary \
            --project-path . \
            --target-audience reviewer \
            --focus-areas "changes,impact" \
            --output pr-context.md
            
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('pr-context.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🧠 AI Context Analysis\n\n${summary}`
            });
```

### Team Dashboard Integration

```javascript
// Example team dashboard showing context health
class TeamContextDashboard {
  async generateDashboard() {
    const projects = await this.getTeamProjects();
    const dashboard = {
      projects: [],
      teamInsights: {},
      recommendations: []
    };

    for (const project of projects) {
      // Analyze each project
      const analysis = await contextGen.call('analyze_codebase', {
        projectPath: project.path,
        analysisDepth: 'summary'
      });

      // Track context evolution
      const evolution = await contextGen.call('track_context_evolution', {
        snapshotIds: await this.getRecentSnapshots(project.id),
        analysisType: 'metrics'
      });

      dashboard.projects.push({
        name: project.name,
        health: this.calculateHealthScore(analysis, evolution),
        complexity: analysis.summary.complexity,
        trends: evolution.trends,
        lastUpdate: evolution.lastSnapshot
      });
    }

    // Generate team-level insights
    dashboard.teamInsights = await contextGen.call('extract_tribal_knowledge', {
      sources: projects.map(p => p.path),
      knowledgeTypes: ['best-practices', 'decisions'],
      aggregateLevel: 'team'
    });

    return dashboard;
  }
}
```

---

## Performance and Optimization Tips

### Optimizing Analysis Performance

```json
{
  "tool": "analyze_codebase",
  "arguments": {
    "projectPath": "/large/project",
    "analysisDepth": "focused",
    "excludePatterns": ["node_modules", "dist", "coverage"],
    "parallelProcessing": true,
    "maxFileSize": "1MB",
    "cacheResults": true
  }
}
```

### Incremental Context Building

```json
{
  "tool": "build_knowledge_graph",
  "arguments": {
    "contextSources": ["/recent/changes"],
    "mergingStrategy": "conservative",
    "incrementalUpdate": true,
    "baseGraphId": "project_main_graph",
    "onlyChangedFiles": true
  }
}
```

---

## Error Handling and Debugging

### Common Issues and Solutions

```typescript
try {
  const result = await contextGen.call('analyze_codebase', {
    projectPath: invalidPath
  });
} catch (error) {
  if (error.code === 'PATH_NOT_FOUND') {
    // Handle invalid project path
    console.log('Please provide a valid project path');
  } else if (error.code === 'INSUFFICIENT_PERMISSIONS') {
    // Handle permission issues
    console.log('Check file system permissions');
  } else if (error.code === 'ANALYSIS_TIMEOUT') {
    // Handle timeout for large codebases
    console.log('Try using analysisDepth: "summary" for large projects');
  }
}
```

---

This comprehensive set of usage examples demonstrates the power and flexibility of the Context-Gen MCP Server. Each tool is designed to work together, enabling progressive understanding and intelligent context building for any software project.

For more examples and advanced use cases, see the [API Documentation](./API.md) and [Integration Guide](./INTEGRATION.md).