import * as React from "react";
import { Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { aiApi } from "@/lib/api/ai";
import { GlassCard } from "@/components/glass";

interface AIInsightCardProps {
  analyticsData: any; // e.g. from useAnalytics()
}

export function AIInsightCard({ analyticsData }: AIInsightCardProps) {
  const [insight, setInsight] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!analyticsData) return;
    
    let isMounted = true;
    setIsLoading(true);

    aiApi.getInsights(analyticsData)
      .then((res) => {
        if (isMounted) setInsight(res.summary);
      })
      .catch((err) => {
        console.error("Failed to fetch insights:", err);
        if (isMounted) setInsight("Couldn't load financial insights right now.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [analyticsData]);

  if (!analyticsData) return null;

  return (
    <GlassCard className="border border-accent-violet/20 bg-gradient-to-br from-surface-1 to-accent-violet/5 p-5 shadow-glow animate-fade-in">
      <div className="mb-3 flex items-center gap-2 text-accent-violet">
        <Sparkles className="h-5 w-5" />
        <h3 className="font-medium tracking-tight">AI Financial Insight</h3>
      </div>
      
      {isLoading ? (
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing your spending patterns...</span>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-1 h-5 w-5 shrink-0 text-accent-teal" />
          <p className="text-sm leading-relaxed text-ink-primary">
            {insight}
          </p>
        </div>
      )}
    </GlassCard>
  );
}
