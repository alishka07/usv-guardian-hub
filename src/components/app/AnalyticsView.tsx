import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { FileText, Sheet, Loader2, CalendarRange, Filter, FileDown } from "lucide-react";
import { toast } from "sonner";
import { trendData } from "./mock-data";
import type { Robot, Sample, Thresholds } from "./types";
import { filterSamples, summarize, downloadCSV, downloadPDF } from "./report";

type Props = {
  robots: Robot[];
  samples: Sample[];
  thresholds: Thresholds;
};

export function AnalyticsView({ robots, samples, thresholds }: Props) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [from, setFrom] = useState("2026-05-01");
  const [to, setTo] = useState("2026-05-20");
  const [robotId, setRobotId] = useState("all");

  const filters = useMemo(() => ({ range: { from, to }, robotId }), [from, to, robotId]);
  const filtered = useMemo(() => filterSamples(samples, filters), [samples, filters]);
  const sum = useMemo(() => summarize(filtered, thresholds), [filtered, thresholds]);

  const onCsv = () => {
    if (filtered.length === 0) {
      toast.warning("Нет данных за выбранный период", { description: "Расширьте диапазон или измените фильтр." });
      return;
    }
    setLoadingCsv(true);
    try {
      const fn = downloadCSV(filtered, robots, thresholds, filters);
      toast.success("CSV-отчёт сформирован", { description: `${fn} · записей: ${filtered.length}` });
    } finally {
      setTimeout(() => setLoadingCsv(false), 400);
    }
  };

  const onPdf = () => {
    if (filtered.length === 0) {
      toast.warning("Нет данных за выбранный период", { description: "Расширьте диапазон или измените фильтр." });
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
        toast.success("HTML-отчёт скачан (всплывающие окна заблокированы)", { description: res.filename });
      }
    } finally {
      setTimeout(() => setLoadingPdf(false), 600);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><CalendarRange className="size-3.5" />Период с</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Период по</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Filter className="size-3.5" />Устройство</Label>
            <Select value={robotId} onValueChange={setRobotId}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все устройства</SelectItem>
                {robots.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>Найдено: <span className="font-mono font-semibold text-foreground">{filtered.length}</span> измерений</span>
            <span>·</span>
            <span>Средний индекс качества: <span className="font-mono font-semibold text-foreground">{sum.avgScore}/100</span></span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Уровень pH" subtitle="Динамика за 14 дней">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.82 0.15 200)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.82 0.15 200)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.32 0.04 250)" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="oklch(0.7 0.02 250)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} domain={[6, 9]} />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.035 250)", border: "1px solid oklch(0.32 0.04 250)", borderRadius: 8 }} />
              <Area dataKey="ph" stroke="oklch(0.82 0.15 200)" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Растворенный кислород" subtitle="мг/л">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.2 145)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.72 0.2 145)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.32 0.04 250)" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="oklch(0.7 0.02 250)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.035 250)", border: "1px solid oklch(0.32 0.04 250)", borderRadius: 8 }} />
              <Area dataKey="oxygen" stroke="oklch(0.72 0.2 145)" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Мутность и температура" subtitle="NTU / °C">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid stroke="oklch(0.32 0.04 250)" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="oklch(0.7 0.02 250)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.02 250)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.035 250)", border: "1px solid oklch(0.32 0.04 250)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="turbidity" stroke="oklch(0.8 0.18 75)" strokeWidth={2} dot={false} name="Мутность" />
              <Line type="monotone" dataKey="temperature" stroke="oklch(0.72 0.18 220)" strokeWidth={2} dot={false} name="Температура" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="relative overflow-hidden border-border p-5 flex flex-col glass-panel">
          <div className="absolute inset-0 pointer-events-none opacity-60"
               style={{ background: "radial-gradient(ellipse 80% 60% at 100% 0%, oklch(0.62 0.10 215 / 0.25), transparent 70%)" }} />
          <div className="relative text-xs uppercase tracking-[0.14em] text-cyan-accent/80 font-display font-semibold flex items-center gap-1.5">
            <FileDown className="size-3.5" /> Экспорт данных
          </div>
          <h3 className="relative text-xl font-display font-bold mt-1">Скачать отчёт за выбранный период</h3>
          <p className="text-sm text-muted-foreground mt-2">
            В отчёт попадут все измерения <span className="font-semibold text-foreground">с {from} по {to}</span>
            {robotId !== "all" && (
              <> · только устройство <span className="font-semibold text-foreground">{robots.find((r) => r.id === robotId)?.name}</span></>
            )}
            . Будет включена сводная статистика и таблица измерений с оценкой качества по текущим порогам.
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
            <Button onClick={onPdf} disabled={loadingPdf} className="h-14 bg-destructive/90 hover:bg-destructive text-destructive-foreground font-semibold">
              {loadingPdf ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
              Скачать PDF
            </Button>
            <Button onClick={onCsv} disabled={loadingCsv} className="h-14 bg-success/90 hover:bg-success text-success-foreground font-semibold">
              {loadingCsv ? <Loader2 className="size-5 animate-spin" /> : <Sheet className="size-5" />}
              Скачать CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="bg-card border-border p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      {children}
    </Card>
  );
}
