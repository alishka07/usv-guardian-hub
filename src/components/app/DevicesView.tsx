import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Bot, Battery, Signal, Settings2, Cpu, Activity, CalendarIcon, ScrollText, Filter } from "lucide-react";
import type { Robot, EventLogEntry } from "./types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export function DevicesView({ robots, log }: { robots: Robot[]; log: EventLogEntry[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Всего устройств" value={robots.length} accent="primary" />
        <StatCard label="В сети" value={robots.filter((r) => r.status === "online").length} accent="success" />
        <StatCard label="Не в сети" value={robots.filter((r) => r.status === "offline").length} accent="muted" />
      </div>

      <Card className="bg-card border-border overflow-hidden p-0">
        <div className="grid grid-cols-[1fr_120px_140px_140px_120px_120px] gap-4 px-5 py-3 border-b border-border bg-panel text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          <div>Устройство</div><div>Статус</div><div>Батарея</div><div>Сигнал</div><div>Пробы</div><div></div>
        </div>
        {robots.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_120px_140px_140px_120px_120px] gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-panel/40 transition">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Bot className="size-5 text-primary" /></div>
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{r.model} · {r.serial}</div>
              </div>
            </div>
            <div>
              <Badge className={r.status === "online" ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground border-border"}>
                <span className={`size-1.5 rounded-full mr-1.5 ${r.status === "online" ? "bg-success pulse-dot" : "bg-muted-foreground"}`} />
                {r.status === "online" ? "В сети" : "Офлайн"}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs tabular-nums"><Battery className="size-3" />{r.battery.toFixed(0)}%</div>
              <Progress value={r.battery} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs tabular-nums"><Signal className="size-3" />{r.signal.toFixed(0)}%</div>
              <Progress value={r.signal} className="h-1" />
            </div>
            <div className="text-sm font-mono">{r.samplesPerTrip} / выезд</div>
            <div className="flex justify-end"><Button variant="ghost" size="sm"><Settings2 className="size-4" /></Button></div>
          </div>
        ))}
      </Card>
      <EventLog robots={robots} log={log} />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: "primary" | "success" | "muted" }) {
  const cls = accent === "primary" ? "text-primary" : accent === "success" ? "text-success" : "text-muted-foreground";
  return (
    <Card className="bg-card border-border p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={`text-4xl font-bold mt-1 ${cls}`}>{value}</div>
        </div>
        <Cpu className={`size-8 ${cls} opacity-50`} />
      </div>
    </Card>
  );
}

const SEV_STYLE = {
  success: { bg: "bg-success/15", text: "text-success", border: "border-success/30", dot: "bg-success", label: "Норма" },
  danger: { bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/30", dot: "bg-destructive", label: "Опасность" },
  warning: { bg: "bg-warning/15", text: "text-warning", border: "border-warning/30", dot: "bg-warning", label: "Предупреждение" },
  critical: { bg: "bg-[oklch(0.55_0.22_300)]/15", text: "text-[oklch(0.78_0.18_300)]", border: "border-[oklch(0.55_0.22_300)]/30", dot: "bg-[oklch(0.7_0.2_300)]", label: "Критично" },
} as const;

function EventLog({ robots, log }: { robots: Robot[]; log: EventLogEntry[] }) {
  const [robotFilter, setRobotFilter] = useState<string>("all");
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [range, setRange] = useState<DateRange | undefined>();

  const filtered = useMemo(() => {
    return log.filter((e) => {
      if (robotFilter !== "all" && e.robotId !== robotFilter) return false;
      if (sevFilter !== "all" && e.severity !== sevFilter) return false;
      if (range?.from && e.ts < range.from.getTime()) return false;
      if (range?.to && e.ts > range.to.getTime() + 86400_000) return false;
      return true;
    });
  }, [log, robotFilter, sevFilter, range]);

  return (
    <Card className="bg-card border-border p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10"><ScrollText className="size-4 text-primary" /></div>
          <div>
            <div className="font-semibold leading-tight">Журнал событий</div>
            <div className="text-[11px] text-muted-foreground">Системные события USV в реальном времени</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("font-normal", !range?.from && "text-muted-foreground")}>
                <CalendarIcon className="size-3.5" />
                {range?.from
                  ? range.to
                    ? `${format(range.from, "d MMM", { locale: ru })} – ${format(range.to, "d MMM", { locale: ru })}`
                    : format(range.from, "d MMM yyyy", { locale: ru })
                  : "Фильтр по дате"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} className={cn("p-3 pointer-events-auto")} />
              <div className="p-2 border-t border-border flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setRange(undefined)}>Сбросить</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={robotFilter} onValueChange={setRobotFilter}>
            <SelectTrigger className="h-9 w-[180px] text-xs"><Filter className="size-3.5" /><SelectValue placeholder="Робот" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все устройства</SelectItem>
              {robots.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sevFilter} onValueChange={setSevFilter}>
            <SelectTrigger className="h-9 w-[160px] text-xs"><Activity className="size-3.5" /><SelectValue placeholder="Уровень" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              <SelectItem value="success">Норма</SelectItem>
              <SelectItem value="warning">Предупреждение</SelectItem>
              <SelectItem value="danger">Опасность</SelectItem>
              <SelectItem value="critical">Критично</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-[140px_1fr_180px_140px] gap-4 px-5 py-2.5 border-b border-border bg-panel/40 text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
        <div>Время</div>
        <div>Событие</div>
        <div>Устройство</div>
        <div>Уровень</div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">События по выбранным фильтрам не найдены</div>
        ) : (
          filtered.map((e) => {
            const s = SEV_STYLE[e.severity];
            return (
              <div key={e.id} className="grid grid-cols-[140px_1fr_180px_140px] gap-4 px-5 py-3 border-b border-border last:border-b-0 items-center hover:bg-panel/40 transition group">
                <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {format(new Date(e.ts), "dd.MM HH:mm:ss")}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`size-2 rounded-full ${s.dot} ${e.severity === "danger" || e.severity === "critical" ? "pulse-dot" : ""}`} />
                  <span className="text-sm">{e.message}</span>
                </div>
                <div className="text-xs font-mono text-foreground/80">{e.robotName}</div>
                <div>
                  <Badge variant="outline" className={`${s.bg} ${s.text} ${s.border} text-[10px] uppercase tracking-wider font-semibold`}>
                    {s.label}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between bg-panel/30">
        <span>Всего: <span className="font-mono text-foreground">{filtered.length}</span> / {log.length}</span>
        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success pulse-dot" />Поток событий активен</span>
      </div>
    </Card>
  );
}
