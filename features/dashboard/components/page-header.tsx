import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.12em] text-primary"><span className="h-px w-7 bg-primary/55" aria-hidden="true" />{eyebrow.toUpperCase()}</p> : null}
        <h1 className="text-balance text-[2.15rem] font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-[2.65rem]">{title}</h1>
        {description ? <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
