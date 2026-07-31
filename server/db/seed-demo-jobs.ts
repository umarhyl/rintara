import { and, eq, gt, inArray } from "drizzle-orm";
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
} from "./schema";
import {
  assertDemoJobSeedAllowed,
  getDatabaseSslMode,
  getSeedDatabaseUrl,
} from "./environment";

const ids = {
  area: "aa31fc58-126a-43eb-b562-122031ec6a91",
  eventCategory: "9b86f8dc-5358-4ed8-8892-eb74f677fb55",
  packingCategory: "fa419c32-e022-457c-8d78-f51d99d63bf4",
  cleaningCategory: "462d462d-983d-4623-815b-0a86018316cd",
  packingGuideline: "f1044770-048b-47ef-ab3d-7f1bef4c1c36",
  cleaningGuideline: "129576dc-8a7f-4635-9659-48b4125ecb67",
  workshopJob: "10af976d-3a3d-49a5-b658-e30515132029",
  packingJob: "88ce19ca-c263-4e46-9069-ac7397fbbe55",
  studioJob: "e90f14d6-56ce-47ed-8c96-2b4f3afe2562",
} as const;

const demoJobIds = [ids.workshopJob, ids.packingJob, ids.studioJob];
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_IN_MS);

type Database = ReturnType<typeof drizzle>;

async function resolveSingleActiveUser(
  database: Database,
  role: "admin" | "employer",
) {
  const requestedUserId =
    role === "employer"
      ? process.env.RINTARA_DEMO_EMPLOYER_USER_ID?.trim()
      : undefined;
  const requestedAuthSubject =
    role === "employer"
      ? process.env.RINTARA_DEMO_EMPLOYER_AUTH_SUBJECT?.trim()
      : undefined;

  if (requestedUserId && requestedAuthSubject) {
    throw new Error(
      "Set only one Employer selector: RINTARA_DEMO_EMPLOYER_USER_ID or RINTARA_DEMO_EMPLOYER_AUTH_SUBJECT.",
    );
  }

  const selector = requestedUserId
    ? eq(users.id, requestedUserId)
    : requestedAuthSubject
      ? eq(users.authSubject, requestedAuthSubject)
      : undefined;
  const baseConditions = and(
    eq(users.role, role),
    eq(users.status, "active"),
    selector,
  );
  const candidates =
    role === "employer"
      ? await database
          .select({
            userId: users.id,
            displayName: employerProfiles.displayName,
          })
          .from(users)
          .innerJoin(employerProfiles, eq(employerProfiles.userId, users.id))
          .where(baseConditions)
          .limit(2)
      : await database
          .select({ userId: users.id, displayName: users.authSubject })
          .from(users)
          .where(baseConditions)
          .limit(2);

  if (candidates.length !== 1) {
    const profileRequirement =
      role === "employer" ? " with a completed profile" : "";
    throw new Error(
      candidates.length === 0
        ? `Demo job seed refused: no matching active ${role}${profileRequirement} was found.`
        : `Demo job seed refused: multiple active ${role} accounts exist; select the intended account explicitly.`,
    );
  }

  return candidates[0];
}

