# Cognitive Load Estimator

A research-oriented web application that estimates visual and cognitive interface complexity using rule-based computer vision metrics.

The system analyzes screenshots or live websites and produces:
- visual complexity scores,
- cognitive load indicators,
- friction heatmaps,
- benchmark comparisons,
- and human-calibrated rankings.

Built with:
- Next.js,
- TypeScript,
- Sharp,
- Playwright.

---

# Features

## Screenshot analysis

Upload any UI screenshot and automatically analyze:
- visual clutter,
- contour density,
- color variability,
- figure-ground contrast,
- layout regularity.

The app generates:
- an overall complexity score,
- metric breakdowns,
- detailed findings,
- visual friction heatmaps.

---

## Website URL analysis

Paste a public website URL.

The system:
1. opens the website using Playwright,
2. captures a screenshot,
3. runs the same metric pipeline automatically.

---

## Friction heatmaps

The application generates a visual friction heatmap that highlights regions with:
- high edge density,
- high color variation,
- high local contrast,
- low whitespace.

The heatmap is designed to visualize areas that may contribute to increased cognitive processing demands.

---

## Benchmark system

The project includes a benchmarking pipeline for evaluating real-world websites.

The benchmark system:
1. loads websites from a CSV dataset,
2. captures screenshots automatically,
3. calculates all metrics,
4. stores results for later calibration and evaluation.

---

## Human ranking calibration

The project includes a manual ranking interface at:

```text
/rank
```

Users compare screenshots in small groups and rank:
- least cluttered,
- middle,
- most cluttered.

These rankings are later used to optimize metric weighting.

---

## Weight optimization

The project includes a simple learning-to-rank optimizer.

The optimizer:
- reads benchmark results,
- reads human rankings,
- converts rankings into pairwise comparisons,
- searches for metric weight combinations,
- finds weights that best match human judgments.

This creates a calibrated overall complexity score.

---

# Metric System

The current system includes five rule-based metrics.

## 1. Visual Clutter

Measures:
- edge density,
- visual fragmentation,
- amount of simultaneous visual detail.

Higher score:
- visually noisy interfaces,
- fragmented layouts,
- dense visual structure.

---

## 2. Contour Density

Measures:
- concentration of contours,
- amount of object boundaries,
- local visual structure density.

Higher score:
- many UI regions,
- many cards,
- dense segmentation.

---

## 3. Color Variability

Measures:
- number of color groups,
- color entropy,
- visual palette variability.

Higher score:
- many competing colors,
- visually noisy palettes.

---

## 4. Figure-Ground Contrast

Measures:
- local brightness contrast,
- perceptual separation intensity,
- edge salience.

Higher score:
- stronger visual competition,
- higher perceptual load.

---

## 5. Layout Regularity

Measures:
- spatial consistency,
- distribution regularity,
- alignment stability.

Higher score:
- irregular layouts,
- inconsistent structure,
- chaotic spacing.

---

# Project Structure

```text
app/
  api/
    analyze/
    analyze-url/
    rankings/
    screenshot/
  rank/
  page.tsx

lib/
  metrics/
  heatmaps/
  browser/
  analyzeScreenshot.ts

scripts/
  runBenchmark.ts
  optimizeWeights.ts

data/
  websites.csv
  ranking-batches.csv
  results.csv
  screenshots/
  human-rankings.json
```

---

# Benchmark Pipeline

## Website dataset

Stored in:

```text
data/websites.csv
```

Contains:
- URLs,
- categories,
- expected clutter levels.

---

## Running benchmarks

Run:

```bash
npm run benchmark
```

This:
1. opens all websites,
2. captures screenshots,
3. calculates metrics,
4. saves benchmark results.

Results are stored in:

```text
data/results.csv
```

Screenshots are stored in:

```text
data/screenshots/
```

---

# Manual Ranking System

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/rank
```

The ranking interface:
- displays screenshot batches,
- allows clutter comparison,
- stores rankings automatically.

Rankings are stored in:

```text
data/human-rankings.json
```

---

# Weight Optimization

Run:

```bash
npm run optimize
```

The optimizer:
- compares metric scores against human rankings,
- searches for better metric weights,
- prints the best-performing weight configuration.

The learned weights can then be copied into:

```text
lib/analyzeScreenshot.ts
```

---

# Installation

Install dependencies:

```bash
npm install
```

Install Playwright browser binaries:

```bash
npx playwright install chromium
```

---

# Development

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Current Research Direction

The project is moving toward:
- empirically calibrated visual complexity estimation,
- human-ranked interface evaluation,
- explainable rule-based cognitive load scoring,
- ranking-based metric optimization.

The system intentionally avoids black-box deep learning approaches in favor of:
- interpretability,
- controllability,
- explainability,
- small-data optimization.

---

# Future Improvements

Potential future additions:
- OCR-based text density analysis,
- saliency prediction,
- gaze estimation,
- semantic grouping analysis,
- dashboard-specific metrics,
- ML-based ranking models,
- percentile normalization,
- live browser extension integration,
- longitudinal UI tracking.

---

# Tech Stack

- Next.js
- TypeScript
- Sharp
- Playwright
- React
- Tailwind CSS

---

# License

MIT