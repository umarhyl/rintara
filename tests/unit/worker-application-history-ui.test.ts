import { describe, expect, test } from "bun:test";

describe("worker application history", () => {
  test("filters each view before cursor pagination while keeping the query default unfiltered", async () => {
    const query = await Bun.file(
      "server/queries/applications/worker-applications.ts",
    ).text();

    expect(query).toContain(
      'export type WorkerApplicationListView = "active" | "history"',
    );
    expect(query).toContain(
      'return inArray(applications.status, ["submitted", "accepted"])',
    );
    expect(query).toContain(
      'return inArray(applications.status, ["rejected", "withdrawn"])',
    );
    expect(query).toContain("applicationViewCondition(input.view)");
    expect(query).toContain("return undefined");
    expect(query.indexOf("applicationViewCondition(input.view)")).toBeLessThan(
      query.indexOf(".limit(limit + 1)"),
    );
  });

  test("keeps the selected view through pagination and avoids dead public detail links", async () => {
    const page = await Bun.file("app/worker/applications/page.tsx").text();
    const query = await Bun.file(
      "server/queries/applications/worker-applications.ts",
    ).text();

    expect(page).toContain('view === "history" ? "history" : "active"');
    expect(page).toContain("view: selectedView");
    expect(page).toContain("new URLSearchParams({");
    expect(page).toContain("cursor: applicationPage.nextCursor");
    expect(page).toContain('aria-label="Tampilkan jenis lamaran"');
    expect(page).toContain('aria-current={selected ? "page" : undefined}');
    expect(page).toContain("min-h-11");
    expect(page).toContain("Pada halaman ini");
    expect(page).toContain("application.publicDetailAvailable ?");
    expect(query).toContain("publicDetailAvailable");
  });
});
