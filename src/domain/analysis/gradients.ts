// Spatial gradients between stations — Δvalue per km and direction. This is
// the proxy for "направление и скорость распространения загрязнения" from the
// landing. Works on the latest sample per robot/station.

import type { Robot, Sample } from "@/domain/types";
import type { AnomalyMetric } from "./anomaly";

export type Gradient = {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  metric: AnomalyMetric;
  delta: number; // value at "to" minus value at "from"
  distanceKm: number;
  rate: number; // delta per km — propagation intensity proxy
  direction: number; // heading from→to in degrees, 0=E, 90=S (screen y goes down)
};

// 1 map-percentage unit ≈ 0.5 km on the Kapshagay reservoir (rough calibration —
// the lake spans ~80 % of map width and is ≈100 km long → 1 % ≈ 1.25 km in x;
// in y the buffer is narrower. We use 0.5 as a conservative average).
const PCT_TO_KM = 0.5;

export function computeGradients(
  robots: Robot[],
  latestByRobot: Map<string, Sample>,
  metric: AnomalyMetric,
): Gradient[] {
  const out: Gradient[] = [];
  for (let i = 0; i < robots.length; i++) {
    for (let j = i + 1; j < robots.length; j++) {
      const a = robots[i];
      const b = robots[j];
      const sa = latestByRobot.get(a.id);
      const sb = latestByRobot.get(b.id);
      if (!sa || !sb) continue;
      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const distKm = Math.hypot(dx, dy) * PCT_TO_KM;
      if (distKm < 0.05) continue;
      const va = sa[metric] as number;
      const vb = sb[metric] as number;
      const delta = +(vb - va).toFixed(2);
      const dir = Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360);
      out.push({
        fromId: a.id,
        toId: b.id,
        fromName: a.name,
        toName: b.name,
        metric,
        delta,
        distanceKm: +distKm.toFixed(2),
        rate: +(delta / distKm).toFixed(3),
        direction: dir,
      });
    }
  }
  return out;
}

// Latest sample per robot — helper for gradient inputs.
export function latestSampleByRobot(samples: Sample[]): Map<string, Sample> {
  const m = new Map<string, Sample>();
  for (const s of samples) {
    const prev = m.get(s.robotId);
    if (!prev || new Date(s.date).getTime() > new Date(prev.date).getTime()) m.set(s.robotId, s);
  }
  return m;
}
