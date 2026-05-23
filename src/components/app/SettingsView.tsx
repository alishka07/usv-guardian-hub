import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets, Wind, Eye, Thermometer, Biohazard, RotateCcw, Save, Sliders, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Sample, Thresholds } from "@/domain/types";
import { DEFAULT_THRESHOLDS } from "@/domain/types";
import { assessQuality } from "@/domain/analysis/quality";

type Props = {
  thresholds: Thresholds;
  onChange: (t: Thresholds) => void;
  onReset: () => void;
  samples: Sample[];
};

export function SettingsView({ thresholds, onChange, onReset, samples }: Props) {
  const [draft, setDraft] = useState<Thresholds>(thresholds);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(thresholds), [draft, thresholds]);

  const liveStats = useMemo(() => {
    const n = samples.length || 1;
    const tones = samples.map((s) => assessQuality(s, draft).tone);
    const avg = samples.reduce((a, s) => a + assessQuality(s, draft).score, 0) / n;
    return {
      avg: +avg.toFixed(1),
      success: tones.filter((t) => t === "success").length,
      warning: tones.filter((t) => t === "warning").length,
      danger: tones.filter((t) => t === "danger").length,
      critical: tones.filter((t) => t === "critical").length,
    };
  }, [draft, samples]);

  const save = () => {
    onChange(draft);
    toast.success("Пороги сохранены", { description: "Индикаторы качества и отчёты пересчитаны." });
  };

  const reset = () => {
    setDraft(DEFAULT_THRESHOLDS);
    onReset();
    toast.info("Значения сброшены к стандартным");
  };

  const setPh = (k: keyof Thresholds["ph"], v: number) => setDraft({ ...draft, ph: { ...draft.ph, [k]: v } });
  const setOx = (k: keyof Thresholds["oxygen"], v: number) => setDraft({ ...draft, oxygen: { ...draft.oxygen, [k]: v } });
  const setTu = (k: keyof Thresholds["turbidity"], v: number) => setDraft({ ...draft, turbidity: { ...draft.turbidity, [k]: v } });
  const setTe = (k: keyof Thresholds["temperature"], v: number) => setDraft({ ...draft, temperature: { ...draft.temperature, [k]: v } });
  const setPo = (k: keyof Thresholds["pollution"], v: number) => setDraft({ ...draft, pollution: { ...draft.pollution, [k]: v } });

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border p-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Sliders className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg leading-tight">Пороги качества воды</h2>
            <p className="text-xs text-muted-foreground">Управляйте границами нормы для всех метрик. Изменения сразу пересчитывают индикатор качества на карте, в карточках проб и в отчётах.</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={reset} className="gap-2"><RotateCcw className="size-4" /> Сбросить</Button>
          <Button onClick={save} disabled={!dirty} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="size-4" /> {dirty ? "Сохранить изменения" : "Сохранено"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ThresholdCard icon={Droplets} title="Уровень pH" subtitle="Кислотность воды" tone="text-cyan-accent">
          <NumRow label="Нижняя норма" value={draft.ph.warnMin} step={0.1} onChange={(v) => setPh("warnMin", v)} hint="ниже — предупреждение" />
          <NumRow label="Верхняя норма" value={draft.ph.warnMax} step={0.1} onChange={(v) => setPh("warnMax", v)} hint="выше — предупреждение" />
          <NumRow label="Жёсткая нижняя" value={draft.ph.min} step={0.1} onChange={(v) => setPh("min", v)} hint="ниже — вне нормы" />
          <NumRow label="Жёсткая верхняя" value={draft.ph.max} step={0.1} onChange={(v) => setPh("max", v)} hint="выше — вне нормы" />
        </ThresholdCard>

        <ThresholdCard icon={Wind} title="Растворённый кислород" subtitle="мг/л" tone="text-success">
          <NumRow label="Норма от" value={draft.oxygen.warn} step={0.1} onChange={(v) => setOx("warn", v)} hint="ниже — понижен" />
          <NumRow label="Критично ниже" value={draft.oxygen.critical} step={0.1} onChange={(v) => setOx("critical", v)} hint="ниже — критично" />
        </ThresholdCard>

        <ThresholdCard icon={Eye} title="Мутность" subtitle="NTU" tone="text-warning">
          <NumRow label="Норма до" value={draft.turbidity.warn} step={0.1} onChange={(v) => setTu("warn", v)} hint="выше — повышена" />
          <NumRow label="Критично выше" value={draft.turbidity.critical} step={0.1} onChange={(v) => setTu("critical", v)} hint="выше — критично" />
        </ThresholdCard>

        <ThresholdCard icon={Thermometer} title="Температура" subtitle="°C" tone="text-primary">
          <NumRow label="Норма до" value={draft.temperature.warn} step={0.5} onChange={(v) => setTe("warn", v)} hint="выше — высокая" />
        </ThresholdCard>

        <ThresholdCard icon={Biohazard} title="Индекс загрязнения" subtitle="0–100" tone="text-destructive">
          <NumRow label="Низкий (норма) до" value={draft.pollution.ok} step={1} onChange={(v) => setPo("ok", v)} hint="" />
          <NumRow label="Умеренный до" value={draft.pollution.warn} step={1} onChange={(v) => setPo("warn", v)} hint="" />
          <NumRow label="Высокий до" value={draft.pollution.danger} step={1} onChange={(v) => setPo("danger", v)} hint="выше — критический" />
        </ThresholdCard>

        <Card className="bg-card border-border p-5 lg:col-span-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> Предпросмотр пересчёта
          </div>
          <h3 className="text-base font-semibold mt-1">Влияние на {samples.length} проб</h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Средний индекс качества</span>
              <span className="text-2xl font-bold tabular-nums">{liveStats.avg}<span className="text-sm text-muted-foreground">/100</span></span>
            </div>
            <div className="h-2 rounded-full bg-background/60 overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${liveStats.avg}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
              <ToneCell n={liveStats.success} label="Норма" tone="bg-success/15 text-success border-success/30" />
              <ToneCell n={liveStats.warning} label="Удовл." tone="bg-warning/15 text-warning border-warning/30" />
              <ToneCell n={liveStats.danger} label="Плохо" tone="bg-destructive/15 text-destructive border-destructive/30" />
              <ToneCell n={liveStats.critical} label="Крит." tone="bg-[oklch(0.55_0.22_300)]/15 text-[oklch(0.78_0.18_300)] border-[oklch(0.55_0.22_300)]/40" />
            </div>
            {dirty && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
                <AlertTriangle className="size-4 mt-0.5 flex-shrink-0" />
                <span>Есть несохранённые изменения — нажмите «Сохранить», чтобы применить пороги к карте и отчётам.</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ThresholdCard({
  icon: Icon,
  title,
  subtitle,
  tone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`size-5 ${tone}`} />
        <div>
          <h3 className="font-semibold leading-tight">{title}</h3>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </Card>
  );
}

function NumRow({
  label,
  value,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_120px] items-center gap-3">
      <div>
        <Label className="text-xs">{label}</Label>
        {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
      </div>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
        className="h-9 font-mono text-right"
      />
    </div>
  );
}

function ToneCell({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className={`rounded-md border p-1.5 ${tone}`}>
      <div className="text-lg font-bold tabular-nums leading-tight">{n}</div>
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
    </div>
  );
}
