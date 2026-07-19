import { cn } from "@/lib/utils";

export function DetailList({ items, className }: { items: Array<{ label: string; value: React.ReactNode }>; className?: string }) {
  return <dl className={cn("divide-y", className)}>{items.map((item) => <div key={item.label} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-5"><dt className="text-sm font-medium text-muted-foreground">{item.label}</dt><dd className="text-base leading-7 sm:text-base">{item.value}</dd></div>)}</dl>;
}
