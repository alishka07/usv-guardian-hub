// Feature-gating per the AquaWatch landing tiers: Eco / Pro / Gov.
// Components ask `has("feature.id")` instead of hard-coding visibility.

import { useCallback, useEffect, useState } from "react";

export type Tier = "eco" | "pro" | "gov";

export type Feature =
  | "map"
  | "devices"
  | "analytics.basic"
  | "analytics.zones"
  | "analytics.anomalies"
  | "analytics.gradients"
  | "intelligence.sourceClassifier"
  | "reporting.csv"
  | "reporting.pdf"
  | "reporting.excel"
  | "settings.thresholds"
  | "diagnostics"
  | "manualControl"
  | "camera"
  | "collectSample";

const FEATURES: Record<Tier, Feature[]> = {
  eco: [
    "map",
    "devices",
    "analytics.basic",
    "reporting.csv",
    "settings.thresholds",
    "camera",
  ],
  pro: [
    "map",
    "devices",
    "analytics.basic",
    "analytics.zones",
    "analytics.anomalies",
    "intelligence.sourceClassifier",
    "reporting.csv",
    "reporting.pdf",
    "settings.thresholds",
    "diagnostics",
    "manualControl",
    "camera",
    "collectSample",
  ],
  gov: [
    "map",
    "devices",
    "analytics.basic",
    "analytics.zones",
    "analytics.anomalies",
    "analytics.gradients",
    "intelligence.sourceClassifier",
    "reporting.csv",
    "reporting.pdf",
    "reporting.excel",
    "settings.thresholds",
    "diagnostics",
    "manualControl",
    "camera",
    "collectSample",
  ],
};

export const TIER_META: Record<Tier, { label: string; series: string; description: string }> = {
  eco: {
    label: "Eco",
    series: "Series A",
    description: "Школы, эко-НКО, исследователи — базовый мониторинг и образовательные отчёты",
  },
  pro: {
    label: "Pro",
    series: "Series B",
    description: "Водоканалы, промышленность — сеть, ИИ-классификация, регуляторные отчёты",
  },
  gov: {
    label: "Gov",
    series: "Series C",
    description: "Казгидромет, Минэкологии — нацсеть, госГИС, расширенная аналитика",
  },
};

const STORAGE_KEY = "aquawatch.tier.v1";

export function loadTier(): Tier {
  if (typeof window === "undefined") return "pro";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY) as Tier | null;
    if (v === "eco" || v === "pro" || v === "gov") return v;
  } catch {
    /* ignore */
  }
  return "pro";
}

export function saveTier(t: Tier) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* ignore */
  }
}

export function hasFeature(tier: Tier, feature: Feature): boolean {
  return FEATURES[tier].includes(feature);
}

export function useTier() {
  const [tier, setState] = useState<Tier>("pro");
  useEffect(() => {
    setState(loadTier());
  }, []);
  const setTier = useCallback((t: Tier) => {
    setState(t);
    saveTier(t);
  }, []);
  const has = useCallback((f: Feature) => hasFeature(tier, f), [tier]);
  return { tier, setTier, has };
}
