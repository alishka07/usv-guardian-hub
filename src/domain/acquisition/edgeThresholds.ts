// Edge-side threshold check — fast binary "norm / alarm" verdict that mirrors
// what an on-buoy/USV firmware (ESP32 + MicroPython per the landing) would run
// locally before transmitting. Keep it simple and side-effect free.

import type { Sample, Thresholds } from "@/domain/types";

export type EdgeAlarm = {
  metric: "ph" | "oxygen" | "turbidity" | "temperature" | "pollution";
  severity: "warn" | "critical";
  value: number;
  bound: number;
};

type Probe = Pick<Sample, "ph" | "oxygen" | "turbidity" | "temperature" | "pollution">;

export function checkEdgeThresholds(s: Probe, t: Thresholds): EdgeAlarm[] {
  const out: EdgeAlarm[] = [];

  if (s.ph < t.ph.min) out.push({ metric: "ph", severity: "critical", value: s.ph, bound: t.ph.min });
  else if (s.ph < t.ph.warnMin) out.push({ metric: "ph", severity: "warn", value: s.ph, bound: t.ph.warnMin });
  if (s.ph > t.ph.max) out.push({ metric: "ph", severity: "critical", value: s.ph, bound: t.ph.max });
  else if (s.ph > t.ph.warnMax) out.push({ metric: "ph", severity: "warn", value: s.ph, bound: t.ph.warnMax });

  if (s.oxygen < t.oxygen.critical) out.push({ metric: "oxygen", severity: "critical", value: s.oxygen, bound: t.oxygen.critical });
  else if (s.oxygen < t.oxygen.warn) out.push({ metric: "oxygen", severity: "warn", value: s.oxygen, bound: t.oxygen.warn });

  if (s.turbidity > t.turbidity.critical) out.push({ metric: "turbidity", severity: "critical", value: s.turbidity, bound: t.turbidity.critical });
  else if (s.turbidity > t.turbidity.warn) out.push({ metric: "turbidity", severity: "warn", value: s.turbidity, bound: t.turbidity.warn });

  if (s.temperature > t.temperature.warn) out.push({ metric: "temperature", severity: "warn", value: s.temperature, bound: t.temperature.warn });

  if (s.pollution >= t.pollution.danger) out.push({ metric: "pollution", severity: "critical", value: s.pollution, bound: t.pollution.danger });
  else if (s.pollution >= t.pollution.warn) out.push({ metric: "pollution", severity: "warn", value: s.pollution, bound: t.pollution.warn });

  return out;
}

export function hasCritical(alarms: EdgeAlarm[]): boolean {
  return alarms.some((a) => a.severity === "critical");
}
