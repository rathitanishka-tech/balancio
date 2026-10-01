"use client";

import * as React from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api/ai";

import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";

export function AIChatPanel() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const { messages, status, sendMessage } = useChat({
    onError: (err) => {
      console.error("Chat error:", err);
      toast.error(err.message || "Failed to get AI response. Please try again.");
    }
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
                  {(msg.parts ? msg.parts.map(p => p.type === 'text' ? p.text : '').join('') : (msg as any).content) || "..."}
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
          <form onSubmit={handleSubmit} className="border-t border-line-subtle p-3 bg-surface-1">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your expenses..."
                className="w-full rounded-full border border-line-subtle bg-surface-2 py-2.5 pl-4 pr-12 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet transition-colors"
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
