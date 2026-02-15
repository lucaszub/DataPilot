"use client";

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { executeMockQuery, QueryField, QueryFilter, QuerySort, QueryResult } from '@/lib/mock-data/query-engine';
import { mockSavedQueries } from '@/lib/mock-data/saved-queries';
import { mockRelationships } from '@/lib/mock-data/schema';

export type AggregationType = 'none' | 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'MEDIAN' | 'COUNT_DISTINCT';
export type DateGranularity = 'raw' | 'year' | 'quarter' | 'month' | 'week' | 'day';
export type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'kpi' | 'area';
export type ViewMode = 'table' | 'spreadsheet' | 'chart' | 'pivot';
export type SqlMode = 'visual' | 'sql';
export type QuickCalcType = 'none' | 'pct_of_total' | 'running_total' | 'difference' | 'pct_change' | 'rank' | 'cumulative_avg';

export const quickCalcLabels: Record<QuickCalcType, string> = {
  none: 'Aucun',
  pct_of_total: '% du total',
  running_total: 'Total cumulé',
  difference: 'Différence',
  pct_change: '% variation',
  rank: 'Rang',
  cumulative_avg: 'Moyenne cumulée',
};

export interface SelectedField {
  id: string;
  name: string;
  tableName: string;
  type: string;
  role: 'dimension' | 'measure' | 'key';
  aggregation: AggregationType;
  dateGranularity: DateGranularity;
  quickCalc?: QuickCalcType;
  customLabel?: string;
}

export type CalcFormulaType =
  | 'add'           // colA + colB
  | 'subtract'      // colA - colB
  | 'multiply'      // colA * colB
  | 'divide'        // colA / colB
  | 'margin'        // (price - cost) / price * 100
  | 'pct_of_total'  // value / SUM(value) * 100
  | 'running_total' // cumulative sum
  | 'custom';       // raw expression

export const calcFormulaLabels: Record<CalcFormulaType, string> = {
  add: 'Addition (A + B)',
  subtract: 'Soustraction (A - B)',
  multiply: 'Multiplication (A × B)',
  divide: 'Division (A / B)',
  margin: 'Marge % ((A - B) / A × 100)',
  pct_of_total: '% du total',
  running_total: 'Total cumulé',
  custom: 'Formule personnalisée',
};

export interface CalculatedColumn {
  id: string;
  label: string;
  formula: CalcFormulaType;
  columnA?: string;  // "tableName.columnName"
  columnB?: string;  // "tableName.columnName"
  customExpression?: string;
}

export interface ExplorerFilter {
  id: string;
  column: string;
  tableName: string;
  type: string;
  operator: string;
  value: string;
  value2?: string;
}

export interface ExplorerSort {
  id: string;
  column: string;
  tableName: string;
  direction: 'ASC' | 'DESC';
}

export interface ExplorerState {
  selectedFields: SelectedField[];
  calculatedColumns: CalculatedColumn[];
  filters: ExplorerFilter[];
  sortRules: ExplorerSort[];
  chartType: ChartType;
  viewMode: ViewMode;
  sqlMode: SqlMode;
  customSql: string;
  result: QueryResult | null;
  isExecuting: boolean;
  error: string | null;
  queryLimit: number;
  showFilters: boolean;
  showSorts: boolean;
  showHistory: boolean;
  showAiPanel: boolean;
  showSqlPreview: boolean;
  generatedSql: string;
  autoExecute: boolean;
}

