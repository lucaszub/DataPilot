/**
 * Explorer types — shared between field picker, context, and adapter.
 * Mirrors mock-data/schema.ts structure but without hardcoded data.
 */

import type { DataSourceDetail, SemanticLayerNode, SemanticLayerEdge } from '@/lib/api';

export interface ColumnDef {
  name: string;
  type: string;
  role: 'dimension' | 'measure' | 'key';
  description?: string;
}

export interface TableDef {
  name: string;        // DuckDB view name (sanitized)
  displayName: string; // Original data source name
  dataSourceId: string;
  columns: ColumnDef[];
  rowCount: number;
}

export interface RelationshipDef {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  joinType: 'LEFT' | 'INNER' | 'RIGHT' | 'FULL';
}

/** Reproduce backend Python sanitization: re.sub(r"[^a-zA-Z0-9_]", "_", name)[:128] */
export function sanitizeViewName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 128);
}

const NUMERIC_TYPES = ['DOUBLE', 'FLOAT', 'DECIMAL', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'HUGEINT'];

/** Infer column role from name + DuckDB type.
 *  Explicit 'measure' or 'key' from semantic layer is trusted.
 *  'dimension' is re-evaluated (old models had all cols as dimension). */
function inferRole(name: string, type: string, nodeRole?: string): 'dimension' | 'measure' | 'key' {
  // Trust explicit measure/key from semantic layer
  if (nodeRole === 'measure' || nodeRole === 'key') {
    return nodeRole;
  }
  // ID columns are always dimensions
  const lower = name.toLowerCase();
  if (lower.endsWith('_id') || lower === 'id') {
    return 'dimension';
  }
  // Numeric columns default to measure
  if (NUMERIC_TYPES.includes(type.toUpperCase())) {
    return 'measure';
  }
  return 'dimension';
}

/** Build TableDef[] from semantic layer nodes + data source details */
export function buildTablesFromSemanticLayer(
  nodes: SemanticLayerNode[],
  dataSources: Map<string, DataSourceDetail>,
): TableDef[] {
  return nodes
    .map(node => {
      const ds = dataSources.get(node.data_source_id);
      if (!ds?.schema_cache) return null;

      const viewName = sanitizeViewName(node.data_source_name);

      // Use semantic layer column roles if available, fall back to schema_cache
      const columns: ColumnDef[] = ds.schema_cache.columns.map(schemaCol => {
        const nodeCol = node.columns?.find(c => c.name === schemaCol.name);
        const role = nodeCol?.role === 'ignore' ? 'dimension' : inferRole(schemaCol.name, schemaCol.type, nodeCol?.role);
        return {
          name: schemaCol.name,
          type: schemaCol.type,
          role,
        };
      }).filter(col => {
        // Filter out columns marked as 'ignore' in semantic layer
        const nodeCol = node.columns?.find(c => c.name === col.name);
        return nodeCol?.role !== 'ignore';
      });

      return {
        name: viewName,
        displayName: node.data_source_name,
        dataSourceId: node.data_source_id,
        columns,
        rowCount: ds.schema_cache.row_count || 0,
      };
    })
    .filter((t): t is TableDef => t !== null);
}

/** Build RelationshipDef[] from semantic layer edges */
export function buildRelationshipsFromEdges(
  edges: SemanticLayerEdge[],
  nodeIdToViewName: Map<string, string>,
): RelationshipDef[] {
  return edges.map(edge => ({
    id: edge.id,
    sourceTable: nodeIdToViewName.get(edge.source_node) || edge.source_node,
    sourceColumn: edge.source_column,
    targetTable: nodeIdToViewName.get(edge.target_node) || edge.target_node,
    targetColumn: edge.target_column,
    joinType: edge.join_type,
  }));
}
