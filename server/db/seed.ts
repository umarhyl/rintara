import { and, eq, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  areas,
  categories,
  employerProfiles,
  jobPrivateDetails,
  jobs,
  users,
  wageGuidelines,
  workerInterests,
  workerProfiles,
} from "./schema";
import {
  assertSeedAllowed,
  getDatabaseSslMode,
  getSeedDatabaseUrl,
} from "./environment";

const ids = {
  admin: "7fb8d486-df08-48e7-94cd-589f30b4c070",
  employerA: "0cf6f79f-4808-4557-a8bf-5bafbf56f4ad",
  employerB: "5ddc431d-3fdf-4185-ad45-5f30bf9ec760",
  workerNew: "0f9f1f1a-33c6-49b3-b4be-e00f2726d0d0",
  workerSecond: "dcc68f58-7ad7-40f2-8a89-4239fa6d247a",
  workerSuspended: "46b691dc-a0f9-4f71-9376-9c710cc9c09f",
  jakartaProvince: "ddf8ce08-80e2-4570-a0a7-1ab117db6281",
  southJakartaCity: "eeb72d1b-c74e-49d8-8257-2f90f967f41d",
  shopHelper: "e4eaf555-13cb-4bd5-8b43-97a4b9e479a6",
  packingHelper: "ef37354d-aacf-4a84-90be-f5ddd7801c7d",
  eventHelper: "780eaeb9-3de5-4a7f-8cbf-a3f37014bb14",
  lightCleaning: "7c89345a-18a4-4084-8feb-5d0558843003",
  simpleAdministration: "794ea11d-bab0-4f20-b457-55ce80b7736c",
  shopGuideline: "06e07143-1016-4925-8e99-f77a59dc0786",
  packingGuideline: "3ffbf485-08e8-4dd5-9002-87ba9d6ad28b",
  eventGuideline: "c47dbb9c-01c7-4a71-95e1-354e04f7e712",
  cleaningGuideline: "d58d9a30-a6b6-40b7-97e5-d96465c23a7e",
  administrationGuideline: "0f1ff4c2-6e2f-4dd5-8c88-37f91bed819e",
  demoFirstOpportunityJob: "f43fd7c5-9b15-41db-8d02-5267c12a58a6",
  demoGeneralJob: "4eb0ba68-2875-4bfe-80dc-44bd836742bb",
} as const;

const authSubjects = {
  admin: "rintara-local-seed-admin",
  employerA: "rintara-local-seed-employer-a",
  employerB: "rintara-local-seed-employer-b",
  workerNew: "rintara-local-seed-worker-new",
  workerSecond: "rintara-local-seed-worker-second",
  workerSuspended: "rintara-local-seed-worker-suspended",
} as const;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const seedTime = new Date();
const firstOpportunityDeadline = addDays(seedTime, 14);
const firstOpportunityStart = addDays(seedTime, 21);
const boostTargetDeadline = addDays(seedTime, 21);
const boostTargetStart = addDays(seedTime, 28);

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

async function resetDomainData(
  database: Pick<ReturnType<typeof drizzle>, "execute">,
) {
  await database.execute(sql`
    truncate table
      public.job_boosts,
      public.opportunity_credits,
      public.work_proofs,
      public.work_completion_evidence,
      public.work_sessions,
      public.reports,
      public.notifications,
      public.idempotency_keys,
      public.audit_logs,
      public.agreements,
      public.applications,
      public.job_private_details,
      public.jobs,
      public.worker_interests,
      public.wage_guidelines,
      public.employer_profiles,
      public.worker_profiles,
      public.users,
      public.categories,
      public.areas
    restart identity cascade
  `);
}

