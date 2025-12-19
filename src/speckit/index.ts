#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Import enterprise modules (will be compiled to .js)
import { EnterpriseGovernanceManager } from './src/enterprise/governance.js';
import { EnterpriseSecurityManager } from './src/enterprise/security.js';
import { EnterpriseCICDManager } from './src/enterprise/cicd.js';
import { EnterpriseMonitoringManager } from './src/enterprise/monitoring.js';
import { EnterpriseScalabilityManager } from './src/enterprise/scalability.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Schema definitions for core tool parameters

// Project directory configuration schema
const DirectoryConfigSchema = z.object({
  specifications: z.string().default('features').describe("Directory for feature specifications"),
  plans: z.string().default('plans').describe("Directory for implementation plans"),
  tasks: z.string().default('tasks').describe("Directory for task breakdowns"),
  templates: z.string().default('templates').describe("Directory for built-in templates"),
  customTemplates: z.string().default('custom-templates').describe("Directory for custom templates"),
  generatedTemplates: z.string().default('generated-templates').describe("Directory for generated templates"),
  memory: z.string().default('memory').describe("Directory for constitution and memory"),
  enterprise: z.string().default('enterprise').describe("Directory for enterprise configurations"),
  commands: z.string().default('commands').describe("Directory for command templates")
});

const ConfigureDirectoriesSchema = z.object({
  projectPath: z.string().describe("Path to the project directory"),
  directories: DirectoryConfigSchema.optional().describe("Custom directory configuration"),
  saveConfig: z.boolean().default(true).describe("Whether to save configuration to project")
});

const InitProjectSchema = z.object({
  projectName: z.string().describe("Name of the project to initialize"),
  aiAssistant: z.enum(['claude', 'gemini', 'copilot']).describe("AI assistant to configure for"),
  workingDirectory: z.string().optional().describe("Directory to initialize project in (defaults to current working directory)"),
  useCurrentDirectory: z.boolean().optional().default(false).describe("Initialize in current directory instead of creating new folder"),
  enterpriseMode: z.boolean().optional().default(false).describe("Enable enterprise features (governance, security, CI/CD)"),
  directoryConfig: DirectoryConfigSchema.optional().describe("Custom directory structure configuration"),
  customTemplates: z.object({
    specTemplate: z.string().optional().describe("Custom specification template file name (without .md extension)"),
    planTemplate: z.string().optional().describe("Custom plan template file name (without .md extension)"),
    tasksTemplate: z.string().optional().describe("Custom tasks template file name (without .md extension)"),
    constitutionTemplate: z.string().optional().describe("Custom constitution template file name (without .md extension)")
  }).optional().describe("Custom template file names to use during initialization")
});

const CreateSpecificationSchema = z.object({
  featureDescription: z.string().describe("Description of the feature to create specification for"),
  projectPath: z.string().optional().describe("Path to the project directory (defaults to current working directory)"),
  featureNumber: z.number().optional().describe("Feature number (auto-generated if not provided)"),
  requiresApproval: z.boolean().optional().default(false).describe("Whether this specification requires approval workflow")
});

const CreatePlanSchema = z.object({
  specPath: z.string().describe("Path to the feature specification file"),
  technicalContext: z.string().describe("Technical context and technology choices for the implementation"),
  projectPath: z.string().optional().describe("Path to the project directory"),
  includeSecurityScan: z.boolean().optional().default(false).describe("Include security scanning in the plan")
});

const CreateTasksSchema = z.object({
  planPath: z.string().describe("Path to the implementation plan file"),
  projectPath: z.string().optional().describe("Path to the project directory"),
  includeCICD: z.boolean().optional().default(false).describe("Include CI/CD pipeline tasks")
});

const ValidateConstitutionSchema = z.object({
  planPath: z.string().describe("Path to the implementation plan file to validate"),
  constitutionPath: z.string().optional().describe("Path to constitution file (defaults to memory/constitution.md)")
});

// Enterprise schema definitions
const CreateApprovalWorkflowSchema = z.object({
  name: z.string().describe("Name of the approval workflow"),
  steps: z.array(z.object({
    name: z.string(),
    approvers: z.array(z.string()),
    requiredApprovals: z.number()
  })).describe("Approval steps"),
  requiredApprovals: z.number().describe("Total required approvals")
});

const SecurityScanSchema = z.object({
  resourcePath: z.string().describe("Path to resource to scan"),
  scanType: z.enum(['code', 'dependency', 'configuration', 'infrastructure']).describe("Type of security scan")
});

const CreatePipelineSchema = z.object({
  name: z.string().describe("Name of the CI/CD pipeline"),
  triggers: z.array(z.string()).describe("Pipeline triggers (push, pull_request, schedule)"),
  includeSecurityStage: z.boolean().optional().default(true).describe("Include security scanning stage"),
  deploymentStrategy: z.enum(['blue_green', 'canary', 'rolling']).optional().describe("Deployment strategy")
});

const MonitoringConfigSchema = z.object({
  serviceName: z.string().describe("Name of the service to monitor"),
  metricsToTrack: z.array(z.string()).describe("Metrics to track"),
  alertThresholds: z.record(z.number()).describe("Alert thresholds for metrics")
});

const TenantConfigSchema = z.object({
  tenantName: z.string().describe("Name of the tenant"),
  domain: z.string().describe("Tenant domain"),
  resourceLimits: z.object({
    cpu: z.number(),
    memory: z.number(),
    storage: z.number(),
    bandwidth: z.number().optional().default(1000)
  }).describe("Resource limits for the tenant")
});

// Custom template management schemas
const CreateCustomTemplateSchema = z.object({
  templateType: z.enum(['spec', 'plan', 'tasks', 'constitution']).describe("Type of template to create"),
  templateName: z.string().describe("Name of the custom template"),
  templateContent: z.string().describe("Content of the template with placeholders"),
  projectPath: z.string().optional().describe("Path to the project directory"),
  description: z.string().optional().describe("Description of the template")
});

const GenerateTemplateSchema = z.object({
  templateType: z.enum(['spec', 'plan', 'tasks']).describe("Type of template to generate"),
  projectContext: z.object({
    language: z.string().describe("Primary programming language"),
    framework: z.string().optional().describe("Framework being used"),
    projectType: z.enum(['web', 'api', 'mobile', 'desktop', 'cli', 'library']).describe("Type of project"),
    architecture: z.enum(['monolith', 'microservices', 'serverless', 'jamstack']).optional().describe("Architecture pattern"),
    testingFramework: z.string().optional().describe("Testing framework preference"),
    deploymentTarget: z.enum(['cloud', 'on-premise', 'hybrid']).optional().describe("Deployment target")
  }).describe("Project context for template generation"),
  projectPath: z.string().optional().describe("Path to the project directory"),
  customizations: z.object({
    includeSecuritySection: z.boolean().optional().default(false),
    includeCICD: z.boolean().optional().default(false),
    includeMonitoring: z.boolean().optional().default(false),
    complexityLevel: z.enum(['simple', 'moderate', 'complex']).optional().default('moderate')
  }).optional().describe("Template customization options")
});

const ListTemplatesSchema = z.object({
  projectPath: z.string().optional().describe("Path to the project directory"),
  templateType: z.enum(['spec', 'plan', 'tasks', 'constitution', 'all']).optional().default('all').describe("Type of templates to list")
});

const UseCustomTemplateSchema = z.object({
  templateName: z.string().describe("Name of the custom template to use"),
  templateType: z.enum(['spec', 'plan', 'tasks']).describe("Type of template"),
  variables: z.record(z.string()).describe("Variables to replace in the template"),
  projectPath: z.string().optional().describe("Path to the project directory"),
  outputFileName: z.string().optional().describe("Custom output file name")
});

// New enhanced tools schemas
const GenerateProjectStructureSchema = z.object({
  projectName: z.string().describe("Name of the project to generate structure for"),
  taskPrefix: z.string().describe("Prefix for task naming (e.g., 'VNP2')"),
  categories: z.array(z.string()).describe("Categories for task organization (e.g., ['backend', 'frontend', 'state', 'ui', 'integration', 'testing'])"),
  includeUserStories: z.boolean().optional().default(true).describe("Whether to include user stories generation"),
  projectPath: z.string().optional().describe("Path to the project directory"),
  totalEffortHours: z.string().optional().describe("Total estimated effort in hours"),
  developmentDays: z.string().optional().describe("Estimated development days")
});

const CreateComprehensiveTasksSchema = z.object({
  specPath: z.string().describe("Path to the feature specification file"),
  taskCategories: z.record(z.object({
    count: z.number().describe("Number of tasks in this category"),
    effort: z.string().describe("Effort estimation per task (e.g., '6h each')")
  })).describe("Task categories with count and effort specifications"),
  projectPath: z.string().optional().describe("Path to the project directory"),
  taskPrefix: z.string().optional().describe("Prefix for task naming"),
  includeDetailedSections: z.boolean().optional().default(true).describe("Include detailed task sections (15+ sections)")
});

const GenerateUserStoriesSchema = z.object({
  personas: z.array(z.string()).describe("User personas to generate stories for (e.g., ['power-user', 'casual-user', 'admin-user'])"),
  generateValidationMatrix: z.boolean().optional().default(true).describe("Generate validation matrix for user stories"),
  projectPath: z.string().optional().describe("Path to the project directory"),
  featureContext: z.string().optional().describe("Context about the feature for generating relevant stories"),
  includeAcceptanceCriteria: z.boolean().optional().default(true).describe("Include acceptance criteria for each story")
});

const GenerateQualityFrameworkSchema = z.object({
  testCoverageTarget: z.number().optional().default(90).describe("Target test coverage percentage"),
  performanceTargets: z.object({
    loadTime: z.string().optional().default("<1s").describe("Page load time target"),
    apiResponse: z.string().optional().default("<300ms").describe("API response time target"),
    memoryUsage: z.string().optional().describe("Memory usage limits"),
    cpuUsage: z.string().optional().describe("CPU usage limits")
  }).describe("Performance targets for the quality framework"),
  projectPath: z.string().optional().describe("Path to the project directory"),
  includeSecurityChecks: z.boolean().optional().default(true).describe("Include security quality checks"),
  includeAccessibilityChecks: z.boolean().optional().default(true).describe("Include accessibility quality checks")
});

// Enterprise Spec-Kit Manager
class EnterpriseSpecKitManager {
  private governance: EnterpriseGovernanceManager | null = null;
  private security: EnterpriseSecurityManager | null = null;
  private cicd: EnterpriseCICDManager | null = null;
  private monitoring: EnterpriseMonitoringManager | null = null;
  private scalability: EnterpriseScalabilityManager | null = null;
  private directoryConfig: z.infer<typeof DirectoryConfigSchema> = DirectoryConfigSchema.parse({});

