import { useEffect, useRef } from "react";
import type { Robot } from "@/domain/types";
import { BASE_POSITION } from "@/domain/acquisition/seed";

const TICK_MS = 1500;
const TRAIL_MAX = 28;
const STEP = 1.2; // % of map per tick
const LOW_BATTERY_RTL = 12; // % — robot auto-returns to base below this
const RECHARGE_RATE = 3; // % per tick while docked at base
const RECHARGE_DONE = 95; // % — leaves the dock once charged to this level
const DOCK_RADIUS = STEP * 1.5;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
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
              return {
                ...r,
                status: "online",
                signal: 60 + Math.floor(Math.random() * 20),
                battery: Math.max(r.battery, 18),
              };
            }
            return r;
          }

          // manually driven units are positioned by the operator —
          // the simulation only keeps their telemetry drifting
          if (r.manual) {
            const battery = clamp(r.battery - 0.12 + (Math.random() - 0.5) * 0.05, 0, 100);
            const signal = clamp(r.signal + (Math.random() - 0.5) * 5, 35, 99);
            const batteryHistory = [...r.batteryHistory, battery].slice(-30);
            if (battery <= 0) {
              return {
                ...r,
                battery: 0,
                signal: 0,
                speed: 0,
                status: "offline",
                manual: false,
                lastSeen: "только что",
                batteryHistory,
              };
            }
            return { ...r, battery, signal, batteryHistory };
          }

          // RTL unit that has reached the base — dock and recharge
          if (r.status === "rtl" && distance(r.position, BASE_POSITION) <= DOCK_RADIUS) {
            const battery = clamp(r.battery + RECHARGE_RATE, 0, 100);
            const status: Robot["status"] = battery >= RECHARGE_DONE ? "online" : "rtl";
            const signal = clamp(r.signal + (Math.random() - 0.5) * 4, 70, 99);
            const batteryHistory = [...r.batteryHistory, battery].slice(-30);
            return {
              ...r,
              position: { ...BASE_POSITION },
              speed: 0,
              heading: r.heading,
              signal,
              battery,
              status,
              batteryHistory,
            };
          }

          // RTL units head for the base, everyone else follows their route
          const target =
            r.status === "rtl" ? BASE_POSITION : r.waypoints[r.waypointIdx % r.waypoints.length];
          const dx = target.x - r.position.x;
          const dy = target.y - r.position.y;
          const dist = Math.hypot(dx, dy);
          let nx = r.position.x;
          let ny = r.position.y;
          let wi = r.waypointIdx;
          let heading = r.heading;
          let completedLap = false;
          if (dist < STEP) {
            nx = target.x;
            ny = target.y;
            if (r.status !== "rtl") {
              completedLap = r.waypointIdx === r.waypoints.length - 1;
              wi = (r.waypointIdx + 1) % r.waypoints.length;
            }
          } else {
            nx = r.position.x + (dx / dist) * STEP;
            ny = r.position.y + (dy / dist) * STEP;
            heading = (Math.atan2(dy, dx) * 180) / Math.PI;
          }

          // trail
          const trail = [...r.trail, { x: r.position.x, y: r.position.y }].slice(-TRAIL_MAX);

          // battery
          const drain = r.status === "rtl" ? 0.05 : r.status === "mission" ? 0.22 : 0.15;
          const battery = clamp(r.battery - drain + (Math.random() - 0.5) * 0.05, 0, 100);

          // signal flux
          const signal = clamp(r.signal + (Math.random() - 0.5) * 6, 35, 99);

          let status: Robot["status"] = r.status;

          // a mission that has completed a full circuit is considered done
          if (status === "mission" && completedLap) status = "online";

          // low battery → automatic return-to-launch
          if ((status === "online" || status === "mission") && battery <= LOW_BATTERY_RTL) {
            status = "rtl";
          }

          const batteryHistory = [...r.batteryHistory, battery].slice(-30);

          // battery fully drained → unit goes offline
          if (battery <= 0) {
            return {
              ...r,
              position: { x: nx, y: ny },
              waypointIdx: wi,
              heading,
              trail,
              battery: 0,
              signal: 0,
              speed: 0,
              status: "offline",
              lastSeen: "только что",
              batteryHistory,
            };
          }

          // rare disconnect (only for free-roaming online units; missions are stable)
          if (status === "online" && Math.random() < 0.008) {
            return {
              ...r,
              position: { x: nx, y: ny },
              status: "offline",
              signal: 0,
              speed: 0,
              lastSeen: "только что",
              trail,
              batteryHistory,
            };
          }

          // speed jitter
          const speed = +(1.6 + Math.sin(t / 4 + r.id.length) * 0.4 + Math.random() * 0.2).toFixed(
            2,
          );

          return {
            ...r,
            position: { x: nx, y: ny },
            waypointIdx: wi,
            heading,
            trail,
            battery,
            signal,
            status,
            speed,
            batteryHistory,
          };
        }),
      );
    }, TICK_MS);
    return () => clearInterval(id);
  }, [enabled, setRobots]);
}
