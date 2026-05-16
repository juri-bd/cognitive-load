import fs from "fs";
import path from "path";

type MetricRow = {
  id: string;
  visualClutter: number;
  contourDensity: number;
  colorVariability: number;
  figureGroundContrast: number;
  layoutRegularity: number;
};

type Ranking = {
  batchId: string;
  least: string;
  middle: string;
  most: string;
};

type Weights = {
  visualClutter: number;
  contourDensity: number;
  colorVariability: number;
  figureGroundContrast: number;
  layoutRegularity: number;
};

type Comparison = {
  higher: string;
  lower: string;
};

type Evaluation = {
  weights: Weights;
  accuracy: number;
  correct: number;
  total: number;
  averageMargin: number;
};

const resultsPath = path.join(process.cwd(), "data", "results.csv");
const rankingsPath = path.join(process.cwd(), "data", "human-rankings.json");
const bestWeightsPath = path.join(process.cwd(), "data", "best-weights.json");
const historyPath = path.join(process.cwd(), "data", "optimization-history.csv");

const ITERATIONS = 20_000;
const START_TEMPERATURE = 0.08;
const END_TEMPERATURE = 0.0005;
const START_MUTATION = 0.25;
const END_MUTATION = 0.005;
const RANDOM_RESTARTS = 20;

const MIN_WEIGHT = 0.03;

const STARTING_POINTS: Weights[] = [
  {
    visualClutter: 0.2,
    contourDensity: 0.2,
    colorVariability: 0.2,
    figureGroundContrast: 0.2,
    layoutRegularity: 0.2,
  },
  {
    visualClutter: 0.35,
    contourDensity: 0.2,
    colorVariability: 0.05,
    figureGroundContrast: 0.25,
    layoutRegularity: 0.15,
  },
  {
    visualClutter: 0.2,
    contourDensity: 0.25,
    colorVariability: 0.05,
    figureGroundContrast: 0.35,
    layoutRegularity: 0.15,
  },
  {
    visualClutter: 0.1,
    contourDensity: 0.2,
    colorVariability: 0.05,
    figureGroundContrast: 0.45,
    layoutRegularity: 0.2,
  },
  {
    visualClutter: 0.1,
    contourDensity: 0.1,
    colorVariability: 0.05,
    figureGroundContrast: 0.5,
    layoutRegularity: 0.25,
  },
];

const metricKeys: Array<keyof Weights> = [
  "visualClutter",
  "contourDensity",
  "colorVariability",
  "figureGroundContrast",
  "layoutRegularity",
];

const metrics = readResults(resultsPath);
const rankings = readRankings(rankingsPath);
const comparisons = createPairwiseComparisons(rankings);

let globalBest: Evaluation | null = null;

const historyRows = [
  [
    "restart",
    "iteration",
    "temperature",
    "mutation_scale",
    "current_accuracy",
    "best_accuracy",
    "current_margin",
    "best_margin",
    "visual_clutter",
    "contour_density",
    "color_variability",
    "figure_ground_contrast",
    "layout_regularity",
  ].join(","),
];

for (let restart = 1; restart <= RANDOM_RESTARTS; restart++) {
  let currentWeights =
    STARTING_POINTS[restart - 1] ?? randomWeights();

  let current = evaluateCandidate(currentWeights);

  let localBest = current;

  if (!globalBest || isBetter(current, globalBest)) {
    globalBest = current;
  }

  for (let iteration = 1; iteration <= ITERATIONS; iteration++) {
    const progress = iteration / ITERATIONS;

    const temperature = interpolateExponential(
      START_TEMPERATURE,
      END_TEMPERATURE,
      progress
    );

    const mutationScale = interpolateExponential(
      START_MUTATION,
      END_MUTATION,
      progress
    );

    const candidateWeights = mutateWeights(current.weights, mutationScale);
    const candidate = evaluateCandidate(candidateWeights);

    const delta = objective(candidate) - objective(current);

    const shouldAccept =
      delta >= 0 || Math.random() < Math.exp(delta / temperature);

    if (shouldAccept) {
      current = candidate;
    }

    if (isBetter(current, localBest)) {
      localBest = current;
    }

    if (!globalBest || isBetter(current, globalBest)) {
      globalBest = current;
      saveBest(bestWeightsPath, globalBest);
    }

    if (iteration % 500 === 0) {
      historyRows.push(
        formatHistoryRow(
          restart,
          iteration,
          temperature,
          mutationScale,
          current,
          globalBest
        )
      );

      console.log(
        `restart ${restart}/${RANDOM_RESTARTS} | iter ${iteration}/${ITERATIONS} | current ${(current.accuracy * 100).toFixed(
          1
        )}% | best ${((globalBest?.accuracy ?? 0) * 100).toFixed(1)}%`
      );
    }
  }

  console.log(`\nRestart ${restart} best:`);
  printResult(localBest);
}

if (!globalBest) {
  throw new Error("No valid weights found.");
}

fs.writeFileSync(historyPath, historyRows.join("\n"));
saveBest(bestWeightsPath, globalBest);

console.log("\nFinal best:");
printResult(globalBest);

console.log("\nSaved best weights to:");
console.log(bestWeightsPath);

console.log("\nSaved optimization history to:");
console.log(historyPath);

console.log("\nPaste into lib/analyzeScreenshot.ts:");
console.log(formatWeightsForCode(globalBest.weights));

