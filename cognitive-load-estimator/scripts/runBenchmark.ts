import fs from "fs";
import path from "path";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import { analyzeScreenshot } from "../lib/analyzeScreenshot";

const inputPath = path.join(process.cwd(), "data", "websites.csv");
const outputPath = path.join(process.cwd(), "data", "results.csv");
const screenshotsDir = path.join(process.cwd(), "data", "screenshots");

const CONCURRENCY = 8;

const REUSE_EXISTING_RESULTS = false;
const REUSE_EXISTING_SCREENSHOTS = false;

type Website = {
  id: string;
  url: string;
  category: string;
  expected_clutter_level: string;
};

type ResultRow = string;

const header = [
  "id",
  "url",
  "category",
  "expected_clutter_level",
  "overall_score",
  "severity",
  "visual_clutter",
  "contour_density",
  "color_variability",
  "figure_ground_contrast",
  "layout_regularity",
  "screenshot_path",
].join(",");

async function main() {
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const websites = readWebsitesCsv(inputPath);

  const previousResults = REUSE_EXISTING_RESULTS
    ? readExistingResults(outputPath)
    : new Map<string, string>();

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  const results: ResultRow[] = new Array(websites.length);
  let index = 0;

  async function worker(workerId: number) {
    const context = await createBenchmarkContext(browser);

    try {
      while (index < websites.length) {
        const currentIndex = index++;
        const website = websites[currentIndex];

        const previous = previousResults.get(website.id);

        if (previous && !previous.includes("ERROR")) {
          console.log(`[${workerId}] Skipping ${website.id}: already analyzed`);
          results[currentIndex] = previous;
          continue;
        }

        results[currentIndex] = await analyzeWebsite(context, website, workerId);
      }
    } finally {
      await context.close();
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, workerId) => worker(workerId))
  );

  await browser.close();

  fs.writeFileSync(outputPath, [header, ...results].join("\n"));

  console.log(`Done. Results saved to ${outputPath}`);
}

async function createBenchmarkContext(browser: Browser) {
  return browser.newContext({
    viewport: {
      width: 1440,
      height: 1000,
    },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    deviceScaleFactor: 1,
    javaScriptEnabled: true,
    ignoreHTTPSErrors: true,
  });
}

async function analyzeWebsite(
  context: BrowserContext,
  website: Website,
  workerId: number
) {
  const screenshotPath = path.join(screenshotsDir, `${website.id}.png`);
  const publicScreenshotPath = `data/screenshots/${website.id}.png`;

  console.log(`[${workerId}] Analyzing ${website.id}: ${website.url}`);

  try {
    let screenshot: Buffer;

    if (REUSE_EXISTING_SCREENSHOTS && fs.existsSync(screenshotPath)) {
      screenshot = fs.readFileSync(screenshotPath);
      console.log(`[${workerId}] Reusing screenshot ${website.id}`);
    } else {
      const page = await context.newPage();

      try {
        await page.goto(website.url, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });

        await page.waitForLoadState("load", { timeout: 8000 }).catch(() => {});

        await dismissPopups(page);

        await page.waitForTimeout(1500);

        screenshot = Buffer.from(
          await page.screenshot({
            fullPage: false,
            type: "png",
            animations: "disabled",
          })
        );

        fs.writeFileSync(screenshotPath, screenshot);
      } finally {
        await page.close();
      }
    }

    const result = await analyzeScreenshot(screenshot, website.url, {
      includeHeatmap: false,
    });

    return [
      website.id,
      website.url,
      website.category,
      website.expected_clutter_level,
      result.overallScore,
      result.severity,
      result.dimensions.visualClutter,
      result.dimensions.contourDensity,
      result.dimensions.colorVariability,
      result.dimensions.figureGroundContrast,
      result.dimensions.layoutRegularity,
      publicScreenshotPath,
    ].join(",");
  } catch (error) {
    console.error(`[${workerId}] Failed: ${website.url}`);
    console.error(error);

    return [
      website.id,
      website.url,
      website.category,
      website.expected_clutter_level,
      "ERROR",
      "ERROR",
      "ERROR",
      "ERROR",
      "ERROR",
      "ERROR",
      "ERROR",
      "",
    ].join(",");
  }
}

async function dismissPopups(page: Page) {
  const selectors = [
    'button:has-text("I agree")',
    'button:has-text("I do not agree")',
    'button:has-text("Do not agree")',
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("Agree")',
    'button:has-text("Akkoord")',
    'button:has-text("Accepteren")',
    'button:has-text("Weigeren")',
    'button:has-text("Reject")',
    'button:has-text("Reject all")',
    'button:has-text("No, thanks")',
    'button:has-text("Not now")',
    'button:has-text("Maybe later")',
    'button:has-text("Log in later")',
    'button[aria-label="Close"]',
    'button[aria-label="close"]',
    'button[aria-label="Sluiten"]',
    'button[aria-label="Dismiss sign-in info."]',
    '[aria-label="Close"]',
    '[aria-label="close"]',
    '[aria-label="Sluiten"]',
    '[data-testid="header-sign-in-modal-close-button"]',
  ];

  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();

      if (await element.isVisible({ timeout: 500 })) {
        await element.click({ timeout: 800 });
        await page.waitForTimeout(300);
      }
    } catch {}
  }

  try {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  } catch {}
}

function readWebsitesCsv(filePath: string): Website[] {
  const csv = fs.readFileSync(filePath, "utf-8");

  const lines = csv
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(1).map((line) => {
    const [id, url, category, expected_clutter_level] = line.split(",");

    return {
      id,
      url,
      category,
      expected_clutter_level,
    };
  });
}

function readExistingResults(filePath: string) {
  const results = new Map<string, string>();

  if (!fs.existsSync(filePath)) {
    return results;
  }

  const csv = fs.readFileSync(filePath, "utf-8");

  const lines = csv
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.slice(1)) {
    const [id] = line.split(",");

    if (id) {
      results.set(id, line);
    }
  }

  return results;
}

main();