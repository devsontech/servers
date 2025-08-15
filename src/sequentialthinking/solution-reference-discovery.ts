#!/usr/bin/env node
/**
 * Solution Reference Discovery Tool
 * Analyzes .sln files to discover all projects, references, and dependencies
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

// Simple XML parser for .csproj files
interface XmlNode {
  [key: string]: any;
  $?: { [attr: string]: string };
}

interface ProjectReference {
  projectPath: string;
  projectName: string;
  projectType: string;
  targetFramework: string;
  packageReferences: PackageReference[];
  projectReferences: string[];
  sourceFiles: string[];
  outputPath: string;
}

interface PackageReference {
  name: string;
  version: string;
  type: 'PackageReference' | 'ProjectReference' | 'Reference';
}

interface SolutionAnalysis {
  solutionPath: string;
  solutionName: string;
  projects: ProjectReference[];
  dependencyGraph: Map<string, string[]>;
  allSourceFiles: string[];
  packageDependencies: Map<string, string[]>;
  buildOrder: string[];
}

class SolutionReferenceDiscovery {
  private solutionPath: string = '';
  private solutionDir: string = '';

  /**
   * Analyze a complete .NET solution file
   */
  async analyzeSolution(solutionPath: string): Promise<SolutionAnalysis> {
    this.solutionPath = path.resolve(solutionPath);
    this.solutionDir = path.dirname(this.solutionPath);

    if (!fs.existsSync(this.solutionPath)) {
      throw new Error(`Solution file not found: ${this.solutionPath}`);
    }

    console.log(`🔍 Analyzing solution: ${this.solutionPath}`);

    // Parse solution file
    const projects = await this.parseSolutionFile();
    
    // Analyze each project
    const projectAnalyses = await Promise.all(
      projects.map(proj => this.analyzeProject(proj.projectPath, proj.projectName))
    );

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(projectAnalyses);
    
    // Get build order
    const buildOrder = this.calculateBuildOrder(dependencyGraph);

    // Collect all source files
    const allSourceFiles = projectAnalyses.flatMap(p => p.sourceFiles);

    // Build package dependency map
    const packageDependencies = this.buildPackageDependencyMap(projectAnalyses);

    return {
      solutionPath: this.solutionPath,
      solutionName: path.basename(this.solutionPath, '.sln'),
      projects: projectAnalyses,
      dependencyGraph,
      allSourceFiles,
      packageDependencies,
      buildOrder
    };
  }

  /**
   * Parse .sln file to extract project information
   */
  private async parseSolutionFile(): Promise<{ projectName: string; projectPath: string; projectGuid: string }[]> {
    const solutionContent = fs.readFileSync(this.solutionPath, 'utf-8');
    const projects = [];

    // Parse project entries from solution file
    const projectRegex = /Project\("([^"]+)"\) = "([^"]+)", "([^"]+)", "([^"]+)"/g;
    let match;

    while ((match = projectRegex.exec(solutionContent)) !== null) {
      const [, projectTypeGuid, projectName, relativePath, projectGuid] = match;
      
      // Skip solution folders
      if (projectTypeGuid === '{2150E333-8FDC-42A3-9474-1A3956D46DE8}') {
        continue;
      }

      const projectPath = path.resolve(this.solutionDir, relativePath);
      
      if (fs.existsSync(projectPath)) {
        projects.push({
          projectName,
          projectPath,
          projectGuid
        });
      }
    }

    console.log(`📁 Found ${projects.length} projects in solution`);
    return projects;
  }

  /**
   * Simple XML parser for .csproj files (avoiding external dependencies)
   */
  private parseProjectXml(xmlContent: string): any {
    // Simple regex-based XML parsing for .csproj structure
    const result: any = { PropertyGroup: [], ItemGroup: [] };
    
    // Extract PropertyGroups
    const propertyGroupRegex = /<PropertyGroup[^>]*>([\s\S]*?)<\/PropertyGroup>/gi;
    let match;
    
    while ((match = propertyGroupRegex.exec(xmlContent)) !== null) {
      const groupContent = match[1];
      const properties: any = {};
      
      // Extract individual properties
      const propRegex = /<(\w+)>([^<]+)<\/\1>/gi;
      let propMatch;
      
      while ((propMatch = propRegex.exec(groupContent)) !== null) {
        properties[propMatch[1]] = propMatch[2];
      }
      
      result.PropertyGroup.push(properties);
    }
    
    // Extract ItemGroups
    const itemGroupRegex = /<ItemGroup[^>]*>([\s\S]*?)<\/ItemGroup>/gi;
    
    while ((match = itemGroupRegex.exec(xmlContent)) !== null) {
      const groupContent = match[1];
      const items: any = {};
      
      // Extract PackageReferences
      const pkgRefRegex = /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"\s*\/?>|<PackageReference\s+Include="([^"]+)"[^>]*>\s*<Version>([^<]+)<\/Version>/gi;
      let pkgMatch;
      const packageRefs = [];
      
      while ((pkgMatch = pkgRefRegex.exec(groupContent)) !== null) {
        const include = pkgMatch[1] || pkgMatch[3];
        const version = pkgMatch[2] || pkgMatch[4];
        packageRefs.push({ $: { Include: include, Version: version } });
      }
      
      if (packageRefs.length > 0) {
        items.PackageReference = packageRefs;
      }
      
      // Extract ProjectReferences
      const projRefRegex = /<ProjectReference\s+Include="([^"]+)"/gi;
      let projMatch;
      const projectRefs = [];
      
      while ((projMatch = projRefRegex.exec(groupContent)) !== null) {
        projectRefs.push({ $: { Include: projMatch[1] } });
      }
      
      if (projectRefs.length > 0) {
        items.ProjectReference = projectRefs;
      }
      
      if (Object.keys(items).length > 0) {
        result.ItemGroup.push(items);
      }
    }
    
    return { Project: result };
  }

  /**
   * Analyze a single project file (.csproj, .vbproj, etc.)
   */
  private async analyzeProject(projectPath: string, projectName: string): Promise<ProjectReference> {
    console.log(`📋 Analyzing project: ${projectName}`);
    
    const projectDir = path.dirname(projectPath);
    const projectContent = fs.readFileSync(projectPath, 'utf-8');
    
    // Parse XML using our simple parser
    const projectXml = this.parseProjectXml(projectContent);
    
    const project = projectXml.Project;
    
    // Extract target framework
    const targetFramework = this.extractTargetFramework(project);
    
    // Extract package references
    const packageReferences = this.extractPackageReferences(project);
    
    // Extract project references
    const projectReferences = this.extractProjectReferences(project, projectDir);
    
    // Find source files
    const sourceFiles = await this.findSourceFiles(projectDir, targetFramework);
    
    // Determine output path
    const outputPath = this.determineOutputPath(project, projectDir, targetFramework);
    
    return {
      projectPath,
      projectName,
      projectType: this.determineProjectType(project, sourceFiles),
      targetFramework,
      packageReferences,
      projectReferences,
      sourceFiles,
      outputPath
    };
  }

  private extractTargetFramework(project: any): string {
    const propertyGroups = project.PropertyGroup || [];
    
    for (const group of propertyGroups) {
      if (group.TargetFramework) {
        return Array.isArray(group.TargetFramework) ? group.TargetFramework[0] : group.TargetFramework;
      }
      if (group.TargetFrameworks) {
        const frameworks = Array.isArray(group.TargetFrameworks) ? group.TargetFrameworks[0] : group.TargetFrameworks;
        return frameworks.split(';')[0]; // Return first framework
      }
    }
    
    return 'unknown';
  }

  private extractPackageReferences(project: any): PackageReference[] {
    const references: PackageReference[] = [];
    const itemGroups = project.ItemGroup || [];
    
    for (const group of itemGroups) {
      // PackageReference
      if (group.PackageReference) {
        const packages = Array.isArray(group.PackageReference) ? group.PackageReference : [group.PackageReference];
        for (const pkg of packages) {
          references.push({
            name: pkg.$.Include,
            version: pkg.$.Version || 'latest',
            type: 'PackageReference'
          });
        }
      }
      
      // Reference (legacy)
      if (group.Reference) {
        const refs = Array.isArray(group.Reference) ? group.Reference : [group.Reference];
        for (const ref of refs) {
          references.push({
            name: ref.$.Include,
            version: 'unknown',
            type: 'Reference'
          });
        }
      }
    }
    
    return references;
  }

  private extractProjectReferences(project: any, projectDir: string): string[] {
    const references: string[] = [];
    const itemGroups = project.ItemGroup || [];
    
    for (const group of itemGroups) {
      if (group.ProjectReference) {
        const projRefs = Array.isArray(group.ProjectReference) ? group.ProjectReference : [group.ProjectReference];
        for (const ref of projRefs) {
          const refPath = path.resolve(projectDir, ref.$.Include);
          references.push(refPath);
        }
      }
    }
    
    return references;
  }

  private async findSourceFiles(projectDir: string, targetFramework: string): Promise<string[]> {
    const sourceFiles: string[] = [];
    const extensions = ['.cs', '.vb', '.fs', '.razor', '.cshtml'];
    
    const findFiles = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip common non-source directories
          if (['bin', 'obj', 'node_modules', '.vs', '.git'].includes(item)) {
            continue;
          }
          findFiles(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          sourceFiles.push(fullPath);
        }
      }
    };
    
    findFiles(projectDir);
    return sourceFiles;
  }

  private determineOutputPath(project: any, projectDir: string, targetFramework: string): string {
    const propertyGroups = project.PropertyGroup || [];
    
    for (const group of propertyGroups) {
      if (group.OutputPath) {
        const outputPath = Array.isArray(group.OutputPath) ? group.OutputPath[0] : group.OutputPath;
        return path.resolve(projectDir, outputPath);
      }
    }
    
    // Default output path
    return path.join(projectDir, 'bin', 'Debug', targetFramework);
  }

  private determineProjectType(project: any, sourceFiles: string[]): string {
    const propertyGroups = project.PropertyGroup || [];
    
    // Check SDK style
    const projectElement = project.$;
    if (projectElement && projectElement.Sdk) {
      if (projectElement.Sdk.includes('Web')) return 'ASP.NET Core Web';
      if (projectElement.Sdk.includes('Worker')) return 'Worker Service';
      return 'SDK Style';
    }
    
    // Check output type
    for (const group of propertyGroups) {
      if (group.OutputType) {
        const outputType = Array.isArray(group.OutputType) ? group.OutputType[0] : group.OutputType;
        if (outputType === 'Exe') return 'Console Application';
        if (outputType === 'Library') return 'Class Library';
        if (outputType === 'WinExe') return 'Windows Application';
      }
    }
    
    // Infer from source files
    if (sourceFiles.some(f => f.includes('Program.cs'))) return 'Console/Web Application';
    if (sourceFiles.some(f => f.endsWith('.razor') || f.endsWith('.cshtml'))) return 'Web Application';
    
    return 'Class Library';
  }

  private buildDependencyGraph(projects: ProjectReference[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const project of projects) {
      const dependencies = project.projectReferences.map(refPath => {
        // Find project name by path
        const dep = projects.find(p => p.projectPath === refPath);
        return dep ? dep.projectName : path.basename(refPath, path.extname(refPath));
      });
      
      graph.set(project.projectName, dependencies);
    }
    
    return graph;
  }

  private calculateBuildOrder(dependencyGraph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];
    
    const visit = (project: string) => {
      if (visiting.has(project)) {
        throw new Error(`Circular dependency detected involving: ${project}`);
      }
      
      if (visited.has(project)) {
        return;
      }
      
      visiting.add(project);
      
      const dependencies = dependencyGraph.get(project) || [];
      for (const dep of dependencies) {
        visit(dep);
      }
      
      visiting.delete(project);
      visited.add(project);
      result.push(project);
    };
    
    for (const project of dependencyGraph.keys()) {
      visit(project);
    }
    
    return result;
  }

  private buildPackageDependencyMap(projects: ProjectReference[]): Map<string, string[]> {
    const packageMap = new Map<string, string[]>();
    
    for (const project of projects) {
      const packages = project.packageReferences.map(pkg => `${pkg.name}@${pkg.version}`);
      packageMap.set(project.projectName, packages);
    }
    
    return packageMap;
  }

  /**
   * Find all usages of a symbol across the solution
   */
  async findSymbolReferences(solutionAnalysis: SolutionAnalysis, symbolName: string): Promise<any> {
    console.log(`🔍 Searching for symbol: ${symbolName}`);
    
    interface SymbolReference {
      file: string;
      line: number;
      content: string;
      project: string;
    }
    
    const references: SymbolReference[] = [];
    
    for (const sourceFile of solutionAnalysis.allSourceFiles) {
      try {
        const content = fs.readFileSync(sourceFile, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes(symbolName)) {
            references.push({
              file: sourceFile,
              line: index + 1,
              content: line.trim(),
              project: this.findProjectForFile(solutionAnalysis, sourceFile)
            });
          }
        });
      } catch (error) {
        console.warn(`Could not read file: ${sourceFile}`);
      }
    }
    
    return {
      symbol: symbolName,
      totalReferences: references.length,
      references: references.slice(0, 100) // Limit to 100 results
    };
  }

  private findProjectForFile(solutionAnalysis: SolutionAnalysis, filePath: string): string {
    for (const project of solutionAnalysis.projects) {
      if (project.sourceFiles.includes(filePath)) {
        return project.projectName;
      }
    }
    return 'Unknown';
  }

  /**
   * Use dotnet CLI for advanced analysis
   */
  async getDotnetInfo(solutionPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const solutionDir = path.dirname(solutionPath);
      
      spawn('dotnet', ['sln', 'list'], { cwd: solutionDir })
        .on('close', (code) => {
          if (code === 0) {
            // Get more detailed info
            spawn('dotnet', ['list', 'package', '--include-transitive'], { cwd: solutionDir })
              .on('close', () => {
                resolve({ success: true });
              });
          } else {
            resolve({ success: false, error: 'dotnet CLI not available' });
          }
        });
    });
  }
}

