import React, { useRef } from "react";
import {
  X,
  MoreHorizontal,
  Check,
  Code2,
  CalendarDays,
  Hash,
  Type as TypeIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isNumericType, isDateType } from "./utils";
import type { SelectedField, AggregationType, DateGranularity } from "./types";
import { FilterPanel } from "./FilterPanel";
import { SortPanel } from "./SortPanel";
import type { QueryFilter, SortRule } from "./types";
import type { SemanticLayerDetail } from "@/lib/api";

interface SelectedFieldsBarProps {
  selectedFields: SelectedField[];
  removeField: (index: number) => void;
  updateAggregation: (index: number, aggregation: AggregationType) => void;
  updateDateGranularity: (index: number, granularity: DateGranularity) => void;
  filters: QueryFilter[];
  sorts: SortRule[];
  showFilters: boolean;
  showSorts: boolean;
  setShowFilters: (show: boolean) => void;
  setShowSorts: (show: boolean) => void;
  addFilter: () => void;
  updateFilter: (filterId: string, updates: Partial<QueryFilter>) => void;
  removeFilter: (filterId: string) => void;
  addSort: () => void;
  updateSort: (index: number, updates: Partial<SortRule>) => void;
  removeSort: (index: number) => void;
  showSql: boolean;
  setShowSql: (show: boolean) => void;
  sqlMode: 'visual' | 'sql';
  layerDetail: SemanticLayerDetail | undefined;
  openDropdownIndex: number | null;
  setOpenDropdownIndex: (index: number | null) => void;
  openDateDropdownIndex: number | null;
  setOpenDateDropdownIndex: (index: number | null) => void;
}

export function SelectedFieldsBar({
  selectedFields,
  removeField,
  updateAggregation,
  updateDateGranularity,
  filters,
  sorts,
  showFilters,
  showSorts,
  setShowFilters,
  setShowSorts,
  addFilter,
  updateFilter,
  removeFilter,
  addSort,
  updateSort,
  removeSort,
  showSql,
  setShowSql,
  sqlMode,
  layerDetail,
  openDropdownIndex,
  setOpenDropdownIndex,
  openDateDropdownIndex,
  setOpenDateDropdownIndex,
}: SelectedFieldsBarProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (index: number) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index);
  };

  const toggleDateDropdown = (index: number) => {
    setOpenDateDropdownIndex(openDateDropdownIndex === index ? null : index);
  };

  if (selectedFields.length === 0) {
    return (
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-center py-6 text-sm text-gray-400">
          Cliquez sur les colonnes pour explorer vos données
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {selectedFields.map((field, index) => {
            // Define all aggregation options
            const allAggregationOptions: Array<{
              value: AggregationType;
              label: string;
              sql: string;
            }> = [
              { value: 'none', label: 'Aucune', sql: 'RAW' },
              { value: 'SUM', label: 'Somme', sql: 'SUM' },
              { value: 'AVG', label: 'Moyenne', sql: 'AVG' },
              { value: 'MEDIAN', label: 'Médiane', sql: 'MEDIAN' },
              { value: 'MIN', label: 'Minimum', sql: 'MIN' },
              { value: 'MAX', label: 'Maximum', sql: 'MAX' },
              { value: 'COUNT', label: 'Comptage', sql: 'COUNT' },
              { value: 'COUNT_DISTINCT', label: 'Comptage distinct', sql: 'COUNT DISTINCT' },
            ];

            // Filter aggregation options based on type
            const aggregationOptions = (() => {
              if (isNumericType(field.type)) {
                // Numeric: all options
                return allAggregationOptions;
              } else if (isDateType(field.type) || !isNumericType(field.type)) {
                // Date/Text: only RAW, COUNT, COUNT_DISTINCT
                return allAggregationOptions.filter(opt =>
                  opt.value === 'none' || opt.value === 'COUNT' || opt.value === 'COUNT_DISTINCT'
                );
              }
              return allAggregationOptions;
            })();

            const dateGranularityOptions: Array<{
              value: DateGranularity;
              label: string;
            }> = [
              { value: 'raw', label: 'Brut' },
              { value: 'year', label: 'Année' },
              { value: 'quarter', label: 'Trimestre' },
              { value: 'month', label: 'Mois' },
              { value: 'week', label: 'Semaine' },
              { value: 'day', label: 'Jour' },
            ];

            const isDate = isDateType(field.type);
            const isNumeric = isNumericType(field.type);
            const isDimension = !isNumeric;

            return (
              <div
                key={`${field.tableName}-${field.name}-${index}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm relative",
                  isDimension
                    ? "bg-gray-50 border-gray-200"
                    : "bg-teal-50 border-teal-200"
                )}
                ref={openDropdownIndex === index ? dropdownRef : (openDateDropdownIndex === index ? dateDropdownRef : null)}
              >
                {/* Type icon */}
                {isDate && <CalendarDays className="h-3 w-3 shrink-0 text-gray-400" />}
                {!isDate && isNumeric && <Hash className="h-3 w-3 shrink-0 text-teal-500" />}
                {!isDate && !isNumeric && <TypeIcon className="h-3 w-3 shrink-0 text-gray-400" />}

                <span className="font-mono text-gray-700">
                  {field.name}
                  {isDate && field.dateGranularity !== 'raw' && (
                    <span className="ml-1.5 text-xs text-gray-500">
                      [{dateGranularityOptions.find(o => o.value === field.dateGranularity)?.label}]
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    field.aggregation === 'none'
                      ? "bg-gray-100 text-gray-600"
                      : "bg-teal-600 text-white"
                  )}
                >
                  {field.aggregation === 'none' ? 'RAW' :
                   field.aggregation === 'COUNT_DISTINCT' ? 'COUNT DISTINCT' :
                   field.aggregation}
                </span>

                {/* Date granularity button (only for date columns) */}
                {isDate && (
                  <button
                    type="button"
                    onClick={() => toggleDateDropdown(index)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Options de granularité"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleDropdown(index)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Options d'agrégation"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Retirer ${field.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Date granularity dropdown */}
                {isDate && openDateDropdownIndex === index && (
                  <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                    {dateGranularityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateDateGranularity(index, option.value)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-teal-50 transition-colors text-left"
                      >
                        <span className="text-gray-700">{option.label}</span>
                        {field.dateGranularity === option.value && (
                          <Check className="h-3.5 w-3.5 text-teal-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Aggregation dropdown menu */}
                {openDropdownIndex === index && (
                  <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                    {aggregationOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateAggregation(index, option.value)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-teal-50 transition-colors text-left"
                      >
                        <span className="text-gray-700">{option.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">{option.sql}</span>
                          {field.aggregation === option.value && (
                            <Check className="h-3.5 w-3.5 text-teal-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Filters Section */}
        <FilterPanel
          filters={filters}
          addFilter={addFilter}
          updateFilter={updateFilter}
          removeFilter={removeFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          layerDetail={layerDetail}
        />

        {/* Sorts Section */}
        <SortPanel
          sortRules={sorts}
          addSort={addSort}
          updateSort={updateSort}
          removeSort={removeSort}
          showSorts={showSorts}
          setShowSorts={setShowSorts}
          layerDetail={layerDetail}
        />

        {/* SQL toggle button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Code2 className="h-3.5 w-3.5" />
            {showSql ? 'Masquer SQL' : 'Afficher SQL'}
            {showSql ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {sqlMode === 'sql' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
              Mode SQL
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
