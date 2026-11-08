import { expect, test } from "@playwright/test";

/**
 * Real getUserMedia path using Chromium's fake camera device.
 * (localhost counts as a secure context, so the camera API is available.)
 */
test.use({
  launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
  permissions: ["camera"],
});

test("live camera stream is shown, mirrored, and released when hidden", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Cameră reală/ }).click();
  await page.getByRole("button", { name: /Pornește interfonul/ }).click();

  const video = page.locator("video.video__media");
  await expect(video).toBeVisible();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState >= 2 && v.videoWidth > 0))
    .toBe(true);
  await expect(video).toHaveAttribute("style", /scaleX\(-1\)/);

  // Stop the camera while the page is hidden, and get it back when visible.
  const liveTracks = () =>
    video.evaluate((v: HTMLVideoElement) =>
      ((v.srcObject as MediaStream | null)?.getVideoTracks() ?? []).filter((t) => t.readyState === "live").length,
    );
  expect(await liveTracks()).toBe(1);

  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("video.video__media")).toHaveCount(0);

  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("video.video__media")).toBeVisible();
});

test("falls back to the simulated picture when permission is denied", async ({ browser }) => {
  const ctx = await browser.newContext({ permissions: [] });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    // Force a permission refusal regardless of browser flags.
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Cameră reală/ }).click();
  await page.getByRole("button", { name: /Pornește interfonul/ }).click();
  await expect(page.locator(".demo-feed")).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  // No error text on the device itself.
  await expect(page.locator(".kiosk")).not.toContainText(/eroare|error|denied|refuzat/i);
  await ctx.close();
});
