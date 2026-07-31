import { describe, expect, test } from "bun:test";

import {
  applicationStatusSchema,
  assertApplicationTransition,
  assertJobTransition,
  assertMiniAgreementTransition,
  assertOpportunityCreditTransition,
  assertReportTransition,
  assertWorkSessionTransition,
  jobStatusSchema,
  miniAgreementStatusSchema,
  opportunityCreditStatusSchema,
  reportStatusSchema,
  workSessionStatusSchema,
} from "@/server/domain/lifecycle";
import {
  ApplicationError,
  type ApplicationErrorCode,
} from "@/server/errors/application-error";

type TransitionPolicy = (
  from: unknown,
  to: unknown,
) => { from: string; to: string };

type StatusSchema = {
  options: readonly string[];
  safeParse(value: unknown): { success: boolean };
};

type LifecycleSuite = {
  name: string;
  statuses: readonly string[];
  statusSchema: StatusSchema;
  allowed: readonly (readonly [string, string])[];
  policy: TransitionPolicy;
};

const lifecycleSuites: readonly LifecycleSuite[] = [
  {
    name: "job",
    statuses: [
      "draft",
      "published",
      "filled",
      "in_progress",
      "completed",
      "expired",
      "cancelled",
    ],
    statusSchema: jobStatusSchema,
    allowed: [
      ["draft", "published"],
      ["draft", "cancelled"],
      ["published", "filled"],
      ["published", "expired"],
      ["published", "cancelled"],
      ["filled", "in_progress"],
      ["filled", "cancelled"],
      ["in_progress", "completed"],
      ["in_progress", "cancelled"],
    ],
    policy: assertJobTransition,
  },
  {
    name: "application",
    statuses: ["submitted", "accepted", "rejected", "withdrawn"],
    statusSchema: applicationStatusSchema,
    allowed: [
      ["submitted", "accepted"],
      ["submitted", "rejected"],
      ["submitted", "withdrawn"],
      ["withdrawn", "submitted"],
    ],
    policy: assertApplicationTransition,
  },
  {
    name: "Mini Agreement",
    statuses: ["pending_confirmation", "active", "completed", "cancelled"],
    statusSchema: miniAgreementStatusSchema,
    allowed: [
      ["pending_confirmation", "active"],
      ["pending_confirmation", "cancelled"],
      ["active", "completed"],
      ["active", "cancelled"],
    ],
    policy: assertMiniAgreementTransition,
  },
  {
    name: "work session",
    statuses: ["scheduled", "checked_in", "checked_out", "verified"],
    statusSchema: workSessionStatusSchema,
    allowed: [
      ["scheduled", "checked_in"],
      ["checked_in", "checked_out"],
      ["checked_out", "verified"],
    ],
    policy: assertWorkSessionTransition,
  },
  {
    name: "Opportunity Credit",
    statuses: ["earned", "redeemed", "expired", "revoked"],
    statusSchema: opportunityCreditStatusSchema,
    allowed: [
      ["earned", "redeemed"],
      ["earned", "expired"],
      ["earned", "revoked"],
      ["redeemed", "revoked"],
    ],
    policy: assertOpportunityCreditTransition,
  },
  {
    name: "report",
    statuses: ["open", "reviewing", "resolved", "rejected"],
    statusSchema: reportStatusSchema,
    allowed: [
      ["open", "reviewing"],
      ["reviewing", "resolved"],
      ["reviewing", "rejected"],
    ],
    policy: assertReportTransition,
  },
] as const;

const malformedStatuses: readonly unknown[] = [
  "",
  " ",
  "UNKNOWN",
  "not_a_status",
  null,
  undefined,
  0,
  true,
  [],
  {},
];

function expectApplicationErrorCode(
  action: () => unknown,
  code: ApplicationErrorCode,
) {
  try {
    action();
    throw new Error(`Expected ${code}.`);
  } catch (error) {
    expect(error).toBeInstanceOf(ApplicationError);
    expect((error as ApplicationError).code).toBe(code);
  }
}

for (const suite of lifecycleSuites) {
  describe(`${suite.name} lifecycle`, () => {
    test("accepts exactly every declared enum value, including boundaries", () => {
      expect(suite.statusSchema.options).toEqual(suite.statuses);

      for (const status of suite.statuses) {
        expect(suite.statusSchema.safeParse(status).success).toBe(true);
      }
    });

    test("rejects empty, invalid enum, and malformed values", () => {
      for (const status of malformedStatuses) {
        expect(suite.statusSchema.safeParse(status).success).toBe(false);
      }
    });

    test("allows every explicitly documented transition", () => {
      for (const [from, to] of suite.allowed) {
        expect(suite.policy(from, to)).toEqual({ from, to });
      }
    });

    test("rejects every transition that is not explicitly allowed", () => {
      const allowed = new Set(
        suite.allowed.map(([from, to]) => `${from}->${to}`),
      );

      for (const from of suite.statuses) {
        for (const to of suite.statuses) {
          if (!allowed.has(`${from}->${to}`)) {
            expectApplicationErrorCode(
              () => suite.policy(from, to),
              "INVALID_STATE_TRANSITION",
            );
          }
        }
      }
    });

    test("maps malformed transition input to a stable validation code", () => {
      const validStatus = suite.statuses[0];

      for (const status of malformedStatuses) {
        expectApplicationErrorCode(
          () => suite.policy(status, validStatus),
          "VALIDATION_FAILED",
        );
        expectApplicationErrorCode(
          () => suite.policy(validStatus, status),
          "VALIDATION_FAILED",
        );
      }
    });
  });
}
