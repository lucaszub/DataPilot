"use client";

import React, { useState } from 'react';
import { X, Calculator, Plus, Minus, Divide, Percent, TrendingUp, Code, Sigma } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer, CalcFormulaType, calcFormulaLabels, CalculatedColumn } from './ExplorerContext';

interface AddCalculatedColumnModalProps {
  onClose: () => void;
  preselectedColumnA?: string; // "tableName.columnName"
}

const formulaOptions: { type: CalcFormulaType; icon: React.ReactNode; needsB: boolean }[] = [
  { type: 'add', icon: <Plus className="h-4 w-4" />, needsB: true },
  { type: 'subtract', icon: <Minus className="h-4 w-4" />, needsB: true },
  { type: 'multiply', icon: <span className="text-sm font-bold">×</span>, needsB: true },
  { type: 'divide', icon: <Divide className="h-4 w-4" />, needsB: true },
  { type: 'margin', icon: <Percent className="h-4 w-4" />, needsB: true },
  { type: 'pct_of_total', icon: <Sigma className="h-4 w-4" />, needsB: false },
  { type: 'running_total', icon: <TrendingUp className="h-4 w-4" />, needsB: false },
  { type: 'custom', icon: <Code className="h-4 w-4" />, needsB: false },
];

export function AddCalculatedColumnModal({ onClose, preselectedColumnA }: AddCalculatedColumnModalProps) {
  const { state, dispatch } = useExplorer();
  const [label, setLabel] = useState('');
  const [formula, setFormula] = useState<CalcFormulaType>('subtract');
  const [columnA, setColumnA] = useState(preselectedColumnA || '');
  const [columnB, setColumnB] = useState('');
  const [customExpr, setCustomExpr] = useState('');

  // Get all numeric columns from result + selected fields
  const numericColumns: { key: string; label: string }[] = [];

  if (state.result) {
    for (const col of state.result.columns) {
      if (col.type === 'DOUBLE' || col.type === 'INTEGER') {
        numericColumns.push({ key: col.key, label: `${col.tableName}.${col.name}` });
      }
    }
  }

  // Also add from selected fields that aren't in result yet
  for (const field of state.selectedFields) {
    const key = `${field.tableName}.${field.name}`;
    if (field.role === 'measure' && !numericColumns.some(c => c.key === key)) {
      numericColumns.push({ key, label: key });
    }
  }

  const selectedFormula = formulaOptions.find(f => f.type === formula);
  const needsB = selectedFormula?.needsB ?? false;

  const handleCreate = () => {
    if (!label.trim()) return;
    if (!columnA && formula !== 'custom') return;
    if (needsB && !columnB) return;

    const calcColumn: CalculatedColumn = {
      id: `calc-${Date.now()}`,
      label: label.trim(),
      formula,
      columnA: columnA || undefined,
      columnB: columnB || undefined,
      customExpression: formula === 'custom' ? customExpr : undefined,
    };

    dispatch({ type: 'ADD_CALCULATED_COLUMN', column: calcColumn });
    onClose();
  };

  // Auto-generate label based on formula
  const generateLabel = () => {
    const colAName = columnA.split('.').pop() || 'A';
    const colBName = columnB.split('.').pop() || 'B';
    switch (formula) {
      case 'add': return `${colAName} + ${colBName}`;
      case 'subtract': return `${colAName} - ${colBName}`;
      case 'multiply': return `${colAName} × ${colBName}`;
      case 'divide': return `${colAName} / ${colBName}`;
      case 'margin': return `Marge % (${colAName})`;
      case 'pct_of_total': return `% du total (${colAName})`;
      case 'running_total': return `Cumul (${colAName})`;
      case 'custom': return 'Formule';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[520px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Nouvelle colonne calculée</h2>
              <p className="text-xs text-muted-foreground">Créez une colonne à partir d'une formule</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Formula type selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Type de calcul</label>
            <div className="grid grid-cols-4 gap-2">
              {formulaOptions.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setFormula(opt.type);
                    if (!label || label === generateLabel()) {
                      // Auto-update label if it was auto-generated
                      setTimeout(() => {
                        const newLabel = generateLabel();
                        if (newLabel) setLabel(newLabel);
                      }, 0);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-all",
                    formula === opt.type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.icon}
                  <span className="text-[10px] font-medium leading-tight text-center">
                    {calcFormulaLabels[opt.type].split('(')[0].trim()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Column A */}
          {formula !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {needsB ? 'Colonne A' : 'Colonne source'}
              </label>
              <select
                value={columnA}
                onChange={(e) => {
                  setColumnA(e.target.value);
                  if (!label) setLabel(generateLabel());
                }}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Sélectionner une colonne...</option>
                {numericColumns.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Column B */}
          {needsB && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Colonne B</label>
              <select
                value={columnB}
                onChange={(e) => {
                  setColumnB(e.target.value);
                  if (!label) setLabel(generateLabel());
                }}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Sélectionner une colonne...</option>
                {numericColumns.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom expression */}
          {formula === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Expression SQL</label>
              <textarea
                value={customExpr}
                onChange={(e) => setCustomExpr(e.target.value)}
                placeholder="ex: (unit_price - cost_price) / unit_price * 100"
                className="w-full px-3 py-2 text-sm font-mono bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Preview formula */}
          {columnA && (
            <div className="p-3 bg-muted/30 border border-border rounded-lg">
              <div className="text-[10px] uppercase font-medium text-muted-foreground mb-1">Aperçu</div>
              <div className="text-sm font-mono text-foreground">
                {formula === 'add' && `${columnA.split('.').pop()} + ${columnB.split('.').pop() || '?'}`}
                {formula === 'subtract' && `${columnA.split('.').pop()} - ${columnB.split('.').pop() || '?'}`}
                {formula === 'multiply' && `${columnA.split('.').pop()} × ${columnB.split('.').pop() || '?'}`}
                {formula === 'divide' && `${columnA.split('.').pop()} / ${columnB.split('.').pop() || '?'}`}
                {formula === 'margin' && `(${columnA.split('.').pop()} - ${columnB.split('.').pop() || '?'}) / ${columnA.split('.').pop()} × 100`}
                {formula === 'pct_of_total' && `${columnA.split('.').pop()} / SUM(${columnA.split('.').pop()}) × 100`}
                {formula === 'running_total' && `SUM(${columnA.split('.').pop()}) OVER (ORDER BY ...)`}
                {formula === 'custom' && (customExpr || 'Expression personnalisée...')}
              </div>
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nom de la colonne</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Marge brute, CA cumulé..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={!label.trim() || (!columnA && formula !== 'custom')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              label.trim() && (columnA || formula === 'custom')
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Ajouter la colonne
          </button>
        </div>
      </div>
    </div>
  );
}
