"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Trash2, Rows, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type DataSourceListItem } from "@/lib/api";

interface DataSourceCardProps {
  source: DataSourceListItem;
  onDeleted: () => void;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function DataSourceCard({ source, onDeleted }: DataSourceCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleCardClick(e: React.MouseEvent) {
    // Prevent navigation when clicking on the delete button area
    const target = e.target as HTMLElement;
    if (target.closest("[data-delete-zone]")) return;
    router.push(`/sources/${source.id}`);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      await api.dataSources.delete(source.id);
      onDeleted();
    } catch {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setShowConfirm(false);
  }

  return (
    <div
      role="article"
      aria-label={`Source de donnees: ${source.name}`}
      onClick={handleCardClick}
      className="group relative flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
            <Database className="h-5 w-5 text-teal-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{source.name}</p>
            <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 uppercase tracking-wide mt-0.5">
              {source.type}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Rows className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {source.row_count !== null
              ? source.row_count.toLocaleString("fr-FR") + " lignes"
              : "—"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Columns className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {source.column_count !== null
              ? source.column_count + " colonnes"
              : "—"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between border-t border-gray-100 pt-3"
        data-delete-zone
      >
        <p className="text-xs text-gray-400">{formatDate(source.created_at)}</p>

        {showConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600 font-medium">Confirmer ?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label={`Confirmer la suppression de ${source.name}`}
              className="h-7 px-2 text-xs"
            >
              {isDeleting ? "..." : "Oui"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelDelete}
              className="h-7 px-2 text-xs"
            >
              Non
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            aria-label={`Supprimer ${source.name}`}
            className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
