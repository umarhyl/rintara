import { randomUUID } from "node:crypto";
import { expect, test, mock } from "bun:test";

mock.module("server-only", () => {
  return {};
});
mock.module("next/cache", () => {
  return {
    revalidatePath: () => {},
  };
});

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getIntegrationDatabaseUrl } from "@/server/db/environment";
import * as schema from "@/server/db/schema";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

databaseTest(
  "enforces employer job management workflow and constraints",
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
      const areaId = randomUUID();
      const categoryLowRiskId = randomUUID();
      const categoryHighRiskId = randomUUID();
      const employer1Id = randomUUID();
      const employer2Id = randomUUID();
      const worker1Id = randomUUID();
      const worker2Id = randomUUID();

      await database.transaction(async (tx) => {
        await tx.insert(schema.areas).values({
          id: areaId,
          level: "city_regency",
          code: `job-${fixtureId}`,
          name: "Kota Pengujian Job",
        });
        await tx.insert(schema.categories).values([
          {
            id: categoryLowRiskId,
            slug: `low-${fixtureId}`,
            name: "Low Risk Category",
            riskLevel: "low",
            firstOpportunityAllowed: true,
          },
          {
            id: categoryHighRiskId,
            slug: `high-${fixtureId}`,
            name: "High Risk Category",
            riskLevel: "restricted",
            firstOpportunityAllowed: false,
          }
        ]);
        await tx.insert(schema.users).values([
          { id: employer1Id, authSubject: `emp1-${fixtureId}`, role: "employer" },
          { id: employer2Id, authSubject: `emp2-${fixtureId}`, role: "employer" },
          { id: worker1Id, authSubject: `worker1-${fixtureId}`, role: "worker" },
          { id: worker2Id, authSubject: `worker2-${fixtureId}`, role: "worker" },
        ]);
        await tx.insert(schema.employerProfiles).values([
          { userId: employer1Id, displayName: "Employer 1", employerType: "individual", areaId },
          { userId: employer2Id, displayName: "Employer 2", employerType: "individual", areaId },
        ]);
        await tx.insert(schema.workerProfiles).values([
          { userId: worker1Id, displayName: "Worker 1", areaId },
          { userId: worker2Id, displayName: "Worker 2", areaId },
        ]);
        
        // Insert some wage guidelines to test against
        // We will test 50k as minimum for low risk
        await tx.insert(schema.wageGuidelines).values({
          areaId,
          categoryId: categoryLowRiskId,
          unit: "job",
          minimumAmount: BigInt(50000),
          recommendedAmount: BigInt(70000),
          sourceLabel: "Test",
          effectiveFrom: "2020-01-01",
          createdBy: employer1Id, // Doesn't matter for this test
        });
      });

      const employer1Context = { userId: employer1Id, role: "employer" as const, displayName: "E1", accountStatus: "active" as const, requestId: "test-req" };
      const employer2Context = { userId: employer2Id, role: "employer" as const, displayName: "E2", accountStatus: "active" as const, requestId: "test-req" };

      let activeContext = employer1Context;

      mock.module("@/server/auth/identity", () => {
        return {
          requireActiveUser: async () => activeContext,
        };
      });

      mock.module("@/server/db/client", () => {
        return { db: database };
      });

      const { createJobDraft, updateJobDraft, publishJob, cancelJob } = await import("@/server/domain/jobs/actions");

      // 1. Test Job Draft Creation
      const validDraftData = {
        title: "Test Draft Job With Long Enough Title",
        categoryId: categoryLowRiskId,
        areaId,
        description: "This is a detailed description of the draft test that meets the length requirements.",
        taskScope: "This is a detailed scope that meets length rules.",
        publicLocationLabel: "City Testing Area",
        fullAddress: "Street 1 Building A Unit 10",
        estimatedMinutes: 60,
        wageAmount: 100000,
        wageUnit: "job" as const,
        paymentMethod: "Cash",
        paymentTiming: "Done",
        riskLevel: "low" as const,
        applicationDeadline: new Date(Date.now() + 86400000 * 2).toISOString(),
        startsAt: new Date(Date.now() + 86400000 * 3), // 3 days from now
        isFirstOpportunity: false,
      };

      const newDraft = await createJobDraft(validDraftData);
      expect(newDraft).toHaveProperty("jobId");

      // Verify the job was created with correct status
      const [fetchedJob] = await database.select().from(schema.jobs).where(eq(schema.jobs.id, newDraft.jobId));
      expect(fetchedJob.status).toBe("draft");
      expect(fetchedJob.employerId).toBe(employer1Id);

      // Verify private details exist
      const [privateDetails] = await database.select().from(schema.jobPrivateDetails).where(eq(schema.jobPrivateDetails.jobId, newDraft.jobId));
      expect(privateDetails.fullAddress).toBe(validDraftData.fullAddress);

      // 2. Test updating job draft
      const updateResult = await updateJobDraft(newDraft.jobId, {
        ...validDraftData,
        title: "Updated Title",
      });
      expect(updateResult.ok).toBe(true);
      const [updatedJob] = await database.select().from(schema.jobs).where(eq(schema.jobs.id, newDraft.jobId));
      expect(updatedJob.title).toBe("Updated Title");

      // Updating an unowned job should fail
      activeContext = employer2Context;
      await expect(updateJobDraft(newDraft.jobId, validDraftData)).rejects.toMatchObject({
        code: "JOB_NOT_FOUND"
      });
      activeContext = employer1Context;

      // 3. Test Publishing Job (Happy Path)
      const publishedJob = await publishJob(newDraft.jobId);
      expect(publishedJob.ok).toBe(true);
      
      const [postPublishJob] = await database.select().from(schema.jobs).where(eq(schema.jobs.id, newDraft.jobId));
      expect(postPublishJob.status).toBe("published");
      expect(postPublishJob.publishedAt).not.toBeNull();

      // Updating a published job draft should fail
      await expect(updateJobDraft(newDraft.jobId, validDraftData)).rejects.toMatchObject({
        code: "JOB_NOT_DRAFT"
      });

      // 4. Test Publishing Constraints
      const draft2 = await createJobDraft({
        ...validDraftData,
        wageAmount: 30000, // Below guideline of 50000
        isFirstOpportunity: true, // Needs to be compliant
      });

      // Should fail because it's first opportunity but underpaid
      await expect(publishJob(draft2.jobId)).rejects.toMatchObject({
        code: "WAGE_BELOW_GUIDELINE"
      });

      // Fix wage, but use restricted category
      await updateJobDraft(draft2.jobId, {
        ...validDraftData,
        categoryId: categoryHighRiskId,
        riskLevel: "restricted",
        wageAmount: 60000,
        isFirstOpportunity: true, // Restricted categories cannot be First Opportunity
      });

      // Should fail because of restricted category
      await expect(publishJob(draft2.jobId)).rejects.toMatchObject({
        code: "CATEGORY_NOT_ALLOWED"
      });

      // 5. Test Cancellation
      const draft3 = await createJobDraft(validDraftData);
      const cancelledDraft = await cancelJob(draft3.jobId, {
        reason: "Employer cancelled this draft before publication.",
      });
      expect(cancelledDraft.ok).toBe(true);

      await database.insert(schema.applications).values([
        {
          jobId: newDraft.jobId,
          workerId: worker1Id,
          note: "I am available for this published job.",
          firstOpportunityEligibleAtSubmission: true,
        },
        {
          jobId: newDraft.jobId,
          workerId: worker2Id,
          note: "I can also help with this published job.",
          firstOpportunityEligibleAtSubmission: true,
        },
      ]);

      const cancelledPublished = await cancelJob(newDraft.jobId, {
        reason: "Employer schedule changed and the work can no longer happen.",
      });
      expect(cancelledPublished.ok).toBe(true);

      const [cancelledJob] = await database
        .select()
        .from(schema.jobs)
        .where(eq(schema.jobs.id, newDraft.jobId));
      expect(cancelledJob.status).toBe("cancelled");
      expect(cancelledJob.cancelledAt).not.toBeNull();
      expect(cancelledJob.cancellationReason).toBe(
        "Employer schedule changed and the work can no longer happen.",
      );

      const rejectedApplications = await database
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.jobId, newDraft.jobId));
      expect(rejectedApplications).toHaveLength(2);
      expect(rejectedApplications.every((application) => application.status === "rejected")).toBe(true);

      const cancellationNotifications = await database
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.entityId, newDraft.jobId));
      expect(cancellationNotifications).toHaveLength(2);
      expect(JSON.stringify(cancellationNotifications)).not.toContain(
        validDraftData.fullAddress,
      );

      const auditRows = await database
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.entityId, newDraft.jobId));
      expect(auditRows).toHaveLength(1);
      expect(auditRows[0]!.action).toBe("cancel_job");
      expect(auditRows[0]!.metadata).toMatchObject({
        previousStatus: "published",
        rejectedApplicationCount: 2,
      });
      
    } finally {
      await client.end({ timeout: 5 });
    }
  },
  30_000,
);
