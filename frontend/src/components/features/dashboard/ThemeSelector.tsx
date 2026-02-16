"use client"

import { Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export interface ColorPalette {
  name: string;
  id: string;
  colors: string[];
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: 'Classique',
    id: 'classic',
    colors: ['#FF5789', '#8B5CF6', '#3B82F6', '#F59E0B', '#10B981', '#EC4899'],
  },
  {
    name: 'Moderne',
    id: 'modern',
    colors: ['#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'],
  },
  {
    name: 'Coloré',
    id: 'colorful',
    colors: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#8B5CF6'],
  },
  {
    name: 'Corporate',
    id: 'corporate',
    colors: ['#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
  },
];

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <Select value={currentTheme} onValueChange={onThemeChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sélectionner un thème" />
      </SelectTrigger>
      <SelectContent>
        {COLOR_PALETTES.map((palette) => (
          <SelectItem key={palette.id} value={palette.id}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span>{palette.name}</span>
              {currentTheme === palette.id && (
                <Check className="h-4 w-4 ml-auto" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
