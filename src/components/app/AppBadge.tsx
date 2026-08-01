import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Tom = "success" | "warning" | "destructive" | "info" | "neutro";

const tons: Record<Tom, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/35 dark:text-warning",
  destructive: "bg-destructive/12 text-destructive border-destructive/25",
  info: "bg-info/12 text-info border-info/25",
  neutro: "bg-muted text-muted-foreground border-border",
};

interface AppBadgeProps {
  tom?: Tom;
  children: ReactNode;
  className?: string;
}

export function AppBadge({ tom = "neutro", children, className }: AppBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tons[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}
