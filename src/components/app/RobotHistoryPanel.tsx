import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, History, Droplets, ScrollText, Bot, ChevronRight } from "lucide-react";
import type { Robot, Sample, EventLogEntry } from "./types";

const SEV_DOT: Record<EventLogEntry["severity"], string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  critical: "bg-[oklch(0.7_0.2_300)]",
};

function fmtTime(ts: number) {
  const d = new Date(ts);
  const diff = Date.now() - ts;
  if (diff < 60_000) return "только что";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} мин назад`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч назад`;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

export function RobotHistoryPanel({
  robot,
  log,
  samples,
  onClose,
  onSelectSample,
}: {
  robot: Robot;
  log: EventLogEntry[];
  samples: Sample[];
  onClose: () => void;
  onSelectSample: (s: Sample) => void;
}) {
  const robotLog = useMemo(() => log.filter((e) => e.robotId === robot.id).slice(0, 20), [log, robot.id]);
  const robotSamples = useMemo(
    () => samples.filter((s) => s.robotId === robot.id).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [samples, robot.id],
  );

  return (
    <div className="absolute left-4 top-4 bottom-4 w-[320px] z-20 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-left-4 fade-in duration-300">
      <div
        className="p-4 border-b border-border flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, color-mix(in oklch, ${robot.color} 18%, transparent), oklch(0.22 0.035 250))` }}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: `color-mix(in oklch, ${robot.color} 20%, transparent)` }}>
            <History className="size-5" style={{ color: robot.color }} />
          </div>
          <div>
            <div className="font-semibold leading-tight">История · {robot.name}</div>
            <div className="text-xs text-muted-foreground font-mono">События и пробы</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-border">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 p-4">
          <div className="rounded-lg bg-panel/50 border border-border p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><ScrollText className="size-3" />События</div>
            <div className="text-2xl font-bold tabular-nums mt-0.5">{robotLog.length}</div>
          </div>
          <div className="rounded-lg bg-panel/50 border border-border p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Droplets className="size-3" />Пробы</div>
            <div className="text-2xl font-bold tabular-nums mt-0.5 text-cyan-accent">{robotSamples.length}</div>
          </div>
        </div>

        {/* Event history */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
            <ScrollText className="size-3" /> Журнал событий
          </div>
          {robotLog.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-3">Событий пока нет</div>
          ) : (
            <ol className="relative space-y-2 pl-4 before:absolute before:left-[5px] before:top-1 before:bottom-1 before:w-px before:bg-border">
              {robotLog.map((e) => (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[15px] top-1.5 size-2.5 rounded-full ring-2 ring-card ${SEV_DOT[e.severity]}`} />
                  <div className="text-xs leading-snug">{e.message}</div>
                  <div className="text-[10px] font-mono text-muted-foreground tabular-nums">{fmtTime(e.ts)}</div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Samples list */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
            <span className="flex items-center gap-1.5"><Droplets className="size-3" /> Последние пробы</span>
            <Badge variant="outline" className="text-[10px] font-mono">{robotSamples.length}</Badge>
          </div>
          {robotSamples.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-3">Проб не зафиксировано</div>
          ) : (
            <div className="space-y-1.5">
              {robotSamples.map((s) => {
                const d = new Date(s.date);
                const phWarn = s.ph < 6.5 || s.ph > 8.5;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectSample(s)}
                    className="w-full text-left rounded-lg border border-border bg-card/60 hover:bg-panel/70 hover:border-primary/40 transition group px-3 py-2 flex items-center gap-3"
                  >
                    <div className="size-8 rounded-md bg-cyan-accent/15 border border-cyan-accent/30 flex items-center justify-center flex-shrink-0">
                      <Droplets className="size-3.5 text-cyan-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold uppercase">{s.id}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })} · {d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-muted-foreground tabular-nums">
                        <span className={phWarn ? "text-warning" : ""}>pH {s.ph}</span>
                        <span>·</span>
                        <span>O₂ {s.oxygen}</span>
                        <span>·</span>
                        <span>{s.temperature}°C</span>
                      </div>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 text-[10px] text-muted-foreground flex items-center gap-1.5">
          <Bot className="size-3" />
          <span className="font-mono">{robot.serial}</span>
        </div>
      </div>
    </div>
  );
}