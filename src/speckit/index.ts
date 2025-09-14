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