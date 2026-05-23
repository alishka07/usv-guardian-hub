// Microparticle (microplastic) distribution model for the Kapshagay reservoir.
//
// Microplastics enter the water mostly through river inflows and urban runoff,
// so concentration is highest near those sources and decays into open water.
// `microplasticAt` gives a deterministic spatial field; samples add light noise.

export type MicroTone = "success" | "warning" | "danger" | "critical";

type Source = { x: number; y: number; strength: number; reach: number; label: string };

// Coordinates are in map-percentage space (matches MapView / mock-data).
export const MICRO_SOURCES: Source[] = [
  { x: 90, y: 34, strength: 2400, reach: 50, label: "Устье р. Есиль" },
  { x: 62, y: 60, strength: 1300, reach: 32, label: "Промзона Астаны" },
  { x: 16, y: 64, strength: 900, reach: 26, label: "Сток ТЭЦ-2" },
];

const BASELINE = 180; // background concentration in open water, particles/m³

// Gaussian falloff from each inflow source.
export function microplasticAt(pos: { x: number; y: number }, jitter = 0): number {
  let v = BASELINE;
  for (const s of MICRO_SOURCES) {
    const d = Math.hypot(pos.x - s.x, pos.y - s.y);
    v += s.strength * Math.exp(-(d * d) / (2 * s.reach * s.reach));
  }
  return Math.max(0, Math.round(v * (1 + jitter)));
}

export type ZoneId = "west" | "center" | "east";

export const ZONES: { id: ZoneId; label: string; short: string; from: number; to: number }[] = [
  { id: "west", label: "Западный плёс · плотина", short: "Запад", from: 0, to: 32 },
  { id: "center", label: "Центральный плёс · Астана", short: "Центр", from: 32, to: 62 },
  { id: "east", label: "Восточный плёс · устье Есиль", short: "Восток", from: 62, to: 100 },
];

export function zoneOf(pos: { x: number }): ZoneId {
  if (pos.x < 32) return "west";
  if (pos.x < 62) return "center";
  return "east";
}

// Concentration scale → human label + colour tone.
export function microplasticLabel(v: number): { label: string; tone: MicroTone } {
  if (v < 500) return { label: "Низкая", tone: "success" };
  if (v < 1200) return { label: "Умеренная", tone: "warning" };
  if (v < 2200) return { label: "Высокая", tone: "danger" };
  return { label: "Критическая", tone: "critical" };
}

export const MICRO_TONE_CLASS: Record<
  MicroTone,
  { text: string; bg: string; border: string; bar: string }
> = {
  success: {
    text: "text-success",
    bg: "bg-success/15",
    border: "border-success/30",
    bar: "bg-success",
  },
  warning: {
    text: "text-warning",
    bg: "bg-warning/15",
    border: "border-warning/30",
    bar: "bg-warning",
  },
  danger: {
    text: "text-destructive",
    bg: "bg-destructive/15",
    border: "border-destructive/30",
    bar: "bg-destructive",
  },
  critical: {
    text: "text-[oklch(0.78_0.18_300)]",
    bg: "bg-[oklch(0.55_0.22_300)]/15",
    border: "border-[oklch(0.55_0.22_300)]/40",
    bar: "bg-[oklch(0.7_0.2_300)]",
  },
};
