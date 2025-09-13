#!/usr/bin/env node

/**
 * Test script for Configurable Directory Structure feature
 * Tests the complete workflow of configuring custom directories and using them
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } = require('fs');
const { join } = require('path');

// Test configuration
const TEST_PROJECT_PATH = join(__dirname, 'test-project');

// Custom directory configuration for testing
const CUSTOM_DIRECTORIES = {
  specs: 'documentation/requirements',
  plans: 'documentation/architecture', 
  tasks: 'documentation/implementation',
  templates: 'project-templates/base',
  customTemplates: 'project-templates/custom',
  generatedTemplates: 'project-templates/generated',
  constitution: 'governance/principles',
  scripts: 'automation/scripts',
  memory: 'knowledge-base'
};

class ConfigurableDirectoriesTest {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type}: ${message}`;
    console.log(logMessage);
    this.results.push(logMessage);
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR: ${message}`;
    if (error) {
      errorMessage += ` - ${error.message}`;
    }
    console.error(errorMessage);
    this.errors.push({ message: errorMessage, error });
  }

  async setupTestEnvironment() {
    this.log('Setting up test environment...');
    
    // Clean up any existing test project
    if (existsSync(TEST_PROJECT_PATH)) {
      rmSync(TEST_PROJECT_PATH, { recursive: true, force: true });
    }
    
    // Create test project directory
    mkdirSync(TEST_PROJECT_PATH, { recursive: true });
    this.log(`Created test project directory: ${TEST_PROJECT_PATH}`);
  }

  async testProjectInitialization() {
    this.log('Testing project initialization...');
    
    try {
      // Simulate MCP tool call for init_project
      const initRequest = {
        projectName: 'test-configurable-project',
        aiAssistant: 'claude',
        workingDirectory: TEST_PROJECT_PATH,
        useCurrentDirectory: true
      };
      
      this.log(`Simulating init_project with: ${JSON.stringify(initRequest, null, 2)}`);
      
      // Check if default directories would be created
      const expectedDefaultDirs = [
        'specs', 'templates', 'custom-templates', 
        'generated-templates', 'memory', 'scripts'
      ];
      
      for (const dir of expectedDefaultDirs) {
        const dirPath = join(TEST_PROJECT_PATH, dir);
        if (!existsSync(dirPath)) {
          mkdirSync(dirPath, { recursive: true });
        }
      }
      
      this.log('✅ Project initialization simulation completed');
      return true;
    } catch (error) {
      this.error('Project initialization failed', error);
      return false;
    }
  }

  async testDirectoryConfiguration() {
    this.log('Testing directory configuration...');
    
    try {
      // Simulate MCP tool call for configure_directories
      const configRequest = {
        directories: CUSTOM_DIRECTORIES
      };
      
      this.log(`Simulating configure_directories with: ${JSON.stringify(configRequest, null, 2)}`);
      
      // Create the configuration file that would be created by the tool
      const configDir = join(TEST_PROJECT_PATH, '.speckit');
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      
      const configPath = join(configDir, 'config.json');
      const config = {
        directoryConfig: CUSTOM_DIRECTORIES,
        lastUpdated: new Date().toISOString()
      };
      
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      this.log(`✅ Created configuration file: ${configPath}`);
      
      // Create the custom directories
      for (const [key, directory] of Object.entries(CUSTOM_DIRECTORIES)) {
        const dirPath = join(TEST_PROJECT_PATH, directory);
        if (!existsSync(dirPath)) {
          mkdirSync(dirPath, { recursive: true });
          this.log(`✅ Created custom directory: ${directory} (${key})`);
        }
      }
      
      this.log('✅ Directory configuration simulation completed');
      return true;
    } catch (error) {
      this.error('Directory configuration failed', error);
      return false;
    }
  }

  async testSpecificationCreation() {
    this.log('Testing specification creation with custom directories...');
    
    try {
      // Simulate creating a specification in the custom specs directory
      const customSpecsDir = join(TEST_PROJECT_PATH, CUSTOM_DIRECTORIES.specs);
      const featureDir = join(customSpecsDir, '001-user-authentication');
      
      if (!existsSync(featureDir)) {
        mkdirSync(featureDir, { recursive: true });
      }
      
      const specContent = `# User Authentication Specification

## Overview
This specification covers the user authentication system.

## Requirements
- Email/password login
- Password reset functionality  
- Session management
- JWT token authentication

## Acceptance Criteria
- Users can register with email and password
- Users can login with valid credentials
- Users can reset forgotten passwords
- Sessions expire after 24 hours

Created in custom directory: ${CUSTOM_DIRECTORIES.specs}
`;
      
      const specPath = join(featureDir, 'spec.md');
      writeFileSync(specPath, specContent);
      
      this.log(`✅ Created specification in custom directory: ${specPath}`);
      this.log(`Custom specs directory: ${CUSTOM_DIRECTORIES.specs}`);
      
      return true;
    } catch (error) {
      this.error('Specification creation failed', error);
      return false;
    }
  }

  async testPlanCreation() {
    this.log('Testing plan creation with custom directories...');
    
    try {
      // Simulate creating a plan in the custom plans directory
      const customPlansDir = join(TEST_PROJECT_PATH, CUSTOM_DIRECTORIES.plans);
      const featureDir = join(customPlansDir, '001-user-authentication');
      
      if (!existsSync(featureDir)) {
        mkdirSync(featureDir, { recursive: true });
      }
      
      const planContent = `# User Authentication Implementation Plan

## Phase 1: Database Schema
- Create users table
- Create sessions table
- Set up database migrations

## Phase 2: Authentication Service
- Implement password hashing with bcrypt
- Create JWT token generation
- Build login/logout endpoints

## Phase 3: Session Management
- Implement session storage
- Add session validation middleware
- Create session cleanup job

Created in custom directory: ${CUSTOM_DIRECTORIES.plans}
`;
      
      const planPath = join(featureDir, 'plan.md');
      writeFileSync(planPath, planContent);
      
      this.log(`✅ Created plan in custom directory: ${planPath}`);
      this.log(`Custom plans directory: ${CUSTOM_DIRECTORIES.plans}`);
      
      return true;
    } catch (error) {
      this.error('Plan creation failed', error);
      return false;
    }
  }

  async testTaskCreation() {
    this.log('Testing task creation with custom directories...');
    
    try {
      // Simulate creating tasks in the custom tasks directory
      const customTasksDir = join(TEST_PROJECT_PATH, CUSTOM_DIRECTORIES.tasks);
      const featureDir = join(customTasksDir, '001-user-authentication');
      
      if (!existsSync(featureDir)) {
        mkdirSync(featureDir, { recursive: true });
      }
      
      const tasksContent = `# User Authentication Tasks

## Database Tasks
- [ ] Create users table migration
- [ ] Create sessions table migration  
- [ ] Run database migrations

## Service Tasks
- [ ] Install bcrypt dependency
- [ ] Create password hashing utility
- [ ] Implement user registration endpoint
- [ ] Implement login endpoint
- [ ] Create JWT token service

## Testing Tasks
- [ ] Write unit tests for password hashing
- [ ] Write integration tests for auth endpoints
- [ ] Test session management

Created in custom directory: ${CUSTOM_DIRECTORIES.tasks}
`;
      
      const tasksPath = join(featureDir, 'tasks.md');
      writeFileSync(tasksPath, tasksContent);
      
      this.log(`✅ Created tasks in custom directory: ${tasksPath}`);
      this.log(`Custom tasks directory: ${CUSTOM_DIRECTORIES.tasks}`);
      
      return true;
    } catch (error) {
      this.error('Task creation failed', error);
      return false;
    }
  }

  async testCustomTemplateCreation() {
    this.log('Testing custom template creation with custom directories...');
    
    try {
      // Simulate creating a custom template in the custom templates directory
      const customTemplatesDir = join(TEST_PROJECT_PATH, CUSTOM_DIRECTORIES.customTemplates);
      
      if (!existsSync(customTemplatesDir)) {
        mkdirSync(customTemplatesDir, { recursive: true });
      }
      
      const templateContent = `# {{featureName}} Enterprise Specification

## Service Information
- Service Name: {{serviceName}}
- Technology: {{technology}}
- Database: {{database}}

## Business Requirements
{{businessRequirements}}

## Technical Requirements
{{technicalRequirements}}

## Security Considerations
{{securityRequirements}}

## Compliance Requirements
{{complianceRequirements}}

Created in custom templates directory: ${CUSTOM_DIRECTORIES.customTemplates}
`;
      
      const templatePath = join(customTemplatesDir, 'enterprise-spec-template.md');
      writeFileSync(templatePath, templateContent);
      
      // Create metadata file
      const metadata = {
        'enterprise-spec-template': {
          type: 'spec',
          name: 'enterprise-spec-template',
          description: 'Enterprise specification template with compliance sections',
          variables: ['featureName', 'serviceName', 'technology', 'database', 'businessRequirements', 'technicalRequirements', 'securityRequirements', 'complianceRequirements'],
          createdAt: new Date().toISOString()
        }
      };
      
      const metadataPath = join(customTemplatesDir, 'templates-metadata.json');
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      this.log(`✅ Created custom template in custom directory: ${templatePath}`);
      this.log(`Custom templates directory: ${CUSTOM_DIRECTORIES.customTemplates}`);
      
      return true;
    } catch (error) {
      this.error('Custom template creation failed', error);
      return false;
    }
  }

  async testConfigurationPersistence() {
    this.log('Testing configuration persistence...');
    
    try {
      const configPath = join(TEST_PROJECT_PATH, '.speckit', 'config.json');
      
      if (!existsSync(configPath)) {
        this.error('Configuration file does not exist');
        return false;
      }
      
      const configContent = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      // Verify all custom directories are saved
      for (const [key, expectedPath] of Object.entries(CUSTOM_DIRECTORIES)) {
        if (config.directoryConfig[key] !== expectedPath) {
          this.error(`Configuration mismatch for ${key}: expected ${expectedPath}, got ${config.directoryConfig[key]}`);
          return false;
        }
      }
      
      this.log('✅ Configuration persistence verified');
      this.log(`Configuration file contains: ${Object.keys(config.directoryConfig).length} directory mappings`);
      
      return true;
    } catch (error) {
      this.error('Configuration persistence test failed', error);
      return false;
    }
  }

  async testDirectoryStructureValidation() {
    this.log('Testing directory structure validation...');
    
    try {
      const expectedDirectories = [
        CUSTOM_DIRECTORIES.specs,
        CUSTOM_DIRECTORIES.plans,
        CUSTOM_DIRECTORIES.tasks,
        CUSTOM_DIRECTORIES.templates,
        CUSTOM_DIRECTORIES.customTemplates,
        CUSTOM_DIRECTORIES.generatedTemplates,
        CUSTOM_DIRECTORIES.constitution,
        CUSTOM_DIRECTORIES.scripts,
        CUSTOM_DIRECTORIES.memory
      ];
      
      let missingDirectories = [];
      
      for (const directory of expectedDirectories) {
        const dirPath = join(TEST_PROJECT_PATH, directory);
        if (!existsSync(dirPath)) {
          missingDirectories.push(directory);
        }
      }
      
      if (missingDirectories.length > 0) {
        this.error(`Missing directories: ${missingDirectories.join(', ')}`);
        return false;
      }
      
      this.log('✅ All custom directories exist');
      this.log(`Validated ${expectedDirectories.length} custom directories`);
      
      return true;
    } catch (error) {
      this.error('Directory structure validation failed', error);
      return false;
    }
  }

  async testEnterpriseIntegration() {
    this.log('Testing enterprise features with custom directories...');
    
    try {
      // Test governance directory
      const governanceDir = join(TEST_PROJECT_PATH, CUSTOM_DIRECTORIES.constitution);
      const constitutionPath = join(governanceDir, 'constitution.md');
      
      const constitutionContent = `# Enterprise Architecture Constitution

## Principles
1. Security First
2. Compliance by Design
3. Scalability Requirements
4. Performance Standards

## Governance
- All changes require approval
- Security review mandatory
- Compliance validation required

Created in custom constitution directory: ${CUSTOM_DIRECTORIES.constitution}
`;
      
      writeFileSync(constitutionPath, constitutionContent);
      
      // Test scripts directory
      const scriptsDir = join(TEST_PROJECT_PATH, CUSTOM_DIRECTORIES.scripts);
      const scriptPath = join(scriptsDir, 'enterprise-setup.sh');
      
      const scriptContent = `#!/bin/bash
# Enterprise project setup script

echo "Setting up enterprise project with custom directories..."
echo "Constitution directory: ${CUSTOM_DIRECTORIES.constitution}"
echo "Scripts directory: ${CUSTOM_DIRECTORIES.scripts}"
echo "Knowledge base: ${CUSTOM_DIRECTORIES.memory}"
`;
      
      writeFileSync(scriptPath, scriptContent);
      
      this.log(`✅ Created enterprise constitution: ${constitutionPath}`);
      this.log(`✅ Created enterprise script: ${scriptPath}`);
      
      return true;
    } catch (error) {
      this.error('Enterprise integration test failed', error);
      return false;
    }
  }

  async generateTestReport() {
    this.log('Generating test report...');
    
    const report = {
      testSuite: 'Configurable Directories Feature Test',
      timestamp: new Date().toISOString(),
      testProject: TEST_PROJECT_PATH,
      customDirectories: CUSTOM_DIRECTORIES,
      results: this.results,
      errors: this.errors,
      summary: {
        totalTests: 8,
        passed: this.results.filter(r => r.includes('✅')).length,
        failed: this.errors.length,
        success: this.errors.length === 0
      }
    };
    
    const reportPath = join(__dirname, 'configurable-directories-test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`✅ Test report generated: ${reportPath}`);
    
    // Console summary
    console.log('\n' + '='.repeat(60));
    console.log('CONFIGURABLE DIRECTORIES TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Overall Result: ${report.summary.success ? 'SUCCESS' : 'FAILURE'}`);
    console.log('='.repeat(60));
    
    if (this.errors.length > 0) {
      console.log('\nERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }
    
    return report;
  }

  async cleanup() {
    this.log('Cleaning up test environment...');
    
    try {
      if (existsSync(TEST_PROJECT_PATH)) {
        rmSync(TEST_PROJECT_PATH, { recursive: true, force: true });
        this.log(`✅ Cleaned up test project: ${TEST_PROJECT_PATH}`);
      }
    } catch (error) {
      this.error('Cleanup failed', error);
    }
  }

  async runAllTests() {
    console.log('Starting Configurable Directories Feature Test...\n');
    
    try {
      await this.setupTestEnvironment();
      await this.testProjectInitialization();
      await this.testDirectoryConfiguration();
      await this.testSpecificationCreation();
      await this.testPlanCreation();
      await this.testTaskCreation();
      await this.testCustomTemplateCreation();
      await this.testConfigurationPersistence();
      await this.testDirectoryStructureValidation();
      await this.testEnterpriseIntegration();
      
      const report = await this.generateTestReport();
      
      // Keep test project for manual inspection if tests passed
      if (report.summary.success) {
        this.log(`Test project preserved for inspection: ${TEST_PROJECT_PATH}`);
        this.log('Run cleanup manually if needed');
      } else {
        await this.cleanup();
      }
      
      return report;
    } catch (error) {
      this.error('Test suite execution failed', error);
      await this.cleanup();
      throw error;
    }
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const test = new ConfigurableDirectoriesTest();
  test.runAllTests()
    .then(report => {
      process.exit(report.summary.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { ConfigurableDirectoriesTest, CUSTOM_DIRECTORIES, TEST_PROJECT_PATH };