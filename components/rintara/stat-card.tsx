import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 p-4">
        <span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
        </div>
        <p className="tabular text-xl font-semibold leading-none text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
