# Spec-Kit MCP Server

A Model Context Protocol (MCP) server that implements the **Spec-Driven Development (SDD)** methodology. This server provides tools to create specifications, implementation plans, and task breakdowns following the SDD approach where specifications drive implementation rather than the other way around.

## Overview

Spec-Driven Development flips the traditional approach to software development. Instead of writing code first and documenting later, SDD treats specifications as executable artifacts that generate working implementations. This server provides the tools to practice this methodology effectively.

## Features

### 🚀 Project Initialization
- Set up new SDD projects with proper structure
- Configure templates for different AI assistants (Claude, Gemini, Copilot)
- Establish constitutional principles and architectural constraints

### 📋 Specification Creation
- Generate feature specifications from natural language descriptions
- Enforce structured thinking about user needs and business value
- Mark ambiguities for clarification before implementation

### 🏗️ Implementation Planning
- Convert specifications into technical implementation plans
- Apply constitutional constraints and architectural principles
- Generate phase-based approach with clear gates and checkpoints

### ✅ Task Breakdown
- Break implementation plans into actionable, ordered tasks
- Support Test-Driven Development with proper task sequencing
- Identify parallel tasks and dependencies

### ⚖️ Constitution Validation
- Validate plans against architectural principles
- Ensure compliance with Test-First methodology
- Check for simplicity and anti-abstraction principles

### 🎨 Custom Template Management
- Create custom templates with variable placeholders
- Generate context-aware templates based on project technology
- Manage template library (built-in, custom, and generated templates)
- Apply templates with dynamic variable substitution

### 📁 Configurable Directory Structure
- Customize directory paths for all project components
- Support for different project layouts and naming conventions
- Persistent configuration saved to project settings
- Automatic directory creation based on configuration

## Installation

1. Clone or download this server to your MCP servers directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the server:
   ```bash
   npm run build
   ```

## Available Tools

### `init_project`

Initialize a new Spec-Driven Development project.

**Parameters:**
- `projectName` (required): Name of the project
- `aiAssistant` (required): AI assistant to configure (`claude`, `gemini`, or `copilot`)
- `workingDirectory` (optional): Directory to create project in
- `useCurrentDirectory` (optional): Initialize in current directory instead of creating new folder

**Returns:** Project path and setup confirmation

### `configure_directories`

Configure custom directory paths for project components.

**Parameters:**
- `directories` (required): Object with directory paths
  - `specs`: Directory for specifications
  - `plans`: Directory for implementation plans
  - `tasks`: Directory for task files
  - `templates`: Directory for built-in templates
  - `customTemplates`: Directory for custom templates
  - `generatedTemplates`: Directory for generated templates
  - `constitution`: Directory for constitution files
  - `scripts`: Directory for scripts
  - `memory`: Directory for memory/documentation

**Returns:** Updated directory configuration

### `create_specification`

Create a new feature specification from a natural language description.

**Parameters:**
- `featureDescription` (required): Description of what you want to build
- `projectPath` (optional): Path to project directory
- `featureNumber` (optional): Feature number (auto-generated if not provided)

**Returns:** Path to created specification file

### `create_plan`

Generate an implementation plan from a feature specification.

**Parameters:**
- `specPath` (required): Path to the feature specification file
- `technicalContext` (required): Technical choices and constraints
- `projectPath` (optional): Path to project directory

**Returns:** Path to created implementation plan

### `create_tasks`

Break down an implementation plan into actionable tasks.

**Parameters:**
- `planPath` (required): Path to implementation plan file
- `projectPath` (optional): Path to project directory

**Returns:** Path to created tasks file

### `validate_constitution`

Validate an implementation plan against constitutional principles.

**Parameters:**
- `planPath` (required): Path to implementation plan file
- `constitutionPath` (optional): Path to constitution file

**Returns:** Validation results and compliance check

### `create_custom_template`

Create a custom template with variable placeholders.

**Parameters:**
- `templateType` (required): Type of template (`spec`, `plan`, `tasks`, `constitution`)
- `templateName` (required): Name for the custom template
- `templateContent` (required): Template content with `{{variable}}` placeholders
- `projectPath` (optional): Path to project directory
- `description` (optional): Description of the template

**Returns:** Template path and detected variables

### `generate_template`

Generate a context-aware template based on project technology stack.

**Parameters:**
- `templateType` (required): Type of template to generate (`spec`, `plan`, `tasks`)
- `projectContext` (required): Technology context including language, framework, project type, architecture
- `projectPath` (optional): Path to project directory
- `customizations` (optional): Additional customizations like security sections, CI/CD, complexity level

**Returns:** Generated template path and metadata

### `list_templates`

List all available templates (built-in, custom, and generated).

**Parameters:**
- `projectPath` (optional): Path to project directory
- `templateType` (optional): Filter by template type or show all

**Returns:** List of templates with metadata

### `use_custom_template`

Apply a template with variable substitution to create new files.

