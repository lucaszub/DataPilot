"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Lock, Unlock, Maximize2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlobalFilters, type DashboardFilters } from '@/components/features/dashboard/GlobalFilters';
import { ThemeSelector } from '@/components/features/dashboard/ThemeSelector';
import { DashboardWidget } from '@/components/features/dashboard/DashboardWidget';
import { WidgetCreationPanel } from '@/components/features/dashboard/WidgetCreationPanel';
import { api, type DashboardWithWidgets, type DashboardWidget as ApiWidget } from '@/lib/api';
import type { DashboardWidget as MockWidgetType } from '@/lib/mock-data/dashboards';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Dynamically import ReactGridLayout to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactGridLayout = dynamic(() => import('react-grid-layout'), { ssr: false }) as any;

/**
 * Convert an API widget to the mock widget shape expected by existing components.
 */
function apiWidgetToMock(w: ApiWidget): MockWidgetType {
  const configJson = (w.config_json || {}) as Record<string, unknown>;
  return {
    id: w.id,
    type: w.type,
    title: w.title,
    chartType: (w.chart_type as MockWidgetType['chartType']) || undefined,
    savedQueryId: w.saved_query_id || undefined,
    kpiValue: configJson.kpiValue as string | number | undefined,
    kpiLabel: configJson.kpiLabel as string | undefined,
    kpiTrend: configJson.kpiTrend as number | undefined,
    kpiTrendDirection: configJson.kpiTrendDirection as 'up' | 'down' | undefined,
    data: configJson.data as Record<string, unknown>[] | undefined,
    layout: w.position || { x: 0, y: 0, w: 6, h: 4 },
  };
}

/**
 * Convert a mock widget (from the creation panel) to the API WidgetCreate shape.
 */
function mockWidgetToApiCreate(w: Partial<MockWidgetType>) {
  const config: Record<string, unknown> = {};
  if (w.kpiValue !== undefined) config.kpiValue = w.kpiValue;
  if (w.kpiLabel !== undefined) config.kpiLabel = w.kpiLabel;
  if (w.kpiTrend !== undefined) config.kpiTrend = w.kpiTrend;
  if (w.kpiTrendDirection !== undefined) config.kpiTrendDirection = w.kpiTrendDirection;
  if (w.data !== undefined) config.data = w.data;

  return {
    type: w.type!,
    title: w.title!,
    chart_type: w.chartType || undefined,
    saved_query_id: w.savedQueryId || undefined,
    config_json: Object.keys(config).length > 0 ? config : undefined,
    position: w.layout ? { x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h } : undefined,
  };
}

export default function DashboardDetailPage() {
  const params = useParams();
  const dashboardId = params.id as string;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardWithWidgets | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [dashboardName, setDashboardName] = useState('');
  const [theme, setTheme] = useState('classic');
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: 'all',
    segment: 'all',
    category: 'all',
  });
  const [widgets, setWidgets] = useState<MockWidgetType[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Debounce timer for layout updates
  const layoutUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load dashboard
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.dashboards.getById(dashboardId);
        if (cancelled) return;
        setDashboardData(data);
        setDashboardName(data.name);
        setTheme(data.theme || 'classic');
        setWidgets(data.widgets.map(apiWidgetToMock));
      } catch {
        if (cancelled) return;
        setError('Impossible de charger le tableau de bord.');
        setDashboardData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [dashboardId]);

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

  // --- API persistence helpers ---

  const persistWidgetPosition = useCallback(
    (widgetId: string, position: { x: number; y: number; w: number; h: number }) => {
      if (!dashboardData) return;
      // Fire and forget -- debounced in handleLayoutChange
      api.dashboards.updateWidget(dashboardId, widgetId, { position }).catch(() => {
        // Silent fail -- user can retry
      });
    },
    [dashboardData, dashboardId]
  );

  const persistDashboardUpdate = useCallback(
    (data: { name?: string; theme?: string }) => {
      if (!dashboardData) return;
      api.dashboards.update(dashboardId, data).catch(() => {
        // Silent fail
      });
    },
    [dashboardData, dashboardId]
  );

  // --- Event handlers ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = (newLayout: any) => {
    if (!isEditing) return;

    const updatedWidgets = widgets.map((widget) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Debounced persist to API
    if (layoutUpdateTimer.current) {
      clearTimeout(layoutUpdateTimer.current);
    }
    layoutUpdateTimer.current = setTimeout(() => {
      updatedWidgets.forEach((w) => {
        persistWidgetPosition(w.id, w.layout);
      });
    }, 500);
  };

  const handleRemoveWidget = async (widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));

    if (dashboardData) {
      try {
        await api.dashboards.deleteWidget(dashboardId, widgetId);
      } catch {
        // Silent fail
      }
    }
  };

  const handleDuplicateWidget = async (widgetId: string) => {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    if (dashboardData) {
      try {
        const created = await api.dashboards.addWidget(
          dashboardId,
          mockWidgetToApiCreate({
            ...widget,
            title: `${widget.title} (copie)`,
            layout: {
              ...widget.layout,
              y: widget.layout.y + widget.layout.h,
            },
          })
        );
        setWidgets((prev) => [...prev, apiWidgetToMock(created)]);
        return;
      } catch {
        // Fallback to local-only
      }
    }

    const newWidget: MockWidgetType = {
      ...widget,
      id: `w-${Date.now()}`,
      title: `${widget.title} (copie)`,
      layout: {
        ...widget.layout,
        y: widget.layout.y + widget.layout.h,
      },
    };
    setWidgets((prev) => [...prev, newWidget]);
  };

  const handleAddWidget = async (newWidgetPartial: Partial<MockWidgetType>) => {
    const maxY = widgets.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0);

    const localWidget: MockWidgetType = {
      id: newWidgetPartial.id || `w-${Date.now()}`,
      type: newWidgetPartial.type!,
      title: newWidgetPartial.title!,
      chartType: newWidgetPartial.chartType,
      savedQueryId: newWidgetPartial.savedQueryId,
      kpiValue: newWidgetPartial.kpiValue,
      kpiLabel: newWidgetPartial.kpiLabel,
      kpiTrend: newWidgetPartial.kpiTrend,
      kpiTrendDirection: newWidgetPartial.kpiTrendDirection,
      data: newWidgetPartial.data,
      layout: {
        ...(newWidgetPartial.layout || { x: 0, y: 0, w: 6, h: 4 }),
        y: maxY,
      },
    };

    if (dashboardData) {
      try {
        const created = await api.dashboards.addWidget(
          dashboardId,
          mockWidgetToApiCreate(localWidget)
        );
        setWidgets((prev) => [...prev, apiWidgetToMock(created)]);
        return;
      } catch {
        // Fallback to local-only widget
      }
    }

    setWidgets((prev) => [...prev, localWidget]);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    persistDashboardUpdate({ name: dashboardName });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    persistDashboardUpdate({ theme: newTheme });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Convert widgets to layout format
  const layout = widgets.map((widget) => ({
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
  }));

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Tableau de bord introuvable</h2>
          <p className="text-muted-foreground">Le tableau de bord demande n&apos;existe pas.</p>
        </div>
      </div>
    );
  }

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
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleBlur();
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
            <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Mode edition
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Verrouille
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

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

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
        workspaceId={dashboardData?.workspace_id}
      />
    </div>
  );
}
