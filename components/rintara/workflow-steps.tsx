import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkflowSteps({ steps, current }: { steps: string[]; current: number }) {
  const overview = steps[0] === "Informasi publik";
  return (
    <ol
      className="grid snap-x grid-flow-col auto-cols-[minmax(11.5rem,1fr)] overflow-x-auto rounded-xl border border-border bg-card sm:grid-flow-row sm:grid-cols-4 sm:overflow-visible"
      aria-label={overview ? "Bagian formulir" : "Tahapan proses"}
    >
      {steps.map((step, index) => {
        const done = !overview && index < current;
        const active = !overview && index === current;

        return (
          <li
            key={step}
            className={cn(
              "flex snap-start items-center gap-3 border-r border-border p-3 text-sm transition-colors last:border-r-0",
              active && "bg-secondary text-secondary-foreground",
              done && "bg-success-soft text-foreground",
            )}
            aria-current={active ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md border bg-card text-xs font-semibold",
                active && "border-primary bg-primary text-primary-foreground",
                done && "border-success bg-success text-success-foreground",
              )}
            >
              {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className="font-semibold">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
