import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { DependencyNode, DependencyGraph } from '../core/types.js';

export class DependencyAnalyzer {
  private packageJsonCache = new Map<string, any>();

  async buildDependencyGraph(
    projectPath: string,
    includeExternal: boolean = true,
    detectCircular: boolean = true,
    maxDepth: number = 5
  ): Promise<DependencyGraph> {
    const nodes: DependencyNode[] = [];
    const edges: Array<{ from: string; to: string; type: string; weight: number }> = [];
    const processedFiles = new Set<string>();

    // Find all package.json files
    const packageFiles = await glob('**/package.json', {
      cwd: projectPath,
      absolute: true,
      ignore: ['node_modules/**'],
    });

    // Process each package.json to build initial dependency map
    const packageDependencies = new Map<string, Set<string>>();
    
    for (const pkgFile of packageFiles) {
      try {
        const pkgContent = JSON.parse(await fs.readFile(pkgFile, 'utf-8'));
        const pkgName = pkgContent.name || path.basename(path.dirname(pkgFile));
        const deps = new Set<string>();

        // Add various dependency types
        const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
        for (const depType of depTypes) {
          if (pkgContent[depType]) {
            Object.keys(pkgContent[depType]).forEach(dep => deps.add(dep));
          }
        }

        packageDependencies.set(pkgName, deps);
        this.packageJsonCache.set(pkgFile, pkgContent);

        // Create node for this package
        nodes.push({
          name: pkgName,
          version: pkgContent.version || '0.0.0',
          type: 'internal',
          path: path.dirname(pkgFile),
          dependencies: Array.from(deps),
          dependents: [],
          cyclic: false,
          weight: 1,
        });
      } catch (error) {
        console.warn(`Failed to parse package.json at ${pkgFile}:`, error);
      }
    }

    // Build module-level dependencies by analyzing import statements
    const moduleFiles = await glob('**/*.{ts,js,mts,mjs}', {
      cwd: projectPath,
      absolute: true,
      ignore: ['node_modules/**', '**/*.test.*', '**/*.spec.*'],
    });

    const moduleDependencies = new Map<string, Set<string>>();

    for (const moduleFile of moduleFiles) {
      if (processedFiles.has(moduleFile)) continue;
      processedFiles.add(moduleFile);

      try {
        const content = await fs.readFile(moduleFile, 'utf-8');
        const imports = this.extractImports(content);
        const relativePath = path.relative(projectPath, moduleFile);
        
        moduleDependencies.set(relativePath, new Set(imports));

        // Create node for this module
        const existingNode = nodes.find(n => n.path === relativePath);
        if (!existingNode) {
          nodes.push({
            name: relativePath,
            type: 'internal',
            path: relativePath,
            dependencies: imports,
            dependents: [],
            cyclic: false,
            weight: 1,
          });
        }
      } catch (error) {
        console.warn(`Failed to analyze module ${moduleFile}:`, error);
      }
    }

    // Build edges and calculate dependents
    for (const [moduleName, deps] of moduleDependencies) {
      for (const dep of deps) {
        const depType = this.classifyDependency(dep, projectPath);
        
        if (!includeExternal && depType === 'external') continue;

        edges.push({
          from: moduleName,
          to: dep,
          type: depType,
          weight: 1,
        });

        // Update dependents
        const targetNode = nodes.find(n => n.name === dep || n.path === dep);
        if (targetNode) {
          targetNode.dependents.push(moduleName);
        } else if (includeExternal) {
          // Create external dependency node
          nodes.push({
            name: dep,
            type: 'external',
            dependencies: [],
            dependents: [moduleName],
            cyclic: false,
            weight: 1,
          });
        }
      }
    }

    // Detect circular dependencies
    const cycles: string[][] = [];
    if (detectCircular) {
      cycles.push(...this.detectCycles(nodes, edges));
      
      // Mark cyclic nodes
      for (const cycle of cycles) {
        for (const nodeName of cycle) {
          const node = nodes.find(n => n.name === nodeName || n.path === nodeName);
          if (node) {
            node.cyclic = true;
          }
        }
      }
    }

    // Calculate metrics
    const fanIn: Record<string, number> = {};
    const fanOut: Record<string, number> = {};
    
    for (const node of nodes) {
      fanIn[node.name] = node.dependents.length;
      fanOut[node.name] = node.dependencies.length;
    }

    const externalDeps = nodes.filter(n => n.type === 'external').length;
    const maxDepthFound = this.calculateMaxDepth(nodes, edges);

    return {
      nodes,
      edges,
      cycles,
      metrics: {
        totalDependencies: nodes.length,
        externalDependencies: externalDeps,
        depth: maxDepthFound,
        fanIn,
        fanOut,
      },
    };
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    
    // ES6 import statements
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }

