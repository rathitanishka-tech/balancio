"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsSmallScreen } from "@/hooks/useMediaQuery";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { searchApi } from "@/lib/api/search";
import { formatMoney } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils/cn";
import { Search, Users, Receipt, User as UserIcon, HandCoins, X } from "lucide-react";
import type { SearchResults } from "@/types/search";

export interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const isSmallScreen = useIsSmallScreen();
  const vv = useVisualViewport();
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Prevent background scrolling when search dialog is open on small viewports
  React.useEffect(() => {
    if (!open || !isSmallScreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isSmallScreen]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  React.useEffect(() => {
    let cancelled = false;
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    searchApi
      .search(debouncedQuery)
      .then((r) => {
        if (!cancelled) setResults(r);
      })
      .catch(() => {
        if (!cancelled) setResults(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function go(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  const hasResults =
    results && (results.groups.length || results.expenses.length || results.users.length || results.settlements.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        noDefaultPositioning
        className={cn(
          "fixed z-50 overflow-hidden flex flex-col overscroll-contain",
          "w-[calc(100%-24px)] max-w-xl left-1/2 -translate-x-1/2 top-[max(0.75rem,env(safe-area-inset-top))] translate-y-0 rounded-2xl max-h-[calc(100dvh-24px)]",
          "sm:w-full sm:max-w-xl sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:max-h-[80vh]",
          "border border-modal-border bg-modal-bg text-ink-primary shadow-2xl p-0 gap-0",
          "data-[state=open]:animate-search-scale-in sm:data-[state=open]:animate-modal-scale-in"
        )}
        style={
          isSmallScreen && vv && vv.isKeyboardOpen
            ? {
                top: `${Math.max(12, vv.offsetTop + 12)}px`,
                maxHeight: `${Math.min(vv.height - 24, 600)}px`,
              }
            : undefined
        }
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-modal-border px-3.5 py-2.5 sm:px-4 sm:py-3.5">
          <Search className="h-4 w-4 shrink-0 text-form-placeholder ml-0.5" />
          <Input
            autoFocus
            inputMode="search"
            enterKeyHint="search"
            placeholder="Search Balancio…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-auto border-0 bg-transparent dark:bg-transparent p-0 text-sm shadow-none hover:border-0 hover:bg-transparent focus:border-0 focus:ring-0 focus-visible:ring-0 text-[#172033] dark:text-[#E8EDF6] placeholder:text-[#8995A7] dark:placeholder:text-[#8795A9]"
          />
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-ink-muted hover:text-ink-primary hover:bg-surface-2 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center shrink-0"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded-[6px] border border-modal-border px-1.5 py-0.5 text-[10px] text-form-placeholder shrink-0">esc</kbd>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium text-ink-secondary hover:text-ink-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label="Close search"
          >
            <span className="sm:hidden">Cancel</span>
            <X className="hidden sm:block h-4 w-4" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain p-2"
          style={
            isSmallScreen && vv && vv.isKeyboardOpen
              ? {
                  maxHeight: `${Math.max(120, vv.height - 84)}px`,
                }
              : undefined
          }
        >
          {!query.trim() && (
            <p className="px-3 py-8 text-center text-sm text-ink-muted">
              Search groups, expenses, and people across everything you&apos;re authorized to see.
            </p>
          )}

          {query.trim() && loading && <p className="px-3 py-8 text-center text-sm text-ink-muted">Searching…</p>}

          {query.trim() && !loading && !hasResults && (
            <EmptyState
              className="border-none py-8"
              title="No results"
              description={`Nothing matched "${query}".`}
            />
          )}

          {results && results.groups.length > 0 && (
            <ResultSection title="Groups" icon={<Users className="h-3.5 w-3.5" />}>
              {results.groups.map((g) => (
                <ResultRow key={g.id} onClick={() => go(`/groups/${g.id}`)}>
                  <span className="font-medium text-ink-primary">{g.name}</span>
                  {g.description && <span className="ml-2 truncate text-ink-muted">{g.description}</span>}
                </ResultRow>
              ))}
            </ResultSection>
          )}

          {results && results.expenses.length > 0 && (
            <ResultSection title="Expenses" icon={<Receipt className="h-3.5 w-3.5" />}>
              {results.expenses.map((e) => (
                <ResultRow key={e.id} onClick={() => go(`/expenses/${e.id}`)}>
                  <span className="font-medium text-ink-primary">{e.title}</span>
                  <span className="ml-2 text-ink-muted">— {formatMoney(e.amount)}</span>
                </ResultRow>
              ))}
            </ResultSection>
          )}

          {results && results.users.length > 0 && (
            <ResultSection title="People" icon={<UserIcon className="h-3.5 w-3.5" />}>
              {results.users.map((u) => (
                <ResultRow key={u.id} onClick={() => go(`/search?q=${encodeURIComponent(u.name)}`)}>
                  <span className="font-medium text-ink-primary">{u.name}</span>
                  <span className="ml-2 text-ink-muted">{u.email}</span>
                </ResultRow>
              ))}
            </ResultSection>
          )}

          {results && results.settlements.length > 0 && (
            <ResultSection title="Settlements" icon={<HandCoins className="h-3.5 w-3.5" />}>
              {results.settlements.map((s) => (
                <ResultRow key={s.id} onClick={() => go(`/groups/${s.groupId}/balances`)}>
                  <span className="font-medium text-ink-primary">{formatMoney(s.amount)}</span>
                  {s.note && <span className="ml-2 truncate text-ink-muted">{s.note}</span>}
                </ResultRow>
              ))}
            </ResultSection>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
        {icon}
        {title}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function ResultRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="focus-ring flex w-full items-center rounded-[8px] px-3 py-2.5 sm:py-2 text-left text-sm transition-colors hover:bg-surface-2 active:bg-surface-2 min-h-[44px] sm:min-h-0"
    >
      {children}
    </button>
  );
}
