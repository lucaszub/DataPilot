"use client";

import React, { useState, useEffect } from 'react';
import { Save, Plus, LayoutDashboard, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type DashboardResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SaveToDashboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chartName: string;
  chartType: string;
  sqlText: string;
  workspaceId: string;
}

export function SaveToDashboardDialog({
  isOpen,
  onClose,
  chartName: initialName,
  chartType,
  sqlText,
  workspaceId,
}: SaveToDashboardDialogProps) {
  const [name, setName] = useState(initialName);
  const [dashboards, setDashboards] = useState<DashboardResponse[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load dashboards when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    api.dashboards.list()
      .then((data) => {
        setDashboards(data);
        if (data.length > 0) {
          setSelectedDashboardId(data[0].id);
        } else {
          setIsCreatingNew(true);
        }
      })
      .catch(() => {
        setDashboards([]);
        setIsCreatingNew(true);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, initialName]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      let dashboardId = selectedDashboardId;

      // Create new dashboard if needed
      if (isCreatingNew) {
        if (!newDashboardName.trim()) {
          setError('Veuillez saisir un nom de tableau de bord');
          setIsSaving(false);
          return;
        }
        const newDashboard = await api.dashboards.create({
          workspace_id: workspaceId,
          name: newDashboardName,
          theme: 'classic',
        });
        dashboardId = newDashboard.id;
      }

      if (!dashboardId) {
        setError('Veuillez selectionner un tableau de bord');
        setIsSaving(false);
        return;
      }

      // 1. Save the query
      const savedQuery = await api.queries.createSaved({
        name: name,
        sql_text: sqlText,
        workspace_id: workspaceId,
        chart_type: chartType,
      });

      // 2. Add widget to dashboard
      await api.dashboards.addWidget(dashboardId, {
        type: 'chart',
        title: name,
        chart_type: chartType,
        saved_query_id: savedQuery.id,
        position: { x: 0, y: 0, w: 6, h: 4 },
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-[#FF5789]" />
            Enregistrer le graphique
          </DialogTitle>
          <DialogDescription>
            Enregistrez ce graphique et ajoutez-le a un tableau de bord
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Chart name */}
          <div className="space-y-2">
            <Label htmlFor="chart-name">Nom du graphique</Label>
            <Input
              id="chart-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon graphique..."
            />
          </div>

          {/* Dashboard selection */}
          <div className="space-y-2">
            <Label>Tableau de bord</Label>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Existing dashboards */}
                {dashboards.length > 0 && !isCreatingNew && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {dashboards.map((dashboard) => (
                      <button
                        key={dashboard.id}
                        onClick={() => setSelectedDashboardId(dashboard.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border-2 transition-all hover:border-[#FF5789]/50",
                          selectedDashboardId === dashboard.id
                            ? "border-[#FF5789] bg-[#FF5789]/5"
                            : "border-border"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{dashboard.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Toggle create new */}
                {dashboards.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingNew(!isCreatingNew)}
                    className="text-xs text-[#FF5789]"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {isCreatingNew ? 'Choisir un existant' : 'Creer un nouveau'}
                  </Button>
                )}

                {/* New dashboard name */}
                {isCreatingNew && (
                  <Input
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                    placeholder="Nom du nouveau tableau de bord..."
                  />
                )}
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Success */}
          {success && (
            <p className="text-sm text-green-600">Graphique enregistre avec succes !</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || success}
            className="bg-[#FF5789] hover:bg-[#FF5789]/90"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
