import useSWR from "swr";
import { api, type DataSourceListItem } from "@/lib/api";

export function useDataSources() {
  const { data, error, isLoading, mutate } = useSWR<DataSourceListItem[]>(
    "data-sources-list",
    () => api.dataSources.list()
  );

  return {
    sources: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
