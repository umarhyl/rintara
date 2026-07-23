import { describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

mock.module("next/cache", () => ({
  revalidatePath: () => {},
}));

let activeContext: {
  userId: string;
  role: "worker" | "employer" | "admin";
  accountStatus: "active" | "suspended" | "deleted";
  requestId: string;
} = {
  userId: "00000000-0000-4000-8000-000000000010",
  role: "worker",
  accountStatus: "active",
  requestId: "test-request",
};

mock.module("@/server/auth/identity", () => ({
  requireActiveUser: async () => activeContext,
}));

mock.module("@/server/db/client", () => ({
  db: {
    transaction: async () => {
      throw new Error("database should not be reached by rejected inputs");
    },
  },
}));

function form(entries: Record<string, string | boolean>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    if (value === true) formData.set(key, "on");
    if (typeof value === "string") formData.set(key, value);
  }

  return formData;
}

describe("admin marketplace configuration actions", () => {
  test("reject non-admin category, pilot area, and wage guideline management", async () => {
    const {
      createCategoryAction,
      createPilotAreaAction,
      createWageGuidelineAction,
      setCategoryActiveAction,
      setPilotAreaActiveAction,
      setWageGuidelineActiveAction,
    } = await import("@/server/domain/admin/marketplace-config-actions");

    activeContext = {
      ...activeContext,
      role: "worker",
      accountStatus: "active",
    };

    await expect(
      createCategoryAction(
        null,
        form({
          name: "Kategori Admin",
          slug: "kategori-admin",
          riskLevel: "low",
          isActive: true,
        }),
      ),
    ).resolves.toMatchObject({ ok: false });

    await expect(
      createPilotAreaAction(
        null,
        form({
          name: "Kota Admin",
          code: "ADMIN-CITY",
          isActive: true,
        }),
      ),
    ).resolves.toMatchObject({ ok: false });

    await expect(
      createWageGuidelineAction(
        null,
        form({
          areaId: "00000000-0000-4000-8000-000000000020",
          categoryId: "00000000-0000-4000-8000-000000000030",
          unit: "job",
          minimumAmount: "100000",
          recommendedAmount: "150000",
          sourceLabel: "Sumber uji",
          effectiveFrom: "2030-01-01",
          isActive: true,
        }),
      ),
    ).resolves.toMatchObject({ ok: false });

    await expect(
      setCategoryActiveAction(
        null,
        form({
          id: "00000000-0000-4000-8000-000000000040",
          isActive: "false",
        }),
      ),
    ).resolves.toMatchObject({ ok: false });

    await expect(
      setPilotAreaActiveAction(
        null,
        form({
          id: "00000000-0000-4000-8000-000000000050",
          isActive: "false",
        }),
      ),
    ).resolves.toMatchObject({ ok: false });

    await expect(
      setWageGuidelineActiveAction(
        null,
        form({
          id: "00000000-0000-4000-8000-000000000060",
          isActive: "false",
        }),
      ),
    ).resolves.toMatchObject({ ok: false });
  });

  test("rejects First Opportunity on restricted categories before writing", async () => {
    const { createCategoryAction } = await import(
      "@/server/domain/admin/marketplace-config-actions"
    );

    activeContext = {
      ...activeContext,
      role: "admin",
      accountStatus: "active",
    };

    const result = await createCategoryAction(
      null,
      form({
        name: "Kategori Terbatas",
        slug: "kategori-terbatas",
        riskLevel: "restricted",
        firstOpportunityAllowed: true,
        isActive: true,
      }),
    );

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        firstOpportunityAllowed: [
          "Nonaktifkan untuk kategori dengan risiko terbatas.",
        ],
      },
    });
  });

  test("rejects malformed status updates before writing", async () => {
    const { setCategoryActiveAction } = await import(
      "@/server/domain/admin/marketplace-config-actions"
    );

    activeContext = {
      ...activeContext,
      role: "admin",
      accountStatus: "active",
    };

    const result = await setCategoryActiveAction(
      null,
      form({
        id: "not-a-uuid",
        isActive: "true",
      }),
    );

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        id: ["Konfigurasi tidak valid."],
      },
    });
  });
});
