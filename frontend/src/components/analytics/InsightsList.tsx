import { GlassCard } from "@/components/glass";
import { Lightbulb } from "lucide-react";
import type { CategoryAnalytics, GroupAnalytics, TrendPoint } from "@/types/analytics";

export interface InsightsListProps {
  categories?: CategoryAnalytics[];
  groups?: GroupAnalytics[];
  trends?: TrendPoint[];
}

/**
 * Every insight here is derived directly from the data already fetched for
 * this page - nothing is a canned string unless the underlying computation
 * genuinely produced that finding (spec section 37: "Never fabricate data").
 */
export function InsightsList({ categories, groups, trends }: InsightsListProps) {
  const insights: string[] = [];

  if (categories && categories.length > 0) {
    const top = [...categories].sort((a, b) => b.totalSpending - a.totalSpending)[0];
    insights.push(`${top.category} is your highest spending category.`);
  }

  if (trends && trends.length >= 2) {
    const last = trends[trends.length - 1];
    const prev = trends[trends.length - 2];
    if (prev.totalSpending > 0) {
      const change = ((last.totalSpending - prev.totalSpending) / prev.totalSpending) * 100;
      if (Math.abs(change) >= 1) {
        insights.push(
          `Your spending ${change > 0 ? "increased" : "decreased"} ${Math.abs(change).toFixed(0)}% compared with last month.`
        );
      }
    } else if (last.totalSpending > 0) {
      insights.push("You had no recorded spending last month, but this month is active.");
    }
  }

  if (groups && groups.length > 0) {
    const total = groups.reduce((sum, g) => sum + g.totalSpending, 0);
    const top = [...groups].sort((a, b) => b.totalSpending - a.totalSpending)[0];
    if (total > 0) {
      const share = (top.totalSpending / total) * 100;
      if (share >= 30) {
        insights.push(`${top.name} accounts for ${share.toFixed(0)}% of your shared expenses.`);
      }
    }
  }

  if (insights.length === 0) {
    insights.push("Add a few more expenses and we'll start surfacing insights here.");
  }

  return (
    <GlassCard className="p-5">
      <h3 className="mb-3 text-base font-semibold text-ink-primary">Insights</h3>
      <ul className="flex flex-col gap-2.5">
        {insights.map((insight) => (
          <li key={insight} className="flex items-start gap-2.5 text-sm text-ink-secondary">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-violet" aria-hidden="true" />
            {insight}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
