"use client";

import { useState, useEffect } from 'react';
import { X, Link2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface JoinConfig {
  sourceNode: string;
  sourceColumn: string;
  targetNode: string;
  targetColumn: string;
  joinType: 'LEFT' | 'INNER' | 'RIGHT' | 'FULL';
}

interface JoinConfigPanelProps {
  sourceNodeLabel: string;
  targetNodeLabel: string;
  sourceColumns: string[];
  targetColumns: string[];
  suggestedSourceColumn?: string;
  suggestedTargetColumn?: string;
  initialJoinType?: 'LEFT' | 'INNER' | 'RIGHT' | 'FULL';
  onConfirm: (config: Omit<JoinConfig, 'sourceNode' | 'targetNode'>) => void;
  onCancel: () => void;
}

const JOIN_TYPES: Array<{ value: 'LEFT' | 'INNER' | 'RIGHT' | 'FULL'; label: string; description: string; color: string }> = [
  { value: 'LEFT', label: 'LEFT JOIN', description: 'Toutes les lignes de gauche + correspondances droite', color: 'border-blue-500 bg-blue-50 text-blue-900' },
  { value: 'INNER', label: 'INNER JOIN', description: 'Seulement les correspondances des deux cotes', color: 'border-green-500 bg-green-50 text-green-900' },
  { value: 'RIGHT', label: 'RIGHT JOIN', description: 'Toutes les lignes de droite + correspondances gauche', color: 'border-orange-500 bg-orange-50 text-orange-900' },
  { value: 'FULL', label: 'FULL JOIN', description: 'Toutes les lignes des deux cotes', color: 'border-purple-500 bg-purple-50 text-purple-900' },
];

export function JoinConfigPanel({
  sourceNodeLabel,
  targetNodeLabel,
  sourceColumns,
  targetColumns,
  suggestedSourceColumn,
  suggestedTargetColumn,
  initialJoinType = 'LEFT',
  onConfirm,
  onCancel,
}: JoinConfigPanelProps) {
  const [sourceColumn, setSourceColumn] = useState(suggestedSourceColumn || sourceColumns[0] || '');
  const [targetColumn, setTargetColumn] = useState(suggestedTargetColumn || targetColumns[0] || '');
  const [joinType, setJoinType] = useState<'LEFT' | 'INNER' | 'RIGHT' | 'FULL'>(initialJoinType);

  useEffect(() => {
    if (suggestedSourceColumn) setSourceColumn(suggestedSourceColumn);
  }, [suggestedSourceColumn]);

  useEffect(() => {
    if (suggestedTargetColumn) setTargetColumn(suggestedTargetColumn);
  }, [suggestedTargetColumn]);

  const handleConfirm = () => {
    if (!sourceColumn || !targetColumn) return;
    onConfirm({ sourceColumn, targetColumn, joinType });
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] rounded-lg border-2 border-teal-500 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-teal-50 to-teal-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900">Configuration de la jointure</h3>
        </div>
        <button
          onClick={onCancel}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          aria-label="Annuler"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Column selectors */}
        <div className="space-y-3">
          {/* Source column */}
          <div>
            <Label htmlFor="source-column" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Colonne source ({sourceNodeLabel})
            </Label>
            <div className="relative">
              <select
                id="source-column"
                value={sourceColumn}
                onChange={(e) => setSourceColumn(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {sourceColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Target column */}
          <div>
            <Label htmlFor="target-column" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Colonne cible ({targetNodeLabel})
            </Label>
            <div className="relative">
              <select
                id="target-column"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {targetColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Join type selector */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Type de jointure
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {JOIN_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setJoinType(type.value)}
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all ${
                  joinType === type.value
                    ? type.color + ' shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-semibold">{type.label}</span>
                <span className="text-xs text-gray-600">{type.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleConfirm} disabled={!sourceColumn || !targetColumn}>
          Confirmer
        </Button>
      </div>
    </div>
  );
}
