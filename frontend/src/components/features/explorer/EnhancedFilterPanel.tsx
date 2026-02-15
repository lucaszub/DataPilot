"use client";

import React, { useState } from 'react';
import { Plus, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer, ExplorerFilter } from './ExplorerContext';
import { mockTables } from '@/lib/mock-data/schema';
import { getUniqueValues } from '@/lib/mock-data/query-engine';

// Type helper functions to handle schema type names
const isDateType = (type: string): boolean => {
  return ['DATE', 'TIMESTAMP', 'date'].includes(type);
};

const isNumericType = (type: string): boolean => {
  return ['INTEGER', 'DOUBLE', 'number'].includes(type);
};

const isStringType = (type: string): boolean => {
  return ['VARCHAR', 'string'].includes(type);
};

const normalizeType = (type: string): 'string' | 'number' | 'date' => {
  if (isDateType(type)) return 'date';
  if (isNumericType(type)) return 'number';
  return 'string';
};

const operatorsByType: Record<string, Array<{ value: string; label: string }>> = {
  string: [
    { value: 'equals', label: 'Égal à' },
    { value: 'not_equals', label: 'Différent de' },
    { value: 'contains', label: 'Contient' },
    { value: 'not_contains', label: 'Ne contient pas' },
    { value: 'starts_with', label: 'Commence par' },
    { value: 'ends_with', label: 'Se termine par' },
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'greater_than', label: '>' },
    { value: 'greater_than_or_equal', label: '≥' },
    { value: 'less_than', label: '<' },
    { value: 'less_than_or_equal', label: '≤' },
    { value: 'between', label: 'Entre' },
  ],
  date: [
    { value: 'equals', label: 'Le' },
    { value: 'not_equals', label: 'Pas le' },
    { value: 'after', label: 'Après' },
    { value: 'before', label: 'Avant' },
    { value: 'between', label: 'Entre' },
    { value: 'last_7_days', label: '7 derniers jours' },
    { value: 'last_30_days', label: '30 derniers jours' },
    { value: 'this_month', label: 'Ce mois' },
    { value: 'last_month', label: 'Mois dernier' },
    { value: 'this_quarter', label: 'Ce trimestre' },
    { value: 'this_year', label: 'Cette année' },
  ],
};

interface FilterEditorProps {
  filter: ExplorerFilter;
  onUpdate: (updates: Partial<ExplorerFilter>) => void;
  onRemove: () => void;
}