export async function seedDemoJobs() {
  const connectionUrl = getSeedDatabaseUrl();
  assertDemoJobSeedAllowed(connectionUrl);
  const client = postgres(connectionUrl, {
    max: 1,
    prepare: false,
    ssl: getDatabaseSslMode(),
  });
  const database = drizzle(client);

  try {
    const employer = await resolveSingleActiveUser(database, "employer");
    const admin = await resolveSingleActiveUser(database, "admin");
    const now = new Date();

    const availableCount = await database.transaction(async (tx) => {
      await tx
        .insert(areas)
        .values({
          id: ids.area,
          code: "SMG-CITY",
          name: "Semarang",
          level: "city_regency",
          isActive: true,
        })
        .onConflictDoNothing();
      await tx
        .insert(categories)
        .values([
          {
            id: ids.eventCategory,
            slug: "event-helper",
            name: "Event Helper",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.packingCategory,
            slug: "packing-helper",
            name: "Helper Packing Ringan",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: ids.cleaningCategory,
            slug: "light-cleaning",
            name: "Bersih-Bersih Ringan",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
        ])
        .onConflictDoNothing();

      const [area] = await tx
        .select({ id: areas.id })
        .from(areas)
        .where(and(eq(areas.code, "SMG-CITY"), eq(areas.isActive, true)))
        .limit(1);
      const categoryRows = await tx
        .select({ id: categories.id, slug: categories.slug })
        .from(categories)
        .where(
          and(
            eq(categories.isActive, true),
            inArray(categories.slug, [
              "event-helper",
              "packing-helper",
              "light-cleaning",
            ]),
          ),
        );

      if (!area || categoryRows.length !== 3) {
        throw new Error(
          "Demo job seed refused: required active area or categories conflict with existing reference data.",
        );
      }

      const categoryBySlug = new Map(
        categoryRows.map((category) => [category.slug, category.id]),
      );
      const eventCategoryId = categoryBySlug.get("event-helper")!;
      const packingCategoryId = categoryBySlug.get("packing-helper")!;
      const cleaningCategoryId = categoryBySlug.get("light-cleaning")!;
      const existingGuidelines = await tx
        .select({
          categoryId: wageGuidelines.categoryId,
          unit: wageGuidelines.unit,
          minimumAmount: wageGuidelines.minimumAmount,
          recommendedAmount: wageGuidelines.recommendedAmount,
        })
        .from(wageGuidelines)
        .where(
          and(
            eq(wageGuidelines.areaId, area.id),
            eq(wageGuidelines.isActive, true),
            inArray(wageGuidelines.categoryId, [
              eventCategoryId,
              packingCategoryId,
              cleaningCategoryId,
            ]),
          ),
        );
      const guidelineKeys = new Set(
        existingGuidelines.map(
          (guideline) => `${guideline.categoryId}:${guideline.unit}`,
        ),
      );
      const guidelineInserts = [
        {
          id: ids.packingGuideline,
          categoryId: packingCategoryId,
          unit: "day" as const,
          minimumAmount: BigInt(130_000),
          recommendedAmount: BigInt(175_000),
        },
        {
          id: ids.cleaningGuideline,
          categoryId: cleaningCategoryId,
          unit: "day" as const,
          minimumAmount: BigInt(125_000),
          recommendedAmount: BigInt(165_000),
        },
      ].filter(
        (guideline) =>
          !guidelineKeys.has(`${guideline.categoryId}:${guideline.unit}`),
      );

      if (guidelineInserts.length > 0) {
        await tx.insert(wageGuidelines).values(
          guidelineInserts.map((guideline) => ({
            ...guideline,
            areaId: area.id,
            sourceLabel: "Simulasi Rintara - Semarang 2026",
            isSimulated: true,
            effectiveFrom: "2026-07-01",
            isActive: true,
            createdBy: admin.userId,
            createdAt: now,
            updatedAt: now,
          })),
        );
      }

      const currentGuidelines = await tx
        .select({
          categoryId: wageGuidelines.categoryId,
          unit: wageGuidelines.unit,
          minimumAmount: wageGuidelines.minimumAmount,
          recommendedAmount: wageGuidelines.recommendedAmount,
        })
        .from(wageGuidelines)
        .where(
          and(
            eq(wageGuidelines.areaId, area.id),
            eq(wageGuidelines.isActive, true),
            inArray(wageGuidelines.categoryId, [
              eventCategoryId,
              packingCategoryId,
              cleaningCategoryId,
            ]),
          ),
        );
      const guidelines = new Map(
        currentGuidelines.map((guideline) => [
          `${guideline.categoryId}:${guideline.unit}`,
          guideline,
        ]),
      );
      const eventGuideline = guidelines.get(`${eventCategoryId}:hour`);
      const packingGuideline = guidelines.get(`${packingCategoryId}:day`);
      const cleaningGuideline = guidelines.get(`${cleaningCategoryId}:day`);

      if (!eventGuideline || !packingGuideline || !cleaningGuideline) {
        throw new Error(
          "Demo job seed refused: required active Wage Guidelines are unavailable.",
        );
      }

      const common = {
        employerId: employer.userId,
        areaId: area.id,
        wageStatus: "compliant" as const,
        riskLevel: "low" as const,
        status: "published" as const,
        visibility: "visible" as const,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      const jobRows = [
        {
          ...common,
          id: ids.workshopJob,
          categoryId: eventCategoryId,
          title: "Asisten Registrasi Workshop Kreatif",
          description: "Bantu tim menyambut peserta dan menjaga meja registrasi workshop komunitas agar acara dimulai tepat waktu.",
          taskScope: "Menyiapkan daftar hadir dan name tag, mengarahkan peserta, membagikan perlengkapan, serta merapikan meja registrasi.",
          publicLocationLabel: "Semarang Tengah, Semarang",
          startsAt: addDays(now, 10),
          estimatedMinutes: 300,
          wageAmount: eventGuideline.minimumAmount,
          wageUnit: "hour" as const,
          paymentMethod: "Tunai di lokasi",
          paymentTiming: "Sesaat setelah pekerjaan selesai dan diverifikasi",
          toolsProvided: "Daftar hadir, name tag, alat tulis, dan perlengkapan registrasi",
          toolsRequired: "Pakaian rapi dan ponsel untuk koordinasi kedatangan",
          isFirstOpportunity: true,
          applicationDeadline: addDays(now, 5),
        },
        {
          ...common,
          id: ids.packingJob,
          categoryId: packingCategoryId,
          title: "Helper Packing Pesanan Toko Lokal",
          description: "Bantu menyiapkan pesanan produk rumah tangga untuk pengiriman akhir pekan dalam ruang kerja yang tertata.",
          taskScope: "Mencocokkan barang dengan daftar pesanan, membungkus produk non-pecah belah, menempel label, dan mengelompokkan paket.",
          publicLocationLabel: "Banyumanik, Semarang",
          startsAt: addDays(now, 14),
          estimatedMinutes: 420,
          wageAmount: packingGuideline.recommendedAmount,
          wageUnit: "day" as const,
          paymentMethod: "Transfer bank",
          paymentTiming: "Paling lambat malam pada hari pekerjaan selesai",
          toolsProvided: "Kardus, pelindung produk, selotip, label, dan alat tulis",
          toolsRequired: "Sepatu tertutup dan botol minum pribadi",
          isFirstOpportunity: true,
          applicationDeadline: addDays(now, 9),
        },
        {
          ...common,
          id: ids.studioJob,
          categoryId: cleaningCategoryId,
          title: "Rapikan Studio Setelah Kelas Komunitas",
          description: "Bantu mengembalikan studio kecil ke kondisi rapi setelah kelas sore agar siap digunakan kembali keesokan hari.",
          taskScope: "Menata kursi dan meja ringan, menyapu lantai, mengelap meja, mengumpulkan sampah non-berbahaya, dan mengecek area.",
          publicLocationLabel: "Candisari, Semarang",
          startsAt: addDays(now, 18),
          estimatedMinutes: 240,
          wageAmount: cleaningGuideline.recommendedAmount,
          wageUnit: "day" as const,
          paymentMethod: "Tunai di lokasi",
          paymentTiming: "Sesaat setelah pekerjaan selesai dan diverifikasi",
          toolsProvided: "Sapu, kain lap, sarung tangan, kantong sampah, dan cairan pembersih ringan",
          toolsRequired: "Pakaian nyaman dan sepatu tertutup",
          isFirstOpportunity: false,
          applicationDeadline: addDays(now, 13),
        },
      ];
      const inserted = await tx
        .insert(jobs)
        .values(jobRows)
        .onConflictDoNothing()
        .returning({ id: jobs.id });
      const insertedIds = new Set(inserted.map((job) => job.id));
      const privateRows = [
        { jobId: ids.workshopJob, fullAddress: "Ruang Komunitas Lantai 2, Jl. Pandanaran No. 24, Semarang Tengah, Semarang", arrivalInstructions: "Masuk melalui lobi utama dan tunjukkan nama pekerjaan kepada petugas meja depan." },
        { jobId: ids.packingJob, fullAddress: "Studio Operasional, Jl. Setiabudi No. 16, Banyumanik, Semarang", arrivalInstructions: "Datang melalui pintu depan dan lapor kepada koordinator packing sebelum mulai." },
        { jobId: ids.studioJob, fullAddress: "Studio Komunitas, Jl. Kagok Dalam No. 11, Candisari, Semarang", arrivalInstructions: "Gunakan pintu samping studio dan tunggu koordinator melakukan briefing singkat." },
      ].filter((detail) => insertedIds.has(detail.jobId));

      if (privateRows.length > 0) {
        await tx.insert(jobPrivateDetails).values(privateRows);
      }

      const available = await tx
        .select({ id: jobs.id })
        .from(jobs)
        .where(
          and(
            inArray(jobs.id, demoJobIds),
            eq(jobs.employerId, employer.userId),
            eq(jobs.status, "published"),
            eq(jobs.visibility, "visible"),
            gt(jobs.applicationDeadline, now),
          ),
        );
      return available.length;
    });

    if (availableCount !== demoJobIds.length) {
      throw new Error(
        "Demo job seed verification failed: the complete discoverable catalog is unavailable. Existing catalog dates may have expired.",
      );
    }

    console.info(
      `Demo bootstrap complete: ${availableCount} presentation-ready jobs belong to ${employer.displayName}.`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

if (import.meta.main) {
  await seedDemoJobs();
}
