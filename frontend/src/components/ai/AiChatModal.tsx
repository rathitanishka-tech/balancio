"use client";

import * as React from "react";
import { GlassModal } from "@/components/glass/GlassModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Send, User as UserIcon, RotateCcw, AlertCircle } from "lucide-react";
import type { AiMessage } from "@/lib/actions/ai";

export interface AiChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage extends AiMessage {
  isError?: boolean;
}

export function AiChatModal({ open, onOpenChange }: AiChatModalProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { role: "assistant", content: "Hey! 👋 What’s up? Want to check your expenses, balances, or who you owe?" }
  ]);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState("");
  const [failedMessage, setFailedMessage] = React.useState<string | null>(null);
  
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Smooth scroll tracking
  const scrollToBottom = React.useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  // Clean up any ongoing stream if modal closes
  React.useEffect(() => {
    if (!open && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingText("");
    }
  }, [open]);

  async function submitQuery(queryText: string, currentHistory: ChatMessage[]) {
    if (!queryText.trim() || isStreaming) return;

    const trimmedQuery = queryText.trim();
    const userMsg: ChatMessage = { role: "user", content: trimmedQuery };
    const nextHistory = [...currentHistory, userMsg];

    setMessages(nextHistory);
    setInput("");
    setFailedMessage(null);
    setIsStreaming(true);
    setStreamingText("");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedText = "";
    const fetchStart = performance.now();
    let browserTtfb = 0;
    let browserFirstToken = 0;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map(m => ({ role: m.role, content: m.content }))
        }),
        signal: abortController.signal
      });

      browserTtfb = performance.now() - fetchStart;

      if (!res.ok) {
        let errorMsg = "Unable to process your request.";
        try {
          const errData = await res.json();
          if (errData?.error) errorMsg = errData.error;
        } catch {
          const txt = await res.text();
          if (txt) errorMsg = txt;
        }

        setFailedMessage(trimmedQuery);
        setMessages([
          ...nextHistory,
          { role: "assistant", content: errorMsg, isError: true }
        ]);
        setIsStreaming(false);
        setStreamingText("");
        return;
      }

      if (!res.body) {
        throw new Error("No response body received.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let firstVisibleChunkReceived = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        if (!firstVisibleChunkReceived && chunk.trim()) {
          firstVisibleChunkReceived = true;
          browserFirstToken = performance.now() - fetchStart;
        }

        // Display progressively; trim leading whitespace used for immediate stream flushing
        setStreamingText(accumulatedText.trimStart());
      }

      const browserTotalDuration = performance.now() - fetchStart;
      console.log(
        `[AI Client Perf] Browser TTFB: ${browserTtfb.toFixed(1)}ms | First Visible Token: ${browserFirstToken.toFixed(1)}ms | Total Duration: ${browserTotalDuration.toFixed(1)}ms | Server-Timing: ${res.headers.get("Server-Timing")}`
      );

      // Finalize message once stream finishes
      setMessages([
        ...nextHistory,
        { role: "assistant", content: accumulatedText.trim() || "I didn't have any additional information to share." }
      ]);
      setStreamingText("");
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }

      setFailedMessage(trimmedQuery);
      if (accumulatedText.trim()) {
        // Preserve partial text if stream was disconnected mid-way
        setMessages([
          ...nextHistory,
          { role: "assistant", content: `${accumulatedText.trim()}\n\n*(Connection interrupted)*`, isError: true }
        ]);
      } else {
        setMessages([
          ...nextHistory,
          { role: "assistant", content: "Oops! Something went wrong communicating with Balancio AI. Please try again.", isError: true }
        ]);
      }
      setStreamingText("");
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    submitQuery(input, messages);
  }

  function handleRetry() {
    if (!failedMessage || isStreaming) return;

    // Remove the trailing error message if present
    const baseHistory = messages[messages.length - 1]?.isError
      ? messages.slice(0, -1)
      : messages;

    // Remove the user's previous failed query from history as submitQuery will re-add it
    const cleanHistory = baseHistory[baseHistory.length - 1]?.role === "user"
      ? baseHistory.slice(0, -1)
      : baseHistory;

    submitQuery(failedMessage, cleanHistory);
  }

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Balancio AI"
      description="Ask questions naturally and get instant financial clarity."
      className="w-full max-w-[95vw] sm:max-w-lg"
    >
      <div className="flex h-[52vh] flex-col gap-4">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-3.5 scroll-smooth">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  msg.role === "user"
                    ? "bg-[#4D8DFF] text-white"
                    : msg.isError
                    ? "bg-accent-rose/15 text-accent-rose border border-accent-rose/25"
                    : "bg-[#111B2B] text-[#4D8DFF] border border-[#26354B]"
                }`}
              >
                {msg.role === "user" ? (
                  <UserIcon className="h-4 w-4" />
                ) : msg.isError ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-[82%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#4D8DFF] text-white shadow-sm"
                    : msg.isError
                    ? "bg-accent-rose/10 text-accent-rose border border-accent-rose/25"
                    : "bg-[#F4F6FA] dark:bg-[#111B2B] text-[#172033] dark:text-[#E8EDF6] border border-[#DCE3ED] dark:border-[#26354B] shadow-sm whitespace-pre-wrap"
                }`}
              >
                {msg.content}

                {msg.isError && failedMessage && idx === messages.length - 1 && (
                  <div className="mt-2.5 pt-2 border-t border-accent-rose/20 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRetry}
                      disabled={isStreaming}
                      className="h-7 px-2.5 text-xs text-accent-rose hover:bg-accent-rose/15 hover:text-accent-rose flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Active progressive streaming response */}
          {isStreaming && (
            <div className="flex items-start gap-2.5 flex-row">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111B2B] text-[#4D8DFF] border border-[#26354B]">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <div className="rounded-2xl px-3.5 py-2.5 text-sm max-w-[82%] leading-relaxed bg-[#F4F6FA] dark:bg-[#111B2B] text-[#172033] dark:text-[#E8EDF6] border border-[#DCE3ED] dark:border-[#26354B] shadow-sm">
                {streamingText ? (
                  <span className="whitespace-pre-wrap">
                    {streamingText}
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#4D8DFF] animate-pulse align-middle" />
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 py-1 px-1">
                    <span className="h-2 w-2 rounded-full bg-[#4D8DFF] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#4D8DFF] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#4D8DFF] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Query Input Form */}
        <form onSubmit={handleSend} className="relative flex items-center pt-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isStreaming ? "Thinking..." : "Ask about your expenses, balances, or who owes who..."}
            className="pr-12 text-sm"
            disabled={isStreaming}
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-1.5 h-8 w-8 text-[#4D8DFF] hover:text-[#4D8DFF] hover:bg-[#4D8DFF]/10 disabled:opacity-40"
            disabled={isStreaming || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </GlassModal>
  );
}
