import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { RintaraLogo } from "@/components/rintara/logo";
import { cn } from "@/lib/utils";

const registrationStages = ["Akun", "Peran", "Profil"] as const;

function RegistrationProgress({ stage }: { stage: 1 | 2 | 3 }) {
  return (
    <div
      className="mb-7"
      aria-label={`Progres pendaftaran, langkah ${stage} dari 3`}
    >
      <ol className="grid grid-cols-3 gap-3">
        {registrationStages.map((item, index) => {
          const completed = index + 1 < stage;
          const active = index + 1 === stage;

          return (
            <li
              key={item}
              className="grid grid-cols-[1.75rem_1fr] items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-lg border border-border bg-background text-xs font-semibold text-muted-foreground",
                  active && "border-primary bg-primary text-primary-foreground",
                  completed && "border-primary/25 bg-secondary text-primary",
                )}
                aria-hidden="true"
              >
                {completed ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-xs text-muted-foreground",
                  active && "font-semibold text-foreground",
                  completed && "text-primary",
                )}
              >
                {item}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AuthHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex h-18 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      <RintaraLogo
        prefetch={false}
        className="lg:hidden [&>span:first-child]:!shadow-none"
      />
      <Link
        href="/"
        prefetch={false}
        className="hidden min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 lg:inline-flex"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke beranda
      </Link>
      <Link
        href="/"
        prefetch={false}
        aria-label="Kembali ke beranda"
        className="ml-auto grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 lg:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
      </Link>
    </header>
  );
}

function AuthContent({
  title,
  description,
  stage,
  plain = false,
  children,
}: {
  title: string;
  description: string;
  stage?: 1 | 2 | 3;
  plain?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        plain
          ? "max-w-[34rem]"
          : "rounded-xl border border-border bg-card p-5 sm:p-8",
        !plain && (stage === 3 ? "max-w-[48rem]" : "max-w-[40rem]"),
      )}
    >
      {stage ? <RegistrationProgress stage={stage} /> : null}
      <h1 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
        {description}
      </p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

export function AuthVisualFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-background lg:grid lg:grid-cols-[minmax(22rem,0.82fr)_minmax(34rem,1.18fr)] lg:grid-rows-[4.5rem_minmax(0,1fr)]">
      <aside className="order-2 grid h-40 shrink-0 grid-rows-1 overflow-hidden border-b border-border bg-[#1b512d] sm:h-48 lg:sticky lg:top-0 lg:order-none lg:col-start-1 lg:row-span-2 lg:h-[100dvh] lg:grid-rows-[4.5rem_minmax(0,1fr)] lg:border-b-0 lg:border-r">
        <div className="hidden items-center px-6 lg:flex">
          <RintaraLogo
            prefetch={false}
            tone="inverse"
          />
        </div>
        <div className="relative min-h-0 overflow-hidden">
          <Image
            src="/visuals/rintara-auth-work-v1.webp"
            alt="Pekerja menyiapkan pesanan tanaman di toko lokal"
            fill
            fetchPriority="high"
            sizes="(max-width: 1023px) 100vw, 42vw"
            className="object-cover object-[center_42%] lg:object-center"
          />
        </div>
      </aside>

      <AuthHeader className="order-1 lg:col-start-2 lg:row-start-1" />

      <div className="order-3 flex min-w-0 flex-1 items-center px-4 py-8 sm:px-6 sm:py-10 lg:col-start-2 lg:row-start-2 lg:px-10">
        {children}
      </div>
    </main>
  );
}

export function AuthPanel({
  title,
  description,
  stage,
  children,
}: {
  title: string;
  description: string;
  stage?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <AuthContent
      title={title}
      description={description}
      stage={stage}
      plain
    >
      {children}
    </AuthContent>
  );
}

export function AuthShell({
  title,
  description,
  stage,
  children,
}: {
  title: string;
  description: string;
  stage?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[100dvh] bg-muted/25 lg:grid lg:grid-cols-[10.5rem_minmax(0,1fr)]">
      <aside className="hidden min-h-[100dvh] flex-col bg-[#1b512d] px-5 py-6 text-white lg:sticky lg:top-0 lg:flex lg:h-[100dvh]">
        <RintaraLogo
          prefetch={false}
          tone="inverse"
          className="self-start"
        />
      </aside>

      <section className="flex min-h-[100dvh] min-w-0 flex-col bg-background">
        <AuthHeader />

        <div className="flex flex-1 items-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <AuthContent
            title={title}
            description={description}
            stage={stage}
          >
            {children}
          </AuthContent>
        </div>
      </section>
    </main>
  );
}
