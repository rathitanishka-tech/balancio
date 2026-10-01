import { DashboardShell } from "@/components/layout/DashboardShell";
import { getOrCreateCurrentUser } from "@/lib/actions/user";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await getOrCreateCurrentUser();
  return <DashboardShell>{children}</DashboardShell>;
}
