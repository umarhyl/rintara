import type { RintaraRole } from "./types";

export function hasCompleteRoleProfile(account: {
  role: RintaraRole;
  workerProfileId: string | null;
  employerProfileId: string | null;
}): boolean {
  return (
    account.role === "admin" ||
    (account.role === "worker" && account.workerProfileId !== null) ||
    (account.role === "employer" && account.employerProfileId !== null)
  );
}

