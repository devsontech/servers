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
    const now = new Date().toISOString();
    
    const newEntities = entities.filter(e => !graph.entities.some(existingEntity => existingEntity.name === e.name))
      .map(entity => {
        // Add temporal metadata automatically
        const enhancedEntity = { 
          ...entity,
          metadata: {
            ...entity.metadata,
            createdAt: now,
            updatedAt: now,
            confidence_score: entity.metadata?.confidence_score || 1.0,
            knowledge_age_days: 0,
            freshness_indicator: "fresh" as const
          }
        };
        return enhancedEntity;
      });
      
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
    const now = new Date().toISOString();
    
    const results = observations.map(o => {
      const entity = graph.entities.find(e => e.name === o.entityName);
      if (!entity) {
        throw new Error(`Entity with name ${o.entityName} not found`);
      }
      const newObservations = o.contents.filter(content => !entity.observations.includes(content));
      entity.observations.push(...newObservations);
      
      // Update temporal metadata
      if (!entity.metadata) entity.metadata = {};
      entity.metadata.updatedAt = now;
      entity.metadata.knowledge_age_days = this.calculateKnowledgeAgeDays(entity.metadata.createdAt || now);
      entity.metadata.freshness_indicator = this.getFreshnessIndicator(entity.metadata.knowledge_age_days);
      
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

  // Enhanced search function with advanced search fallback and contextual intelligence
  async searchNodes(query: string): Promise<KnowledgeGraph> {
    return this.searchNodesContextual(query, {});
  }

  // Enhanced contextual search with workspace filtering and context preferences
  async searchNodesContextual(query: string, options: {
    workspace?: string;
    exclude_contexts?: string[];
    prefer_contexts?: string[];
    boost_recent?: boolean;
    freshness_days?: number;
  }): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    const lowerQuery = query.toLowerCase();
    const {
      workspace,
      exclude_contexts = [],
      prefer_contexts = [],
      boost_recent = false,
      freshness_days = 180
    } = options;
    
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

    // Apply contextual filtering
    if (workspace || exclude_contexts.length > 0 || prefer_contexts.length > 0) {
      filteredEntities = this.applyContextualFiltering(filteredEntities, {
        workspace,
        exclude_contexts,
        prefer_contexts
      });
    }

    // Apply temporal boosting if requested
    if (boost_recent) {
      filteredEntities = this.applyTemporalBoosting(filteredEntities, freshness_days);
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

  // Helper method to apply contextual filtering
  private applyContextualFiltering(entities: Entity[], options: {
    workspace?: string;
    exclude_contexts?: string[];
    prefer_contexts?: string[];
  }): Entity[] {
    const { workspace, exclude_contexts = [], prefer_contexts = [] } = options;
    
    let filtered = entities;
    
    // Filter by workspace
    if (workspace) {
      filtered = filtered.filter(entity => {
        if (!entity.metadata?.workspace) return false;
        return entity.metadata.workspace.toLowerCase() === workspace.toLowerCase();
      });
    }
    
    // Exclude contexts
    if (exclude_contexts.length > 0) {
      filtered = filtered.filter(entity => {
        const entityContexts = this.getEntityContexts(entity);
        return !exclude_contexts.some(excludeContext => 
          entityContexts.includes(excludeContext.toLowerCase())
        );
      });
    }
    
    // If we have preferred contexts, score and sort by preference
    if (prefer_contexts.length > 0) {
      const scoredEntities = filtered.map(entity => {
        const entityContexts = this.getEntityContexts(entity);
        let score = 0;
        
        prefer_contexts.forEach(preferredContext => {
          if (entityContexts.includes(preferredContext.toLowerCase())) {
            score += 1;
          }
        });
        
        return { entity, score };
      });
      
      // Sort by score (preferred contexts first) then return entities
      filtered = scoredEntities
        .sort((a, b) => b.score - a.score)
        .map(item => item.entity);
    }
    
    return filtered;
  }
  
  // Helper method to apply temporal boosting (prefer recent entities)
  private applyTemporalBoosting(entities: Entity[], freshness_days: number): Entity[] {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (freshness_days * 24 * 60 * 60 * 1000));
    
    const scoredEntities = entities.map(entity => {
      let freshnessScore = 0;
      
      if (entity.metadata) {
        // Check for timestamps
        const createdAt = entity.metadata.createdAt || entity.metadata.created_at;
        const updatedAt = entity.metadata.updatedAt || entity.metadata.updated_at;
        const lastValidated = entity.metadata.lastValidated || entity.metadata.last_validated;
        
        // Use the most recent timestamp available
        const timestamps = [createdAt, updatedAt, lastValidated].filter(Boolean);
        if (timestamps.length > 0) {
          const mostRecentTimestamp = timestamps.sort().pop();
          const entityDate = new Date(mostRecentTimestamp!);
          
          if (entityDate > cutoffDate) {
            // Calculate freshness score (0-1, where 1 is most recent)
            const daysSinceCreation = (now.getTime() - entityDate.getTime()) / (24 * 60 * 60 * 1000);
            freshnessScore = Math.max(0, 1 - (daysSinceCreation / freshness_days));
          }
        }
        
        // Boost entities with high confidence scores
        if (entity.metadata.confidence_score) {
          freshnessScore += entity.metadata.confidence_score * 0.2;
        }
      }
      
      return { entity, freshnessScore };
    });
    
    // Sort by freshness score (most recent/confident first)
    return scoredEntities
      .sort((a, b) => b.freshnessScore - a.freshnessScore)
      .map(item => item.entity);
  }
  
  // Helper method to extract contexts from an entity
  private getEntityContexts(entity: Entity): string[] {
    const contexts: string[] = [];
    
    // Add entity type as context
    contexts.push(entity.entityType.toLowerCase());
    
    if (entity.metadata) {
      // Common context fields
      const contextFields = ['context', 'domain', 'category', 'technology', 'framework', 'language'];
      contextFields.forEach(field => {
        if (entity.metadata![field]) {
          if (Array.isArray(entity.metadata![field])) {
            contexts.push(...entity.metadata![field].map((c: string) => c.toLowerCase()));
          } else {
            contexts.push(entity.metadata![field].toLowerCase());
          }
        }
      });
      
      // Extract from tags
      if (entity.metadata.tags && Array.isArray(entity.metadata.tags)) {
        contexts.push(...entity.metadata.tags.map((tag: string) => tag.toLowerCase()));
      }
    }
    
    return [...new Set(contexts)]; // Remove duplicates
  }
  
  // Helper method to calculate knowledge age in days
  private calculateKnowledgeAgeDays(createdAtString: string): number {
    const now = new Date();
    const createdAt = new Date(createdAtString);
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Helper method to get freshness indicator based on age
  private getFreshnessIndicator(ageDays: number): "fresh" | "aging" | "stale" {
    if (ageDays <= 30) return "fresh";
    if (ageDays <= 180) return "aging";
    return "stale";
  }
  
  // Method to analyze temporal knowledge
  async analyzeTemporalKnowledge(options: {
    freshness_threshold_days?: number;
    include_stale?: boolean;
  } = {}): Promise<{
    fresh_entities: number;
    aging_entities: number;
    stale_entities: number;
    entities_without_timestamps: number;
    freshness_distribution: Record<string, number>;
    oldest_entity?: { name: string; age_days: number };
    newest_entity?: { name: string; age_days: number };
  }> {
    const graph = await this.loadGraph();
    const { freshness_threshold_days = 180, include_stale = true } = options;
    
    let fresh = 0, aging = 0, stale = 0, without_timestamps = 0;
    let oldest: { name: string; age_days: number } | undefined;
    let newest: { name: string; age_days: number } | undefined;
    const distribution: Record<string, number> = {};
    
    graph.entities.forEach(entity => {
      if (!entity.metadata?.createdAt) {
        without_timestamps++;
        return;
      }
      
      const ageDays = this.calculateKnowledgeAgeDays(entity.metadata.createdAt);
      const freshness = this.getFreshnessIndicator(ageDays);
      
      // Update counters
      switch (freshness) {
        case "fresh": fresh++; break;
        case "aging": aging++; break;
        case "stale": stale++; break;
      }
      
      // Update distribution
      const ageRange = this.getAgeRange(ageDays);
      distribution[ageRange] = (distribution[ageRange] || 0) + 1;
      
      // Track oldest and newest
      if (!oldest || ageDays > oldest.age_days) {
        oldest = { name: entity.name, age_days: ageDays };
      }
      if (!newest || ageDays < newest.age_days) {
        newest = { name: entity.name, age_days: ageDays };
      }
    });
    
    return {
      fresh_entities: fresh,
      aging_entities: aging,
      stale_entities: stale,
      entities_without_timestamps: without_timestamps,
      freshness_distribution: distribution,
      oldest_entity: oldest,
      newest_entity: newest
    };
  }
  
  // Helper to categorize age into ranges
  private getAgeRange(ageDays: number): string {
    if (ageDays <= 7) return "0-7 days";
    if (ageDays <= 30) return "8-30 days";
    if (ageDays <= 90) return "1-3 months";
    if (ageDays <= 180) return "3-6 months";
    if (ageDays <= 365) return "6-12 months";
    return "1+ years";
  }
  
  // Helper method to search within metadata
  private searchInMetadata(metadata: Record<string, any> | undefined, query: string): boolean {
    
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
    const now = new Date().toISOString();
    
    const results = updates.map(u => {
      const entity = graph.entities.find(e => e.name === u.entityName);
      if (!entity) {
        return { entityName: u.entityName, updated: false };
      }
      
      // Merge metadata and update temporal information
      entity.metadata = { 
        ...entity.metadata, 
        ...u.metadata,
        updatedAt: now
      };
      
      // Recalculate temporal indicators if we have creation timestamp
      if (entity.metadata.createdAt) {
        entity.metadata.knowledge_age_days = this.calculateKnowledgeAgeDays(entity.metadata.createdAt);
        entity.metadata.freshness_indicator = this.getFreshnessIndicator(entity.metadata.knowledge_age_days);
      }
      
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

  // Get all available tags used across all entities
  async getAvailableTags(): Promise<{ tags: string[]; tagCounts: Record<string, number> }> {
    const graph = await this.loadGraph();
    const tagCounts: Record<string, number> = {};
    
    graph.entities.forEach(entity => {
      const entityTags = this.extractTagsFromEntity(entity);
      entityTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const tags = Object.keys(tagCounts).sort();
    return { tags, tagCounts };
  }

  // Get all available metadata keys used across all entities
  async getAvailableMetadataKeys(): Promise<{ 
    metadataKeys: string[]; 
    keyCounts: Record<string, number>;
    keyExamples: Record<string, any[]>;
  }> {
    const graph = await this.loadGraph();
    const keyCounts: Record<string, number> = {};
    const keyExamples: Record<string, any[]> = {};
    
    graph.entities.forEach(entity => {
      if (entity.metadata) {
        this.extractMetadataKeys(entity.metadata).forEach(({ key, value }) => {
          keyCounts[key] = (keyCounts[key] || 0) + 1;
          
          // Store unique examples for each key
          if (!keyExamples[key]) {
            keyExamples[key] = [];
          }
          if (keyExamples[key].length < 3 && !keyExamples[key].includes(value)) {
            keyExamples[key].push(value);
          }
        });
      }
    });
    
    const metadataKeys = Object.keys(keyCounts).sort();
    return { metadataKeys, keyCounts, keyExamples };
  }

  // Helper method to recursively extract all metadata keys and their values
  private extractMetadataKeys(metadata: any, prefix = ''): Array<{ key: string; value: any }> {
    const keys: Array<{ key: string; value: any }> = [];
    
    if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
      Object.entries(metadata).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively extract nested object keys
          keys.push(...this.extractMetadataKeys(value, fullKey));
        } else {
          // Store the key and a sample value
          keys.push({ key: fullKey, value: Array.isArray(value) ? value[0] : value });
        }
      });
    }
    
    return keys;
  }

  // Get comprehensive memory statistics
  async getMemoryStats(): Promise<{
    totalEntities: number;
    totalRelations: number;
    totalTags: number;
    totalMetadataKeys: number;
    entityTypeBreakdown: Record<string, number>;
    relationTypeBreakdown: Record<string, number>;
    averageObservationsPerEntity: number;
    entitiesWithMetadata: number;
  }> {
    const graph = await this.loadGraph();
    const { tags } = await this.getAvailableTags();
    const { metadataKeys } = await this.getAvailableMetadataKeys();
    
    const entityTypeBreakdown: Record<string, number> = {};
    const relationTypeBreakdown: Record<string, number> = {};
    let totalObservations = 0;
    let entitiesWithMetadata = 0;
    
    graph.entities.forEach(entity => {
      entityTypeBreakdown[entity.entityType] = (entityTypeBreakdown[entity.entityType] || 0) + 1;
      totalObservations += entity.observations.length;
      if (entity.metadata && Object.keys(entity.metadata).length > 0) {
        entitiesWithMetadata++;
      }
    });
    
    graph.relations.forEach(relation => {
      relationTypeBreakdown[relation.relationType] = (relationTypeBreakdown[relation.relationType] || 0) + 1;
    });
    
    return {
      totalEntities: graph.entities.length,
      totalRelations: graph.relations.length,
      totalTags: tags.length,
      totalMetadataKeys: metadataKeys.length,
      entityTypeBreakdown,
      relationTypeBreakdown,
      averageObservationsPerEntity: graph.entities.length > 0 ? totalObservations / graph.entities.length : 0,
      entitiesWithMetadata
    };
  }
  
  // Conflict detection system
  async detectConflicts(newEntity: Entity): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{
      conflictingEntity: string;
      conflictType: "contradictory_observation" | "duplicate_name" | "inconsistent_type";
      conflictingObservation?: string;
      newObservation?: string;
      confidence: number;
      suggestedAction: "merge" | "update" | "flag" | "rename";
      evidence: string[];
    }>;
    warnings: string[];
  }> {
    const graph = await this.loadGraph();
    const conflicts: Array<{
      conflictingEntity: string;
      conflictType: "contradictory_observation" | "duplicate_name" | "inconsistent_type";
      conflictingObservation?: string;
      newObservation?: string;
      confidence: number;
      suggestedAction: "merge" | "update" | "flag" | "rename";
      evidence: string[];
    }> = [];
    const warnings: string[] = [];
    
    // Check for duplicate names
    const existingEntity = graph.entities.find(e => e.name === newEntity.name);
    if (existingEntity) {
      conflicts.push({
        conflictingEntity: existingEntity.name,
        conflictType: "duplicate_name",
        confidence: 1.0,
        suggestedAction: "rename",
        evidence: [`Entity with name "${newEntity.name}" already exists`]
      });
    }
    
    // Check for contradictory observations
    graph.entities
      .filter(e => e.entityType === newEntity.entityType || this.areRelatedTypes(e.entityType, newEntity.entityType))
      .forEach(entity => {
        newEntity.observations.forEach(newObs => {
          entity.observations.forEach(existingObs => {
            const contradiction = this.detectObservationContradiction(newObs, existingObs);
            if (contradiction.isContradictory) {
              conflicts.push({
                conflictingEntity: entity.name,
                conflictType: "contradictory_observation",
                conflictingObservation: existingObs,
                newObservation: newObs,
                confidence: contradiction.confidence,
                suggestedAction: contradiction.confidence > 0.8 ? "flag" : "update",
                evidence: contradiction.evidence
              });
            }
          });
        });
      });
    
    // Check for inconsistent entity types with similar names
    const similarNameEntities = graph.entities.filter(e => 
      this.calculateStringSimilarity(e.name.toLowerCase(), newEntity.name.toLowerCase()) > 0.7 && 
      e.entityType !== newEntity.entityType
    );
    
    similarNameEntities.forEach(entity => {
      conflicts.push({
        conflictingEntity: entity.name,
        conflictType: "inconsistent_type",
        confidence: 0.6,
        suggestedAction: "flag",
        evidence: [
          `Similar entity name "${entity.name}" has different type "${entity.entityType}"`,
          `New entity type: "${newEntity.entityType}"`
        ]
      });
    });
    
    // Generate warnings for potential issues
    if (newEntity.observations.length === 0) {
      warnings.push("Entity has no observations - consider adding some descriptive information");
    }
    
    if (newEntity.observations.length > 20) {
      warnings.push("Entity has many observations - consider breaking into multiple entities");
    }
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings
    };
  }
  
  // Helper method to detect contradictory observations
  private detectObservationContradiction(obs1: string, obs2: string): {
    isContradictory: boolean;
    confidence: number;
    evidence: string[];
  } {
    const evidence: string[] = [];
    const obs1Lower = obs1.toLowerCase();
    const obs2Lower = obs2.toLowerCase();
    
    // Check for direct contradictions (yes/no, has/doesn't have, etc.)
    const contradictionPatterns = [
      { positive: /\b(is|has|can|does|will|supports?)\b/, negative: /\b(is not|isn't|has no|hasn't|cannot|can't|doesn't|does not|won't|will not|unsupported?)\b/ },
      { positive: /\b(enables?|allows?|permits?)\b/, negative: /\b(disables?|prevents?|forbids?|blocks?)\b/ },
      { positive: /\b(includes?|contains?)\b/, negative: /\b(excludes?|omits?|lacks?)\b/ },
      { positive: /\b(requires?|needs?|must)\b/, negative: /\b(optional|not required|doesn't need)\b/ }
    ];
    
    for (const pattern of contradictionPatterns) {
      const obs1HasPositive = pattern.positive.test(obs1Lower);
      const obs1HasNegative = pattern.negative.test(obs1Lower);
      const obs2HasPositive = pattern.positive.test(obs2Lower);
      const obs2HasNegative = pattern.negative.test(obs2Lower);
      
      if ((obs1HasPositive && obs2HasNegative) || (obs1HasNegative && obs2HasPositive)) {
        evidence.push(`Contradictory statements detected: "${obs1}" vs "${obs2}"`);
        
        // Higher confidence if the contradictory terms are about the same subject
        const commonWords = this.getCommonWords(obs1Lower, obs2Lower);
        const confidence = Math.min(0.9, 0.6 + (commonWords.length * 0.1));
        
        return {
          isContradictory: true,
          confidence,
          evidence
        };
      }
    }
    
    // Check for conflicting values (different numbers, versions, etc.)
    const numberPattern = /\d+(?:\.\d+)?/g;
    const obs1Numbers = obs1.match(numberPattern);
    const obs2Numbers = obs2.match(numberPattern);
    
    if (obs1Numbers && obs2Numbers && obs1Numbers.length > 0 && obs2Numbers.length > 0) {
      const commonContext = this.getCommonWords(obs1Lower.replace(/\d+(?:\.\d+)?/g, ''), obs2Lower.replace(/\d+(?:\.\d+)?/g, ''));
      if (commonContext.length > 2 && obs1Numbers.some(n => obs2Numbers.indexOf(n) === -1)) {
        evidence.push(`Conflicting numeric values in similar contexts: "${obs1}" vs "${obs2}"`);
        return {
          isContradictory: true,
          confidence: 0.7,
          evidence
        };
      }
    }
    
    return {
      isContradictory: false,
      confidence: 0,
      evidence: []
    };
  }
  
  // Helper method to check if entity types are related
  private areRelatedTypes(type1: string, type2: string): boolean {
    const relatedTypeGroups = [
      ["pattern", "antipattern", "best_practice", "guideline"],
      ["component", "service", "module", "class"],
      ["configuration", "setting", "property", "parameter"],
      ["error", "exception", "bug", "issue"],
      ["framework", "library", "tool", "technology"]
    ];
    
    return relatedTypeGroups.some(group => 
      group.includes(type1.toLowerCase()) && group.includes(type2.toLowerCase())
    );
  }
  
  // Helper method to calculate string similarity
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  // Helper method to calculate Levenshtein distance
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // Helper method to get common words between two strings
  private getCommonWords(str1: string, str2: string): string[] {
    const words1 = str1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const words2 = str2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    return words1.filter(word => words2.includes(word));
  }
}

const knowledgeGraphManager = new KnowledgeGraphManager();


// The server instance and tools exposed to Claude
const server = new Server({
  name: "memory-server",
  version: "0.7.0",
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
      {
        name: "get_available_tags",
        description: "Get all tags currently used across all entities with usage counts",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_available_metadata_keys", 
        description: "Get all metadata keys currently used across all entities with usage counts and examples",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_memory_stats",
        description: "Get comprehensive statistics about the memory including entity counts, tag usage, and metadata analytics",
        inputSchema: {
          type: "object", 
          properties: {},
        },
      },
      {
        name: "search_nodes_contextual",
        description: "Enhanced contextual search with workspace filtering, context preferences, and temporal boosting. Provides much more relevant results for complex development scenarios.",
        inputSchema: {
          type: "object",
          properties: {
            query: { 
              type: "string", 
              description: "The search query to match against entity names, types, observation content, and metadata" 
            },
            workspace: {
              type: "string",
              description: "Filter results to specific workspace (e.g., 'angular', 'abp', 'backend', 'frontend')"
            },
            exclude_contexts: {
              type: "array",
              items: { type: "string" },
              description: "Contexts to exclude from results (e.g., ['backend', 'database'] when searching for frontend patterns)"
            },
            prefer_contexts: {
              type: "array", 
              items: { type: "string" },
              description: "Contexts to prefer in results (e.g., ['carbon-design-system', 'angular'] for frontend work)"
            },
            boost_recent: {
              type: "boolean",
              description: "Whether to boost recently created or updated entities in results"
            },
            freshness_days: {
              type: "number",
              description: "Number of days to consider 'recent' for temporal boosting (default: 180)"
            }
          },
          required: ["query"],
        },
      },
      {
        name: "analyze_temporal_knowledge",
        description: "Analyze the temporal characteristics of knowledge in memory - freshness, age distribution, and temporal patterns",
        inputSchema: {
          type: "object",
          properties: {
            freshness_threshold_days: {
              type: "number",
              description: "Days threshold for considering knowledge fresh vs aging (default: 180)"
            },
            include_stale: {
              type: "boolean", 
              description: "Whether to include analysis of stale knowledge (default: true)"
            }
          },
        },
      },
      {
        name: "detect_knowledge_conflicts",
        description: "Detect potential conflicts and contradictions when creating new entities. Helps maintain knowledge consistency.",
        inputSchema: {
          type: "object",
          properties: {
            entity: {
              type: "object",
              properties: {
                name: { type: "string", description: "The name of the entity to check for conflicts" },
                entityType: { type: "string", description: "The type of the entity" },
                observations: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Observations to check for contradictions with existing knowledge"
                },
                metadata: {
                  type: "object",
                  description: "Optional metadata for the entity",
                  additionalProperties: true
                }
              },
              required: ["name", "entityType", "observations"],
            },
          },
          required: ["entity"],
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

  // Check for tools that don't require arguments
  if (['list_types', 'get_available_tags', 'get_available_metadata_keys', 'get_memory_stats', 'analyze_temporal_knowledge'].includes(name)) {
    switch (name) {
      case "list_types":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.listTypes(), null, 2) }] };
      case "get_available_tags":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.getAvailableTags(), null, 2) }] };
      case "get_available_metadata_keys":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.getAvailableMetadataKeys(), null, 2) }] };
      case "get_memory_stats":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.getMemoryStats(), null, 2) }] };
      case "analyze_temporal_knowledge":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.analyzeTemporalKnowledge(args || {}), null, 2) }] };
    }
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
    case "search_nodes_contextual":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.searchNodesContextual(args.query as string, {
        workspace: args.workspace,
        exclude_contexts: args.exclude_contexts,
        prefer_contexts: args.prefer_contexts,
        boost_recent: args.boost_recent,
        freshness_days: args.freshness_days
      }), null, 2) }] };
    case "detect_knowledge_conflicts":
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.detectConflicts(args.entity as Entity), null, 2) }] };
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
