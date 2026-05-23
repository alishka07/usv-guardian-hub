// Real device transport (WebSocket / MQTT) — seam for when the USV fleet is
// online. Today everything is fed by simulationSource.ts; replace this stub
// with a real client when the gateway is available.

import type { Robot, Sample } from "@/domain/types";

export type LiveSourceOptions = {
  url: string;
  onRobot?: (r: Robot) => void;
  onSample?: (s: Sample) => void;
  onError?: (e: Error) => void;
};

export type LiveSource = {
  close(): void;
  readonly status: "stub" | "connecting" | "open" | "closed" | "error";
};

export function createLiveSource(_opts: LiveSourceOptions): LiveSource {
  if (typeof console !== "undefined") {
    console.warn(
      "[liveSource] real WS/MQTT transport not implemented; falling back to simulationSource",
    );
  }
  return {
    close() {
      /* noop */
    },
    status: "stub",
  };
}
