import type { Robot, Sample } from "@/domain/types";
import { microplasticAt } from "@/domain/analysis/microplastic";

// Coordinates roughly trace the Kapshagay reservoir shape in %.
// Waypoints are picked inside the water polygon.

export const ROBOT_COLORS = {
  cyan: "oklch(0.82 0.15 200)",
  lime: "oklch(0.78 0.2 145)",
  amber: "oklch(0.82 0.17 75)",
} as const;

export const initialRobots: Robot[] = [
  {
    id: "r1",
    name: "AquaBot-01",
    model: "AB-X200",
    serial: "SN-0001-AQ",
    status: "online",
    battery: 87,
    signal: 92,
    position: { x: 48, y: 28 },
    heading: 70,
    speed: 2.4,
    color: ROBOT_COLORS.cyan,
    samplesPerTrip: 12,
    waypoints: [
      { x: 48, y: 28 },
      { x: 40, y: 32 },
      { x: 30, y: 35 },
      { x: 22, y: 42 },
      { x: 35, y: 40 },
      { x: 50, y: 35 },
    ],
    waypointIdx: 1,
    trail: [],
    batteryHistory: Array.from({ length: 20 }, (_, i) => 87 + Math.sin(i / 3) * 0.4),
  },
  {
    id: "r2",
    name: "EcoStream-02",
    model: "ES-Pro",
    serial: "SN-0002-ES",
    status: "offline",
    battery: 14,
    signal: 0,
    position: { x: 55, y: 48 },
    heading: 180,
    speed: 0,
    color: ROBOT_COLORS.lime,
    lastSeen: "2 часа назад",
    samplesPerTrip: 8,
    waypoints: [
      { x: 55, y: 48 },
      { x: 58, y: 55 },
      { x: 52, y: 60 },
      { x: 48, y: 52 },
    ],
    waypointIdx: 0,
    trail: [],
    batteryHistory: Array.from({ length: 20 }, () => 14),
  },
  {
    id: "r3",
    name: "HydroScan-03",
    model: "HS-Lite",
    serial: "SN-0003-HS",
    status: "online",
    battery: 64,
    signal: 78,
    position: { x: 35, y: 58 },
    heading: 250,
    speed: 1.9,
    color: ROBOT_COLORS.amber,
    samplesPerTrip: 15,
    waypoints: [
      { x: 35, y: 58 },
      { x: 28, y: 65 },
      { x: 20, y: 60 },
      { x: 25, y: 55 },
      { x: 38, y: 62 },
    ],
    waypointIdx: 1,
    trail: [],
    batteryHistory: Array.from({ length: 20 }, (_, i) => 64 + Math.cos(i / 4) * 0.6),
  },
];

const seed = (i: number) => Math.sin(i * 9301 + 49297) * 233280;
const rand = (i: number) => Math.abs(seed(i) - Math.floor(seed(i)));

// Reservoir water band as a centerline (yc) + half-height (h) over x — matches
// RESERVOIR_PATH in MapView. h is kept slightly under the true half-height so a
// margin is left to the shore. Single source of truth for "is this point in water".
const LAKE_PROFILE: { x: number; yc: number; h: number }[] = [
  { x: 6, yc: 55, h: 3 },
  { x: 14, yc: 50, h: 16 },
  { x: 22, yc: 48, h: 22 },
  { x: 35, yc: 48, h: 26 },
  { x: 48, yc: 48, h: 27 },
  { x: 56, yc: 50, h: 22 },
  { x: 62, yc: 55, h: 12 },
  { x: 66, yc: 60, h: 4 },
];

// Water band (centerline + half-height) at a given x.
export function lakeBandAt(x: number): { yc: number; h: number } {
  const p = LAKE_PROFILE;
  if (x <= p[0].x) return { yc: p[0].yc, h: p[0].h };
  if (x >= p[p.length - 1].x) return { yc: p[p.length - 1].yc, h: p[p.length - 1].h };
  for (let i = 1; i < p.length; i++) {
    if (x <= p[i].x) {
      const a = p[i - 1];
      const b = p[i];
      const f = (x - a.x) / (b.x - a.x);
      return { yc: a.yc + (b.yc - a.yc) * f, h: a.h + (b.h - a.h) * f };
    }
  }
  return { yc: p[p.length - 1].yc, h: p[p.length - 1].h };
}