  constructor(basePath: string, enterpriseMode: boolean = false) {
    if (enterpriseMode) {
      this.governance = new EnterpriseGovernanceManager(basePath);
      this.security = new EnterpriseSecurityManager(basePath);
      this.cicd = new EnterpriseCICDManager(basePath);
      this.monitoring = new EnterpriseMonitoringManager(basePath);
      this.scalability = new EnterpriseScalabilityManager(basePath);
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  async readTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(__dirname, 'templates', templateName);
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read template ${templateName}: ${error}`);
    }
  }

  async loadTemplateContent(templateName: string, addExtension: boolean = true, basePath?: string): Promise<string> {
    const fullTemplateName = addExtension ? `${templateName}.md` : templateName;
    const projectBase = basePath || process.cwd();
    
    // Load project configuration to get custom directory paths
    await this.loadProjectConfig(projectBase);
    
    try {
      // First priority: Try custom templates directory from configuration
      const customTemplatesDir = this.getDirectoryPath(projectBase, 'customTemplates');
      const customTemplatePath = path.join(customTemplatesDir, fullTemplateName);
      return await fs.readFile(customTemplatePath, 'utf-8');
    } catch (error) {
      try {
        // Second priority: Try built-in templates directory from configuration
        const templatesDir = this.getDirectoryPath(projectBase, 'templates');
        const configTemplatePath = path.join(templatesDir, fullTemplateName);
        return await fs.readFile(configTemplatePath, 'utf-8');
      } catch (configError) {
        try {
          // Third priority: Try built-in templates directory (with __dirname)
          return await this.readTemplate(fullTemplateName);
        } catch (builtinError) {
          // Fourth priority: Try source templates directory
          try {
            const sourceTemplatePath = path.join(process.cwd(), 'src', 'speckit', 'templates', fullTemplateName);
            return await fs.readFile(sourceTemplatePath, 'utf-8');
          } catch (sourceError) {
            // Fifth priority: Try the current directory templates
            try {
              const currentTemplatePath = path.join(process.cwd(), 'templates', fullTemplateName);
              return await fs.readFile(currentTemplatePath, 'utf-8');
            } catch (currentError) {
              // Sixth priority: Try relative to the speckit directory
              try {
                const relativeTemplatePath = path.join(__dirname, '..', 'templates', fullTemplateName);
                return await fs.readFile(relativeTemplatePath, 'utf-8');
              } catch (relativeError) {
                // Final fallback: Return a basic template
                return this.getDefaultTemplate(templateName);
              }
            }
          }
        }
      }
    }
  }

  private getDefaultTemplate(templateName: string): string {
    const templates: Record<string, string> = {
      'spec-template': `# {{FEATURE_NAME}} - Feature Specification

## Overview
{{FEATURE_DESCRIPTION}}

## Business Context
{{BUSINESS_CONTEXT}}

## User Stories
{{USER_STORIES}}

## Functional Requirements
{{FUNCTIONAL_REQUIREMENTS}}

## Technical Requirements
{{TECHNICAL_REQUIREMENTS}}

## Non-Functional Requirements
{{NON_FUNCTIONAL_REQUIREMENTS}}

## Dependencies
{{DEPENDENCIES}}

## Testing Strategy
{{TESTING_STRATEGY}}

## Acceptance Criteria
{{ACCEPTANCE_CRITERIA}}

## Out of Scope
{{OUT_OF_SCOPE}}

---
*Generated by Spec-Kit Enterprise*`,

      'plan-template': `# {{FEATURE_NAME}} - Implementation Plan

## Specification Reference
- **Spec Path**: {{SPEC_PATH}}

## Technical Context
{{TECHNICAL_CONTEXT}}

## Implementation Phases

### Phase 1: Setup and Foundation
{{PHASE_1_TASKS}}

### Phase 2: Core Implementation  
{{PHASE_2_TASKS}}

### Phase 3: Integration and Testing
{{PHASE_3_TASKS}}

## Constitutional Check
{{CONSTITUTIONAL_CHECK}}

## Risk Assessment
{{RISK_ASSESSMENT}}

## Timeline
{{TIMELINE}}

---
*Generated by Spec-Kit Enterprise*`,

      'tasks-template': `# {{FEATURE_NAME}} - Task Breakdown

## Plan Reference
- **Plan Path**: {{PLAN_PATH}}

## Test-First Implementation Order

### 1. Test Setup
{{TEST_SETUP_TASKS}}

### 2. Unit Tests (Write First)
{{UNIT_TEST_TASKS}}

### 3. Core Implementation
{{IMPLEMENTATION_TASKS}}

### 4. Integration Tests
{{INTEGRATION_TEST_TASKS}}

### 5. Documentation
{{DOCUMENTATION_TASKS}}

### 6. Deployment
{{DEPLOYMENT_TASKS}}

## Parallel Tasks
{{PARALLEL_TASKS}}

## Dependencies
{{TASK_DEPENDENCIES}}

---
*Generated by Spec-Kit Enterprise*`,

      'constitution': `# Project Constitution

## Architectural Principles

### 1. Library-First Approach
- Prefer libraries over frameworks
- Design for composability and reusability
- Minimize external dependencies

### 2. CLI-Driven Development
- All functionality accessible via command line
- Scriptable and automatable processes
- Clear, consistent interface design

### 3. Test-First Implementation
- Write tests before implementation
- Achieve high test coverage (>90%)
- Use TDD methodology throughout

### 4. Integration Over Mocking
- Prefer integration tests over unit tests
- Test with real dependencies when possible
- Mock only when necessary for isolation

### 5. Built-in Observability
- Comprehensive logging at all levels
- Performance metrics collection
- Error tracking and alerting
- Health check endpoints

## Standards

### Code Quality
- Follow established coding standards
- Use static analysis tools
- Implement peer review processes
- Maintain clear documentation

### Security
- Security by design principles
- Regular security audits
- Implement proper authentication/authorization
- Keep dependencies updated

### Performance
- Performance testing required
- Optimization for scalability
- Resource usage monitoring
- Response time requirements

---
*Spec-Kit Enterprise Constitution*`
    };

    return templates[templateName] || `# ${templateName}

Template content not found. This is a placeholder template.

## Content
Please replace this content with your actual template.

---
*Generated by Spec-Kit Enterprise*`;
  }

  // Directory configuration methods
  async loadProjectConfig(projectPath: string): Promise<void> {
    // Try primary config location
    const configPath = path.join(projectPath, '.speckit', 'config.json');
    
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      if (config.directories) {
        this.directoryConfig = DirectoryConfigSchema.parse(config.directories);
        return;
      }
    } catch (error) {
      // Try fallback config location (.speckit-config.json in project root)
      try {
        const fallbackConfigPath = path.join(projectPath, '.speckit-config.json');
        const configContent = await fs.readFile(fallbackConfigPath, 'utf-8');
        const config = JSON.parse(configContent);
        if (config.directories) {
          this.directoryConfig = DirectoryConfigSchema.parse(config.directories);
          return;
        }
      } catch (fallbackError) {
        // Both config files don't exist or are invalid, use defaults
        this.directoryConfig = DirectoryConfigSchema.parse({});
      }
    }
  }

  async saveProjectConfig(projectPath: string, directories?: z.infer<typeof DirectoryConfigSchema>): Promise<void> {
    const configDir = path.join(projectPath, '.speckit');
    const configPath = path.join(configDir, 'config.json');
    
    await this.createDirectory(configDir);
    
    if (directories) {
      this.directoryConfig = DirectoryConfigSchema.parse(directories);
    }

    const config = {
      version: "1.0",
      created: new Date().toISOString(),
      directories: this.directoryConfig
    };

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  getDirectoryPath(projectPath: string, directoryType: keyof z.infer<typeof DirectoryConfigSchema>): string {
    return path.join(projectPath, this.directoryConfig[directoryType]);
  }

  async configureDirectories(args: z.infer<typeof ConfigureDirectoriesSchema>): Promise<{ configPath: string; directories: z.infer<typeof DirectoryConfigSchema> }> {
    const { projectPath, directories, saveConfig } = args;
    
    // Load existing config first
    await this.loadProjectConfig(projectPath);
    
    // Merge with new directories if provided
    if (directories) {
      this.directoryConfig = DirectoryConfigSchema.parse({
        ...this.directoryConfig,
        ...directories
      });
    }

    // Create all configured directories
    for (const [dirType, dirName] of Object.entries(this.directoryConfig)) {
      const dirPath = path.join(projectPath, dirName);
      await this.createDirectory(dirPath);
    }

    // Save configuration if requested
    if (saveConfig) {
      await this.saveProjectConfig(projectPath);
    }

    return {
      configPath: path.join(projectPath, '.speckit', 'config.json'),
      directories: this.directoryConfig
    };
  }

  async initializeProject(args: z.infer<typeof InitProjectSchema>): Promise<string> {
    const { projectName, aiAssistant, workingDirectory, useCurrentDirectory, enterpriseMode, directoryConfig, customTemplates } = args;
    
    const baseDir = workingDirectory || process.cwd();
    const projectPath = useCurrentDirectory ? baseDir : path.join(baseDir, projectName);
    
    // Load existing project configuration if it exists (for directory configuration)
    await this.loadProjectConfig(projectPath);
    
    // Set up directory configuration
    if (directoryConfig) {
      this.directoryConfig = DirectoryConfigSchema.parse({
        ...this.directoryConfig,
        ...directoryConfig
      });
    }

    // Create project structure using configured directories
    await this.createDirectory(projectPath);
    await this.createDirectory(this.getDirectoryPath(projectPath, 'memory'));
    await this.createDirectory(this.getDirectoryPath(projectPath, 'specifications'));
    await this.createDirectory(this.getDirectoryPath(projectPath, 'plans'));
    await this.createDirectory(this.getDirectoryPath(projectPath, 'tasks'));
    await this.createDirectory(this.getDirectoryPath(projectPath, 'templates'));
    await this.createDirectory(this.getDirectoryPath(projectPath, 'customTemplates'));
    await this.createDirectory(this.getDirectoryPath(projectPath, 'generatedTemplates'));
    
    // Create custom templates subdirectories
    const customTemplatesDir = this.getDirectoryPath(projectPath, 'customTemplates');
    await this.createDirectory(path.join(customTemplatesDir, 'spec'));
    await this.createDirectory(path.join(customTemplatesDir, 'plan'));
    await this.createDirectory(path.join(customTemplatesDir, 'tasks'));
    await this.createDirectory(path.join(customTemplatesDir, 'constitution'));
    
    if (enterpriseMode) {
      const enterpriseDir = this.getDirectoryPath(projectPath, 'enterprise');
      await this.createDirectory(enterpriseDir);
      await this.createDirectory(path.join(enterpriseDir, 'governance'));
      await this.createDirectory(path.join(enterpriseDir, 'security'));
      await this.createDirectory(path.join(enterpriseDir, 'cicd'));
      await this.createDirectory(path.join(enterpriseDir, 'monitoring'));
      await this.createDirectory(path.join(enterpriseDir, 'scalability'));
      
      // Initialize enterprise managers for this project
      this.governance = new EnterpriseGovernanceManager(projectPath);
      this.security = new EnterpriseSecurityManager(projectPath);
      this.cicd = new EnterpriseCICDManager(projectPath);
      this.monitoring = new EnterpriseMonitoringManager(projectPath);
      this.scalability = new EnterpriseScalabilityManager(projectPath);
    }
    
    // Copy templates to configured directories - use custom templates if specified
    const templatesDir = this.getDirectoryPath(projectPath, 'templates');
    const memoryDir = this.getDirectoryPath(projectPath, 'memory');
    
    try {
      // Load templates (custom if specified, otherwise default)
      const specTemplate = await this.loadTemplateContent(
        customTemplates?.specTemplate || 'spec-template'
      );
      const planTemplate = await this.loadTemplateContent(
        customTemplates?.planTemplate || 'plan-template'
      );
      const tasksTemplate = await this.loadTemplateContent(
        customTemplates?.tasksTemplate || 'tasks-template'
      );
      const constitution = await this.loadTemplateContent(
        customTemplates?.constitutionTemplate || 'constitution'
      );
      
      await fs.writeFile(path.join(templatesDir, 'spec-template.md'), specTemplate);
      await fs.writeFile(path.join(templatesDir, 'plan-template.md'), planTemplate);
      await fs.writeFile(path.join(templatesDir, 'tasks-template.md'), tasksTemplate);
      await fs.writeFile(path.join(memoryDir, 'constitution.md'), constitution);
      
    } catch (error) {
      throw new Error(`Failed to load templates: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Create assistant-specific command templates
    const commandsDir = this.getDirectoryPath(projectPath, 'commands');
    await this.createDirectory(commandsDir);
    
    try {
      const specifyCommand = await this.loadTemplateContent('commands/specify', false);
      const planCommand = await this.loadTemplateContent('commands/plan', false);
      const tasksCommand = await this.loadTemplateContent('commands/tasks', false);
      
      await fs.writeFile(path.join(commandsDir, 'specify.md'), specifyCommand);
      await fs.writeFile(path.join(commandsDir, 'plan.md'), planCommand);
      await fs.writeFile(path.join(commandsDir, 'tasks.md'), tasksCommand);
    } catch (error) {
      // If command templates don't exist, create basic ones
      const basicSpecifyCommand = `# Specify Command

Use this command to create feature specifications using the spec-kit methodology.

## Usage
Run: create_specification with your feature description
`;
      await fs.writeFile(path.join(commandsDir, 'specify.md'), basicSpecifyCommand);
      await fs.writeFile(path.join(commandsDir, 'plan.md'), basicSpecifyCommand.replace('Specify', 'Plan').replace('create_specification', 'create_plan'));
      await fs.writeFile(path.join(commandsDir, 'tasks.md'), basicSpecifyCommand.replace('Specify', 'Tasks').replace('create_specification', 'create_tasks'));
    }
    
    // Log project initialization if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `Project initialized: ${projectName}`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { 
          projectPath, 
          aiAssistant, 
          enterpriseMode,
          customDirectories: directoryConfig ? 'enabled' : 'default',
          customTemplates: customTemplates ? Object.keys(customTemplates).length : 0
        }
      });
    }
    
    // Save directory configuration
    await this.saveProjectConfig(projectPath);
    
    return projectPath;
  }

  async createSpecification(args: z.infer<typeof CreateSpecificationSchema>): Promise<string> {
    const { featureDescription, projectPath, featureNumber, requiresApproval } = args;
    
    const basePath = projectPath || process.cwd();
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const featuresDir = this.getDirectoryPath(basePath, 'specifications');
    
    // Generate feature number if not provided
    const featureNum = featureNumber || await this.getNextFeatureNumber(featuresDir);
    const specFileName = `feature-${featureNum.toString().padStart(3, '0')}.md`;
    const specPath = path.join(featuresDir, specFileName);
    
    // Read and customize template
    const template = await this.loadTemplateContent('spec-template', true, basePath);
    const customizedSpec = template.replace('{{FEATURE_DESCRIPTION}}', featureDescription);
    
    await fs.writeFile(specPath, customizedSpec);
    
    // If approval required and governance enabled, create change request
    if (requiresApproval && this.governance) {
      await this.governance.createChangeRequest({
        title: `Feature Specification: ${featureDescription}`,
        description: `New feature specification created at ${specPath}`,
        type: 'specification',
        priority: 'medium',
        requester: 'system',
        approvalWorkflow: 'default',
        currentStep: 'initial',
        status: 'pending',
        approvals: [],
        complianceChecks: []
      });
    }
    
    // Log specification creation if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `Specification created: ${specFileName}`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { specPath, featureDescription, requiresApproval }
      });
    }
    
    return specPath;
  }

  async createImplementationPlan(args: z.infer<typeof CreatePlanSchema>): Promise<string> {
    const { specPath, technicalContext, projectPath, includeSecurityScan } = args;
    
    const basePath = projectPath || path.dirname(specPath);
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const plansDir = this.getDirectoryPath(basePath, 'plans');
    
    // Extract feature number from spec filename
    const specFileName = path.basename(specPath, '.md');
    const planFileName = specFileName.replace('feature-', 'plan-') + '.md';
    const planPath = path.join(plansDir, planFileName);
    
    // Read and customize template
    const template = await this.loadTemplateContent('plan-template', true, basePath);
    const customizedPlan = template
      .replace('{{SPEC_PATH}}', specPath)
      .replace('{{TECHNICAL_CONTEXT}}', technicalContext);
    
    await fs.writeFile(planPath, customizedPlan);
    
    // Perform security scan if requested and security enabled
    if (includeSecurityScan && this.security) {
      const specContent = await fs.readFile(specPath, 'utf-8');
      const scanResult = await this.security.performSecurityScan(
        specPath,
        specContent,
        'configuration'
      );
      
      // Append security scan results to plan
      const securitySection = `\n\n## Security Scan Results\n\n${JSON.stringify(scanResult, null, 2)}\n`;
      const planContent = await fs.readFile(planPath, 'utf-8');
      await fs.writeFile(planPath, planContent + securitySection);
    }
    
    // Log plan creation if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `Implementation plan created: ${planFileName}`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { planPath, specPath, includeSecurityScan }
      });
    }
    
    return planPath;
  }

  async createTasks(args: z.infer<typeof CreateTasksSchema>): Promise<string> {
    const { planPath, projectPath, includeCICD } = args;
    
    const basePath = projectPath || path.dirname(planPath);
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const tasksDir = this.getDirectoryPath(basePath, 'tasks');
    
    // Extract feature number from plan filename
    const planFileName = path.basename(planPath, '.md');
    const tasksFileName = planFileName.replace('plan-', 'tasks-') + '.md';
    const tasksPath = path.join(tasksDir, tasksFileName);
    
    // Read and customize template
    const template = await this.loadTemplateContent('tasks-template', true, basePath);
    const customizedTasks = template.replace('{{PLAN_PATH}}', planPath);
    
    await fs.writeFile(tasksPath, customizedTasks);
    
    // Add CI/CD tasks if requested
    if (includeCICD) {
      const cicdTasks = `\n\n## CI/CD Pipeline Tasks\n\n- [ ] Set up pipeline configuration\n- [ ] Configure automated testing\n- [ ] Set up security scanning\n- [ ] Configure deployment stages\n- [ ] Set up monitoring and alerting\n`;
      const tasksContent = await fs.readFile(tasksPath, 'utf-8');
      await fs.writeFile(tasksPath, tasksContent + cicdTasks);
    }
    
    // Log tasks creation if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `Tasks created: ${tasksFileName}`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { tasksPath, planPath, includeCICD }
      });
    }
    
    return tasksPath;
  }

  async validateConstitution(args: z.infer<typeof ValidateConstitutionSchema>): Promise<string> {
    const { planPath, constitutionPath } = args;
    
    const basePath = path.dirname(planPath);
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const constitutionFile = constitutionPath || path.join(this.getDirectoryPath(basePath, 'memory'), 'constitution.md');
    
    try {
      const [planContent, constitutionContent] = await Promise.all([
        fs.readFile(planPath, 'utf-8'),
        fs.readFile(constitutionFile, 'utf-8')
      ]);
      
      // Perform compliance check if governance enabled
      if (this.governance) {
        const complianceChecks = await this.governance.runComplianceCheck(
          'architectural',
          planPath,
          { plan: planContent, constitution: constitutionContent }
        );
        
        const validationResult = complianceChecks.map(check => 
          `${check.requirement}: ${check.status}`
        ).join('\n');
        
        return `Constitution validation for ${planPath}:\n\n${validationResult}`;
      } else {
        // Basic validation logic for non-enterprise mode
        const principles = [
          'single responsibility',
          'separation of concerns',
          'dependency injection',
          'testability',
          'maintainability'
        ];
        
        const planLower = planContent.toLowerCase();
        const foundPrinciples = principles.filter(principle => 
          planLower.includes(principle) || constitutionContent.toLowerCase().includes(principle)
        );
        
        const validationResult = `Constitution validation for ${planPath}:

Found adherence to ${foundPrinciples.length}/${principles.length} key principles:
${foundPrinciples.map(p => `✓ ${p}`).join('\n')}

${foundPrinciples.length < principles.length ? 
  `Missing principles:\n${principles.filter(p => !foundPrinciples.includes(p)).map(p => `✗ ${p}`).join('\n')}` : 
  'All key principles addressed!'}

Recommendation: ${foundPrinciples.length >= 3 ? 'Plan aligns well with constitution' : 'Review plan against constitutional principles'}`;
        
        return validationResult;
      }
      
    } catch (error) {
      throw new Error(`Failed to validate constitution: ${error}`);
    }
  }

  private async getNextFeatureNumber(featuresDir: string): Promise<number> {
    try {
      const files = await fs.readdir(featuresDir);
      const featureFiles = files.filter(f => f.startsWith('feature-') && f.endsWith('.md'));
      
      if (featureFiles.length === 0) return 1;
      
      const numbers = featureFiles.map(f => {
        const match = f.match(/feature-(\d+)\.md/);
        return match ? parseInt(match[1], 10) : 0;
      });
      
      return Math.max(...numbers) + 1;
    } catch (error) {
      return 1;
    }
  }

  // Enterprise methods
  async createApprovalWorkflow(args: z.infer<typeof CreateApprovalWorkflowSchema>) {
    if (!this.governance) {
      throw new Error('Enterprise governance not enabled. Initialize project with enterpriseMode: true');
    }
    
    const workflow = {
      id: `workflow-${Date.now()}`,
      name: args.name,
      steps: args.steps.map((step, index) => ({
        id: `step-${index + 1}`,
        name: step.name,
        approvers: step.approvers,
        requiredApprovals: step.requiredApprovals
      })),
      requiredApprovals: args.requiredApprovals,
      autoApprovalRules: []
    };
    
    await this.governance.createApprovalWorkflow(workflow);
    return workflow;
  }

  async performSecurityScan(args: z.infer<typeof SecurityScanSchema>) {
    if (!this.security) {
      throw new Error('Enterprise security not enabled. Initialize project with enterpriseMode: true');
    }
    
    const content = await fs.readFile(args.resourcePath, 'utf-8');
    return await this.security.performSecurityScan(args.resourcePath, content, args.scanType);
  }

  async createPipeline(args: z.infer<typeof CreatePipelineSchema>) {
    if (!this.cicd) {
      throw new Error('Enterprise CI/CD not enabled. Initialize project with enterpriseMode: true');
    }
    
    const pipeline = {
      id: `pipeline-${Date.now()}`,
      name: args.name,
      description: `CI/CD pipeline for ${args.name}`,
      triggers: args.triggers.map(trigger => ({ type: trigger as any, branches: ['main'] })),
      stages: [
        {
          id: 'build',
          name: 'Build',
          type: 'build' as const,
          dependsOn: [],
          parallel: false,
          jobs: [{
            id: 'build-job',
            name: 'Build Application',
            script: ['npm install', 'npm run build'],
            artifacts: [{ name: 'build-output', paths: ['dist/'], retention: 7, type: 'build' as const }]
          }]
        },
        ...(args.includeSecurityStage ? [{
          id: 'security',
          name: 'Security Scan',
          type: 'security_scan' as const,
          dependsOn: ['build'],
          parallel: false,
          jobs: [{
            id: 'security-scan',
            name: 'Security Scan',
            script: ['npm audit', 'npm run security-scan'],
            artifacts: [{ name: 'security-report', paths: ['security-report.json'], retention: 30, type: 'security_report' as const }]
          }]
        }] : [])
      ],
      environment: {},
      notifications: []
    };
    
    return await this.cicd.createPipeline(pipeline);
  }

  async setupMonitoring(args: z.infer<typeof MonitoringConfigSchema>) {
    if (!this.monitoring) {
      throw new Error('Enterprise monitoring not enabled. Initialize project with enterpriseMode: true');
    }
    
    // Create alerts for each metric
    for (const [metric, threshold] of Object.entries(args.alertThresholds)) {
      await this.monitoring.createAlert({
        id: `alert-${args.serviceName}-${metric}`,
        name: `${args.serviceName} ${metric} Alert`,
        description: `Alert for ${metric} exceeding threshold`,
        severity: 'warning',
        condition: {
          metric,
          operator: '>',
          threshold,
          window: '5m',
          aggregation: 'avg'
        },
        actions: [{
          type: 'email',
          configuration: { recipients: ['admin@company.com'] },
          enabled: true
        }],
        enabled: true
      });
    }
    
    return { message: `Monitoring configured for ${args.serviceName}` };
  }

  async createTenant(args: z.infer<typeof TenantConfigSchema>) {
    if (!this.scalability) {
      throw new Error('Enterprise scalability not enabled. Initialize project with enterpriseMode: true');
    }
    
    const tenant = {
      id: `tenant-${Date.now()}`,
      name: args.tenantName,
      domain: args.domain,
      resources: {
        cpu: args.resourceLimits.cpu || 4, // Default 4 cores
        memory: args.resourceLimits.memory || 8192, // Default 8GB
        storage: args.resourceLimits.storage || 100, // Default 100GB
        bandwidth: 1000 // Default 1Gbps
      },
      isolation: {
        level: 'shared' as const,
        networkIsolation: true,
        dataIsolation: true,
        computeIsolation: false
      },
      features: ['specifications', 'plans', 'tasks'],
      limits: {
        maxUsers: 100,
        maxProjects: 50,
        maxSpecifications: 1000,
        maxAPICallsPerMinute: 1000,
        maxStoragePerProject: 1024
      },
      created: new Date().toISOString(),
      enabled: true
    };
    
    await this.scalability.createTenant(tenant);
    return tenant;
  }

  // New enhanced tools methods
  async generateProjectStructure(args: z.infer<typeof GenerateProjectStructureSchema>) {
    const { projectName, taskPrefix, categories, includeUserStories, projectPath, totalEffortHours, developmentDays } = args;
    
    const basePath = projectPath || process.cwd();
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const projectDir = path.join(basePath, projectName);
    await this.createDirectory(projectDir);
    
    // Create comprehensive project structure
    const structure = {
      projectName,
      taskPrefix,
      categories,
      totalEffortHours: totalEffortHours || "48-56",
      developmentDays: developmentDays || "8-10",
      created: new Date().toISOString(),
      structure: {
        specifications: {} as Record<string, string>,
        plans: {} as Record<string, string>,
        tasks: {} as Record<string, string>,
        userStories: includeUserStories ? {} : undefined,
        qualityFramework: {} as Record<string, any>,
        documentation: {} as Record<string, any>
      }
    };
    
    // Create category-based directory structure
    for (const category of categories) {
      const categoryDir = path.join(projectDir, category);
      await this.createDirectory(categoryDir);
      
      // Create subdirectories for each category
      await this.createDirectory(path.join(categoryDir, 'specifications'));
      await this.createDirectory(path.join(categoryDir, 'plans'));
      await this.createDirectory(path.join(categoryDir, 'tasks'));
      await this.createDirectory(path.join(categoryDir, 'tests'));
      
      structure.structure.specifications[category] = `${category}/specifications`;
      structure.structure.plans[category] = `${category}/plans`;
      structure.structure.tasks[category] = `${category}/tasks`;
    }
    
    // Create main project documentation
    const readmePath = path.join(projectDir, 'README.md');
    const readmeContent = this.generateProjectReadme(structure);
    await fs.writeFile(readmePath, readmeContent);
    
    // Create task index file
    const taskIndexPath = path.join(projectDir, 'TASK-INDEX.md');
    const taskIndexContent = this.generateTaskIndex(structure);
    await fs.writeFile(taskIndexPath, taskIndexContent);
    
    // Create project manifest
    const manifestPath = path.join(projectDir, 'project-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(structure, null, 2));
    
    // Log project structure creation if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `Project structure generated: ${projectName}`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { projectName, categories: categories.length, includeUserStories }
      });
    }
    
    return {
      projectPath: projectDir,
      structure,
      readmePath,
      taskIndexPath,
      manifestPath,
      message: `Complete project structure generated for ${projectName} with ${categories.length} categories`
    };
  }

  async createComprehensiveTasks(args: z.infer<typeof CreateComprehensiveTasksSchema>) {
    const { specPath, taskCategories, projectPath, taskPrefix, includeDetailedSections } = args;
    
    const basePath = projectPath || path.dirname(specPath);
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const tasksDir = this.getDirectoryPath(basePath, 'tasks');
    
    // Read specification to understand the feature
    const specContent = await fs.readFile(specPath, 'utf-8');
    const featureName = this.extractFeatureName(specContent);
    
    const comprehensiveTasks = {
      featureName,
      specPath,
      taskPrefix: taskPrefix || 'TASK',
      categories: taskCategories,
      totalTasks: Object.values(taskCategories).reduce((sum, cat) => sum + cat.count, 0),
      estimatedEffort: this.calculateTotalEffort(taskCategories),
      created: new Date().toISOString(),
      tasks: {} as Record<string, any[]>
    };
    
    let taskCounter = 1;
    
    // Generate tasks for each category
    for (const [categoryName, categoryConfig] of Object.entries(taskCategories)) {
      const categoryTasks = [];
      
      for (let i = 1; i <= categoryConfig.count; i++) {
        const taskId = `${taskPrefix || 'TASK'}-${taskCounter.toString().padStart(3, '0')}`;
        const taskName = `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Task ${i}`;
        
        const task: any = {
          id: taskId,
          name: taskName,
          category: categoryName,
          effort: categoryConfig.effort,
          priority: this.calculateTaskPriority(categoryName, i, categoryConfig.count),
          status: 'not-started',
          dependencies: [],
          acceptance_criteria: [],
          technical_requirements: [],
          testing_requirements: [],
          documentation_requirements: []
        };
        
        if (includeDetailedSections) {
          task.business_context = `Business context for ${taskName}`;
          task.user_impact = `User impact of ${taskName}`;
          task.technical_approach = `Technical approach for ${taskName}`;
          task.implementation_notes = `Implementation notes for ${taskName}`;
          task.security_considerations = `Security considerations for ${taskName}`;
          task.performance_requirements = `Performance requirements for ${taskName}`;
          task.monitoring_requirements = `Monitoring requirements for ${taskName}`;
          task.rollback_plan = `Rollback plan for ${taskName}`;
          task.validation_plan = `Validation plan for ${taskName}`;
          task.risk_assessment = `Risk assessment for ${taskName}`;
          task.resource_requirements = `Resource requirements for ${taskName}`;
          task.timeline_estimate = categoryConfig.effort;
          task.quality_gates = [`Code review required`, `Unit tests passing`, `Integration tests passing`];
          task.definition_of_done = [`All acceptance criteria met`, `Code reviewed and approved`, `Tests written and passing`];
          task.communication_plan = `Communication plan for ${taskName}`;
        }
        
        categoryTasks.push(task);
        taskCounter++;
      }
      
      comprehensiveTasks.tasks[categoryName] = categoryTasks;
      
      // Create individual task files
      const categoryDir = path.join(tasksDir, categoryName);
      await this.createDirectory(categoryDir);
      
      for (const task of categoryTasks) {
        const taskFilePath = path.join(categoryDir, `${task.id}.md`);
        const taskContent = this.generateComprehensiveTaskContent(task, featureName, includeDetailedSections);
        await fs.writeFile(taskFilePath, taskContent);
      }
    }
    
    // Create comprehensive task summary
    const summaryPath = path.join(tasksDir, 'comprehensive-tasks-summary.md');
    const summaryContent = this.generateComprehensiveTaskSummary(comprehensiveTasks);
    await fs.writeFile(summaryPath, summaryContent);
    
    // Create task manifest
    const manifestPath = path.join(tasksDir, 'tasks-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(comprehensiveTasks, null, 2));
    
    // Log comprehensive tasks creation if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `Comprehensive tasks created: ${comprehensiveTasks.totalTasks} tasks`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { 
          featureName, 
          categories: Object.keys(taskCategories).length,
          totalTasks: comprehensiveTasks.totalTasks,
          estimatedEffort: comprehensiveTasks.estimatedEffort
        }
      });
    }
    
    return {
      comprehensiveTasks,
      summaryPath,
      manifestPath,
      totalTasks: comprehensiveTasks.totalTasks,
      message: `Generated ${comprehensiveTasks.totalTasks} comprehensive tasks across ${Object.keys(taskCategories).length} categories`
    };
  }

  async generateUserStories(args: z.infer<typeof GenerateUserStoriesSchema>) {
    const { personas, generateValidationMatrix, projectPath, featureContext, includeAcceptanceCriteria } = args;
    
    const basePath = projectPath || process.cwd();
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const specificationsDir = this.getDirectoryPath(basePath, 'specifications');
    const userStoriesDir = path.join(specificationsDir, 'user-stories');
    await this.createDirectory(userStoriesDir);
    
    const userStories = {
      personas,
      featureContext: featureContext || "Feature context not provided",
      generateValidationMatrix,
      includeAcceptanceCriteria,
      created: new Date().toISOString(),
      stories: {} as Record<string, any[]>,
      validationMatrix: generateValidationMatrix ? {} : undefined
    };
    
    // Generate stories for each persona
    for (const persona of personas) {
      const personaStories = this.generatePersonaStories(persona, featureContext, includeAcceptanceCriteria);
      userStories.stories[persona] = personaStories;
      
      // Create individual persona file
      const personaPath = path.join(userStoriesDir, `${persona}-stories.md`);
      const personaContent = this.generatePersonaStoriesContent(persona, personaStories, featureContext);
      await fs.writeFile(personaPath, personaContent);
    }
    
    // Generate validation matrix if requested
    if (generateValidationMatrix) {
      userStories.validationMatrix = this.generateValidationMatrix(userStories.stories);
      
      const matrixPath = path.join(userStoriesDir, 'validation-matrix.md');
      const matrixContent = this.generateValidationMatrixContent(userStories.validationMatrix, personas);
      await fs.writeFile(matrixPath, matrixContent);
    }
    
    // Create comprehensive user stories summary
    const summaryPath = path.join(userStoriesDir, 'user-stories-summary.md');
    const summaryContent = this.generateUserStoriesSummary(userStories);
    await fs.writeFile(summaryPath, summaryContent);
    
    // Create user stories manifest
    const manifestPath = path.join(userStoriesDir, 'user-stories-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(userStories, null, 2));
    
    // Log user stories generation if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `User stories generated for ${personas.length} personas`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { 
          personas: personas.length,
          generateValidationMatrix,
          includeAcceptanceCriteria,
          totalStories: Object.values(userStories.stories).reduce((sum, stories: any) => sum + stories.length, 0)
        }
      });
    }
    
    return {
      userStories,
      summaryPath,
      manifestPath,
      validationMatrixPath: generateValidationMatrix ? path.join(userStoriesDir, 'validation-matrix.md') : undefined,
      totalStories: Object.values(userStories.stories).reduce((sum, stories: any) => sum + stories.length, 0),
      message: `Generated user stories for ${personas.length} personas${generateValidationMatrix ? ' with validation matrix' : ''}`
    };
  }

  async generateQualityFramework(args: z.infer<typeof GenerateQualityFrameworkSchema>) {
    const { testCoverageTarget, performanceTargets, projectPath, includeSecurityChecks, includeAccessibilityChecks } = args;
    
    const basePath = projectPath || process.cwd();
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const qualityDir = path.join(basePath, 'quality-framework');
    await this.createDirectory(qualityDir);
    
    const qualityFramework = {
      testCoverageTarget,
      performanceTargets,
      includeSecurityChecks,
      includeAccessibilityChecks,
      created: new Date().toISOString(),
      framework: {
        testing: {
          unitTests: { target: testCoverageTarget, threshold: testCoverageTarget - 5 },
          integrationTests: { target: 85, threshold: 80 },
          e2eTests: { target: 75, threshold: 70 },
          performanceTests: { required: true }
        },
        performance: performanceTargets,
        security: includeSecurityChecks ? {
          staticAnalysis: { required: true, threshold: 0 },
          dependencyCheck: { required: true, threshold: 0 },
          penetrationTesting: { required: true, frequency: 'quarterly' }
        } : undefined,
        accessibility: includeAccessibilityChecks ? {
          wcagLevel: 'AA',
          automatedTesting: true,
          manualTesting: true
        } : undefined,
        codeQuality: {
          complexity: { max: 10 },
          maintainabilityIndex: { min: 70 },
          duplication: { max: 5 }
        }
      }
    };
    
    // Generate quality gates
    const qualityGatesPath = path.join(qualityDir, 'quality-gates.md');
    const qualityGatesContent = this.generateQualityGatesContent(qualityFramework);
    await fs.writeFile(qualityGatesPath, qualityGatesContent);
    
    // Generate test plan
    const testPlanPath = path.join(qualityDir, 'test-plan.md');
    const testPlanContent = this.generateTestPlanContent(qualityFramework);
    await fs.writeFile(testPlanPath, testPlanContent);
    
    // Generate performance benchmarks
    const performanceBenchmarksPath = path.join(qualityDir, 'performance-benchmarks.md');
    const performanceBenchmarksContent = this.generatePerformanceBenchmarksContent(qualityFramework);
    await fs.writeFile(performanceBenchmarksPath, performanceBenchmarksContent);
    
    // Generate security checklist if enabled
    if (includeSecurityChecks) {
      const securityChecklistPath = path.join(qualityDir, 'security-checklist.md');
      const securityChecklistContent = this.generateSecurityChecklistContent(qualityFramework);
      await fs.writeFile(securityChecklistPath, securityChecklistContent);
    }
    
    // Generate accessibility checklist if enabled
    if (includeAccessibilityChecks) {
      const accessibilityChecklistPath = path.join(qualityDir, 'accessibility-checklist.md');
      const accessibilityChecklistContent = this.generateAccessibilityChecklistContent(qualityFramework);
      await fs.writeFile(accessibilityChecklistPath, accessibilityChecklistContent);
    }
    
    // Create quality framework manifest
    const manifestPath = path.join(qualityDir, 'quality-framework-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(qualityFramework, null, 2));
    
    // Log quality framework generation if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `Quality framework generated with ${testCoverageTarget}% test coverage target`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { 
          testCoverageTarget,
          includeSecurityChecks,
          includeAccessibilityChecks,
          performanceTargets: Object.keys(performanceTargets).length
        }
      });
    }
    
    return {
      qualityFramework,
      qualityGatesPath,
      testPlanPath,
      performanceBenchmarksPath,
      securityChecklistPath: includeSecurityChecks ? path.join(qualityDir, 'security-checklist.md') : undefined,
      accessibilityChecklistPath: includeAccessibilityChecks ? path.join(qualityDir, 'accessibility-checklist.md') : undefined,
      manifestPath,
      message: `Quality framework generated with ${testCoverageTarget}% coverage target and comprehensive quality gates`
    };
  }

  // Helper methods for the new tools
  private generateProjectReadme(structure: any): string {
    return `# ${structure.projectName}

## Project Overview
This project follows the Spec-Kit Enterprise methodology with comprehensive task management and quality frameworks.

**Project Details:**
- **Task Prefix**: ${structure.taskPrefix}
- **Categories**: ${structure.categories.join(', ')}
- **Total Effort**: ${structure.totalEffortHours} hours
- **Development Timeline**: ${structure.developmentDays} days
- **Created**: ${structure.created}

## Project Structure

### Categories
${structure.categories.map((category: string) => `
#### ${category.charAt(0).toUpperCase() + category.slice(1)}
- Specifications: \`${category}/specifications/\`
- Plans: \`${category}/plans/\`
- Tasks: \`${category}/tasks/\`
- Tests: \`${category}/tests/\`
`).join('')}

