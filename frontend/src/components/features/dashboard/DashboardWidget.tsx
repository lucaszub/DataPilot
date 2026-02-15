"use client"

import { MoreHorizontal, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiWidget } from './widgets/KpiWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { TableWidget } from './widgets/TableWidget';
import { TextWidget } from './widgets/TextWidget';
import type { DashboardWidget as DashboardWidgetType } from '@/lib/mock-data/dashboards';
import { getWidgetWithData, computeKpiFromQuery } from '@/lib/mock-data/dashboards';

interface DashboardWidgetProps {
  widget: DashboardWidgetType;
  isEditing: boolean;
  onRemove?: (widgetId: string) => void;
  onDuplicate?: (widgetId: string) => void;
  onEdit?: (widgetId: string) => void;
  isLoading?: boolean;
}

export function DashboardWidget({
  widget,
  isEditing,
  onRemove,
  onDuplicate,
  onEdit,
  isLoading = false,
}: DashboardWidgetProps) {
  const widgetWithData = getWidgetWithData(widget);

  const handleRemove = () => {
    onRemove?.(widget.id);
  };

  const handleDuplicate = () => {
    onDuplicate?.(widget.id);
  };

  const handleEdit = () => {
    onEdit?.(widget.id);
  };

  // Get data from saved query or inline data
  const data = widgetWithData.query?.results || widget.data || [];

  // Render widget content based on type
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3 p-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    switch (widget.type) {
      case 'kpi': {
        const kpiValue = widget.kpiValue || computeKpiFromQuery(widgetWithData.query);
        return (
          <KpiWidget
            value={kpiValue}
            label={widget.kpiLabel || widget.title}
            trend={widget.kpiTrend}
            trendDirection={widget.kpiTrendDirection}
          />
        );
      }

      case 'chart': {
        if (!widget.chartType) return <div>Type de graphique non défini</div>;
        return (
          <ChartWidget
            chartType={widget.chartType}
            data={data}
          />
        );
      }

      case 'table': {
        return <TableWidget data={data} />;
      }

      case 'text': {
        return (
          <TextWidget
            content={widget.kpiLabel || 'Texte à éditer...'}
            isEditing={isEditing}
          />
        );
      }

      default:
        return <div>Type de widget inconnu</div>;
    }
  };

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          {isEditing && (
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          )}
          <h3 className="text-sm font-semibold truncate">{widget.title}</h3>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRemove} className="text-destructive">
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 p-4">
        {renderContent()}
      </div>
    </Card>
  );
}
