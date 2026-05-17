import type { Robot, Sample } from "./types";

export const initialRobots: Robot[] = [
  { id: "r1", name: "AquaBot-01", model: "AB-X200", serial: "SN-0001-AQ", status: "online", battery: 87, signal: 92, position: { x: 28, y: 42 }, samplesPerTrip: 12 },
  { id: "r2", name: "EcoStream-02", model: "ES-Pro", serial: "SN-0002-ES", status: "offline", battery: 14, signal: 0, position: { x: 62, y: 64 }, lastSeen: "2 часа назад", samplesPerTrip: 8 },
  { id: "r3", name: "HydroScan-03", model: "HS-Lite", serial: "SN-0003-HS", status: "online", battery: 64, signal: 78, position: { x: 75, y: 28 }, samplesPerTrip: 15 },
];

const seed = (i: number) => Math.sin(i * 9301 + 49297) * 233280;
const rand = (i: number) => Math.abs(seed(i) - Math.floor(seed(i)));

export const initialSamples: Sample[] = Array.from({ length: 28 }, (_, i) => {
  const robotIdx = i % 3;
  const robot = initialRobots[robotIdx];
  const cx = robot.position.x;
  const cy = robot.position.y;
  const offX = (rand(i + 1) - 0.5) * 22;
  const offY = (rand(i + 7) - 0.5) * 22;
  return {
    id: `s${i + 1}`,
    robotId: robot.id,
    position: { x: Math.max(5, Math.min(95, cx + offX)), y: Math.max(5, Math.min(95, cy + offY)) },
    date: new Date(Date.now() - i * 3600_000 * 4).toISOString(),
    ph: +(6.5 + rand(i + 11) * 2).toFixed(2),
    oxygen: +(5 + rand(i + 13) * 6).toFixed(2),
    turbidity: +(1 + rand(i + 17) * 9).toFixed(2),
    temperature: +(12 + rand(i + 19) * 14).toFixed(1),
  };
});

export const trendData = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 1}.05`,
  ph: +(7 + Math.sin(i / 2) * 0.6).toFixed(2),
  oxygen: +(8 + Math.cos(i / 3) * 1.5).toFixed(2),
  turbidity: +(4 + Math.sin(i / 1.5) * 2.5).toFixed(2),
  temperature: +(16 + Math.sin(i / 4) * 4).toFixed(1),
}));
