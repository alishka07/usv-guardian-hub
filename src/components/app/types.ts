export type Robot = {
  id: string;
  name: string;
  model: string;
  serial: string;
  status: "online" | "offline" | "rtl" | "mission";
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

export type EventSeverity = "success" | "danger" | "warning" | "critical";
export type EventType =
  | "connected"
  | "disconnected"
  | "low_battery"
  | "rtl"
  | "mission_start"
  | "mission_done";

export type EventLogEntry = {
  id: string;
  ts: number; // epoch ms
  robotId: string;
  robotName: string;
  type: EventType;
  severity: EventSeverity;
  message: string;
};
