import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <section className="relative overflow-hidden border-y border-border bg-card/38 px-6 py-12 text-center" aria-label={title}>
      <span className="absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-primary" aria-hidden="true" />
      <Inbox className="mx-auto size-6 text-primary" aria-hidden="true" />
      <h2 className="mt-5 text-xl font-semibold tracking-[-0.025em]">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">{description}</p>
      {actionLabel && actionHref ? (
        <Button className="mt-6 h-11 rounded-full px-5" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </section>
  );
}
