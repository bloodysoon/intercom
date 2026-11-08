import type { Page } from "@playwright/test";

/** Opens the intercom in demo mode (no camera prompt) and dismisses the boot screen. */
export async function bootIntercom(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Mod demonstrativ/ }).click();
  await page.getByRole("button", { name: /Pornește interfonul/ }).click();
  await page.locator(".boot").waitFor({ state: "detached" });
}
