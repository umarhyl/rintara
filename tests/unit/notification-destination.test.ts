import { describe, expect, test } from "bun:test";
import { getNotificationDestination } from "@/server/queries/notification-destination";

const entityId = "19e7f257-a616-4f78-9bee-082506b8bd48";

describe("notification destinations", () => {
  test("routes application updates to the role-safe workspace", () => {
    expect(
      getNotificationDestination("employer", {
        type: "application_submitted",
        entityType: "job",
        entityId,
      }),
    ).toBe(`/employer/jobs/${entityId}/applicants`);
    expect(
      getNotificationDestination("employer", {
        type: "application_withdrawn",
        entityType: "job",
        entityId,
      }),
    ).toBe(`/employer/jobs/${entityId}/applicants`);
    expect(
      getNotificationDestination("worker", {
        type: "application_rejected",
        entityType: "application",
        entityId,
      }),
    ).toBe("/worker/applications");
  });

  test("keeps agreement and job destinations scoped to the active role", () => {
    expect(
      getNotificationDestination("worker", {
        type: "agreement_activated",
        entityType: "agreement",
        entityId,
      }),
    ).toBe(`/worker/agreements/${entityId}`);
    expect(
      getNotificationDestination("employer", {
        type: "credit_redeemed",
        entityType: "job",
        entityId,
      }),
    ).toBe(`/employer/jobs/${entityId}`);
  });

  test("does not invent a destination without a supported reference", () => {
    expect(
      getNotificationDestination("worker", {
        type: "system",
        entityType: null,
        entityId: null,
      }),
    ).toBeNull();
    expect(
      getNotificationDestination("admin", {
        type: "application_submitted",
        entityType: "job",
        entityId,
      }),
    ).toBeNull();
  });
});
