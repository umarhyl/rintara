import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";
import { StatusBadge } from "@/components/rintara/status-badge";

export type JobCardView = {
  id: string;
  title: string;
  category: string;
  employer: string;
  publicLocation: string;
  wage: string;
  date: string;
  duration: string;
  firstOpportunity: boolean;
  boosted: boolean;
};

export function JobCard({
  job,
}: {
  job: JobCardView;
}) {
  return (
    <article className="group relative grid min-h-full gap-x-6 gap-y-4 overflow-hidden rounded-xl bg-card p-5 shadow-[0_16px_42px_-38px_rgb(27_81_45/0.75)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-34px_rgb(27_81_45/0.65)] focus-within:ring-3 focus-within:ring-ring/20 md:grid-cols-[minmax(0,1fr)_13.5rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {job.category}
          </span>
          {job.firstOpportunity ? (
            <StatusBadge tone="warning">Kesempatan Pertama</StatusBadge>
          ) : null}
          {job.boosted ? (
            <StatusBadge tone="info">Diprioritaskan 24 jam</StatusBadge>
          ) : null}
        </div>

        <h2 className="mt-2 text-lg font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-xl">
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex min-h-11 items-center rounded-sm transition-colors duration-150 after:absolute after:inset-0 hover:text-primary focus-visible:outline-none"
          >
            {job.title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">{job.employer}</p>
      </div>

      <p className="tabular self-start text-lg font-bold leading-snug tracking-[-0.02em] text-foreground md:text-right md:text-xl">
        <span className="sr-only">Upah: </span>
        {job.wage}
      </p>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm leading-6 text-muted-foreground md:col-span-2">
        <span className="inline-flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {job.publicLocation}
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarDays
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          {job.date}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock3
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          {job.duration}
        </span>
      </div>
    </article>
  );
}