**Parameters:**
- `templateName` (required): Name of the template to use
- `templateType` (required): Type of template
- `variables` (required): Object with variable name-value pairs for substitution
- `projectPath` (optional): Path to project directory
- `outputFileName` (optional): Custom output file name

**Returns:** Output file path and substitution results

## Methodology

This server implements the full Spec-Driven Development workflow:

### 1. Specification First
- Start with **what** users need and **why**
- Avoid premature technical decisions
- Mark ambiguities for clarification
- Focus on business value and user outcomes

### 2. Constitutional Constraints
- Every feature starts as a standalone library
- Test-First development is non-negotiable
- Simplicity over complexity
- Real dependencies over mocks

### 3. Phase-Based Implementation
- **Phase 0**: Research and resolve unknowns
- **Phase 1**: Design contracts and data models
- **Phase 2**: Generate actionable tasks
- **Phase 3**: Implement following TDD
- **Phase 4**: Validate against specifications

### 4. Continuous Refinement
- Specifications evolve based on implementation learnings
- Constitution enforces architectural principles
- Quality gates prevent technical debt accumulation

## Project Structure

### Default Structure

When you initialize a project, you get:

```
project-name/
├── memory/
│   └── constitution.md          # Architectural principles
├── scripts/
│   └── setup-plan.sh           # Automation scripts
├── specs/                      # Feature specifications
│   └── 001-feature-name/
│       ├── spec.md            # Feature specification
│       ├── plan.md            # Implementation plan
│       ├── tasks.md           # Task breakdown
│       └── contracts/         # API contracts
├── templates/                  # SDD templates
│   ├── spec-template.md
│   ├── plan-template.md
│   ├── tasks-template.md
│   └── constitution-template.md
├── custom-templates/           # Custom user templates
│   ├── api-spec-template.md
│   ├── component-plan.md
│   └── templates-metadata.json
├── generated-templates/        # AI-generated templates
│   ├── typescript-express-plan.md
│   ├── react-component-spec.md
│   └── templates-metadata.json
├── README.md
└── CLAUDE.md|GEMINI.md|.github/copilot-instructions.md
```

### Configurable Directory Structure

You can customize the directory structure to match your project's conventions:

```
enterprise-project/
├── governance/
│   └── principles/             # Custom constitution location
│       └── constitution.md
├── automation/
│   └── scripts/               # Custom scripts location
├── documentation/
│   ├── requirements/          # Custom specs location
│   ├── architecture/          # Custom plans location
│   └── implementation/        # Custom tasks location
├── project-templates/
│   ├── base/                  # Custom templates location
│   ├── custom/                # Custom user templates
│   └── generated/             # Custom generated templates
├── knowledge-base/            # Custom memory location
└── .speckit/
    └── config.json           # Directory configuration
```

### Directory Configuration Examples

**Microservices Architecture:**
```json
{
  "specs": "services/specifications",
  "plans": "services/architecture",
  "tasks": "services/implementation",
  "constitution": "governance/architecture-principles"
}
```

**Enterprise Documentation:**
```json
{
  "specs": "docs/requirements",
  "plans": "docs/technical-design",
  "tasks": "docs/implementation-guides",
  "templates": "standards/templates",
  "constitution": "standards/principles"
}
```

**Monorepo Structure:**
```json
{
  "specs": "packages/specs",
  "plans": "packages/plans", 
  "tasks": "packages/tasks",
  "templates": "tooling/templates",
  "scripts": "tooling/scripts"
}
```

## Usage Examples

### Initialize a New Project

```typescript
// Using the MCP tool
{
  "name": "init_project",
  "arguments": {
    "projectName": "my-app",
    "aiAssistant": "claude"
  }
}
```

### Create a Feature Specification

```typescript
{
  "name": "create_specification", 
  "arguments": {
    "featureDescription": "User authentication system with email/password login, password reset, and session management"
  }
}
```

### Generate Implementation Plan

```typescript
{
  "name": "create_plan",
  "arguments": {
    "specPath": "/path/to/specs/001-user-auth/spec.md",
    "technicalContext": "Node.js with Express, PostgreSQL database, JWT tokens, bcrypt for passwords"
  }
}
```

### Create Task Breakdown

```typescript
{
  "name": "create_tasks",
  "arguments": {
    "planPath": "/path/to/specs/001-user-auth/plan.md"
  }
}
```

### Create Custom Template

```typescript
{
  "name": "create_custom_template",
  "arguments": {
    "templateType": "spec",
    "templateName": "microservice-api-spec",
    "templateContent": "# {{featureName}} API Specification\n\n## Service: {{serviceName}}\n\n### Endpoints\n- {{httpMethod}} {{endpoint}}\n\n### Technology Stack\n- Framework: {{framework}}\n- Database: {{database}}\n\n### Requirements\n{{requirements}}",
    "description": "Template for microservice API specifications"
  }
}
```

### Generate Context-Aware Template

