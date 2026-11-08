import { expect, test } from "@playwright/test";
import { bootIntercom } from "./helpers";

/**
 * Basic responsive verification: on common tablet sizes in both orientations
 * the device fills the screen without scrolling, every hardware part is fully
 * visible, nothing overlaps, and keys stay comfortably touchable.
 */
const VIEWPORTS = [
  { name: "iPad 10.9 portrait", width: 820, height: 1180 },
  { name: "iPad 10.9 landscape", width: 1180, height: 820 },
  { name: "iPad mini portrait", width: 744, height: 1133 },
  { name: "iPad 9.7 portrait", width: 768, height: 1024 },
  { name: "iPad Pro 12.9 portrait", width: 1024, height: 1366 },
  { name: "Android 10 portrait", width: 800, height: 1280 },
  { name: "Android 10 landscape", width: 1280, height: 800 },
  { name: "Android 8 portrait", width: 600, height: 960 },
  { name: "Android 8 landscape", width: 960, height: 600 },
];

const PARTS = [".brand", ".lens", ".screen", ".video", ".info", ".keypad", ".grille"];

for (const vp of VIEWPORTS) {
  test(`layout fits: ${vp.name} (${vp.width}×${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await bootIntercom(page);

    const overflow = await page.evaluate(() => ({
      x: document.documentElement.scrollWidth - window.innerWidth,
      y: document.documentElement.scrollHeight - window.innerHeight,
    }));
    expect(overflow.x).toBeLessThanOrEqual(0);
    expect(overflow.y).toBeLessThanOrEqual(0);

    const housing = (await page.locator(".housing").boundingBox())!;
    const boxes: Record<string, { x: number; y: number; width: number; height: number }> = {};
    for (const sel of PARTS) {
      const box = await page.locator(sel).first().boundingBox();
      expect(box, `${sel} visible`).not.toBeNull();
      boxes[sel] = box!;
      expect(box!.x, `${sel} left`).toBeGreaterThanOrEqual(housing.x - 0.5);
      expect(box!.y, `${sel} top`).toBeGreaterThanOrEqual(housing.y - 0.5);
      expect(box!.x + box!.width, `${sel} right`).toBeLessThanOrEqual(housing.x + housing.width + 0.5);
      expect(box!.y + box!.height, `${sel} bottom`).toBeLessThanOrEqual(housing.y + housing.height + 0.5);
    }

    // Separate hardware parts must not overlap.
    const separate = [".brand", ".lens", ".screen", ".keypad", ".grille"];
    for (let i = 0; i < separate.length; i++) {
      for (let j = i + 1; j < separate.length; j++) {
        const a = boxes[separate[i]];
        const b = boxes[separate[j]];
        const overlap =
          a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1;
        expect(overlap, `${separate[i]} overlaps ${separate[j]}`).toBe(false);
      }
    }

    // The live picture keeps a usable size.
    expect(boxes[".video"].height).toBeGreaterThan(vp.height * 0.15);

    // Keys are large enough for fingers (Apple HIG 44pt).
    const key = (await page.locator(".key").first().boundingBox())!;
    expect(key.height).toBeGreaterThanOrEqual(44);
    expect(key.width).toBeGreaterThanOrEqual(44);
  });
}

test("text cannot be selected and the page does not scroll", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await bootIntercom(page);
  const styles = await page.locator(".kiosk").evaluate((el) => {
    const cs = getComputedStyle(el);
    return { userSelect: cs.userSelect || cs.webkitUserSelect, overflow: cs.overflow };
  });
  expect(styles.userSelect).toBe("none");
  expect(styles.overflow).toBe("hidden");
});
