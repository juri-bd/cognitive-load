import { NextResponse } from "next/server";
import { calculateVisualClutter } from "@/lib/metrics/visualClutter";
import { calculateContourDensity } from "@/lib/metrics/contourDensity";
import { calculateColorVariability } from "@/lib/metrics/colorVariability";
import { calculateFigureGroundContrast } from "@/lib/metrics/figureGroundContrast";
import { calculateLayoutRegularity } from "@/lib/metrics/layoutRegularity";

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

  const visualClutterScore = await calculateVisualClutter(buffer);
  const contourDensityScore = await calculateContourDensity(buffer);
  const colorVariabilityScore = await calculateColorVariability(buffer);
  const figureGroundContrastScore = await calculateFigureGroundContrast(buffer);
  const layoutRegularityScore = await calculateLayoutRegularity(buffer);

  const overallScore = calculateOverallScore([
    visualClutterScore,
    contourDensityScore,
    colorVariabilityScore,
    figureGroundContrastScore,
    layoutRegularityScore,
  ]);

  const severity = getSeverity(overallScore);

  return NextResponse.json({
    pageName: file.name,
    overallScore,
    severity,
    summary:
      "This screenshot has been analyzed using rule-based visual complexity metrics grounded in interface complexity research.",
    dimensions: {
      visualClutter: visualClutterScore,
      contourDensity: contourDensityScore,
      colorVariability: colorVariabilityScore,
      figureGroundContrast: figureGroundContrastScore,
      layoutRegularity: layoutRegularityScore,
    },
  });
}

function calculateOverallScore(scores: number[]) {
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
}

function getSeverity(score: number): "Low" | "Moderate" | "High" {
  if (score >= 70) return "High";
  if (score >= 40) return "Moderate";
  return "Low";
}