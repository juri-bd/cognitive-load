import crypto from "crypto";
import { NextResponse } from "next/server";
import { analyzeScreenshot } from "@/lib/analyzeScreenshot";

const cache = new Map<string, unknown>();

export async function POST(request: Request) {
  const formData = await request.formData();

  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No image uploaded" },
      { status: 400 }
    );
  }

  const includeHeatmap = formData.get("heatmap") === "true";

  const buffer = Buffer.from(await file.arrayBuffer());

  const hash = crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");

  const cached = cache.get(hash);

  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const result = await analyzeScreenshot(buffer, file.name, {
    includeHeatmap,
  });

  cache.set(hash, result);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}