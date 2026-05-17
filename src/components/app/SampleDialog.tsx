import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Droplets, Wind, Eye, Thermometer, Camera, Calendar, MapPin, Ruler, Biohazard, ShieldCheck, ShieldAlert, ShieldX, CircleCheck } from "lucide-react";
import type { Sample } from "./types";

type Quality = { label: string; tone: "success" | "warning" | "danger" | "critical"; icon: typeof ShieldCheck; score: number };

function assessQuality(s: Sample): Quality {
  let score = 100;
  if (s.ph < 6.5 || s.ph > 8.5) score -= 25;
  else if (s.ph < 6.8 || s.ph > 8.2) score -= 10;
  if (s.oxygen < 4) score -= 30; else if (s.oxygen < 6) score -= 12;
  if (s.turbidity > 8) score -= 25; else if (s.turbidity > 5) score -= 10;
  if (s.temperature > 24) score -= 10;
  score -= Math.max(0, s.pollution - 20) * 0.5;
  score = Math.max(0, Math.min(100, Math.round(score)));
  if (score >= 80) return { label: "Отлично", tone: "success", icon: ShieldCheck, score };
  if (score >= 60) return { label: "Хорошо", tone: "success", icon: CircleCheck, score };
  if (score >= 40) return { label: "Удовлетворительно", tone: "warning", icon: ShieldAlert, score };
  if (score >= 20) return { label: "Плохо", tone: "danger", icon: ShieldX, score };
  return { label: "Критическое", tone: "critical", icon: ShieldX, score };
}

const TONE: Record<Quality["tone"], { bg: string; text: string; border: string; bar: string }> = {
  success: { bg: "bg-success/15", text: "text-success", border: "border-success/30", bar: "bg-success" },
  warning: { bg: "bg-warning/15", text: "text-warning", border: "border-warning/30", bar: "bg-warning" },
  danger: { bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/30", bar: "bg-destructive" },
  critical: { bg: "bg-[oklch(0.55_0.22_300)]/15", text: "text-[oklch(0.78_0.18_300)]", border: "border-[oklch(0.55_0.22_300)]/40", bar: "bg-[oklch(0.7_0.2_300)]" },
};

function pollutionLabel(p: number) {
  if (p < 20) return { label: "Низкий", tone: "success" as const };
  if (p < 45) return { label: "Умеренный", tone: "warning" as const };
  if (p < 70) return { label: "Высокий", tone: "danger" as const };
  return { label: "Критический", tone: "critical" as const };
}

export function SampleDialog({ sample, onClose }: { sample: Sample | null; onClose: () => void }) {
  if (!sample) return null;
  const d = new Date(sample.date);
  const quality = assessQuality(sample);
  const QIcon = quality.icon;
  const qTone = TONE[quality.tone];
  const poll = pollutionLabel(sample.pollution);
  const pTone = TONE[poll.tone];
  const lat = (43.88 + (sample.position.y - 50) * 0.0015).toFixed(5);
  const lon = (77.07 + (sample.position.x - 50) * 0.002).toFixed(5);

  const metrics = [
    { icon: Droplets, label: "Уровень pH", value: sample.ph, unit: "", color: "text-cyan-accent", note: sample.ph >= 6.5 && sample.ph <= 8.5 ? "в норме" : "вне нормы" },
    { icon: Wind, label: "Растворённый кислород", value: sample.oxygen, unit: "мг/л", color: "text-success", note: sample.oxygen >= 6 ? "в норме" : sample.oxygen >= 4 ? "понижен" : "критично" },
    { icon: Eye, label: "Мутность", value: sample.turbidity, unit: "NTU", color: "text-warning", note: sample.turbidity <= 5 ? "в норме" : "повышена" },
    { icon: Thermometer, label: "Температура", value: sample.temperature, unit: "°C", color: "text-primary", note: sample.temperature <= 24 ? "в норме" : "высокая" },
  ];
  return (
    <Dialog open={!!sample} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Droplets className="size-5 text-primary" /> Карточка измерения · {sample.id.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar className="size-3.5" />{d.toLocaleDateString("ru-RU")} · {d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="flex items-center gap-1.5 font-mono"><MapPin className="size-3.5 text-primary" />{lat}° N, {lon}° E</span>
          <span className="flex items-center gap-1.5 font-mono"><Ruler className="size-3.5 text-cyan-accent" />Глубина {sample.depth} м</span>
        </div>

        {/* Quality indicator */}
        <div className={`rounded-xl border ${qTone.border} ${qTone.bg} p-4 flex items-center gap-4`}>
          <div className={`size-14 rounded-xl ${qTone.bg} border ${qTone.border} flex items-center justify-center`}>
            <QIcon className={`size-7 ${qTone.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Качество воды</div>
            <div className={`text-xl font-bold ${qTone.text}`}>{quality.label}</div>
            <div className="mt-1.5 h-2 rounded-full bg-background/60 overflow-hidden">
              <div className={`h-full ${qTone.bar} transition-all`} style={{ width: `${quality.score}%` }} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Индекс</div>
            <div className={`text-3xl font-bold tabular-nums ${qTone.text}`}>{quality.score}<span className="text-sm text-muted-foreground">/100</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-border bg-panel/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</span>
                <m.icon className={`size-4 ${m.color}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${m.color}`}>{m.value}</span>
                <span className="text-sm text-muted-foreground">{m.unit}</span>
                <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider">{m.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pollution */}
        <div className={`rounded-lg border ${pTone.border} ${pTone.bg} p-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Biohazard className={`size-4 ${pTone.text}`} />Уровень загрязнения</span>
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${pTone.text}`}>{poll.label}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold tabular-nums ${pTone.text}`}>{sample.pollution}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-background/60 overflow-hidden">
            <div className={`h-full ${pTone.bar}`} style={{ width: `${sample.pollution}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-panel/30 aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Camera className="size-10 opacity-50" />
          <span className="text-sm">Фотофиксация с камеры робота</span>
          <span className="text-xs opacity-60 font-mono">IMG_{sample.id}_{d.getTime()}.jpg</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
