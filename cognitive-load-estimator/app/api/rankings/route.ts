import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const batchesPath = path.join(process.cwd(), "data", "ranking-batches.csv");
const rankingsPath = path.join(process.cwd(), "data", "human-rankings.json");

export async function GET() {
  const batches = readBatches();

  let rankings: unknown[] = [];

  if (fs.existsSync(rankingsPath)) {
    rankings = JSON.parse(fs.readFileSync(rankingsPath, "utf-8"));
  }

  return NextResponse.json({ batches, rankings });
}

export async function POST(request: Request) {
  const ranking = await request.json();

  let rankings: unknown[] = [];

  if (fs.existsSync(rankingsPath)) {
    rankings = JSON.parse(fs.readFileSync(rankingsPath, "utf-8"));
  }

  rankings = rankings.filter(
    (item: any) => item.batchId !== ranking.batchId
  );

  rankings.push(ranking);

  fs.writeFileSync(rankingsPath, JSON.stringify(rankings, null, 2));

  return NextResponse.json({ ok: true });
}

function readBatches() {
  const csv = fs.readFileSync(batchesPath, "utf-8");

  const lines = csv
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(1).map((line) => {
    const [
      batch_id,
      slot_a,
      slot_b,
      slot_c,
      least_cluttered,
      middle,
      most_cluttered,
      notes,
    ] = line.split(",");

    return {
      batchId: batch_id,
      items: [slot_a, slot_b, slot_c],
      least_cluttered,
      middle,
      most_cluttered,
      notes,
    };
  });
}