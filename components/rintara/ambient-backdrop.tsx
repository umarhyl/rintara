import { cn } from "@/lib/utils";
import { ResponsiveParticleField } from "@/components/rintara/responsive-particle-field";

export function AmbientBackdrop({
  variant = "page",
  className,
}: {
  variant?: "hero" | "auth" | "page" | "dashboard";
  className?: string;
}) {
  return (
    <div className={cn("ambient-scene pointer-events-none absolute inset-0 overflow-hidden", `ambient-scene-${variant}`, className)} aria-hidden="true">
      <div className="ambient-orb ambient-orb-a absolute" />
      <div className="ambient-orb ambient-orb-b absolute" />
      {variant === "hero" || variant === "auth" ? <ResponsiveParticleField variant={variant} /> : null}
      <div className="ambient-grain absolute inset-0" />
    </div>
  );
}
