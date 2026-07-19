export function ScrollProgress() {
  return <div className="scroll-progress" aria-hidden="true" />;
}

export function LiveIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
      <span className="relative flex size-2" aria-hidden="true">
        <span className="soft-pulse absolute inline-flex size-full rounded-full bg-success/50" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      {label}
    </span>
  );
}
