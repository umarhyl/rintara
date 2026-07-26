import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const tones: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-foreground",
  info: "border-primary/25 bg-secondary text-secondary-foreground",
  success: "border-success/25 bg-success-soft text-foreground",
  warning:
    "border-opportunity/55 bg-opportunity-soft text-opportunity-foreground",
  danger:
    "border-destructive/30 bg-[color-mix(in_srgb,var(--destructive)_9%,var(--card))] text-destructive",
};

export function StatusBadge({
  children,
  tone = "neutral",
  status,
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  status?: StatusTone;
  className?: string;
}) {
  const selectedTone = status ?? tone;
  return (
    <Badge variant="outline" className={cn("h-auto min-h-6 overflow-visible rounded-md px-2 py-1 font-medium leading-4", tones[selectedTone], className)}>
      {children}
    </Badge>
  );
}
