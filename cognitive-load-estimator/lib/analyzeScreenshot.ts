import { calculateVisualClutter } from "@/lib/metrics/visualClutter";
import { calculateContourDensity } from "@/lib/metrics/contourDensity";
import { calculateColorVariability } from "@/lib/metrics/colorVariability";
import { calculateFigureGroundContrast } from "@/lib/metrics/figureGroundContrast";
import { calculateLayoutRegularity } from "@/lib/metrics/layoutRegularity";
import { generateFrictionHeatmap } from "@/lib/heatmaps/frictionHeatmap";

type MetricScores = {
  visualClutter: number;
  contourDensity: number;
  colorVariability: number;
  figureGroundContrast: number;
  layoutRegularity: number;
};

type AnalyzeScreenshotOptions = {
  includeHeatmap?: boolean;
};

const WEIGHTS: MetricScores = {
  visualClutter: 0.0055,
  contourDensity: 0.0024,
  colorVariability: 0.0098,
  figureGroundContrast: 0.7269,
  layoutRegularity: 0.2554,
};

export async function analyzeScreenshot(
  buffer: Buffer,
  pageName: string,
  options: AnalyzeScreenshotOptions = {}
) {
  const includeHeatmap = options.includeHeatmap ?? true;

  const [
    visualClutterScore,
    contourDensityScore,
    colorVariabilityScore,
    figureGroundContrastScore,
    layoutRegularityScore,
    frictionHeatmap,
  ] = await Promise.all([
    calculateVisualClutter(buffer),
    calculateContourDensity(buffer),
    calculateColorVariability(buffer),
    calculateFigureGroundContrast(buffer),
    calculateLayoutRegularity(buffer),
    includeHeatmap ? generateFrictionHeatmap(buffer) : Promise.resolve(null),
  ]);

  const dimensions: MetricScores = {
    visualClutter: visualClutterScore,
    contourDensity: contourDensityScore,
    colorVariability: colorVariabilityScore,
    figureGroundContrast: figureGroundContrastScore,
    layoutRegularity: layoutRegularityScore,
  };

  const overallScore = calculateWeightedOverallScore(dimensions);

  return {
    pageName,
    overallScore,
    severity: getSeverity(overallScore),
    summary:
      "This screenshot has been analyzed using rule-based visual complexity metrics grounded in interface complexity research.",
    dimensions,
    heatmaps: {
      friction: frictionHeatmap,
    },
  };
}

function calculateWeightedOverallScore(scores: MetricScores) {
  const score = Object.entries(WEIGHTS).reduce((total, [key, weight]) => {
    return total + weight * scores[key as keyof MetricScores];
  }, 0);

  return Math.round(score);
}

function getSeverity(score: number): "Low" | "Moderate" | "High" {
  if (score >= 70) return "High";
  if (score >= 40) return "Moderate";
  return "Low";
}