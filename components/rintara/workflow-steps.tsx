import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkflowSteps({ steps, current }: { steps: string[]; current: number }) {
  const overview = steps[0] === "Informasi publik";
  return <ol className="grid snap-x grid-flow-col auto-cols-[minmax(11.5rem,1fr)] gap-3 overflow-x-auto pb-1 sm:grid-flow-row sm:grid-cols-4 sm:overflow-visible sm:pb-0" aria-label={overview ? "Bagian formulir" : "Tahapan proses"}>{steps.map((step, index) => { const done = !overview && index < current; const active = !overview && index === current; return <li key={step} className={cn("flex snap-start items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm shadow-sm transition-colors", active && "border-primary bg-secondary text-primary", done && "border-success/30 bg-success-soft text-success")} aria-current={active ? "step" : undefined}><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl border bg-card text-xs font-semibold", active && "border-primary bg-primary text-primary-foreground", done && "border-success bg-success text-success-foreground")}>{done ? <Check className="size-4" aria-hidden="true" /> : index + 1}</span><span className="font-semibold">{step}</span></li>; })}</ol>;
}