// Pulls a point safely inside the water band, keeping clear of the shoreline.
export function clampToLake(pos: { x: number; y: number }): { x: number; y: number } {
  const x = Math.max(10, Math.min(62, pos.x));
  const { yc, h } = lakeBandAt(x);
  const m = h * 0.85;
  const y = Math.max(yc - m, Math.min(yc + m, pos.y));
  return { x: +x.toFixed(2), y: +y.toFixed(2) };
}

// A sample position on the lake: x from the parameter t, y inside the water band.
function pointOnLake(t: number, lateral: number) {
  const cx = 12 + t * 50; // 12 → 62 — main Talykol basin
  const { yc, h } = lakeBandAt(cx);
  const y = yc + lateral * h * 0.8; // lateral ∈ [-1,1] → safely within the band
  return { x: +cx.toFixed(2), y: +y.toFixed(2) };
}

export const initialSamples: Sample[] = Array.from({ length: 32 }, (_, i) => {
  const robotIdx = i % 3;
  const robot = initialRobots[robotIdx];
  const t = rand(i + 1);
  const lateral = (rand(i + 7) - 0.5) * 2; // -1..1
  const position = pointOnLake(t, lateral);
  return {
    id: `s${i + 1}`,
    robotId: robot.id,
    position,
    date: new Date(Date.now() - i * 3600_000 * 4).toISOString(),
    ph: +(6.5 + rand(i + 11) * 2).toFixed(2),
    oxygen: +(5 + rand(i + 13) * 6).toFixed(2),
    turbidity: +(1 + rand(i + 17) * 9).toFixed(2),
    temperature: +(12 + rand(i + 19) * 14).toFixed(1),
    depth: +(1.2 + rand(i + 23) * 18).toFixed(1),
    pollution: +(8 + rand(i + 29) * 70).toFixed(0),
    microplastic: microplasticAt(position, (rand(i + 31) - 0.5) * 0.3),
  };
});

export const trendData = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 1}.05`,
  ph: +(7 + Math.sin(i / 2) * 0.6).toFixed(2),
  oxygen: +(8 + Math.cos(i / 3) * 1.5).toFixed(2),
  turbidity: +(4 + Math.sin(i / 1.5) * 2.5).toFixed(2),
  temperature: +(16 + Math.sin(i / 4) * 4).toFixed(1),
}));

export const RESERVOIR = {
  name: "Астанинское водохранилище",
  river: "р. Есиль",
  lat: "51.1800° N",
  lon: "71.4200° E",
};

// Home dock for return-to-launch / recharge logic — matches the "base" landmark.
export const BASE_POSITION = { x: 15, y: 60 };

export const MAP_LANDMARKS = [
  { id: "dam", label: "Плотина Астана", x: 12, y: 60, kind: "infra" as const },
  { id: "base", label: "База USV", x: 18, y: 58, kind: "base" as const },
  { id: "baiterek", label: "Байтерек · Левый берег", x: 38, y: 52, kind: "city" as const },
  { id: "expo", label: "EXPO / Нур-Алем", x: 46, y: 46, kind: "place" as const },
  { id: "khanshatyr", label: "Хан-Шатыр", x: 42, y: 42, kind: "place" as const },
  { id: "akorda", label: "Ак-Орда", x: 50, y: 48, kind: "infra" as const },
  { id: "bay", label: "Залив Талдыколь", x: 62, y: 60, kind: "place" as const },
  { id: "mouth", label: "Устье р. Есиль", x: 90, y: 34, kind: "place" as const },
  { id: "astana", label: "г. Астана", x: 44, y: 70, kind: "city" as const },
];
