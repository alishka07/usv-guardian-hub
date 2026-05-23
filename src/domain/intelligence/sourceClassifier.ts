// Pollution source classifier. Today: deterministic heuristic over the
// measurement signature. Tomorrow: Claude API call through a server endpoint
// (Cloudflare Worker — the Anthropic key MUST NOT live in the browser).

import type { Sample } from "@/domain/types";
import { POLLUTION_SOURCES, type PollutionSource } from "./sources";

export type SourceClassification = {
  source: PollutionSource;
  label: string;
  confidence: number; // 0..1
  rationale: string;
  alternatives: { source: PollutionSource; label: string; confidence: number }[];
};

// Rule-based offline classifier — runs entirely in the browser, no network.
// Replace with `classifySourceWithClaude` when the backend endpoint is wired.
export function classifySourceHeuristic(s: Sample): SourceClassification {
  const score: Record<PollutionSource, number> = {
    domestic: 0,
    agricultural: 0,
    industrial: 0,
    oilgas: 0,
    natural: 0.25, // baseline — clean water defaults to "natural"
  };

  // microplastic signature — strong indicator of urban / industrial input
  if (s.microplastic > 1200) score.domestic += 0.4;
  if (s.microplastic > 2000) score.industrial += 0.25;

  // turbidity — agricultural runoff often muddies the water
  if (s.turbidity > 7) score.agricultural += 0.35;
  if (s.turbidity > 5 && s.pollution > 50) score.domestic += 0.2;

  // oxygen depletion — thermal / chemical industrial discharge
  if (s.oxygen < 5) score.industrial += 0.35;

  // pH excursion — industrial chemistry
  if (s.ph > 8.3 || s.ph < 6.6) score.industrial += 0.25;

  // unusual warmth — thermal industrial discharge
  if (s.temperature > 25) score.industrial += 0.2;

  // high pollution + low O2 + plausible hydrocarbon signature
  if (s.pollution > 60 && s.oxygen < 6) score.oilgas += 0.3;

  // benign reading → natural
  if (s.pollution < 25 && s.microplastic < 600) score.natural += 0.3;

  const total = Object.values(score).reduce((a, b) => a + b, 0) || 1;
  const ranked = (Object.entries(score) as [PollutionSource, number][])
    .map(([source, v]) => ({
      source,
      label: POLLUTION_SOURCES[source].label,
      confidence: +(v / total).toFixed(2),
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const top = ranked[0];
  return {
    source: top.source,
    label: top.label,
    confidence: top.confidence,
    rationale: buildRationale(top.source, s),
    alternatives: ranked.slice(1),
  };
}

function buildRationale(src: PollutionSource, s: Sample): string {
  const bits: string[] = [];
  if (s.microplastic > 1200) bits.push(`микропластик ${s.microplastic} ч/м³`);
  if (s.turbidity > 5) bits.push(`мутность ${s.turbidity} NTU`);
  if (s.oxygen < 6) bits.push(`O₂ ${s.oxygen} мг/л`);
  if (s.pollution > 50) bits.push(`индекс загрязнения ${s.pollution}/100`);
  if (s.ph < 6.6 || s.ph > 8.3) bits.push(`pH ${s.ph}`);
  if (s.temperature > 25) bits.push(`T ${s.temperature}°C`);
  if (bits.length === 0) bits.push("показатели в пределах нормы");
  return `Сигнатура: ${bits.join(", ")}. Тип «${POLLUTION_SOURCES[src].label}».`;
}

// Real Claude-API classifier. Must be called through a server endpoint
// (e.g. /api/classify-source on a Cloudflare Worker) — the Anthropic key
// MUST NOT be shipped to the browser.
export async function classifySourceWithClaude(_s: Sample): Promise<SourceClassification> {
  throw new Error(
    "classifySourceWithClaude: endpoint not wired. " +
      "Implement /api/classify-source on the Worker and route this call through it.",
  );
}