type ExplorerAction =
  | { type: 'ADD_FIELD'; field: SelectedField }
  | { type: 'REMOVE_FIELD'; fieldId: string }
  | { type: 'UPDATE_FIELD_AGGREGATION'; fieldId: string; aggregation: AggregationType }
  | { type: 'UPDATE_FIELD_GRANULARITY'; fieldId: string; granularity: DateGranularity }
  | { type: 'UPDATE_FIELD_QUICK_CALC'; fieldId: string; quickCalc: QuickCalcType }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'SET_CHART_TYPE'; chartType: ChartType }
  | { type: 'SET_SQL_MODE'; mode: SqlMode }
  | { type: 'SET_CUSTOM_SQL'; sql: string }
  | { type: 'ADD_FILTER'; filter: ExplorerFilter }
  | { type: 'REMOVE_FILTER'; filterId: string }
  | { type: 'UPDATE_FILTER'; filterId: string; filter: Partial<ExplorerFilter> }
  | { type: 'ADD_SORT'; sort: ExplorerSort }
  | { type: 'REMOVE_SORT'; sortId: string }
  | { type: 'SET_QUERY_LIMIT'; limit: number }
  | { type: 'EXECUTE_QUERY' }
  | { type: 'SET_RESULT'; result: QueryResult }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_EXECUTING'; isExecuting: boolean }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'TOGGLE_SORTS' }
  | { type: 'TOGGLE_HISTORY' }
  | { type: 'TOGGLE_AI_PANEL' }
  | { type: 'TOGGLE_SQL_PREVIEW' }
  | { type: 'TOGGLE_AUTO_EXECUTE' }
  | { type: 'ADD_CALCULATED_COLUMN'; column: CalculatedColumn }
  | { type: 'REMOVE_CALCULATED_COLUMN'; columnId: string }
  | { type: 'LOAD_SAVED_QUERY'; queryId: string }
  | { type: 'RESET' };

const initialState: ExplorerState = {
  selectedFields: [],
  calculatedColumns: [],
  filters: [],
  sortRules: [],
  chartType: 'table',
  viewMode: 'table',
  sqlMode: 'visual',
  customSql: '',
  result: null,
  isExecuting: false,
  error: null,
  queryLimit: 500,
  showFilters: false,
  showSorts: false,
  showHistory: false,
  showAiPanel: false,
  showSqlPreview: false,
  generatedSql: '',
  autoExecute: true,
};

