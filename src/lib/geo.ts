// Converts a point in map-percentage space (x, y ∈ 0..100) to real-world
// geographic coordinates around the centre of the Kapshagay reservoir.
// Single source of truth — used by the robot panel, sample dialog and reports.

const CENTER_LAT = 43.88;
const CENTER_LON = 77.07;
const LAT_PER_PCT = 0.0015;
const LON_PER_PCT = 0.002;

export type LatLon = { lat: number; lon: number };

export function toGps(p: { x: number; y: number }): LatLon {
  return {
    lat: +(CENTER_LAT + (p.y - 50) * LAT_PER_PCT).toFixed(5),
    lon: +(CENTER_LON + (p.x - 50) * LON_PER_PCT).toFixed(5),
  };
}

// Formatted "43.88000° N, 77.07000° E" helper.
export function formatGps(p: { x: number; y: number }): string {
  const g = toGps(p);
  return `${g.lat.toFixed(5)}° N, ${g.lon.toFixed(5)}° E`;
}
