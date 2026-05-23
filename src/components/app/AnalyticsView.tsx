import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  FileText,
  Sheet,
  Loader2,
  CalendarRange,
  Filter,
  FileDown,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { Robot, Sample, Thresholds } from "@/domain/types";
import { filterSamples, summarize, downloadCSV, downloadPDF } from "@/domain/reporting/report";
import { ZONES, zoneOf, microplasticLabel, MICRO_TONE_CLASS } from "@/domain/analysis/microplastic";

type Props = {
  robots: Robot[];
  samples: Sample[];
  thresholds: Thresholds;
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => isoDay(new Date(Date.now() - n * 86_400_000));

export function AnalyticsView({ robots, samples, thresholds }: Props) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [from, setFrom] = useState(() => daysAgo(30));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [robotId, setRobotId] = useState("all");

  const filters = useMemo(() => ({ range: { from, to }, robotId }), [from, to, robotId]);
  const filtered = useMemo(() => filterSamples(samples, filters), [samples, filters]);
  const sum = useMemo(() => summarize(filtered, thresholds), [filtered, thresholds]);

  // Aggregate the filtered samples into a per-day series so the charts reflect
  // the active period/device filter instead of static mock data.
  const chartData = useMemo(() => {
    const byDay = new Map<
      number,
      { day: string; ph: number[]; oxygen: number[]; turbidity: number[]; temperature: number[] }
    >();
    for (const s of filtered) {
      const d = new Date(s.date);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      let bucket = byDay.get(key);
      if (!bucket) {
        bucket = {
          day: `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`,
          ph: [],
          oxygen: [],
          turbidity: [],
          temperature: [],
        };
        byDay.set(key, bucket);
      }
      bucket.ph.push(s.ph);
      bucket.oxygen.push(s.oxygen);
      bucket.turbidity.push(s.turbidity);
      bucket.temperature.push(s.temperature);
    }
    const mean = (a: number[]) =>
      a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : 0;
    return [...byDay.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, b]) => ({
        day: b.day,
        ph: mean(b.ph),
        oxygen: mean(b.oxygen),
        turbidity: mean(b.turbidity),
        temperature: mean(b.temperature),
      }));
  }, [filtered]);

  const noData = chartData.length === 0;

  // Microparticle (microplastic) concentration aggregated per reservoir zone.
  const microByZone = useMemo(() => {
    return ZONES.map((z) => {
      const inZone = filtered.filter((s) => zoneOf(s.position) === z.id);
      const avg = inZone.length
        ? Math.round(inZone.reduce((a, s) => a + (s.microplastic ?? 0), 0) / inZone.length)
        : 0;
      const peak = inZone.reduce((m, s) => Math.max(m, s.microplastic ?? 0), 0);
      return { ...z, count: inZone.length, avg, peak, mark: microplasticLabel(avg) };
    });
  }, [filtered]);

  const microAvg = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round(filtered.reduce((a, s) => a + (s.microplastic ?? 0), 0) / filtered.length);
  }, [filtered]);

  const onCsv = () => {
    if (filtered.length === 0) {
      toast.warning("Нет данных за выбранный период", {
        description: "Расширьте диапазон или измените фильтр.",
      });
      return;
    }
    setLoadingCsv(true);
    try {
      const fn = downloadCSV(filtered, robots, thresholds, filters);
      toast.success("CSV-отчёт сформирован", {
        description: `${fn} · записей: ${filtered.length}`,
      });
    } finally {
      setTimeout(() => setLoadingCsv(false), 400);
    }
  };

  const onPdf = () => {
    if (filtered.length === 0) {
      toast.warning("Нет данных за выбранный период", {
        description: "Расширьте диапазон или измените фильтр.",
      });
      return;
    }
    setLoadingPdf(true);
    try {
      const res = downloadPDF(filtered, robots, thresholds, filters);
      if (res.mode === "print") {
        toast.success("PDF-отчёт открыт для печати", {
          description: "В диалоге печати выберите «Сохранить как PDF».",
        });
      } else {
        toast.success("HTML-отчёт скачан (всплывающие окна заблокированы)", {
          description: res.filename,
        });
      }
    } finally {
      setTimeout(() => setLoadingPdf(false), 600);
    }
  };

  const dist: { label: string; n: number; tone: string }[] = [
    { label: "Норма", n: sum.counts.success, tone: "bg-success/15 text-success border-success/30" },
    {
      label: "Удовл.",
      n: sum.counts.warning,
      tone: "bg-warning/15 text-warning border-warning/30",
    },
    {
      label: "Плохо",
      n: sum.counts.danger,
      tone: "bg-destructive/15 text-destructive border-destructive/30",
    },
    {
      label: "Крит.",
      n: sum.counts.critical,
      tone: "bg-[oklch(0.55_0.22_300)]/15 text-[oklch(0.78_0.18_300)] border-[oklch(0.55_0.22_300)]/40",
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarRange className="size-3.5" />
              Период с
            </Label>
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Период по
            </Label>
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="size-3.5" />
              Устройство
            </Label>
            <Select value={robotId} onValueChange={setRobotId}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все устройства</SelectItem>
                {robots.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Найдено:{" "}
              <span className="font-mono font-semibold text-foreground">{filtered.length}</span>{" "}
              измерений
            </span>
            <span>·</span>
            <span>
              Средний индекс качества:{" "}
              <span className="font-mono font-semibold text-foreground">{sum.avgScore}/100</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Quality distribution over the filtered period */}
      <Card className="bg-card border-border p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            <BarChart3 className="size-3.5" /> Распределение качества
          </div>
          <div className="flex-1 min-w-[280px] grid grid-cols-4 gap-2">
            {dist.map((d) => (
              <div key={d.label} className={`rounded-md border p-2 text-center ${d.tone}`}>
                <div className="text-xl font-bold tabular-nums leading-tight">{d.n}</div>
                <div className="text-[10px] uppercase tracking-wider">{d.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Средний индекс</span>
            <span className="text-2xl font-bold tabular-nums">
              {sum.avgScore}
              <span className="text-sm text-muted-foreground">/100</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Microparticle distribution across reservoir zones */}
      <Card className="bg-card border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[oklch(0.55_0.22_300)]/15 text-[oklch(0.78_0.18_300)] flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight">Микрочастицы по зонам водоёма</h3>
              <div className="text-xs text-muted-foreground">
                Распределение микропластика, частиц/м³ · концентрация выше у речных притоков
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Средняя по выборке</span>
            <span className="text-2xl font-bold tabular-nums">{microAvg}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {microByZone.map((z) => {
            const cls = MICRO_TONE_CLASS[z.mark.tone];
            return (
              <div key={z.id} className={`rounded-lg border p-3 ${cls.border} ${cls.bg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{z.label}</span>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold ${cls.text}`}
                  >
                    {z.mark.label}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={`text-3xl font-bold tabular-nums ${cls.text}`}>{z.avg}</span>
                  <span className="text-xs text-muted-foreground">частиц/м³ (среднее)</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-background/60 overflow-hidden">
                  <div
                    className={`h-full ${cls.bar} transition-all`}
                    style={{ width: `${Math.min(100, (z.avg / 2600) * 100)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>проб: {z.count}</span>
                  <span>пик: {z.peak}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Уровень pH"
          subtitle={`Среднесуточная динамика · дней: ${chartData.length}`}
          empty={noData}
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E47C0" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#1E47C0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f3" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#56688c" fontSize={11} />
              <YAxis stroke="#56688c" fontSize={11} domain={[6, 9]} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #d5deec",
                  borderRadius: 8,
                  color: "#0a1a3f",
                }}
              />
              <Area dataKey="ph" stroke="#1E47C0" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Растворенный кислород" subtitle="мг/л · среднесуточно" empty={noData}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#29A98D" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#29A98D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f3" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#56688c" fontSize={11} />
              <YAxis stroke="#56688c" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #d5deec",
                  borderRadius: 8,
                  color: "#0a1a3f",
                }}
              />
              <Area dataKey="oxygen" stroke="#29A98D" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Мутность и температура"
          subtitle="NTU / °C · среднесуточно"
          empty={noData}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#e2e8f3" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#56688c" fontSize={11} />
              <YAxis stroke="#56688c" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #d5deec",
                  borderRadius: 8,
                  color: "#0a1a3f",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="turbidity"
                stroke="#E8A317"
                strokeWidth={2}
                dot={false}
                name="Мутность"
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#4A8FF0"
                strokeWidth={2}
                dot={false}
                name="Температура"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="relative overflow-hidden border-border p-5 flex flex-col glass-panel">
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 100% 0%, oklch(0.62 0.10 215 / 0.25), transparent 70%)",
            }}
          />
          <div className="relative text-xs uppercase tracking-[0.14em] text-cyan-accent/80 font-display font-semibold flex items-center gap-1.5">
            <FileDown className="size-3.5" /> Экспорт данных
          </div>
          <h3 className="relative text-xl font-display font-bold mt-1">
            Скачать отчёт за выбранный период
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            В отчёт попадут все измерения{" "}
            <span className="font-semibold text-foreground">
              с {from} по {to}
            </span>
            {robotId !== "all" && (
              <>
                {" "}
                · только устройство{" "}
                <span className="font-semibold text-foreground">
                  {robots.find((r) => r.id === robotId)?.name}
                </span>
              </>
            )}
            . Будет включена сводная статистика и таблица измерений с оценкой качества по текущим
            порогам.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="rounded-md border border-border bg-panel/50 px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wider">PDF</div>
              <div>Печать в PDF из браузера</div>
            </div>
            <div className="rounded-md border border-border bg-panel/50 px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wider">CSV</div>
              <div>Excel / Sheets · UTF-8</div>
            </div>
          </div>
          <div className="mt-auto pt-4 grid grid-cols-2 gap-3">
            <Button
              onClick={onPdf}
              disabled={loadingPdf || filtered.length === 0}
              className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {loadingPdf ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <FileText className="size-5" />
              )}
              Скачать PDF
            </Button>
            <Button
              onClick={onCsv}
              disabled={loadingCsv || filtered.length === 0}
              className="h-14 bg-success/90 hover:bg-success text-success-foreground font-semibold"
            >
              {loadingCsv ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Sheet className="size-5" />
              )}
              Скачать CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card border-border p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      {empty ? (
        <div className="h-[240px] flex flex-col items-center justify-center gap-1 text-muted-foreground">
          <BarChart3 className="size-8 opacity-40" />
          <span className="text-sm">Нет измерений за выбранный период</span>
          <span className="text-xs opacity-70">Расширьте диапазон дат или смените устройство</span>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
