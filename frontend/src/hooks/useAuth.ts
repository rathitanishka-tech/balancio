import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserOrNull } from "@/lib/actions/user";

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: prismaUser, isLoading: isDbLoading, refetch } = useQuery({
    queryKey: ["auth-user", clerkUser?.id],
    queryFn: () => getCurrentUserOrNull(),
    enabled: !!isSignedIn && !!clerkUser,
    staleTime: Infinity,
  });

  const isLoading = !isLoaded || (isSignedIn && isDbLoading);
  const status = isLoading 
    ? "loading" 
    : (isSignedIn && prismaUser ? "authenticated" : "unauthenticated");

  const logout = async () => {
    await signOut();
    queryClient.clear();
    router.push("/login");
  };

  return {
    user: prismaUser || null,
    status,
    login: async () => { router.push("/login") },
    register: async () => { router.push("/register") },
    logout,
    refreshUser: async () => { if (isSignedIn) await refetch(); },
  };
}