// --- SQL Generation from visual state ---
export function generateSqlFromState(state: ExplorerState): string {
  if (state.selectedFields.length === 0) return '-- Sélectionnez des champs pour générer le SQL';

  const dimensions = state.selectedFields.filter(f => f.role === 'dimension');
  const measures = state.selectedFields.filter(f => f.role === 'measure');

  // Determine all required tables
  const tables = new Set<string>();
  state.selectedFields.forEach(f => tables.add(f.tableName));
  state.filters.forEach(f => tables.add(f.tableName));
  state.sortRules.forEach(s => tables.add(s.tableName));

  // SELECT clause
  const selectParts: string[] = [];

  for (const field of dimensions) {
    if (field.dateGranularity && field.dateGranularity !== 'raw') {
      selectParts.push(`  DATE_TRUNC('${field.dateGranularity}', ${field.tableName}.${field.name}) AS ${field.name}_${field.dateGranularity}`);
    } else {
      selectParts.push(`  ${field.tableName}.${field.name}`);
    }
  }

  for (const field of measures) {
    const agg = field.aggregation && field.aggregation !== 'none' ? field.aggregation : null;
    const baseExpr = agg ? `${agg}(${field.tableName}.${field.name})` : `${field.tableName}.${field.name}`;
    const alias = agg ? `${agg.toLowerCase()}_${field.name}` : field.name;

    if (field.quickCalc && field.quickCalc !== 'none') {
      const dimOrder = dimensions.length > 0 ? `${dimensions[0].tableName}.${dimensions[0].name}` : '1';
      switch (field.quickCalc) {
        case 'pct_of_total':
          selectParts.push(`  ${baseExpr} * 100.0 / SUM(${baseExpr}) OVER () AS pct_${field.name}`);
          break;
        case 'running_total':
          selectParts.push(`  SUM(${baseExpr}) OVER (ORDER BY ${dimOrder}) AS running_${field.name}`);
          break;
        case 'difference':
          selectParts.push(`  ${baseExpr} - LAG(${baseExpr}) OVER (ORDER BY ${dimOrder}) AS diff_${field.name}`);
          break;
        case 'pct_change':
          selectParts.push(`  ROUND((${baseExpr} - LAG(${baseExpr}) OVER (ORDER BY ${dimOrder})) * 100.0 / NULLIF(LAG(${baseExpr}) OVER (ORDER BY ${dimOrder}), 0), 2) AS pct_chg_${field.name}`);
          break;
        case 'rank':
          selectParts.push(`  RANK() OVER (ORDER BY ${baseExpr} DESC) AS rank_${field.name}`);
          break;
        case 'cumulative_avg':
          selectParts.push(`  AVG(${baseExpr}) OVER (ORDER BY ${dimOrder} ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_avg_${field.name}`);
          break;
        default:
          selectParts.push(`  ${baseExpr} AS ${alias}`);
      }
    } else {
      selectParts.push(`  ${baseExpr} AS ${alias}`);
    }
  }

  // FROM + JOINs
  const tablesArr = Array.from(tables);
  let baseTable = tablesArr.includes('order_items') ? 'order_items'
    : tablesArr.includes('orders') ? 'orders'
    : tablesArr[0];

  const joinClauses: string[] = [];
  const joinedTables = new Set([baseTable]);

  for (const table of tablesArr) {
    if (table === baseTable) continue;
    const rel = mockRelationships.find(
      r => (r.sourceTable === baseTable && r.targetTable === table) ||
           (r.targetTable === baseTable && r.sourceTable === table) ||
           (joinedTables.has(r.sourceTable) && r.targetTable === table) ||
           (joinedTables.has(r.targetTable) && r.sourceTable === table)
    );
    if (rel) {
      joinClauses.push(`  ${rel.joinType} JOIN ${table} ON ${rel.sourceTable}.${rel.sourceColumn} = ${rel.targetTable}.${rel.targetColumn}`);
      joinedTables.add(table);
    }
  }

  // WHERE clause
  const whereParts: string[] = [];
  for (const filter of state.filters) {
    const col = `${filter.tableName}.${filter.column}`;
    switch (filter.operator) {
      case 'equals': whereParts.push(`${col} = '${filter.value}'`); break;
      case 'not_equals': whereParts.push(`${col} != '${filter.value}'`); break;
      case 'contains': whereParts.push(`${col} LIKE '%${filter.value}%'`); break;
      case 'gt': case 'greater_than': whereParts.push(`${col} > ${filter.value}`); break;
      case 'gte': case 'greater_than_or_equal': whereParts.push(`${col} >= ${filter.value}`); break;
      case 'lt': case 'less_than': whereParts.push(`${col} < ${filter.value}`); break;
      case 'lte': case 'less_than_or_equal': whereParts.push(`${col} <= ${filter.value}`); break;
      case 'between': whereParts.push(`${col} BETWEEN ${filter.value} AND ${filter.value2 || 0}`); break;
      case 'is_null': whereParts.push(`${col} IS NULL`); break;
      case 'is_not_null': whereParts.push(`${col} IS NOT NULL`); break;
      case 'date_after': case 'after': whereParts.push(`${col} > '${filter.value}'`); break;
      case 'date_before': case 'before': whereParts.push(`${col} < '${filter.value}'`); break;
      default: whereParts.push(`${col} = '${filter.value}'`);
    }
  }

  // GROUP BY
  const hasAgg = measures.some(m => m.aggregation && m.aggregation !== 'none');
  const groupByParts: string[] = [];
  if (hasAgg && dimensions.length > 0) {
    for (const field of dimensions) {
      if (field.dateGranularity && field.dateGranularity !== 'raw') {
        groupByParts.push(`DATE_TRUNC('${field.dateGranularity}', ${field.tableName}.${field.name})`);
      } else {
        groupByParts.push(`${field.tableName}.${field.name}`);
      }
    }
  }

  // ORDER BY
  const orderByParts: string[] = [];
  for (const sort of state.sortRules) {
    orderByParts.push(`${sort.tableName}.${sort.column} ${sort.direction}`);
  }

  // Build final SQL
  let sql = `SELECT\n${selectParts.join(',\n')}\nFROM ${baseTable}`;
  if (joinClauses.length > 0) sql += `\n${joinClauses.join('\n')}`;
  if (whereParts.length > 0) sql += `\nWHERE ${whereParts.join('\n  AND ')}`;
  if (groupByParts.length > 0) sql += `\nGROUP BY ${groupByParts.join(', ')}`;
  if (orderByParts.length > 0) sql += `\nORDER BY ${orderByParts.join(', ')}`;
  if (state.queryLimit > 0) sql += `\nLIMIT ${state.queryLimit}`;

  return sql;
}

function withSql(state: ExplorerState): ExplorerState {
  return { ...state, generatedSql: generateSqlFromState(state) };
}

