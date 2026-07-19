import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { e2eArea } from "./global-setup";

const testPassword = "Rintara-E2E-2026";

function syntheticIdentity(label: string) {
  const suffix = randomUUID().slice(0, 8);
  return {
    email: `rintara-${label}-${Date.now()}-${suffix}@example.com`,
    displayName: `Rintara ${label} ${suffix}`,
  };
}

async function expectMinimumTouchTarget(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, "touch target must be visible").not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

async function expectWrongRoleRedirect(page: Page, path: string) {
  const response = await page.request.get(path, { maxRedirects: 0 });

  if (response.status() === 200) {
    expect(await response.text()).toContain(
      'http-equiv="refresh" content="1;url=/account/continue"',
    );
    return;
  }

  expect([303, 307, 308]).toContain(response.status());
  expect(response.headers().location).toBe("/account/continue");
}

async function signUp(page: Page, label: string) {
  const identity = syntheticIdentity(label);
  await page.goto("/register");
  await page.getByLabel("Email").fill(identity.email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(testPassword);
  await page.getByRole("checkbox").check();

  const submit = page.getByRole("button", { name: /Lanjut pilih peran/i });
  await expectMinimumTouchTarget(submit);

  await submit.click();

  await expect(page).toHaveURL(/\/onboarding\/role(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Pilih peranmu" })).toBeVisible();

  return identity;
}

async function selectRadixOption(page: Page, label: string, option: string) {
  await page.getByLabel(label).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function completeWorkerOnboarding(page: Page, displayName: string) {
  const workerRadio = page.getByRole("radio", {
    name: /Saya mencari pekerjaan/i,
  });
  const employerRadio = page.getByRole("radio", {
    name: /Saya memberi pekerjaan/i,
  });
  await employerRadio.focus();
  await page.keyboard.press("Space");
  await expect(employerRadio).toBeChecked();
  await workerRadio.focus();
  await page.keyboard.press("Space");
  await expect(workerRadio).toBeChecked();

  const continueButton = page.getByRole("link", {
    name: /Lanjut sebagai pekerja/i,
  });
  await expectMinimumTouchTarget(continueButton);
  await continueButton.click();

  await page.getByLabel("Nama tampilan").fill(displayName);
  await selectRadixOption(page, "Area domisili", e2eArea.name);
  await page.getByRole("button", { name: "Simpan dan lihat beranda" }).click();
  await expect(page).toHaveURL(/\/worker\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: `Halo, ${displayName}` }),
  ).toBeVisible();
}

async function completeEmployerOnboarding(page: Page, displayName: string) {
  await page
    .getByRole("radio", { name: /Saya memberi pekerjaan/i })
    .check();
  const continueButton = page.getByRole("link", {
    name: /Lanjut sebagai pemberi kerja/i,
  });
  await expectMinimumTouchTarget(continueButton);
  await continueButton.click();

  await page.getByLabel("Nama usaha atau pemberi kerja").fill(displayName);
  await selectRadixOption(page, "Jenis pemberi kerja", "Usaha");
  await selectRadixOption(page, "Area kegiatan", e2eArea.name);
  await page.getByRole("button", { name: "Simpan dan lihat beranda" }).click();
  await expect(page).toHaveURL(/\/employer\/dashboard$/);
  await expect(page.getByRole("heading", { name: displayName })).toBeVisible();
}

test.describe.serial("issue #5 authentication and role dashboards", () => {
  test("anonymous protected access returns to sign-in with a safe destination", async ({
    page,
  }) => {
    await page.goto("/worker/dashboard");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fworker%2Fdashboard$/);
    await expect(page.getByRole("heading", { name: "Lanjutkan jejakmu" })).toBeVisible();
  });

  test("an incomplete account returns to role onboarding", async ({ page }) => {
    await signUp(page, "incomplete");
    await page.goto("/worker/dashboard");
    await expect(page).toHaveURL(/\/onboarding\/role$/);
  });

  test("same-tick duplicate onboarding submits once and preserves keyboard order", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    const email = page.getByLabel("Email");
    await email.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Kata sandi", { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Tampilkan kata sandi" }),
    ).toBeFocused();

    const identity = await signUp(page, "duplicate");
    await page
      .getByRole("radio", { name: /Saya mencari pekerjaan/i })
      .check();
    await page
      .getByRole("link", { name: /Lanjut sebagai pekerja/i })
      .click();
    await page.getByLabel("Nama tampilan").fill(identity.displayName);
    await selectRadixOption(page, "Area domisili", e2eArea.name);

    let onboardingPosts = 0;
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        request.method() === "POST" &&
        url.pathname === "/onboarding/worker"
      ) {
        onboardingPosts += 1;
      }
    });

    const submit = page.getByRole("button", {
      name: "Simpan dan lihat beranda",
    });
    await submit.evaluate((element) => {
      const button = element as HTMLElement;
      button.click();
      button.click();
    });

    await expect(page).toHaveURL(/\/worker\/dashboard$/, {
      timeout: 30_000,
    });
    expect(onboardingPosts).toBe(1);
  });

  test("worker completes onboarding, reaches dashboard, and cannot enter employer routes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const identity = await signUp(page, "worker");
    await completeWorkerOnboarding(page, identity.displayName);

    await expect(page.getByRole("navigation", { name: "Navigasi utama seluler" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Navigasi pekerja" }),
    ).toBeHidden();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expectMinimumTouchTarget(
      page.getByRole("link", { name: /Cari pekerjaan/i }).first(),
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(
      page.getByRole("navigation", { name: "Navigasi pekerja" }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navigasi utama seluler" })).toBeHidden();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    await expectWrongRoleRedirect(page, "/employer/dashboard");
  });

  test("employer completes onboarding, reaches dashboard, and cannot enter worker routes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const identity = await signUp(page, "employer");
    await completeEmployerOnboarding(page, identity.displayName);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    await expectWrongRoleRedirect(page, "/worker/dashboard");
  });
});
