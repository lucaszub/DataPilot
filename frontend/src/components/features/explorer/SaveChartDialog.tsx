"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, type DashboardResponse } from '@/lib/api';
import { useExplorer } from './ExplorerContext';

interface SaveChartDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string | null;
}

export function SaveChartDialog({ open, onClose, workspaceId }: SaveChartDialogProps) {
  const { state } = useExplorer();
  const [chartName, setChartName] = useState('');
  const [dashboards, setDashboards] = useState<DashboardResponse[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>('');
  const [newDashboardName, setNewDashboardName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Generate default chart name from selected fields
  useEffect(() => {
    if (open && !chartName) {
      const measures = state.selectedFields.filter(f => f.role === 'measure');
      const dimensions = state.selectedFields.filter(f => f.role === 'dimension');
      const parts: string[] = [];
      if (measures.length > 0) parts.push(measures.map(m => m.name).join(', '));
      if (dimensions.length > 0) parts.push(`par ${dimensions.map(d => d.name).join(', ')}`);
      setChartName(parts.join(' ') || 'Mon graphique');
    }
  }, [open, state.selectedFields, chartName]);

  // Load dashboards when dialog opens
  useEffect(() => {
    if (!open) return;
    setIsLoadingDashboards(true);
    setDashboardError(null);

    api.dashboards.list()
      .then((data) => {
        setDashboards(data);
        if (data.length > 0 && !selectedDashboardId) {
          setSelectedDashboardId(data[0].id);
        }
      })
      .catch((err) => {
        setDashboardError(err instanceof Error ? err.message : 'Impossible de charger les dashboards');
      })
      .finally(() => {
        setIsLoadingDashboards(false);
      });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!workspaceId) {
      setSaveStatus('error');
      setSaveMessage('Aucun workspace disponible');
      return;
    }

    if (!chartName.trim()) {
      setSaveStatus('error');
      setSaveMessage('Veuillez saisir un nom');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage(null);

    try {
      let dashboardId = selectedDashboardId;

      // Create a new dashboard if needed
      if (isCreatingNew && newDashboardName.trim()) {
        const newDashboard = await api.dashboards.create({
          workspace_id: workspaceId,
          name: newDashboardName.trim(),
        });
        dashboardId = newDashboard.id;
      }

      if (!dashboardId) {
        setSaveStatus('error');
        setSaveMessage('Selectionnez ou creez un dashboard');
        setIsSaving(false);
        return;
      }

      // Save the query
      const sql = state.generatedSql || state.customSql;
      const chartType = state.chartType !== 'table' ? state.chartType : null;

      const savedQuery = await api.queries.createSaved({
        name: chartName.trim(),
        sql_text: sql,
        workspace_id: workspaceId,
        chart_type: chartType,
      });

      // Add widget to the dashboard
      await api.dashboards.addWidget(dashboardId, {
        type: state.chartType === 'table' ? 'table' : 'chart',
        title: chartName.trim(),
        chart_type: chartType || undefined,
        saved_query_id: savedQuery.id,
        position: { x: 0, y: 0, w: 6, h: 4 },
      });

      setSaveStatus('success');
      setSaveMessage('Graphique enregistre');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save chart:', err);
      setSaveStatus('error');
      setSaveMessage(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setChartName('');
    setSelectedDashboardId('');
    setNewDashboardName('');
    setIsCreatingNew(false);
    setSaveStatus('idle');
    setSaveMessage(null);
    setDashboardError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-chart-title"
    >
      <div className="w-full max-w-md rounded-xl bg-card shadow-xl border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id="save-chart-title" className="text-lg font-semibold text-foreground">
            Enregistrer le graphique
          </h2>
          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Chart name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nom du graphique
            </label>
            <Input
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
              placeholder="Ex: Ventes par mois"
              className="h-9"
            />
          </div>

          {/* Dashboard selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Dashboard
            </label>
            {isLoadingDashboards ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            ) : dashboardError ? (
              <div className="flex items-center gap-2 text-sm text-destructive py-2">
                <AlertCircle className="h-4 w-4" />
                {dashboardError}
              </div>
            ) : (
              <>
                {!isCreatingNew ? (
                  <div className="space-y-2">
                    {dashboards.length > 0 ? (
                      <select
                        value={selectedDashboardId}
                        onChange={(e) => setSelectedDashboardId(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {dashboards.map((db) => (
                          <option key={db.id} value={db.id}>
                            {db.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun dashboard existant</p>
                    )}
                    <button
                      onClick={() => setIsCreatingNew(true)}
                      className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Creer un nouveau dashboard
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={newDashboardName}
                      onChange={(e) => setNewDashboardName(e.target.value)}
                      placeholder="Nom du nouveau dashboard"
                      className="h-9"
                      autoFocus
                    />
                    {dashboards.length > 0 && (
                      <button
                        onClick={() => setIsCreatingNew(false)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Choisir un dashboard existant
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status message */}
          {saveStatus !== 'idle' && saveMessage && (
            <div className={`flex items-center gap-2 text-sm ${
              saveStatus === 'success' ? 'text-green-600' : 'text-destructive'
            }`}>
              {saveStatus === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {saveMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={
              isSaving ||
              !chartName.trim() ||
              (!selectedDashboardId && !isCreatingNew) ||
              (isCreatingNew && !newDashboardName.trim()) ||
              isLoadingDashboards ||
              !!dashboardError
            }
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
