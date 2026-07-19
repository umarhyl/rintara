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
    <Card className="relative overflow-hidden bg-card/72 shadow-none backdrop-blur-sm">
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-4 text-[2.15rem] font-semibold leading-none tracking-[-0.045em] text-foreground">{value}</p>
          <p className="mt-3 text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="text-primary/80">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
