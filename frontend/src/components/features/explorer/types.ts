export type AggregationType = 'none' | 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'MEDIAN' | 'COUNT_DISTINCT';
export type DateGranularity = 'raw' | 'year' | 'quarter' | 'month' | 'week' | 'day';

export type FilterOperator =
  // Text
  | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'is_null' | 'is_not_null'
  // Numeric
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  // Date
  | 'date_equals' | 'date_before' | 'date_after' | 'date_between' | 'date_last_n_days' | 'date_last_n_months' | 'date_this_month' | 'date_this_year' | 'date_last_year';

export interface QueryFilter {
  id: string;
  column: string;
  tableName: string;
  type: string; // column data type
  operator: FilterOperator;
  value: string;
  value2?: string; // for "between" operators
}

export interface SortRule {
  column: string;
  tableName: string;
  direction: 'ASC' | 'DESC';
}

export interface SelectedField {
  name: string;
  tableName: string;
  type: string;
  aggregation: AggregationType;
  dateGranularity: DateGranularity;
}

export type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'kpi';
