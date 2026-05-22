import { useEffect, useRef, useState, useCallback } from "react";
import type { Robot, EventLogEntry, EventType, EventSeverity } from "./types";

const SEV: Record<EventType, EventSeverity> = {
  connected: "success",
  disconnected: "danger",
  low_battery: "warning",
  rtl: "critical",
  estop: "critical",
  mission_start: "success",
  mission_done: "success",
};

const LABEL: Record<EventType, string> = {
  connected: "Подключение к сети",
  disconnected: "Потеря связи",
  low_battery: "Низкий заряд батареи",
  rtl: "Аварийный возврат на базу (RTL)",
  estop: "АВАРИЙНАЯ ОСТАНОВКА (ESTOP)",
  mission_start: "Запуск миссии",
  mission_done: "Миссия завершена",
};

function seed(robots: Robot[]): EventLogEntry[] {
  const now = Date.now();
  const seeds: { type: EventType; offsetMin: number; robotIdx: number; extra?: string }[] = [
    { type: "connected", offsetMin: 240, robotIdx: 0 },
    { type: "mission_start", offsetMin: 220, robotIdx: 0, extra: "маршрут M-26-05-17 · 6 точек" },
    { type: "connected", offsetMin: 180, robotIdx: 2 },
    { type: "low_battery", offsetMin: 130, robotIdx: 1, extra: "18%" },
    { type: "disconnected", offsetMin: 120, robotIdx: 1 },
    { type: "rtl", offsetMin: 60, robotIdx: 2, extra: "сигнал < 40%" },
    { type: "mission_done", offsetMin: 18, robotIdx: 0 },
  ];
  return seeds
    .map((s, i) => {
      const r = robots[s.robotIdx] ?? robots[0];
      return {
        id: `seed-${i}`,
        ts: now - s.offsetMin * 60_000,
        robotId: r.id,
        robotName: r.name,
        type: s.type,
        severity: SEV[s.type],
        message: s.extra ? `${LABEL[s.type]} · ${s.extra}` : LABEL[s.type],
      };
    })
    .reverse();
}

export function useEventLog(robots: Robot[]) {
  const [log, setLog] = useState<EventLogEntry[]>(() => seed(robots));
  const prevRef = useRef<Map<string, Robot>>(new Map(robots.map((r) => [r.id, r])));
  const counterRef = useRef(0);

  const push = useCallback((robot: Robot, type: EventType, extra?: string) => {
    counterRef.current += 1;
    const entry: EventLogEntry = {
      id: `evt-${Date.now()}-${counterRef.current}`,
      ts: Date.now(),
      robotId: robot.id,
      robotName: robot.name,
      type,
      severity: SEV[type],
      message: extra ? `${LABEL[type]} · ${extra}` : LABEL[type],
    };
    setLog((l) => {
      // drop duplicates: a manual command and the status-transition detector
      // both log the same event — keep the first (richer) one within a 3s window.
      const recent = l[0];
      if (
        recent &&
        recent.robotId === robot.id &&
        recent.type === type &&
        entry.ts - recent.ts < 3000
      ) {
        return l;
      }
      return [entry, ...l].slice(0, 250);
    });
    return entry;
  }, []);

  useEffect(() => {
    const prev = prevRef.current;
    robots.forEach((r) => {
      const p = prev.get(r.id);
      if (!p) {
        prev.set(r.id, r);
        return;
      }
      // status transitions
      if (p.status !== r.status) {
        if (r.status === "offline") push(r, "disconnected");
        else if (p.status === "offline" && (r.status === "online" || r.status === "mission"))
          push(r, "connected");
        if (r.status === "rtl" && p.status !== "rtl") push(r, "rtl");
        if (r.status === "mission" && p.status !== "mission")
          push(r, "mission_start", `маршрут ${r.waypoints.length} точек`);
        if (p.status === "mission" && r.status !== "mission") push(r, "mission_done");
      }
      // low battery edge
      if (p.battery >= 20 && r.battery < 20 && r.status !== "offline") {
        push(r, "low_battery", `${r.battery.toFixed(0)}%`);
      }
      prev.set(r.id, r);
    });
  }, [robots, push]);

  return { log, push };
}

export const EVENT_LABEL = LABEL;
