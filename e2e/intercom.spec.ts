import { expect, test } from "@playwright/test";
import { bootIntercom } from "./helpers";

test.describe("keypad", () => {
  test("touch input fills the apartment number and ✓ calls it", async ({ page }) => {
    await bootIntercom(page);
    await page.locator('.key[data-key="1"]').dispatchEvent("pointerdown", { pointerId: 1, button: 0 });
    await page.locator('.key[data-key="2"]').dispatchEvent("pointerdown", { pointerId: 1, button: 0 });
    await expect(page.locator(".entry__value")).toHaveText("12");
    await page.locator('.key[data-key="confirm"]').dispatchEvent("pointerdown", { pointerId: 1, button: 0 });
    // Filming mode shows no extra text: the number is accepted and cleared.
    await expect(page.locator(".entry__value")).toHaveCount(0);
    await expect(page.locator(".kiosk")).not.toContainText("Se apelează");
  });

  test("external keyboard works (digits, Backspace, Escape)", async ({ page }) => {
    await bootIntercom(page);
    await page.keyboard.type("345");
    await expect(page.locator(".entry__value")).toHaveText("345");
    await page.keyboard.press("Backspace");
    await expect(page.locator(".entry__value")).toHaveText("34");
    await page.keyboard.press("Escape");
    await expect(page.locator(".entry__value")).toHaveCount(0);
  });
});

test.describe("operator control", () => {
  test("commands from /control drive the intercom and state mirrors back", async ({ browser }) => {
    const ctx = await browser.newContext();
    const intercom = await ctx.newPage();
    await bootIntercom(intercom);
    const control = await ctx.newPage();
    await control.goto("/control");
    await expect(control.getByText(/^(Interfon online|\d+ interfoane online)$/)).toBeVisible();

    await control.getByRole("button", { name: /Față nerecunoscută/ }).first().click();
    await expect(intercom.locator(".info__access")).toHaveText("Acces refuzat");
    await expect(intercom.locator("[data-led]").first()).toHaveAttribute("data-led", "failed");

    await control.keyboard.press("ArrowRight");
    await expect(intercom.locator(".info__access")).toHaveText("Acces refuzat");

    // Filming mode: only the access state — no labels, chips or punchlines.
    await control.keyboard.press("ArrowRight");
    await expect(intercom.locator(".info__access")).toHaveText("Acces refuzat");
    await expect(intercom.locator(".kiosk")).not.toContainText("Vindea covoare");
    await expect(intercom.locator(".kiosk")).not.toContainText("Verificare identitate");
    await expect(intercom.locator(".tracking__label, .cue-chip, .info__icon")).toHaveCount(0);

    // Other modes on request.
    await control.getByRole("button", { name: "Stări scurte" }).click();
    await expect(intercom.locator(".info__title")).toHaveText("Identitate neconfirmată");
    await control.getByRole("button", { name: "Replica completă" }).click();
    await expect(intercom.locator(".info__subtitle")).toHaveText("Ieri a venit un domn care era împărat. Vindea covoare.");
    await control.getByRole("button", { name: "Doar acces" }).click();

    await control.getByRole("button", { name: /Deblochează/ }).click();
    await expect(intercom.locator(".info__access")).toHaveText("Acces permis");
    await expect(intercom.locator(".unlock")).toBeVisible();
    await expect(control.getByText("Confirmat", { exact: true })).toBeVisible();

    await control.keyboard.press("Shift+R");
    await expect(intercom.locator(".info__access")).toHaveText(/^\s*$/);

    await control.getByPlaceholder(/Titlu/).fill("Majestatea Voastră?");
    await control.getByRole("button", { name: /Afișează pe interfon/ }).click();
    await expect(intercom.locator(".info__access")).toHaveText("Majestatea Voastră?");

    await control.keyboard.press("l");
    await expect(intercom.locator("[data-led]").first()).toHaveAttribute("data-led", "off");

    await ctx.close();
  });

  test("the operator can switch between the full-screen look and the drawn housing", async ({ browser }) => {
    const ctx = await browser.newContext();
    const intercom = await ctx.newPage();
    await bootIntercom(intercom);
    await expect(intercom.locator(".sk")).toBeVisible();
    await expect(intercom.locator(".housing")).toHaveCount(0);

    const control = await ctx.newPage();
    await control.goto("/control");
    await control.getByRole("switch", { name: /Carcasă desenată/ }).click();
    await expect(intercom.locator(".housing")).toBeVisible();
    await expect(intercom.locator(".lens")).toBeVisible();
    await control.getByRole("switch", { name: /Carcasă desenată/ }).click();
    await expect(intercom.locator(".sk")).toBeVisible();
    await ctx.close();
  });

  test("the intercom keeps its state across a reload", async ({ browser }) => {
    const ctx = await browser.newContext();
    const intercom = await ctx.newPage();
    await bootIntercom(intercom);
    const control = await ctx.newPage();
    await control.goto("/control");
    await control.getByRole("button", { name: /„Zâmbiți\.”/ }).first().click();
    await expect(intercom.locator(".info__access")).toHaveText("Se verifică…");

    // Reload without the init script that clears storage.
    const page2 = await ctx.newPage();
    await intercom.close();
    await page2.goto("/");
    await expect(page2.locator(".info__access")).toHaveText("Se verifică…");
    await ctx.close();
  });
});
