import { Logo } from "@/components/layout/Logo";

export default function GlobalLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-bg-base bg-noise">
      <Logo markOnly className="animate-pulse-soft" />
      <p className="text-sm text-ink-muted">Loading…</p>
    </div>
  );
}
