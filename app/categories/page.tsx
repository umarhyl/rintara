import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  MapPin,
  Search,
} from "lucide-react";
import { PublicShell } from "@/components/rintara/public-shell";
import { Button } from "@/components/ui/button";
import { getPublicJobReferenceData } from "@/server/queries/jobs/public-jobs";

export const metadata: Metadata = {
  title: "Kategori pekerjaan",
  description:
    "Jelajahi kategori pekerjaan dan wilayah aktif di Rintara, lalu buka daftar pekerjaan dengan filter yang sesuai.",
};

export default async function CategoriesPage() {
  const { categories, areas } = await getPublicJobReferenceData();
  const hasReferenceData = categories.length > 0 || areas.length > 0;

  return (
    <PublicShell>
      <template
        data-rintara-direction
        dangerouslySetInnerHTML={{
          __html:
            "<!-- THESIS: kategori adalah pintu masuk pencarian kerja yang nyata, bukan katalog popularitas atau statistik buatan. OWN-WORLD: Forest membingkai tindakan utama, sementara daftar putih dan bidang hijau lembut memisahkan kategori dari wilayah tanpa tumpukan kartu. STORY: pengunjung memilih jenis kerja atau area aktif, lalu masuk ke daftar pekerjaan dengan filter yang sudah terpasang. FIRST VIEWPORT: judul dan penjelasan berada di kiri, tindakan menuju semua pekerjaan berada di kanan, lalu direktori dimulai tepat di bawahnya. FORM: direktori marketplace asimetris dalam dunia visual Rintara yang sudah mapan; seed a29a8bd0. -->",
        }}
      />

      <header className="bg-[#edf3ee]">
        <div className="mx-auto grid w-full max-w-[80rem] gap-7 px-4 py-11 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:px-8 lg:py-14">
          <div className="max-w-3xl">
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Mulai dari pekerjaan yang kamu kenal
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Pilih kategori atau wilayah yang tersedia. Rintara akan membuka
              daftar pekerjaan dengan filter tersebut agar ketentuannya dapat
              langsung dibandingkan.
            </p>
          </div>
          <Button variant="outline" className="w-fit bg-white" asChild>
            <Link href="/jobs">
              Semua pekerjaan
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[80rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {hasReferenceData ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-start">
            <section aria-labelledby="category-heading">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#def4c6] text-[#1b512d]">
                  <BriefcaseBusiness className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="category-heading"
                    className="text-2xl font-semibold tracking-[-0.02em]"
                  >
                    Kategori pekerjaan
                  </h2>
                  <p className="mt-1 text-base leading-6 text-muted-foreground">
                    Kategori aktif yang dapat dipakai untuk menyaring pekerjaan.
                  </p>
                </div>
              </div>

              {categories.length > 0 ? (
                <ul className="mt-7 grid gap-x-3 gap-y-1 rounded-xl bg-white p-2 shadow-[0_22px_55px_-48px_rgb(27_81_45/0.7)] sm:grid-cols-2 sm:p-3">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={{
                          pathname: "/jobs",
                          query: { category: category.id },
                        }}
                        className="group flex min-h-14 items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-base font-semibold text-foreground outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/25"
                      >
                        <span>{category.name}</span>
                        <ArrowRight
                          className="size-4 shrink-0 text-primary transition-transform duration-150 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-7 rounded-xl bg-white p-6">
                  <h3 className="font-semibold">
                    Kategori aktif belum tersedia
                  </h3>
                  <p className="mt-2 text-base leading-7 text-muted-foreground">
                    Kamu masih dapat membuka seluruh pekerjaan yang sedang
                    diterbitkan tanpa memilih kategori.
                  </p>
                  <Link
                    href="/jobs"
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/25"
                  >
                    Buka daftar pekerjaan
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </section>

            <section
              aria-labelledby="area-heading"
              className="rounded-xl bg-[#e5f1e8] p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/75 text-primary">
                  <MapPin className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="area-heading"
                    className="text-xl font-semibold tracking-[-0.015em]"
                  >
                    Wilayah aktif
                  </h2>
                  <p className="mt-1 text-base leading-6 text-muted-foreground">
                    Area umum yang tersedia untuk pencarian.
                  </p>
                </div>
              </div>

              {areas.length > 0 ? (
                <ul className="mt-6 grid gap-2">
                  {areas.map((area) => (
                    <li key={area.id}>
                      <Link
                        href={{
                          pathname: "/jobs",
                          query: { location: area.id },
                        }}
                        className="group flex min-h-12 items-center justify-between gap-4 rounded-lg bg-white/75 px-4 py-2.5 text-base font-semibold text-foreground outline-none transition-colors duration-150 hover:bg-white hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/25"
                      >
                        <span>{area.name}</span>
                        <ArrowRight
                          className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 rounded-lg bg-white/75 p-4">
                  <h3 className="font-semibold">
                    Wilayah aktif belum tersedia
                  </h3>
                  <p className="mt-2 text-base leading-6 text-muted-foreground">
                    Gunakan daftar utama untuk melihat pekerjaan tanpa filter
                    wilayah.
                  </p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <section
            aria-labelledby="empty-reference-heading"
            className="mx-auto max-w-3xl rounded-xl bg-white px-5 py-12 text-center sm:px-10"
          >
            <Search
              className="mx-auto size-7 text-primary"
              aria-hidden="true"
            />
            <h2
              id="empty-reference-heading"
              className="mt-6 text-3xl font-semibold tracking-[-0.025em]"
            >
              Kategori dan wilayah belum tersedia
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              Data referensi aktif belum dapat ditampilkan saat ini. Kamu tetap
              dapat membuka daftar pekerjaan tanpa filter.
            </p>
            <Button className="mt-7" asChild>
              <Link href="/jobs">
                Buka daftar pekerjaan
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </section>
        )}
      </div>
    </PublicShell>
  );
}
