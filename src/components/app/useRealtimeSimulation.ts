import { useEffect, useRef } from "react";
import type { Robot } from "./types";

const TICK_MS = 1500;
const TRAIL_MAX = 28;
const STEP = 1.2; // % of map per tick

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function useRealtimeSimulation(
  setRobots: React.Dispatch<React.SetStateAction<Robot[]>>,
  enabled = true,
) {
  const tickRef = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;
      setRobots((prev) =>
        prev.map((r) => {
          if (r.status === "offline") {
            // small chance to reconnect
            if (Math.random() < 0.04) {
              return { ...r, status: "online", signal: 60 + Math.floor(Math.random() * 20), battery: Math.max(r.battery, 18) };
            }
            return r;
          }

          // move towards current waypoint
          const target = r.waypoints[r.waypointIdx % r.waypoints.length];
          const dx = target.x - r.position.x;
          const dy = target.y - r.position.y;
          const dist = Math.hypot(dx, dy);
          let nx = r.position.x;
          let ny = r.position.y;
          let wi = r.waypointIdx;
          let heading = r.heading;
          if (dist < STEP) {
            nx = target.x;
            ny = target.y;
            wi = (r.waypointIdx + 1) % r.waypoints.length;
          } else {
            nx = r.position.x + (dx / dist) * STEP;
            ny = r.position.y + (dy / dist) * STEP;
            heading = (Math.atan2(dy, dx) * 180) / Math.PI;
          }

          // trail
          const trail = [...r.trail, { x: r.position.x, y: r.position.y }].slice(-TRAIL_MAX);

          // battery
          const drain = r.status === "rtl" ? 0.05 : 0.15;
          const battery = clamp(r.battery - drain + (Math.random() - 0.5) * 0.05, 0, 100);

          // signal flux
          const signal = clamp(r.signal + (Math.random() - 0.5) * 6, 35, 99);

          // rare disconnect
          let status: Robot["status"] = r.status;
          if (status === "online" && Math.random() < 0.008) {
            status = "offline";
            return { ...r, status, signal: 0, speed: 0, lastSeen: "только что", trail };
          }

          // speed jitter
          const speed = +(1.6 + Math.sin(t / 4 + r.id.length) * 0.4 + Math.random() * 0.2).toFixed(2);

          const batteryHistory = [...r.batteryHistory, battery].slice(-30);

          return { ...r, position: { x: nx, y: ny }, waypointIdx: wi, heading, trail, battery, signal, status, speed, batteryHistory };
        }),
      );
    }, TICK_MS);
    return () => clearInterval(id);
  }, [enabled, setRobots]);
}
