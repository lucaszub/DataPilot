"use client"

import { useState, useEffect } from 'react';
import { BarChart3, LineChart, PieChart, Table, FileText, Activity, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { api, type SavedQueryResponse } from '@/lib/api';
import type { DashboardWidget } from '@/lib/mock-data/dashboards';

interface WidgetCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widget: Partial<DashboardWidget>) => void;
  workspaceId?: string;
}

type WidgetType = 'kpi' | 'chart' | 'table' | 'text';
type ChartType = 'bar' | 'line' | 'pie' | 'area';

export function WidgetCreationPanel({
  isOpen,
  onClose,
  onAddWidget,
  workspaceId,
}: WidgetCreationPanelProps) {
  const [step, setStep] = useState(1);
  const [widgetType, setWidgetType] = useState<WidgetType | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<SavedQueryResponse | null>(null);
  const [chartType, setChartType] = useState<ChartType | null>(null);
  const [title, setTitle] = useState('');
  const [queries, setQueries] = useState<SavedQueryResponse[]>([]);
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);

  // Load saved queries from API when the panel opens
  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    setIsLoadingQueries(true);
    api.queries.listSaved(workspaceId)
      .then(setQueries)
      .catch(() => setQueries([]))
      .finally(() => setIsLoadingQueries(false));
  }, [isOpen, workspaceId]);

  const handleReset = () => {
    setStep(1);
    setWidgetType(null);
    setSelectedQuery(null);
    setChartType(null);
    setTitle('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleWidgetTypeSelect = (type: WidgetType) => {
    setWidgetType(type);

    // Auto-advance based on type
    if (type === 'kpi' || type === 'text') {
      setStep(4); // Skip to title
      setTitle(type === 'kpi' ? 'Nouveau KPI' : 'Nouveau texte');
    } else {
      setStep(2); // Go to query selection
    }
  };

  const handleQuerySelect = (query: SavedQueryResponse) => {
    setSelectedQuery(query);
    setTitle(query.name);

    if (widgetType === 'table') {
      setStep(4); // Skip chart type selection for tables
    } else {
      setStep(3); // Go to chart type selection
    }
  };

  const handleChartTypeSelect = (type: ChartType) => {
    setChartType(type);
    setStep(4); // Go to title input
  };

  const handleAddWidget = () => {
    const newWidget: Partial<DashboardWidget> = {
      id: `w-${Date.now()}`,
      type: widgetType!,
      title,
      layout: { x: 0, y: 0, w: 6, h: 4 }, // Default size
    };

    if (widgetType === 'chart') {
      newWidget.chartType = chartType!;
      newWidget.savedQueryId = selectedQuery?.id;
    }

    if (widgetType === 'table') {
      newWidget.savedQueryId = selectedQuery?.id;
    }

    if (widgetType === 'kpi') {
      newWidget.kpiValue = '0';
      newWidget.kpiLabel = 'À configurer';
      newWidget.layout = { x: 0, y: 0, w: 3, h: 2 };
    }

    if (widgetType === 'text') {
      newWidget.kpiLabel = '# Nouveau texte\n\nÉditez ce contenu...';
      newWidget.layout = { x: 0, y: 0, w: 6, h: 3 };
    }

    onAddWidget(newWidget);
    handleClose();
  };

  const widgetTypes = [
    { type: 'kpi' as WidgetType, label: 'KPI', icon: Activity, description: 'Indicateur chiffré' },
    { type: 'chart' as WidgetType, label: 'Graphique', icon: BarChart3, description: 'Visualisation de données' },
    { type: 'table' as WidgetType, label: 'Tableau', icon: Table, description: 'Données tabulaires' },
    { type: 'text' as WidgetType, label: 'Texte', icon: FileText, description: 'Bloc de texte libre' },
  ];

  const chartTypes = [
    { type: 'bar' as ChartType, label: 'Barres', icon: BarChart3 },
    { type: 'line' as ChartType, label: 'Ligne', icon: LineChart },
    { type: 'pie' as ChartType, label: 'Camembert', icon: PieChart },
    { type: 'area' as ChartType, label: 'Aires', icon: Activity },
  ];

  // Filter queries based on widget type
  const availableQueries = widgetType === 'table'
    ? queries.filter(q => q.chart_type === 'table' || !q.chart_type)
    : queries.filter(q => q.chart_type !== 'kpi');

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Ajouter un widget</SheetTitle>
          <SheetDescription>
            {step === 1 && "Choisissez le type de widget à ajouter"}
            {step === 2 && "Sélectionnez une requête enregistrée"}
            {step === 3 && "Choisissez le type de graphique"}
            {step === 4 && "Personnalisez le widget"}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          {/* Step 1: Widget Type Selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {widgetTypes.map((wt) => (
                <button
                  key={wt.type}
                  onClick={() => handleWidgetTypeSelect(wt.type)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-[#FF5789] hover:bg-[#FF5789]/5",
                    widgetType === wt.type ? "border-[#FF5789] bg-[#FF5789]/5" : "border-border"
                  )}
                >
                  <wt.icon className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">{wt.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{wt.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Query Selection */}
          {step === 2 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {isLoadingQueries ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableQueries.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Aucune requete enregistree disponible.
                </div>
              ) : (
                availableQueries.map((query) => (
                  <button
                    key={query.id}
                    onClick={() => handleQuerySelect(query)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border-2 transition-all hover:border-[#FF5789] hover:bg-[#FF5789]/5",
                      selectedQuery?.id === query.id ? "border-[#FF5789] bg-[#FF5789]/5" : "border-border"
                    )}
                  >
                    <div className="font-medium text-sm">{query.name}</div>
                    {query.chart_type && (
                      <div className="text-xs text-muted-foreground mt-1">Type : {query.chart_type}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 font-mono truncate">
                      {query.sql_text}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 3: Chart Type Selection */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              {chartTypes.map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => handleChartTypeSelect(ct.type)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-[#FF5789] hover:bg-[#FF5789]/5",
                    chartType === ct.type ? "border-[#FF5789] bg-[#FF5789]/5" : "border-border"
                  )}
                >
                  <ct.icon className="h-8 w-8 text-muted-foreground" />
                  <div className="font-semibold text-sm">{ct.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Title Input */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="widget-title">Titre du widget</Label>
                <Input
                  id="widget-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entrez un titre..."
                  className="mt-2"
                />
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold mb-2">Aperçu</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><strong>Type:</strong> {widgetTypes.find(wt => wt.type === widgetType)?.label}</div>
                  {selectedQuery && <div><strong>Requête:</strong> {selectedQuery.name}</div>}
                  {chartType && <div><strong>Graphique:</strong> {chartTypes.find(ct => ct.type === chartType)?.label}</div>}
                  <div><strong>Titre:</strong> {title || '(non défini)'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <div className="flex gap-2 w-full">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Retour
              </Button>
            )}
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Annuler
            </Button>
            {step === 4 && (
              <Button
                onClick={handleAddWidget}
                disabled={!title.trim()}
                className="flex-1 bg-[#FF5789] hover:bg-[#FF5789]/90"
              >
                Ajouter
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
