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
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";

// Define memory file path using environment variable with fallback
const defaultMemoryPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'memory.json');

// If MEMORY_FILE_PATH is just a filename, put it in the same directory as the script
const MEMORY_FILE_PATH = process.env.MEMORY_FILE_PATH
  ? path.isAbsolute(process.env.MEMORY_FILE_PATH)
    ? process.env.MEMORY_FILE_PATH
    : path.join(path.dirname(fileURLToPath(import.meta.url)), process.env.MEMORY_FILE_PATH)
  : defaultMemoryPath;

// We are storing our memory using entities, relations, and observations in a graph structure
interface Entity {
  name: string;
  entityType: string;
  observations: string[];
  metadata?: Record<string, any>;
}

interface Relation {
  from: string;
  to: string;
  relationType: string;
}

interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

// The KnowledgeGraphManager class contains all operations to interact with the knowledge graph
class KnowledgeGraphManager {
  private async loadGraph(): Promise<KnowledgeGraph> {
    try {
      const data = await fs.readFile(MEMORY_FILE_PATH, "utf-8");
      const lines = data.split("\n").filter((line: string) => line.trim() !== "");
      return lines.reduce((graph: KnowledgeGraph, line: string) => {
        const item = JSON.parse(line);
        if (item.type === "entity") graph.entities.push(item as Entity);
        if (item.type === "relation") graph.relations.push(item as Relation);
        return graph;
      }, { entities: [], relations: [] });
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === "ENOENT") {
        return { entities: [], relations: [] };
      }
      throw error;
    }
  }

  private async saveGraph(graph: KnowledgeGraph): Promise<void> {
    const lines = [
      ...graph.entities.map(e => JSON.stringify({ type: "entity", ...e })),
      ...graph.relations.map(r => JSON.stringify({ type: "relation", ...r })),
    ];
    await fs.writeFile(MEMORY_FILE_PATH, lines.join("\n"));
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    const graph = await this.loadGraph();
    const newEntities = entities.filter(e => !graph.entities.some(existingEntity => existingEntity.name === e.name));
    graph.entities.push(...newEntities);
    await this.saveGraph(graph);
    return newEntities;
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    const graph = await this.loadGraph();
    const newRelations = relations.filter(r => !graph.relations.some(existingRelation => 
      existingRelation.from === r.from && 
      existingRelation.to === r.to && 
      existingRelation.relationType === r.relationType
    ));
    graph.relations.push(...newRelations);
    await this.saveGraph(graph);
    return newRelations;
  }

  async addObservations(observations: { entityName: string; contents: string[] }[]): Promise<{ entityName: string; addedObservations: string[] }[]> {
    const graph = await this.loadGraph();
    const results = observations.map(o => {
      const entity = graph.entities.find(e => e.name === o.entityName);
      if (!entity) {
        throw new Error(`Entity with name ${o.entityName} not found`);
      }
      const newObservations = o.contents.filter(content => !entity.observations.includes(content));
      entity.observations.push(...newObservations);
      return { entityName: o.entityName, addedObservations: newObservations };
    });
    await this.saveGraph(graph);
    return results;
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.entities = graph.entities.filter(e => !entityNames.includes(e.name));
    graph.relations = graph.relations.filter(r => !entityNames.includes(r.from) && !entityNames.includes(r.to));
    await this.saveGraph(graph);
  }

  async deleteObservations(deletions: { entityName: string; observations: string[] }[]): Promise<void> {
    const graph = await this.loadGraph();
    deletions.forEach(d => {
      const entity = graph.entities.find(e => e.name === d.entityName);
      if (entity) {
        entity.observations = entity.observations.filter(o => !d.observations.includes(o));
      }
    });
    await this.saveGraph(graph);
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.relations = graph.relations.filter(r => !relations.some(delRelation => 
      r.from === delRelation.from && 
      r.to === delRelation.to && 
      r.relationType === delRelation.relationType
    ));
    await this.saveGraph(graph);
  }

  async readGraph(): Promise<KnowledgeGraph> {
    return this.loadGraph();
  }

  // Enhanced search function with advanced search fallback
  async searchNodes(query: string): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    const lowerQuery = query.toLowerCase();
    
    // First attempt: exact substring search
    let filteredEntities = graph.entities.filter(e => 
      e.name.toLowerCase().includes(lowerQuery) ||
      e.entityType.toLowerCase().includes(lowerQuery) ||
      e.observations.some(o => o.toLowerCase().includes(lowerQuery)) ||
      this.searchInMetadata(e.metadata, lowerQuery)
    );

    // If no results found with full query, perform advanced search
    if (filteredEntities.length === 0 && query.trim().length > 0) {
      filteredEntities = this.performAdvancedSearch(graph.entities, query);
    }
  
    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
  
    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter(r => 
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );
  
    const filteredGraph: KnowledgeGraph = {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  
    return filteredGraph;
  }

  // Advanced search functionality for better matching
  private performAdvancedSearch(entities: Entity[], query: string): Entity[] {
    const queryWords = query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter out short words like "a", "an", "is", etc.
      .map(word => word.replace(/[^\w]/g, '')); // Remove punctuation

    if (queryWords.length === 0) {
      return [];
    }

    // Score each entity based on matches
    const entityScores = entities.map(entity => {
      let score = 0;
      const entityText = [
        entity.name,
        entity.entityType,
        ...entity.observations,
        ...this.getMetadataSearchableText(entity.metadata)
      ].join(' ').toLowerCase();

      // Check for word matches
      queryWords.forEach(word => {
        if (entityText.includes(word)) {
          score += 1;
        }
      });

      // Bonus for exact name matches with individual words
      queryWords.forEach(word => {
        if (entity.name.toLowerCase().includes(word)) {
          score += 2;
        }
      });

      // Bonus for entity type matches
      queryWords.forEach(word => {
        if (entity.entityType.toLowerCase().includes(word)) {
          score += 1.5;
        }
      });

      // Bonus for metadata matches
      queryWords.forEach(word => {
        if (this.searchInMetadata(entity.metadata, word)) {
          score += 1.2;
        }
      });

      return { entity, score };
    });

    // Return entities with score > 0, sorted by score (best matches first)
    return entityScores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Limit to top 20 results to avoid overwhelming results
      .map(item => item.entity);
  }

  // Helper method to search within metadata
  private searchInMetadata(metadata: Record<string, any> | undefined, query: string): boolean {
    if (!metadata) return false;
    
    const metadataText = this.getMetadataSearchableText(metadata).join(' ').toLowerCase();
    return metadataText.includes(query.toLowerCase());
  }

  // Helper method to extract searchable text from metadata
  private getMetadataSearchableText(metadata: Record<string, any> | undefined): string[] {
    if (!metadata) return [];
    
    const searchableText: string[] = [];
    
    const extractText = (value: any): void => {
      if (typeof value === 'string') {
        searchableText.push(value);
      } else if (typeof value === 'number') {
        searchableText.push(value.toString());
      } else if (typeof value === 'boolean') {
        searchableText.push(value.toString());
      } else if (Array.isArray(value)) {
        value.forEach(extractText);
      } else if (value && typeof value === 'object') {
        Object.values(value).forEach(extractText);
      }
    };
    
    Object.values(metadata).forEach(extractText);
    return searchableText;
  }

  // Enhanced search by tags with combination support
  async searchByTags(tagQuery: { 
    requiredTags?: string[]; 
    optionalTags?: string[]; 
    excludeTags?: string[];
    mode?: 'AND' | 'OR';
  }): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    const { requiredTags = [], optionalTags = [], excludeTags = [], mode = 'AND' } = tagQuery;
    
    // Filter entities based on tag combinations
    const filteredEntities = graph.entities.filter(entity => {
      const entityTags = this.extractTagsFromEntity(entity);
      
      // Check excluded tags first
      if (excludeTags.length > 0) {
        const hasExcludedTag = excludeTags.some(tag => entityTags.includes(tag.toLowerCase()));
        if (hasExcludedTag) return false;
      }
      
      // Check required tags
      if (requiredTags.length > 0) {
        const hasAllRequiredTags = requiredTags.every(tag => 
          entityTags.includes(tag.toLowerCase())
        );
        if (!hasAllRequiredTags) return false;
      }
      
      // Check optional tags based on mode
      if (optionalTags.length > 0) {
        if (mode === 'AND') {
          const hasAllOptionalTags = optionalTags.every(tag => 
            entityTags.includes(tag.toLowerCase())
          );
          return hasAllOptionalTags;
        } else { // OR mode
          const hasAnyOptionalTag = optionalTags.some(tag => 
            entityTags.includes(tag.toLowerCase())
          );
          return hasAnyOptionalTag;
        }
      }
      
      // If only required tags specified, entity passed the filter
      return true;
    });

    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));

    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter(r => 
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );

    const filteredGraph: KnowledgeGraph = {
      entities: filteredEntities,
      relations: filteredRelations,
    };

    return filteredGraph;
  }

  // Helper method to extract tags from entity
  private extractTagsFromEntity(entity: Entity): string[] {
    const tags: string[] = [];
    
    // Add entity type as a tag
    tags.push(entity.entityType.toLowerCase());
    
    // Extract tags from metadata
    if (entity.metadata) {
      // Look for explicit tags array
      if (entity.metadata.tags && Array.isArray(entity.metadata.tags)) {
        tags.push(...entity.metadata.tags.map((tag: string) => tag.toLowerCase()));
      }
      
      // Look for common tag-like fields
      const tagFields = ['category', 'type', 'language', 'framework', 'technology', 'domain', 'status'];
      tagFields.forEach(field => {
        if (entity.metadata![field] && typeof entity.metadata![field] === 'string') {
          tags.push(entity.metadata![field].toLowerCase());
        }
      });
      
      // Extract tags from arrays of strings
      Object.values(entity.metadata).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'string') {
              tags.push(item.toLowerCase());
            }
          });
        }
      });
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    
    // Filter entities
    const filteredEntities = graph.entities.filter(e => names.includes(e.name));
  
    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
  
    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter(r => 
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );
  
    const filteredGraph: KnowledgeGraph = {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  
    return filteredGraph;
  }

  async updateEntityMetadata(updates: { entityName: string; metadata: Record<string, any> }[]): Promise<{ entityName: string; updated: boolean }[]> {
    const graph = await this.loadGraph();
    const results = updates.map(u => {
      const entity = graph.entities.find(e => e.name === u.entityName);
      if (!entity) {
        return { entityName: u.entityName, updated: false };
      }
      entity.metadata = { ...entity.metadata, ...u.metadata };
      return { entityName: u.entityName, updated: true };
    });
    await this.saveGraph(graph);
    return results;
  }
  async listTypes(): Promise<{ entityTypes: string[]; relationTypes: string[] }> {
    const graph = await this.loadGraph();
    const entityTypes = Array.from(new Set(graph.entities.map(e => e.entityType))).sort();
    const relationTypes = Array.from(new Set(graph.relations.map(r => r.relationType))).sort();
    return { entityTypes, relationTypes };
  }
}

