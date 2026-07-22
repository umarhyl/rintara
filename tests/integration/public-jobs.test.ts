import { randomUUID } from "node:crypto";
import { expect, mock, test } from "bun:test";

mock.module("server-only", () => {
  return {};
});

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";
import {
  getPublishedJob,
  getPublicJobReferenceData,
  listPublishedJobs,
} from "@/server/queries/jobs/public-jobs";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "lists, filters, paginates, and redacts public jobs",
  async () => {
    expect(process.env.RINTARA_ENV).toBe("test");

    const client = postgres(getIntegrationDatabaseUrl(), {
      max: 1,
      prepare: false,
      ssl: process.env.TEST_DATABASE_SSL === "disable" ? false : "require",
    });
    const database = drizzle(client, { schema });

    try {
      await migrate(database, { migrationsFolder: "./drizzle" });

      const fixtureId = randomUUID();
      const areaAId = randomUUID();
      const areaBId = randomUUID();
      const categoryAId = randomUUID();
      const categoryBId = randomUUID();
      const employerId = randomUUID();
      const hiddenById = randomUUID();
      const visibleGeneralJobId = randomUUID();
      const visibleFirstJobId = randomUUID();
      const hiddenJobId = randomUUID();
      const draftJobId = randomUUID();
      const deadlinePassedJobId = randomUUID();

      const futureStart = new Date("2030-01-10T08:00:00.000Z");
      const futureDeadline = new Date("2030-01-09T08:00:00.000Z");
      const pastDeadline = new Date("2020-01-09T08:00:00.000Z");
      const olderPublishedAt = new Date("2030-01-01T08:00:00.000Z");
      const newerPublishedAt = new Date("2030-01-02T08:00:00.000Z");

      await database.transaction(async (tx) => {
        await tx.insert(schema.areas).values([
          {
            id: areaAId,
            level: "city_regency",
            code: `public-a-${fixtureId}`,
            name: "Kota Publik A",
          },
          {
            id: areaBId,
            level: "city_regency",
            code: `public-b-${fixtureId}`,
            name: "Kota Publik B",
          },
        ]);
        await tx.insert(schema.categories).values([
          {
            id: categoryAId,
            slug: `public-a-${fixtureId}`,
            name: "Kategori Publik A",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: categoryBId,
            slug: `public-b-${fixtureId}`,
            name: "Kategori Publik B",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
        ]);
        await tx.insert(schema.users).values([
          {
            id: employerId,
            authSubject: `public-employer-${fixtureId}`,
            role: "employer",
          },
          {
            id: hiddenById,
            authSubject: `public-admin-${fixtureId}`,
            role: "admin",
          },
        ]);
        await tx.insert(schema.employerProfiles).values({
          userId: employerId,
          displayName: "Employer Publik",
          employerType: "business",
          areaId: areaAId,
        });

        const baseJob = {
          employerId,
          startsAt: futureStart,
          estimatedMinutes: 120,
          wageUnit: "job" as const,
          wageStatus: "compliant" as const,
          paymentMethod: "Transfer di luar Rintara",
          paymentTiming: "Setelah pekerjaan selesai",
          riskLevel: "low" as const,
          applicationDeadline: futureDeadline,
          status: "published" as const,
          visibility: "visible" as const,
          publishedAt: olderPublishedAt,
        };

        await tx.insert(schema.jobs).values([
          {
            ...baseJob,
            id: visibleGeneralJobId,
            categoryId: categoryAId,
            areaId: areaAId,
            title: "Bantu Inventaris Publik",
            description: "Membantu input data inventaris tanpa akses private.",
            taskScope: "Input data barang\nPeriksa jumlah barang",
            publicLocationLabel: "Area Umum A",
            wageAmount: BigInt(150_000),
            isFirstOpportunity: false,
            publishedAt: newerPublishedAt,
          },
          {
            ...baseJob,
            id: visibleFirstJobId,
            categoryId: categoryBId,
            areaId: areaBId,
            title: "Kru Acara Publik",
            description: "Membantu acara komunitas dengan arahan jelas.",
            taskScope: "Merapikan meja registrasi",
            publicLocationLabel: "Area Umum B",
            wageAmount: BigInt(250_000),
            isFirstOpportunity: true,
          },
          {
            ...baseJob,
            id: hiddenJobId,
            categoryId: categoryAId,
            areaId: areaAId,
            title: "Pekerjaan Hidden",
            description: "Tidak boleh muncul.",
            taskScope: "Tidak boleh muncul",
            publicLocationLabel: "Area Umum A",
            wageAmount: BigInt(160_000),
            isFirstOpportunity: false,
            visibility: "hidden",
            hiddenAt: new Date("2030-01-02T09:00:00.000Z"),
            hiddenBy: hiddenById,
            hiddenReason: "moderation",
          },
          {
            ...baseJob,
            id: draftJobId,
            categoryId: categoryAId,
            areaId: areaAId,
            title: "Pekerjaan Draft",
            description: "Tidak boleh muncul.",
            taskScope: "Tidak boleh muncul",
            publicLocationLabel: "Area Umum A",
            wageAmount: BigInt(170_000),
            isFirstOpportunity: false,
            status: "draft",
            visibility: "hidden",
            publishedAt: null,
            hiddenAt: new Date("2030-01-02T09:00:00.000Z"),
            hiddenBy: employerId,
            hiddenReason: "draft",
          },
          {
            ...baseJob,
            id: deadlinePassedJobId,
            categoryId: categoryAId,
            areaId: areaAId,
            title: "Pekerjaan Lewat Deadline",
            description: "Tidak boleh muncul.",
            taskScope: "Tidak boleh muncul",
            publicLocationLabel: "Area Umum A",
            startsAt: new Date("2020-01-10T08:00:00.000Z"),
            applicationDeadline: pastDeadline,
            wageAmount: BigInt(180_000),
            isFirstOpportunity: false,
          },
        ]);
        await tx.insert(schema.jobPrivateDetails).values([
          {
            jobId: visibleGeneralJobId,
            fullAddress: "Jalan Rahasia Publik No. 1",
            arrivalInstructions: "Kode pintu rahasia",
          },
          {
            jobId: visibleFirstJobId,
            fullAddress: "Jalan Rahasia Publik No. 2",
            arrivalInstructions: "Instruksi rahasia",
          },
        ]);
      });

      const referenceData = await getPublicJobReferenceData(database);
      expect(referenceData.categories).toContainEqual({
        id: categoryAId,
        name: "Kategori Publik A",
      });
      expect(referenceData.areas).toContainEqual({
        id: areaAId,
        name: "Kota Publik A",
      });

      const firstPage = await listPublishedJobs({ pageSize: 1 }, database);
      expect(firstPage.items).toHaveLength(1);
      expect(firstPage.items[0]!.id).toBe(visibleGeneralJobId);
      expect(firstPage.hasNextPage).toBe(true);

      const secondPage = await listPublishedJobs({ page: 2, pageSize: 1 }, database);
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.items[0]!.id).toBe(visibleFirstJobId);
      expect(secondPage.hasPreviousPage).toBe(true);

      const categoryFiltered = await listPublishedJobs(
        { categoryId: categoryBId },
        database,
      );
      expect(categoryFiltered.items.map((job) => job.id)).toEqual([
        visibleFirstJobId,
      ]);

      const areaFiltered = await listPublishedJobs({ areaId: areaAId }, database);
      expect(areaFiltered.items.map((job) => job.id)).toEqual([
        visibleGeneralJobId,
      ]);

      const wageFiltered = await listPublishedJobs(
        { minimumWage: 200_000, maximumWage: 300_000 },
        database,
      );
      expect(wageFiltered.items.map((job) => job.id)).toEqual([
        visibleFirstJobId,
      ]);

      const opportunityFiltered = await listPublishedJobs(
        { opportunity: "first" },
        database,
      );
      expect(opportunityFiltered.items.map((job) => job.id)).toEqual([
        visibleFirstJobId,
      ]);

      const searchFiltered = await listPublishedJobs(
        { search: "inventaris" },
        database,
      );
      expect(searchFiltered.items.map((job) => job.id)).toEqual([
        visibleGeneralJobId,
      ]);

      const allVisible = await listPublishedJobs({}, database);
      expect(allVisible.items.map((job) => job.id)).not.toContain(hiddenJobId);
      expect(allVisible.items.map((job) => job.id)).not.toContain(draftJobId);
      expect(allVisible.items.map((job) => job.id)).not.toContain(
        deadlinePassedJobId,
      );

      const detail = await getPublishedJob(visibleGeneralJobId, database);
      const serializedDetail = JSON.stringify(detail);
      expect(serializedDetail).not.toContain("Jalan Rahasia Publik");
      expect(serializedDetail).not.toContain("Kode pintu rahasia");
      expect(detail).not.toHaveProperty("fullAddress");
      expect(detail).not.toHaveProperty("arrivalInstructions");

      await expect(getPublishedJob(hiddenJobId, database)).rejects.toMatchObject({
        code: "JOB_NOT_FOUND",
      });
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
