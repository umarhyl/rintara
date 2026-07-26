export const JOB_SELECTION_LEAD_TIME_MS = 24 * 60 * 60 * 1000;

export function getJobSelectionCutoff(startsAt: Date) {
  return new Date(startsAt.getTime() - JOB_SELECTION_LEAD_TIME_MS);
}
