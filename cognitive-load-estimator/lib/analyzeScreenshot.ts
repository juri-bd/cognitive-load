import { calculateVisualClutter } from "@/lib/metrics/visualClutter";
import { calculateContourDensity } from "@/lib/metrics/contourDensity";
import { calculateColorVariability } from "@/lib/metrics/colorVariability";
import { calculateFigureGroundContrast } from "@/lib/metrics/figureGroundContrast";
import { calculateLayoutRegularity } from "@/lib/metrics/layoutRegularity";
import { generateFrictionHeatmap } from "@/lib/heatmaps/frictionHeatmap";

export async function analyzeScreenshot(buffer: Buffer, pageName: string) {
  const visualClutterScore = await calculateVisualClutter(buffer);
  const contourDensityScore = await calculateContourDensity(buffer);
  const colorVariabilityScore = await calculateColorVariability(buffer);
  const figureGroundContrastScore = await calculateFigureGroundContrast(buffer);
  const layoutRegularityScore = await calculateLayoutRegularity(buffer);
  const frictionHeatmap = await generateFrictionHeatmap(buffer);

  const overallScore = calculateOverallScore([
    visualClutterScore,
    contourDensityScore,
    colorVariabilityScore,
    figureGroundContrastScore,
    layoutRegularityScore,
  ]);

  const severity = getSeverity(overallScore);

  return {
    pageName,
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
    heatmaps: {
      friction: frictionHeatmap,
    },
  };
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