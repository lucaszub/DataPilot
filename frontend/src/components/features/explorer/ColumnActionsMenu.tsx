"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  EyeOff,
  Calculator,
  Percent,
  TrendingUp,
  Hash,
  BarChart3,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer, QuickCalcType, quickCalcLabels } from './ExplorerContext';
import type { ExplorerColumnInfo } from '@/lib/explorer-adapter';

interface ColumnActionsMenuProps {
  column: ExplorerColumnInfo;
  position: { x: number; y: number };
  onClose: () => void;
  onAddCalculatedColumn?: (preselectedColumnA: string) => void;
}

const quickCalcOptions: { type: QuickCalcType; icon: React.ReactNode; description: string }[] = [
  { type: 'pct_of_total', icon: <Percent className="h-3.5 w-3.5" />, description: 'Pourcentage par rapport au total' },
  { type: 'running_total', icon: <TrendingUp className="h-3.5 w-3.5" />, description: 'Somme cumulée progressive' },
  { type: 'difference', icon: <Hash className="h-3.5 w-3.5" />, description: 'Écart avec la ligne précédente' },
  { type: 'pct_change', icon: <BarChart3 className="h-3.5 w-3.5" />, description: 'Variation en % vs précédent' },
  { type: 'rank', icon: <ArrowUpDown className="h-3.5 w-3.5" />, description: 'Classement par valeur décroissante' },
  { type: 'cumulative_avg', icon: <Calculator className="h-3.5 w-3.5" />, description: 'Moyenne glissante cumulée' },
];

export function ColumnActionsMenu({ column, position, onClose, onAddCalculatedColumn }: ColumnActionsMenuProps) {
  const { state, dispatch, executeQuery } = useExplorer();
  const [showCalcSubmenu, setShowCalcSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const field = state.selectedFields.find(
    f => f.name === column.name && f.tableName === column.tableName
  );
  const isMeasure = field?.role === 'measure';
  const isNumeric = column.type === 'DOUBLE' || column.type === 'INTEGER';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleSortAsc = () => {
    dispatch({
      type: 'ADD_SORT',
      sort: {
        id: `sort-${Date.now()}`,
        column: column.name,
        tableName: column.tableName,
        direction: 'ASC',
      },
    });
    executeQuery();
    onClose();
  };

  const handleSortDesc = () => {
    dispatch({
      type: 'ADD_SORT',
      sort: {
        id: `sort-${Date.now()}`,
        column: column.name,
        tableName: column.tableName,
        direction: 'DESC',
      },
    });
    executeQuery();
    onClose();
  };

  const handleAddFilter = () => {
    dispatch({
      type: 'ADD_FILTER',
      filter: {
        id: `filter-${Date.now()}`,
        column: column.name,
        tableName: column.tableName,
        type: column.type,
        operator: isNumeric ? 'gt' : 'equals',
        value: '',
      },
    });
    onClose();
  };

  const handleRemove = () => {
    if (field) {
      dispatch({ type: 'REMOVE_FIELD', fieldId: field.id });
    }
    onClose();
  };

  const handleQuickCalc = (calcType: QuickCalcType) => {
    if (field) {
      dispatch({ type: 'UPDATE_FIELD_QUICK_CALC', fieldId: field.id, quickCalc: calcType });
      executeQuery();
    }
    onClose();
  };

  // Adjust position to stay within viewport
  const adjustedStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 260),
    top: Math.min(position.y, window.innerHeight - 400),
    zIndex: 50,
  };

  return (
    <div ref={menuRef} style={adjustedStyle} className="w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
      {/* Column name header */}
      <div className="px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isMeasure ? "bg-primary" : "bg-blue-500"
          )} />
          <span className="text-xs font-medium text-foreground truncate">
            {column.tableName}.{column.name}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase">{column.type}</span>
      </div>

      {/* Actions */}
      <div className="py-1">
        {/* Sort actions */}
        <button
          onClick={handleSortAsc}
          className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
          Trier croissant
        </button>
        <button
          onClick={handleSortDesc}
          className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
          Trier décroissant
        </button>

        <div className="my-1 border-t border-border" />

        {/* Filter */}
        <button
          onClick={handleAddFilter}
          className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
        >
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          Filtrer cette colonne
        </button>

        {/* Quick Calculations (only for measures/numeric) */}
        {(isMeasure || isNumeric) && (
          <>
            <div className="my-1 border-t border-border" />
            <div className="relative">
              <button
                onMouseEnter={() => setShowCalcSubmenu(true)}
                onMouseLeave={() => setShowCalcSubmenu(false)}
                className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1 text-left">Calcul rapide</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {/* Submenu */}
              {showCalcSubmenu && (
                <div
                  onMouseEnter={() => setShowCalcSubmenu(true)}
                  onMouseLeave={() => setShowCalcSubmenu(false)}
                  className="absolute left-full top-0 ml-1 w-60 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <div className="py-1">
                    {quickCalcOptions.map(opt => (
                      <button
                        key={opt.type}
                        onClick={() => handleQuickCalc(opt.type)}
                        className={cn(
                          "w-full px-3 py-2 flex items-center gap-2.5 text-sm hover:bg-muted/50 transition-colors",
                          field?.quickCalc === opt.type ? "text-primary bg-primary/5" : "text-foreground"
                        )}
                      >
                        <span className="text-muted-foreground">{opt.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{quickCalcLabels[opt.type]}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </button>
                    ))}
                    {field?.quickCalc && field.quickCalc !== 'none' && (
                      <>
                        <div className="my-1 border-t border-border" />
                        <button
                          onClick={() => handleQuickCalc('none')}
                          className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-destructive hover:bg-muted/50 transition-colors"
                        >
                          Supprimer le calcul
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Add calculated column */}
        {(isMeasure || isNumeric) && onAddCalculatedColumn && (
          <>
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => {
                onAddCalculatedColumn(`${column.tableName}.${column.name}`);
              }}
              className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-purple-500" />
              <span>Colonne calculée à partir de...</span>
            </button>
          </>
        )}

        <div className="my-1 border-t border-border" />

        {/* Remove */}
        <button
          onClick={handleRemove}
          className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <EyeOff className="h-3.5 w-3.5" />
          Retirer de la requête
        </button>
      </div>
    </div>
  );
}