function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case 'ADD_FIELD': {
      const exists = state.selectedFields.some(f => f.id === action.field.id);
      if (exists) return state;
      return withSql({
        ...state,
        selectedFields: [...state.selectedFields, action.field],
      });
    }

    case 'REMOVE_FIELD':
      return withSql({
        ...state,
        selectedFields: state.selectedFields.filter(f => f.id !== action.fieldId),
      });

    case 'UPDATE_FIELD_AGGREGATION':
      return withSql({
        ...state,
        selectedFields: state.selectedFields.map(f =>
          f.id === action.fieldId ? { ...f, aggregation: action.aggregation } : f
        ),
      });

    case 'UPDATE_FIELD_GRANULARITY':
      return withSql({
        ...state,
        selectedFields: state.selectedFields.map(f =>
          f.id === action.fieldId ? { ...f, dateGranularity: action.granularity } : f
        ),
      });

    case 'UPDATE_FIELD_QUICK_CALC':
      return withSql({
        ...state,
        selectedFields: state.selectedFields.map(f =>
          f.id === action.fieldId ? { ...f, quickCalc: action.quickCalc } : f
        ),
      });

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };

    case 'SET_CHART_TYPE':
      return { ...state, chartType: action.chartType };

    case 'SET_SQL_MODE':
      return { ...state, sqlMode: action.mode };

    case 'SET_CUSTOM_SQL':
      return { ...state, customSql: action.sql };

    case 'ADD_FILTER': {
      const exists = state.filters.some(f => f.id === action.filter.id);
      if (exists) return state;
      return withSql({
        ...state,
        filters: [...state.filters, action.filter],
        showFilters: true,
      });
    }

    case 'REMOVE_FILTER':
      return withSql({
        ...state,
        filters: state.filters.filter(f => f.id !== action.filterId),
      });

    case 'UPDATE_FILTER':
      return withSql({
        ...state,
        filters: state.filters.map(f =>
          f.id === action.filterId ? { ...f, ...action.filter } : f
        ),
      });

    case 'ADD_SORT': {
      const exists = state.sortRules.some(s => s.id === action.sort.id);
      if (exists) return state;
      return withSql({
        ...state,
        sortRules: [...state.sortRules, action.sort],
        showSorts: true,
      });
    }

    case 'REMOVE_SORT':
      return withSql({
        ...state,
        sortRules: state.sortRules.filter(s => s.id !== action.sortId),
      });

    case 'SET_QUERY_LIMIT':
      return withSql({ ...state, queryLimit: action.limit });

    case 'EXECUTE_QUERY': {
      // Build query from current state
      const fields: QueryField[] = state.selectedFields.map(f => ({
        columnName: f.name,
        tableName: f.tableName,
        aggregation: f.aggregation === 'none' || f.aggregation === 'MEDIAN' ? undefined : f.aggregation,
        dateGranularity: f.dateGranularity === 'raw' ? undefined : f.dateGranularity,
      }));

      const filters: QueryFilter[] = state.filters.map(f => ({
        columnName: f.column,
        tableName: f.tableName,
        operator: f.operator,
        value: f.value,
        value2: f.value2,
      }));

      const sorts: QuerySort[] = state.sortRules.map(s => ({
        columnName: s.column,
        tableName: s.tableName,
        direction: s.direction,
      }));

      try {
        const result = executeMockQuery(
          fields,
          filters,
          sorts,
          state.queryLimit
        );

        return {
          ...state,
          result,
          error: null,
          isExecuting: false,
        };
      } catch (error) {
        return {
          ...state,
          error: error instanceof Error ? error.message : 'Erreur lors de l\'exécution',
          isExecuting: false,
        };
      }
    }

    case 'SET_RESULT':
      return { ...state, result: action.result, error: null };

    case 'SET_ERROR':
      return { ...state, error: action.error, result: null };

    case 'SET_EXECUTING':
      return { ...state, isExecuting: action.isExecuting };

    case 'TOGGLE_FILTERS':
      return { ...state, showFilters: !state.showFilters };

    case 'TOGGLE_SORTS':
      return { ...state, showSorts: !state.showSorts };

    case 'TOGGLE_HISTORY':
      return { ...state, showHistory: !state.showHistory };

    case 'TOGGLE_AI_PANEL':
      return { ...state, showAiPanel: !state.showAiPanel };

    case 'TOGGLE_SQL_PREVIEW':
      return { ...state, showSqlPreview: !state.showSqlPreview };

    case 'TOGGLE_AUTO_EXECUTE':
      return { ...state, autoExecute: !state.autoExecute };

    case 'ADD_CALCULATED_COLUMN':
      return {
        ...state,
        calculatedColumns: [...state.calculatedColumns, action.column],
      };

    case 'REMOVE_CALCULATED_COLUMN':
      return {
        ...state,
        calculatedColumns: state.calculatedColumns.filter(c => c.id !== action.columnId),
      };

    case 'LOAD_SAVED_QUERY': {
      const savedQuery = mockSavedQueries.find((q: any) => q.id === action.queryId);
      if (!savedQuery) return state;

      const fields: SelectedField[] = savedQuery.fields.map((f: any, idx: number) => ({
        id: `${f.tableName}.${f.columnName}-${idx}`,
        name: f.columnName,
        tableName: f.tableName,
        type: 'string', // Mock type
        role: f.aggregation ? 'measure' : 'dimension',
        aggregation: f.aggregation || 'none',
        dateGranularity: f.dateGranularity || 'raw',
      }));

      return withSql({
        ...state,
        selectedFields: fields,
        chartType: savedQuery.chartType,
        viewMode: savedQuery.chartType === 'table' ? 'table' : 'chart',
      });
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface ExplorerContextValue {
  state: ExplorerState;
  dispatch: React.Dispatch<ExplorerAction>;
}

// Compute calculated columns on existing result
export function applyCalculatedColumns(
  result: QueryResult,
  calculatedColumns: CalculatedColumn[]
): QueryResult {
  if (calculatedColumns.length === 0) return result;

  const newColumns = [...result.columns];
  const newRows = result.rows.map(row => ({ ...row }));

  for (const calc of calculatedColumns) {
    // Add column info
    newColumns.push({
      key: `calc.${calc.id}`,
      name: calc.label,
      type: 'DOUBLE',
      tableName: '_calculated',
    });

    // Compute values
    for (let i = 0; i < newRows.length; i++) {
      const row = newRows[i];
      const valA = calc.columnA ? Number(row[calc.columnA]) || 0 : 0;
      const valB = calc.columnB ? Number(row[calc.columnB]) || 0 : 0;

      let computed: number | null = null;
      switch (calc.formula) {
        case 'add':
          computed = valA + valB;
          break;
        case 'subtract':
          computed = valA - valB;
          break;
        case 'multiply':
          computed = valA * valB;
          break;
        case 'divide':
          computed = valB !== 0 ? valA / valB : null;
          break;
        case 'margin':
          computed = valA !== 0 ? ((valA - valB) / valA) * 100 : null;
          break;
        case 'pct_of_total': {
          const total = newRows.reduce((sum, r) => sum + (Number(r[calc.columnA!]) || 0), 0);
          computed = total !== 0 ? (valA / total) * 100 : null;
          break;
        }
        case 'running_total': {
          let cumulative = 0;
          for (let j = 0; j <= i; j++) {
            cumulative += Number(newRows[j][calc.columnA!]) || 0;
          }
          computed = cumulative;
          break;
        }
        case 'custom':
          computed = valA; // fallback
          break;
      }
      row[`calc.${calc.id}`] = computed;
    }
  }

  return { ...result, columns: newColumns, rows: newRows };
}

const ExplorerContext = createContext<ExplorerContextValue | undefined>(undefined);

export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(explorerReducer, initialState);
  const prevFieldsRef = useRef<string>('');

  // Auto-execute: run query when fields change
  useEffect(() => {
    if (!state.autoExecute) return;
    if (state.selectedFields.length === 0) return;

    const fieldsKey = JSON.stringify(
      state.selectedFields.map(f => ({
        id: f.id, agg: f.aggregation, gran: f.dateGranularity, qc: f.quickCalc,
      }))
    );

    if (fieldsKey !== prevFieldsRef.current) {
      prevFieldsRef.current = fieldsKey;
      // Small debounce to batch rapid changes
      const timer = setTimeout(() => {
        dispatch({ type: 'EXECUTE_QUERY' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [state.selectedFields, state.autoExecute]);

  // Wrap result with calculated columns
  const enrichedState = React.useMemo(() => {
    if (!state.result || state.calculatedColumns.length === 0) return state;
    return {
      ...state,
      result: applyCalculatedColumns(state.result, state.calculatedColumns),
    };
  }, [state]);

  return (
    <ExplorerContext.Provider value={{ state: enrichedState, dispatch }}>
      {children}
    </ExplorerContext.Provider>
  );
}

export function useExplorer() {
  const context = useContext(ExplorerContext);
  if (!context) {
    throw new Error('useExplorer must be used within ExplorerProvider');
  }
  return context;
}
