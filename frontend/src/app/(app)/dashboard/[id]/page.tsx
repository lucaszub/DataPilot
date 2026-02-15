"use client"

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Lock, Unlock, Maximize2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlobalFilters, type DashboardFilters } from '@/components/features/dashboard/GlobalFilters';
import { ThemeSelector } from '@/components/features/dashboard/ThemeSelector';
import { DashboardWidget } from '@/components/features/dashboard/DashboardWidget';
import { WidgetCreationPanel } from '@/components/features/dashboard/WidgetCreationPanel';
import { getDashboardById, type DashboardWidget as DashboardWidgetType } from '@/lib/mock-data/dashboards';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Dynamically import ReactGridLayout to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactGridLayout = dynamic(() => import('react-grid-layout'), { ssr: false }) as any;

export default function DashboardDetailPage() {
  const params = useParams();
  const dashboardId = params.id as string;

  const [dashboard, setDashboard] = useState(() => getDashboardById(dashboardId));
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [dashboardName, setDashboardName] = useState(dashboard?.name || '');
  const [theme, setTheme] = useState(dashboard?.theme || 'classic');
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: 'all',
    segment: 'all',
    category: 'all',
  });
  const [widgets, setWidgets] = useState<DashboardWidgetType[]>(dashboard?.widgets || []);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('grid-container');
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Tableau de bord introuvable</h2>
          <p className="text-muted-foreground">Le tableau de bord demandé n&apos;existe pas.</p>
        </div>
      </div>
    );
  }

  // Convert widgets to layout format
  const layout = widgets.map((widget) => ({
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
  }));

  const handleLayoutChange = (newLayout: any) => {
    if (!isEditing) return;

    const updatedWidgets = widgets.map((widget) => {
      const layoutItem = newLayout.find((item: any) => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          layout: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        };
      }
      return widget;
    });

    setWidgets(updatedWidgets);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter((w) => w.id !== widgetId));
  };

  const handleDuplicateWidget = (widgetId: string) => {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    const newWidget: DashboardWidgetType = {
      ...widget,
      id: `w-${Date.now()}`,
      title: `${widget.title} (copie)`,
      layout: {
        ...widget.layout,
        y: widget.layout.y + widget.layout.h, // Place below original
      },
    };

    setWidgets([...widgets, newWidget]);
  };

  const handleAddWidget = (newWidget: Partial<DashboardWidgetType>) => {
    // Find the first available position
    const maxY = widgets.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0);

    const widget: DashboardWidgetType = {
      id: newWidget.id!,
      type: newWidget.type!,
      title: newWidget.title!,
      chartType: newWidget.chartType,
      savedQueryId: newWidget.savedQueryId,
      kpiValue: newWidget.kpiValue,
      kpiLabel: newWidget.kpiLabel,
      kpiTrend: newWidget.kpiTrend,
      kpiTrendDirection: newWidget.kpiTrendDirection,
      data: newWidget.data,
      layout: {
        ...newWidget.layout!,
        y: maxY,
      },
    };

    setWidgets([...widgets, widget]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="border-b border-border bg-background sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Dashboard Title */}
          <div className="flex items-center gap-3 flex-1">
            {isEditingTitle ? (
              <Input
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                }}
                autoFocus
                className="max-w-md"
              />
            ) : (
              <h1
                className="text-2xl font-bold cursor-pointer hover:text-[#FF5789] transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                {dashboardName}
              </h1>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Mode édition
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Verrouillé
                </>
              )}
            </Button>

            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Global Filters */}
        <GlobalFilters onFilterChange={setFilters} />
      </div>

      {/* Grid Area */}
      <div id="grid-container" className="flex-1 overflow-auto p-6 bg-muted/30">
        <ReactGridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={120}
          width={containerWidth}
          isDraggable={isEditing}
          isResizable={isEditing}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".cursor-grab"
          containerPadding={[0, 0]}
          margin={[16, 16]}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <DashboardWidget
                widget={widget}
                isEditing={isEditing}
                onRemove={handleRemoveWidget}
                onDuplicate={handleDuplicateWidget}
              />
            </div>
          ))}
        </ReactGridLayout>

        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Aucun widget</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez votre premier widget pour commencer
              </p>
              <Button
                onClick={() => setIsPanelOpen(true)}
                className="bg-[#FF5789] hover:bg-[#FF5789]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un widget
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {isEditing && widgets.length > 0 && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#FF5789] hover:bg-[#FF5789]/90 text-white shadow-lg flex items-center justify-center z-30 transition-transform hover:scale-110"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Widget Creation Panel */}
      <WidgetCreationPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onAddWidget={handleAddWidget}
      />
    </div>
  );
}