// Server setup
const server = new Server(
  {
    name: 'solution-reference-discovery',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const discoveryTool = new SolutionReferenceDiscovery();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_solution',
        description: `Comprehensive .NET Solution Analysis with Full Reference Discovery

This tool provides complete analysis of .NET solution files (.sln), discovering:
- All projects and their types (Web, Console, Library, etc.)
- Package references and versions for each project
- Project-to-project dependencies and build order
- Complete source file inventory across all projects
- Dependency graph visualization
- Target frameworks and output configurations

Perfect for:
- Understanding large .NET solutions
- Dependency analysis and optimization
- Build order planning
- Architecture review and documentation
- Migration planning (framework upgrades)
- Security audit of package dependencies

Example usage:
{
  "solutionPath": "C:\\MyProject\\MyCompany.MyProduct.sln"
}`,
        inputSchema: {
          type: 'object',
          properties: {
            solutionPath: {
              type: 'string',
              description: 'Absolute path to the .sln solution file'
            }
          },
          required: ['solutionPath']
        }
      },
      {
        name: 'find_symbol_references',
        description: `Find All References to a Symbol Across the Entire Solution

Searches for class names, method names, properties, or any symbol across all source files in the solution.

Use cases:
- Find all usages of a class before refactoring
- Locate method implementations across projects
- Identify coupling between projects
- Impact analysis for changes
- Architecture documentation

Example:
{
  "solutionPath": "C:\\MyProject\\Solution.sln",
  "symbolName": "AuthService"
}`,
        inputSchema: {
          type: 'object',
          properties: {
            solutionPath: {
              type: 'string',
              description: 'Absolute path to the .sln solution file'
            },
            symbolName: {
              type: 'string',
              description: 'Symbol name to search for (class, method, property, etc.)'
            }
          },
          required: ['solutionPath', 'symbolName']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    if (!args) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing arguments');
    }

    switch (name) {
      case 'analyze_solution':
        const solutionPath = args.solutionPath as string;
        if (!solutionPath) {
          throw new McpError(ErrorCode.InvalidParams, 'solutionPath is required');
        }
        const analysis = await discoveryTool.analyzeSolution(solutionPath);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                summary: {
                  solution: analysis.solutionName,
                  projectCount: analysis.projects.length,
                  totalSourceFiles: analysis.allSourceFiles.length,
                  buildOrder: analysis.buildOrder
                },
                projects: analysis.projects.map(p => ({
                  name: p.projectName,
                  type: p.projectType,
                  framework: p.targetFramework,
                  sourceFiles: p.sourceFiles.length,
                  packageReferences: p.packageReferences.length,
                  projectReferences: p.projectReferences.length
                })),
                dependencyGraph: Object.fromEntries(analysis.dependencyGraph),
                packageDependencies: Object.fromEntries(analysis.packageDependencies),
                detailedProjects: analysis.projects
              }, null, 2)
            }
          ]
        };

      case 'find_symbol_references':
        const solutionPathForSearch = args.solutionPath as string;
        const symbolName = args.symbolName as string;
        if (!solutionPathForSearch || !symbolName) {
          throw new McpError(ErrorCode.InvalidParams, 'solutionPath and symbolName are required');
        }
        // First analyze the solution, then search for references
        const solutionAnalysis = await discoveryTool.analyzeSolution(solutionPathForSearch);
        const symbolRefs = await discoveryTool.findSymbolReferences(solutionAnalysis, symbolName);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(symbolRefs, null, 2)
            }
          ]
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Analysis failed: ${errorMessage}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Solution Reference Discovery MCP Server running...');
}

main().catch(console.error);
