"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadCsvModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadCsvModal({ onClose, onSuccess }: UploadCsvModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const dropped = acceptedFiles[0];
    if (!dropped) return;
    setFile(dropped);
    // Pre-fill name from filename without extension
    const baseName = dropped.name.replace(/\.[^/.]+$/, "");
    setName(baseName);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    multiple: false,
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Veuillez selectionner un fichier CSV.");
      return;
    }
    if (!name.trim()) {
      setError("Le nom de la source est requis.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await api.dataSources.upload(file, name.trim());
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemoveFile() {
    setFile(null);
    setName("");
    setError(null);
  }

  return (
    /* Modal overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2
            id="upload-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Nouvelle source CSV
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpload} className="px-6 py-5 space-y-5">
          {/* Dropzone */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
              Fichier CSV
            </Label>
            {file ? (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <FileText
                  className="h-5 w-5 shrink-0 text-indigo-600"
                  aria-hidden="true"
                />
                <span className="flex-1 truncate text-sm text-gray-700">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  aria-label="Supprimer le fichier"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50"
                )}
              >
                <input {...getInputProps()} />
                <Upload
                  className={cn(
                    "mb-3 h-8 w-8",
                    isDragActive ? "text-indigo-500" : "text-gray-400"
                  )}
                  aria-hidden="true"
                />
                {isDragActive ? (
                  <p className="text-sm font-medium text-indigo-600">
                    Deposez le fichier ici...
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700">
                      Glissez-deposez un fichier CSV
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      ou cliquez pour selectionner
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Name field */}
          <div>
            <Label
              htmlFor="source-name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nom de la source
            </Label>
            <Input
              id="source-name"
              type="text"
              placeholder="ex: Ventes 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="text-sm">
              {error}
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !file}
              aria-busy={isUploading}
            >
              {isUploading ? "Import en cours..." : "Importer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
