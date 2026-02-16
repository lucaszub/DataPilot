"use client"

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, LayoutDashboard, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type DashboardResponse } from '@/lib/api';

export default function DashboardListPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState<DashboardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDashboards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.dashboards.list();
      setDashboards(data);
    } catch {
      setError('Impossible de charger les tableaux de bord. Vérifiez votre connexion.');
      setDashboards([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // Get first workspace
      const workspaces = await api.workspaces.list();
      if (workspaces.length === 0) {
        setError('Aucun workspace disponible. Creez-en un d\'abord.');
        return;
      }
      const created = await api.dashboards.create({
        workspace_id: workspaces[0].id,
        name: 'Nouveau tableau de bord',
        description: '',
        theme: 'classic',
      });
      router.push(`/dashboard/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    if (!confirm('Supprimer ce tableau de bord ?')) return;
    setDeletingId(id);
    try {
      await api.dashboards.delete(id);
      setDashboards((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tableaux de bord</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualisez et analysez vos donnees
          </p>
        </div>
        <Button
          className="bg-[#FF5789] hover:bg-[#FF5789]/90"
          onClick={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Nouveau
        </Button>
      </div>


      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Dashboard Grid */}
      {dashboards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun tableau de bord</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Creez votre premier tableau de bord pour commencer a visualiser vos donnees
            </p>
            <Button
              className="bg-[#FF5789] hover:bg-[#FF5789]/90"
              onClick={handleCreate}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Creer un tableau de bord
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <Link key={dashboard.id} href={`/dashboard/${dashboard.id}`}>
              <Card className="rounded-xl border border-border hover:border-[#FF5789] transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-[#FF5789]" />
                    <span className="flex-1 truncate">{dashboard.name}</span>
                    <button
                      onClick={(e) => handleDelete(e, dashboard.id)}
                      disabled={deletingId === dashboard.id}
                      className="shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Supprimer"
                    >
                      {deletingId === dashboard.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </CardTitle>
                  <CardDescription>{dashboard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="w-2 h-2 rounded-full bg-[#FF5789]" />
                      <span>{dashboard.theme}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {dashboard.updated_at
                      ? `Mis a jour le ${formatDate(dashboard.updated_at)}`
                      : `Cree le ${formatDate(dashboard.created_at)}`}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
