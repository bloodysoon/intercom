import { expect, test } from "@playwright/test";
import { bootIntercom } from "./helpers";

test.describe("keypad", () => {
  test("touch input fills the apartment number and ✓ calls it", async ({ page }) => {
    await bootIntercom(page);
    await page.locator('.key[data-key="1"]').dispatchEvent("pointerdown", { pointerId: 1, button: 0 });
    await page.locator('.key[data-key="2"]').dispatchEvent("pointerdown", { pointerId: 1, button: 0 });
    await expect(page.locator(".entry__value")).toHaveText("12");
    await page.locator('.key[data-key="confirm"]').dispatchEvent("pointerdown", { pointerId: 1, button: 0 });
    await expect(page.locator(".feedback")).toContainText("Se apelează apartamentul 12");
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
    await expect(intercom.locator(".info__title")).toHaveText("Față nerecunoscută");
    await expect(intercom.locator(".lens")).toHaveAttribute("data-led", "failed");

    await control.keyboard.press("ArrowRight");
    await expect(intercom.locator(".info__status")).toContainText("Obiectiv curățat");

    // Filming mode: the punchline is only heard, the screen stays deadpan.
    await control.keyboard.press("ArrowRight");
    await expect(intercom.locator(".info__title")).toHaveText("Identitate neconfirmată");
    await expect(intercom.locator(".housing")).not.toContainText("Vindea covoare");

    // Rehearsal mode: the whole line.
    await control.getByRole("switch", { name: /Text complet pe ecran/ }).click();
    await expect(intercom.locator(".info__subtitle")).toHaveText("Ieri a venit un domn care era împărat. Vindea covoare.");
    await control.getByRole("switch", { name: /Text complet pe ecran/ }).click();

    await control.getByRole("button", { name: /Deblochează/ }).click();
    await expect(intercom.locator(".unlock__text")).toHaveText("ACCES PERMIS");
    await expect(intercom.locator(".info__subtitle")).toHaveText("Ușă deblocată");
    await expect(control.getByText("Confirmat", { exact: true })).toBeVisible();

    await control.keyboard.press("Shift+R");
    await expect(intercom.locator(".info__title")).toHaveText("Bun venit!");

    await control.getByPlaceholder(/Titlu/).fill("Majestatea Voastră?");
    await control.getByRole("button", { name: /Afișează pe interfon/ }).click();
    await expect(intercom.locator(".info__title")).toHaveText("Majestatea Voastră?");

    await control.keyboard.press("l");
    await expect(intercom.locator(".lens")).toHaveAttribute("data-led", "off");

    await ctx.close();
  });

  test("the intercom keeps its state across a reload", async ({ browser }) => {
    const ctx = await browser.newContext();
    const intercom = await ctx.newPage();
    await bootIntercom(intercom);
    const control = await ctx.newPage();
    await control.goto("/control");
    await control.getByRole("button", { name: /„Zâmbiți\.”/ }).first().click();
    await expect(intercom.locator(".info__title")).toHaveText("Zâmbiți");

    // Reload without the init script that clears storage.
    const page2 = await ctx.newPage();
    await intercom.close();
    await page2.goto("/");
    await expect(page2.locator(".info__title")).toHaveText("Zâmbiți");
    await ctx.close();
  });
});
