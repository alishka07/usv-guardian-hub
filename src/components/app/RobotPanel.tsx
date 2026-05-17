import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Battery, Signal, MapPin, OctagonAlert, Home, Bot, Gauge, Navigation2, Target, Pencil, Trash2, Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import type { Robot } from "./types";

const fmtTs = () => {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
};

const toGps = (w: { x: number; y: number }) => ({
  lat: +(43.88 + (w.y - 50) * 0.0015).toFixed(5),
  lon: +(77.07 + (w.x - 50) * 0.002).toFixed(5),
});

type Props = {
  robot: Robot;
  onClose: () => void;
  onUpdate: (r: Robot) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  draftWaypoints: { x: number; y: number }[];
  setDraftWaypoints: (wps: { x: number; y: number }[]) => void;
};

export function RobotPanel({ robot, onClose, onUpdate, editMode, setEditMode, draftWaypoints, setDraftWaypoints }: Props) {
  const [launching, setLaunching] = useState(false);

  const emergency = () => {
    onUpdate({ ...robot, status: "offline", signal: 0, speed: 0, lastSeen: "только что" });
    toast.error("Аварийная остановка выполнена", {
      description: `[${fmtTs()}] CMD: ESTOP → ${robot.name} · ACK`,
    });
  };
  const rtl = () => {
    onUpdate({ ...robot, status: "rtl" });
    toast.warning("Возврат на базу инициирован", {
      description: `[${fmtTs()}] CMD: RTL → ${robot.name} · следует на базу`,
    });
  };

  const clearDraft = () => setDraftWaypoints([]);
  const removeWp = (i: number) => setDraftWaypoints(draftWaypoints.filter((_, idx) => idx !== i));

  const launchRoute = async () => {
    if (draftWaypoints.length < 2) {
      toast.error("Маршрут слишком короткий", { description: "Добавьте минимум 2 точки на карте" });
      return;
    }
    setLaunching(true);
    toast.info("Синхронизация маршрута с USV...", { description: `[${fmtTs()}] UPLOAD → ${robot.name} · ${draftWaypoints.length} WP` });
    await new Promise((r) => setTimeout(r, 1400));
    onUpdate({
      ...robot,
      status: "mission",
      waypoints: draftWaypoints,
      waypointIdx: 0,
      position: draftWaypoints[0],
      trail: [],
    });
    toast.success("Маршрут запущен", { description: `${robot.name} выполняет миссию · ${draftWaypoints.length} точек` });
    setLaunching(false);
    setEditMode(false);
  };

  const sparkData = robot.batteryHistory.map((v, i) => ({ i, v }));
  const lat = toGps(robot.position).lat.toFixed(5);
  const lon = toGps(robot.position).lon.toFixed(5);

  return (
    <div className="absolute right-4 top-4 bottom-4 w-[380px] z-20 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-4 fade-in duration-300">
      <div
        className="p-4 border-b border-border flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, color-mix(in oklch, ${robot.color} 18%, transparent), oklch(0.22 0.035 250))` }}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: `color-mix(in oklch, ${robot.color} 20%, transparent)` }}>
            <Bot className="size-5" style={{ color: robot.color }} />
          </div>
          <div>
            <div className="font-semibold leading-tight">{robot.name}</div>
            <div className="text-xs text-muted-foreground font-mono">{robot.model} · {robot.serial}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={
            robot.status === "online" ? "bg-success/20 text-success border-success/30"
            : robot.status === "mission" ? "bg-primary/20 text-primary border-primary/30"
            : robot.status === "rtl" ? "bg-warning/20 text-warning border-warning/30"
            : "bg-muted text-muted-foreground border-border"
          }>
            <span className={`size-1.5 rounded-full mr-1.5 ${
              robot.status === "online" ? "bg-success pulse-dot" : robot.status === "mission" ? "bg-primary pulse-dot" : robot.status === "rtl" ? "bg-warning pulse-dot" : "bg-muted-foreground"
            }`} />
            {robot.status === "online" ? "В сети" : robot.status === "mission" ? "Выполняет миссию" : robot.status === "rtl" ? "Возврат RTL" : "Не в сети"}
          </Badge>
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">UPD {fmtTs()}</span>
        </div>

        {/* Battery with sparkline */}
        <div className="rounded-lg bg-panel/50 border border-border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Battery className="size-3.5" />Батарея (30с)</div>
            <div className="font-bold text-lg tabular-nums">{robot.battery.toFixed(1)}%</div>
          </div>
          <div className="h-10 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={robot.color} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={robot.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area dataKey="v" stroke={robot.color} strokeWidth={1.5} fill="url(#spark)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Progress value={robot.battery} className="h-1 mt-1" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Tile icon={Signal} label="Сигнал" value={`${robot.signal.toFixed(0)}%`} />
          <Tile icon={Gauge} label="Скорость" value={`${robot.speed.toFixed(1)} м/с`} />
          <Tile icon={Navigation2} label="Курс" value={`${((robot.heading + 360) % 360).toFixed(0)}°`} />
        </div>

        <div className="rounded-lg bg-panel/50 border border-border p-3 font-mono text-xs">
          <div className="flex items-center justify-between text-muted-foreground uppercase tracking-wider text-[10px]">
            <span className="flex items-center gap-1"><Target className="size-3" />GPS</span>
            <span>WP {robot.waypointIdx + 1}/{robot.waypoints.length}</span>
          </div>
          <div className="mt-1 text-foreground tabular-nums">{lat}° N</div>
          <div className="text-foreground tabular-nums">{lon}° E</div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Количество проб за выезд</Label>
          <Input type="number" value={robot.samplesPerTrip} onChange={(e) => onUpdate({ ...robot, samplesPerTrip: +e.target.value })} />
        </div>

        {/* Route editor */}
        <div className="rounded-lg border border-border bg-panel/40 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="edit-mode" className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <Pencil className="size-3.5 text-primary" /> Режим редактирования маршрута
            </Label>
            <Switch id="edit-mode" checked={editMode} onCheckedChange={setEditMode} />
          </div>

          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-3" />Точки маршрута</span>
            <span className="font-mono">{draftWaypoints.length} WP</span>
          </div>

          {draftWaypoints.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-2 px-1">
              {editMode ? "Кликайте по карте, чтобы поставить точки 1, 2, 3…" : "Включите режим редактирования и расставьте точки на карте."}
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {draftWaypoints.map((w, i) => {
                const g = toGps(w);
                return (
                  <div key={i} className="flex items-center gap-2 bg-card/60 border border-border rounded-md px-2 py-1.5">
                    <div className="size-5 rounded-full bg-cyan-accent text-background text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <div className="font-mono text-[11px] tabular-nums flex-1 truncate">
                      {g.lat}° N, {g.lon}° E
                    </div>
                    <Button size="icon" variant="ghost" className="size-6" onClick={() => removeWp(i)} aria-label="Удалить точку">
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={clearDraft} disabled={draftWaypoints.length === 0}>
              <Trash2 className="size-3.5" /> Очистить
            </Button>
          </div>

          <Button
            onClick={launchRoute}
            disabled={launching || draftWaypoints.length < 2}
            className="w-full h-12 font-extrabold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          >
            {launching ? (<><Loader2 className="size-5 animate-spin" /> Синхронизация маршрута с USV...</>) : (<><Rocket className="size-5" /> Запустить маршрут</>)}
          </Button>
        </div>

        <div className="pt-1 space-y-2">
          <Button onClick={emergency} disabled={robot.status === "offline"} className="w-full h-16 text-base font-extrabold bg-destructive hover:bg-destructive/90 text-destructive-foreground glow-danger uppercase tracking-wide">
            <OctagonAlert className="size-6" /> Аварийная остановка
          </Button>
          <Button onClick={rtl} disabled={robot.status === "offline"} className="w-full h-12 font-bold bg-warning hover:bg-warning/90 text-warning-foreground uppercase tracking-wide">
            <Home className="size-5" /> Вернуть на базу (RTL)
          </Button>
        </div>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-panel/50 border border-border p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><Icon className="size-3" />{label}</div>
      <div className="mt-1 font-bold text-sm tabular-nums">{value}</div>
    </div>
  );
}
