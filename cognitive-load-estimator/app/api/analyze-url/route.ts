import crypto from "crypto";
import { NextResponse } from "next/server";
import { chromium, Browser } from "playwright";
import { analyzeScreenshot } from "@/lib/analyzeScreenshot";

let browserPromise: Promise<Browser> | null = null;

const cache = new Map<string, unknown>();

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
    });
  }

  return browserPromise;
}

export async function POST(request: Request) {
  const body = await request.json();

  const url = body.url as string | undefined;

  if (!url) {
    return NextResponse.json(
      { error: "No URL provided" },
      { status: 400 }
    );
  }

  const normalizedUrl = normalizeUrl(url);

  const includeHeatmap = body.includeHeatmap === true;

  const cacheKey = crypto
    .createHash("sha256")
    .update(normalizedUrl)
    .digest("hex");

  const cached = cache.get(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  const browser = await getBrowser();

  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 1000,
    },
  });

  try {
    await page.goto(normalizedUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    await page.waitForTimeout(1000);

    const screenshot = await page.screenshot({
      fullPage: false,
      type: "png",
    });

    const result = await analyzeScreenshot(
      Buffer.from(screenshot),
      normalizedUrl,
      {
        includeHeatmap,
      }
    );

    cache.set(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Could not analyze this URL" },
      { status: 500 }
    );
  } finally {
    await page.close();
  }
}

function normalizeUrl(url: string) {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `https://${url}`;
}