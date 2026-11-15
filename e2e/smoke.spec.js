import { expect, test } from "@playwright/test";
import { FLASH_PLATE, PATTERNS } from "../src/patterns.js";

const TOTAL = PATTERNS.length;
// "4 White": the chip's frame number and plate name for a 0-based position.
const label = (i, list = PATTERNS) => `${i + 1} ${list[i].name}`;
const NO_FLASH = PATTERNS.filter((pattern) => pattern.kind !== "flash");

const errors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const list = [];
  errors.set(page, list);
  page.on("pageerror", (error) => list.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      list.push(message.text());
    }
  });
  await page.goto("/");
});

test.afterEach(async ({ page }) => {
  // Fonts are self-hosted, so a missing font file counts as an error too.
  const list = errors.get(page) ?? [];
  expect(list).toEqual([]);
});

const plateName = (page) => page.locator(".chip strong");

async function start(page) {
  await page.getByRole("button", { name: "Start test" }).click();
  await expect(page.locator(".stage")).toBeVisible();
  await expect(plateName(page)).toHaveText(label(0));
}

async function goToPlate(page, name) {
  for (let i = 0; i <= TOTAL; i += 1) {
    if ((await plateName(page).textContent()).endsWith(name)) {
      return;
    }
    await page.keyboard.press("ArrowRight");
  }
  throw new Error(`Plate ${name} not found`);
}

// Reads one row of the grid canvas and checks every line is one device
// pixel of full intensity on a solid base.
async function gridRow(page) {
  return page.locator("canvas.plate-grid").evaluate((canvas) => {
    const dpr = window.devicePixelRatio;
    const context = canvas.getContext("2d");
    const row = context.getImageData(0, 1, canvas.width, 1).data;
    const values = [];
    for (let x = 0; x < canvas.width; x += 1) {
      values.push(row[x * 4]);
    }
    return {
      dpr,
      width: canvas.width,
      expectedWidth: Math.round(canvas.getBoundingClientRect().width * dpr),
      values,
    };
  });
}

test("intro warns about the flashing plate before starting", async ({ page }) => {
  await expect(page).toHaveTitle("Dead pixel tester");
  const box = page.getByRole("checkbox", { name: "Include flashing plate" });
  await expect(box).toBeChecked();
  await expect(page.locator("#flash-warning")).toContainText(`plate ${FLASH_PLATE} flips between black and white`);
  await expect(page.getByText(`${TOTAL} plates`)).toBeVisible();
  await expect(page.getByRole("list", { name: "Plates" }).getByRole("listitem")).toHaveCount(TOTAL);
  await box.uncheck();
  await expect(page.getByText(`${TOTAL - 1} plates`)).toBeVisible();
  const flashFrame = page.getByRole("button", { name: `Start at plate ${FLASH_PLATE}, ${PATTERNS[FLASH_PLATE - 1].name}` });
  await expect(flashFrame).toHaveAttribute("aria-disabled", "true");
  // Playwright waits for aria-disabled controls to enable; force the click.
  await flashFrame.click({ force: true });
  await expect(page.locator(".stage")).toHaveCount(0);
});

test("grid lines are one device pixel at full intensity", async ({ page }) => {
  await start(page);
  await goToPlate(page, "Grid on black");
  const black = await gridRow(page);
  expect(black.width).toBe(black.expectedWidth);
  const step = Math.max(2, Math.round(8 * black.dpr));
  black.values.forEach((value, x) => expect(value, `x=${x}`).toBe(x % step === 0 ? 255 : 0));

  await page.keyboard.press("ArrowRight");
  await expect(plateName(page)).toContainText("Grid on white");
  const white = await gridRow(page);
  white.values.forEach((value, x) => expect(value, `x=${x}`).toBe(x % step === 0 ? 0 : 255));
});

test("flashing plate can be skipped from the dock", async ({ page }) => {
  await start(page);
  await goToPlate(page, "Stuck pixel");
  await page.getByRole("button", { name: "Skip flashing" }).click();
  await expect(plateName(page)).toHaveText(label(FLASH_PLATE - 1, NO_FLASH));
  await expect(page.locator(".dock .count")).toHaveText(`${FLASH_PLATE} / ${NO_FLASH.length}`);
});

test("a frame starts the test at its plate, and the dark greys are exact", async ({ page }) => {
  await page.getByRole("button", { name: `Start at plate 9, ${PATTERNS[8].name}` }).click();
  await expect(plateName(page)).toHaveText(label(8));
  for (let i = 8; i > 1; i -= 1) {
    await page.keyboard.press("ArrowLeft");
  }
  await expect(plateName(page)).toHaveText("2 Dark grey 5%");
  await expect(page.locator(".plate")).toHaveCSS("background-color", "rgb(13, 13, 13)");
  await page.keyboard.press("ArrowRight");
  await expect(plateName(page)).toHaveText("3 Dark grey 10%");
  await expect(page.locator(".plate")).toHaveCSS("background-color", "rgb(26, 26, 26)");
});

