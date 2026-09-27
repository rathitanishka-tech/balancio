"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common";
import { useDebounce } from "@/hooks/useDebounce";
import { searchApi } from "@/lib/api/search";
import { formatMoney } from "@/lib/formatters/currency";
import { Search, Users, Receipt, User as UserIcon, HandCoins } from "lucide-react";
import type { SearchResults } from "@/types/search";

export interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);

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
      <DialogContent hideClose className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2.5 border-b border-line-subtle px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-ink-muted" />
          <Input
            autoFocus
            placeholder="Search Balancio…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
          <kbd className="rounded-[6px] border border-line-strong px-1.5 py-0.5 text-[10px] text-ink-muted">esc</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
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
      className="focus-ring flex w-full items-center rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2"
    >
      {children}
    </button>
  );
}
