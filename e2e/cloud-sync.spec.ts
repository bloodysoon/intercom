import { expect, test } from "@playwright/test";

/**
 * Cloud mode (as on Vercel): two separate browser contexts — like a tablet and
 * a phone — talking only through the public MQTT broker. Needs internet:
 *   MQTT_LIVE=1 npx playwright test cloud-sync
 * Against the live site:  E2E_BASE_URL=https://intercom-eta.vercel.app MQTT_LIVE=1 npx playwright test cloud-sync
 */
test.skip(process.env.MQTT_LIVE !== "1", "needs internet (MQTT_LIVE=1)");

test("operator on another device drives the intercom through the cloud", async ({ browser }) => {
  const room = `e2e-${Math.random().toString(36).slice(2, 10)}`;
  const q = `?sync=mqtt&sala=${room}`;

  const tablet = await (await browser.newContext()).newPage();
  await tablet.goto(`/${q}`);
  await tablet.getByRole("button", { name: /Mod demonstrativ/ }).click();
  await tablet.getByRole("button", { name: /Pornește interfonul/ }).click();

  const phone = await (await browser.newContext()).newPage();
  await phone.goto(`/control${q}`);
  await expect(phone.getByText(`Conectat (cloud · sala ${room})`)).toBeVisible({ timeout: 15_000 });
  await expect(phone.getByText("Interfon online", { exact: true })).toBeVisible({ timeout: 15_000 });

  await phone.getByRole("button", { name: /Bună ziua\. Față nerecunoscută/ }).click();
  await expect(tablet.locator(".info__title")).toHaveText("Față nerecunoscută", { timeout: 10_000 });
  await expect(tablet.locator("[data-led]").first()).toHaveAttribute("data-led", "failed");

  await phone.keyboard.press("ArrowRight");
  await expect(tablet.locator(".info__status")).toContainText("Obiectiv curățat");
  await expect(phone.getByText("Confirmat", { exact: true })).toBeVisible();

  await phone.keyboard.press("u");
  await expect(tablet.locator(".unlock__text")).toHaveText("ACCES PERMIS");
});
