import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration Playwright E2E pour CIAT (Phase 3 - T3)
 * Couvre les 6 parcours de démonstration de bout en bout.
 * Démarre automatiquement le backend Django (SQLite, seed_all) et le frontend Next.js en local et en CI.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "python manage.py migrate && python manage.py seed_all && python manage.py runserver 127.0.0.1:8000",
      url: "http://127.0.0.1:8000/api/docs/",
      cwd: "../backend",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: "npm run start",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
