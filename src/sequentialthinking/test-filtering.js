#!/usr/bin/env node

/**
 * Test script to demonstrate the new filtering capabilities
 * of the solution-reference-discovery tool
 */

const testCases = [
  {
    name: "Get only summary and projects overview",
    request: {
      solutionPath: "C:\\MyProject\\Solution.sln",
      include: ["summary", "projects"]
    },
    description: "Returns basic solution info and project overview without heavy details"
  },
  {
    name: "Get dependency analysis only",
    request: {
      solutionPath: "C:\\MyProject\\Solution.sln", 
      include: ["dependencyGraph", "packageDependencies"]
    },
    description: "Returns only dependency information for architecture analysis"
  },
  {
    name: "Get detailed info for specific projects",
    request: {
      solutionPath: "C:\\MyProject\\Solution.sln",
      include: ["detailedProjects"],
      projectFilter: ["MyProject.Core", "MyProject.Api"]
    },
    description: "Returns full details only for specified projects"
  },
  {
    name: "Get source files for specific projects",
    request: {
      solutionPath: "C:\\MyProject\\Solution.sln",
      include: ["allSourceFiles"],
      projectFilter: ["MyProject.Tests"]
    },
    description: "Returns source files only from the test project"
  },
  {
    name: "Full analysis (backward compatibility)",
    request: {
      solutionPath: "C:\\MyProject\\Solution.sln"
    },
    description: "Returns all information (same as before, maintains backward compatibility)"
  }
];

console.log("=".repeat(80));
console.log("SOLUTION REFERENCE DISCOVERY - FILTERING TEST CASES");
console.log("=".repeat(80));

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`   Description: ${testCase.description}`);
  console.log(`   Request:`)
  console.log(`   ${JSON.stringify(testCase.request, null, 6)}`);
  console.log("-".repeat(60));
});

console.log("\nAvailable include options:");
console.log("- summary: Basic solution info (name, project count, file count, build order)");
console.log("- projects: Project overview (name, type, framework, counts)");
console.log("- dependencyGraph: Project-to-project dependencies");
console.log("- packageDependencies: NuGet package dependencies per project");
console.log("- allSourceFiles: Complete list of source files");
console.log("- detailedProjects: Full project details including file lists and references");

console.log("\nProjectFilter usage:");
console.log("- Filters projects, detailedProjects, and allSourceFiles sections");
console.log("- Use exact project names as they appear in the solution");
console.log("- Can specify multiple projects in the array");
