import { useAuthContext } from "@/providers/AuthProvider";

/** Thin re-export so components import from hooks/, consistent with the rest of the app. */
export function useAuth() {
  return useAuthContext();
}
