import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const tones: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-800",
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
    <Badge variant="outline" className={cn("h-auto min-h-6 gap-1.5 overflow-visible rounded-full px-2.5 py-1 font-semibold leading-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]", tones[selectedTone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </Badge>
  );
}
