import { test, expect } from "@playwright/test";

// Bypass credentials hardcoded in src/services/authService.js — does not hit the backend.
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "Admin@123";

async function login(page) {
  await page.goto("/login");
  await page.getByPlaceholder("admin@gmail.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("XXX XXX").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /proceed/i }).click();
}

test.describe("Dashboard page", () => {
  test("loads successfully at the correct URL", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.waitForLoadState("networkidle");
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join(", ")}`).toEqual([]);
  });

  test("shows key dashboard sections and stat cards", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // The page-local "Dashboard" header/title was removed — the app now has
    // only one real page, so its search box lives in the Navbar instead (see
    // Navbar.jsx / AppContext's globalSearch). Confirm that's where it is.
    await expect(page.getByPlaceholder(/search site, vehicle, doc no/i)).toBeVisible();

    // Sync button — the dashboard's own content (below the navbar) can still
    // be mid-fetch here since the DB connection pool sometimes needs a few
    // seconds to warm up; give it more than the default 5s before failing.
    await expect(page.getByRole("button", { name: /sync now/i })).toBeVisible({ timeout: 15000 });

    // Stat cards grid should render at least one card (not the skeleton state forever)
    const statsGrid = page.locator(".grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-6");
    await expect(statsGrid).toBeVisible({ timeout: 15000 });
    await expect(statsGrid.locator("> *").first()).toBeVisible();

    // Data table container
    await expect(page.locator(".data-status-section")).toBeVisible({ timeout: 15000 });
  });

  test("dashboard content actually renders (not stuck loading / not empty)", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // The full-page loading spinner (shown while `loading` is true) must go away.
    const fullPageLoader = page.locator(".h-\\[60vh\\]");
    await expect(fullPageLoader).toBeHidden({ timeout: 15000 });

    // Skeleton stat cards (animate-pulse placeholders) must be replaced by real cards.
    // Scoped to the stats grid — the "Live Sync" status dot also uses animate-pulse
    // permanently and isn't a loading indicator.
    const statsGridForSkeleton = page.locator(".grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-6");
    const skeletonCards = statsGridForSkeleton.locator(".animate-pulse");
    await expect(skeletonCards).toHaveCount(0, { timeout: 15000 });

    // System error panel must not be shown.
    await expect(page.getByText("System Error")).toHaveCount(0);

    // At least one real stat card with a numeric value should be visible, and stay visible
    // (auto-retrying assertion — catches the case where loading flips back to true after
    // content already rendered, e.g. from a second/duplicate fetch racing the first).
    const statsGrid = page.locator(".grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-6");
    await expect(statsGrid.locator("> *").first()).toBeVisible({ timeout: 15000 });
    // Confirm it's still visible half a second later — not a one-frame flash before reverting to loading.
    await page.waitForTimeout(500);
    await expect(statsGrid.locator("> *").first()).toBeVisible();
    await expect(page.locator(".h-\\[60vh\\]")).toBeHidden();
  });

  test("switching Automatic/Manual tab after a stat-card filter shows records, not empty", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator(".h-\\[60vh\\]")).toBeHidden({ timeout: 15000 });

    // Click the MANUAL stat card to filter the table down to manual entries.
    const manualCard = page
      .locator('div[title="Click to filter table"]')
      .filter({ hasText: "MANUAL" });
    await manualCard.click();
    await expect(page.getByText("Filter: Manual")).toBeVisible();

    // Now switch the table's own toggle to Automatic.
    await page
      .locator(".flex.items-center.gap-1.p-1.bg-white.border.border-slate-300.rounded-lg")
      .getByRole("button", { name: "Automatic" })
      .click();

    // Previously this showed "No records found" because the stat-card filter (manual-only)
    // and the tab (automatic-only) intersected to zero. The stat-card filter should now
    // be cleared automatically, and automatic records should be visible.
    await expect(page.getByText("No records found")).toHaveCount(0);
    await expect(page.getByText("Filter: Manual")).toHaveCount(0);
    const tableRows = page.locator(".data-status-section table tbody tr");
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
  });
});
