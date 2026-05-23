import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  X,
  Battery,
  Signal,
  MapPin,
  OctagonAlert,
  Home,
  Bot,
  Gauge,
  Navigation2,
  Target,
  Pencil,
  Trash2,
  Rocket,
  Loader2,
  Beaker,
  Lightbulb,
  Activity,
  Gamepad2,
  ArrowUp,
  RotateCcw,
  RotateCw,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import type { Robot, Sample, EventType, EventLogEntry } from "@/domain/types";
import { toGps, formatGps } from "@/domain/intelligence/geo";
import { CameraFeed } from "./CameraFeed";
import { DiagnosticsDialog } from "./DiagnosticsDialog";

const fmtTs = () => new Date().toTimeString().slice(0, 8);

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

type Props = {
  robot: Robot;
  onClose: () => void;
  onUpdate: (r: Robot) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  draftWaypoints: { x: number; y: number }[];
  setDraftWaypoints: (wps: { x: number; y: number }[]) => void;
  logEvent?: (robot: Robot, type: EventType, extra?: string) => EventLogEntry;
  onCollectSample?: (robot: Robot) => Sample;
};

export function RobotPanel({
  robot,
  onClose,
  onUpdate,
  editMode,
  setEditMode,
  draftWaypoints,
  setDraftWaypoints,
  logEvent,
  onCollectSample,
}: Props) {
  const [launching, setLaunching] = useState(false);
  const [estopOpen, setEstopOpen] = useState(false);
  const [rtlOpen, setRtlOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);

  // When a robot is opened, preload the route editor with its current waypoints
  // so the operator can edit an existing route instead of always starting blank.
  useEffect(() => {
    setDraftWaypoints(robot.waypoints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [robot.id]);

  const offline = robot.status === "offline";

  const emergency = () => {
    const updated: Robot = {
      ...robot,
      status: "offline",
      signal: 0,
      speed: 0,
      manual: false,
      lastSeen: "только что",
    };
    onUpdate(updated);
    logEvent?.(updated, "estop", "оператор · ручное подтверждение");
    toast.error("Аварийная остановка выполнена", {
      description: `[${fmtTs()}] CMD: ESTOP → ${robot.name} · ACK · запись в журнал`,
    });
    setEstopOpen(false);
  };

  const rtl = () => {
    const updated: Robot = { ...robot, status: "rtl", manual: false };
    onUpdate(updated);
    logEvent?.(updated, "rtl", "ручная команда оператора");
    toast.warning("Возврат на базу инициирован", {
      description: `[${fmtTs()}] CMD: RTL → ${robot.name} · следует на базу · запись в журнал`,
    });
    setRtlOpen(false);
  };

  const clearDraft = () => setDraftWaypoints([]);
  const removeWp = (i: number) => setDraftWaypoints(draftWaypoints.filter((_, idx) => idx !== i));

  const launchRoute = async () => {
    if (draftWaypoints.length < 2) {
      toast.error("Маршрут слишком короткий", { description: "Добавьте минимум 2 точки на карте" });
      return;
    }
    setLaunching(true);
    toast.info("Синхронизация маршрута с USV...", {
      description: `[${fmtTs()}] UPLOAD → ${robot.name} · ${draftWaypoints.length} WP`,
    });
    await new Promise((r) => setTimeout(r, 1400));
    onUpdate({
      ...robot,
      status: "mission",
      waypoints: draftWaypoints,
      waypointIdx: 0,
      position: draftWaypoints[0],
      trail: [],
      manual: false,
    });
    toast.success("Маршрут запущен", {
      description: `${robot.name} выполняет миссию · ${draftWaypoints.length} точек`,
    });
    setLaunching(false);
    setEditMode(false);
  };

  // --- onboard hardware commands ---
  const collect = () => {
    if (!onCollectSample) return;
    setCollecting(true);
    const s = onCollectSample(robot);
    toast.success("Проба отобрана", {
      description: `[${fmtTs()}] ПРОБООТБОРНИК → ${robot.name} · ${s.id.toUpperCase()} · насос ✓`,
    });
    setTimeout(() => setCollecting(false), 900);
  };

  const toggleBeacon = (v: boolean) => {
    onUpdate({ ...robot, beacon: v });
    toast.info(v ? "Сигнальный маяк включён" : "Сигнальный маяк выключен", {
      description: robot.name,
    });
  };

  const toggleManual = (v: boolean) => {
    onUpdate({ ...robot, manual: v, speed: v ? 0 : robot.speed });
    toast.info(v ? "Ручное управление включено" : "Возврат к автономному режиму", {
      description: v
        ? `${robot.name}: автонавигация приостановлена`
        : `${robot.name}: следует по маршруту`,
    });
  };

  const driveForward = () => {
    const rad = (robot.heading * Math.PI) / 180;
    const nx = clamp(robot.position.x + Math.cos(rad) * 3, 2, 98);
    const ny = clamp(robot.position.y + Math.sin(rad) * 3, 2, 98);
    onUpdate({
      ...robot,
      position: { x: +nx.toFixed(2), y: +ny.toFixed(2) },
      speed: 2.4,
      trail: [...robot.trail, robot.position].slice(-28),
    });
  };
  const turn = (deg: number) => onUpdate({ ...robot, heading: robot.heading + deg });
  const stopDrive = () => onUpdate({ ...robot, speed: 0 });

  const sparkData = robot.batteryHistory.map((v, i) => ({ i, v }));
  const lat = toGps(robot.position).lat.toFixed(5);
  const lon = toGps(robot.position).lon.toFixed(5);

  return (
    <div className="absolute right-2 sm:right-4 top-4 bottom-4 w-[min(380px,calc(100vw-1rem))] z-20 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-4 fade-in duration-300">
      <div
        className="p-4 border-b border-border flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklch, ${robot.color} 18%, transparent), oklch(0.22 0.035 250))`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-lg"
            style={{ background: `color-mix(in oklch, ${robot.color} 20%, transparent)` }}
          >
            <Bot className="size-5" style={{ color: robot.color }} />
          </div>
          <div>
            <div className="font-semibold leading-tight">{robot.name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {robot.model} · {robot.serial}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={
              robot.status === "online"
                ? "bg-success/20 text-success border-success/30"
                : robot.status === "mission"
                  ? "bg-primary/20 text-primary border-primary/30"
                  : robot.status === "rtl"
                    ? "bg-warning/20 text-warning border-warning/30"
                    : "bg-muted text-muted-foreground border-border"
            }
          >
            <span
              className={`size-1.5 rounded-full mr-1.5 ${
                robot.status === "online"
                  ? "bg-success pulse-dot"
                  : robot.status === "mission"
                    ? "bg-primary pulse-dot"
                    : robot.status === "rtl"
                      ? "bg-warning pulse-dot"
                      : "bg-muted-foreground"
              }`}
            />
            {robot.status === "online"
              ? "В сети"
              : robot.status === "mission"
                ? "Выполняет миссию"
                : robot.status === "rtl"
                  ? "Возврат RTL"
                  : "Не в сети"}
          </Badge>
          {robot.manual && (
            <Badge className="bg-cyan-accent/20 text-cyan-accent border-cyan-accent/30">
              <Gamepad2 className="size-3 mr-1" /> Ручной режим
            </Badge>
          )}
          {robot.beacon && (
            <Badge className="bg-warning/20 text-warning border-warning/30">
              <Lightbulb className="size-3 mr-1" /> Маяк
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">UPD {fmtTs()}</span>
        </div>

        {/* Onboard camera feed */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Бортовая камера
          </Label>
          <CameraFeed label={`USV-CAM · ${robot.serial}`} className="h-32" live={!offline} />
        </div>

        {/* Battery with sparkline */}
        <div className="rounded-lg bg-panel/50 border border-border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Battery className="size-3.5" />
              Батарея (30с)
            </div>
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
                <Area
                  dataKey="v"
                  stroke={robot.color}
                  strokeWidth={1.5}
                  fill="url(#spark)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Progress value={robot.battery} className="h-1 mt-1" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Tile icon={Signal} label="Сигнал" value={`${robot.signal.toFixed(0)}%`} />
          <Tile icon={Gauge} label="Скорость" value={`${robot.speed.toFixed(1)} м/с`} />
          <Tile
            icon={Navigation2}
            label="Курс"
            value={`${((robot.heading + 360) % 360).toFixed(0)}°`}
          />
        </div>

        <div className="rounded-lg bg-panel/50 border border-border p-3 font-mono text-xs">
          <div className="flex items-center justify-between text-muted-foreground uppercase tracking-wider text-[10px]">
            <span className="flex items-center gap-1">
              <Target className="size-3" />
              GPS
            </span>
            <span>
              WP {robot.waypointIdx + 1}/{robot.waypoints.length}
            </span>
          </div>
          <div className="mt-1 text-foreground tabular-nums">{lat}° N</div>
          <div className="text-foreground tabular-nums">{lon}° E</div>
        </div>

        {/* Onboard hardware controls */}
        <div className="rounded-lg border border-border bg-panel/40 p-3 space-y-3">
          <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
            <Activity className="size-3.5 text-primary" /> Бортовые системы
          </Label>

          <Button
            onClick={collect}
            disabled={collecting || offline || !onCollectSample}
            className="w-full bg-cyan-accent/90 text-background hover:bg-cyan-accent font-semibold"
          >
            {collecting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Beaker className="size-4" />
            )}
            Взять пробу сейчас
          </Button>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="beacon"
              className="text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Lightbulb className="size-3.5 text-warning" /> Сигнальный маяк
            </Label>
            <Switch
              id="beacon"
              checked={!!robot.beacon}
              onCheckedChange={toggleBeacon}
              disabled={offline}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setDiagOpen(true)}
            disabled={offline}
            className="w-full"
          >
            <Activity className="size-4" /> Самотест и калибровка
          </Button>
        </div>

        {/* Manual remote control */}
        <div className="rounded-lg border border-border bg-panel/40 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="manual"
              className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Gamepad2 className="size-3.5 text-cyan-accent" /> Ручное управление
            </Label>
            <Switch
              id="manual"
              checked={!!robot.manual}
              onCheckedChange={toggleManual}
              disabled={offline}
            />
          </div>

          {robot.manual ? (
            <div className="flex flex-col items-center gap-1.5">
              <Button size="icon" variant="outline" className="size-10" onClick={driveForward}>
                <ArrowUp className="size-5" />
              </Button>
              <div className="flex gap-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-10"
                  onClick={() => turn(-20)}
                  aria-label="Поворот влево"
                >
                  <RotateCcw className="size-5" />
                </Button>
                <Button
                  size="icon"
                  className="size-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={stopDrive}
                  aria-label="Стоп"
                >
                  <Square className="size-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-10"
                  onClick={() => turn(20)}
                  aria-label="Поворот вправо"
                >
                  <RotateCw className="size-5" />
                </Button>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                курс {((robot.heading + 360) % 360).toFixed(0)}° · {robot.speed.toFixed(1)} м/с
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Включите, чтобы вести аппарат вручную: вперёд, поворот, стоп. Автонавигация при этом
              приостанавливается.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Количество проб за выезд
          </Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={robot.samplesPerTrip}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              onUpdate({
                ...robot,
                samplesPerTrip: Number.isNaN(v) ? 0 : Math.max(0, Math.min(100, v)),
              });
            }}
          />
        </div>

        {/* Route editor */}
        <div className="rounded-lg border border-border bg-panel/40 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="edit-mode"
              className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="size-3.5 text-primary" /> Режим редактирования маршрута
            </Label>
            <Switch id="edit-mode" checked={editMode} onCheckedChange={setEditMode} />
          </div>

          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              Точки маршрута
            </span>
            <span className="font-mono">{draftWaypoints.length} WP</span>
          </div>

          {draftWaypoints.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-2 px-1">
              {editMode
                ? "Кликайте по карте, чтобы поставить точки 1, 2, 3…"
                : "Включите режим редактирования и расставьте точки на карте."}
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {draftWaypoints.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-card/60 border border-border rounded-md px-2 py-1.5"
                >
                  <div className="size-5 rounded-full bg-cyan-accent text-background text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="font-mono text-[11px] tabular-nums flex-1 truncate">
                    {formatGps(w)}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    onClick={() => removeWp(i)}
                    aria-label="Удалить точку"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={draftWaypoints.length === 0}
                >
                  <Trash2 className="size-3.5" /> Очистить
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Trash2 className="size-5 text-muted-foreground" /> Очистить черновик маршрута?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Будут удалены все{" "}
                    <span className="font-semibold text-foreground">{draftWaypoints.length}</span>{" "}
                    точек текущего черновика. Действующий маршрут аппарата не изменится, пока вы не
                    запустите новый.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      clearDraft();
                      setClearOpen(false);
                    }}
                  >
                    Очистить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Button
            onClick={launchRoute}
            disabled={launching || draftWaypoints.length < 2}
            className="w-full h-12 font-extrabold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          >
            {launching ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Синхронизация маршрута с USV...
              </>
            ) : (
              <>
                <Rocket className="size-5" /> Запустить маршрут
              </>
            )}
          </Button>
        </div>

        <div className="pt-1 space-y-2">
          <AlertDialog open={estopOpen} onOpenChange={setEstopOpen}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={offline}
                className="w-full h-16 text-base font-extrabold bg-destructive hover:bg-destructive/90 text-destructive-foreground glow-danger uppercase tracking-wide"
              >
                <OctagonAlert className="size-6" /> Аварийная остановка
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-destructive/50">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <OctagonAlert className="size-5" /> Подтвердите аварийную остановку
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Аппарат{" "}
                  <span className="font-mono font-semibold text-foreground">{robot.name}</span> (
                  {robot.serial}) будет немедленно переведён в состояние{" "}
                  <span className="text-destructive font-semibold">OFFLINE</span>: двигатели
                  заглушены, телеметрия прерывается, текущая миссия отменяется. Событие будет
                  записано в журнал робота.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={emergency}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Да, остановить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={rtlOpen} onOpenChange={setRtlOpen}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={offline}
                className="w-full h-12 font-bold bg-warning hover:bg-warning/90 text-warning-foreground uppercase tracking-wide"
              >
                <Home className="size-5" /> Вернуть на базу (RTL)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-warning/50">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-warning">
                  <Home className="size-5" /> Подтвердите возврат на базу
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Аппарат{" "}
                  <span className="font-mono font-semibold text-foreground">{robot.name}</span>{" "}
                  прервёт текущую миссию и направится к точке базы по кратчайшему безопасному
                  маршруту. Событие будет записано в журнал робота.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={rtl}
                  className="bg-warning text-warning-foreground hover:bg-warning/90"
                >
                  Подтвердить RTL
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <DiagnosticsDialog robot={robot} open={diagOpen} onOpenChange={setDiagOpen} />
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-panel/50 border border-border p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-1 font-bold text-sm tabular-nums">{value}</div>
    </div>
  );
}
