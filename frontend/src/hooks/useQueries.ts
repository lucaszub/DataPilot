import useSWR from "swr";
import { api, type SavedQueryResponse } from "@/lib/api";

export function useSavedQueries(workspaceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SavedQueryResponse[]>(
    workspaceId ? `saved-queries-${workspaceId}` : null,
    () => api.queries.listSaved(workspaceId!)
  );

  return {
    savedQueries: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