    // CommonJS require statements
    const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }

    // Dynamic imports
    const dynamicImportRegex = /import\(['"`]([^'"`]+)['"`]\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }

    return [...new Set(imports)]; // Remove duplicates
  }

  private classifyDependency(dep: string, projectPath: string): 'internal' | 'external' | 'builtin' {
    // Built-in Node.js modules
    const builtinModules = [
      'fs', 'path', 'http', 'https', 'url', 'os', 'crypto', 'events', 'stream',
      'util', 'querystring', 'zlib', 'buffer', 'child_process', 'cluster',
      'dns', 'net', 'tls', 'vm', 'worker_threads', 'async_hooks'
    ];

    if (builtinModules.includes(dep)) {
      return 'builtin';
    }

    // Relative imports are internal
    if (dep.startsWith('.') || dep.startsWith('/')) {
      return 'internal';
    }

    // Check if it's a workspace package
    const packageNames = Array.from(this.packageJsonCache.values()).map(pkg => pkg.name).filter(Boolean);
    if (packageNames.includes(dep)) {
      return 'internal';
    }

    // Check if it starts with a workspace path
    const workspacePaths = Array.from(this.packageJsonCache.keys()).map(p => path.dirname(p));
    for (const wsPath of workspacePaths) {
      const relativePath = path.relative(projectPath, wsPath);
      if (dep.startsWith(relativePath) || dep.startsWith('@' + relativePath)) {
        return 'internal';
      }
    }

    return 'external';
  }

  private detectCycles(nodes: DependencyNode[], edges: Array<{ from: string; to: string }>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const edgeMap = new Map<string, string[]>();

    // Build adjacency list
    for (const edge of edges) {
      if (!edgeMap.has(edge.from)) {
        edgeMap.set(edge.from, []);
      }
      edgeMap.get(edge.from)?.push(edge.to);
    }

    const findCycleDFS = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = edgeMap.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          findCycleDFS(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            const cycle = path.slice(cycleStart);
            cycles.push([...cycle, neighbor]); // Close the cycle
          }
        }
      }

      recursionStack.delete(node);
    };

    // Run DFS from each unvisited node
    for (const node of nodes) {
      const nodeId = node.name || node.path || '';
      if (!visited.has(nodeId)) {
        findCycleDFS(nodeId, []);
      }
    }

    return cycles;
  }

  private calculateMaxDepth(nodes: DependencyNode[], edges: Array<{ from: string; to: string }>): number {
    const edgeMap = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const node of nodes) {
      const nodeId = node.name || node.path || '';
      inDegree.set(nodeId, 0);
      edgeMap.set(nodeId, []);
    }

    // Build adjacency list and calculate in-degrees
    for (const edge of edges) {
      edgeMap.get(edge.from)?.push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    // Topological sort with depth tracking
    const queue: Array<{ node: string; depth: number }> = [];
    let maxDepth = 0;

    // Find all nodes with no incoming edges
    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        queue.push({ node, depth: 1 });
      }
    }

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;
      maxDepth = Math.max(maxDepth, depth);

      const neighbors = edgeMap.get(node) || [];
      for (const neighbor of neighbors) {
        const newInDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newInDegree);

        if (newInDegree === 0) {
          queue.push({ node: neighbor, depth: depth + 1 });
        }
      }
    }

    return maxDepth;
  }

  // Additional analysis methods
  async analyzeDependencyRisks(graph: DependencyGraph): Promise<{
    highRisk: DependencyNode[];
    outdated: DependencyNode[];
    unused: DependencyNode[];
    heavyDependencies: DependencyNode[];
  }> {
    const highRisk: DependencyNode[] = [];
    const outdated: DependencyNode[] = [];
    const unused: DependencyNode[] = [];
    const heavyDependencies: DependencyNode[] = [];

    for (const node of graph.nodes) {
      // High risk: external dependencies with many dependents
      if (node.type === 'external' && node.dependents.length > 5) {
        highRisk.push(node);
      }

      // Heavy dependencies: nodes with many dependencies
      if (node.dependencies.length > 20) {
        heavyDependencies.push(node);
      }

      // Unused: internal modules with no dependents
      if (node.type === 'internal' && node.dependents.length === 0 && node.dependencies.length === 0) {
        unused.push(node);
      }

      // Note: For outdated detection, you'd typically need to check against a registry
      // This is a simplified version
      if (node.version && node.version.startsWith('0.')) {
        outdated.push(node);
      }
    }

    return { highRisk, outdated, unused, heavyDependencies };
  }
}