"use client";

import { useState } from "react";

type AnalysisState = "upload" | "loading" | "results";

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisState, setAnalysisState] =
    useState<AnalysisState>("upload");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
  }

  function handleAnalyze() {
    setAnalysisState("loading");

    setTimeout(() => {
      setAnalysisState("results");
    }, 3000);
  }

  function resetAnalysis() {
    setImagePreview(null);
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
            Usually takes 3 to 5 seconds
          </p>

          <div className="space-y-4">
            <LoadingStep text="Measuring element density..." />
            <LoadingStep text="Evaluating visual hierarchy..." />
            <LoadingStep text="Analyzing color entropy..." />
            <LoadingStep text="Scanning text complexity..." />
            <LoadingStep text="Generating recommendations..." />
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
                  Overall cognitive load
                </p>

                <h2 className="text-3xl font-bold">
                  Amazon product page{" "}
                  <SeverityBadge severity="Moderate" />
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
                    <p className="text-5xl font-bold">62</p>
                    <p className="text-sm text-[#a8a29a]">/100</p>
                  </div>
                </div>

                <p className="mt-4 font-semibold text-[#d99b25]">
                  Moderate load
                </p>
              </div>

              <div>
                <p className="mb-6 max-w-2xl text-lg leading-8 text-[#c7c1b8]">
                  This interface places above-average demands on working memory,
                  primarily because of dense layout structure, competing visual
                  focal points, and high text volume.
                </p>

                <div className="grid gap-4 md:grid-cols-5">
                  <ScoreCard title="Element density" score={81} level="High" />
                  <ScoreCard title="Color entropy" score={58} level="Moderate" />
                  <ScoreCard title="Visual hierarchy" score={52} level="Moderate" />
                  <ScoreCard title="Contrast" score={34} level="Low" />
                  <ScoreCard title="Text density" score={76} level="High" />
                </div>
              </div>
            </div>
          </div>

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
              <FindingCard
                title="Element density"
                score={81}
                severity="High"
                whatItMeans="The screen contains too many visible interface elements at once, forcing users to evaluate many possible actions simultaneously."
                howToFix="Group related actions, hide secondary controls, increase whitespace, and make the primary action visually dominant."
              />

              <FindingCard
                title="Text density"
                score={76}
                severity="High"
                whatItMeans="Large blocks of text make scanning slower and increase the amount of information users must hold in working memory."
                howToFix="Shorten copy, break long sections into smaller chunks, use clearer headings, and reduce repeated explanations."
              />

              <FindingCard
                title="Color entropy"
                score={58}
                severity="Moderate"
                whatItMeans="Several colors compete for attention, which makes it harder to understand what is important."
                howToFix="Limit accent colors, reserve strong colors for key actions, and use a more consistent visual system."
              />

              <FindingCard
                title="Visual hierarchy"
                score={52}
                severity="Moderate"
                whatItMeans="The page does not have one obvious focal point, so attention is distributed across several competing areas."
                howToFix="Increase the size, contrast, and spacing around the primary action or most important content."
              />

              <FindingCard
                title="Contrast"
                score={34}
                severity="Low"
                whatItMeans="Most key content is readable, but some secondary text may be too subtle for comfortable scanning."
                howToFix="Increase contrast on small text, reduce grey-on-grey combinations, and test important labels against WCAG contrast standards."
              />
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
          Cognitive Load Estimator
        </p>

        <h1 className="mb-6 text-4xl font-bold tracking-tight">
          How hard is your UI to look at?
        </h1>

        <p className="mx-auto mb-12 max-w-xl text-lg leading-8 text-[#c7c1b8]">
          Upload any screenshot and get an evidence-based cognitive load score
          across five dimensions.
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

        <button
          onClick={handleAnalyze}
          disabled={!imagePreview}
          className="rounded-lg bg-[#f4f1ea] px-6 py-3 font-semibold text-[#1c1c1a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Analyze screenshot
        </button>
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
  level: "Low" | "Moderate" | "High";
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
  severity: "Low" | "Moderate" | "High";
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
            How to fix it
          </p>
          <p className="leading-7 text-[#c7c1b8]">{howToFix}</p>
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: "Low" | "Moderate" | "High";
}) {
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

function getScoreColor(level: "Low" | "Moderate" | "High") {
  const classes = {
    Low: "text-3xl font-bold text-[#6aaa38]",
    Moderate: "text-3xl font-bold text-[#d99b25]",
    High: "text-3xl font-bold text-[#d84f4f]",
  };

  return classes[level];
}