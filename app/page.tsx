import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  FileSignature,
  LockKeyhole,
  MapPin,
  PackageOpen,
  Search,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";
import { getPublicJobReferenceData } from "@/server/queries/jobs/public-jobs";

const rintaraMechanisms = [
  {
    icon: Search,
    title: "Bandingkan sebelum melamar",
    description:
      "Tugas, area umum, jadwal, durasi, dan upah tersedia sejak awal.",
  },
  {
    icon: FileSignature,
    title: "Konfirmasi ketentuan yang sama",
    description:
      "Satu pekerja diterima, lalu kedua pihak mengonfirmasi Mini Agreement.",
  },
  {
    icon: BadgeCheck,
    title: "Bangun riwayat dari kerja selesai",
    description:
      "Check-in, check-out, dan verifikasi penyelesaian mengarah ke Bukti Kerja.",
  },
] as const;

const confidencePoints = [
  {
    icon: BriefcaseBusiness,
    title: "Ketentuan terlihat sejak awal",
    description:
      "Tugas, jadwal, area umum, durasi, dan upah dapat dibandingkan sebelum melamar.",
  },
  {
    icon: LockKeyhole,
    title: "Alamat lengkap tetap privat",
    description:
      "Detail lokasi hanya dibuka kepada pekerja yang sudah diterima.",
  },
  {
    icon: BadgeCheck,
    title: "Hasil kerja menjadi bukti",
    description:
      "Pekerjaan yang selesai dan diverifikasi masuk ke Paspor Rintara.",
  },
] as const;

const categoryIcons = {
  "Event Helper": CalendarDays,
  "Light Cleaning": Sparkles,
  "Light Packing and Warehouse Helper": PackageOpen,
  "Shop Helper": Store,
  "Simple Administration and Data Entry": FileSpreadsheet,
} as const;

function getCategoryIcon(categoryName: string) {
  return (
    categoryIcons[categoryName as keyof typeof categoryIcons] ??
    BriefcaseBusiness
  );
}

