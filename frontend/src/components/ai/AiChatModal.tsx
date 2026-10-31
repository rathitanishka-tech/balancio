"use client";

import * as React from "react";
import { GlassModal } from "@/components/glass/GlassModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Send, User as UserIcon } from "lucide-react";
import { askAi, type AiMessage } from "@/lib/actions/ai";

export interface AiChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiChatModal({ open, onOpenChange }: AiChatModalProps) {
  const [messages, setMessages] = React.useState<AiMessage[]>([
    { role: "assistant", content: "Hey! 👋 What’s up? Want to check your expenses or balances?" }
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMsg: AiMessage = { role: "user", content: input.trim() };
    const newHistory = [...messages, newMsg];
    
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const reply = await askAi(newMsg.content);
      setMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([...newHistory, { role: "assistant", content: "Oops! Something went wrong connecting to my brain." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Balancio AI"
      description="Ask questions naturally and get instant financial clarity."
      className="max-w-lg"
    >
      <div className="flex h-[50vh] flex-col gap-4">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-primary">
                {msg.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4 text-accent-violet" />}
              </div>
              <div className={`rounded-[12px] px-3 py-2 text-sm max-w-[75%] ${msg.role === "user" ? "bg-accent-violet text-white" : "bg-surface-2 text-ink-secondary"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-2 flex-row">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-primary">
                <Bot className="h-4 w-4 text-accent-violet animate-pulse" />
              </div>
              <div className="rounded-[12px] px-3 py-2 text-sm bg-surface-2 text-ink-secondary flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSend} className="relative flex items-center pt-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your expenses..."
            className="pr-12"
            disabled={loading}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="absolute right-1 h-8 w-8 text-accent-violet"
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </GlassModal>
  );
}
