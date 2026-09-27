"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, Users, Receipt, User as UserIcon, HandCoins } from "lucide-react";
import { PageHeader, EmptyState, LoadingSkeleton } from "@/components/common";
import { GlassCard } from "@/components/glass";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { searchApi } from "@/lib/api/search";
import { formatMoney } from "@/lib/formatters/currency";
import type { SearchResults } from "@/types/search";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    searchApi
      .search(debouncedQuery)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const hasResults = results && (results.groups.length || results.expenses.length || results.users.length || results.settlements.length);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Search" description="Groups, expenses, and people you're authorized to see." />

      <div className="relative max-w-lg">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input placeholder="Search Balancio…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" autoFocus />
      </div>

      {loading && <LoadingSkeleton count={4} />}

      {!loading && query.trim() && !hasResults && (
        <EmptyState title="No results" description={`Nothing matched "${query}".`} />
      )}

      {!loading && results && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {results.groups.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-primary">
                <Users className="h-4 w-4" /> Groups
              </h3>
              <div className="flex flex-col gap-1">
                {results.groups.map((g) => (
                  <Link key={g.id} href={`/groups/${g.id}`} className="rounded-ctl px-2 py-1.5 text-sm text-ink-secondary hover:bg-surface-2 hover:text-ink-primary">
                    {g.name}
                  </Link>
                ))}
              </div>
            </GlassCard>
          )}
          {results.expenses.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-primary">
                <Receipt className="h-4 w-4" /> Expenses
              </h3>
              <div className="flex flex-col gap-1">
                {results.expenses.map((e) => (
                  <Link key={e.id} href={`/expenses/${e.id}`} className="flex justify-between rounded-ctl px-2 py-1.5 text-sm text-ink-secondary hover:bg-surface-2 hover:text-ink-primary">
                    <span>{e.title}</span>
                    <span>{formatMoney(e.amount)}</span>
                  </Link>
                ))}
              </div>
            </GlassCard>
          )}
          {results.users.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-primary">
                <UserIcon className="h-4 w-4" /> People
              </h3>
              <div className="flex flex-col gap-1">
                {results.users.map((u) => (
                  <div key={u.id} className="rounded-ctl px-2 py-1.5 text-sm text-ink-secondary">
                    {u.name} <span className="text-ink-muted">· {u.email}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
          {results.settlements.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-primary">
                <HandCoins className="h-4 w-4" /> Settlements
              </h3>
              <div className="flex flex-col gap-1">
                {results.settlements.map((s) => (
                  <div key={s.id} className="flex justify-between rounded-ctl px-2 py-1.5 text-sm text-ink-secondary">
                    <span>{s.note ?? "Settlement"}</span>
                    <span>{formatMoney(s.amount)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSkeleton count={4} />}>
      <SearchPageContent />
    </Suspense>
  );
}
