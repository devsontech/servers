# Solution Reference Discovery - Filtering Guide

## Overview
The `analyze_solution` tool now supports flexible filtering to return only the data you need, making it much more efficient for large .NET solutions.

## New Parameters

### `include` (optional)
An array of strings specifying which sections to include in the response. If not provided, all sections are included.

**Available options:**
- `summary` - Basic solution information
- `projects` - Project overview with counts
- `dependencyGraph` - Project-to-project dependencies
- `packageDependencies` - NuGet package dependencies per project
- `allSourceFiles` - Complete list of source files
- `detailedProjects` - Full project details including file lists and references

### `projectFilter` (optional)
An array of project names to filter results to specific projects. Only affects these sections:
- `projects`
- `detailedProjects` 
- `allSourceFiles`
- `dependencyGraph`
- `packageDependencies`

## Response Sections

### summary
```json
{
  "summary": {
    "solution": "MySolution",
    "projectCount": 15,
    "totalSourceFiles": 342,
    "buildOrder": ["Core", "Api", "Tests"]
  }
}
```

### projects
```json
{
  "projects": [
    {
      "name": "MyProject.Core",
      "type": "Class Library",
      "framework": "net8.0",
      "sourceFiles": 25,
      "packageReferences": 8,
      "projectReferences": 0
    }
  ]
}
```

### dependencyGraph
```json
{
  "dependencyGraph": {
    "MyProject.Api": ["MyProject.Core"],
    "MyProject.Tests": ["MyProject.Core", "MyProject.Api"]
  }
}
```

### packageDependencies
```json
{
  "packageDependencies": {
    "MyProject.Core": [
      "Microsoft.Extensions.DependencyInjection@8.0.0",
      "Newtonsoft.Json@13.0.3"
    ]
  }
}
```

### allSourceFiles
```json
{
  "allSourceFiles": [
    "C:\\MyProject\\Core\\Models\\User.cs",
    "C:\\MyProject\\Core\\Services\\UserService.cs"
  ]
}
```

### detailedProjects
```json
{
  "detailedProjects": [
    {
      "projectPath": "C:\\MyProject\\Core\\MyProject.Core.csproj",
      "projectName": "MyProject.Core",
      "projectType": "Class Library",
      "targetFramework": "net8.0",
      "packageReferences": [...],
      "projectReferences": [...],
      "sourceFiles": [...],
      "outputPath": "C:\\MyProject\\Core\\bin\\Debug\\net8.0"
    }
  ]
}
```

## Usage Examples

### 1. Quick Overview (Summary + Projects)
```json
{
  "solutionPath": "C:\\MyProject\\Solution.sln",
  "include": ["summary", "projects"]
}
```
**Use case:** Get a quick overview of the solution structure without heavy details.

### 2. Dependency Analysis Only
```json
{
  "solutionPath": "C:\\MyProject\\Solution.sln",
  "include": ["dependencyGraph", "packageDependencies"]
}
```
**Use case:** Analyze dependencies for architecture review or migration planning.

### 3. Specific Project Details
```json
{
  "solutionPath": "C:\\MyProject\\Solution.sln",
  "include": ["detailedProjects"],
  "projectFilter": ["MyProject.Core", "MyProject.Api"]
}
```
**Use case:** Get complete details for only the core and API projects.

### 4. Test Project Source Files
```json
{
  "solutionPath": "C:\\MyProject\\Solution.sln",
  "include": ["allSourceFiles"],
  "projectFilter": ["MyProject.Tests"]
}
```
**Use case:** Get all test files for test coverage analysis.

### 5. Build Order and Dependencies
```json
{
  "solutionPath": "C:\\MyProject\\Solution.sln",
  "include": ["summary", "dependencyGraph"]
}
```
**Use case:** Plan build pipeline and understand project dependencies.

### 6. Package Audit for Specific Projects
```json
{
  "solutionPath": "C:\\MyProject\\Solution.sln",
  "include": ["packageDependencies"],
  "projectFilter": ["MyProject.Web", "MyProject.Api"]
}
```
**Use case:** Security audit of NuGet packages in web-facing projects.

## Performance Benefits

### Before (Full Response)
- **Large Enterprise Solution**: 50MB+ JSON response
- **Processing Time**: Significant overhead parsing all data
- **Network**: Heavy payload transfer

### After (Filtered Response)
- **Summary Only**: ~5KB response (1000x smaller)
- **Specific Projects**: ~500KB response (100x smaller)  
- **Targeted Analysis**: Only process needed data

## Backward Compatibility

The tool maintains full backward compatibility. Existing calls without filtering parameters will continue to work exactly as before, returning all information.

```json
{
  "solutionPath": "C:\\MyProject\\Solution.sln"
}
```
This still returns the complete analysis, same as the original implementation.

## Best Practices

1. **Start with Summary**: Always begin with `["summary", "projects"]` to understand the solution structure
2. **Progressive Detail**: Add more sections as needed rather than requesting everything upfront
3. **Project Filtering**: Use `projectFilter` when working with specific parts of large solutions
4. **Combine Wisely**: Combine related sections (e.g., `dependencyGraph` + `packageDependencies` for dependency analysis)
5. **Memory Considerations**: Avoid `allSourceFiles` for very large solutions unless specifically needed

## Migration from Full Analysis

If you're currently using the full analysis and want to optimize:

1. **Identify Use Case**: What information do you actually need?
2. **Test Filtering**: Start with relevant sections only
3. **Add as Needed**: Progressively add more sections if required
4. **Project Scope**: Use project filtering for focused analysis

This filtering system makes the tool much more efficient for large enterprise solutions while maintaining all the original functionality.
