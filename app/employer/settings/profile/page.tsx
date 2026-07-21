import { Metadata } from "next";
import { getOnboardingAreaOptions } from "@/server/queries/onboarding-reference-data";
import { EmployerProfileForm } from "@/features/employer/components/employer-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Profil Pemberi Kerja | Rintara",
  description: "Kelola profil bisnis dan lihat status verifikasi Anda.",
};

export default async function EmployerProfileSettingsPage() {
  const { getEmployerProfile } = await import("@/server/queries/profiles/get-employer-profile");
  const profile = await getEmployerProfile();
  const areas = await getOnboardingAreaOptions();

  return (
    <div className="grid gap-8 max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil Bisnis</h1>
        <p className="text-muted-foreground mt-2">
          Kelola informasi bisnis yang akan ditampilkan kepada pekerja.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>
                Informasi ini akan muncul pada setiap lowongan yang Anda publikasikan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployerProfileForm areas={areas} profile={profile} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Verifikasi</CardTitle>
              <CardDescription>
                Pencapaian dari riwayat lowongan Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium">Lowongan Selesai</p>
                  <p className="text-2xl font-bold">{profile.completedJobsCount}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                  <Award className="h-5 w-5 text-amber-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium">Pemberi Peluang</p>
                  <div className="mt-1">
                    {profile.isOpportunityGiver ? (
                      <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                        Terverifikasi
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Belum Terverifikasi
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {!profile.isOpportunityGiver ? (
                <p className="text-xs text-muted-foreground mt-2">
                  Dapatkan lencana Pemberi Peluang dengan menyelesaikan lowongan Peluang Pertama secara patuh.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