const knowledgeGraphManager = new KnowledgeGraphManager();


// The server instance and tools exposed to Claude
const server = new Server({
  name: "memory-server",
  version: "0.6.3",
},    {
    capabilities: {
      tools: {},
    },
  },);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_entities",
        description: "Create multiple new entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            entities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "The name of the entity" },
                  entityType: { type: "string", description: "The type of the entity" },
                  observations: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "An array of observation contents associated with the entity"
                  },
                  metadata: {
                    type: "object",
                    description: "Optional metadata object with additional information about the entity",
                    additionalProperties: true
                  }
                },
                required: ["name", "entityType", "observations"],
              },
            },
          },
          required: ["entities"],
        },
      },
      {
        name: "create_relations",
        description: "Create multiple new relations between entities in the knowledge graph. Relations should be in active voice",
        inputSchema: {
          type: "object",
          properties: {
            relations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string", description: "The name of the entity where the relation starts" },
                  to: { type: "string", description: "The name of the entity where the relation ends" },
                  relationType: { type: "string", description: "The type of the relation" },
                },
                required: ["from", "to", "relationType"],
              },
            },
          },
          required: ["relations"],
        },
      },
      {
        name: "add_observations",
        description: "Add new observations to existing entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            observations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityName: { type: "string", description: "The name of the entity to add the observations to" },
                  contents: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "An array of observation contents to add"
                  },
                },
                required: ["entityName", "contents"],
              },
            },
          },
          required: ["observations"],
        },
      },
      {
        name: "delete_entities",
        description: "Delete multiple entities and their associated relations from the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            entityNames: { 
              type: "array", 
              items: { type: "string" },
              description: "An array of entity names to delete" 
            },
          },
          required: ["entityNames"],
        },
      },
      {
        name: "delete_observations",
        description: "Delete specific observations from entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            deletions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityName: { type: "string", description: "The name of the entity containing the observations" },
                  observations: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "An array of observations to delete"
                  },
                },
                required: ["entityName", "observations"],
              },
            },
          },
          required: ["deletions"],
        },
      },
      {
        name: "delete_relations",
        description: "Delete multiple relations from the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            relations: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  from: { type: "string", description: "The name of the entity where the relation starts" },
                  to: { type: "string", description: "The name of the entity where the relation ends" },
                  relationType: { type: "string", description: "The type of the relation" },
                },
                required: ["from", "to", "relationType"],
              },
              description: "An array of relations to delete" 
            },
          },
          required: ["relations"],
        },
      },
      {
        name: "read_graph",
        description: "Read the entire knowledge graph",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "search_nodes",
        description: "Search for nodes in the knowledge graph based on a query. Performs exact substring matching first, then falls back to advanced word-based search if no results found. Searches across entity names, types, observations, and metadata.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query to match against entity names, types, observation content, and metadata. Long queries are automatically broken down for better matching." },
          },
          required: ["query"],
        },
      },
      {
        name: "open_nodes",
        description: "Open specific nodes in the knowledge graph by their names",
        inputSchema: {
          type: "object",
          properties: {
            names: {
              type: "array",
              items: { type: "string" },
              description: "An array of entity names to retrieve",
            },
          },
          required: ["names"],
        },
      },
      {
        name: "search_by_tags",
        description: "Enhanced search using tag combinations. Supports required tags, optional tags, excluded tags, and AND/OR logic.",
        inputSchema: {
          type: "object",
          properties: {
            requiredTags: {
              type: "array",
              items: { type: "string" },
              description: "Tags that must be present in matching entities"
            },
            optionalTags: {
              type: "array", 
              items: { type: "string" },
              description: "Tags that may be present (behavior depends on mode)"
            },
            excludeTags: {
              type: "array",
              items: { type: "string" },
              description: "Tags that must NOT be present in matching entities"
            },
            mode: {
              type: "string",
              enum: ["AND", "OR"],
              description: "For optional tags: AND = all must be present, OR = any can be present (default: AND)"
            }
          },
        },
      },
      {
        name: "update_entity_metadata",
        description: "Update metadata for existing entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityName: { type: "string", description: "The name of the entity to update" },
                  metadata: { 
                    type: "object",
                    description: "Metadata object to merge with existing metadata",
                    additionalProperties: true
                  },
                },
                required: ["entityName", "metadata"],
              },
            },
          },
          required: ["updates"],
        },
      },
      {
        name: "list_types",
        description: "List all unique entity types and relation types in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  if (name === "read_graph") {
    return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.readGraph(), null, 2) }] };
  }

  if (!args) {
    throw new Error(`No arguments provided for tool: ${name}`);
  }

  switch (name) {
    case "create_entities":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.createEntities(args.entities as Entity[]), null, 2) }] };
    case "create_relations":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.createRelations(args.relations as Relation[]), null, 2) }] };
    case "add_observations":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.addObservations(args.observations as { entityName: string; contents: string[] }[]), null, 2) }] };
    case "delete_entities":
      await knowledgeGraphManager.deleteEntities(args.entityNames as string[]);
      return { content: [{ type: "text", text: "Entities deleted successfully" }] };
    case "delete_observations":
      await knowledgeGraphManager.deleteObservations(args.deletions as { entityName: string; observations: string[] }[]);
      return { content: [{ type: "text", text: "Observations deleted successfully" }] };
    case "delete_relations":
      await knowledgeGraphManager.deleteRelations(args.relations as Relation[]);
      return { content: [{ type: "text", text: "Relations deleted successfully" }] };
    case "search_nodes":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.searchNodes(args.query as string), null, 2) }] };
    case "open_nodes":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.openNodes(args.names as string[]), null, 2) }] };
    case "search_by_tags":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.searchByTags(args as { requiredTags?: string[]; optionalTags?: string[]; excludeTags?: string[]; mode?: 'AND' | 'OR' }), null, 2) }] };
    case "update_entity_metadata":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.updateEntityMetadata(args.updates as { entityName: string; metadata: Record<string, any> }[]), null, 2) }] };
    case "list_types":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.listTypes(), null, 2) }] };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Knowledge Graph MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
