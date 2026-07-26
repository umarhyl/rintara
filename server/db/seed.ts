import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  applications,
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
  admin: "00000000-0000-4000-8000-000000000001",
  employerA: "00000000-0000-4000-8000-000000000002",
  employerB: "00000000-0000-4000-8000-000000000003",
  workerNew: "00000000-0000-4000-8000-000000000004",
  workerSecond: "00000000-0000-4000-8000-000000000005",
  workerSuspended: "00000000-0000-4000-8000-000000000006",
  province: "10000000-0000-4000-8000-000000000001",
  city: "10000000-0000-4000-8000-000000000002",
  shopHelper: "20000000-0000-4000-8000-000000000001",
  packingHelper: "20000000-0000-4000-8000-000000000002",
  eventHelper: "20000000-0000-4000-8000-000000000003",
  lightCleaning: "20000000-0000-4000-8000-000000000004",
  simpleAdministration: "20000000-0000-4000-8000-000000000005",
  eventGuideline: "30000000-0000-4000-8000-000000000001",
  cleaningGuideline: "30000000-0000-4000-8000-000000000002",
  demoFirstOpportunityJob: "40000000-0000-4000-8000-000000000001",
  demoGeneralJob: "40000000-0000-4000-8000-000000000002",
  demoApplicationA: "50000000-0000-4000-8000-000000000001",
  demoApplicationB: "50000000-0000-4000-8000-000000000002",
} as const;

const seedTime = new Date("2026-07-20T02:00:00.000Z");
const applicationDeadline = new Date("2026-07-28T10:00:00.000Z");
const jobStart = new Date("2026-07-30T02:00:00.000Z");

async function seed() {
  assertSeedAllowed();

  const client = postgres(getSeedDatabaseUrl(), {
    max: 1,
    prepare: false,
    ssl: getDatabaseSslMode(),
  });
  const database = drizzle(client);

  try {
    await database.transaction(async (tx) => {
      await tx
        .insert(users)
        .values([
          {
            id: ids.admin,
            authSubject: "seed-admin",
            role: "admin",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.employerA,
            authSubject: "seed-employer-a",
            role: "employer",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.employerB,
            authSubject: "seed-employer-b",
            role: "employer",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.workerNew,
            authSubject: "seed-worker-new",
            role: "worker",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.workerSecond,
            authSubject: "seed-worker-second",
            role: "worker",
            status: "active",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.workerSuspended,
            authSubject: "seed-worker-suspended",
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
            id: ids.province,
            code: "SEED-PROVINCE",
            name: "Provinsi Demo",
            level: "province",
            isActive: true,
          },
          {
            id: ids.city,
            parentId: ids.province,
            code: "SEED-CITY",
            name: "Kota Demo",
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
            name: "Shop Helper",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.packingHelper,
            slug: "packing-helper",
            name: "Light Packing and Warehouse Helper",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.eventHelper,
            slug: "event-helper",
            name: "Event Helper",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.lightCleaning,
            slug: "light-cleaning",
            name: "Light Cleaning",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.simpleAdministration,
            slug: "simple-administration",
            name: "Simple Administration and Data Entry",
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
            areaId: ids.city,
            description: "Synthetic employer for the Rintara demo.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            userId: ids.employerB,
            displayName: "Toko Contoh Bersama",
            employerType: "business",
            areaId: ids.city,
            description: "Synthetic secondary employer for authorization tests.",
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
            areaId: ids.city,
            bio: "Synthetic worker with no verified Work Proof.",
            availabilityNote: "Available for the demo schedule.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            userId: ids.workerSecond,
            displayName: "Bima Saputra",
            areaId: ids.city,
            bio: "Synthetic worker for concurrent application tests.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            userId: ids.workerSuspended,
            displayName: "Pengguna Ditangguhkan",
            areaId: ids.city,
            bio: "Synthetic suspended account for authorization tests.",
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
            id: ids.eventGuideline,
            areaId: ids.city,
            categoryId: ids.eventHelper,
            unit: "job",
            minimumAmount: BigInt(150_000),
            recommendedAmount: BigInt(200_000),
            sourceLabel: "Rintara simulation data",
            isSimulated: true,
            effectiveFrom: "2026-07-01",
            isActive: true,
            createdBy: ids.admin,
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            id: ids.cleaningGuideline,
            areaId: ids.city,
            categoryId: ids.lightCleaning,
            unit: "day",
            minimumAmount: BigInt(125_000),
            recommendedAmount: BigInt(175_000),
            sourceLabel: "Rintara simulation data",
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
            areaId: ids.city,
            title: "Event Helper Demo",
            description: "Help prepare a small synthetic community event.",
            taskScope: "Arrange lightweight chairs, registration materials, and signs.",
            publicLocationLabel: "Kota Demo",
            startsAt: jobStart,
            estimatedMinutes: 240,
            wageAmount: BigInt(200_000),
            wageUnit: "job",
            wageStatus: "compliant",
            paymentMethod: "Cash outside Rintara",
            paymentTiming: "After the work is completed",
            toolsProvided: "Event materials and lightweight equipment",
            riskLevel: "low",
            isFirstOpportunity: true,
            applicationDeadline,
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
            areaId: ids.city,
            title: "Light Cleaning Demo",
            description: "Light cleaning for a synthetic meeting room.",
            taskScope: "Sweep, wipe tables, and organize lightweight chairs.",
            publicLocationLabel: "Kota Demo",
            startsAt: jobStart,
            estimatedMinutes: 180,
            wageAmount: BigInt(125_000),
            wageUnit: "day",
            wageStatus: "compliant",
            paymentMethod: "Cash outside Rintara",
            paymentTiming: "After the work is completed",
            toolsProvided: "Basic cleaning tools",
            riskLevel: "low",
            isFirstOpportunity: false,
            applicationDeadline,
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
            fullAddress: "Alamat sintetis khusus pengujian Event Helper",
            arrivalInstructions: "Instruksi sintetis; tidak mewakili lokasi nyata.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
          {
            jobId: ids.demoGeneralJob,
            fullAddress: "Alamat sintetis khusus pengujian Light Cleaning",
            arrivalInstructions: "Instruksi sintetis; tidak mewakili lokasi nyata.",
            createdAt: seedTime,
            updatedAt: seedTime,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(applications)
        .values([
          {
            id: ids.demoApplicationA,
            jobId: ids.demoFirstOpportunityJob,
            workerId: ids.workerNew,
            note: "Synthetic application note from Ayu.",
            firstOpportunityEligibleAtSubmission: true,
            status: "submitted",
            submittedAt: new Date("2026-07-20T03:00:00.000Z"),
          },
          {
            id: ids.demoApplicationB,
            jobId: ids.demoFirstOpportunityJob,
            workerId: ids.workerSecond,
            note: "Synthetic application note from Bima.",
            firstOpportunityEligibleAtSubmission: true,
            status: "submitted",
            submittedAt: new Date("2026-07-20T03:05:00.000Z"),
          },
        ])
        .onConflictDoNothing();
    });
  } finally {
    await client.end({ timeout: 5 });
  }
}

await seed();
