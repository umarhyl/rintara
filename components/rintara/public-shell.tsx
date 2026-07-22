import { PublicFooter } from "@/components/rintara/public-footer";
import { PublicHeader } from "@/components/rintara/public-header";
import { ScrollProgress } from "@/components/rintara/motion-primitives";
import { ScrollRevealManager } from "@/components/rintara/scroll-reveal-manager";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-card focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-xl">
        Lewati ke konten utama
      </a>
      <ScrollProgress />
      <ScrollRevealManager />
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex-1" data-scroll-flow>{children}</main>
      <PublicFooter />
    </div>
  );
}
