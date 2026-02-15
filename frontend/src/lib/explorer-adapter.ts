/**
 * Adapter between backend QueryExecuteResponse and Explorer frontend format.
 *
 * Backend returns: { columns: [{name, type}], rows: [{colName: val}] }
 * Explorer expects: { columns: [{key, name, type, tableName}], rows: [{key: val}] }
 */

import type { QueryExecuteResponse } from '@/lib/api';
import type { SelectedField } from '@/components/features/explorer/ExplorerContext';

export interface ExplorerColumnInfo {
  key: string;
  name: string;
  type: string;
  tableName: string;
  role: 'dimension' | 'measure';
}

export interface ExplorerQueryResult {
  columns: ExplorerColumnInfo[];
  rows: Record<string, unknown>[];
  row_count: number;
  execution_time_ms: number;
  total_row_count: number;
}

/**
 * Try to match a backend column name to a selectedField.
 * The SQL generator creates aliases like:
 *   - dimension: "columnName" or "columnName_month" (date granularity)
 *   - measure: "sum_columnName", "avg_columnName", etc.
 *   - quick calc: "pct_columnName", "running_columnName", "rank_columnName", etc.
 */
function findMatchingField(
  colName: string,
  selectedFields: SelectedField[],
): SelectedField | undefined {
  // Direct match (non-aggregated dimension)
  const direct = selectedFields.find(f => f.name === colName);
  if (direct) return direct;

  // Aggregated match: {agg}_{name}
  for (const f of selectedFields) {
    if (f.aggregation && f.aggregation !== 'none') {
      const aggPrefix = f.aggregation.toLowerCase();
      if (colName === `${aggPrefix}_${f.name}`) return f;
    }

    // Date granularity: {name}_{granularity}
    if (f.dateGranularity && f.dateGranularity !== 'raw') {
      if (colName === `${f.name}_${f.dateGranularity}`) return f;
    }

    // Quick calc patterns
    if (f.quickCalc && f.quickCalc !== 'none') {
      const patterns = [
        `pct_${f.name}`,
        `running_${f.name}`,
        `diff_${f.name}`,
        `pct_chg_${f.name}`,
        `rank_${f.name}`,
        `cum_avg_${f.name}`,
      ];
      if (patterns.includes(colName)) return f;
    }
  }

  return undefined;
}

/** Classify a column as dimension or measure based on its DuckDB type */
function classifyByType(type: string): 'dimension' | 'measure' {
  const t = type.toUpperCase();
  if (['DOUBLE', 'FLOAT', 'DECIMAL', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'HUGEINT'].includes(t)) {
    return 'measure';
  }
  return 'dimension';
}

/**
 * Convert backend response to Explorer format.
 * Tries to match columns back to selectedFields for tableName reconstruction.
 */
export function adaptQueryResponse(
  response: QueryExecuteResponse,
  selectedFields: SelectedField[] = [],
): ExplorerQueryResult {
  const columns: ExplorerColumnInfo[] = response.columns.map(col => {
    const matched = findMatchingField(col.name, selectedFields);
    return {
      key: col.name,
      name: col.name,
      type: col.type,
      tableName: matched?.tableName || '',
      role: matched?.role === 'dimension' || matched?.role === 'measure'
        ? matched.role
        : classifyByType(col.type),
    };
  });

  return {
    columns,
    rows: response.rows,
    row_count: response.row_count,
    execution_time_ms: response.execution_time_ms,
    total_row_count: response.row_count,
  };
}

export { classifyByType };