test("the last plate leads to a summary that can be marked and copied", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await start(page);
  for (let i = 1; i < TOTAL; i += 1) {
    await page.keyboard.press("ArrowRight");
  }
  await expect(page.getByRole("button", { name: "Finish" })).toBeAttached();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Did you see anything?" })).toBeFocused();
  await expect(page.locator(".verdict")).toHaveText(`Clean: no problems marked on ${TOTAL} plates`);

  await page.getByRole("button", { name: /^Problem on plate 4, White$/ }).click();
  await page.getByLabel("Problem type on White").selectOption("dead");
  await page.getByRole("button", { name: /^Problem on plate 13, Grid on white$/ }).click();
  await page.getByLabel("Problem type on Grid on white").selectOption("stuck");
  const verdict = "Problems marked on 2 plates: White (dead pixel), Grid on white (stuck pixel)";
  await expect(page.locator(".verdict")).toHaveText(verdict);

  await page.getByRole("button", { name: "Copy summary" }).click();
  await expect(page.getByRole("status")).toContainText("Copied");
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain(`Result: ${verdict}`);
  expect(text).toMatch(/Screen: \d+ × \d+/);

  await page.getByRole("button", { name: "Back to start" }).click();
  await expect(page.getByRole("button", { name: "Start test" })).toBeFocused();
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "mouse and keyboard only");

  test("keyboard and mouse drive the plates", async ({ page }) => {
    await start(page);
    await page.keyboard.press("ArrowRight");
    await expect(plateName(page)).toHaveText(label(1));
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(plateName(page)).toHaveText(label(TOTAL - 1));
    await page.keyboard.press("ArrowLeft");
    await expect(plateName(page)).toHaveText(label(TOTAL - 2));

    await page.mouse.click(640, 360);
    await expect(plateName(page)).toHaveText(label(TOTAL - 1));
    await page.mouse.click(640, 360, { button: "right" });
    await page.mouse.click(640, 360, { button: "middle" });
    await expect(plateName(page)).toHaveText(label(TOTAL - 1));

    // Hidden dock ignores a tiny bump but returns on a real move.
    await page.waitForTimeout(3300);
    await expect(page.locator(".stage")).not.toHaveClass(/hud-open/);
    await page.mouse.move(643, 362);
    await expect(page.locator(".stage")).not.toHaveClass(/hud-open/);
    await page.mouse.move(700, 400);
    await expect(page.locator(".stage")).toHaveClass(/hud-open/);
    await expect(page.locator(".chip-hint")).toBeVisible();

    // Several plates seen, so stopping goes to the summary first.
    for (let i = 0; i < 2 && (await page.locator(".stage").count()); i += 1) {
      await page.keyboard.press("Escape");
    }
    await expect(page.getByRole("heading", { name: "Did you see anything?" })).toBeFocused();
    await page.getByRole("button", { name: "Back to start" }).click();
    await expect(page.getByRole("button", { name: "Start test" })).toBeFocused();
  });
});

test.describe("touch", () => {
  test.skip(({ isMobile }) => !isMobile, "touch only");

  async function swipe(page, fromX, toX) {
    await page.locator(".stage").evaluate(
      (stage, [from, to]) => {
        const init = { pointerId: 7, pointerType: "touch", isPrimary: true, button: 0, bubbles: true, clientY: 300 };
        stage.dispatchEvent(new PointerEvent("pointerdown", { ...init, clientX: from }));
        stage.dispatchEvent(new PointerEvent("pointerup", { ...init, clientX: to }));
      },
      [fromX, toX],
    );
  }

  test("taps and swipes drive the plates", async ({ page }) => {
    await start(page);
    const { width, height } = page.viewportSize();
    await page.touchscreen.tap(width / 2, height / 2);
    await expect(plateName(page)).toHaveText(label(1));
    await swipe(page, 300, 100);
    await expect(plateName(page)).toHaveText(label(2));
    await swipe(page, 100, 300);
    await expect(plateName(page)).toHaveText(label(1));

    await page.waitForTimeout(3300);
    await expect(page.locator(".stage")).not.toHaveClass(/hud-open/);
    await page.touchscreen.tap(width / 2, 10);
    await expect(page.locator(".stage")).toHaveClass(/hud-open/);
    await expect(plateName(page)).toHaveText(label(1));

    const dock = await page.locator(".dock").boundingBox();
    expect(dock.x).toBeGreaterThanOrEqual(0);
    expect(dock.x + dock.width).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "Stop" }).tap();
    await expect(page.getByRole("heading", { name: "Did you see anything?" })).toBeVisible();
    await page.getByRole("button", { name: /^Problem on plate 2,/ }).tap();
    await expect(page.locator(".verdict")).toContainText(`Problem marked on 1 plate: ${PATTERNS[1].name}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "Back to start" }).tap();
    await expect(page.getByRole("button", { name: "Start test" })).toBeVisible();
  });
});