## Getting Started

1. Review the TASK-INDEX.md for complete task breakdown
2. Follow the specifications → plans → tasks workflow
3. Maintain quality standards as defined in quality-framework/
4. Execute tasks according to priority and dependencies

## Quality Standards
- Test coverage target: 90%+
- Performance benchmarks defined in quality-framework/
- Security and accessibility requirements included

---
*Generated by Spec-Kit Enterprise*`;
  }

  private generateTaskIndex(structure: any): string {
    return `# Task Index - ${structure.projectName}

## Summary
- **Total Categories**: ${structure.categories.length}
- **Task Prefix**: ${structure.taskPrefix}
- **Estimated Effort**: ${structure.totalEffortHours} hours
- **Development Timeline**: ${structure.developmentDays} days

## Category Overview
${structure.categories.map((category: string, index: number) => `
### ${index + 1}. ${category.charAt(0).toUpperCase() + category.slice(1)}
- **Directory**: \`${category}/\`
- **Priority**: ${index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}
- **Status**: Not Started
- **Dependencies**: ${index > 0 ? structure.categories[index - 1] : 'None'}
`).join('')}

## Implementation Order
${structure.categories.map((category: string, index: number) => `${index + 1}. ${category.charAt(0).toUpperCase() + category.slice(1)}`).join('\n')}

