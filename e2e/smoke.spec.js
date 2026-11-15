import { expect, test } from "@playwright/test";

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
  await expect(plateName(page)).toHaveText("1 Black");
}

async function goToPlate(page, name) {
  for (let i = 0; i < 12; i += 1) {
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
  await expect(page.locator("#flash-warning")).toContainText("plate 6 flips between black and white");
  await expect(page.getByText("11 plates")).toBeVisible();
  await box.uncheck();
  await expect(page.getByText("10 plates")).toBeVisible();
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
  await expect(plateName(page)).toHaveText("6 Horizontal ramp");
  await expect(page.locator(".dock .count")).toHaveText("6 / 10");
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "mouse and keyboard only");

  test("keyboard and mouse drive the plates", async ({ page }) => {
    await start(page);
    await page.keyboard.press("ArrowRight");
    await expect(plateName(page)).toHaveText("2 White");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(plateName(page)).toHaveText("11 Grid on white");

    await page.mouse.click(640, 360);
    await expect(plateName(page)).toHaveText("1 Black");
    await page.mouse.click(640, 360, { button: "right" });
    await page.mouse.click(640, 360, { button: "middle" });
    await expect(plateName(page)).toHaveText("1 Black");

    // Hidden dock ignores a tiny bump but returns on a real move.
    await page.waitForTimeout(3300);
    await expect(page.locator(".stage")).not.toHaveClass(/hud-open/);
    await page.mouse.move(643, 362);
    await expect(page.locator(".stage")).not.toHaveClass(/hud-open/);
    await page.mouse.move(700, 400);
    await expect(page.locator(".stage")).toHaveClass(/hud-open/);
    await expect(page.locator(".chip-hint")).toBeVisible();

    for (let i = 0; i < 2 && (await page.locator(".stage").count()); i += 1) {
      await page.keyboard.press("Escape");
    }
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
    await expect(plateName(page)).toHaveText("2 White");
    await swipe(page, 300, 100);
    await expect(plateName(page)).toHaveText("3 Red");
    await swipe(page, 100, 300);
    await expect(plateName(page)).toHaveText("2 White");

    await page.waitForTimeout(3300);
    await expect(page.locator(".stage")).not.toHaveClass(/hud-open/);
    await page.touchscreen.tap(width / 2, 10);
    await expect(page.locator(".stage")).toHaveClass(/hud-open/);
    await expect(plateName(page)).toHaveText("2 White");

    const dock = await page.locator(".dock").boundingBox();
    expect(dock.x).toBeGreaterThanOrEqual(0);
    expect(dock.x + dock.width).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "Stop" }).tap();
    await expect(page.getByRole("button", { name: "Start test" })).toBeVisible();
  });
});
