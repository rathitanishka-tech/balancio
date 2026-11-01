import type { Metadata } from "next";
import { LandingView } from "@/components/landing/LandingView";

export const metadata: Metadata = {
  title: "Balancio — Shared Expenses, Simplified",
  description:
    "Track shared expenses, manage group balances, and understand your spending with Balancio. Zero awkwardness, mathematical debt simplification, and natural language AI.",
  openGraph: {
    title: "Balancio — Shared Expenses, Simplified",
    description:
      "Track shared expenses, manage group balances, and understand your spending with Balancio.",
    type: "website",
    siteName: "Balancio",
  },
};

export default function Page() {
  return <LandingView />;
}