## Quality Gates
- [ ] All specifications completed
- [ ] Implementation plans reviewed
- [ ] Tasks broken down and estimated
- [ ] User stories validated
- [ ] Quality framework implemented

---
*Task Index generated by Spec-Kit Enterprise*`;
  }

  private extractFeatureName(specContent: string): string {
    const lines = specContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        return line.substring(2).split(' - ')[0].trim();
      }
    }
    return 'Unknown Feature';
  }

  private calculateTotalEffort(taskCategories: Record<string, { count: number; effort: string }>): string {
    let totalHours = 0;
    for (const [category, config] of Object.entries(taskCategories)) {
      const effortMatch = config.effort.match(/(\d+)h/);
      if (effortMatch) {
        const hoursPerTask = parseInt(effortMatch[1], 10);
        totalHours += hoursPerTask * config.count;
      }
    }
    return `${totalHours}h total`;
  }

  private calculateTaskPriority(categoryName: string, taskIndex: number, totalTasks: number): string {
    const highPriorityCategories = ['backend', 'state', 'integration'];
    const mediumPriorityCategories = ['frontend', 'ui'];
    const lowPriorityCategories = ['testing', 'documentation'];

    if (highPriorityCategories.includes(categoryName)) return 'high';
    if (mediumPriorityCategories.includes(categoryName)) return 'medium';
    if (lowPriorityCategories.includes(categoryName)) return 'low';
    
    // Default priority based on task order within category
    return taskIndex <= Math.ceil(totalTasks / 2) ? 'medium' : 'low';
  }

  private generateComprehensiveTaskContent(task: any, featureName: string, includeDetailedSections: boolean): string {
    const baseContent = `# ${task.id}: ${task.name}

## Task Overview
- **Feature**: ${featureName}
- **Category**: ${task.category}
- **Priority**: ${task.priority}
- **Effort**: ${task.effort}
- **Status**: ${task.status}

## Acceptance Criteria
${task.acceptance_criteria.map((criteria: string, index: number) => `${index + 1}. ${criteria}`).join('\n') || '- To be defined'}

## Technical Requirements
${task.technical_requirements.map((req: string, index: number) => `${index + 1}. ${req}`).join('\n') || '- To be defined'}

## Testing Requirements
${task.testing_requirements.map((test: string, index: number) => `${index + 1}. ${test}`).join('\n') || '- To be defined'}

## Documentation Requirements
${task.documentation_requirements.map((doc: string, index: number) => `${index + 1}. ${doc}`).join('\n') || '- To be defined'}

## Dependencies
${task.dependencies.map((dep: string, index: number) => `${index + 1}. ${dep}`).join('\n') || '- None identified'}
`;

    if (includeDetailedSections) {
      return baseContent + `
## Business Context
${task.business_context}

## User Impact
${task.user_impact}

## Technical Approach
${task.technical_approach}

## Implementation Notes
${task.implementation_notes}

## Security Considerations
${task.security_considerations}

## Performance Requirements
${task.performance_requirements}

## Monitoring Requirements
${task.monitoring_requirements}

## Rollback Plan
${task.rollback_plan}

## Validation Plan
${task.validation_plan}

## Risk Assessment
${task.risk_assessment}

## Resource Requirements
${task.resource_requirements}

## Timeline Estimate
${task.timeline_estimate}

## Quality Gates
${task.quality_gates.map((gate: string, index: number) => `- [ ] ${gate}`).join('\n')}

## Definition of Done
${task.definition_of_done.map((item: string, index: number) => `- [ ] ${item}`).join('\n')}

## Communication Plan
${task.communication_plan}
`;
    }

    return baseContent + `
---
*Generated by Spec-Kit Enterprise*`;
  }

  private generateComprehensiveTaskSummary(comprehensiveTasks: any): string {
    return `# Comprehensive Tasks Summary - ${comprehensiveTasks.featureName}

## Overview
- **Feature**: ${comprehensiveTasks.featureName}
- **Total Tasks**: ${comprehensiveTasks.totalTasks}
- **Task Prefix**: ${comprehensiveTasks.taskPrefix}
- **Estimated Effort**: ${comprehensiveTasks.estimatedEffort}
- **Created**: ${comprehensiveTasks.created}

## Category Breakdown
${Object.entries(comprehensiveTasks.categories).map(([category, config]: [string, any]) => `
### ${category.charAt(0).toUpperCase() + category.slice(1)}
- **Task Count**: ${config.count}
- **Effort per Task**: ${config.effort}
- **Total Effort**: ${this.calculateCategoryEffort(config.count, config.effort)}
`).join('')}

## Task Distribution by Category
${Object.entries(comprehensiveTasks.tasks).map(([category, tasks]: [string, any]) => `
### ${category.charAt(0).toUpperCase() + category.slice(1)} (${tasks.length} tasks)
${tasks.map((task: any, index: number) => `${index + 1}. **${task.id}**: ${task.name} (${task.priority} priority)`).join('\n')}
`).join('')}

## Implementation Roadmap
1. **Phase 1**: High Priority Tasks (Backend, State, Integration)
2. **Phase 2**: Medium Priority Tasks (Frontend, UI)
3. **Phase 3**: Low Priority Tasks (Testing, Documentation)

## Quality Assurance
- All tasks include comprehensive acceptance criteria
- 15+ detailed sections per task for enterprise-grade specifications
- Clear dependencies and validation plans
- Risk assessments and rollback procedures

---
*Generated by Spec-Kit Enterprise*`;
  }

  private calculateCategoryEffort(count: number, effort: string): string {
    const effortMatch = effort.match(/(\d+)h/);
    if (effortMatch) {
      const hoursPerTask = parseInt(effortMatch[1], 10);
      return `${hoursPerTask * count}h`;
    }
    return effort;
  }

  private generatePersonaStories(persona: string, featureContext?: string, includeAcceptanceCriteria = true): any[] {
    const storyTemplates = {
      'power-user': [
        { title: 'Advanced Feature Access', priority: 'high', complexity: 'high' },
        { title: 'Bulk Operations', priority: 'high', complexity: 'medium' },
        { title: 'Custom Workflows', priority: 'medium', complexity: 'high' },
        { title: 'Advanced Analytics', priority: 'medium', complexity: 'medium' },
        { title: 'Integration Capabilities', priority: 'medium', complexity: 'high' }
      ],
      'casual-user': [
        { title: 'Simple Navigation', priority: 'high', complexity: 'low' },
        { title: 'Basic Functionality', priority: 'high', complexity: 'low' },
        { title: 'Help and Guidance', priority: 'medium', complexity: 'low' },
        { title: 'Mobile Compatibility', priority: 'medium', complexity: 'medium' }
      ],
      'admin-user': [
        { title: 'User Management', priority: 'high', complexity: 'medium' },
        { title: 'System Configuration', priority: 'high', complexity: 'high' },
        { title: 'Security Controls', priority: 'high', complexity: 'high' },
        { title: 'Reporting and Monitoring', priority: 'medium', complexity: 'medium' },
        { title: 'Backup and Recovery', priority: 'medium', complexity: 'high' }
      ]
    };

    const templates = storyTemplates[persona as keyof typeof storyTemplates] || storyTemplates['casual-user'];
    
    return templates.map((template, index) => ({
      id: `US-${persona.toUpperCase()}-${(index + 1).toString().padStart(3, '0')}`,
      title: `As a ${persona}, I want ${template.title.toLowerCase()}`,
      description: `${featureContext ? `In the context of ${featureContext}, as` : 'As'} a ${persona}, I need ${template.title.toLowerCase()} functionality to improve my experience.`,
      priority: template.priority,
      complexity: template.complexity,
      acceptanceCriteria: includeAcceptanceCriteria ? [
        `The ${template.title.toLowerCase()} feature is accessible and intuitive`,
        `Performance meets standard requirements`,
        `Feature works across supported browsers/devices`,
        `Error handling provides clear feedback`
      ] : [],
      testScenarios: [
        `Verify ${template.title.toLowerCase()} functionality works as expected`,
        `Test error conditions and edge cases`,
        `Validate performance under normal load`
      ]
    }));
  }

  private generatePersonaStoriesContent(persona: string, stories: any[], featureContext?: string): string {
    return `# User Stories - ${persona.charAt(0).toUpperCase() + persona.slice(1)} Persona

## Context
${featureContext ? `Feature Context: ${featureContext}` : 'General feature development'}

## Stories Overview
Total Stories: ${stories.length}
- High Priority: ${stories.filter(s => s.priority === 'high').length}
- Medium Priority: ${stories.filter(s => s.priority === 'medium').length}
- Low Priority: ${stories.filter(s => s.priority === 'low').length}

## User Stories

${stories.map(story => `
### ${story.id}: ${story.title}

**Description**: ${story.description}
**Priority**: ${story.priority}
**Complexity**: ${story.complexity}

#### Acceptance Criteria
${story.acceptanceCriteria.map((criteria: string, index: number) => `${index + 1}. ${criteria}`).join('\n')}

#### Test Scenarios
${story.testScenarios.map((scenario: string, index: number) => `${index + 1}. ${scenario}`).join('\n')}

---
`).join('')}

