import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AmbientBackdrop } from "@/components/rintara/ambient-backdrop";
import { RintaraLogo } from "@/components/rintara/logo";
import { ThemeToggle } from "@/components/rintara/theme-toggle";

const journey = [
  { label: "Kesempatan", description: "Ketentuan terlihat sejak awal." },
  { label: "Kesepakatan", description: "Kedua pihak memahami langkahnya." },
  { label: "Bukti Kerja", description: "Pekerjaan selesai menjadi jejak nyata." },
] as const;

const registrationStages = ["Akun", "Peran", "Profil"] as const;

function JourneyStory() {
  return (
    <div className="relative mt-12">
      <span className="absolute bottom-5 left-[1.12rem] top-5 w-px bg-white/20" aria-hidden="true">
        <span className="auth-route-draw block h-full w-full origin-top bg-blue-200/80" />
      </span>
      <ol className="grid gap-8 pl-1" aria-label="Jejak kesempatan di Rintara">
        {journey.map((item, index) => (
          <li key={item.label} className="auth-journey-step relative flex items-center gap-5">
            <span className="theme-static-light relative z-10 grid size-9 shrink-0 place-items-center rounded-full border border-white/65 bg-white text-xs font-semibold text-[#12358f] shadow-[0_8px_24px_-12px_rgb(2_12_42/0.8)]">
              {index + 1}
            </span>
            <span>
              <span className="block text-base font-semibold text-white">{item.label}</span>
              <span className="mt-0.5 block text-base leading-7 text-blue-100/85">{item.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function JourneyCompact() {
  return (
    <div className="mb-7 px-1 lg:hidden">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.12em] text-primary">JEJAK RINTARA</p>
        <p className="text-xs text-muted-foreground">Dari awal hingga bukti</p>
      </div>
      <div className="relative">
        <span className="absolute left-[16.667%] right-[16.667%] top-3.5 h-px bg-border" aria-hidden="true">
          <span className="auth-route-draw-x block h-full w-full origin-left bg-primary/55" />
        </span>
        <ol className="relative grid grid-cols-3" aria-label="Kesempatan, Kesepakatan, lalu Bukti Kerja">
          {journey.map((item, index) => (
            <li key={item.label} className="auth-journey-step relative z-10 text-center">
              <span className="mx-auto grid size-7 place-items-center rounded-full border border-primary/30 bg-background text-[0.65rem] font-semibold text-primary">{index + 1}</span>
              <span className="mt-2 block text-[0.68rem] font-medium text-foreground">{item.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function RegistrationProgress({ stage }: { stage: 1 | 2 | 3 }) {
  return (
    <div className="mb-8" aria-label={`Progres pendaftaran, langkah ${stage} dari 3`}>
      <div className="mb-3 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-foreground">{registrationStages[stage - 1]}</span>
        <span className="text-muted-foreground">{stage} / 3</span>
      </div>
      <div className="h-px bg-border" aria-hidden="true">
        <span className="block h-0.5 -translate-y-px bg-primary transition-[width] duration-700 ease-out" style={{ width: `${(stage / 3) * 100}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-3 text-[0.68rem] text-muted-foreground">
        {registrationStages.map((item, index) => <span key={item} className={index + 1 <= stage ? "text-primary" : undefined}>{item}</span>)}
      </div>
    </div>
  );
}

export function AuthShell({
  title,
  description,
  eyebrow = "Rintara",
  stage,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  stage?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen overflow-x-clip bg-background lg:grid-cols-[minmax(25rem,0.82fr)_minmax(34rem,1.18fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#07142f] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <AmbientBackdrop variant="auth" />
        <div className="absolute inset-0 bg-[#07142f]/38" aria-hidden="true" />
        <RintaraLogo prefetch={false} className="relative z-10 self-start [&>span:first-child]:!bg-white [&>span:first-child]:!text-[#12358f] [&>span:last-child]:!text-white" />
        <div className="relative z-10 max-w-lg py-12">
          <p className="text-sm font-medium tracking-[0.16em] text-blue-100/85">SATU JEJAK, TIGA LANGKAH</p>
          <h2 className="mt-5 text-balance text-[2.75rem] font-semibold leading-[1.06] tracking-[-0.045em] xl:text-[3.5rem]">
            Mulai dengan jelas. Selesai dengan <span className="font-serif font-normal italic text-blue-100">bukti.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-blue-100/85">Rintara menjaga tugas, upah, dan langkah kerja tetap mudah dipahami oleh kedua pihak.</p>
          <JourneyStory />
        </div>
        <p className="relative z-10 text-sm text-blue-100/80">Jelas ketentuannya. Nyata jejaknya.</p>
      </section>

      <section className="relative flex min-h-screen items-start justify-center px-4 pb-10 pt-24 sm:px-8 sm:pt-28 lg:px-12 lg:py-28">
        <AmbientBackdrop variant="page" className="opacity-70" />
        <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-3 sm:inset-x-8 sm:top-6 lg:inset-x-10">
          <RintaraLogo prefetch={false} className="lg:hidden" />
          <Link href="/" prefetch={false} className="hidden min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground lg:inline-flex">
            <ArrowLeft className="size-4" aria-hidden="true" />Kembali ke beranda
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" prefetch={false} aria-label="Kembali ke beranda" className="grid size-11 place-items-center rounded-full border border-border bg-card/80 text-muted-foreground shadow-sm backdrop-blur-xl transition-colors duration-300 hover:bg-muted hover:text-foreground lg:hidden">
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="relative z-[1] my-auto w-full max-w-[34rem] lg:-ml-10">
          <JourneyCompact />
          <div className="auth-form-enter rounded-[2rem] border border-white/60 bg-card/82 p-6 shadow-[0_32px_90px_-48px_rgb(15_23_42/0.5)] backdrop-blur-2xl dark:border-white/10 sm:p-9 lg:p-10">
            {stage ? <RegistrationProgress stage={stage} /> : null}
            <p className="text-xs font-semibold tracking-[0.14em] text-primary">{eyebrow.toUpperCase()}</p>
            <h1 className="mt-3 text-balance text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-[2.75rem]">{title}</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