function readResults(filePath: string) {
  const csv = fs.readFileSync(filePath, "utf-8");

  const lines = csv
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines.slice(1);
  const result = new Map<string, MetricRow>();

  for (const row of rows) {
    const columns = row.split(",");

    const [
      id,
      ,
      ,
      ,
      overallScore,
      ,
      visualClutter,
      contourDensity,
      colorVariability,
      figureGroundContrast,
      layoutRegularity,
    ] = columns;

    if (!id || overallScore === "ERROR") continue;

    result.set(id, {
      id,
      visualClutter: Number(visualClutter),
      contourDensity: Number(contourDensity),
      colorVariability: Number(colorVariability),
      figureGroundContrast: Number(figureGroundContrast),
      layoutRegularity: Number(layoutRegularity),
    });
  }

  return result;
}

function readRankings(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error("No human-rankings.json found yet.");
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Ranking[];
}

function createPairwiseComparisons(rankings: Ranking[]): Comparison[] {
  const comparisons: Comparison[] = [];

  for (const ranking of rankings) {
    comparisons.push({
      higher: ranking.middle,
      lower: ranking.least,
    });

    comparisons.push({
      higher: ranking.most,
      lower: ranking.middle,
    });

    comparisons.push({
      higher: ranking.most,
      lower: ranking.least,
    });
  }

  return comparisons;
}

function evaluateCandidate(weights: Weights): Evaluation {
  const result = evaluateWeights(weights, metrics, comparisons);

  return {
    weights,
    ...result,
  };
}

function evaluateWeights(
  weights: Weights,
  metrics: Map<string, MetricRow>,
  comparisons: Comparison[]
) {
  let correct = 0;
  let total = 0;
  let marginTotal = 0;

  for (const comparison of comparisons) {
    const higher = metrics.get(comparison.higher);
    const lower = metrics.get(comparison.lower);

    if (!higher || !lower) continue;

    const higherScore = weightedScore(higher, weights);
    const lowerScore = weightedScore(lower, weights);

    const margin = higherScore - lowerScore;

    if (margin > 0) {
      correct++;
    }

    marginTotal += margin;
    total++;
  }

  return {
    correct,
    total,
    accuracy: total === 0 ? 0 : correct / total,
    averageMargin: total === 0 ? 0 : marginTotal / total,
  };
}

function weightedScore(row: MetricRow, weights: Weights) {
  return (
    weights.visualClutter * row.visualClutter +
    weights.contourDensity * row.contourDensity +
    weights.colorVariability * row.colorVariability +
    weights.figureGroundContrast * row.figureGroundContrast +
    weights.layoutRegularity * row.layoutRegularity
  );
}

function objective(result: Evaluation) {
  return result.accuracy + result.averageMargin * 0.0001;
}

function mutateWeights(weights: Weights, scale: number): Weights {
  const values = metricKeys.map((key) => {
    const current = weights[key];
    const mutated = current + randomNormal() * scale;
    return Math.max(MIN_WEIGHT, mutated);
  });

  return normalizeWeights(values);
}

function randomWeights(): Weights {
  const values = metricKeys.map(() => MIN_WEIGHT + Math.random() ** 2);
  return normalizeWeights(values);
}

function equalWeights(): Weights {
  return {
    visualClutter: 0.2,
    contourDensity: 0.2,
    colorVariability: 0.2,
    figureGroundContrast: 0.2,
    layoutRegularity: 0.2,
  };
}

function normalizeWeights(values: number[]): Weights {
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return equalWeights();
  }

  return {
    visualClutter: values[0] / total,
    contourDensity: values[1] / total,
    colorVariability: values[2] / total,
    figureGroundContrast: values[3] / total,
    layoutRegularity: values[4] / total,
  };
}

function randomNormal() {
  const u = 1 - Math.random();
  const v = Math.random();

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function interpolateExponential(start: number, end: number, progress: number) {
  return start * Math.pow(end / start, progress);
}

function isBetter(a: Evaluation, b: Evaluation) {
  return (
    a.accuracy > b.accuracy ||
    (a.accuracy === b.accuracy && a.averageMargin > b.averageMargin)
  );
}

function roundWeights(weights: Weights): Weights {
  return {
    visualClutter: Number(weights.visualClutter.toFixed(4)),
    contourDensity: Number(weights.contourDensity.toFixed(4)),
    colorVariability: Number(weights.colorVariability.toFixed(4)),
    figureGroundContrast: Number(weights.figureGroundContrast.toFixed(4)),
    layoutRegularity: Number(weights.layoutRegularity.toFixed(4)),
  };
}

function saveBest(filePath: string, best: Evaluation) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        accuracy: best.accuracy,
        correct: best.correct,
        total: best.total,
        averageMargin: best.averageMargin,
        weights: roundWeights(best.weights),
      },
      null,
      2
    )
  );
}

function printResult(result: Evaluation) {
  console.log({
    accuracy: `${(result.accuracy * 100).toFixed(1)}%`,
    correct: `${result.correct}/${result.total}`,
    averageMargin: Number(result.averageMargin.toFixed(3)),
    weights: roundWeights(result.weights),
  });
}

function formatHistoryRow(
  restart: number,
  iteration: number,
  temperature: number,
  mutationScale: number,
  current: Evaluation,
  best: Evaluation | null
) {
  const weights = roundWeights(current.weights);

  return [
    restart,
    iteration,
    temperature,
    mutationScale,
    current.accuracy,
    best?.accuracy ?? "",
    current.averageMargin,
    best?.averageMargin ?? "",
    weights.visualClutter,
    weights.contourDensity,
    weights.colorVariability,
    weights.figureGroundContrast,
    weights.layoutRegularity,
  ].join(",");
}

function formatWeightsForCode(weights: Weights) {
  const rounded = roundWeights(weights);

  return `const weights = {
  visualClutter: ${rounded.visualClutter},
  contourDensity: ${rounded.contourDensity},
  colorVariability: ${rounded.colorVariability},
  figureGroundContrast: ${rounded.figureGroundContrast},
  layoutRegularity: ${rounded.layoutRegularity},
};`;
}