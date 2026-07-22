import { areas, categories, employerProfiles, jobs } from "../db/schema";

/**
 * Explicit allowlist for public job reads.
 *
 * Keep this projection independent from `jobPrivateDetails`. Public query
 * modules must never join the private address table.
 */
export const publicJobCardProjection = {
  id: jobs.id,
  title: jobs.title,
  categoryId: jobs.categoryId,
  categoryName: categories.name,
  areaId: jobs.areaId,
  areaName: areas.name,
  publicLocationLabel: jobs.publicLocationLabel,
  wageAmount: jobs.wageAmount,
  wageUnit: jobs.wageUnit,
  startsAt: jobs.startsAt,
  estimatedMinutes: jobs.estimatedMinutes,
  applicationDeadline: jobs.applicationDeadline,
  isFirstOpportunity: jobs.isFirstOpportunity,
  publishedAt: jobs.publishedAt,
  employerId: jobs.employerId,
  employerDisplayName: employerProfiles.displayName,
} as const;
