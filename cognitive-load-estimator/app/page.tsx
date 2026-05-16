"use client";

import { useState } from "react";

type AnalysisState = "upload" | "loading" | "results";

type Severity = "Low" | "Moderate" | "High";

type AnalysisResult = {
  pageName: string;
  overallScore: number;
  severity: Severity;
  summary: string;
  dimensions: {
    visualClutter: number;
    contourDensity: number;
    colorVariability: number;
    figureGroundContrast: number;
    layoutRegularity: number;
  };
  heatmaps: {
    friction: string;
  };
};

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [analysisState, setAnalysisState] = useState<AnalysisState>("upload");
  const [urlInput, setUrlInput] = useState("");

  const dimensionScores = [
    {
      title: "Visual clutter",
      score: analysisResult?.dimensions.visualClutter ?? 0,
      whatItMeans:
        "This estimates overall visual busyness using edge density. Interfaces with many lines, borders, text strokes, icons, and image details usually score higher.",
      howToFix:
        "Reduce unnecessary borders, simplify dense regions, increase spacing between groups, and remove repeated visual noise.",
    },
    {
      title: "Contour density",
      score: analysisResult?.dimensions.contourDensity ?? 0,
      whatItMeans:
        "This estimates how many strong object boundaries and outlines appear in the screenshot.",
      howToFix:
        "Reduce excessive separators, outlines, box borders, and competing shape boundaries where they do not help structure the page.",
    },
    {
      title: "Color variability",
      score: analysisResult?.dimensions.colorVariability ?? 0,
      whatItMeans:
        "This estimates how much competing color information appears in the interface.",
      howToFix:
        "Use fewer accent colors, keep secondary colors muted, and reserve high-saturation colors for important actions or status messages.",
    },
    {
      title: "Figure-ground contrast",
      score: analysisResult?.dimensions.figureGroundContrast ?? 0,
      whatItMeans:
        "This estimates how strongly foreground content separates from the background through local luminance differences.",
      howToFix:
        "Improve weak text/background separation, but avoid making too many regions visually intense at the same time.",
    },
    {
      title: "Layout regularity",
      score: analysisResult?.dimensions.layoutRegularity ?? 0,
      whatItMeans:
        "This estimates how irregular the visual structure is. Higher scores suggest less predictable alignment or spacing patterns.",
      howToFix:
        "Use clearer grids, repeat spacing patterns, align related elements, and make rows or sections more visually consistent.",
    },
  ];

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
    setSelectedFile(file);
    setUrlInput("");

    await analyzeImage(file);
  }

  async function analyzeImage(file: File) {
    setAnalysisState("loading");

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setAnalysisResult(data);

    setTimeout(() => {
      setAnalysisState("results");
    }, 1000);
  }

  async function analyzeUrl() {
    if (!urlInput.trim()) return;

    setImagePreview(null);
    setSelectedFile(null);
    setAnalysisState("loading");

    const response = await fetch("/api/analyze-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: urlInput,
      }),
    });

  const data = await response.json();

  setAnalysisResult(data);

  setTimeout(() => {
    setAnalysisState("results");
  }, 1000);
}

  function resetAnalysis() {
    setImagePreview(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setAnalysisState("upload");
  }

  if (analysisState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1c1c1a] px-6 text-[#f4f1ea]">
        <div className="w-full max-w-xl rounded-xl border border-[#4a4a45] bg-[#2b2b28] p-10">
          <div className="mx-auto mb-8 h-16 w-16 animate-spin rounded-full border-4 border-[#4a4a45] border-t-[#35c9a5]" />

          <h2 className="mb-2 text-center text-3xl font-bold">
            Analyzing your screenshot
          </h2>

          <p className="mb-10 text-center text-[#a8a29a]">
            Calculating rule-based visual complexity metrics
          </p>

          <div className="space-y-4">
            <LoadingStep text="Estimating visual clutter..." />
            <LoadingStep text="Measuring contour density..." />
            <LoadingStep text="Analyzing color variability..." />
            <LoadingStep text="Calculating figure-ground contrast..." />
            <LoadingStep text="Estimating layout regularity..." />
          </div>
        </div>
      </main>
    );
  }

  if (analysisState === "results") {
  return (
    <main className="min-h-screen bg-[#1c1c1a] px-6 py-16 text-[#f4f1ea]">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-xl border border-[#4a4a45] bg-[#2b2b28] p-10">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#a8a29a]">
                Estimated visual complexity
              </p>

              <h2 className="text-3xl font-bold">
                {analysisResult?.pageName ?? "Uploaded screenshot"}{" "}
                <SeverityBadge
                  severity={analysisResult?.severity ?? "Moderate"}
                />
              </h2>
            </div>

            <button
              onClick={resetAnalysis}
              className="rounded-lg border border-[#5a5a53] px-4 py-2 text-sm font-medium text-[#ddd8cf] transition hover:bg-[#3a3a35]"
            >
              Analyze another
            </button>
          </div>

          <div className="mb-10 grid gap-8 md:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-[#d99b25]">
                <div className="text-center">
                  <p className="text-5xl font-bold">
                    {analysisResult?.overallScore ?? 0}
                  </p>
                  <p className="text-sm text-[#a8a29a]">/100</p>
                </div>
              </div>

              <p className="mt-4 font-semibold text-[#d99b25]">
                {analysisResult?.severity ?? "Moderate"} complexity
              </p>
            </div>

            <div>
              <p className="mb-6 max-w-2xl text-lg leading-8 text-[#c7c1b8]">
                {analysisResult?.summary ??
                  "This screenshot has been analyzed using rule-based visual complexity metrics."}
              </p>

              <div className="grid gap-4 md:grid-cols-5">
                {dimensionScores.map((dimension) => (
                  <ScoreCard
                    key={dimension.title}
                    title={dimension.title}
                    score={dimension.score}
                    level={getSeverityFromScore(dimension.score)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {analysisResult?.heatmaps.friction && (
          <div className="mb-8 rounded-xl border border-[#4a4a45] bg-[#2b2b28] p-10">
            <div className="mb-6">
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#a8a29a]">
                Visual friction heatmap
              </p>

              <h2 className="text-2xl font-bold">
                Where the interface is busiest
              </h2>

              <p className="mt-3 max-w-2xl text-[#c7c1b8]">
                Red areas indicate regions where edge density, color variation, contrast,
                and occupied space combine into higher visual friction.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#4a4a45] bg-[#242421]">
              <img
                src={analysisResult.heatmaps.friction}
                alt="Visual clutter heatmap"
                className="w-full object-contain"
              />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[#4a4a45] bg-[#2b2b28] p-10">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Detailed findings</h2>

            <div className="flex gap-2 text-sm">
              <SeverityBadge severity="High" />
              <SeverityBadge severity="Moderate" />
              <SeverityBadge severity="Low" />
            </div>
          </div>

          <div className="space-y-5">
            {dimensionScores.map((dimension) => (
              <FindingCard
                key={dimension.title}
                title={dimension.title}
                score={dimension.score}
                severity={getSeverityFromScore(dimension.score)}
                whatItMeans={dimension.whatItMeans}
                howToFix={dimension.howToFix}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={resetAnalysis}
            className="rounded-lg bg-[#f4f1ea] px-6 py-3 font-semibold text-[#1c1c1a]"
          >
            Analyze another screenshot
          </button>
        </div>
      </section>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-[#1c1c1a] px-6 py-16 text-[#f4f1ea]">
      <section className="mx-auto max-w-4xl rounded-xl border border-[#4a4a45] bg-[#2b2b28] px-8 py-14 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#a8a29a]">
          Visual Complexity Estimator
        </p>

        <h1 className="mb-6 text-4xl font-bold tracking-tight">
          How visually complex is your UI?
        </h1>

        <p className="mx-auto mb-12 max-w-xl text-lg leading-8 text-[#c7c1b8]">
          Upload any screenshot and get a rule-based visual complexity score
          across five research-grounded dimensions.
        </p>

        <label className="mx-auto mb-6 flex h-44 max-w-2xl cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#6b6b64] bg-[#242421] transition hover:border-[#8ab4f8]">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="mb-3 text-4xl text-[#a8a29a]">↑</div>

          <p className="text-lg font-semibold text-[#ddd8cf]">
            Drop a screenshot here
          </p>

          <p className="mt-1 text-sm text-[#a8a29a]">
            or click to choose a file
          </p>
        </label>

        {imagePreview && (
          <div className="mx-auto mb-8 max-w-2xl overflow-hidden rounded-xl border border-[#4a4a45] bg-[#242421]">
            <img
              src={imagePreview}
              alt="Uploaded screenshot preview"
              className="max-h-96 w-full object-contain"
            />
          </div>
        )}

        <div className="mx-auto mt-8 max-w-2xl">
          <p className="mb-4 text-sm text-[#918b83]">
            Image uploads are analyzed automatically.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="Or paste a website URL"
              className="flex-1 rounded-lg border border-[#4a4a45] bg-[#242421] px-4 py-3 text-[#f4f1ea] outline-none placeholder:text-[#918b83]"
            />

            <button
              onClick={analyzeUrl}
              disabled={!urlInput.trim()}
              className="rounded-lg bg-[#f4f1ea] px-6 py-3 font-semibold text-[#1c1c1a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Analyze URL
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoadingStep({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-[#4a4a45] bg-[#242421] p-4">
      <p className="text-[#ddd8cf]">{text}</p>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  level,
}: {
  title: string;
  score: number;
  level: Severity;
}) {
  return (
    <div className="rounded-lg border border-[#3f3f3a] bg-[#242421] p-4">
      <p className="mb-3 text-sm leading-5 text-[#a8a29a]">{title}</p>

      <div className="flex items-end justify-between">
        <p className={getScoreColor(level)}>{score}</p>
        <p className="text-xs text-[#8f8a82]">{level}</p>
      </div>
    </div>
  );
}

function FindingCard({
  title,
  score,
  severity,
  whatItMeans,
  howToFix,
}: {
  title: string;
  score: number;
  severity: Severity;
  whatItMeans: string;
  howToFix: string;
}) {
  return (
    <div className="rounded-xl border border-[#4a4a45] bg-[#242421] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold">
          {title} <span className="text-[#a8a29a]">— {score}/100</span>
        </h3>

        <SeverityBadge severity={severity} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#a8a29a]">
            What this means
          </p>
          <p className="leading-7 text-[#c7c1b8]">{whatItMeans}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#a8a29a]">
            How to reduce it
          </p>
          <p className="leading-7 text-[#c7c1b8]">{howToFix}</p>
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const classes = {
    Low: "bg-[#dff5d1] text-[#315d1c]",
    Moderate: "bg-[#fff0d5] text-[#8a5514]",
    High: "bg-[#ffe0e0] text-[#9b2c2c]",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${classes[severity]}`}
    >
      {severity}
    </span>
  );
}

function getSeverityFromScore(score: number): Severity {
  if (score >= 70) return "High";
  if (score >= 40) return "Moderate";
  return "Low";
}

function getScoreColor(level: Severity) {
  const classes = {
    Low: "text-3xl font-bold text-[#6aaa38]",
    Moderate: "text-3xl font-bold text-[#d99b25]",
    High: "text-3xl font-bold text-[#d84f4f]",
  };

  return classes[level];
}