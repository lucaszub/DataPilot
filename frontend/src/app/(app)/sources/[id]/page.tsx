"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, Trash2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { SchemaTable } from "@/components/features/SchemaTable";
import { DataPreviewTable } from "@/components/features/DataPreviewTable";
import { api, type DataSourceDetail, type DataSourcePreview } from "@/lib/api";

export default function SourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [previewPage, setPreviewPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch source detail
  const {
    data: source,
    error: sourceError,
    isLoading: sourceLoading,
  } = useSWR<DataSourceDetail>(
    id ? `data-source-${id}` : null,
    () => api.dataSources.getById(id)
  );

  // Fetch preview data
  const {
    data: preview,
    isLoading: previewLoading,
  } = useSWR<DataSourcePreview>(
    id ? `data-source-preview-${id}-page-${previewPage}` : null,
    () => api.dataSources.preview(id, previewPage, 50)
  );

  async function handleDelete() {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.dataSources.delete(id);
      router.push("/sources");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Erreur lors de la suppression."
      );
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // Loading state
  if (sourceLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="h-32 rounded-xl bg-gray-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  // Error state
  if (sourceError || !source) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Alert variant="destructive">
          {sourceError instanceof Error
            ? sourceError.message
            : "Source de donnees introuvable."}
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push("/sources")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Retour aux sources
        </Button>
      </div>
    );
  }

  const columns = source.schema_cache?.columns ?? [];
  const previewColumns = preview?.columns ?? columns;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/sources")}
            aria-label="Retour a la liste des sources"
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <Database className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-gray-900">
              {source.name}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 uppercase">
                {source.type}
              </span>
              {source.schema_cache && (
                <>
                  <span>{source.schema_cache.row_count.toLocaleString("fr-FR")} lignes</span>
                  <span>{columns.length} colonnes</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Delete button */}
        <div className="flex items-center gap-2 shrink-0">
          {deleteError && (
            <Alert variant="destructive" className="text-xs py-1.5 px-3">
              {deleteError}
            </Alert>
          )}
          {showDeleteConfirm ? (
            <>
              <span className="text-sm text-red-600 font-medium">
                Confirmer la suppression ?
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Confirmer la suppression de la source"
              >
                {isDeleting ? "Suppression..." : "Confirmer"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              aria-label={`Supprimer la source ${source.name}`}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Schema section */}
      <section aria-labelledby="schema-heading">
        <h2
          id="schema-heading"
          className="mb-4 text-lg font-semibold text-gray-900"
        >
          Schema
        </h2>
        <SchemaTable columns={columns} />
      </section>

      {/* Preview section */}
      <section aria-labelledby="preview-heading">
        <h2
          id="preview-heading"
          className="mb-4 text-lg font-semibold text-gray-900"
        >
          Apercu des donnees
        </h2>
        <DataPreviewTable
          columns={previewColumns}
          rows={preview?.rows ?? []}
          page={previewPage}
          totalPages={preview?.total_pages ?? 1}
          totalRows={preview?.total_rows ?? 0}
          onPrevPage={() => setPreviewPage((p) => Math.max(1, p - 1))}
          onNextPage={() =>
            setPreviewPage((p) =>
              Math.min(preview?.total_pages ?? 1, p + 1)
            )
          }
          isLoading={previewLoading}
        />
      </section>
    </div>
  );
}
