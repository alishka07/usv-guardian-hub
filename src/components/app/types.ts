export type Robot = {
  id: string;
  name: string;
  model: string;
  serial: string;
  status: "online" | "offline";
  battery: number;
  signal: number;
  position: { x: number; y: number };
  lastSeen?: string;
  samplesPerTrip: number;
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
