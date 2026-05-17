import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Droplets, Wind, Eye, Thermometer, Camera, Calendar } from "lucide-react";
import type { Sample } from "./types";

export function SampleDialog({ sample, onClose }: { sample: Sample | null; onClose: () => void }) {
  if (!sample) return null;
  const d = new Date(sample.date);
  const metrics = [
    { icon: Droplets, label: "Уровень pH", value: sample.ph, unit: "", color: "text-cyan-accent" },
    { icon: Wind, label: "Растворенный кислород", value: sample.oxygen, unit: "мг/л", color: "text-success" },
    { icon: Eye, label: "Мутность", value: sample.turbidity, unit: "NTU", color: "text-warning" },
    { icon: Thermometer, label: "Температура", value: sample.temperature, unit: "°C", color: "text-primary" },
  ];
  return (
    <Dialog open={!!sample} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Droplets className="size-5 text-primary" /> Карточка измерения · {sample.id.toUpperCase()}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          {d.toLocaleDateString("ru-RU")} в {d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
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
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-dashed border-border bg-panel/30 aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Camera className="size-10 opacity-50" />
          <span className="text-sm">Фотофиксация с камеры робота</span>
          <span className="text-xs opacity-60">IMG_{sample.id}_{d.getTime()}.jpg</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
