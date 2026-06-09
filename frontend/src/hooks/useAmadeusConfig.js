import { useQuery } from "@tanstack/react-query";
import { fetchAmadeusConfigStatus } from "../api/tickets";
import { useDemo } from "../context/DemoContext";

export function useAmadeusConfig() {
  const { isDemoMode, demoFetchConfigStatus } = useDemo();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["amadeusConfigStatus", isDemoMode],
    queryFn: isDemoMode ? demoFetchConfigStatus : fetchAmadeusConfigStatus,
    staleTime: 60_000,
  });

  return {
    isConfigured: isDemoMode ? true : (data?.configured ?? false),
    officeId: data?.office_id,
    portalType: data?.portal_type,
    lastSyncedAt: data?.last_synced_at,
    isLoading: isDemoMode ? false : isLoading,
    refetch,
  };
}
