# Enhanced Tag-Based Search Examples

This document shows how to use the new `search_by_tags` feature with various tag combinations.

## Basic Usage Examples

### 1. Find entities with specific required tags
```json
{
  "requiredTags": ["javascript", "react"],
  "mode": "AND"
}
```
**Result**: Entities that have BOTH "javascript" AND "react" tags

### 2. Find entities with any of the optional tags
```json
{
  "optionalTags": ["bug", "performance", "optimization"],
  "mode": "OR"
}
```
**Result**: Entities that have ANY of "bug", "performance", or "optimization" tags

### 3. Exclude certain types of entities
```json
{
  "requiredTags": ["code_snippet"],
  "excludeTags": ["deprecated", "obsolete"]
}
```
**Result**: Code snippets that are NOT deprecated or obsolete

## Advanced Search Combinations

### 4. Complex multi-criteria search
```json
{
  "requiredTags": ["javascript"],
  "optionalTags": ["react", "vue", "angular"],
  "excludeTags": ["legacy"],
  "mode": "OR"
}
```
**Result**: JavaScript entities using ANY modern framework (React, Vue, or Angular) but NOT legacy code

### 5. Problem-solution filtering
```json
{
  "requiredTags": ["problem_solution", "authentication"],
  "optionalTags": ["jwt", "oauth", "session"],
  "mode": "OR"
}
```
**Result**: Authentication problem-solutions using any common auth method

### 6. Language-specific patterns
```json
{
  "requiredTags": ["typescript", "pattern"],
  "optionalTags": ["singleton", "factory", "observer"],
  "mode": "OR"
}
```
**Result**: TypeScript design patterns

## Real-World Use Cases

### Use Case 1: Finding Reusable Code
```json
{
  "requiredTags": ["code_snippet", "reusable"],
  "optionalTags": ["react", "utility", "helper"],
  "excludeTags": ["project_specific"],
  "mode": "OR"
}
```

### Use Case 2: Debugging Similar Issues
```json
{
  "requiredTags": ["problem_solution"],
  "optionalTags": ["cors", "authentication", "database"],
  "excludeTags": ["resolved"],
  "mode": "OR"
}
```

### Use Case 3: Technology Stack Analysis
```json
{
  "requiredTags": ["architecture"],
  "optionalTags": ["microservices", "monolith", "serverless"],
  "mode": "OR"
}
```

### Use Case 4: Performance Optimization Research
```json
{
  "requiredTags": ["performance"],
  "optionalTags": ["optimization", "bottleneck", "caching"],
  "excludeTags": ["theoretical"],
  "mode": "OR"
}
```

## Tag Discovery Tips

### Tags are automatically extracted from:
1. **Entity Type**: Automatically becomes a tag
2. **Metadata.tags**: Explicit tag arrays
3. **Common fields**: category, type, language, framework, technology, domain, status
4. **Array values**: Any string arrays in metadata

### Example entity with rich tagging:
```json
{
  "name": "React useEffect Performance Pattern",
  "entityType": "code_snippet",
  "observations": ["Optimized useEffect pattern for better performance"],
  "metadata": {
    "tags": ["react", "hooks", "performance", "optimization"],
    "language": "typescript",
    "framework": "react",
    "complexity": "intermediate",
    "category": "pattern",
    "domain": "frontend"
  }
}
```

**Extracted tags**: `code_snippet`, `react`, `hooks`, `performance`, `optimization`, `typescript`, `intermediate`, `pattern`, `frontend`

## Search Strategy Tips

### 1. Start broad, then narrow
```json
// First: Find all React-related content
{"requiredTags": ["react"]}

// Then: Narrow to performance issues
{"requiredTags": ["react", "performance"]}

// Finally: Exclude outdated solutions
{"requiredTags": ["react", "performance"], "excludeTags": ["deprecated"]}
```

### 2. Use OR mode for discovery
```json
// Explore different solution approaches
{
  "requiredTags": ["authentication"],
  "optionalTags": ["jwt", "oauth", "session", "cookies"],
  "mode": "OR"
}
```

### 3. Use AND mode for precision
```json
// Find specific combinations
{
  "requiredTags": ["typescript", "testing"],
  "optionalTags": ["jest", "unit_test"],
  "mode": "AND"
}
```

## Integration with Other Features

The tag-based search works seamlessly with:
- **Metadata search**: Tags enhance discoverability
- **Temporal search**: Combine with time-based filters
- **Relationship exploration**: Follow connections from tagged entities
- **Auto-tagging**: Automatically populate tags for better search

## Best Practices

1. **Consistent tagging**: Use standardized tag names (e.g., "javascript" not "js" or "JavaScript")
2. **Multiple tag types**: Mix language, framework, concept, and domain tags
3. **Regular cleanup**: Remove obsolete or duplicate tags
4. **Tag hierarchies**: Use broad → specific tagging (e.g., "frontend" → "react" → "hooks")
