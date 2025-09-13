# Template Folder Structure - Spec-Kit MCP Server

## Overview

The Spec-Kit MCP Server supports three types of templates with configurable directory structures:

1. **Built-in Templates** - Default templates included with the server
2. **Custom Templates** - User-created templates with organized type-based structure
3. **Generated Templates** - AI-generated templates based on project context

## Default Directory Structure

### Standard Layout (Default Configuration)
```
project-root/
├── templates/                    # Built-in templates (default)
├── custom-templates/             # Custom user templates (default)
│   ├── spec/                    # Specification templates
│   ├── plan/                    # Implementation plan templates
│   ├── tasks/                   # Task breakdown templates
│   └── constitution/            # Constitution/governance templates
├── generated-templates/          # AI-generated templates (default)
└── .speckit/
    └── config.json              # Directory configuration
```

## Custom Templates Structure

### Organized by Template Type
```
custom-templates/
├── spec/
│   ├── api-service-spec.md
│   ├── api-service-spec.meta.json
│   ├── microservice-spec.md
│   ├── microservice-spec.meta.json
│   └── ...
├── plan/
│   ├── enterprise-plan.md
│   ├── enterprise-plan.meta.json
│   ├── microservice-plan.md
│   ├── microservice-plan.meta.json
│   └── ...
├── tasks/
│   ├── tdd-tasks.md
│   ├── tdd-tasks.meta.json
│   ├── deployment-tasks.md
│   ├── deployment-tasks.meta.json
│   └── ...
└── constitution/
    ├── enterprise-constitution.md
    ├── enterprise-constitution.meta.json
    └── ...
```

### Custom Template Files

#### Template Content File (`.md`)
- **Location**: `custom-templates/{type}/{template-name}.md`
- **Format**: Markdown with variable placeholders
- **Variables**: Use `{{variableName}}` syntax

**Example**: `custom-templates/spec/api-service-spec.md`
```markdown
# {{serviceName}} API Specification

## Overview
{{description}}

## Service Information
- Service Name: {{serviceName}}
- Technology: {{technology}}
- Database: {{database}}

## Endpoints
{{endpoints}}

## Business Requirements
{{businessRequirements}}
```

#### Template Metadata File (`.meta.json`)
- **Location**: `custom-templates/{type}/{template-name}.meta.json`
- **Format**: JSON with template metadata

**Example**: `custom-templates/spec/api-service-spec.meta.json`
```json
{
  "name": "api-service-spec",
  "type": "spec",
  "description": "API service specification template",
  "created": "2025-09-14T10:30:00.000Z",
  "variables": [
    "serviceName",
    "description",
    "technology", 
    "database",
    "endpoints",
    "businessRequirements"
  ],
  "version": "1.0.0"
}
```

## Generated Templates Structure

### Flat Structure with Metadata
```
generated-templates/
├── spec-typescript-2025-09-14.md
├── spec-typescript-2025-09-14.meta.json
├── plan-react-2025-09-14.md
├── plan-react-2025-09-14.meta.json
├── tasks-nodejs-2025-09-14.md
├── tasks-nodejs-2025-09-14.meta.json
└── ...
```

### Generated Template Files

#### Template Content File (`.md`)
- **Location**: `generated-templates/{type}-{language}-{date}.md`
- **Format**: AI-generated markdown content with variables
- **Naming**: `{templateType}-{language}-{YYYY-MM-DD}.md`

#### Template Metadata File (`.meta.json`)
- **Location**: `generated-templates/{type}-{language}-{date}.meta.json`
- **Format**: JSON with generation context

**Example**: `generated-templates/spec-typescript-2025-09-14.meta.json`
```json
{
  "name": "spec-typescript-2025-09-14",
  "type": "spec",
  "description": "Generated spec template for typescript api",
  "generated": "2025-09-14T10:30:00.000Z",
  "projectContext": {
    "language": "typescript",
    "framework": "express",
    "projectType": "api",
    "architecture": "microservices",
    "testingFramework": "jest"
  },
  "customizations": {
    "includeSecuritySection": true,
    "includeCICD": true,
    "complexityLevel": "complex"
  },
  "variables": [
    "serviceName",
    "description",
    "endpoints",
    "database"
  ]
}
```

## Configurable Directory Structure

### Custom Directory Configuration
You can customize the directory paths using the `configure_directories` tool:

```json
{
  "name": "configure_directories",
  "arguments": {
    "directories": {
      "customTemplates": "project-templates/custom",
      "generatedTemplates": "project-templates/generated",
      "templates": "project-templates/base"
    }
  }
}
```

### Example: Enterprise Structure
```
enterprise-project/
├── standards/
│   ├── templates/               # Built-in templates
│   ├── custom-templates/        # Custom templates
│   │   ├── spec/
│   │   ├── plan/
│   │   ├── tasks/
│   │   └── constitution/
│   └── generated-templates/     # Generated templates
├── governance/
│   └── principles/
└── .speckit/
    └── config.json
```

### Example: Microservices Structure
```
microservices-project/
├── templates/
│   ├── service-specs/           # Custom templates location
│   │   ├── spec/
│   │   ├── plan/
│   │   └── tasks/
│   └── generated-specs/         # Generated templates location
├── services/
│   ├── specifications/
│   ├── architecture/
│   └── implementation/
└── .speckit/
    └── config.json
```

## Template Types Supported

### Template Types
1. **`spec`** - Feature specifications
2. **`plan`** - Implementation plans  
3. **`tasks`** - Task breakdowns
4. **`constitution`** - Governance/architectural principles

### Variable System
- **Syntax**: `{{variableName}}`
- **Case Sensitive**: Variables are case-sensitive
- **Extraction**: Automatically extracted from template content
- **Validation**: Variables are validated during template application

## File Operations

### Creating Custom Templates
- **Tool**: `create_custom_template`
- **Location**: `{customTemplatesDir}/{templateType}/{templateName}.md`
- **Metadata**: Auto-generated with variables and metadata
- **Structure**: Organized by template type

### Generating Templates
- **Tool**: `generate_template`
- **Location**: `{generatedTemplatesDir}/{templateType}-{language}-{date}.md`
- **Metadata**: Includes project context and customizations
- **Structure**: Flat structure with timestamp-based naming

### Using Templates
- **Tool**: `apply_template`
- **Source**: Custom or generated templates
- **Output**: Applied to configured specification/plan/task directories
- **Variables**: Substituted with provided values

## Best Practices

### Organization
1. **Use Type Directories**: Organize custom templates by type (spec, plan, tasks)
2. **Descriptive Names**: Use clear, descriptive template names
3. **Version Control**: Include version information in metadata
4. **Documentation**: Add comprehensive descriptions in metadata

### Naming Conventions
- **Custom Templates**: `{purpose}-{context}-{type}.md`
- **Generated Templates**: Auto-generated with timestamp
- **Variables**: Use camelCase for consistency
- **Files**: Use kebab-case for file names

### Directory Configuration
- **Project-Specific**: Configure directories per project needs
- **Team Standards**: Align with team/organization conventions
- **Backup Configuration**: Save directory configurations in version control
- **Documentation**: Document custom directory structures

## Integration with Enterprise Features

### Governance Integration
- Constitution templates in custom templates
- Compliance-focused template structures
- Audit trail through metadata

### Security Integration  
- Security-focused template variables
- Compliance templates for regulations
- Secure template storage and access

### CI/CD Integration
- Template-based pipeline generation
- Automated template deployment
- Template versioning and updates

This folder structure provides flexibility while maintaining organization and enabling powerful template management capabilities across different project types and organizational structures.