import "server-only";

import { count, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireActiveUser } from "@/server/auth/identity";
import { assertActiveUser, assertRole } from "@/server/auth/policies";
import type { RequestContext } from "@/server/auth/types";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  auditLogs,
  employerProfiles,
  jobs,
  reports,
  users,
  workerProfiles,
} from "@/server/db/schema";

type AdminDatabase = PostgresJsDatabase<typeof schema>;

async function requireAdminContext(context?: RequestContext) {
  return assertRole(
    assertActiveUser(context ?? (await requireActiveUser())),
    "admin",
  );
}

export async function adminListReports(
  context?: RequestContext,
  database: AdminDatabase = db,
) {
  await requireAdminContext(context);
  return database
    .select({
      id: reports.id,
      reason: reports.reason,
      status: reports.status,
      description: reports.description,
      jobId: reports.jobId,
      agreementId: reports.agreementId,
      reportedUserId: reports.reportedUserId,
      createdAt: reports.createdAt,
      moderatorNote: reports.moderatorNote,
      targetTitle: jobs.title,
    })
    .from(reports)
    .leftJoin(jobs, eq(reports.jobId, jobs.id))
    .orderBy(desc(reports.createdAt), desc(reports.id))
    .limit(50);
}

export async function adminListJobs(
  context?: RequestContext,
  database: AdminDatabase = db,
) {
  await requireAdminContext(context);
  return database
    .select({
      id: jobs.id,
      title: jobs.title,
      status: jobs.status,
      visibility: jobs.visibility,
      employerDisplayName: employerProfiles.displayName,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .innerJoin(employerProfiles, eq(jobs.employerId, employerProfiles.userId))
    .orderBy(desc(jobs.createdAt), desc(jobs.id))
    .limit(50);
}

export async function adminListUsers(
  context?: RequestContext,
  database: AdminDatabase = db,
) {
  await requireAdminContext(context);
  return database
    .select({
      id: users.id,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      workerDisplayName: workerProfiles.displayName,
      employerDisplayName: employerProfiles.displayName,
    })
    .from(users)
    .leftJoin(workerProfiles, eq(users.id, workerProfiles.userId))
    .leftJoin(employerProfiles, eq(users.id, employerProfiles.userId))
    .orderBy(desc(users.createdAt), desc(users.id))
    .limit(50);
}

export async function adminListAuditLogs(
  context?: RequestContext,
  database: AdminDatabase = db,
) {
  await requireAdminContext(context);
  return database
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorId: auditLogs.actorId,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(50);
}

export async function adminDashboardSummary(
  context?: RequestContext,
  database: AdminDatabase = db,
) {
  const adminContext = await requireAdminContext(context);
  const reportCount = await database.select({ value: count() }).from(reports);
  const jobCount = await database.select({ value: count() }).from(jobs);
  const userCount = await database.select({ value: count() }).from(users);
  const auditCount = await database.select({ value: count() }).from(auditLogs);
  const latestReports = await adminListReports(adminContext, database);

  return {
    reportCount: reportCount[0]?.value ?? 0,
    jobCount: jobCount[0]?.value ?? 0,
    userCount: userCount[0]?.value ?? 0,
    auditCount: auditCount[0]?.value ?? 0,
    activeReportCount: latestReports.filter(
      (report) => report.status === "open" || report.status === "reviewing",
    ).length,
    latestReports: latestReports.slice(0, 5),
  };
}
