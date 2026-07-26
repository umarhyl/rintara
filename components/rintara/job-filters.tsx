"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Filter, LoaderCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  formatRupiahInput,
  normalizeRupiahDigits,
} from "@/lib/format-rupiah";

export type JobFilterValues = {
  search: string;
  categoryId: string;
  areaId: string;
  minimumWage: string;
  maximumWage: string;
  opportunity: "all" | "first" | "general";
};

function isPositiveWageValue(value: string) {
  return /^[1-9]\d*$/.test(value);
}

type FilterFieldsProps = JobFilterValues & {
  prefix: string;
  categories: { id: string; name: string }[];
  areas: { id: string; name: string }[];
  wageRangeError: string | null;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onMinimumWageChange: (value: string) => void;
  onMaximumWageChange: (value: string) => void;
  onOpportunityChange: (value: JobFilterValues["opportunity"]) => void;
};

function FilterFields({
  prefix,
  categories,
  areas,
  search,
  categoryId,
  areaId,
  minimumWage,
  maximumWage,
  opportunity,
  wageRangeError,
  onSearchChange,
  onCategoryChange,
  onAreaChange,
  onMinimumWageChange,
  onMaximumWageChange,
  onOpportunityChange,
}: FilterFieldsProps) {
  const categorySelectId = `${prefix}-category`;
  const areaSelectId = `${prefix}-area`;
  const opportunityId = `${prefix}-opportunity`;
  const minimumWageDisplay = formatRupiahInput(minimumWage);
  const maximumWageDisplay = formatRupiahInput(maximumWage);

  return (
    <>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={`${prefix}-search`}>Cari judul atau tugas</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={`${prefix}-search`}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            maxLength={120}
            className="h-11 rounded-lg pl-10"
            placeholder="Contoh: kru acara"
          />
        </div>
      </div>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={categorySelectId}>Kategori</Label>
        <Select value={categoryId} onValueChange={onCategoryChange}>
          <SelectTrigger
            id={categorySelectId}
            className="h-11 w-full min-w-0 max-w-full rounded-lg"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={areaSelectId}>Area umum</Label>
        <Select value={areaId} onValueChange={onAreaChange}>
          <SelectTrigger
            id={areaSelectId}
            className="h-11 w-full min-w-0 max-w-full rounded-lg"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua area</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={`${prefix}-min-wage`}>Upah min.</Label>
            <Input
              id={`${prefix}-min-wage`}
              value={minimumWageDisplay}
              onChange={(event) => onMinimumWageChange(event.target.value)}
              inputMode="numeric"
              maxLength={18}
              title={minimumWageDisplay || undefined}
              aria-invalid={wageRangeError ? true : undefined}
              aria-describedby={
                wageRangeError ? `${prefix}-wage-error` : undefined
              }
              className="h-11 rounded-lg px-2.5 tabular-nums"
              placeholder="Rp 0"
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor={`${prefix}-max-wage`}>Upah maks.</Label>
            <Input
              id={`${prefix}-max-wage`}
              value={maximumWageDisplay}
              onChange={(event) => onMaximumWageChange(event.target.value)}
              inputMode="numeric"
              maxLength={18}
              title={maximumWageDisplay || undefined}
              aria-invalid={wageRangeError ? true : undefined}
              aria-describedby={
                wageRangeError ? `${prefix}-wage-error` : undefined
              }
              className="h-11 rounded-lg px-2.5 tabular-nums"
              placeholder="Rp 500.000"
            />
          </div>
        </div>
        {wageRangeError ? (
          <p
            id={`${prefix}-wage-error`}
            className="mt-2 text-sm leading-5 text-destructive"
            role="alert"
          >
            {wageRangeError}
          </p>
        ) : null}
      </div>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={opportunityId}>Jenis kesempatan</Label>
        <Select value={opportunity} onValueChange={onOpportunityChange}>
          <SelectTrigger
            id={opportunityId}
            className="h-11 w-full min-w-0 max-w-full rounded-lg"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua pekerjaan</SelectItem>
            <SelectItem value="first">Kesempatan Pertama</SelectItem>
            <SelectItem value="general">Pekerjaan umum</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function JobFilters({
  initialValues,
  categories,
  areas,
}: {
  initialValues: JobFilterValues;
  categories: { id: string; name: string }[];
  areas: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialValues.search);
  const [categoryId, setCategoryId] = useState(initialValues.categoryId);
  const [areaId, setAreaId] = useState(initialValues.areaId);
  const [minimumWage, setMinimumWage] = useState(initialValues.minimumWage);
  const [maximumWage, setMaximumWage] = useState(initialValues.maximumWage);
  const [opportunity, setOpportunity] = useState(initialValues.opportunity);
  const hasInvalidWageRange =
    isPositiveWageValue(minimumWage) &&
    isPositiveWageValue(maximumWage) &&
    Number(minimumWage) > Number(maximumWage);
  const wageRangeError = hasInvalidWageRange
    ? "Upah maksimum harus sama dengan atau lebih besar dari upah minimum."
    : null;

  function navigate(nextValues: JobFilterValues) {
    const query = new URLSearchParams();
    const minimumWageQuery = isPositiveWageValue(nextValues.minimumWage)
      ? nextValues.minimumWage
      : null;
    const maximumWageQuery = isPositiveWageValue(nextValues.maximumWage)
      ? nextValues.maximumWage
      : null;

    if (nextValues.search.trim()) query.set("q", nextValues.search.trim());
    if (nextValues.categoryId !== "all") {
      query.set("category", nextValues.categoryId);
    }
    if (nextValues.areaId !== "all") {
      query.set("location", nextValues.areaId);
    }
    if (minimumWageQuery) {
      query.set("minWage", minimumWageQuery);
    }
    if (maximumWageQuery) {
      query.set("maxWage", maximumWageQuery);
    }
    if (nextValues.opportunity !== "all") {
      query.set("opportunity", nextValues.opportunity);
    }

    const target = query.size > 0 ? `/jobs?${query.toString()}` : "/jobs";
    startTransition(() => router.push(target, { scroll: false }));
  }

  function applyFilters() {
    if (hasInvalidWageRange) return;

    navigate({
      search,
      categoryId,
      areaId,
      minimumWage,
      maximumWage,
      opportunity,
    });
  }

  function resetFilters() {
    setSearch("");
    setCategoryId("all");
    setAreaId("all");
    setMinimumWage("");
    setMaximumWage("");
    setOpportunity("all");
    navigate({
      search: "",
      categoryId: "all",
      areaId: "all",
      minimumWage: "",
      maximumWage: "",
      opportunity: "all",
    });
  }

  const filterFieldProps = {
    categories,
    areas,
    search,
    categoryId,
    areaId,
    minimumWage,
    maximumWage,
    opportunity,
    wageRangeError,
    onSearchChange: setSearch,
    onCategoryChange: setCategoryId,
    onAreaChange: setAreaId,
    onMinimumWageChange: (value: string) =>
      setMinimumWage(normalizeRupiahDigits(value)),
    onMaximumWageChange: (value: string) =>
      setMaximumWage(normalizeRupiahDigits(value)),
    onOpportunityChange: setOpportunity,
  };
  const activeFilterCount =
    Number(search.trim().length > 0) +
    Number(categoryId !== "all") +
    Number(areaId !== "all") +
    Number(isPositiveWageValue(minimumWage)) +
    Number(isPositiveWageValue(maximumWage)) +
    Number(opportunity !== "all");

  type FilterKey =
    | "search"
    | "categoryId"
    | "areaId"
    | "minimumWage"
    | "maximumWage"
    | "opportunity";

  const activeFilters: Array<{ key: FilterKey; label: string }> = [
    ...(search.trim()
      ? [{ key: "search" as const, label: `Cari: ${search.trim()}` }]
      : []),
    ...(categoryId !== "all"
      ? [
          {
            key: "categoryId" as const,
            label:
              categories.find((category) => category.id === categoryId)?.name ??
              "Kategori",
          },
        ]
      : []),
    ...(areaId !== "all"
      ? [
          {
            key: "areaId" as const,
            label:
              areas.find((area) => area.id === areaId)?.name ?? "Area",
          },
        ]
      : []),
    ...(isPositiveWageValue(minimumWage)
      ? [
          {
            key: "minimumWage" as const,
            label: `Min. ${formatRupiahInput(minimumWage)}`,
          },
        ]
      : []),
    ...(isPositiveWageValue(maximumWage)
      ? [
          {
            key: "maximumWage" as const,
            label: `Maks. ${formatRupiahInput(maximumWage)}`,
          },
        ]
      : []),
    ...(opportunity !== "all"
      ? [
          {
            key: "opportunity" as const,
            label:
              opportunity === "first"
                ? "Kesempatan Pertama"
                : "Pekerjaan umum",
          },
        ]
      : []),
  ];

  function clearFilter(key: FilterKey) {
    const nextValues: JobFilterValues = {
      search,
      categoryId,
      areaId,
      minimumWage,
      maximumWage,
      opportunity,
    };

    if (key === "search") {
      nextValues.search = "";
      setSearch("");
    }
    if (key === "categoryId") {
      nextValues.categoryId = "all";
      setCategoryId("all");
    }
    if (key === "areaId") {
      nextValues.areaId = "all";
      setAreaId("all");
    }
    if (key === "minimumWage") {
      nextValues.minimumWage = "";
      setMinimumWage("");
    }
    if (key === "maximumWage") {
      nextValues.maximumWage = "";
      setMaximumWage("");
    }
    if (key === "opportunity") {
      nextValues.opportunity = "all";
      setOpportunity("all");
    }
    navigate(nextValues);
  }

  return (
    <section
      aria-label="Filter pekerjaan"
      className="min-w-0 lg:sticky lg:top-24 lg:self-start"
    >
      <form
        className="hidden min-w-0 grid-cols-[minmax(0,1fr)] rounded-xl bg-[#eef4ef] p-5 lg:grid lg:gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Filter hasil</h2>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-11 rounded-lg px-2 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-secondary hover:text-secondary-foreground"
            >
              Atur ulang
            </button>
          ) : null}
        </div>
        <FilterFields prefix="desktop-job" {...filterFieldProps} />
        <Button
          type="submit"
          className="h-11 w-full px-5"
          disabled={isPending || hasInvalidWageRange}
        >
          {isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Filter aria-hidden="true" />
          )}
          {isPending ? "Memuat hasil" : "Terapkan filter"}
        </Button>
      </form>

      <form
        className="flex gap-2 rounded-xl bg-[#eef4ef] p-2 lg:hidden"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Cari pekerjaan"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={120}
            className="h-11 bg-card pl-10"
            placeholder="Cari judul atau tugas"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 px-3"
              aria-invalid={wageRangeError ? true : undefined}
              aria-describedby={
                wageRangeError ? "mobile-job-wage-summary" : undefined
              }
            >
              <Filter aria-hidden="true" />
              Filter
              <span className="min-w-4 text-center text-xs tabular-nums">
                {activeFilterCount}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(92vw,24rem)]">
            <SheetHeader className="border-b text-left">
              <SheetTitle>Filter pekerjaan</SheetTitle>
              <SheetDescription>
                Pilih kategori, area, upah, dan jenis kesempatan.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 overflow-y-auto px-4">
              <FilterFields prefix="mobile-job" {...filterFieldProps} />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={resetFilters}
                >
                  Atur ulang
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  type="button"
                  className="min-h-11"
                  onClick={applyFilters}
                  disabled={isPending || hasInvalidWageRange}
                >
                  Tampilkan hasil
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </form>
      {wageRangeError ? (
        <p
          id="mobile-job-wage-summary"
          className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive lg:hidden"
          role="alert"
        >
          {wageRangeError} Buka Filter untuk memperbaiki rentang upah.
        </p>
      ) : null}

      {activeFilters.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filter aktif">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => clearFilter(filter.key)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-secondary/70 px-3 text-xs font-semibold text-secondary-foreground transition-colors duration-200 hover:bg-secondary"
              aria-label={`Hapus filter ${filter.label}`}
            >
              {filter.label}
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
