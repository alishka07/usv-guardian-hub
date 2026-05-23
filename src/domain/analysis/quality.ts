import { useEffect, useState, useCallback } from "react";
import { DEFAULT_THRESHOLDS, type Thresholds, type Sample } from "@/domain/types";

const STORAGE_KEY = "usv.thresholds.v1";

export function loadThresholds(): Thresholds {
  if (typeof window === "undefined") return DEFAULT_THRESHOLDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(raw) as Partial<Thresholds>;
    return {
      ph: { ...DEFAULT_THRESHOLDS.ph, ...(parsed.ph ?? {}) },
      oxygen: { ...DEFAULT_THRESHOLDS.oxygen, ...(parsed.oxygen ?? {}) },
      turbidity: { ...DEFAULT_THRESHOLDS.turbidity, ...(parsed.turbidity ?? {}) },
      temperature: { ...DEFAULT_THRESHOLDS.temperature, ...(parsed.temperature ?? {}) },
      pollution: { ...DEFAULT_THRESHOLDS.pollution, ...(parsed.pollution ?? {}) },
    };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export function saveThresholds(t: Thresholds) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

export function useThresholds() {
  const [thresholds, setState] = useState<Thresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    setState(loadThresholds());
  }, []);

  const set = useCallback((t: Thresholds) => {
    setState(t);
    saveThresholds(t);
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_THRESHOLDS);
    saveThresholds(DEFAULT_THRESHOLDS);
  }, []);

  return { thresholds, setThresholds: set, resetThresholds: reset };
}

export type QualityTone = "success" | "warning" | "danger" | "critical";

export function assessQuality(s: Sample, t: Thresholds): { score: number; tone: QualityTone; label: string } {
  let score = 100;
  if (s.ph < t.ph.min || s.ph > t.ph.max) score -= 25;
  else if (s.ph < t.ph.warnMin || s.ph > t.ph.warnMax) score -= 10;
  if (s.oxygen < t.oxygen.critical) score -= 30;
  else if (s.oxygen < t.oxygen.warn) score -= 12;
  if (s.turbidity > t.turbidity.critical) score -= 25;
  else if (s.turbidity > t.turbidity.warn) score -= 10;
  if (s.temperature > t.temperature.warn) score -= 10;
  score -= Math.max(0, s.pollution - t.pollution.ok) * 0.5;
  score = Math.max(0, Math.min(100, Math.round(score)));
  if (score >= 80) return { score, tone: "success", label: "Отлично" };
  if (score >= 60) return { score, tone: "success", label: "Хорошо" };
  if (score >= 40) return { score, tone: "warning", label: "Удовлетворительно" };
  if (score >= 20) return { score, tone: "danger", label: "Плохо" };
  return { score, tone: "critical", label: "Критическое" };
}

export function pollutionLabel(p: number, t: Thresholds): { label: string; tone: QualityTone } {
  if (p < t.pollution.ok) return { label: "Низкий", tone: "success" };
  if (p < t.pollution.warn) return { label: "Умеренный", tone: "warning" };
  if (p < t.pollution.danger) return { label: "Высокий", tone: "danger" };
  return { label: "Критический", tone: "critical" };
}
