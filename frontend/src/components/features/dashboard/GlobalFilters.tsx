"use client"

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface GlobalFiltersProps {
  onFilterChange?: (filters: DashboardFilters) => void;
}

export interface DashboardFilters {
  dateRange: string;
  segment: string;
  category: string;
}

const DEFAULT_FILTERS: DashboardFilters = {
  dateRange: 'all',
  segment: 'all',
  category: 'all',
};

export function GlobalFilters({ onFilterChange }: GlobalFiltersProps) {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    onFilterChange?.(DEFAULT_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== 'all');

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Période:
          </span>
          <Select
            value={filters.dateRange}
            onValueChange={(value) => handleFilterChange('dateRange', value)}
          >
            <SelectTrigger className="h-8 rounded-full text-xs min-w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="this_month">Ce mois</SelectItem>
              <SelectItem value="this_quarter">Ce trimestre</SelectItem>
              <SelectItem value="this_year">Cette année</SelectItem>
              <SelectItem value="last_12_months">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Segment */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Segment:
          </span>
          <Select
            value={filters.segment}
            onValueChange={(value) => handleFilterChange('segment', value)}
          >
            <SelectTrigger className="h-8 rounded-full text-xs min-w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="pme">PME</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Catégorie:
          </span>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="h-8 rounded-full text-xs min-w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="software">Logiciel</SelectItem>
              <SelectItem value="hardware">Matériel</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="training">Formation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Button */}
      {hasActiveFilters && (
        <Button
          variant="link"
          size="sm"
          onClick={handleClear}
          className="text-xs text-[#FF5789] hover:text-[#FF5789]/80 h-8"
        >
          Effacer
        </Button>
      )}
    </div>
  );
}