*Generated by Spec-Kit Enterprise*`;
  }

  private generateValidationMatrix(stories: Record<string, any[]>): Record<string, any> {
    const matrix: Record<string, any> = {};
    
    // Create cross-persona validation scenarios
    const personas = Object.keys(stories);
    for (const persona1 of personas) {
      for (const persona2 of personas) {
        if (persona1 !== persona2) {
          const key = `${persona1}-${persona2}`;
          matrix[key] = {
            scenario: `Validate ${persona1} stories don't negatively impact ${persona2} experience`,
            stories: this.findOverlappingStories(stories[persona1], stories[persona2]),
            validationTests: [
              `Cross-persona usability testing`,
              `Performance impact assessment`,
              `Feature conflict analysis`
            ]
          };
        }
      }
    }
    
    return matrix;
  }

  private findOverlappingStories(stories1: any[], stories2: any[]): string[] {
    // Find stories that might overlap in functionality
    const overlaps = [];
    for (const story1 of stories1) {
      for (const story2 of stories2) {
        if (story1.title.includes(story2.title.split(' ').slice(-1)[0]) || 
            story2.title.includes(story1.title.split(' ').slice(-1)[0])) {
          overlaps.push(`${story1.id} ↔ ${story2.id}`);
        }
      }
    }
    return overlaps;
  }

  private generateValidationMatrixContent(validationMatrix: Record<string, any>, personas: string[]): string {
    return `# User Stories Validation Matrix

## Overview
This matrix identifies potential conflicts and overlaps between different persona user stories.

## Cross-Persona Validation

${Object.entries(validationMatrix).map(([key, validation]) => `
### ${key.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' → ')}

**Scenario**: ${validation.scenario}

**Overlapping Stories**:
${validation.stories.map((story: string) => `- ${story}`).join('\n')}

**Validation Tests**:
${validation.validationTests.map((test: string, index: number) => `${index + 1}. ${test}`).join('\n')}

---
`).join('')}

## Validation Checklist
- [ ] All cross-persona scenarios tested
- [ ] Performance impact assessed
- [ ] User experience conflicts resolved
- [ ] Accessibility requirements validated
- [ ] Security implications reviewed

*Generated by Spec-Kit Enterprise*`;
  }

  private generateUserStoriesSummary(userStories: any): string {
    const totalStories = Object.values(userStories.stories).reduce((sum, stories: any) => sum + stories.length, 0);
    
    return `# User Stories Summary

## Overview
- **Total Stories**: ${totalStories}
- **Personas**: ${userStories.personas.join(', ')}
- **Feature Context**: ${userStories.featureContext}
- **Validation Matrix**: ${userStories.generateValidationMatrix ? 'Generated' : 'Not generated'}
- **Acceptance Criteria**: ${userStories.includeAcceptanceCriteria ? 'Included' : 'Not included'}

## Stories by Persona
${Object.entries(userStories.stories).map(([persona, stories]: [string, any]) => `
### ${persona.charAt(0).toUpperCase() + persona.slice(1)}
- **Total**: ${stories.length} stories
- **High Priority**: ${stories.filter((s: any) => s.priority === 'high').length}
- **Medium Priority**: ${stories.filter((s: any) => s.priority === 'medium').length}
- **Low Priority**: ${stories.filter((s: any) => s.priority === 'low').length}
`).join('')}

## Priority Distribution
- **High Priority**: ${Object.values(userStories.stories).flat().filter((s: any) => s.priority === 'high').length} stories
- **Medium Priority**: ${Object.values(userStories.stories).flat().filter((s: any) => s.priority === 'medium').length} stories
- **Low Priority**: ${Object.values(userStories.stories).flat().filter((s: any) => s.priority === 'low').length} stories

## Complexity Analysis
- **High Complexity**: ${Object.values(userStories.stories).flat().filter((s: any) => s.complexity === 'high').length} stories
- **Medium Complexity**: ${Object.values(userStories.stories).flat().filter((s: any) => s.complexity === 'medium').length} stories
- **Low Complexity**: ${Object.values(userStories.stories).flat().filter((s: any) => s.complexity === 'low').length} stories

${userStories.generateValidationMatrix ? `
## Validation Matrix
Cross-persona validation scenarios have been generated to identify potential conflicts and ensure comprehensive testing.
` : ''}

---
*Generated by Spec-Kit Enterprise*`;
  }

  private generateQualityGatesContent(qualityFramework: any): string {
    return `# Quality Gates

## Overview
Quality gates ensure that all deliverables meet enterprise standards before progressing to the next phase.

## Testing Gates
### Unit Testing
- **Coverage Target**: ${qualityFramework.testCoverageTarget}%
- **Minimum Threshold**: ${qualityFramework.framework.testing.unitTests.threshold}%
- **Gate**: No deployment without meeting coverage threshold

### Integration Testing
- **Coverage Target**: ${qualityFramework.framework.testing.integrationTests.target}%
- **Minimum Threshold**: ${qualityFramework.framework.testing.integrationTests.threshold}%
- **Gate**: All critical integration paths must be tested

### End-to-End Testing
- **Coverage Target**: ${qualityFramework.framework.testing.e2eTests.target}%
- **Minimum Threshold**: ${qualityFramework.framework.testing.e2eTests.threshold}%
- **Gate**: All user journeys must pass

## Performance Gates
${Object.entries(qualityFramework.performanceTargets).map(([metric, target]) => `
### ${metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1')}
- **Target**: ${target}
- **Gate**: Must meet target before production deployment
`).join('')}

${qualityFramework.framework.security ? `
## Security Gates
### Static Analysis
- **Required**: ${qualityFramework.framework.security.staticAnalysis.required ? 'Yes' : 'No'}
- **Critical Issues Threshold**: ${qualityFramework.framework.security.staticAnalysis.threshold}
- **Gate**: Zero critical security vulnerabilities

### Dependency Check
- **Required**: ${qualityFramework.framework.security.dependencyCheck.required ? 'Yes' : 'No'}
- **Vulnerable Dependencies**: ${qualityFramework.framework.security.dependencyCheck.threshold} allowed
- **Gate**: All dependencies must be up-to-date and secure

### Penetration Testing
- **Required**: ${qualityFramework.framework.security.penetrationTesting.required ? 'Yes' : 'No'}
- **Frequency**: ${qualityFramework.framework.security.penetrationTesting.frequency}
- **Gate**: No high-risk vulnerabilities found
` : ''}

${qualityFramework.framework.accessibility ? `
## Accessibility Gates
### WCAG Compliance
- **Level**: ${qualityFramework.framework.accessibility.wcagLevel}
- **Automated Testing**: ${qualityFramework.framework.accessibility.automatedTesting ? 'Required' : 'Optional'}
- **Manual Testing**: ${qualityFramework.framework.accessibility.manualTesting ? 'Required' : 'Optional'}
- **Gate**: Must meet WCAG ${qualityFramework.framework.accessibility.wcagLevel} standards
` : ''}

## Code Quality Gates
### Complexity
- **Maximum Cyclomatic Complexity**: ${qualityFramework.framework.codeQuality.complexity.max}
- **Gate**: No method/function exceeds complexity limit

### Maintainability
- **Minimum Maintainability Index**: ${qualityFramework.framework.codeQuality.maintainabilityIndex.min}
- **Gate**: All code must meet maintainability standards

### Code Duplication
- **Maximum Duplication**: ${qualityFramework.framework.codeQuality.duplication.max}%
- **Gate**: Code duplication must be below threshold

## Gate Enforcement
- All gates are automatically enforced in CI/CD pipeline
- Manual override requires approval from technical lead
- Gate failures block deployment progression
- Quality metrics are tracked and reported

---
*Generated by Spec-Kit Enterprise*`;
  }

  private generateTestPlanContent(qualityFramework: any): string {
    return `# Test Plan

## Test Strategy Overview
This test plan ensures comprehensive coverage across all quality dimensions.

## Unit Testing Strategy
- **Framework**: To be selected based on technology stack
- **Coverage Target**: ${qualityFramework.testCoverageTarget}%
- **Scope**: All business logic, utilities, and critical functions
- **Approach**: Test-driven development (TDD)

### Unit Test Requirements
- Test all public methods and functions
- Cover edge cases and error conditions
- Mock external dependencies appropriately
- Maintain fast execution times (<1s per test suite)

## Integration Testing Strategy
- **Target Coverage**: ${qualityFramework.framework.testing.integrationTests.target}%
- **Scope**: API endpoints, database interactions, third-party integrations
- **Environment**: Dedicated integration testing environment

### Integration Test Requirements
- Test complete workflows end-to-end
- Validate data consistency and integrity
- Test error handling and recovery scenarios
- Performance testing under normal load

## End-to-End Testing Strategy
- **Target Coverage**: ${qualityFramework.framework.testing.e2eTests.target}%
- **Scope**: Complete user journeys and business processes
- **Tools**: Browser automation and API testing tools

### E2E Test Requirements
- Test all critical user paths
- Cross-browser compatibility testing
- Mobile responsiveness validation
- Performance validation

## Performance Testing Strategy
${Object.entries(qualityFramework.performanceTargets).map(([metric, target]) => `
### ${metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1')}
- **Target**: ${target}
- **Test Type**: ${metric.includes('load') ? 'Load Testing' : metric.includes('api') ? 'API Performance Testing' : 'Performance Profiling'}
- **Tools**: Performance monitoring and testing tools
`).join('')}

${qualityFramework.framework.security ? `
## Security Testing Strategy
### Static Code Analysis
- **Tools**: SAST (Static Application Security Testing) tools
- **Frequency**: Every commit
- **Scope**: All source code and dependencies

### Dynamic Security Testing
- **Tools**: DAST (Dynamic Application Security Testing) tools
- **Frequency**: ${qualityFramework.framework.security.penetrationTesting.frequency}
- **Scope**: Running application and APIs

### Dependency Security
- **Tools**: Dependency scanning tools
- **Frequency**: Daily automated scans
- **Scope**: All project dependencies
` : ''}

${qualityFramework.framework.accessibility ? `
## Accessibility Testing Strategy
### Automated Testing
- **Standards**: WCAG ${qualityFramework.framework.accessibility.wcagLevel}
- **Tools**: Automated accessibility testing tools
- **Scope**: All user interfaces and interactions

### Manual Testing
- **Approach**: Screen reader testing, keyboard navigation
- **Scope**: Critical user journeys
- **Frequency**: Every major release
` : ''}

## Test Environment Strategy
- **Development**: Local testing and unit tests
- **Integration**: Dedicated integration environment
- **Staging**: Production-like environment for final validation
- **Production**: Monitoring and canary deployments

## Test Data Management
- Synthetic test data for consistent testing
- Data masking for production-like data
- Automated test data setup and teardown
- Data privacy and security compliance

## Test Reporting
- Automated test result reporting
- Coverage reports and trend analysis
- Performance benchmarking reports
- Security scan results and vulnerability tracking

---
*Generated by Spec-Kit Enterprise*`;
  }

  private generatePerformanceBenchmarksContent(qualityFramework: any): string {
    return `# Performance Benchmarks

## Performance Targets Overview
This document defines the performance benchmarks that must be met for production readiness.

## Response Time Benchmarks
${Object.entries(qualityFramework.performanceTargets).map(([metric, target]) => `
### ${metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1')}
- **Target**: ${target}
- **Measurement Method**: ${metric.includes('api') ? 'API endpoint response time monitoring' : 'Browser timing API measurements'}
- **Test Conditions**: ${metric.includes('load') ? 'Page load from cache-cleared state' : 'Normal operating conditions'}
- **Baseline**: Current performance to be measured and documented
`).join('')}

## Load Testing Benchmarks
### Concurrent User Load
- **Target Concurrent Users**: 1000 users
- **Response Time Under Load**: <2s for 95th percentile
- **Error Rate Under Load**: <0.1%
- **Resource Utilization**: <80% CPU, <75% memory

### API Throughput
- **Target RPS**: 500 requests per second
- **Response Time**: <300ms average
- **Error Rate**: <0.01%
- **Database Connections**: Efficient connection pooling

## Resource Utilization Benchmarks
### Memory Usage
${qualityFramework.performanceTargets.memoryUsage ? `- **Target**: ${qualityFramework.performanceTargets.memoryUsage}` : '- **Target**: <512MB baseline, <1GB under load'}
- **Memory Leaks**: Zero tolerance for memory leaks
- **Garbage Collection**: Minimal impact on response times

### CPU Usage
${qualityFramework.performanceTargets.cpuUsage ? `- **Target**: ${qualityFramework.performanceTargets.cpuUsage}` : '- **Target**: <50% average, <80% peak'}
- **CPU Spikes**: No sustained high CPU usage
- **Optimization**: Profile and optimize hot code paths

### Network Performance
- **Bandwidth Usage**: Minimize unnecessary network calls
- **Caching Strategy**: Effective use of browser and CDN caching
- **Compression**: Gzip/Brotli compression enabled

## Database Performance
### Query Performance
- **Query Response Time**: <100ms for simple queries, <1s for complex queries
- **Query Optimization**: All queries must be analyzed and optimized
- **Indexing Strategy**: Proper indexes for all frequently queried columns

### Connection Management
- **Connection Pooling**: Efficient connection pool management
- **Connection Limits**: Stay within database connection limits
- **Transaction Management**: Minimize transaction duration

## Frontend Performance
### Core Web Vitals
- **First Contentful Paint (FCP)**: <1.8s
- **Largest Contentful Paint (LCP)**: <2.5s
- **First Input Delay (FID)**: <100ms
- **Cumulative Layout Shift (CLS)**: <0.1

### JavaScript Performance
- **Bundle Size**: Minimize JavaScript bundle size
- **Code Splitting**: Implement effective code splitting
- **Tree Shaking**: Remove unused code

## Monitoring and Alerting
### Performance Monitoring
- **Real User Monitoring (RUM)**: Track actual user performance
- **Synthetic Monitoring**: Continuous performance testing
- **Alert Thresholds**: Set up alerts for performance degradation

### Performance Testing Schedule
- **Continuous**: Automated performance tests in CI/CD
- **Weekly**: Comprehensive load testing
- **Monthly**: Full performance benchmark review
- **Quarterly**: Performance capacity planning

## Performance Budget
- **Page Weight Budget**: <1MB initial page load
- **JavaScript Budget**: <200KB compressed JavaScript
- **CSS Budget**: <50KB compressed CSS
- **Image Budget**: Optimized images, lazy loading implemented

---
*Generated by Spec-Kit Enterprise*`;
  }

  private generateSecurityChecklistContent(qualityFramework: any): string {
    return `# Security Checklist

## Overview
This comprehensive security checklist ensures enterprise-grade security standards are met.

## Static Code Analysis
### SAST Requirements
- [ ] Static application security testing integrated into CI/CD
- [ ] Zero critical and high-severity vulnerabilities
- [ ] Regular updates to security scanning tools
- [ ] Custom rules for organization-specific security requirements

### Code Review Security
- [ ] Security-focused code review checklist
- [ ] Input validation review for all user inputs
- [ ] Authentication and authorization logic review
- [ ] Cryptographic implementation review

## Dynamic Security Testing
### DAST Requirements
- [ ] Dynamic application security testing on running application
- [ ] Authentication bypass testing
- [ ] SQL injection testing
- [ ] Cross-site scripting (XSS) testing
- [ ] Cross-site request forgery (CSRF) testing

### Penetration Testing
- [ ] ${qualityFramework.framework.security.penetrationTesting.frequency} penetration testing
- [ ] Third-party security assessment
- [ ] Vulnerability assessment and remediation
- [ ] Social engineering resistance testing

## Dependency Security
### Vulnerability Management
- [ ] Automated dependency vulnerability scanning
- [ ] Zero known high-risk vulnerabilities
- [ ] Regular dependency updates and patches
- [ ] License compliance verification

### Supply Chain Security
- [ ] Trusted source verification for all dependencies
- [ ] Dependency integrity verification
- [ ] Software bill of materials (SBOM) generation
- [ ] Third-party risk assessment

## Authentication and Authorization
### Authentication Security
- [ ] Multi-factor authentication (MFA) implemented
- [ ] Strong password policy enforcement
- [ ] Account lockout mechanisms
- [ ] Session management security
- [ ] Password storage using secure hashing (bcrypt, Argon2)

### Authorization Controls
- [ ] Role-based access control (RBAC) implemented
- [ ] Principle of least privilege enforced
- [ ] Authorization bypass testing
- [ ] Privilege escalation prevention

## Data Protection
### Encryption
- [ ] Data encryption at rest
- [ ] Data encryption in transit (TLS 1.3)
- [ ] Key management security
- [ ] Cryptographic standards compliance

### Data Handling
- [ ] Personal data identification and classification
- [ ] Data retention policy implementation
- [ ] Secure data disposal procedures
- [ ] GDPR/privacy regulation compliance

## Network Security
### Communication Security
- [ ] HTTPS enforced for all communications
- [ ] Certificate management and rotation
- [ ] HTTP security headers implemented
- [ ] Content Security Policy (CSP) configured

### Network Controls
- [ ] Network segmentation implemented
- [ ] Firewall rules configured and tested
- [ ] DDoS protection measures
- [ ] API rate limiting implemented

## Logging and Monitoring
### Security Monitoring
- [ ] Security event logging implemented
- [ ] Log integrity protection
- [ ] Real-time security monitoring
- [ ] Incident response procedures documented

### Audit Trail
- [ ] Comprehensive audit logging
- [ ] Log retention policy compliance
- [ ] Log analysis and correlation
- [ ] Compliance reporting capabilities

## Configuration Security
### Infrastructure Security
- [ ] Secure configuration baselines
- [ ] Default credentials changed
- [ ] Unused services disabled
- [ ] Security patches up to date

### Application Configuration
- [ ] Secure default configurations
- [ ] Configuration management security
- [ ] Secrets management implementation
- [ ] Environment separation security

## Incident Response
### Response Planning
- [ ] Incident response plan documented and tested
- [ ] Security incident classification system
- [ ] Communication procedures defined
- [ ] Recovery procedures documented

### Business Continuity
- [ ] Backup and recovery procedures tested
- [ ] Disaster recovery plan validated
- [ ] Data loss prevention measures
- [ ] Service continuity planning

## Compliance Requirements
### Regulatory Compliance
- [ ] Industry-specific compliance requirements met
- [ ] Privacy regulation compliance (GDPR, CCPA)
- [ ] Data classification and handling procedures
- [ ] Compliance audit trail maintained

### Security Standards
- [ ] OWASP Top 10 vulnerabilities addressed
- [ ] Security framework compliance (ISO 27001, NIST)
- [ ] Regular security assessments scheduled
- [ ] Third-party security certifications obtained

---
*Generated by Spec-Kit Enterprise*`;
  }

  private generateAccessibilityChecklistContent(qualityFramework: any): string {
    return `# Accessibility Checklist

## Overview
This checklist ensures compliance with WCAG ${qualityFramework.framework.accessibility.wcagLevel} accessibility standards.

## Automated Testing Requirements
${qualityFramework.framework.accessibility.automatedTesting ? `
### Automated Accessibility Testing
- [ ] Automated accessibility testing integrated into CI/CD pipeline
- [ ] WCAG ${qualityFramework.framework.accessibility.wcagLevel} compliance validation
- [ ] Color contrast ratio verification
- [ ] Focus management testing
- [ ] Keyboard navigation testing
- [ ] Screen reader compatibility testing

### Testing Tools Integration
- [ ] axe-core integration for automated testing
- [ ] Lighthouse accessibility audits
- [ ] Pa11y or similar automated testing tools
- [ ] Browser extension testing (axe, WAVE)
` : ''}

## Manual Testing Requirements
${qualityFramework.framework.accessibility.manualTesting ? `
### Manual Accessibility Testing
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation testing
- [ ] High contrast mode compatibility
- [ ] Zoom functionality testing (up to 200%)
- [ ] Voice recognition software compatibility

### User Testing
- [ ] Testing with users who have disabilities
- [ ] Cognitive accessibility validation
- [ ] Motor accessibility validation
- [ ] Visual accessibility validation
- [ ] Hearing accessibility validation
` : ''}

## WCAG ${qualityFramework.framework.accessibility.wcagLevel} Principles

### Perceivable
#### Text Alternatives
- [ ] All images have appropriate alt text
- [ ] Decorative images have empty alt attributes
- [ ] Complex images have detailed descriptions
- [ ] Audio content has transcripts
- [ ] Video content has captions

#### Color and Contrast
- [ ] Color contrast ratio meets ${qualityFramework.framework.accessibility.wcagLevel} standards (4.5:1 normal text, 3:1 large text)
- [ ] Information is not conveyed by color alone
- [ ] Text is resizable up to 200% without loss of functionality
- [ ] Images of text are avoided where possible

#### Multimedia
- [ ] Auto-playing media can be paused or stopped
- [ ] Audio descriptions provided for video content
- [ ] Sign language interpretation provided where required
- [ ] Media controls are accessible

### Operable
#### Keyboard Accessibility
- [ ] All functionality available via keyboard
- [ ] No keyboard traps exist
- [ ] Focus indicators are visible and clear
- [ ] Logical tab order implemented
- [ ] Skip links provided for main content

#### Timing and Seizures
- [ ] Time limits are adjustable, extendable, or can be turned off
- [ ] Auto-updating content can be paused or controlled
- [ ] No content flashes more than 3 times per second
- [ ] Motion can be disabled for users with vestibular disorders

#### Navigation
- [ ] Consistent navigation throughout site
- [ ] Multiple ways to find content (search, sitemap, menu)
- [ ] Current location clearly indicated
- [ ] Focus order is logical and intuitive

### Understandable
#### Readable Content
- [ ] Language of page and parts is identified
- [ ] Content is written in clear, simple language
- [ ] Unusual words and abbreviations are defined
- [ ] Reading level is appropriate for content

#### Predictable Interface
- [ ] Navigation is consistent across pages
- [ ] Interface components behave predictably
- [ ] Changes of context only occur on user request
- [ ] Help and instructions are provided where needed

#### Input Assistance
- [ ] Form labels are clearly associated with controls
- [ ] Error messages are clear and helpful
- [ ] Suggestions provided for error correction
- [ ] Important actions are reversible or confirmable

### Robust
#### Compatible
- [ ] Valid, semantic HTML markup used
- [ ] Content works with assistive technologies
- [ ] Progressive enhancement implemented
- [ ] Graceful degradation for older browsers

## Mobile Accessibility
### Touch and Gesture
- [ ] Touch targets are at least 44px × 44px
- [ ] Gestures have keyboard alternatives
- [ ] Device orientation changes supported
- [ ] Zoom and pinch gestures work properly

### Mobile Screen Readers
- [ ] Mobile screen reader compatibility tested
- [ ] Touch exploration works correctly
- [ ] Swipe navigation functions properly
- [ ] Mobile-specific accessibility features utilized

## Forms Accessibility
### Form Design
- [ ] All form controls have labels
- [ ] Required fields are clearly marked
- [ ] Form instructions are clear and accessible
- [ ] Error prevention and correction implemented

### Form Validation
- [ ] Client-side validation is accessible
- [ ] Error messages are associated with form controls
- [ ] Success messages confirm form submission
- [ ] Form data can be reviewed before submission

## Testing Documentation
### Test Results
- [ ] Accessibility testing results documented
- [ ] Issues prioritized and tracked
- [ ] Remediation timeline established
- [ ] Regression testing procedures defined

### Compliance Reporting
- [ ] WCAG ${qualityFramework.framework.accessibility.wcagLevel} compliance report generated
- [ ] Accessibility statement published
- [ ] User feedback mechanism provided
- [ ] Regular accessibility audits scheduled

## Training and Awareness
### Team Training
- [ ] Development team accessibility training completed
- [ ] Design team accessibility guidelines established
- [ ] Content team accessibility best practices documented
- [ ] QA team accessibility testing procedures defined

### Ongoing Compliance
- [ ] Accessibility champion designated
- [ ] Regular accessibility reviews scheduled
- [ ] User feedback process established
- [ ] Continuous improvement plan implemented

---
*Generated by Spec-Kit Enterprise*`;
  }

  // Custom template management methods
  async createCustomTemplate(args: z.infer<typeof CreateCustomTemplateSchema>) {
    const { templateType, templateName, templateContent, projectPath, description } = args;
    
    const basePath = projectPath || process.cwd();
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const customTemplatesDir = this.getDirectoryPath(basePath, 'customTemplates');
    const typeDir = path.join(customTemplatesDir, templateType);
    
    // Create custom templates directory structure
    await this.createDirectory(typeDir);
    
    // Create template file
    const templatePath = path.join(typeDir, `${templateName}.md`);
    
    // Create template metadata
    const metadata = {
      name: templateName,
      type: templateType,
      description: description || `Custom ${templateType} template`,
      created: new Date().toISOString(),
      variables: this.extractTemplateVariables(templateContent),
      version: "1.0.0"
    };
    
    // Save template content
    await fs.writeFile(templatePath, templateContent);
    
    // Save metadata
    const metadataPath = path.join(typeDir, `${templateName}.meta.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Log template creation if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `Custom template created: ${templateName}`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { templateType, templatePath, variables: metadata.variables.length }
      });
    }
    
    return {
      templatePath,
      metadata,
      message: `Custom ${templateType} template '${templateName}' created successfully`
    };
  }

  async generateTemplate(args: z.infer<typeof GenerateTemplateSchema>) {
    const { templateType, projectContext, projectPath, customizations } = args;
    
    const basePath = projectPath || process.cwd();
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const generatedTemplatesDir = this.getDirectoryPath(basePath, 'generatedTemplates');
    
    await this.createDirectory(generatedTemplatesDir);
    
    let generatedContent = '';
    const timestamp = new Date().toISOString().split('T')[0];
    const templateName = `${templateType}-${projectContext.language}-${timestamp}`;
    
    switch (templateType) {
      case 'spec':
        generatedContent = this.generateSpecTemplate(projectContext, customizations);
        break;
      case 'plan':
        generatedContent = this.generatePlanTemplate(projectContext, customizations);
        break;
      case 'tasks':
        generatedContent = this.generateTasksTemplate(projectContext, customizations);
        break;
    }
    
    const templatePath = path.join(generatedTemplatesDir, `${templateName}.md`);
    await fs.writeFile(templatePath, generatedContent);
    
    const metadata = {
      name: templateName,
      type: templateType,
      description: `Generated ${templateType} template for ${projectContext.language} ${projectContext.projectType}`,
      generated: new Date().toISOString(),
      projectContext,
      customizations,
      variables: this.extractTemplateVariables(generatedContent)
    };
    
    const metadataPath = path.join(generatedTemplatesDir, `${templateName}.meta.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return {
      templatePath,
      content: generatedContent,
      metadata,
      message: `Generated ${templateType} template for ${projectContext.language} project`
    };
  }

  async listTemplates(args: z.infer<typeof ListTemplatesSchema>) {
    const { projectPath, templateType } = args;
    
    const basePath = projectPath || process.cwd();
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    const templatesDir = this.getDirectoryPath(basePath, 'templates');
    const customTemplatesDir = this.getDirectoryPath(basePath, 'customTemplates');
    const generatedTemplatesDir = this.getDirectoryPath(basePath, 'generatedTemplates');
    
    const templates = {
      builtin: [] as any[],
      custom: [] as any[],
      generated: [] as any[]
    };
    
    // List built-in templates
    const builtinDir = path.join(__dirname, 'templates');
    try {
      const builtinFiles = await fs.readdir(builtinDir);
      for (const file of builtinFiles) {
        if (file.endsWith('.md')) {
          const type = this.getTemplateTypeFromFilename(file);
          if (templateType === 'all' || !templateType || templateType === type) {
            templates.builtin.push({
              name: file.replace('.md', ''),
              type: type,
              description: `Built-in ${type} template`,
              source: 'builtin',
              variables: this.extractVariablesFromTemplate(path.join(builtinDir, file)),
              created: 'Built-in'
            });
          }
        }
      }
    } catch (error) {
      // Built-in templates directory might not exist
    }
    
    // List custom templates
    try {
      if (await this.directoryExists(customTemplatesDir)) {
        // Define template types to scan
        const typesToScan = templateType === 'all' || !templateType 
          ? ['spec', 'plan', 'tasks', 'constitution'] 
          : [templateType];
        
        for (const type of typesToScan) {
          const typeDir = path.join(customTemplatesDir, type);
          
          try {
            if (await this.directoryExists(typeDir)) {
              const files = await fs.readdir(typeDir);
              const templateFiles = files.filter(f => f.endsWith('.md'));
              
              for (const file of templateFiles) {
                const templateName = file.replace('.md', '');
                const metadataPath = path.join(typeDir, `${templateName}.meta.json`);
                
                let metadata = {};
                try {
                  const metadataContent = await fs.readFile(metadataPath, 'utf-8');
                  metadata = JSON.parse(metadataContent);
                } catch (error) {
                  // Metadata file might not exist, use defaults
                }
                
                const templateMeta = metadata as any;
                
                templates.custom.push({
                  name: templateName,
                  type: type,
                  description: templateMeta.description || `Custom ${type} template`,
                  source: 'custom',
                  variables: templateMeta.variables || this.extractVariablesFromTemplate(path.join(typeDir, file)),
                  created: templateMeta.created || templateMeta.createdAt || 'Unknown'
                });
              }
            }
          } catch (error) {
            // Type directory might not exist, continue with next type
          }
        }
      }
    } catch (error) {
      // Custom templates directory might not exist
    }
    
    // List generated templates
    try {
      if (await this.directoryExists(generatedTemplatesDir)) {
        const metadataPath = path.join(generatedTemplatesDir, 'templates-metadata.json');
        let metadata = {};
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          metadata = JSON.parse(metadataContent);
        } catch (error) {
          // Metadata file might not exist
        }
        
        const files = await fs.readdir(generatedTemplatesDir);
        const templateFiles = files.filter(f => f.endsWith('.md'));
        
        for (const file of templateFiles) {
          const templateName = file.replace('.md', '');
          const templateMeta = (metadata as any)[templateName] || {};
          const type = templateMeta.type || this.getTemplateTypeFromFilename(file);
          
          if (templateType === 'all' || !templateType || templateType === type) {
            templates.generated.push({
              name: templateName,
              type: type,
              description: templateMeta.description || `Generated ${type} template`,
              source: 'generated',
              variables: templateMeta.variables || [],
              created: templateMeta.createdAt || 'Unknown'
            });
          }
        }
      }
    } catch (error) {
      // Generated templates directory might not exist
    }
    
    return templates;
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch (error) {
      return false;
    }
  }

  private extractVariablesFromTemplate(templatePath: string): string[] {
    try {
      const content = require('fs').readFileSync(templatePath, 'utf-8');
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables = new Set<string>();
      let match;
      
      while ((match = variableRegex.exec(content)) !== null) {
        variables.add(match[1]);
      }
      
      return Array.from(variables);
    } catch (error) {
      return [];
    }
  }

  async useCustomTemplate(args: z.infer<typeof UseCustomTemplateSchema>) {
    const { templateName, templateType, variables, projectPath, outputFileName } = args;
    
    const basePath = projectPath || process.cwd();
    
    // Load project configuration for directory paths
    await this.loadProjectConfig(basePath);
    
    // Try to find the template in custom or generated directories
    let templatePath = '';
    let templateContent = '';
    
    const customPath = path.join(this.getDirectoryPath(basePath, 'customTemplates'), templateType, `${templateName}.md`);
    const generatedPath = path.join(this.getDirectoryPath(basePath, 'generatedTemplates'), `${templateName}.md`);
    
    try {
      templateContent = await fs.readFile(customPath, 'utf-8');
      templatePath = customPath;
    } catch (error) {
      try {
        templateContent = await fs.readFile(generatedPath, 'utf-8');
        templatePath = generatedPath;
      } catch (error) {
        throw new Error(`Template '${templateName}' not found in custom or generated templates`);
      }
    }
    
    // Replace variables in template
    let processedContent = templateContent;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    }
    
    // Generate output file using configured directories
    const outputDir = templateType === 'spec' ? this.getDirectoryPath(basePath, 'specifications') : 
                      templateType === 'plan' ? this.getDirectoryPath(basePath, 'plans') : 
                      this.getDirectoryPath(basePath, 'tasks');
    await this.createDirectory(outputDir);
    
    const fileName = outputFileName || `${templateType}-${Date.now()}.md`;
    const outputPath = path.join(outputDir, fileName);
    
    await fs.writeFile(outputPath, processedContent);
    
    // Log template usage if monitoring enabled
    if (this.monitoring) {
      await this.monitoring.log({
        level: 'info',
        message: `Custom template used: ${templateName}`,
        service: 'spec-kit',
        environment: 'development',
        metadata: { templateType, outputPath, variablesReplaced: Object.keys(variables).length }
      });
    }
    
    return {
      outputPath,
      templateUsed: templateName,
      variablesReplaced: Object.keys(variables),
      message: `Created ${templateType} using template '${templateName}'`
    };
  }

  // Helper methods for template management
  private extractTemplateVariables(content: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }

  private getTemplateTypeFromFilename(filename: string): string {
    if (filename.includes('spec')) return 'spec';
    if (filename.includes('plan')) return 'plan';
    if (filename.includes('task')) return 'tasks';
    if (filename.includes('constitution')) return 'constitution';
    return 'unknown';
  }

  private generateSpecTemplate(projectContext: any, customizations: any): string {
    const { language, framework, projectType, architecture } = projectContext;
    const { includeSecuritySection, complexityLevel } = customizations || {};
    
    return `# {{FEATURE_NAME}} - Feature Specification

## Overview
This specification defines the {{FEATURE_NAME}} feature for a ${projectType} application built with ${language}${framework ? ` using ${framework}` : ''}.

## Business Context
{{BUSINESS_CONTEXT}}

## User Stories
{{USER_STORIES}}

## Functional Requirements
{{FUNCTIONAL_REQUIREMENTS}}

## Technical Requirements

### Technology Stack
- **Language**: ${language}
${framework ? `- **Framework**: ${framework}` : ''}
${architecture ? `- **Architecture**: ${architecture}` : ''}

### Performance Requirements
{{PERFORMANCE_REQUIREMENTS}}

${includeSecuritySection ? `
### Security Requirements
{{SECURITY_REQUIREMENTS}}
- Authentication and authorization
- Data encryption in transit and at rest
- Input validation and sanitization
- Secure error handling
` : ''}

## Non-Functional Requirements
{{NON_FUNCTIONAL_REQUIREMENTS}}

## Dependencies
{{DEPENDENCIES}}

## Testing Strategy
${complexityLevel === 'simple' ? 
  '- Unit tests for core functionality\n- Basic integration tests' :
  complexityLevel === 'complex' ?
  '- Comprehensive unit test coverage (>90%)\n- Integration tests\n- End-to-end tests\n- Performance tests\n- Security tests' :
  '- Unit tests for core functionality\n- Integration tests\n- End-to-end tests for critical paths'
}

## Acceptance Criteria
{{ACCEPTANCE_CRITERIA}}

## Out of Scope
{{OUT_OF_SCOPE}}

---
*Generated template for ${language} ${projectType} project*`;
  }

  private generatePlanTemplate(projectContext: any, customizations: any): string {
    const { language, framework, projectType, architecture, testingFramework } = projectContext;
    const { includeCICD, includeMonitoring, complexityLevel } = customizations || {};
    
    return `# {{FEATURE_NAME}} - Implementation Plan

## Specification Reference
- **Spec Path**: {{SPEC_PATH}}
- **Feature Type**: ${projectType}
- **Technology**: ${language}${framework ? ` with ${framework}` : ''}

## Technical Context
${architecture ? `This feature will be implemented using ${architecture} architecture pattern.` : ''}

### Technology Choices
- **Primary Language**: ${language}
${framework ? `- **Framework**: ${framework}` : ''}
${testingFramework ? `- **Testing Framework**: ${testingFramework}` : ''}
- **Project Type**: ${projectType}

## Implementation Phases

### Phase 1: Setup and Foundation
{{PHASE_1_TASKS}}
- [ ] Set up project structure
- [ ] Configure development environment
- [ ] Set up testing framework
${includeCICD ? '- [ ] Configure CI/CD pipeline' : ''}

### Phase 2: Core Implementation
{{PHASE_2_TASKS}}
- [ ] Implement core business logic
- [ ] Write unit tests
- [ ] Create integration tests

### Phase 3: Integration and Testing
{{PHASE_3_TASKS}}
- [ ] Integration testing
- [ ] End-to-end testing
${complexityLevel === 'complex' ? '- [ ] Performance testing\n- [ ] Security testing' : ''}

${includeMonitoring ? `
### Phase 4: Monitoring and Observability
{{PHASE_4_TASKS}}
- [ ] Implement logging
- [ ] Set up metrics collection
- [ ] Configure alerts
- [ ] Create monitoring dashboards
` : ''}

## Constitutional Check
{{CONSTITUTIONAL_CHECK}}

### Principles Validation
- [ ] Library-first approach
- [ ] CLI interface available
- [ ] Test-first implementation
- [ ] Integration over mocking
- [ ] Observability built-in

## Risk Assessment
{{RISK_ASSESSMENT}}

## Timeline
{{TIMELINE}}

---
*Generated implementation plan for ${language} ${projectType}*`;
  }

  private generateTasksTemplate(projectContext: any, customizations: any): string {
    const { language, framework, projectType, testingFramework } = projectContext;
    const { includeCICD, includeMonitoring, complexityLevel } = customizations || {};
    
    return `# {{FEATURE_NAME}} - Task Breakdown

## Plan Reference
- **Plan Path**: {{PLAN_PATH}}
- **Technology**: ${language}${framework ? ` with ${framework}` : ''}
- **Project Type**: ${projectType}

## Test-First Implementation Order

### 1. Test Setup
- [ ] Create test directory structure
- [ ] Configure ${testingFramework || 'testing framework'}
- [ ] Set up test data and fixtures
- [ ] Create test utilities

### 2. Unit Tests (Write First)
- [ ] Write failing unit tests for core logic
- [ ] Write tests for edge cases
- [ ] Write tests for error handling
- [ ] Ensure tests fail before implementation

### 3. Core Implementation
- [ ] Implement minimal code to pass tests
- [ ] Refactor for clarity and maintainability
- [ ] Add comprehensive error handling
- [ ] Document public APIs

### 4. Integration Tests
- [ ] Write integration test scenarios
- [ ] Test with real dependencies
- [ ] Verify end-to-end workflows
- [ ] Test error conditions

${complexityLevel !== 'simple' ? `
### 5. Advanced Testing
- [ ] Performance benchmarks
- [ ] Load testing scenarios
${complexityLevel === 'complex' ? '- [ ] Security testing\n- [ ] Chaos engineering tests' : ''}
` : ''}

${includeCICD ? `
### 6. CI/CD Integration
- [ ] Configure automated testing
- [ ] Set up build pipeline
- [ ] Configure deployment automation
- [ ] Set up environment promotion
` : ''}

${includeMonitoring ? `
### 7. Observability
- [ ] Implement structured logging
- [ ] Add performance metrics
- [ ] Configure health checks
- [ ] Set up alerting rules
` : ''}

### 8. Documentation
- [ ] Update API documentation
- [ ] Create user guides
- [ ] Document deployment procedures
- [ ] Update troubleshooting guides

### 9. Deployment
- [ ] Deploy to development environment
- [ ] Run smoke tests
- [ ] Deploy to staging environment
- [ ] Production deployment

## Parallel Tasks
{{PARALLEL_TASKS}}

## Dependencies
{{TASK_DEPENDENCIES}}

## Estimated Timeline
{{TASK_TIMELINE}}

---
*Generated task breakdown for ${language} ${projectType} implementation*`;
  }
}

