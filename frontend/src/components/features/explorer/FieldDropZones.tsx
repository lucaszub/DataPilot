"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Type, Hash, Calendar, TrendingUp, ChevronDown, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer, AggregationType, DateGranularity, QuickCalcType, quickCalcLabels } from './ExplorerContext';

const typeIcons: Record<string, React.ReactNode> = {
  string: <Type className="h-3 w-3" />,
  number: <Hash className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
};

const aggregationLabels: Record<AggregationType, string> = {
  none: 'Brut',
  SUM: 'Somme',
  COUNT: 'Compte',
  AVG: 'Moyenne',
  MIN: 'Min',
  MAX: 'Max',
  MEDIAN: 'Médiane',
  COUNT_DISTINCT: 'Distinct',
};

const granularityLabels: Record<DateGranularity, string> = {
  raw: 'Brut',
  year: 'Année',
  quarter: 'Trimestre',
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
};

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function MiniDropdown({ trigger, children, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}>
        {trigger}
      </button>
      {open && (
        <div className={cn(
          "absolute z-50 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[180px]",
          className
        )}>
          <div onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function FieldDropZones() {
  const { state, dispatch } = useExplorer();

  const dimensions = state.selectedFields.filter(f => f.role === 'dimension');
  const measures = state.selectedFields.filter(f => f.role === 'measure');

  const removeField = (fieldId: string) => {
    dispatch({ type: 'REMOVE_FIELD', fieldId });
  };

  const setAggregation = (fieldId: string, aggregation: AggregationType) => {
    dispatch({ type: 'UPDATE_FIELD_AGGREGATION', fieldId, aggregation });
  };

  const setGranularity = (fieldId: string, granularity: DateGranularity) => {
    dispatch({ type: 'UPDATE_FIELD_GRANULARITY', fieldId, granularity });
  };

  const setQuickCalc = (fieldId: string, quickCalc: QuickCalcType) => {
    dispatch({ type: 'UPDATE_FIELD_QUICK_CALC', fieldId, quickCalc });
  };

  const allAggregations: AggregationType[] = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'COUNT_DISTINCT'];
  const allGranularities: DateGranularity[] = ['year', 'quarter', 'month', 'week', 'day', 'raw'];
  const allQuickCalcs: QuickCalcType[] = ['pct_of_total', 'running_total', 'difference', 'pct_change', 'rank', 'cumulative_avg'];

  return (
    <div className="space-y-2">
      {/* Dimensions zone */}
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Type className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Dimensions
          </span>
          {dimensions.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {dimensions.length}
            </span>
          )}
        </div>

        {dimensions.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Cliquez sur des champs dans le panneau de gauche
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dimensions.map(field => (
              <div
                key={field.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full group"
              >
                <div className="text-blue-500">
                  {typeIcons[field.type] || typeIcons.string}
                </div>
                <span className="text-sm text-foreground">
                  {field.name}
                </span>

                {/* Date granularity dropdown */}
                {(field.type === 'DATE' || field.type === 'TIMESTAMP' || field.type === 'date') && (
                  <MiniDropdown
                    trigger={
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-700 rounded hover:bg-blue-500/30 transition-colors cursor-pointer">
                        {granularityLabels[field.dateGranularity]}
                        <ChevronDown className="h-2.5 w-2.5" />
                      </span>
                    }
                  >
                    <div className="py-1">
                      {allGranularities.map(g => (
                        <button
                          key={g}
                          onClick={() => setGranularity(field.id, g)}
                          className={cn(
                            "w-full px-3 py-1.5 text-sm text-left hover:bg-muted/50 transition-colors",
                            field.dateGranularity === g && "text-primary font-medium bg-primary/5"
                          )}
                        >
                          {granularityLabels[g]}
                        </button>
                      ))}
                    </div>
                  </MiniDropdown>
                )}

                <button
                  onClick={() => removeField(field.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Measures zone */}
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Mesures
          </span>
          {measures.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {measures.length}
            </span>
          )}
        </div>

        {measures.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Cliquez sur des mesures dans le panneau de gauche
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {measures.map(field => (
              <div
                key={field.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full group"
              >
                <div className="text-primary">
                  {typeIcons[field.type] || typeIcons.number}
                </div>
                <span className="text-sm text-foreground">
                  {field.name}
                </span>

                {/* Aggregation dropdown */}
                {field.aggregation !== 'none' && (
                  <MiniDropdown
                    trigger={
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors cursor-pointer">
                        {aggregationLabels[field.aggregation]}
                        <ChevronDown className="h-2.5 w-2.5" />
                      </span>
                    }
                  >
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Agrégation
                      </div>
                      {allAggregations.map(agg => (
                        <button
                          key={agg}
                          onClick={() => setAggregation(field.id, agg)}
                          className={cn(
                            "w-full px-3 py-1.5 text-sm text-left hover:bg-muted/50 transition-colors",
                            field.aggregation === agg && "text-primary font-medium bg-primary/5"
                          )}
                        >
                          {aggregationLabels[agg]}
                        </button>
                      ))}
                    </div>
                  </MiniDropdown>
                )}

                {/* Quick calc badge */}
                {field.quickCalc && field.quickCalc !== 'none' && (
                  <MiniDropdown
                    trigger={
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-700 rounded hover:bg-amber-500/30 transition-colors cursor-pointer">
                        <Calculator className="h-2.5 w-2.5" />
                        {quickCalcLabels[field.quickCalc]}
                        <ChevronDown className="h-2.5 w-2.5" />
                      </span>
                    }
                  >
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Calcul rapide
                      </div>
                      {allQuickCalcs.map(calc => (
                        <button
                          key={calc}
                          onClick={() => setQuickCalc(field.id, calc)}
                          className={cn(
                            "w-full px-3 py-1.5 text-sm text-left hover:bg-muted/50 transition-colors",
                            field.quickCalc === calc && "text-amber-700 font-medium bg-amber-500/5"
                          )}
                        >
                          {quickCalcLabels[calc]}
                        </button>
                      ))}
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={() => setQuickCalc(field.id, 'none')}
                        className="w-full px-3 py-1.5 text-sm text-left text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Supprimer le calcul
                      </button>
                    </div>
                  </MiniDropdown>
                )}

                {/* Add quick calc button (if none set) */}
                {(!field.quickCalc || field.quickCalc === 'none') && (
                  <MiniDropdown
                    trigger={
                      <span className="p-0.5 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer" title="Calcul rapide">
                        <Calculator className="h-3 w-3" />
                      </span>
                    }
                  >
                    <div className="py-1">
                      <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Calcul rapide
                      </div>
                      {allQuickCalcs.map(calc => (
                        <button
                          key={calc}
                          onClick={() => setQuickCalc(field.id, calc)}
                          className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted/50 transition-colors"
                        >
                          {quickCalcLabels[calc]}
                        </button>
                      ))}
                    </div>
                  </MiniDropdown>
                )}

                <button
                  onClick={() => removeField(field.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
