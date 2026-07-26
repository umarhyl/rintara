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
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-1 text-sm text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h1 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[68ch] text-base leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">{action}</div>
      ) : null}
    </header>
  );
}
