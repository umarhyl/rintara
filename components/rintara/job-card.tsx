import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
  featured = false,
}: {
  job: JobCardView;
  featured?: boolean;
}) {
  return (
    <Card className={`card-lift group relative flex h-full flex-col overflow-hidden rounded-[1.65rem] bg-card/78 shadow-none backdrop-blur-sm ${featured ? "lg:col-span-2" : ""}`}>
      {job.firstOpportunity ? <span className="absolute inset-y-7 left-0 w-0.5 rounded-r-full bg-opportunity" aria-hidden="true" /> : null}
      <span className="pointer-events-none absolute -right-20 -top-24 size-52 rounded-full bg-primary/[0.055] transition-transform duration-700 ease-out group-hover:scale-110" aria-hidden="true" />
      <CardHeader className="relative gap-5 p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {job.firstOpportunity ? <StatusBadge tone="warning">Kesempatan Pertama</StatusBadge> : null}
          {job.boosted ? <StatusBadge tone="info">Prioritas 24 jam</StatusBadge> : null}
          <span className="ml-auto text-xs font-medium text-muted-foreground">{job.category}</span>
        </div>
        <div className={featured ? "grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end" : undefined}>
          <div>
            <h2 className={`${featured ? "text-2xl sm:text-3xl" : "text-xl"} font-semibold leading-tight tracking-[-0.035em] transition-colors duration-300 group-hover:text-primary`}>{job.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{job.employer}</p>
          </div>
          <div className={featured ? "sm:text-right" : ""}>
            <p className="mt-5 text-xs font-medium text-muted-foreground sm:mt-0">UPAH TETAP</p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.025em] text-foreground">{job.wage}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className={`relative flex-1 gap-3 px-6 text-sm text-muted-foreground sm:px-7 ${featured ? "grid sm:grid-cols-3" : "space-y-3"}`}>
        <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{job.publicLocation}</p>
        <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{job.date}</p>
        <p className="flex items-start gap-2"><BriefcaseBusiness className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{job.duration}</p>
      </CardContent>
      <CardFooter className="relative border-t-0 bg-transparent px-4 pb-3 pt-2 sm:px-5">
        <Button variant="ghost" className="h-11 w-full justify-between rounded-full px-3 [&_svg]:group-hover/button:translate-x-1" asChild>
          <Link href={`/jobs/${job.id}`}>Lihat pekerjaan <ArrowRight aria-hidden="true" /></Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