```typescript
{
  "name": "generate_template",
  "arguments": {
    "templateType": "plan",
    "projectContext": {
      "language": "typescript",
      "framework": "express",
      "projectType": "api",
      "architecture": "microservices",
      "testingFramework": "jest",
      "deploymentTarget": "cloud"
    },
    "customizations": {
      "includeSecuritySection": true,
      "includeCICD": true,
      "complexityLevel": "complex"
    }
  }
}
```

### Configure Custom Directory Structure

```typescript
{
  "name": "configure_directories",
  "arguments": {
    "directories": {
      "specs": "documentation/requirements",
      "plans": "documentation/architecture",
      "tasks": "documentation/implementation",
      "templates": "project-templates/base",
      "customTemplates": "project-templates/custom",
      "generatedTemplates": "project-templates/generated",
      "constitution": "governance/principles",
      "scripts": "automation/scripts",
      "memory": "knowledge-base"
    }
  }
}
```

### Use Custom Template

```typescript
{
  "name": "use_custom_template",
  "arguments": {
    "templateName": "microservice-api-spec",
    "templateType": "spec",
    "variables": {
      "featureName": "User Authentication",
      "serviceName": "auth-service",
      "httpMethod": "POST",
      "endpoint": "/api/v1/auth/login",
      "framework": "Express.js",
      "database": "PostgreSQL",
      "requirements": "OAuth 2.0 integration with JWT tokens"
    },
    "outputFileName": "auth-service-spec.md"
  }
}
```

## Constitutional Principles

The server enforces key architectural principles:

1. **Library-First**: Every feature begins as a standalone library
2. **CLI Interface**: All libraries expose functionality via command line
3. **Test-First**: No implementation without failing tests first
4. **Integration Testing**: Real dependencies over mocks
5. **Observability**: Structured logging and debuggability
6. **Versioning**: Semantic versioning with build increments
7. **Simplicity**: Maximum 3 projects, avoid premature abstraction

## Enterprise Features (New!)

### 🏛️ Enterprise Governance
- **Approval Workflows**: Multi-step approval processes with configurable approvers
- **Change Management**: Track and manage changes with audit trails
- **Compliance Frameworks**: Support for SOX, GDPR, PCI-DSS compliance
- **Risk Assessment**: Automated risk evaluation and mitigation

### 🔒 Enterprise Security
- **Vulnerability Scanning**: Code, dependency, configuration, and infrastructure scanning
- **Compliance Checks**: Automated security policy validation
- **Encryption Utilities**: Data protection and secure communication
- **Security Audit**: Complete security audit trails and reporting

### 🚀 Enterprise CI/CD
- **Pipeline Management**: Create and manage complex deployment pipelines
- **Deployment Strategies**: Blue-green, canary, and rolling deployments
- **Release Management**: Automated version control and release processes
- **Pipeline Orchestration**: Multi-stage pipeline coordination

### 📊 Enterprise Monitoring
- **Metrics Collection**: Business and performance metrics tracking
- **Alerting System**: Configurable alerts and notifications
- **Dashboard Creation**: Real-time monitoring dashboards
- **Reporting**: Automated reporting and analytics

### 📈 Enterprise Scalability
- **Multi-tenancy**: Complete tenant isolation and management
- **Load Balancing**: Traffic distribution and load management
- **High Availability**: Failover mechanisms and redundancy
- **Resource Management**: CPU, memory, and storage allocation

### Enterprise Tools

#### `create_approval_workflow`
Create enterprise approval workflows with multiple approval steps.

#### `security_scan`
Perform comprehensive security scanning on project resources.

#### `create_pipeline`
Create CI/CD pipelines with advanced deployment strategies.

#### `setup_monitoring`
Configure monitoring, alerting, and performance tracking.

#### `create_tenant`
Set up multi-tenant configurations with resource limits.

### Usage with Enterprise Mode

Enable enterprise features by setting `enterpriseMode: true` when initializing projects:

```json
{
  "projectName": "enterprise-app",
  "aiAssistant": "claude",
  "enterpriseMode": true
}
```

This creates additional enterprise directories and enables all enterprise tools and workflows.

## Integration with AI Assistants

### Claude Code
- Creates `CLAUDE.md` with available commands
- Supports `/specify`, `/plan`, `/tasks` commands
- Integrates with Claude's project understanding

### Gemini CLI  
- Creates `GEMINI.md` with command documentation
- Supports `gemini /specify`, `gemini /plan`, `gemini /tasks`
- CLI-first interaction model

### GitHub Copilot
- Creates `.github/copilot-instructions.md`
- Integrates commands into VS Code workflow
- Supports inline command usage

## Best Practices

1. **Start Simple**: Begin with clear, simple specifications
2. **Mark Ambiguities**: Use `[NEEDS CLARIFICATION]` markers liberally
3. **Validate Early**: Use constitutional validation before implementation
4. **Test First**: Write failing tests before any implementation
5. **Iterate**: Refine specifications based on implementation learnings

## Contributing

This server implements the Spec-Kit methodology. For methodology questions, see the original [spec-kit repository](https://github.com/github/spec-kit).

## License

MIT License - see LICENSE file for details.