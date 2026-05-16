import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const screenshotPath = path.join(
    process.cwd(),
    "data",
    "screenshots",
    `${id}.png`
  );

  if (!fs.existsSync(screenshotPath)) {
    return NextResponse.json(
      { error: "Screenshot not found" },
      { status: 404 }
    );
  }

  const image = fs.readFileSync(screenshotPath);

  return new NextResponse(image, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}