function FilterEditor({ filter, onUpdate, onRemove }: FilterEditorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const allColumns = mockTables.flatMap(table =>
    table.columns.map(col => ({
      tableName: table.name,
      tableDisplay: table.displayName,
      columnName: col.name,
      columnType: col.type,
    }))
  );

  const selectedColumn = allColumns.find(
    col => col.tableName === filter.tableName && col.columnName === filter.column
  );

  const normalizedType = selectedColumn ? normalizeType(selectedColumn.columnType) : 'string';
  const operators = operatorsByType[normalizedType];

  const handleColumnChange = (value: string) => {
    const [tableName, columnName] = value.split('.');
    const column = allColumns.find(col => col.tableName === tableName && col.columnName === columnName);
    if (column) {
      const normalizedColType = normalizeType(column.columnType);
      onUpdate({
        tableName: column.tableName,
        column: column.columnName,
        type: column.columnType,
        operator: operatorsByType[normalizedColType]?.[0]?.value || 'equals',
        value: '',
      });
    }
  };

  const handleValueChange = (value: string) => {
    onUpdate({ value });

    // Load suggestions for string columns
    if (selectedColumn && isStringType(selectedColumn.columnType) && value.length > 0) {
      const values = getUniqueValues(filter.tableName, filter.column);
      const filtered = values
        .filter(v => String(v).toLowerCase().includes(value.toLowerCase()))
        .slice(0, 10);
      setSuggestions(filtered.map(String));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (value: string) => {
    onUpdate({ value });
    setShowSuggestions(false);
  };

  const needsSecondValue = filter.operator === 'between';

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
      {/* Column selector */}
      <select
        value={filter.tableName && filter.column ? `${filter.tableName}.${filter.column}` : ''}
        onChange={(e) => handleColumnChange(e.target.value)}
        className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="">Sélectionner un champ</option>
        {mockTables.map(table => (
          <optgroup key={table.name} label={table.displayName}>
            {table.columns.map(col => (
              <option key={col.name} value={`${table.name}.${col.name}`}>
                {col.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Operator */}
      <select
        value={filter.operator}
        onChange={(e) => onUpdate({ operator: e.target.value })}
        className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {operators.map(op => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value input */}
      {!filter.operator.startsWith('last_') && !['this_month', 'last_month', 'this_quarter', 'this_year'].includes(filter.operator) && (
        <div className="relative flex-1">
          <input
            type={normalizedType === 'date' ? 'date' : normalizedType === 'number' ? 'number' : 'text'}
            value={filter.value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Valeur..."
            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted/50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Second value for "between" */}
      {needsSecondValue && (
        <>
          <span className="text-sm text-muted-foreground">et</span>
          <input
            type={normalizedType === 'date' ? 'date' : normalizedType === 'number' ? 'number' : 'text'}
            value={filter.value2 || ''}
            onChange={(e) => onUpdate({ value2: e.target.value })}
            placeholder="Valeur 2..."
            className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </>
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function EnhancedFilterPanel() {
  const { state, dispatch } = useExplorer();
  const [isAddingFilter, setIsAddingFilter] = useState(false);

  const addFilter = () => {
    const newFilter: ExplorerFilter = {
      id: `filter-${Date.now()}`,
      column: '',
      tableName: '',
      type: 'string',
      operator: 'equals',
      value: '',
    };
    dispatch({ type: 'ADD_FILTER', filter: newFilter });
    setIsAddingFilter(true);
  };

  const updateFilter = (filterId: string, updates: Partial<ExplorerFilter>) => {
    dispatch({ type: 'UPDATE_FILTER', filterId, filter: updates });
  };

  const removeFilter = (filterId: string) => {
    dispatch({ type: 'REMOVE_FILTER', filterId });
  };

  const clearAllFilters = () => {
    state.filters.forEach(f => removeFilter(f.id));
  };

  const applyPreset = (preset: string) => {
    const now = new Date();
    let startDate = '';
    let operator = 'after';

    switch (preset) {
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        operator = 'between';
        break;
      case 'this_quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'last_12_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate()).toISOString().split('T')[0];
        break;
    }

    // Find a date column to apply the filter
    const dateColumn = mockTables
      .flatMap(t => t.columns.filter(c => isDateType(c.type)).map(c => ({ table: t.name, column: c.name })))
      [0];

    if (dateColumn) {
      const newFilter: ExplorerFilter = {
        id: `filter-${Date.now()}`,
        column: dateColumn.column,
        tableName: dateColumn.table,
        type: 'date',
        operator,
        value: startDate,
      };
      dispatch({ type: 'ADD_FILTER', filter: newFilter });
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Filtres</h3>
          {state.filters.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
              {state.filters.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.filters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Effacer tout
            </button>
          )}
          <button
            onClick={addFilter}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Active filters */}
      {state.filters.length > 0 && (
        <div className="space-y-2 mb-3">
          {state.filters.map(filter => (
            <FilterEditor
              key={filter.id}
              filter={filter}
              onUpdate={(updates) => updateFilter(filter.id, updates)}
              onRemove={() => removeFilter(filter.id)}
            />
          ))}
        </div>
      )}

      {/* Date presets */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => applyPreset('this_month')}
          className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-full transition-colors"
        >
          Ce mois
        </button>
        <button
          onClick={() => applyPreset('last_month')}
          className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-full transition-colors"
        >
          Mois dernier
        </button>
        <button
          onClick={() => applyPreset('this_quarter')}
          className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-full transition-colors"
        >
          Ce trimestre
        </button>
        <button
          onClick={() => applyPreset('this_year')}
          className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-full transition-colors"
        >
          Cette année
        </button>
        <button
          onClick={() => applyPreset('last_12_months')}
          className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-full transition-colors"
        >
          12 derniers mois
        </button>
      </div>
    </div>
  );
}
