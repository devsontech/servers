# Interactive Context-Gen Tool Demonstrations

This file contains step-by-step demonstrations of each Context-Gen MCP tool with real-world examples, expected inputs, and sample outputs.

## 🎯 Tool Demonstration Index

1. [Basic Analysis Tools](#basic-analysis)
2. [Advanced Context Generation](#advanced-context)
3. [Pattern Recognition Tools](#pattern-recognition)
4. [Knowledge Management](#knowledge-management)
5. [Team Collaboration Tools](#collaboration-tools)

---

## Basic Analysis Tools {#basic-analysis}

### 1. `analyze_codebase` - Deep Codebase Analysis

**What it does:** Provides comprehensive analysis of project structure, dependencies, and complexity metrics.

**Example Input:**
```json
{
  "projectPath": "/Users/dev/my-ecommerce-app",
  "includeTests": true,
  "analysisDepth": "detailed",
  "languageFilters": ["typescript", "javascript"],
  "excludePatterns": ["node_modules", "dist", "coverage"]
}
```

**Sample Output:**
```json
{
  "summary": {
    "totalFiles": 342,
    "linesOfCode": 28945,
    "languages": ["TypeScript", "JavaScript", "JSON", "CSS"],
    "frameworks": ["React", "Express", "Jest", "Webpack"],
    "complexity": "high"
  },
  "fileStructure": {
    "components": [
      "ProductCatalog", "ShoppingCart", "UserProfile", 
      "OrderHistory", "PaymentForm", "Navigation"
    ],
    "services": [
      "ApiService", "AuthService", "CartService", 
      "PaymentService", "ProductService", "OrderService"
    ],
    "utilities": [
      "DateUtils", "ValidationUtils", "CurrencyFormatter",
      "ImageOptimizer", "LocalStorageManager"
    ]
  },
  "dependencies": [
    { "name": "react", "version": "18.2.0", "category": "dependency", "security": "safe" },
    { "name": "express", "version": "4.18.2", "category": "dependency", "security": "safe" },
    { "name": "lodash", "version": "4.17.20", "category": "dependency", "security": "vulnerable" }
  ],
  "insights": [
    "High complexity in ProductCatalog component (8.5/10)",
    "Potential security vulnerability in lodash dependency",
    "Missing TypeScript types in 8 service files",
    "Circular dependency between CartService and OrderService",
    "Test coverage is 78% - missing tests in payment module"
  ],
  "metrics": {
    "cyclomaticComplexity": 6.8,
    "maintainabilityIndex": 71.2,
    "technicalDebt": "medium-high",
    "duplicateCode": "12%"
  }
}
```

**Real-world use case:** 
- New developer joining the team needs to understand the codebase
- Tech lead preparing for architecture review
- Before major refactoring to understand current state

---

### 2. `extract_semantic_context` - Understanding Code Meaning

**What it does:** Analyzes code to understand business logic, purpose, and domain concepts.

**Example Input:**
```json
{
  "filePath": "/src/services/OrderService.ts",
  "includeComments": true,
  "semanticDepth": "deep",
  "domainFocus": "e-commerce"
}
```

**Sample Output:**
```json
{
  "entities": [
    {
      "entity": "OrderProcessor",
      "type": "class",
      "purpose": "Orchestrates the complete order fulfillment workflow including payment processing, inventory management, and shipping coordination",
      "businessValue": "Critical path for revenue generation",
      "relationships": [
        "PaymentGateway", "InventoryService", "ShippingService", 
        "CustomerNotificationService", "AuditLogger"
      ],
      "tags": ["business-logic", "transaction", "workflow", "revenue-critical"],
      "confidence": 0.94,
      "location": { "line": 23, "column": 0 }
    },
    {
      "entity": "validateOrderItems",
      "type": "method",
      "purpose": "Ensures order items are available, properly priced, and comply with business rules",
      "businessValue": "Prevents order fulfillment errors and revenue loss",
      "complexity": "medium",
      "testCoverage": 0.89
    }
  ],
  "businessConcepts": [
    {
      "concept": "Order Fulfillment",
      "definition": "End-to-end process from order placement through delivery confirmation",
      "stakeholders": ["customer", "warehouse-staff", "shipping-partner", "finance-team"],
      "businessRules": [
        "Orders must be validated before payment processing",
        "Inventory must be reserved within 5 minutes of payment",
        "Customer notifications sent at each status change",
        "Failed orders must be logged and reviewed within 24 hours"
      ],
      "kpis": ["Order success rate", "Time to fulfillment", "Customer satisfaction"],
      "riskFactors": ["Payment failures", "Inventory shortages", "Shipping delays"]
    }
  ],
  "dataFlow": [
    {
      "from": "OrderRequest",
      "to": "OrderValidation", 
      "transformation": "Business rule validation and sanitization"
    },
    {
      "from": "ValidatedOrder",
      "to": "PaymentProcessing",
      "transformation": "Payment method validation and charge processing"
    }
  ]
}
```

**Real-world use case:**
- Business analyst understanding system capabilities
- New developer learning domain-specific logic
- Documentation generation for stakeholders

---

## Advanced Context Generation {#advanced-context}

### 3. `generate_mental_model` - Conceptual Understanding

**What it does:** Creates a high-level mental model of the system from different perspectives.

**Example Input:**
```json
{
  "projectPath": "/microservices/platform",
  "perspective": "architect",
  "includeDataFlow": true,
  "includeUserJourney": true
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
        { "target": "Product Service", "type": "routes_to", "strength": 0.8 },
        { "target": "Order Service", "type": "routes_to", "strength": 0.95 }
      ],
      "importance": 0.95,
      "description": "Single entry point providing authentication, routing, and rate limiting for all client requests",
      "scalingConsiderations": "Potential bottleneck - consider multiple instances with load balancing"
    },
    {
      "concept": "Event Bus",
      "relationships": [
        { "target": "Order Service", "type": "publishes_to", "strength": 0.9 },
        { "target": "Inventory Service", "type": "subscribes_from", "strength": 0.8 },
        { "target": "Notification Service", "type": "subscribes_from", "strength": 0.7 }
      ],
      "importance": 0.85,
      "description": "Asynchronous communication backbone enabling loose coupling between services"
    }
  ],
  "dataFlow": [
    {
      "source": "Mobile App",
      "target": "API Gateway",
      "dataType": "HTTPS Request",
      "transformation": "SSL termination and request validation",
      "volume": "~10k requests/minute",
      "latencyRequirement": "<200ms"
    },
    {
      "source": "API Gateway", 
      "target": "User Service",
      "dataType": "Authenticated Request",
      "transformation": "JWT validation and user context injection",
      "volume": "~8k requests/minute",
      "latencyRequirement": "<100ms"
    }
  ],
  "userJourney": [
    {
      "step": "User Login",
      "actor": "Customer",
      "action": "POST /auth/login with credentials",
      "system": "API Gateway → Auth Service → User Service",
      "outcome": "JWT token issued, user session created",
      "successRate": "94.2%",
      "avgDuration": "1.2s"
    },
    {
      "step": "Browse Products",
      "actor": "Customer", 
      "action": "GET /products with filters",
      "system": "API Gateway → Product Service → Search Engine",
      "outcome": "Personalized product list returned",
      "successRate": "99.1%",
      "avgDuration": "0.8s"
    }
  ],
  "visualStructure": {
    "layers": [
      {
        "name": "Presentation Layer",
        "components": ["Web App", "Mobile App", "Admin Panel"],
        "responsibility": "User interface and experience"
      },
      {
        "name": "API Layer",
        "components": ["API Gateway", "GraphQL Gateway"],
        "responsibility": "Request routing and aggregation"
      },
      {
        "name": "Business Logic Layer", 
        "components": ["User Service", "Product Service", "Order Service"],
        "responsibility": "Core business logic and workflows"
      },
      {
        "name": "Data Layer",
        "components": ["PostgreSQL", "Redis", "Elasticsearch"],
        "responsibility": "Data persistence and caching"
      }
    ]
  }
}
```

**Real-world use case:**
- System architecture reviews and planning
- New team member architectural onboarding
- Stakeholder communication and alignment

---

### 4. `build_knowledge_graph` - Relationship Mapping

**What it does:** Creates a comprehensive knowledge graph showing relationships between code concepts, business logic, and architectural decisions.

**Example Input:**
```json
{
  "contextSources": [
    "/project/src",
    "/project/docs/architecture",
    "/project/README.md",
    "/project/CHANGELOG.md"
  ],
  "extractionRules": [
    { "type": "pattern", "pattern": "class\\s+(\\w+)Service", "confidence": 0.9 },
    { "type": "concept", "pattern": "@businessLogic\\s+(.+)", "confidence": 0.85 },
    { "type": "decision", "pattern": "ADR-\\d+:", "confidence": 0.9 }
  ],
  "mergingStrategy": "balanced"
}
```

**Sample Output:**
```json
{
  "nodes": [
    {
      "id": "auth_system_001",
      "type": "concept",
      "title": "Multi-Factor Authentication",
      "description": "Two-step verification system using SMS and email",
      "importance": 0.9,
      "certainty": 0.95,
      "sources": ["/src/auth/MFAService.ts", "/docs/security.md"],
      "connections": [
        { "target": "user_management_002", "relationship": "secures", "strength": 0.9 },
        { "target": "notification_003", "relationship": "uses", "strength": 0.7 }
      ],
      "tags": ["security", "authentication", "compliance"],
      "metadata": {
        "lastUpdated": "2024-09-10",
        "author": "security-team",
        "businessPriority": "high"
      }
    },
    {
      "id": "payment_decision_004",
      "type": "decision", 
      "title": "Stripe vs PayPal Integration",
      "description": "ADR-15: Selected Stripe for better API design and webhook reliability",
      "importance": 0.8,
      "certainty": 0.88,
      "sources": ["/docs/decisions/ADR-015-payment-gateway.md"],
      "connections": [
        { "target": "payment_service_005", "relationship": "influences", "strength": 0.95 }
      ],
      "tags": ["payment", "integration", "vendor-selection"],
      "metadata": {
        "decisionDate": "2024-08-15",
        "alternatives": ["PayPal", "Square", "Adyen"],
        "outcome": "successful"
      }
    }
  ],
  "relationships": [
    {
      "source": "auth_system_001",
      "target": "user_management_002", 
      "type": "secures",
      "strength": 0.9,
      "evidence": [
        "MFAService.verify() called in UserService.login()",
        "Security documentation mandates MFA for user operations"
      ],
      "businessImpact": "Reduces security incidents by 85%"
    }
  ],
  "clusters": [
    {
      "name": "Security Infrastructure",
      "nodes": ["auth_system_001", "session_mgmt_006", "encryption_007"],
      "cohesion": 0.82,
      "description": "Core security components and policies",
      "businessValue": "Ensures data protection and regulatory compliance"
    },
    {
      "name": "Payment Processing",
      "nodes": ["payment_decision_004", "payment_service_005", "billing_008"],
      "cohesion": 0.76,
      "description": "Payment handling and financial operations"
    }
  ],
  "insights": [
    {
      "type": "pattern",
      "description": "Strong clustering around security components indicates well-architected security model",
      "confidence": 0.89,
      "impact": "high",
      "recommendation": "Consider extracting security cluster into dedicated security service"
    },
    {
      "type": "gap",
      "description": "Limited documentation for error handling patterns in payment processing",
      "confidence": 0.76,
      "impact": "medium",
      "recommendation": "Create error handling documentation and decision records"
    },
    {
      "type": "risk",
      "description": "High dependency concentration on external payment service",
      "confidence": 0.83,
      "impact": "high",
      "recommendation": "Implement fallback payment processor for resilience"
    }
  ]
}
```

---

## Pattern Recognition Tools {#pattern-recognition}

### 5. `detect_patterns` - Architecture Pattern Detection

**Example Input:**
```json
{
  "projectPath": "/enterprise/application",
  "patternTypes": ["design", "architectural", "anti-pattern"],
  "confidenceThreshold": 0.75,
  "includeMetrics": true
}
```

**Sample Output:**
```json
{
  "detectedPatterns": [
    {
      "name": "Command Pattern",
      "type": "design",
      "confidence": 0.91,
      "locations": [
        {
          "file": "/src/commands/OrderCommand.ts",
          "evidence": "Command interface with execute() method implemented across 8 concrete commands",
          "lineRange": "15-89"
        },
        {
          "file": "/src/commands/CommandProcessor.ts",
          "evidence": "Invoker class managing command queue and execution history"
        }
      ],
      "benefits": [
        "Decouples request senders from receivers",
        "Enables undo/redo functionality", 
        "Supports macro commands and queuing"
      ],
      "implementation": {
        "completeness": 0.87,
        "followsBestPractices": true,
        "codeQuality": "high"
      }
    },
    {
      "name": "God Object",
      "type": "anti-pattern",
      "confidence": 0.85,
      "locations": [
        {
          "file": "/src/services/ApplicationService.ts",
          "evidence": "Single class with 52 methods, 1,847 lines of code, handling multiple responsibilities",
          "metrics": {
            "methods": 52,
            "linesOfCode": 1847,
            "cyclomaticComplexity": 28,
            "responsibilities": 7
          }
        }
      ],
      "impacts": [
        "Extremely difficult to test (only 34% coverage)",
        "High coupling with 23 different classes",
        "Violates Single Responsibility Principle",
        "Maintenance bottleneck for team"
      ],
      "recommendations": [
        {
          "priority": "high",
          "action": "Extract user management functionality into UserService",
          "estimatedEffort": "2 weeks",
          "riskLevel": "medium"
        },
        {
          "priority": "high",
          "action": "Extract order processing into dedicated OrderService",
          "estimatedEffort": "3 weeks", 
          "riskLevel": "high"
        }
      ]
    }
  ],
  "architecturalDecisions": [
    {
      "decision": "Layered Architecture with Clean Architecture Principles",
      "confidence": 0.88,
      "evidence": [
        "Clear separation between domain, application, and infrastructure layers",
        "Dependency inversion principle applied throughout"
      ],
      "implementation": {
        "adherence": 0.82,
        "violations": [
          "Infrastructure layer directly imported in domain layer (3 instances)",
          "Business logic mixed with presentation layer in 2 controllers"
        ]
      },
      "benefits": ["Testability", "Maintainability", "Technology independence"],
      "tradeoffs": {
        "complexity": "Higher initial complexity",
        "learning_curve": "Steeper for junior developers"
      }
    }
  ],
  "metrics": {
    "codeQuality": {
      "cyclomaticComplexity": {
        "average": 4.7,
        "median": 3.2,
        "max": { "value": 28, "location": "ApplicationService.processOrder()" },
        "distribution": {
          "low": 0.68,
          "medium": 0.24,
          "high": 0.08
        }
      },
      "maintainabilityIndex": 73.4,
      "duplicateCode": {
        "percentage": 8.2,
        "instances": 23,
        "worstOffender": "/src/utils/ValidationUtils.ts"
      }
    },
    "testCoverage": {
      "overall": 0.76,
      "byLayer": {
        "domain": 0.94,
        "application": 0.82,
        "infrastructure": 0.61
      }
    },
    "dependencies": {
      "external": 47,
      "vulnerable": 2,
      "outdated": 8,
      "licenses": ["MIT", "Apache-2.0", "BSD-3-Clause"]
    }
  },
  "recommendations": {
    "immediate": [
      "Refactor ApplicationService god object",
      "Update vulnerable dependencies: lodash, moment",
      "Add integration tests for payment processing"
    ],
    "shortTerm": [
      "Improve infrastructure layer test coverage",
      "Document architectural decision records",
      "Set up automated dependency scanning"
    ],
    "longTerm": [
      "Consider microservices for user and order domains",
      "Implement event sourcing for audit requirements",
      "Adopt TypeScript for better type safety"
    ]
  }
}
```

---

## Knowledge Management {#knowledge-management}

### 6. `create_context_summary` - Team Documentation

**Example Input:**
```json
{
  "projectPath": "/team/booking-platform",
  "targetAudience": "new-developer",
  "includeQuickStart": true,
  "maxComplexity": "intermediate",
  "focusAreas": ["core-architecture", "development-workflow", "testing-approach", "deployment"]
}
```

**Sample Output:**
```json
{
  "executiveSummary": {
    "projectOverview": "Hotel booking platform with real-time availability, dynamic pricing, and multi-language support serving 50k+ daily users",
    "keyTechnologies": ["React 18", "Node.js", "GraphQL", "PostgreSQL", "Redis", "Docker", "AWS"],
    "businessValue": "Primary revenue driver with $2M+ monthly transactions",
    "teamStructure": {
      "size": 12,
      "roles": ["Frontend (4)", "Backend (4)", "DevOps (2)", "QA (2)"]
    },
    "developmentStage": "mature-product"
  },
  "quickStart": {
    "prerequisites": [
      "Node.js 18+",
      "Docker Desktop",
      "AWS CLI configured",
      "Git with SSH keys"
    ],
    "environmentSetup": [
      "Clone repository: git clone git@github:company/booking-platform.git",
      "Install dependencies: npm run setup:all",
      "Start local services: docker-compose up -d",
      "Initialize database: npm run db:migrate", 
      "Start development server: npm run dev",
      "Verify setup: curl http://localhost:3000/health"
    ],
    "firstMilestone": {
      "title": "Implement simple search filter",
      "description": "Add date range filter to hotel search to understand data flow",
      "estimatedTime": "4-6 hours",
      "learningObjectives": [
        "Understand GraphQL schema",
        "Follow component patterns",
        "Write unit tests",
        "Submit first PR"
      ],
      "mentorCheckpoints": [
        "After 2 hours: Review approach with senior dev",
        "Before PR: Code review with team lead"
      ]
    }
  },
  "coreArchitecture": {
    "overview": "Event-driven microservices with CQRS for booking operations",
    "systemMap": {
      "frontend": {
        "technology": "React with Apollo Client",
        "responsibility": "User interface and state management",
        "keyPaths": ["/src/components", "/src/pages", "/src/hooks"]
      },
      "apiGateway": {
        "technology": "Node.js with GraphQL",
        "responsibility": "Request routing and schema stitching",
        "keyPaths": ["/services/gateway/src"]
      },
      "services": [
        {
          "name": "Search Service",
          "responsibility": "Hotel search and filtering",
          "technology": "Node.js + Elasticsearch"
        },
        {
          "name": "Booking Service", 
          "responsibility": "Reservation management",
          "technology": "Node.js + PostgreSQL"
        },
        {
          "name": "Payment Service",
          "responsibility": "Transaction processing",
          "technology": "Node.js + Stripe"
        }
      ]
    },
    "dataFlow": {
      "searchFlow": "Frontend → GraphQL Gateway → Search Service → Elasticsearch",
      "bookingFlow": "Frontend → GraphQL Gateway → Booking Service → Payment Service → Database",
      "eventFlow": "Service → Event Bus (SQS) → Event Handlers → Database Updates"
    },
    "criticalPaths": [
      {
        "name": "Booking Creation",
        "businessImpact": "Revenue critical",
        "slaRequirement": "<2s response time, 99.9% uptime",
        "components": ["BookingService", "PaymentService", "NotificationService"]
      }
    ]
  },
  "developmentWorkflow": {
    "branching": {
      "strategy": "GitFlow",
      "branches": {
        "main": "Production code",
        "develop": "Integration branch",
        "feature/*": "Feature development", 
        "hotfix/*": "Emergency fixes"
      }
    },
    "codeReview": {
      "required": true,
      "minimumReviewers": 2,
      "criteria": [
        "Functionality works as expected",
        "Code follows team standards",
        "Tests provide adequate coverage",
        "Performance impact considered"
      ]
    },
    "deployment": {
      "environments": ["development", "staging", "production"],
      "strategy": "Blue/Green deployment",
      "automation": "GitHub Actions + AWS CodeDeploy",
      "rollback": "Automated rollback on health check failure"
    }
  },
  "testingApproach": {
    "pyramid": {
      "unit": {
        "coverage": "85%+",
        "tools": ["Jest", "React Testing Library"],
        "focus": "Business logic and utilities"
      },
      "integration": {
        "coverage": "70%+", 
        "tools": ["Supertest", "TestContainers"],
        "focus": "API endpoints and service interactions"
      },
      "e2e": {
        "coverage": "Critical user journeys",
        "tools": ["Playwright"],
        "focus": "Complete booking flow"
      }
    },
    "testData": {
      "strategy": "Factory pattern with realistic data",
      "location": "/tests/factories",
      "reset": "Before each test suite"
    }
  },
  "learningPath": [
    {
      "phase": "Week 1: Foundation",
      "objectives": [
        "Understand business domain and user needs",
        "Set up development environment",
        "Complete first small feature"
      ],
      "activities": [
        "Review product demo and user flows",
        "Explore codebase structure",
        "Pair program with senior developer",
        "Implement date filter feature"
      ],
      "resources": [
        "/docs/business-overview.md",
        "/docs/architecture.md", 
        "Product demo video"
      ]
    },
    {
      "phase": "Week 2-3: Core Development",
      "objectives": [
        "Contribute to medium complexity features",
        "Understand testing practices",
        "Participate in code reviews"
      ],
      "activities": [
        "Implement search improvements",
        "Write comprehensive tests",
        "Review team members' PRs",
        "Deploy to staging environment"
      ]
    },
    {
      "phase": "Week 4+: Full Productivity",
      "objectives": [
        "Lead small features end-to-end",
        "Mentor newer team members",
        "Contribute to technical decisions"
      ],
      "activities": [
        "Own booking flow improvements",
        "Participate in architecture discussions",
        "Help with on-call rotation",
        "Propose technical improvements"
      ]
    }
  ],
  "commonPatterns": [
    {
      "name": "GraphQL Resolver Pattern",
      "usage": "All API endpoints",
      "example": "/services/gateway/src/resolvers/booking.js",
      "description": "Consistent error handling and authentication"
    },
    {
      "name": "Event Publishing Pattern",
      "usage": "Domain events",
      "example": "/services/booking/src/events/BookingCreated.js",
      "description": "Decoupled service communication"
    }
  ],
  "troubleshooting": [
    {
      "issue": "Local database connection errors",
      "solution": "Restart Docker containers: docker-compose restart db",
      "prevention": "Regular Docker cleanup: docker system prune"
    },
    {
      "issue": "GraphQL schema stitching failures",
      "solution": "Regenerate schema: npm run schema:generate",
      "prevention": "Run schema validation in pre-commit hook"
    }
  ]
}
```

---

## Team Collaboration Tools {#collaboration-tools}

### 7. `extract_tribal_knowledge` - Institutional Knowledge Capture

**Example Input:**
```json
{
  "sources": ["/project/src", "/project/docs", "/project/.github"],
  "includeComments": true,
  "includeCommitMessages": true,
  "timeRange": "12months",
  "knowledgeTypes": ["workarounds", "gotchas", "best-practices", "decisions", "lessons-learned"]
}
```

**Sample Output:**
```json
{
  "workarounds": [
    {
      "issue": "Memory leak in PDF generation service",
      "solution": "Restart worker process every 1000 documents",
      "implementation": "Added process.exit(0) after document counter reaches limit",
      "source": "comment in PDFWorker.js:134",
      "author": "senior-dev-mike",
      "dateDiscovered": "2024-06-12",
      "businessImpact": "Prevents 2-hour downtime every morning",
      "permanentFix": "TODO: Upgrade to newer PDF library in Q4"
    },
    {
      "issue": "Rate limiting on third-party API during peak hours",
      "solution": "Implement exponential backoff with jitter",
      "implementation": "Custom retry logic in ApiClient.js",
      "effectiveness": "Reduced API errors by 89%",
      "monitoringAlert": "CloudWatch alarm on retry count > 100/minute"
    }
  ],
  "gotchas": [
    {
      "area": "Database migrations",
      "description": "Migration rollback doesn't work with certain column type changes",
      "specificCase": "Changing VARCHAR to TEXT requires manual intervention",
      "impact": "2-hour production incident on 2024-07-23",
      "solution": "Always test rollback on staging first",
      "prevention": "Added migration rollback testing to CI pipeline",
      "severity": "high"
    },
    {
      "area": "Timezone handling",
      "description": "User timezone stored differently in legacy vs new user records",
      "impact": "Wrong appointment times for users created before 2024-03-01",
      "detection": "Compare user.timezone vs user.profile.timezone fields", 
      "workaround": "Migration script runs nightly to normalize data"
    }
  ],
  "bestPractices": [
    {
      "practice": "Always use database transactions for multi-step operations",
      "reasoning": "Prevents partial data corruption during failures",
      "examples": [
        "/src/services/OrderService.js:145 - Order creation with payment",
        "/src/services/UserService.js:89 - User registration with email verification"
      ],
      "adoptionRate": 0.94,
      "exceptions": "Bulk operations may use batch processing instead",
      "monitoring": "Alert on transaction rollback rate > 5%"
    },
    {
      "practice": "Feature flags for all new functionality",
      "reasoning": "Enables safe rollout and quick rollback without deployment",
      "tooling": "LaunchDarkly with environment-specific configs",
      "process": [
        "Create flag before development",
        "Test with flag enabled/disabled",
        "Gradual rollout: 1% → 10% → 50% → 100%",
        "Remove flag after 30 days of stable operation"
      ],
      "adoptionRate": 1.0,
      "teamDecision": "Mandatory for user-facing features"
    }
  ],
  "decisionHistory": [
    {
      "decision": "Migrate from REST to GraphQL for mobile API",
      "date": "2024-04-15",
      "participants": ["tech-lead", "mobile-team", "backend-team"],
      "reasoning": [
        "Reduce over-fetching by 60%",
        "Better type safety with generated schemas",
        "Improved developer experience for mobile team"
      ],
      "alternatives": [
        { "option": "Optimize existing REST endpoints", "rejected": "Too much ongoing maintenance" },
        { "option": "gRPC", "rejected": "Web client support complications" }
      ],
      "outcome": "Successful migration over 3 months",
      "metrics": {
        "mobileBandwidthReduction": "58%",
        "developmentVelocityIncrease": "23%",
        "clientSideCodeReduction": "31%"
      },
      "lessonsLearned": [
        "Schema-first design prevents breaking changes",
        "N+1 query monitoring essential from day one",
        "GraphQL playground invaluable for mobile team"
      ]
    },
    {
      "decision": "Adopt microservices architecture for new features",
      "date": "2024-02-01",
      "context": "Monolith deployment bottleneck affecting team velocity",
      "decisionMakers": ["CTO", "engineering-leads"],
      "implementation": {
        "approach": "Strangler fig pattern",
        "timeline": "18 months",
        "firstService": "NotificationService"
      },
      "results": {
        "deploymentFrequency": "15x increase",
        "teamAutonomy": "Significantly improved", 
        "operationalComplexity": "Increased but manageable"
      },
      "unexpected": [
        "Distributed tracing more critical than anticipated",
        "Service mesh complexity higher than expected",
        "Team communication overhead increased initially"
      ]
    }
  ],
  "lessonsLearned": [
    {
      "situation": "Black Friday 2023 traffic spike",
      "challenge": "Database connection pool exhaustion under 5x normal load",
      "response": [
        "Emergency database connection limit increase",
        "Implemented connection pooling per service",
        "Added circuit breakers for graceful degradation"
      ],
      "outcome": "Handled peak traffic with 99.8% uptime",
      "preventiveMeasures": [
        "Load testing now includes 10x traffic scenarios",
        "Auto-scaling database connections",
        "Chaos engineering practice quarterly"
      ],
      "businessImpact": "Saved estimated $500k in lost sales",
      "teamLearning": "Importance of testing edge cases and graceful degradation"
    }
  ],
  "culturalKnowledge": [
    {
      "aspect": "Code Review Culture",
      "description": "Reviews focus on learning and knowledge sharing, not fault-finding",
      "practices": [
        "Ask questions rather than make demands",
        "Explain 'why' behind suggestions", 
        "Celebrate good patterns when spotted",
        "Use '⚠️' for serious issues, '💡' for suggestions"
      ],
      "impact": "85% of developers report positive learning experience from reviews"
    },
    {
      "aspect": "Incident Response",
      "description": "Blameless post-mortems with focus on system improvements",
      "process": [
        "Immediate: Fix and restore service",
        "Within 24h: Draft incident report",
        "Within 1 week: Team retrospective",
        "Within 2 weeks: Implement preventive measures"
      ],
      "artifacts": "/docs/incidents/ with anonymized reports"
    }
  ]
}
```

---

This comprehensive set of demonstrations shows how each Context-Gen tool provides value in real development scenarios. The tools work together to create a complete picture of any software project, enabling faster onboarding, better decision-making, and more effective collaboration.

**Next Steps:**
1. Try these examples with your own codebase
2. Customize the parameters for your specific needs  
3. Combine multiple tools for comprehensive analysis
4. Integrate into your development workflow

For implementation details and API reference, see [README.md](./README.md).