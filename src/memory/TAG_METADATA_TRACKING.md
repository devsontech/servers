# Tag and Metadata Key Tracking Features

This document explains the new features for tracking and discovering all tags and metadata keys used in your memory system.

## 🏷️ **New Tools Added**

### 1. `get_available_tags`
Get all tags currently used across all entities with usage statistics.

**Returns:**
```json
{
  "tags": ["javascript", "react", "performance", "bug", "solution"],
  "tagCounts": {
    "javascript": 15,
    "react": 8,
    "performance": 5,
    "bug": 12,
    "solution": 10
  }
}
```

**Use cases:**
- Discover what tags are available for search
- Find popular tags for consistency
- Analyze tag usage patterns

### 2. `get_available_metadata_keys`
Get all metadata keys currently used across all entities with examples.

**Returns:**
```json
{
  "metadataKeys": ["language", "framework", "complexity", "status", "author"],
  "keyCounts": {
    "language": 25,
    "framework": 15,
    "complexity": 10,
    "status": 8,
    "author": 5
  },
  "keyExamples": {
    "language": ["javascript", "typescript", "python"],
    "framework": ["react", "vue", "angular"],
    "complexity": ["simple", "intermediate", "advanced"],
    "status": ["active", "deprecated", "experimental"],
    "author": ["john_doe", "jane_smith"]
  }
}
```

**Features:**
- **Nested key support**: Tracks keys like `config.database.host`
- **Usage statistics**: See how often each key is used
- **Value examples**: Up to 3 example values for each key
- **Discoverability**: Find all available metadata structure

### 3. `get_memory_stats`
Get comprehensive statistics about your entire memory system.

**Returns:**
```json
{
  "totalEntities": 147,
  "totalRelations": 89,
  "totalTags": 23,
  "totalMetadataKeys": 15,
  "entityTypeBreakdown": {
    "code_snippet": 45,
    "problem_solution": 32,
    "best_practice": 28,
    "architecture_decision": 15,
    "meeting_notes": 12
  },
  "relationTypeBreakdown": {
    "relates_to": 34,
    "implements": 22,
    "depends_on": 18,
    "solves": 15
  },
  "averageObservationsPerEntity": 2.3,
  "entitiesWithMetadata": 134
}
```

**Insights provided:**
- Overall memory health and size
- Distribution of entity types
- Metadata adoption rate
- Relationship patterns
- Content density (observations per entity)

## 🔄 **Automatic Tracking**

### **When Tags Are Updated:**
- ✅ **Entity creation** - Tags extracted from new entities
- ✅ **Metadata updates** - New tags discovered in metadata changes
- ✅ **Real-time tracking** - No manual refresh needed

### **Tag Sources:**
1. **Entity types** - Automatically become tags
2. **metadata.tags** - Explicit tag arrays
3. **Common fields** - language, framework, category, etc.
4. **Nested metadata** - Any string values in metadata objects

### **Metadata Key Tracking:**
- ✅ **Flat keys** - Direct metadata properties
- ✅ **Nested keys** - Deep object paths (e.g., `config.database.host`)
- ✅ **Array handling** - Extracts values from arrays
- ✅ **Type awareness** - Handles strings, numbers, booleans

## 📊 **Usage Examples**

### **Discover Available Tags for Search:**
```bash
# Get all available tags
AI: "What tags are available in memory?"
→ Shows all 23 tags with usage counts

# Use tags for targeted search
AI: "Search for entities with 'react' and 'performance' tags"
→ Uses search_by_tags with discovered tags
```

### **Explore Metadata Structure:**
```bash
# See what metadata keys exist
AI: "What metadata keys are being used?"
→ Shows keys like "language", "complexity", "framework"

# Create consistent metadata
AI: "Create an entity with standard metadata keys"
→ Uses discovered keys for consistency
```

### **Memory Analytics:**
```bash
# Get overview of memory usage
AI: "Give me statistics about my memory"
→ Shows comprehensive stats and insights

# Identify patterns
AI: "What are my most common entity types?"
→ Analyzes entity type breakdown
```

## 🎯 **Benefits for Development**

### **1. Discoverability**
- **Tag exploration**: See what tags exist before searching
- **Metadata consistency**: Use existing keys for new entities
- **Pattern recognition**: Identify common structures

### **2. Organization**
- **Standardization**: Consistent tag and metadata usage
- **Cleanup opportunities**: Identify unused or duplicate keys
- **Evolution tracking**: See how your memory grows over time

### **3. Search Enhancement**
- **Better queries**: Use actual available tags
- **Targeted searches**: Combine popular tags effectively
- **Metadata filtering**: Search by known metadata keys

### **4. Analytics & Insights**
- **Usage patterns**: Which tags/keys are most valuable
- **Memory health**: How well-structured is your knowledge
- **Growth tracking**: Monitor memory expansion over time

## 🔧 **Integration with Existing Features**

### **Works with Tag-Based Search:**
```json
// First discover available tags
{"tool": "get_available_tags"}
// Returns: ["javascript", "react", "performance", "bug"]

// Then use for precise search
{
  "tool": "search_by_tags",
  "requiredTags": ["javascript", "performance"],
  "excludeTags": ["bug"]
}
```

### **Enhanced Metadata Updates:**
```json
// Discover existing metadata structure
{"tool": "get_available_metadata_keys"}
// Returns keys like "complexity", "status", "framework"

// Create consistent entities
{
  "tool": "create_entities",
  "entities": [{
    "name": "New React Pattern",
    "entityType": "code_snippet", 
    "metadata": {
      "complexity": "intermediate",  // Using discovered key
      "status": "active",           // Using discovered key
      "framework": "react"          // Using discovered key
    }
  }]
}
```

## 📈 **Monitoring & Maintenance**

### **Regular Health Checks:**
- Use `get_memory_stats` to monitor memory growth
- Check `entitiesWithMetadata` ratio for metadata adoption
- Review `averageObservationsPerEntity` for content richness

### **Cleanup Opportunities:**
- Identify rarely used tags for potential removal
- Find inconsistent metadata keys (e.g., "lang" vs "language")
- Spot entities without metadata that could be enhanced

### **Evolution Tracking:**
- Monitor how tag vocabulary grows over time
- Track which metadata patterns become standard
- Identify successful organizational approaches

This tracking system transforms your memory from a black box into a transparent, discoverable knowledge base that grows smarter with every addition!
