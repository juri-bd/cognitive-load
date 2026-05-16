import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { analyzeScreenshot } from "@/lib/analyzeScreenshot";

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

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 1440,
        height: 1000,
      },
    });

    await page.goto(normalizedUrl, {
      waitUntil: "networkidle",
      timeout: 20000,
    });

    const screenshot = await page.screenshot({
      fullPage: false,
      type: "png",
    });

    const result = await analyzeScreenshot(
      Buffer.from(screenshot),
      normalizedUrl
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not analyze this URL" },
      { status: 500 }
    );
  } finally {
    await browser.close();
  }
}

function normalizeUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}