export async function seedDatabase() {
  const seedDatabaseUrl = getSeedDatabaseUrl();
  assertSeedAllowed(seedDatabaseUrl);

  const client = postgres(seedDatabaseUrl, {
    max: 1,
    prepare: false,
    ssl: getDatabaseSslMode(),
  });
  const database = drizzle(client);

  try {
    await database.transaction(async (tx) => {
      await resetDomainData(tx);

      await tx
        .insert(users)
        .values([
          {
            id: ids.admin,
            authSubject: authSubjects.admin,
            role: "admin",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.employerA,
            authSubject: authSubjects.employerA,
            role: "employer",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.employerB,
            authSubject: authSubjects.employerB,
            role: "employer",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.workerNew,
            authSubject: authSubjects.workerNew,
            role: "worker",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.workerSecond,
            authSubject: authSubjects.workerSecond,
            role: "worker",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.workerSuspended,
            authSubject: authSubjects.workerSuspended,
            role: "worker",
            status: "suspended",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(areas)
        .values([
          {
            id: ids.jakartaProvince,
            code: "ID-JK",
            name: "DKI Jakarta",
            level: "province",
            isActive: true,
          },
          {
            id: ids.southJakartaCity,
            parentId: ids.jakartaProvince,
            code: "ID-JK-JS",
            name: "Kota Jakarta Selatan",
            level: "city_regency",
            isActive: true,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(categories)
        .values([
          {
            id: ids.shopHelper,
            slug: "shop-helper",
            name: "Asisten Toko",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.packingHelper,
            slug: "packing-helper",
            name: "Helper Packing Ringan",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.eventHelper,
            slug: "event-helper",
            name: "Helper Acara",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.lightCleaning,
            slug: "light-cleaning",
            name: "Bersih-Bersih Ringan",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.simpleAdministration,
            slug: "simple-administration",
            name: "Administrasi Sederhana",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(employerProfiles)
        .values([
          {
            userId: ids.employerA,
            displayName: "Sinar Event Studio",
            employerType: "business",
            areaId: ids.southJakartaCity,
            description: "Studio acara kecil yang rutin membuka bantuan harian untuk persiapan kelas dan lokakarya.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            userId: ids.employerB,
            displayName: "Warung Nusa Kebayoran",
            employerType: "business",
            areaId: ids.southJakartaCity,
            description: "Toko kebutuhan harian yang menerima bantuan ringan untuk penataan rak dan pengemasan.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(workerProfiles)
        .values([
          {
            userId: ids.workerNew,
            displayName: "Ayu Pratama",
            areaId: ids.southJakartaCity,
            bio: "Baru mulai mencari pengalaman kerja harian di sekitar Jakarta Selatan.",
            availabilityNote: "Bisa hadir pagi atau siang sesuai jadwal pekerjaan.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            userId: ids.workerSecond,
            displayName: "Bima Saputra",
            areaId: ids.southJakartaCity,
            bio: "Tertarik membantu pekerjaan operasional ringan dan acara komunitas.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            userId: ids.workerSuspended,
            displayName: "Raka Mahendra",
            areaId: ids.southJakartaCity,
            bio: "Akun contoh dengan status ditangguhkan untuk pengecekan akses admin.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(workerInterests)
        .values([
          { workerId: ids.workerNew, categoryId: ids.eventHelper },
          { workerId: ids.workerSecond, categoryId: ids.eventHelper },
          { workerId: ids.workerSuspended, categoryId: ids.lightCleaning },
        ])
        .onConflictDoNothing();

      await tx
        .insert(wageGuidelines)
        .values([
          {
            id: ids.shopGuideline,
            areaId: ids.southJakartaCity,
            categoryId: ids.shopHelper,
            unit: "day",
            minimumAmount: BigInt(135_000),
            recommendedAmount: BigInt(175_000),
            sourceLabel: "Simulasi Rintara - Jakarta Selatan 2026",
            isSimulated: true,
            effectiveFrom: "2026-07-01",
            isActive: true,
            createdBy: ids.admin,
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.packingGuideline,
            areaId: ids.southJakartaCity,
            categoryId: ids.packingHelper,
            unit: "day",
            minimumAmount: BigInt(140_000),
            recommendedAmount: BigInt(185_000),
            sourceLabel: "Simulasi Rintara - Jakarta Selatan 2026",
            isSimulated: true,
            effectiveFrom: "2026-07-01",
            isActive: true,
            createdBy: ids.admin,
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.eventGuideline,
            areaId: ids.southJakartaCity,
            categoryId: ids.eventHelper,
            unit: "job",
            minimumAmount: BigInt(150_000),
            recommendedAmount: BigInt(200_000),
            sourceLabel: "Simulasi Rintara - Jakarta Selatan 2026",
            isSimulated: true,
            effectiveFrom: "2026-07-01",
            isActive: true,
            createdBy: ids.admin,
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.cleaningGuideline,
            areaId: ids.southJakartaCity,
            categoryId: ids.lightCleaning,
            unit: "day",
            minimumAmount: BigInt(125_000),
            recommendedAmount: BigInt(175_000),
            sourceLabel: "Simulasi Rintara - Jakarta Selatan 2026",
            isSimulated: true,
            effectiveFrom: "2026-07-01",
            isActive: true,
            createdBy: ids.admin,
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.administrationGuideline,
            areaId: ids.southJakartaCity,
            categoryId: ids.simpleAdministration,
            unit: "hour",
            minimumAmount: BigInt(25_000),
            recommendedAmount: BigInt(35_000),
            sourceLabel: "Simulasi Rintara - Jakarta Selatan 2026",
            isSimulated: true,
            effectiveFrom: "2026-07-01",
            isActive: true,
            createdBy: ids.admin,
            createdAt: seedTime,
            updatedAt: seedTime,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(jobs)
        .values([
          {
            id: ids.demoFirstOpportunityJob,
            employerId: ids.employerA,
            categoryId: ids.eventHelper,
            areaId: ids.southJakartaCity,
            title: "Helper Registrasi Workshop Kreatif",
            description: "Bantu tim menyiapkan meja registrasi, merapikan kursi, dan menyambut peserta workshop kreatif skala kecil.",
            taskScope: "Menata kursi ringan, menyiapkan daftar hadir, membagikan name tag, dan merapikan area setelah acara.",
            publicLocationLabel: "Kebayoran Baru, Jakarta Selatan",
            startsAt: firstOpportunityStart,
            estimatedMinutes: 240,
            wageAmount: BigInt(200_000),
            wageUnit: "job",
            wageStatus: "compliant",
            paymentMethod: "Tunai di lokasi",
            paymentTiming: "Setelah pekerjaan selesai dan diverifikasi",
            toolsProvided: "Daftar hadir, name tag, pulpen, dan perlengkapan acara ringan",
            riskLevel: "low",
            isFirstOpportunity: true,
            applicationDeadline: firstOpportunityDeadline,
            status: "published",
            visibility: "visible",
            publishedAt: seedTime,
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.demoGeneralJob,
            employerId: ids.employerA,
            categoryId: ids.lightCleaning,
            areaId: ids.southJakartaCity,
            title: "Rapikan Studio Setelah Kelas Sore",
            description: "Bantu merapikan studio kecil setelah kelas sore selesai agar ruangan siap dipakai keesokan pagi.",
            taskScope: "Menyapu area utama, mengelap meja, mengumpulkan sampah ringan, dan menata kursi kembali.",
            publicLocationLabel: "Pancoran, Jakarta Selatan",
            startsAt: boostTargetStart,
            estimatedMinutes: 180,
            wageAmount: BigInt(125_000),
            wageUnit: "day",
            wageStatus: "compliant",
            paymentMethod: "Transfer bank",
            paymentTiming: "Maksimal malam di hari kerja selesai",
            toolsProvided: "Sapu, lap meja, kantong sampah, dan cairan pembersih ringan",
            riskLevel: "low",
            isFirstOpportunity: false,
            applicationDeadline: boostTargetDeadline,
            status: "published",
            visibility: "visible",
            publishedAt: seedTime,
            createdAt: seedTime,
            updatedAt: seedTime,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(jobPrivateDetails)
        .values([
          {
            jobId: ids.demoFirstOpportunityJob,
            fullAddress: "Jl. Kenanga Raya No. 18, Kebayoran Baru, Jakarta Selatan",
            arrivalInstructions: "Masuk lewat lobi utama dan sebut bertemu koordinator acara Rintara.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            jobId: ids.demoGeneralJob,
            fullAddress: "Jl. Melati Dalam No. 7, Pancoran, Jakarta Selatan",
            arrivalInstructions: "Datang ke pintu samping studio dan hubungi staf resepsionis.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
        ])
        .onConflictDoNothing();

      const [verification] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(
          and(
            eq(jobs.status, "published"),
            eq(jobs.visibility, "visible"),
            gt(jobs.applicationDeadline, seedTime),
          ),
        );

      if (!verification || verification.count < 1) {
        throw new Error(
          "Seed verification failed: no discoverable published job was created.",
        );
      }
    });

    console.info(
      "Seed reset complete: 6 users, 1 province, 1 city, 5 categories, 5 wage guidelines, 2 published jobs, 0 applications.",
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

if (import.meta.main) {
  await seedDatabase();
}
