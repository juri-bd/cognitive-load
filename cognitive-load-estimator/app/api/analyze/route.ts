import { NextResponse } from "next/server";
import { analyzeScreenshot } from "@/lib/analyzeScreenshot";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No image uploaded" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await analyzeScreenshot(buffer, file.name);

  return NextResponse.json(result);
}