"use client";

import { useEffect, useState } from "react";

type Batch = {
  batchId: string;
  items: string[];
};

type Ranking = {
  batchId: string;
  least: string;
  middle: string;
  most: string;
};

export default function RankPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [least, setLeast] = useState<string | null>(null);
  const [most, setMost] = useState<string | null>(null);

  const currentBatch = batches[currentIndex];

  useEffect(() => {
    async function loadData() {
      const response = await fetch("/api/rankings");
      const data = await response.json();

      setBatches(data.batches);
      setRankings(data.rankings);
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!currentBatch) return;

    const existing = rankings.find(
      (ranking) => ranking.batchId === currentBatch.batchId
    );

    setLeast(existing?.least ?? null);
    setMost(existing?.most ?? null);
  }, [currentBatch, rankings]);

  async function saveRanking() {
    if (!currentBatch || !least || !most || least === most) return;

    const middle = currentBatch.items.find(
      (item) => item !== least && item !== most
    );

    if (!middle) return;

    const ranking = {
      batchId: currentBatch.batchId,
      least,
      middle,
      most,
    };

    await fetch("/api/rankings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ranking),
    });

    setRankings((previous) => [
      ...previous.filter((item) => item.batchId !== ranking.batchId),
      ranking,
    ]);

    setCurrentIndex((previous) =>
      Math.min(previous + 1, batches.length - 1)
    );
  }

  if (!currentBatch) {
    return (
      <main className="min-h-screen bg-[#1c1c1a] p-8 text-[#f4f1ea]">
        Loading ranking batches...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1c1c1a] px-6 py-10 text-[#f4f1ea]">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.25em] text-[#a8a29a]">
              Manual ranking
            </p>

            <h1 className="text-3xl font-bold">
              Batch {currentBatch.batchId} of {batches.length}
            </h1>

            <p className="mt-3 text-[#c7c1b8]">
              First click the least cluttered screenshot. Then click the most
              cluttered screenshot. The remaining one becomes the middle.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                setCurrentIndex((previous) => Math.max(previous - 1, 0))
              }
              className="rounded-lg border border-[#5a5a53] px-4 py-2"
            >
              Previous
            </button>

            <button
              onClick={() =>
                setCurrentIndex((previous) =>
                  Math.min(previous + 1, batches.length - 1)
                )
              }
              className="rounded-lg border border-[#5a5a53] px-4 py-2"
            >
              Next
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-[#4a4a45] bg-[#2b2b28] p-5">
          <p className="text-[#c7c1b8]">
            Least cluttered:{" "}
            <span className="font-bold text-[#f4f1ea]">
              {least ?? "not selected"}
            </span>{" "}
            · Most cluttered:{" "}
            <span className="font-bold text-[#f4f1ea]">
              {most ?? "not selected"}
            </span>
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {currentBatch.items.map((id) => {
            const isLeast = least === id;
            const isMost = most === id;

            return (
              <button
                key={id}
                onClick={() => {
                  if (!least) {
                    setLeast(id);
                    return;
                  }

                  if (!most && id !== least) {
                    setMost(id);
                    return;
                  }

                  setLeast(id);
                  setMost(null);
                }}
                className={`overflow-hidden rounded-xl border bg-[#242421] text-left transition ${
                  isLeast
                    ? "border-[#6aaa38]"
                    : isMost
                    ? "border-[#d84f4f]"
                    : "border-[#4a4a45] hover:border-[#8ab4f8]"
                }`}
              >
                <div className="border-b border-[#4a4a45] p-3 font-bold">
                  Screenshot {id}
                  {isLeast && " · Least"}
                  {isMost && " · Most"}
                </div>

                <img
                  src={`/api/screenshot/${id}`}
                  alt={`Screenshot ${id}`}
                  className="h-[520px] w-full object-contain"
                />
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={saveRanking}
            disabled={!least || !most || least === most}
            className="rounded-lg bg-[#f4f1ea] px-6 py-3 font-semibold text-[#1c1c1a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save ranking and continue
          </button>
        </div>
      </section>
    </main>
  );
}