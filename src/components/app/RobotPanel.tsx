import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { X, Battery, Signal, MapPin, OctagonAlert, Home, Bot } from "lucide-react";
import { toast } from "sonner";
import type { Robot } from "./types";

export function RobotPanel({ robot, onClose, onUpdate }: { robot: Robot; onClose: () => void; onUpdate: (r: Robot) => void }) {
  const emergency = () => toast.error("АВАРИЙНАЯ ОСТАНОВКА", { description: `${robot.name} остановлен.` });
  const rtl = () => toast.warning("Возврат на базу инициирован", { description: `${robot.name} следует на точку RTL.` });

  return (
    <div className="absolute right-4 top-4 bottom-4 w-[360px] z-20 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-border flex items-center justify-between bg-panel/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/15">
            <Bot className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold leading-tight">{robot.name}</div>
            <div className="text-xs text-muted-foreground">{robot.model}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        <div className="flex items-center gap-2">
          <Badge className={robot.status === "online" ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground border-border"}>
            <span className={`size-1.5 rounded-full mr-1.5 ${robot.status === "online" ? "bg-success pulse-dot" : "bg-muted-foreground"}`} />
            {robot.status === "online" ? "В сети" : "Не в сети"}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">ID: {robot.serial}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-panel/50 border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Battery className="size-3.5" />Батарея</div>
            <div className="mt-1 font-bold text-lg">{robot.battery}%</div>
            <Progress value={robot.battery} className="h-1.5 mt-1" />
          </div>
          <div className="rounded-lg bg-panel/50 border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Signal className="size-3.5" />Сигнал</div>
            <div className="mt-1 font-bold text-lg">{robot.signal}%</div>
            <Progress value={robot.signal} className="h-1.5 mt-1" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Количество проб за выезд</Label>
          <Input type="number" value={robot.samplesPerTrip} onChange={(e) => onUpdate({ ...robot, samplesPerTrip: +e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><MapPin className="size-3.5" />Планирование маршрута (Waypoint GPS)</Label>
          <Input placeholder="59.9311, 30.3609" />
          <Input placeholder="59.9425, 30.3556" />
          <Button variant="outline" size="sm" className="w-full">+ Добавить точку</Button>
        </div>

        <div className="pt-2 space-y-2">
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