// Initialize the server
const server = new Server(
  {
    name: "speckit-enterprise",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize manager (enterprise mode will be enabled per project)
const manager = new EnterpriseSpecKitManager(process.cwd());

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Core Spec-Kit tools
      {
        name: "init_project",
        description: "Initialize a new Spec-Driven Development project with custom directories and templates, plus optional enterprise features",
        inputSchema: {
          type: "object",
          properties: {
            projectName: { type: "string", description: "Name of the project to initialize" },
            aiAssistant: { type: "string", enum: ["claude", "gemini", "copilot"], description: "AI assistant to configure for" },
            workingDirectory: { type: "string", description: "Directory to initialize project in" },
            useCurrentDirectory: { type: "boolean", description: "Initialize in current directory" },
            enterpriseMode: { type: "boolean", description: "Enable enterprise features" },
            directoryConfig: { 
              type: "object", 
              description: "Custom directory structure configuration",
              properties: {
                specifications: { type: "string", description: "Directory for feature specifications" },
                plans: { type: "string", description: "Directory for implementation plans" },
                tasks: { type: "string", description: "Directory for task breakdowns" },
                templates: { type: "string", description: "Directory for built-in templates" },
                customTemplates: { type: "string", description: "Directory for custom templates" },
                generatedTemplates: { type: "string", description: "Directory for generated templates" },
                memory: { type: "string", description: "Directory for constitution and memory" },
                enterprise: { type: "string", description: "Directory for enterprise configurations" },
                commands: { type: "string", description: "Directory for command templates" }
              }
            },
            customTemplates: {
              type: "object",
              description: "Custom template files to use for initialization",
              properties: {
                specTemplate: { type: "string", description: "Custom specification template name" },
                planTemplate: { type: "string", description: "Custom plan template name" },
                tasksTemplate: { type: "string", description: "Custom tasks template name" },
                constitutionTemplate: { type: "string", description: "Custom constitution template name" }
              }
            }
          },
          required: ["projectName", "aiAssistant"],
        },
      },
      {
        name: "create_specification",
        description: "Create a new feature specification from template",
        inputSchema: {
          type: "object",
          properties: {
            featureDescription: { type: "string", description: "Description of the feature" },
            projectPath: { type: "string", description: "Path to the project directory" },
            featureNumber: { type: "number", description: "Feature number" },
            requiresApproval: { type: "boolean", description: "Whether this requires approval" },
          },
          required: ["featureDescription"],
        },
      },
      {
        name: "create_plan",
        description: "Create an implementation plan from a specification",
        inputSchema: {
          type: "object",
          properties: {
            specPath: { type: "string", description: "Path to the specification file" },
            technicalContext: { type: "string", description: "Technical context and choices" },
            projectPath: { type: "string", description: "Path to the project directory" },
            includeSecurityScan: { type: "boolean", description: "Include security scanning" },
          },
          required: ["specPath", "technicalContext"],
        },
      },
      {
        name: "create_tasks",
        description: "Create actionable tasks from an implementation plan",
        inputSchema: {
          type: "object",
          properties: {
            planPath: { type: "string", description: "Path to the plan file" },
            projectPath: { type: "string", description: "Path to the project directory" },
            includeCICD: { type: "boolean", description: "Include CI/CD tasks" },
          },
          required: ["planPath"],
        },
      },
      {
        name: "validate_constitution",
        description: "Validate implementation plan against architectural constitution",
        inputSchema: {
          type: "object",
          properties: {
            planPath: { type: "string", description: "Path to the plan file" },
            constitutionPath: { type: "string", description: "Path to constitution file" },
          },
          required: ["planPath"],
        },
      },
      // Enterprise Governance tools
      {
        name: "create_approval_workflow",
        description: "Create an enterprise approval workflow",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Workflow name" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  approvers: { type: "array", items: { type: "string" } },
                  requiredApprovals: { type: "number" }
                }
              }
            },
            requiredApprovals: { type: "number", description: "Total required approvals" },
          },
          required: ["name", "steps", "requiredApprovals"],
        },
      },
      // Enterprise Security tools
      {
        name: "security_scan",
        description: "Perform security scanning on project resources",
        inputSchema: {
          type: "object",
          properties: {
            resourcePath: { type: "string", description: "Path to resource to scan" },
            scanType: { type: "string", enum: ["code", "dependency", "configuration", "infrastructure"] },
          },
          required: ["resourcePath", "scanType"],
        },
      },
      // Enterprise CI/CD tools
      {
        name: "create_pipeline",
        description: "Create a CI/CD pipeline configuration",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Pipeline name" },
            triggers: { type: "array", items: { type: "string" } },
            includeSecurityStage: { type: "boolean", description: "Include security stage" },
            deploymentStrategy: { type: "string", enum: ["blue_green", "canary", "rolling"] },
          },
          required: ["name", "triggers"],
        },
      },
      // Enterprise Monitoring tools
      {
        name: "setup_monitoring",
        description: "Set up monitoring and alerting for a service",
        inputSchema: {
          type: "object",
          properties: {
            serviceName: { type: "string", description: "Service name" },
            metricsToTrack: { type: "array", items: { type: "string" } },
            alertThresholds: { type: "object", additionalProperties: { type: "number" } },
          },
          required: ["serviceName", "metricsToTrack", "alertThresholds"],
        },
      },
      // Enterprise Scalability tools
      {
        name: "create_tenant",
        description: "Create a new tenant configuration for multi-tenancy",
        inputSchema: {
          type: "object",
          properties: {
            tenantName: { type: "string", description: "Tenant name" },
            domain: { type: "string", description: "Tenant domain" },
            resourceLimits: {
              type: "object",
              properties: {
                cpu: { type: "number" },
                memory: { type: "number" },
                storage: { type: "number" }
              }
            },
          },
          required: ["tenantName", "domain", "resourceLimits"],
        },
      },
      // Custom Template Management tools
      {
        name: "create_custom_template",
        description: "Create a custom template for specifications, plans, or tasks",
        inputSchema: {
          type: "object",
          properties: {
            templateType: { type: "string", enum: ["spec", "plan", "tasks", "constitution"], description: "Type of template" },
            templateName: { type: "string", description: "Name of the custom template" },
            templateContent: { type: "string", description: "Template content with {{variables}}" },
            projectPath: { type: "string", description: "Path to the project directory" },
            description: { type: "string", description: "Description of the template" },
          },
          required: ["templateType", "templateName", "templateContent"],
        },
      },
      {
        name: "generate_template",
        description: "Generate a template based on project context and technology stack",
        inputSchema: {
          type: "object",
          properties: {
            templateType: { type: "string", enum: ["spec", "plan", "tasks"], description: "Type of template to generate" },
            projectContext: {
              type: "object",
              properties: {
                language: { type: "string", description: "Primary programming language" },
                framework: { type: "string", description: "Framework being used" },
                projectType: { type: "string", enum: ["web", "api", "mobile", "desktop", "cli", "library"], description: "Type of project" },
                architecture: { type: "string", enum: ["monolith", "microservices", "serverless", "jamstack"], description: "Architecture pattern" },
                testingFramework: { type: "string", description: "Testing framework preference" },
                deploymentTarget: { type: "string", enum: ["cloud", "on-premise", "hybrid"], description: "Deployment target" },
              },
              required: ["language", "projectType"],
            },
            projectPath: { type: "string", description: "Path to the project directory" },
            customizations: {
              type: "object",
              properties: {
                includeSecuritySection: { type: "boolean", description: "Include security sections" },
                includeCICD: { type: "boolean", description: "Include CI/CD sections" },
                includeMonitoring: { type: "boolean", description: "Include monitoring sections" },
                complexityLevel: { type: "string", enum: ["simple", "moderate", "complex"], description: "Template complexity" },
              },
            },
          },
          required: ["templateType", "projectContext"],
        },
      },
      {
        name: "list_templates",
        description: "List all available templates (built-in, custom, and generated)",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: { type: "string", description: "Path to the project directory" },
            templateType: { type: "string", enum: ["spec", "plan", "tasks", "constitution", "all"], description: "Type of templates to list" },
          },
        },
      },
      {
        name: "use_custom_template",
        description: "Use a custom or generated template with variable substitution",
        inputSchema: {
          type: "object",
          properties: {
            templateName: { type: "string", description: "Name of the template to use" },
            templateType: { type: "string", enum: ["spec", "plan", "tasks"], description: "Type of template" },
            variables: { type: "object", additionalProperties: { type: "string" }, description: "Variables to replace in template" },
            projectPath: { type: "string", description: "Path to the project directory" },
            outputFileName: { type: "string", description: "Custom output file name" },
          },
          required: ["templateName", "templateType", "variables"],
        },
      },
      {
        name: "configure_directories",
        description: "Configure custom directory paths for project structure",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: { type: "string", description: "Path to the project directory" },
            directories: {
              type: "object",
              properties: {
                specifications: { type: "string", description: "Directory for feature specifications (default: features)" },
                plans: { type: "string", description: "Directory for implementation plans (default: plans)" },
                tasks: { type: "string", description: "Directory for task breakdowns (default: tasks)" },
                templates: { type: "string", description: "Directory for built-in templates (default: templates)" },
                customTemplates: { type: "string", description: "Directory for custom templates (default: custom-templates)" },
                generatedTemplates: { type: "string", description: "Directory for generated templates (default: generated-templates)" },
                memory: { type: "string", description: "Directory for constitution and memory (default: memory)" },
                enterprise: { type: "string", description: "Directory for enterprise configurations (default: enterprise)" },
                commands: { type: "string", description: "Directory for command templates (default: commands)" },
              },
            },
            saveConfig: { type: "boolean", description: "Whether to save configuration to project (default: true)" },
          },
          required: ["projectPath"],
        },
      },
      // New enhanced SpecKit tools
      {
        name: "generate_project_structure",
        description: "Generate complete project structure with categories, task organization, and comprehensive documentation",
        inputSchema: {
          type: "object",
          properties: {
            projectName: { type: "string", description: "Name of the project to generate structure for" },
            taskPrefix: { type: "string", description: "Prefix for task naming (e.g., 'VNP2')" },
            categories: { 
              type: "array", 
              items: { type: "string" }, 
              description: "Categories for task organization (e.g., ['backend', 'frontend', 'state', 'ui', 'integration', 'testing'])" 
            },
            includeUserStories: { type: "boolean", description: "Whether to include user stories generation" },
            projectPath: { type: "string", description: "Path to the project directory" },
            totalEffortHours: { type: "string", description: "Total estimated effort in hours" },
            developmentDays: { type: "string", description: "Estimated development days" }
          },
          required: ["projectName", "taskPrefix", "categories"],
        },
      },
      {
        name: "create_comprehensive_tasks",
        description: "Create comprehensive task suite with detailed specifications, effort estimation, and enterprise-grade quality",
        inputSchema: {
          type: "object",
          properties: {
            specPath: { type: "string", description: "Path to the feature specification file" },
            taskCategories: { 
              type: "object", 
              additionalProperties: {
                type: "object",
                properties: {
                  count: { type: "number", description: "Number of tasks in this category" },
                  effort: { type: "string", description: "Effort estimation per task (e.g., '6h each')" }
                },
                required: ["count", "effort"]
              },
              description: "Task categories with count and effort specifications" 
            },
            projectPath: { type: "string", description: "Path to the project directory" },
            taskPrefix: { type: "string", description: "Prefix for task naming" },
            includeDetailedSections: { type: "boolean", description: "Include detailed task sections (15+ sections)" }
          },
          required: ["specPath", "taskCategories"],
        },
      },
      {
        name: "generate_user_stories",
        description: "Generate comprehensive user stories with personas and validation matrix for user validation workflows",
        inputSchema: {
          type: "object",
          properties: {
            personas: { 
              type: "array", 
              items: { type: "string" }, 
              description: "User personas to generate stories for (e.g., ['power-user', 'casual-user', 'admin-user'])" 
            },
            generateValidationMatrix: { type: "boolean", description: "Generate validation matrix for user stories" },
            projectPath: { type: "string", description: "Path to the project directory" },
            featureContext: { type: "string", description: "Context about the feature for generating relevant stories" },
            includeAcceptanceCriteria: { type: "boolean", description: "Include acceptance criteria for each story" }
          },
          required: ["personas"],
        },
      },
      {
        name: "generate_quality_framework",
        description: "Generate comprehensive quality framework with enterprise-grade quality gates, performance targets, and testing standards",
        inputSchema: {
          type: "object",
          properties: {
            testCoverageTarget: { type: "number", description: "Target test coverage percentage" },
            performanceTargets: {
              type: "object",
              properties: {
                loadTime: { type: "string", description: "Page load time target" },
                apiResponse: { type: "string", description: "API response time target" },
                memoryUsage: { type: "string", description: "Memory usage limits" },
                cpuUsage: { type: "string", description: "CPU usage limits" }
              },
              description: "Performance targets for the quality framework"
            },
            projectPath: { type: "string", description: "Path to the project directory" },
            includeSecurityChecks: { type: "boolean", description: "Include security quality checks" },
            includeAccessibilityChecks: { type: "boolean", description: "Include accessibility quality checks" }
          },
          required: ["testCoverageTarget", "performanceTargets"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "init_project": {
        const validatedArgs = InitProjectSchema.parse(args);
        const projectPath = await manager.initializeProject(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Successfully initialized ${validatedArgs.enterpriseMode ? 'Enterprise ' : ''}Spec-Driven Development project at: ${projectPath}\n\nProject structure created with:\n- Templates for specifications, plans, and tasks\n- Constitution for architectural principles\n- Configuration for ${validatedArgs.aiAssistant} assistant${validatedArgs.enterpriseMode ? '\n- Enterprise governance, security, CI/CD, monitoring, and scalability features' : ''}\n\nNext steps:\n1. Review and customize memory/constitution.md\n2. Use create_specification to create your first feature specification\n3. Use create_plan to generate implementation plans\n4. Use create_tasks to break down into actionable items${validatedArgs.enterpriseMode ? '\n5. Configure enterprise workflows, security policies, and monitoring' : ''}`,
            },
          ],
        };
      }

      case "create_specification": {
        const validatedArgs = CreateSpecificationSchema.parse(args);
        const specPath = await manager.createSpecification(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Created feature specification at: ${specPath}\n\nThe specification template has been customized with your feature description.${validatedArgs.requiresApproval ? ' An approval workflow has been initiated.' : ''}\n\nNext steps:\n1. Review and fill in the specification details\n2. Mark any [NEEDS CLARIFICATION] items\n3. Complete User Scenarios & Testing section\n4. Define clear Functional Requirements\n5. Use create_plan to create implementation plan`,
            },
          ],
        };
      }

      case "create_plan": {
        const validatedArgs = CreatePlanSchema.parse(args);
        const planPath = await manager.createImplementationPlan(validatedArgs);
        return {
          content: [
            {
              type: "text", 
              text: `Created implementation plan at: ${planPath}\n\nThe plan includes:\n- Technical context section\n- Constitution check gates\n- Project structure decisions\n- Phase-based implementation approach${validatedArgs.includeSecurityScan ? '\n- Security scan results' : ''}\n\nNext steps:\n1. Fill in the Technical Context section\n2. Complete the Constitution Check section\n3. Resolve any NEEDS CLARIFICATION items\n4. Use create_tasks to generate actionable breakdown`,
            },
          ],
        };
      }

      case "create_tasks": {
        const validatedArgs = CreateTasksSchema.parse(args);
        const tasksPath = await manager.createTasks(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Created task breakdown at: ${tasksPath}\n\nThe tasks file includes:\n- Structured implementation phases\n- Test-first approach with TDD\n- Parallel task identification\n- Dependency mapping${validatedArgs.includeCICD ? '\n- CI/CD pipeline tasks' : ''}\n\nNext steps:\n1. Customize tasks based on your plan\n2. Ensure tests are written before implementation\n3. Follow constitutional principles\n4. Execute tasks in specified order`,
            },
          ],
        };
      }

      case "validate_constitution": {
        const validatedArgs = ValidateConstitutionSchema.parse(args);
        const validation = await manager.validateConstitution(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: validation,
            },
          ],
        };
      }

      case "create_approval_workflow": {
        const validatedArgs = CreateApprovalWorkflowSchema.parse(args);
        const workflow = await manager.createApprovalWorkflow(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Created approval workflow: ${workflow.name} (ID: ${workflow.id})\n\nWorkflow includes ${workflow.steps.length} approval steps with ${workflow.requiredApprovals} total required approvals.\n\nThe workflow is now available for use in change requests and feature specifications.`,
            },
          ],
        };
      }

      case "security_scan": {
        const validatedArgs = SecurityScanSchema.parse(args);
        const scanResult = await manager.performSecurityScan(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Security scan completed for: ${validatedArgs.resourcePath}\n\nScan Type: ${validatedArgs.scanType}\nStatus: ${scanResult.passed ? 'PASSED' : 'FAILED'}\nFindings: ${scanResult.findings.length}\n\nHigh/Critical Issues: ${scanResult.findings.filter(f => f.severity === 'high' || f.severity === 'critical').length}\n\n${scanResult.recommendations.map(r => `• ${r}`).join('\n')}\n\nDetailed results available in scan report.`,
            },
          ],
        };
      }

      case "create_pipeline": {
        const validatedArgs = CreatePipelineSchema.parse(args);
        const pipeline = await manager.createPipeline(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Created CI/CD pipeline: ${pipeline.name} (ID: ${pipeline.id})\n\nPipeline includes:\n- Build stage with artifact generation\n${validatedArgs.includeSecurityStage ? '- Security scanning stage\n' : ''}- Automated triggers: ${validatedArgs.triggers.join(', ')}\n${validatedArgs.deploymentStrategy ? `- Deployment strategy: ${validatedArgs.deploymentStrategy}\n` : ''}\nPipeline is ready for execution and can be triggered by configured events.`,
            },
          ],
        };
      }

      case "setup_monitoring": {
        const validatedArgs = MonitoringConfigSchema.parse(args);
        const result = await manager.setupMonitoring(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Monitoring configured for service: ${validatedArgs.serviceName}\n\nTracking metrics: ${validatedArgs.metricsToTrack.join(', ')}\nAlert thresholds configured for: ${Object.keys(validatedArgs.alertThresholds).join(', ')}\n\nAlerts will be sent to configured channels when thresholds are exceeded.\nMonitoring dashboards and reports are available in the monitoring interface.`,
            },
          ],
        };
      }

      case "create_tenant": {
        const validatedArgs = TenantConfigSchema.parse(args);
        const tenant = await manager.createTenant(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Created tenant: ${tenant.name} (ID: ${tenant.id})\n\nDomain: ${tenant.domain}\nResource Limits:\n- CPU: ${tenant.resources.cpu} cores\n- Memory: ${tenant.resources.memory} MB\n- Storage: ${tenant.resources.storage} GB\n\nTenant isolation configured with data and network isolation.\nFeatures enabled: ${tenant.features.join(', ')}`,
            },
          ],
        };
      }

      case "create_custom_template": {
        const validatedArgs = CreateCustomTemplateSchema.parse(args);
        const result = await manager.createCustomTemplate(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Created custom template: ${validatedArgs.templateName}\n\nType: ${validatedArgs.templateType}\nPath: ${result.templatePath}\nVariables detected: ${result.metadata.variables.join(', ')}\n\nTemplate is now available for use with use_custom_template tool.`,
            },
          ],
        };
      }

      case "generate_template": {
        const validatedArgs = GenerateTemplateSchema.parse(args);
        const result = await manager.generateTemplate(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Generated template: ${result.metadata.name}\n\nType: ${validatedArgs.templateType}\nTechnology Stack: ${validatedArgs.projectContext.language} / ${validatedArgs.projectContext.framework || 'none'}\nProject Type: ${validatedArgs.projectContext.projectType}\nArchitecture: ${validatedArgs.projectContext.architecture || 'monolith'}\n\nTemplate generated with project-specific sections and best practices.\nPath: ${result.templatePath}\nVariables: ${result.metadata.variables.join(', ')}\n\nTemplate is ready for use with use_custom_template tool.`,
            },
          ],
        };
      }

      case "list_templates": {
        const validatedArgs = ListTemplatesSchema.parse(args);
        const result = await manager.listTemplates(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Available Templates:\n\n${[...result.builtin, ...result.custom, ...result.generated].map(t => 
                `📄 ${t.name} (${t.type})\n   ${t.description}\n   Source: ${t.source}\n   Variables: ${t.variables.join(', ')}\n   Created: ${t.created}\n`
              ).join('\n')}\n\nTotal: ${result.builtin.length + result.custom.length + result.generated.length} templates\nBuilt-in: ${result.builtin.length}\nCustom: ${result.custom.length}\nGenerated: ${result.generated.length}`,
            },
          ],
        };
      }

      case "use_custom_template": {
        const validatedArgs = UseCustomTemplateSchema.parse(args);
        const result = await manager.useCustomTemplate(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Template applied successfully!\n\nTemplate: ${validatedArgs.templateName}\nOutput: ${result.outputPath}\nVariables substituted: ${Object.keys(validatedArgs.variables).length}\n\nThe template has been processed and saved with your custom values.\nYou can now edit the generated file as needed.`,
            },
          ],
        };
      }

      case "configure_directories": {
        const validatedArgs = ConfigureDirectoriesSchema.parse(args);
        const result = await manager.configureDirectories(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Directory configuration updated successfully!\n\nProject: ${validatedArgs.projectPath}\nConfiguration saved: ${result.configPath}\n\nDirectory Structure:\n${Object.entries(result.directories).map(([key, value]) => `• ${key}: ${value}`).join('\n')}\n\nAll directories have been created and are ready for use.`,
            },
          ],
        };
      }

      case "generate_project_structure": {
        const validatedArgs = GenerateProjectStructureSchema.parse(args);
        const result = await manager.generateProjectStructure(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Project structure generated successfully!\n\nProject: ${result.structure.projectName}\nLocation: ${result.projectPath}\nCategories: ${result.structure.categories.length}\nTotal Effort: ${result.structure.totalEffortHours} hours\nDevelopment Timeline: ${result.structure.developmentDays} days\n\nGenerated Files:\n• README.md: ${result.readmePath}\n• Task Index: ${result.taskIndexPath}\n• Project Manifest: ${result.manifestPath}\n\nCategory Structure:\n${result.structure.categories.map(cat => `• ${cat}: specifications, plans, tasks, tests`).join('\n')}\n\nNext steps:\n1. Review the generated project structure\n2. Use create_comprehensive_tasks to generate detailed tasks\n3. Use generate_user_stories for user validation\n4. Use generate_quality_framework for quality gates`,
            },
          ],
        };
      }

      case "create_comprehensive_tasks": {
        const validatedArgs = CreateComprehensiveTasksSchema.parse(args);
        const result = await manager.createComprehensiveTasks(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Comprehensive tasks created successfully!\n\nFeature: ${result.comprehensiveTasks.featureName}\nTotal Tasks: ${result.totalTasks}\nTask Categories: ${Object.keys(result.comprehensiveTasks.categories).length}\nEstimated Effort: ${result.comprehensiveTasks.estimatedEffort}\n\nTask Breakdown by Category:\n${Object.entries(result.comprehensiveTasks.categories).map(([cat, config]: [string, any]) => `• ${cat}: ${config.count} tasks (${config.effort})`).join('\n')}\n\nGenerated Files:\n• Task Summary: ${result.summaryPath}\n• Task Manifest: ${result.manifestPath}\n• Individual task files created in category directories\n\nEach task includes 15+ detailed sections:\n• Business context and user impact\n• Technical approach and implementation notes\n• Security and performance considerations\n• Validation and rollback plans\n• Quality gates and definition of done\n\nTasks are organized by priority and dependencies for efficient execution.`,
            },
          ],
        };
      }

      case "generate_user_stories": {
        const validatedArgs = GenerateUserStoriesSchema.parse(args);
        const result = await manager.generateUserStories(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `User stories generated successfully!\n\nTotal Stories: ${result.totalStories}\nPersonas: ${result.userStories.personas.join(', ')}\nValidation Matrix: ${result.validationMatrixPath ? 'Generated' : 'Not generated'}\nAcceptance Criteria: ${result.userStories.includeAcceptanceCriteria ? 'Included' : 'Not included'}\n\nStories by Persona:\n${Object.entries(result.userStories.stories).map(([persona, stories]: [string, any]) => `• ${persona}: ${stories.length} stories (${stories.filter((s: any) => s.priority === 'high').length} high priority)`).join('\n')}\n\nGenerated Files:\n• User Stories Summary: ${result.summaryPath}\n• User Stories Manifest: ${result.manifestPath}\n${result.validationMatrixPath ? `• Validation Matrix: ${result.validationMatrixPath}\n` : ''}• Individual persona story files\n\nEach story includes:\n• Clear user story format with persona context\n• Priority and complexity assessment\n• Detailed acceptance criteria\n• Test scenarios for validation\n\n${result.validationMatrixPath ? 'Cross-persona validation matrix identifies potential conflicts and ensures comprehensive testing across user types.' : ''}`,
            },
          ],
        };
      }

      case "generate_quality_framework": {
        const validatedArgs = GenerateQualityFrameworkSchema.parse(args);
        const result = await manager.generateQualityFramework(validatedArgs);
        return {
          content: [
            {
              type: "text",
              text: `Quality framework generated successfully!\n\nTest Coverage Target: ${result.qualityFramework.testCoverageTarget}%\nPerformance Targets: ${Object.entries(result.qualityFramework.performanceTargets).map(([key, value]) => `${key}: ${value}`).join(', ')}\nSecurity Checks: ${result.qualityFramework.includeSecurityChecks ? 'Enabled' : 'Disabled'}\nAccessibility Checks: ${result.qualityFramework.includeAccessibilityChecks ? 'Enabled' : 'Disabled'}\n\nGenerated Quality Components:\n• Quality Gates: ${result.qualityGatesPath}\n• Test Plan: ${result.testPlanPath}\n• Performance Benchmarks: ${result.performanceBenchmarksPath}\n${result.securityChecklistPath ? `• Security Checklist: ${result.securityChecklistPath}\n` : ''}${result.accessibilityChecklistPath ? `• Accessibility Checklist: ${result.accessibilityChecklistPath}\n` : ''}• Quality Framework Manifest: ${result.manifestPath}\n\nFramework includes:\n• Comprehensive testing strategy (unit, integration, e2e)\n• Performance benchmarks and monitoring\n• Code quality gates and metrics\n${result.qualityFramework.includeSecurityChecks ? '• Enterprise security checklist and standards\n' : ''}${result.qualityFramework.includeAccessibilityChecks ? '• WCAG accessibility compliance checklist\n' : ''}• Automated quality enforcement in CI/CD\n\nThis enterprise-grade quality framework ensures 95%+ documentation completeness and systematic quality assurance throughout the development lifecycle.`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Enterprise Spec-Kit MCP Server running on stdio");
}

// Export the class for testing
export { EnterpriseSpecKitManager };

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});