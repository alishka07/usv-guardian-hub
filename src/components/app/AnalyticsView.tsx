import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { FileText, Sheet, Loader2, CalendarRange, Filter } from "lucide-react";
import { toast } from "sonner";
import { trendData } from "./mock-data";
import type { Robot } from "./types";

export function AnalyticsView({ robots }: { robots: Robot[] }) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingXls, setLoadingXls] = useState(false);

  const download = (fmt: "pdf" | "xls") => {
    const setter = fmt === "pdf" ? setLoadingPdf : setLoadingXls;
    setter(true);
    setTimeout(() => {
      setter(false);
      toast.success("Отчет успешно сгенерирован и скачан", {
        description: `Файл report_${Date.now()}.${fmt === "pdf" ? "pdf" : "xlsx"}`,
      });
    }, 1600);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><CalendarRange className="size-3.5" />Период с</Label>
            <Input type="date" defaultValue="2026-05-01" className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Период по</Label>
            <Input type="date" defaultValue="2026-05-15" className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Filter className="size-3.5" />Устройство / миссия</Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все устройства</SelectItem>
                {robots.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                <SelectItem value="m1">Миссия #2026-05-12-A</SelectItem>
                <SelectItem value="m2">Миссия #2026-05-14-B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90">Применить фильтры</Button>
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

        <Card className="bg-gradient-to-br from-primary/15 via-card to-card border-border p-5 flex flex-col">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Экспорт данных</div>
          <h3 className="text-xl font-bold mt-1">Скачать отчет за выбранный период</h3>
          <p className="text-sm text-muted-foreground mt-2">Содержит все измерения, координаты проб и сводную аналитику по выбранным устройствам.</p>
          <div className="mt-auto pt-6 grid grid-cols-2 gap-3">
            <Button onClick={() => download("pdf")} disabled={loadingPdf} className="h-14 bg-destructive/90 hover:bg-destructive text-destructive-foreground font-semibold">
              {loadingPdf ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
              Скачать отчет PDF
            </Button>
            <Button onClick={() => download("xls")} disabled={loadingXls} className="h-14 bg-success/90 hover:bg-success text-success-foreground font-semibold">
              {loadingXls ? <Loader2 className="size-5 animate-spin" /> : <Sheet className="size-5" />}
              Скачать отчет Excel
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
