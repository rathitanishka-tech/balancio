import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2, Bot } from "lucide-react";
import { aiApi } from "@/lib/api/ai";

interface DebtExplanationDialogProps {
  debtData: any; // Information about the debt, like amounts, users, and recent group transactions
  trigger?: React.ReactNode;
}

export function DebtExplanationDialog({ debtData, trigger }: DebtExplanationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [explanation, setExplanation] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasFetched, setHasFetched] = React.useState(false);

  React.useEffect(() => {
    if (open && !hasFetched) {
      let isMounted = true;
      setIsLoading(true);
      
      aiApi.explainDebt(debtData)
        .then((res) => {
          if (isMounted) {
            setExplanation(res.explanation);
            setHasFetched(true);
          }
        })
        .catch((err) => {
          console.error("Failed to explain debt:", err);
          if (isMounted) setExplanation("Couldn't generate an explanation for this debt right now.");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
        
      return () => { isMounted = false; };
    }
  }, [open, hasFetched, debtData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-accent-violet hover:text-accent-violet/80">
            <HelpCircle className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-accent-violet/30 bg-surface-2 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent-violet">
            <Bot className="h-5 w-5" />
            AI Debt Explanation
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 min-h-[100px] text-sm text-ink-primary">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>Looking through your transactions...</p>
            </div>
          ) : (
            <div className="space-y-3 whitespace-pre-wrap leading-relaxed">
              {explanation}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
