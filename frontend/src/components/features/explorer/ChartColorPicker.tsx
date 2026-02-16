"use client";

import React from 'react';
import { Palette } from 'lucide-react';
import { useExplorer } from './ExplorerContext';
import { COLOR_PALETTES } from '@/components/features/dashboard/ThemeSelector';
import { cn } from '@/lib/utils';

export function ChartColorPicker() {
  const { state, dispatch } = useExplorer();

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Palette className="h-4 w-4" />
        <span className="text-xs font-medium">Theme :</span>
      </div>
      <div className="flex items-center gap-2">
        {COLOR_PALETTES.map((palette) => (
          <button
            key={palette.id}
            onClick={() => dispatch({ type: 'SET_COLOR_THEME', theme: palette.id })}
            className={cn(
              "flex items-center gap-0.5 px-2 py-1.5 rounded-md border-2 transition-all hover:border-[#FF5789]/50",
              state.colorTheme === palette.id
                ? "border-[#FF5789] bg-[#FF5789]/5"
                : "border-transparent"
            )}
            title={palette.name}
          >
            {palette.colors.slice(0, 4).map((color, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}
