"use client"

import Link from 'next/link';
import { Plus, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDashboards } from '@/lib/mock-data/dashboards';

export default function DashboardListPage() {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tableaux de bord</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualisez et analysez vos données
          </p>
        </div>
        <Button className="bg-[#FF5789] hover:bg-[#FF5789]/90">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau
        </Button>
      </div>

      {/* Dashboard Grid */}
      {mockDashboards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun tableau de bord</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Créez votre premier tableau de bord pour commencer à visualiser vos données
            </p>
            <Button className="bg-[#FF5789] hover:bg-[#FF5789]/90">
              <Plus className="h-4 w-4 mr-2" />
              Créer un tableau de bord
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDashboards.map((dashboard) => (
            <Link key={dashboard.id} href={`/dashboard/${dashboard.id}`}>
              <Card className="rounded-xl border border-border hover:border-[#FF5789] transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-[#FF5789]" />
                    {dashboard.name}
                  </CardTitle>
                  <CardDescription>{dashboard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{dashboard.widgets.length} widgets</span>
                      <span className="w-2 h-2 rounded-full bg-[#FF5789]" />
                      <span>{dashboard.theme}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Mis à jour le {formatDate(dashboard.updatedAt)}
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
