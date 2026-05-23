// Anomaly detection on a series of samples — z-score based. A real backend
// (pandas/NumPy per the landing) would do rolling-window analysis with
// seasonality; this serves the same shape so the UI can render anomalies now.

import type { Sample } from "@/domain/types";

export type AnomalyMetric =
  | "ph"
  | "oxygen"
  | "turbidity"
  | "temperature"
  | "pollution"
  | "microplastic";

export type Anomaly = {
  sampleId: string;
  metric: AnomalyMetric;
  value: number;
  mean: number;
  sigma: number;
  z: number; // standard deviations from mean (signed)
  ts: number; // epoch ms
};

// Detects anomalies in a single metric across the given samples.
// Point is anomalous if |z-score| exceeds zThreshold and there's enough data.
export function detectAnomalies(
  samples: Sample[],
  metric: AnomalyMetric,
  zThreshold = 2.5,
): Anomaly[] {
  if (samples.length < 6) return [];
  const values = samples.map((s) => s[metric] as number);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  const sigma = Math.sqrt(variance);
  if (sigma < 1e-6) return [];
  const out: Anomaly[] = [];
  samples.forEach((s, i) => {
    const z = (values[i] - mean) / sigma;
    if (Math.abs(z) >= zThreshold) {
      out.push({
        sampleId: s.id,
        metric,
        value: values[i],
        mean: +mean.toFixed(3),
        sigma: +sigma.toFixed(3),
        z: +z.toFixed(2),
        ts: new Date(s.date).getTime(),
      });
    }
  });
  return out;
}

// Scans all key metrics, returns flat anomaly list.
export function detectAllAnomalies(samples: Sample[], zThreshold = 2.5): Anomaly[] {
  const metrics: AnomalyMetric[] = [
    "ph",
    "oxygen",
    "turbidity",
    "temperature",
    "pollution",
    "microplastic",
  ];
  return metrics.flatMap((m) => detectAnomalies(samples, m, zThreshold));
}
