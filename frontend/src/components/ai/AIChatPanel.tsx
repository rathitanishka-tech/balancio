"use client";

import * as React from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api/ai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AIChatPanel() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await aiApi.askExpenses(userMessage.content, history);
      // apiRequest already unwraps { success, data } and returns the data directly.
      if (response && (response as any).message) {
        const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: (response as any).message };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error("Unknown error");
      }
    } catch (error: any) {
      console.error("AI chat error:", error);
      
      let content = "Something went wrong while processing that. Please try again.";
      
      // If it's our custom ApiError, use its message directly, or use friendlyErrorMessage
      if (error?.status === 429) {
        content = "The AI provider is temporarily rate-limited right now. Please try again in a moment.";
      } else if (error?.message) {
        content = error.message;
      }
      
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-accent-violet shadow-glow hover:bg-accent-violet/90 hover:scale-105 transition-transform"
        >
          {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageSquare className="h-6 w-6 text-white" />}
        </Button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[350px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl border border-accent-violet/20 bg-surface-1 shadow-2xl animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-accent-violet/10 to-transparent p-4 border-b border-line-subtle">
            <Bot className="h-6 w-6 text-accent-violet" />
            <div>
              <h3 className="font-medium text-ink-primary">Ask Your Expenses</h3>
              <p className="text-xs text-ink-secondary">Powered by Balancio AI</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                <MessageSquare className="mb-2 h-10 w-10 text-accent-violet" />
                <p className="text-sm font-medium">✨ Ask me about your expenses</p>
                <p className="text-xs mt-2">Try asking:<br/>&quot;How much did I spend this month?&quot;<br/>&quot;What do I owe?&quot;<br/>&quot;Who owes me?&quot;</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-surface-3" : "bg-accent-violet/10 text-accent-violet"}`}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user" ? "bg-surface-3 text-ink-primary rounded-tr-sm" : "bg-accent-violet/10 text-ink-primary rounded-tl-sm whitespace-pre-wrap"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-violet/10 text-accent-violet">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-accent-violet/10 px-4 py-3 rounded-tl-sm text-sm text-ink-primary">
                  <span className="opacity-70">Thinking...</span>
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-violet/60 [animation-delay:-0.3s]"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-violet/60 [animation-delay:-0.15s]"></div>
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-violet/60"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="border-t border-line-subtle p-3 bg-surface-1">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your expenses..."
                className="w-full rounded-full border border-line-subtle bg-surface-2 py-2.5 pl-4 pr-12 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-accent-violet text-white transition-colors hover:bg-accent-violet/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4 -ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
