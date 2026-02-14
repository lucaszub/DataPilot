import React from "react";
import { Filter, Plus, ChevronDown, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNumericType, isDateType } from "./utils";
import type { QueryFilter, FilterOperator } from "./types";
import type { SemanticLayerDetail } from "@/lib/api";

interface FilterPanelProps {
  filters: QueryFilter[];
  addFilter: () => void;
  updateFilter: (filterId: string, updates: Partial<QueryFilter>) => void;
  removeFilter: (filterId: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  layerDetail: SemanticLayerDetail | undefined;
}

export function FilterPanel({
  filters,
  addFilter,
  updateFilter,
  removeFilter,
  showFilters,
  setShowFilters,
  layerDetail,
}: FilterPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="h-3.5 w-3.5" />
          Filtres
          {filters.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-teal-100 text-teal-700 text-[10px] font-semibold">
              {filters.length}
            </span>
          )}
          {showFilters ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {showFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addFilter}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter un filtre
          </Button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="space-y-2 pl-5">
          {filters.map((filter) => {
            // Get available columns from all nodes
            const allColumns = layerDetail?.definitions_json?.nodes.flatMap(node =>
              node.columns
                .filter(col => col.role !== 'ignore')
                .map(col => ({
                  name: col.name,
                  tableName: node.data_source_name,
                  type: col.type,
                  label: `${node.data_source_name}.${col.name}`,
                }))
            ) ?? [];

            // Get operators for this filter's type
            const getOperatorsForType = (type: string) => {
              if (isDateType(type)) {
                return [
                  { value: 'date_equals' as const, label: 'Égal' },
                  { value: 'date_before' as const, label: 'Avant' },
                  { value: 'date_after' as const, label: 'Après' },
                  { value: 'date_between' as const, label: 'Entre' },
                  { value: 'date_last_n_days' as const, label: 'Derniers N jours' },
                  { value: 'date_last_n_months' as const, label: 'Derniers N mois' },
                  { value: 'date_this_month' as const, label: 'Ce mois-ci' },
                  { value: 'date_this_year' as const, label: 'Cette année' },
                  { value: 'date_last_year' as const, label: 'Année dernière' },
                ];
              } else if (isNumericType(type)) {
                return [
                  { value: 'equals' as const, label: 'Égal' },
                  { value: 'not_equals' as const, label: 'Différent' },
                  { value: 'gt' as const, label: 'Supérieur' },
                  { value: 'gte' as const, label: 'Supérieur ou égal' },
                  { value: 'lt' as const, label: 'Inférieur' },
                  { value: 'lte' as const, label: 'Inférieur ou égal' },
                  { value: 'between' as const, label: 'Entre' },
                  { value: 'is_null' as const, label: 'Est vide' },
                  { value: 'is_not_null' as const, label: "N'est pas vide" },
                ];
              } else {
                return [
                  { value: 'equals' as const, label: 'Égal' },
                  { value: 'not_equals' as const, label: 'Différent' },
                  { value: 'contains' as const, label: 'Contient' },
                  { value: 'not_contains' as const, label: 'Ne contient pas' },
                  { value: 'starts_with' as const, label: 'Commence par' },
                  { value: 'ends_with' as const, label: 'Termine par' },
                  { value: 'is_null' as const, label: 'Est vide' },
                  { value: 'is_not_null' as const, label: "N'est pas vide" },
                ];
              }
            };

            const operators = getOperatorsForType(filter.type);
            const needsValue = !['is_null', 'is_not_null', 'date_this_month', 'date_this_year', 'date_last_year'].includes(filter.operator);
            const needsValue2 = ['between', 'date_between'].includes(filter.operator);

            return (
              <div key={filter.id} className="flex items-center gap-2 text-xs">
                {/* Column selector */}
                <select
                  value={`${filter.tableName}.${filter.column}`}
                  onChange={(e) => {
                    const [tableName, ...columnParts] = e.target.value.split('.');
                    const column = columnParts.join('.');
                    updateFilter(filter.id, { tableName, column });
                  }}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {allColumns.map((col) => (
                    <option key={col.label} value={col.label}>
                      {col.label}
                    </option>
                  ))}
                </select>

                {/* Operator selector */}
                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value input */}
                {needsValue && (
                  <input
                    type={
                      isDateType(filter.type) && !['date_last_n_days', 'date_last_n_months'].includes(filter.operator)
                        ? 'date'
                        : isNumericType(filter.type) || ['date_last_n_days', 'date_last_n_months'].includes(filter.operator)
                        ? 'number'
                        : 'text'
                    }
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="Valeur"
                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 w-32"
                  />
                )}

                {/* Second value input for BETWEEN */}
                {needsValue2 && (
                  <input
                    type={isDateType(filter.type) ? 'date' : isNumericType(filter.type) ? 'number' : 'text'}
                    value={filter.value2 ?? ''}
                    onChange={(e) => updateFilter(filter.id, { value2: e.target.value })}
                    placeholder="Valeur 2"
                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 w-32"
                  />
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFilter(filter.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Supprimer le filtre"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
