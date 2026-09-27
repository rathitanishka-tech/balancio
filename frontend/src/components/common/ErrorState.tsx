import * as React from "react";
import { AlertTriangle, WifiOff, Lock, ShieldAlert, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

function describeError(error: unknown): { icon: React.ReactNode; title: string; description: string } {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return {
          icon: <WifiOff className="h-5 w-5" />,
          title: "Couldn't reach the server",
          description: "Check your connection - or that the backend is running - and try again."
        };
      case 401:
        return {
          icon: <Lock className="h-5 w-5" />,
          title: "Your session expired",
          description: "Please log in again to continue."
        };
      case 403:
        return {
          icon: <ShieldAlert className="h-5 w-5" />,
          title: "You don't have access to this",
          description: "Ask a group admin if you think this is a mistake."
        };
      case 404:
        return {
          icon: <SearchX className="h-5 w-5" />,
          title: "Not found",
          description: "This may have been deleted, or the link is incorrect."
        };
      case 409:
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "That didn't go through",
          description: error.message || "This conflicts with something that already exists."
        };
      case 429:
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "Slow down a little",
          description: "You've made too many requests. Please wait a moment and try again."
        };
      case 400:
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "Something's not quite right",
          description: error.message || "Please check the form and try again."
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "Something went wrong",
          description: "An unexpected error occurred on our end. Please try again."
        };
    }
  }
  return {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again."
  };
}

/** Reusable error state for any failed API-backed view, with status-code-aware copy (never a raw backend message). */
export function ErrorState({ error, title, onRetry, className }: ErrorStateProps) {
  const described = describeError(error);

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-accent-rose/20 bg-accent-rose/[0.04] px-6 py-14 text-center",
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-rose/10 text-accent-rose">
        {described.icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink-primary">{title ?? described.title}</p>
        <p className="max-w-sm text-sm text-ink-secondary">{described.description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
