import { useQuery } from "@tanstack/react-query";

import { authApi } from "../api";
import { AUTH_QUERY_KEYS } from "../constants";

/**
 * Public auth settings (currently: is self-registration on?). Fetched
 * once per page load — they only change when the server is redeployed
 * with different config.
 */
export function useAuthOptions() {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.options,
    queryFn: () => authApi.getOptions(),
    staleTime: Infinity,
    retry: false,
  });
}
