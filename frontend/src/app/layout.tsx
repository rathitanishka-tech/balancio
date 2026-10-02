import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "@/styles/globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

export const metadata: Metadata = {
  title: "Balancio",
  description:
    "Track shared expenses, understand who owes whom, and settle debts with fewer transactions.",
  icons: { icon: "/balancio.png" }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
        <body className="min-h-screen bg-bg-base font-sans text-ink-primary antialiased">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryProvider>
              <TooltipProvider delayDuration={200}>
                {children}
                <AIChatPanel />
                <Toaster />
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

// Triggering Vercel deployment
