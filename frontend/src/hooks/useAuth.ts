import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerkAuth();

  const user = clerkUser ? {
    id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || "User",
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    avatarUrl: clerkUser.imageUrl,
  } : null;

  return {
    user,
    status: isLoaded ? (user ? "authenticated" : "unauthenticated") : "loading",
    login: async () => {}, // Handled by Clerk UI
    register: async () => {}, // Handled by Clerk UI
    logout: () => signOut(),
    refreshUser: async () => {},
  };
}
