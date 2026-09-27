import * as React from "react";
import { Sparkles, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { aiApi, AIExpenseDraft } from "@/lib/api/ai";
import { toast } from "sonner";

interface AIExpenseAssistantProps {
  onDraftGenerated: (draft: AIExpenseDraft) => void;
  groupMembers?: string[];
}

export function AIExpenseAssistant({ onDraftGenerated, groupMembers }: AIExpenseAssistantProps) {
  const [text, setText] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  async function handleExtract() {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const draft = await aiApi.parseExpense(text, groupMembers);
      onDraftGenerated(draft);
      setText("");
    } catch (error: any) {
      toast.error("Couldn't understand that expense. Please try again or enter manually.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-accent-violet/30 bg-surface-2 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-accent-violet">
        <Sparkles className="h-4 w-4" />
        <span>Add with AI</span>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g., 'I paid ₹2400 for dinner with Riya and Aditya yesterday. Split equally.'"
        className="min-h-[100px] resize-none border-0 bg-surface-1 focus-visible:ring-1 focus-visible:ring-accent-violet"
        disabled={isProcessing}
      />
      <div className="flex justify-end">
        <Button 
          onClick={handleExtract} 
          disabled={!text.trim() || isProcessing}
          size="sm"
          className="bg-accent-violet text-white hover:bg-accent-violet/90"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Understand
        </Button>
      </div>
    </div>
  );
}
