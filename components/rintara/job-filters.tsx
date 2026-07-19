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
  category: "all" | "event" | "cleaning" | "admin";
  opportunity: "all" | "first" | "general";
};

type FilterFieldsProps = JobFilterValues & {
  prefix: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: JobFilterValues["category"]) => void;
  onOpportunityChange: (value: JobFilterValues["opportunity"]) => void;
};

function FilterFields({
  prefix,
  search,
  category,
  opportunity,
  onSearchChange,
  onCategoryChange,
  onOpportunityChange,
}: FilterFieldsProps) {
  const categoryId = `${prefix}-category`;
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
        <Label htmlFor={categoryId}>Kategori</Label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger id={categoryId} className="h-12 w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            <SelectItem value="event">Event Helper</SelectItem>
            <SelectItem value="cleaning">Light Cleaning</SelectItem>
            <SelectItem value="admin">Administrasi sederhana</SelectItem>
          </SelectContent>
        </Select>
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
}: {
  initialValues: JobFilterValues;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialValues.search);
  const [category, setCategory] = useState(initialValues.category);
  const [opportunity, setOpportunity] = useState(initialValues.opportunity);

  function navigate(nextValues: JobFilterValues) {
    const query = new URLSearchParams();

    if (nextValues.search.trim()) query.set("q", nextValues.search.trim());
    if (nextValues.category !== "all") {
      query.set("category", nextValues.category);
    }
    if (nextValues.opportunity !== "all") {
      query.set("opportunity", nextValues.opportunity);
    }

    const target = query.size > 0 ? `/jobs?${query.toString()}` : "/jobs";
    startTransition(() => router.push(target, { scroll: false }));
  }

  function applyFilters() {
    navigate({ search, category, opportunity });
  }

  function resetFilters() {
    setSearch("");
    setCategory("all");
    setOpportunity("all");
    navigate({ search: "", category: "all", opportunity: "all" });
  }

  const filterFieldProps = {
    search,
    category,
    opportunity,
    onSearchChange: setSearch,
    onCategoryChange: setCategory,
    onOpportunityChange: setOpportunity,
  };
  const activeFilterCount =
    Number(search.trim().length > 0) +
    Number(category !== "all") +
    Number(opportunity !== "all");

  return (
    <section aria-label="Filter pekerjaan">
      <form
        className="hidden rounded-[1.6rem] border border-border/75 bg-card/92 p-5 shadow-[0_26px_65px_-38px_rgb(15_23_42/0.55)] backdrop-blur-2xl lg:grid lg:grid-cols-[minmax(16rem,1fr)_13rem_13rem_auto] lg:items-end lg:gap-4"
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