export default async function Home() {
  const referenceData = await getPublicJobReferenceData();
  const categories = referenceData.categories.slice(0, 8);
  const areas = referenceData.areas.slice(0, 6);

  return (
    <PublicShell>
      <template
        data-rintara-direction
        dangerouslySetInnerHTML={{
          __html:
            "<!-- THESIS: Rintara opens as a real local-work homepage, while the job list stays in its own discovery route. OWN-WORLD: a deep-forest search panel sits directly beside documentary local-work photography, with soft utility fields and a green geometric Rintara mark. STORY: understand the offer, search by task and area, learn how work becomes proof, then choose the worker or employer path. FIRST VIEWPORT: a compact public header above one joined search-and-image composition. FORM: image-led marketplace gateway without Upwork branding or out-of-scope features. -->",
        }}
      />

      <section
        className="bg-[#edf2ee] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9"
        data-home-hero
      >
        <div className="mx-auto grid w-full max-w-[80rem] overflow-hidden rounded-[1.5rem] bg-[#176646] shadow-[0_28px_70px_-52px_rgb(27_81_45/0.75)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div
            className="flex flex-col justify-center px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-10 xl:px-12"
            data-home-search-panel
          >
            <h1 className="max-w-[15ch] text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-5xl">
              Cari kerja lokal dengan ketentuan jelas
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/78">
              Bandingkan tugas, upah, area umum, dan jadwal sebelum melamar.
            </p>

            <form
              action="/jobs"
              method="get"
              role="search"
              className="mt-7 grid gap-3 rounded-xl bg-white p-4 text-foreground shadow-[0_20px_48px_-36px_rgb(9_41_25/0.8)] xl:grid-cols-2"
            >
              <label className="grid gap-2" htmlFor="home-job-search">
                <span className="text-sm font-semibold text-foreground">
                  Apa yang ingin kamu kerjakan?
                </span>
                <span className="relative block">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="home-job-search"
                    name="q"
                    type="search"
                    maxLength={120}
                    placeholder="Cari pekerjaan"
                    className="h-12 w-full rounded-lg border border-input bg-white pl-10 pr-3 text-base outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                  />
                </span>
              </label>

              <label className="grid gap-2" htmlFor="home-area-search">
                <span className="text-sm font-semibold text-foreground">
                  Di wilayah mana?
                </span>
                <span className="relative block">
                  <MapPin
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <select
                    id="home-area-search"
                    name="location"
                    defaultValue=""
                    className="h-12 w-full rounded-lg border border-input bg-white pl-10 pr-8 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                  >
                    <option value="">Semua wilayah</option>
                    {referenceData.areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              <Button type="submit" className="h-12 px-6 xl:col-span-2">
                Cari pekerjaan
              </Button>
            </form>

            <Link
              href="/for-employers"
              className="mt-4 inline-flex min-h-11 w-fit flex-wrap items-center gap-2 rounded-lg px-1 text-base font-semibold text-white outline-none transition-colors duration-150 hover:text-[#def4c6] focus-visible:ring-3 focus-visible:ring-white/40"
            >
              Punya pekerjaan?
              <span className="inline-flex items-center gap-2 text-[#def4c6]">
                Lihat alur pemberi kerja
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </span>
            </Link>
          </div>

          <div
            className="relative min-h-64 sm:min-h-80 lg:min-h-[34rem]"
            data-home-hero-image
          >
            <Image
              src="/visuals/rintara-local-work-v2.webp"
              alt="Pekerja menyiapkan perlengkapan untuk pekerjaan lokal"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 1023px) 100vw, 55vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section
        id="mengapa-rintara"
        aria-label="Perlindungan informasi pekerjaan"
        className="scroll-mt-24 bg-white"
      >
        <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex max-w-5xl flex-col gap-3 md:flex-row md:items-start md:gap-8">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] md:w-[17rem] md:shrink-0">
              Yang dijaga sejak awal
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Rintara menempatkan informasi penting sebelum keputusan, lalu
              menjaga jejak pekerjaan tetap terhubung sampai selesai.
            </p>
          </div>

          <ul className="mt-7 grid gap-4 md:grid-cols-3">
            {confidencePoints.map((point) => {
              const Icon = point.icon;
              return (
                <li
                  key={point.title}
                  className="grid grid-cols-[2.5rem_1fr] items-center gap-3 rounded-xl bg-[#f2f6f2] p-4"
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-[#def4c6] text-[#1b512d]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{point.title}</p>
                    <p className="mt-1 text-base leading-6 text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {categories.length > 0 || areas.length > 0 ? (
        <section
          id="jelajahi"
          className="mx-auto w-full max-w-[80rem] scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-18"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.025em]">
                Jelajahi pekerjaan dengan caramu
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Mulai dari jenis pekerjaan atau wilayah yang paling dekat dengan
                kebutuhanmu.
              </p>
            </div>
            <Link
              href="/categories"
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary outline-none transition-colors duration-150 hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              Lihat semua kategori
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8">
            {categories.length > 0 ? (
              <div>
                <div className="flex items-center gap-3">
                  <BriefcaseBusiness
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold">Kategori pekerjaan</h3>
                </div>
                <ul
                  data-home-category-grid
                  className="mt-5 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                >
                  {categories.map((category) => {
                    const CategoryIcon = getCategoryIcon(category.name);

                    return (
                      <li key={category.id} className="min-w-0">
                        <Link
                          data-home-category-card
                          href={{
                            pathname: "/jobs",
                            query: { category: category.id },
                          }}
                          className="flex min-h-20 h-full items-center gap-3.5 rounded-xl border border-[#d4ded6] bg-white p-4 text-left outline-none transition-[border-color,background-color] duration-150 hover:border-primary hover:bg-[#fbfdfb] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/25 active:border-primary active:bg-secondary/35 sm:p-5"
                        >
                          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#def4c6]/60 text-[#1b512d]">
                            <CategoryIcon
                              className="size-5 text-primary"
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          </span>
                          <span className="break-words text-sm font-semibold leading-5 text-foreground sm:text-base sm:leading-6">
                            {category.name}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {areas.length > 0 ? (
              <div className="mt-5 flex flex-col gap-5 rounded-xl bg-[#e5f1e8] p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="size-5 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold">Wilayah aktif</h3>
                </div>
                <ul className="flex flex-wrap gap-2.5 md:ml-auto">
                  {areas.map((area) => (
                    <li key={area.id}>
                      <Link
                        href={{
                          pathname: "/jobs",
                          query: { location: area.id },
                        }}
                        className="inline-flex min-h-11 items-center rounded-lg border border-transparent bg-white/80 px-4 text-sm font-semibold text-foreground outline-none transition-[border-color,background-color,color] duration-150 hover:border-primary hover:bg-white hover:text-primary focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/25"
                      >
                        {area.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="bg-[#e8f0e9]">
        <div className="mx-auto w-full max-w-[80rem] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">
              Masuk sesuai kebutuhanmu
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Pelajari alur yang relevan sebelum membuka pekerjaan atau mulai
              melamar.
            </p>
          </div>

          <div className="mt-8 grid overflow-hidden rounded-xl bg-white lg:grid-cols-2">
            <article className="flex flex-col items-start p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#def4c6] text-[#1b512d]">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                  Untuk pekerja
                </h3>
              </div>
              <p className="mt-3.5 max-w-lg text-base leading-7 text-muted-foreground">
                Bandingkan pekerjaan, pahami Kesempatan Pertama, lalu bangun
                Bukti Kerja dari pekerjaan yang selesai.
              </p>
              <Button className="mt-7 h-auto py-[15px] px-4" asChild>
                <Link href="/for-workers">
                  Pelajari jalur pekerja
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </article>

            <article className="flex flex-col items-start bg-[#1b512d] p-6 text-white sm:p-8 lg:p-10">
              <div className="flex items-center gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#73e2a7] text-[#1b512d]">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                  Untuk pemberi kerja
                </h3>
              </div>
              <p className="mt-3.5 max-w-lg text-base leading-7 text-white/72">
                Susun ketentuan yang jelas, terima satu pekerja, dan selesaikan
                alurnya dalam satu ruang kerja.
              </p>
              <Button
                className="mt-7 h-auto py-[15px] px-4 bg-[#def4c6] text-[#1b512d] hover:bg-[#cfe9b4]"
                asChild
              >
                <Link href="/for-employers">
                  Pelajari jalur pemberi kerja
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </article>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="scroll-mt-24 bg-[#f6f8f6]">
        <div className="mx-auto w-full max-w-[80rem] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">
              Dari ketentuan menjadi Bukti Kerja
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Tiga mekanisme menghubungkan pencarian pekerjaan dengan riwayat
              yang dapat dipercaya.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.94fr)_minmax(0,0.94fr)]">
            {rintaraMechanisms.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={
                    index === 0
                      ? "flex flex-col justify-between rounded-xl bg-white p-6 shadow-[0_22px_55px_-46px_rgb(27_81_45/0.7)] sm:p-8"
                      : index === 1
                        ? "flex flex-col justify-between rounded-xl bg-[#dcecdf] p-6 sm:p-7"
                        : "flex flex-col justify-between rounded-xl bg-[#def4c6] p-6 sm:p-7"
                  }
                >
                  <div>
                    <div className="flex items-center gap-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#def4c6] text-[#1b512d]">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <h3
                        className={
                          index === 0
                            ? "text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl"
                            : "text-lg font-semibold tracking-[-0.02em] text-foreground"
                        }
                      >
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-3.5 max-w-lg text-base leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <Button variant="outline" className="mt-7 h-auto py-[15px] px-4 bg-white" asChild>
            <Link href="/how-it-works">
              Lihat cara kerja
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicShell>
  );
}
