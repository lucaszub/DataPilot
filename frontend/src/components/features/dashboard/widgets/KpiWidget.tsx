"use client"

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiWidgetProps {
  value: number | string;
  label: string;
  trend?: number;
  trendDirection?: 'up' | 'down';
}

export function KpiWidget({ value, label, trend, trendDirection }: KpiWidgetProps) {
  // Format number if needed
  const formattedValue = typeof value === 'number'
    ? new Intl.NumberFormat('fr-FR').format(value)
    : value;

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-2">
      <div className="text-3xl font-bold text-foreground">
        {formattedValue}
      </div>
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
      {trend !== undefined && trendDirection && (
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            trendDirection === 'up' && trend > 0 && "bg-green-100 text-green-700",
            trendDirection === 'down' && trend < 0 && "bg-red-100 text-red-700",
            trendDirection === 'up' && trend < 0 && "bg-red-100 text-red-700",
            trendDirection === 'down' && trend > 0 && "bg-green-100 text-green-700"
          )}
        >
          {trendDirection === 'up' ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          <span>{Math.abs(trend).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
