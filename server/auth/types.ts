export type RintaraRole = "worker" | "employer" | "admin";
export type AccountStatus = "active" | "suspended" | "deleted";

export type RequestContext = {
  requestId: string;
  userId: string;
  role: RintaraRole;
  accountStatus: AccountStatus;
};

export type RintaraUserRecord = {
  id: string;
  role: RintaraRole;
  status: AccountStatus;
};
