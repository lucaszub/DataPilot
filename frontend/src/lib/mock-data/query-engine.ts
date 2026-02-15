// Mock Query Engine - Client-side SQL execution on mock data

import { customers, products, orders, orderItems } from './index';
import type { Customer, Product, Order, OrderItem } from './index';
import { mockRelationships } from './schema';

export interface QueryField {
  tableName: string;
  columnName: string;
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT' | 'none';
  dateGranularity?: 'raw' | 'year' | 'quarter' | 'month' | 'week' | 'day';
}

export interface QueryFilter {
  tableName: string;
  columnName: string;
  operator: string;
  value: string;
  value2?: string;
}

export interface QuerySort {
  tableName: string;
  columnName: string;
  direction: 'ASC' | 'DESC';
}

export interface ColumnInfo {
  key: string;          // "tableName.columnName"
  name: string;         // Display name (columnName)
  type: string;         // Data type
  tableName: string;    // Source table
}

export interface QueryResult {
  columns: ColumnInfo[];
  rows: Record<string, any>[];
  row_count: number;
  execution_time_ms: number;
  total_row_count: number;
}

type TableData = Customer | Product | Order | OrderItem;
type JoinedRow = Record<string, any>;

// Get table data by name
function getTableData(tableName: string): TableData[] {
  switch (tableName) {
    case 'customers': return customers;
    case 'products': return products;
    case 'orders': return orders;
    case 'order_items': return orderItems;
    default: return [];
  }
}

// Join tables based on relationships
function joinTables(requiredTables: Set<string>): JoinedRow[] {
  if (requiredTables.size === 0) return [];

  // Start with the fact table (order_items if present, else orders, else first table)
  let baseTable: string;
  if (requiredTables.has('order_items')) {
    baseTable = 'order_items';
  } else if (requiredTables.has('orders')) {
    baseTable = 'orders';
  } else {
    baseTable = Array.from(requiredTables)[0];
  }

  let result: JoinedRow[] = getTableData(baseTable).map(row => ({
    ...prefixKeys(row as Record<string, any>, baseTable)
  }));

  // Determine which joins to perform
  const tablesToJoin = Array.from(requiredTables).filter(t => t !== baseTable);

  for (const targetTable of tablesToJoin) {
    // Find relationship path
    const relationship = mockRelationships.find(
      rel => (rel.sourceTable === baseTable && rel.targetTable === targetTable) ||
             (rel.targetTable === baseTable && rel.sourceTable === targetTable) ||
             (result.length > 0 && (rel.sourceTable === targetTable || rel.targetTable === targetTable))
    );

    if (relationship) {
      const targetData = getTableData(targetTable);
      const sourceCol = `${relationship.sourceTable}.${relationship.sourceColumn}`;
      const targetCol = `${relationship.targetTable}.${relationship.targetColumn}`;

      result = result.map(row => {
        const matchingTarget = targetData.find(
          (target: any) => row[sourceCol] === target[relationship.targetColumn]
        );

        if (matchingTarget) {
          return { ...row, ...prefixKeys(matchingTarget as Record<string, any>, targetTable) };
        } else if (relationship.joinType === 'LEFT') {
          return row;
        }
        return null;
      }).filter(row => row !== null) as JoinedRow[];
    }
  }

  return result;
}

// Prefix all keys with table name
function prefixKeys(obj: Record<string, any>, prefix: string): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[`${prefix}.${key}`] = value;
  }
  return result;
}

// Apply filters to rows
function applyFilters(rows: JoinedRow[], filters: QueryFilter[]): JoinedRow[] {
  return rows.filter(row => {
    return filters.every(filter => {
      const key = `${filter.tableName}.${filter.columnName}`;
      const value = row[key];

      switch (filter.operator) {
        case 'equals':
          return String(value) === filter.value;
        case 'not_equals':
          return String(value) !== filter.value;
        case 'contains':
          return String(value).toLowerCase().includes(filter.value.toLowerCase());
        case 'not_contains':
          return !String(value).toLowerCase().includes(filter.value.toLowerCase());
        case 'gt':
          return Number(value) > Number(filter.value);
        case 'gte':
          return Number(value) >= Number(filter.value);
        case 'lt':
          return Number(value) < Number(filter.value);
        case 'lte':
          return Number(value) <= Number(filter.value);
        case 'between':
          return Number(value) >= Number(filter.value) && Number(value) <= Number(filter.value2 || 0);
        case 'in':
          return filter.value.split(',').map(v => v.trim()).includes(String(value));
        case 'is_null':
          return value === null || value === undefined;
        case 'is_not_null':
          return value !== null && value !== undefined;
        case 'starts_with':
          return String(value).toLowerCase().startsWith(filter.value.toLowerCase());
        case 'ends_with':
          return String(value).toLowerCase().endsWith(filter.value.toLowerCase());
        case 'date_equals':
          return new Date(value).toISOString().split('T')[0] === filter.value;
        case 'date_before':
          return new Date(value) < new Date(filter.value);
        case 'date_after':
          return new Date(value) > new Date(filter.value);
        default:
          return true;
      }
    });
  });
}

