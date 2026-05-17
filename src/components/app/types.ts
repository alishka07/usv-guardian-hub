export type Robot = {
  id: string;
  name: string;
  model: string;
  serial: string;
  status: "online" | "offline" | "rtl";
  battery: number;
  signal: number;
  position: { x: number; y: number };
  heading: number; // degrees
  speed: number; // m/s
  color: string; // oklch token expression
  lastSeen?: string;
  samplesPerTrip: number;
  waypoints: { x: number; y: number }[];
  waypointIdx: number;
  trail: { x: number; y: number }[];
  batteryHistory: number[];
};

export type Sample = {
  id: string;
  robotId: string;
  position: { x: number; y: number };
  date: string;
  ph: number;
  oxygen: number;
  turbidity: number;
  temperature: number;
};
