import { DashboardShell } from "@/components/layout/DashboardShell";
import { getOrCreateCurrentUser } from "@/lib/actions/user";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await getOrCreateCurrentUser();
  } catch (e) {
    // Ignore during build
  }
  return <DashboardShell>{children}</DashboardShell>;
}
