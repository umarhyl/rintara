"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Filter, LoaderCircle, Search } from "lucide-react";
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

export type JobFilterValues = {
  search: string;
  categoryId: string;
  areaId: string;
  minimumWage: string;
  maximumWage: string;
  opportunity: "all" | "first" | "general";
};

type FilterFieldsProps = JobFilterValues & {
  prefix: string;
  categories: { id: string; name: string }[];
  areas: { id: string; name: string }[];
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

  return (
    <>
      <div className="space-y-2">
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
            className="h-12 rounded-xl pl-10"
            placeholder="Misalnya event helper"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={categorySelectId}>Kategori</Label>
        <Select value={categoryId} onValueChange={onCategoryChange}>
          <SelectTrigger id={categorySelectId} className="h-12 w-full rounded-xl">
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
      <div className="space-y-2">
        <Label htmlFor={areaSelectId}>Lokasi</Label>
        <Select value={areaId} onValueChange={onAreaChange}>
          <SelectTrigger id={areaSelectId} className="h-12 w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua lokasi</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-min-wage`}>Upah min.</Label>
          <Input
            id={`${prefix}-min-wage`}
            value={minimumWage}
            onChange={(event) => onMinimumWageChange(event.target.value)}
            inputMode="numeric"
            className="h-12 rounded-xl"
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-max-wage`}>Upah maks.</Label>
          <Input
            id={`${prefix}-max-wage`}
            value={maximumWage}
            onChange={(event) => onMaximumWageChange(event.target.value)}
            inputMode="numeric"
            className="h-12 rounded-xl"
            placeholder="500000"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={opportunityId}>Jenis kesempatan</Label>
        <Select value={opportunity} onValueChange={onOpportunityChange}>
          <SelectTrigger id={opportunityId} className="h-12 w-full rounded-xl">
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

  function navigate(nextValues: JobFilterValues) {
    const query = new URLSearchParams();

    if (nextValues.search.trim()) query.set("q", nextValues.search.trim());
    if (nextValues.categoryId !== "all") {
      query.set("category", nextValues.categoryId);
    }
    if (nextValues.areaId !== "all") {
      query.set("location", nextValues.areaId);
    }
    if (nextValues.minimumWage.trim()) {
      query.set("minWage", nextValues.minimumWage.trim());
    }
    if (nextValues.maximumWage.trim()) {
      query.set("maxWage", nextValues.maximumWage.trim());
    }
    if (nextValues.opportunity !== "all") {
      query.set("opportunity", nextValues.opportunity);
    }

    const target = query.size > 0 ? `/jobs?${query.toString()}` : "/jobs";
    startTransition(() => router.push(target, { scroll: false }));
  }

  function applyFilters() {
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
    onSearchChange: setSearch,
    onCategoryChange: setCategoryId,
    onAreaChange: setAreaId,
    onMinimumWageChange: setMinimumWage,
    onMaximumWageChange: setMaximumWage,
    onOpportunityChange: setOpportunity,
  };
  const activeFilterCount =
    Number(search.trim().length > 0) +
    Number(categoryId !== "all") +
    Number(areaId !== "all") +
    Number(minimumWage.trim().length > 0) +
    Number(maximumWage.trim().length > 0) +
    Number(opportunity !== "all");

  return (
    <section aria-label="Filter pekerjaan">
      <form
        className="hidden rounded-[1.6rem] border border-border/75 bg-card/92 p-5 shadow-[0_26px_65px_-38px_rgb(15_23_42/0.55)] backdrop-blur-2xl lg:grid lg:grid-cols-[minmax(16rem,1fr)_13rem_13rem_16rem_13rem_auto] lg:items-end lg:gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <FilterFields prefix="desktop-job" {...filterFieldProps} />
        <Button
          type="submit"
          className="h-12 rounded-full px-5"
          disabled={isPending}
        >
          {isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Filter aria-hidden="true" />
          )}
          {isPending ? "Memuat" : "Terapkan"}
        </Button>
      </form>

      <form
        className="flex gap-2 rounded-[1.35rem] border border-border/75 bg-card/92 p-2 shadow-[0_20px_50px_-34px_rgb(15_23_42/0.55)] backdrop-blur-2xl lg:hidden"
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
            className="h-12 rounded-xl border-transparent bg-muted/55 pl-10 shadow-none"
            placeholder="Cari pekerjaan"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-12 shrink-0 rounded-xl px-3"
            >
              <Filter aria-hidden="true" />
              Filter
              <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                {activeFilterCount}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(92vw,24rem)]">
            <SheetHeader className="border-b text-left">
              <SheetTitle>Filter pekerjaan</SheetTitle>
              <SheetDescription>
                Persempit hasil berdasarkan kategori dan jenis kesempatan.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-5 overflow-y-auto px-4">
              <FilterFields prefix="mobile-job" {...filterFieldProps} />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={resetFilters}
                >
                  Atur ulang
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={applyFilters}
                  disabled={isPending}
                >
                  Tampilkan hasil
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </form>
    </section>
  );
}