// Apply date granularity transformation
function applyDateGranularity(dateStr: string, granularity?: string): string {
  const date = new Date(dateStr);

  switch (granularity) {
    case 'year':
      return date.getFullYear().toString();
    case 'quarter':
      const q = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${q}`;
    case 'month':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'week':
      const weekNum = getWeekNumber(date);
      return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    case 'day':
      return date.toISOString().split('T')[0];
    case 'raw':
    default:
      return dateStr;
  }
}

// Get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Group and aggregate rows
function groupAndAggregate(rows: JoinedRow[], fields: QueryField[]): JoinedRow[] {
  const hasAggregation = fields.some(f => f.aggregation && f.aggregation !== 'none');

  if (!hasAggregation) {
    // No aggregation, just select and transform fields
    return rows.map(row => {
      const result: Record<string, any> = {};
      for (const field of fields) {
        const key = `${field.tableName}.${field.columnName}`;
        let value = row[key];

        if (field.dateGranularity && value) {
          value = applyDateGranularity(value, field.dateGranularity);
        }

        result[`${field.tableName}.${field.columnName}`] = value;
      }
      return result;
    });
  }

  // Group by non-aggregated fields
  const groupByFields = fields.filter(f => !f.aggregation || f.aggregation === 'none');
  const aggregateFields = fields.filter(f => f.aggregation && f.aggregation !== 'none');

  const groups = new Map<string, JoinedRow[]>();

  for (const row of rows) {
    const groupKey = groupByFields.map(f => {
      const key = `${f.tableName}.${f.columnName}`;
      let value = row[key];
      if (f.dateGranularity && value) {
        value = applyDateGranularity(value, f.dateGranularity);
      }
      return value;
    }).join('|||');

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(row);
  }

  // Compute aggregates for each group
  const result: JoinedRow[] = [];

  for (const [groupKey, groupRows] of groups) {
    const resultRow: Record<string, any> = {};

    // Add group by fields
    groupByFields.forEach((f, idx) => {
      const key = `${f.tableName}.${f.columnName}`;
      const value = groupKey.split('|||')[idx];
      resultRow[key] = value;
    });

    // Compute aggregates
    for (const field of aggregateFields) {
      const key = `${field.tableName}.${field.columnName}`;
      const values = groupRows.map(r => r[key]).filter(v => v !== null && v !== undefined);

      let aggregatedValue: any;
      switch (field.aggregation) {
        case 'SUM':
          aggregatedValue = values.reduce((sum, v) => sum + Number(v), 0);
          break;
        case 'AVG':
          aggregatedValue = values.length > 0
            ? values.reduce((sum, v) => sum + Number(v), 0) / values.length
            : 0;
          break;
        case 'COUNT':
          aggregatedValue = groupRows.length;
          break;
        case 'COUNT_DISTINCT':
          aggregatedValue = new Set(values).size;
          break;
        case 'MIN':
          aggregatedValue = Math.min(...values.map(v => Number(v)));
          break;
        case 'MAX':
          aggregatedValue = Math.max(...values.map(v => Number(v)));
          break;
        default:
          aggregatedValue = null;
      }

      resultRow[key] = aggregatedValue;
    }

    result.push(resultRow);
  }

  return result;
}

// Apply sorting
function applySort(rows: JoinedRow[], sorts: QuerySort[]): JoinedRow[] {
  if (sorts.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const key = `${sort.tableName}.${sort.columnName}`;
      const aVal = a[key];
      const bVal = b[key];

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      else if (aVal > bVal) comparison = 1;

      if (comparison !== 0) {
        return sort.direction === 'ASC' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

// Main query execution function
export function executeMockQuery(
  fields: QueryField[],
  filters: QueryFilter[] = [],
  sorts: QuerySort[] = [],
  limit?: number
): QueryResult {
  const startTime = Date.now();

  // Determine required tables
  const requiredTables = new Set<string>();
  for (const field of fields) {
    requiredTables.add(field.tableName);
  }
  for (const filter of filters) {
    requiredTables.add(filter.tableName);
  }
  for (const sort of sorts) {
    requiredTables.add(sort.tableName);
  }

  // Join tables
  let rows = joinTables(requiredTables);

  // Apply filters
  if (filters.length > 0) {
    rows = applyFilters(rows, filters);
  }

  const totalRowCount = rows.length;

  // Group and aggregate
  rows = groupAndAggregate(rows, fields);

  // Apply sorting
  if (sorts.length > 0) {
    rows = applySort(rows, sorts);
  }

  // Apply limit
  if (limit && limit > 0) {
    rows = rows.slice(0, limit);
  }

  // Format result
  const columns: ColumnInfo[] = fields.map(f => {
    const key = `${f.tableName}.${f.columnName}`;
    const type = f.aggregation && f.aggregation !== 'none' ? 'DOUBLE' : 'VARCHAR';

    return {
      key,
      name: f.columnName,
      type,
      tableName: f.tableName,
    };
  });

  const executionTime = Date.now() - startTime + Math.random() * 100; // Add some variance

  return {
    columns,
    rows,
    row_count: rows.length,
    execution_time_ms: Math.round(executionTime),
    total_row_count: totalRowCount
  };
}

// Get unique values for a column (for filter suggestions)
export function getUniqueValues(tableName: string, columnName: string): string[] {
  const data = getTableData(tableName);
  const values = new Set<string>();

  for (const row of data) {
    const value = (row as any)[columnName];
    if (value !== null && value !== undefined) {
      values.add(String(value));
    }
  }

  return Array.from(values).sort();
}

// Compute pivot table
export function computePivot(
  rowFields: QueryField[],
  colField: QueryField,
  measureField: QueryField,
  filters: QueryFilter[] = []
): { columns: string[]; rows: Record<string, any>[] } {
  // Determine required tables
  const requiredTables = new Set<string>();
  for (const field of [...rowFields, colField, measureField]) {
    requiredTables.add(field.tableName);
  }
  for (const filter of filters) {
    requiredTables.add(filter.tableName);
  }

  // Join and filter
  let data = joinTables(requiredTables);
  if (filters.length > 0) {
    data = applyFilters(data, filters);
  }

  // Build pivot structure
  const pivotMap = new Map<string, Map<string, number>>();
  const colValues = new Set<string>();

  for (const row of data) {
    const rowKey = rowFields.map(f => {
      const key = `${f.tableName}.${f.columnName}`;
      return row[key];
    }).join('|||');

    const colKey = `${colField.tableName}.${colField.columnName}`;
    const colValue = String(row[colKey]);
    colValues.add(colValue);

    const measureKey = `${measureField.tableName}.${measureField.columnName}`;
    const measureValue = Number(row[measureKey]) || 0;

    if (!pivotMap.has(rowKey)) {
      pivotMap.set(rowKey, new Map());
    }

    const currentValue = pivotMap.get(rowKey)!.get(colValue) || 0;
    pivotMap.get(rowKey)!.set(colValue, currentValue + measureValue);
  }

  // Format result
  const sortedColValues = Array.from(colValues).sort();
  const columns = [
    ...rowFields.map(f => `${f.tableName}.${f.columnName}`),
    ...sortedColValues
  ];

  const rows: Record<string, any>[] = [];
  for (const [rowKey, colMap] of pivotMap) {
    const resultRow: Record<string, any> = {};

    const rowKeyParts = rowKey.split('|||');
    rowFields.forEach((f, idx) => {
      resultRow[`${f.tableName}.${f.columnName}`] = rowKeyParts[idx];
    });

    for (const colValue of sortedColValues) {
      resultRow[colValue] = colMap.get(colValue) || 0;
    }

    rows.push(resultRow);
  }

  return { columns, rows };
}
