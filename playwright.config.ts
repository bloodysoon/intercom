import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3210);
/** Point at an already running server (e.g. `npm run dev` on https://localhost:3000). */
const EXTERNAL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: EXTERNAL ?? `http://localhost:${PORT}`,
    ignoreHTTPSErrors: true,
  },
  webServer: EXTERNAL
    ? undefined
    : {
        command: `node server/index.mjs --dev`,
        env: { PORT: String(PORT), HTTPS: "0" },
        url: `http://localhost:${PORT}`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
