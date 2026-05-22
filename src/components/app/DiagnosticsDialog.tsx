import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Activity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Robot } from "./types";

const CHECKS = [
  "GPS-приёмник",
  "Эхолот / датчик глубины",
  "Насос пробоотборника",
  "IMU / гирокомпас",
  "Бортовая камера",
  "Канал связи",
  "Датчики качества воды",
];

type CheckState = "idle" | "run" | "ok" | "warn";

// Simulated onboard self-test + sensor calibration for a USV.
export function DiagnosticsDialog({
  robot,
  open,
  onOpenChange,
}: {
  robot: Robot;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(-1);
  const [results, setResults] = useState<CheckState[]>([]);

  const run = async () => {
    setRunning(true);
    setDone(-1);
    setResults([]);
    const res: CheckState[] = [];
    for (let i = 0; i < CHECKS.length; i++) {
      await new Promise((r) => setTimeout(r, 430));
      const weakLink = CHECKS[i] === "Канал связи" && robot.signal < 55;
      const weakBattery = CHECKS[i] === "Насос пробоотборника" && robot.battery < 20;
      res.push(weakLink || weakBattery ? "warn" : "ok");
      setResults([...res]);
      setDone(i);
    }
    setRunning(false);
    const warns = res.filter((r) => r === "warn").length;
    if (warns) {
      toast.warning("Самотест завершён с замечаниями", {
        description: `${robot.name}: требуют внимания — ${warns}`,
      });
    } else {
      toast.success("Самотест пройден, датчики откалиброваны", {
        description: `${robot.name}: все бортовые системы в норме`,
      });
    }
  };

  const progress = done < 0 ? 0 : ((done + 1) / CHECKS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Activity className="size-5 text-primary" /> Самотест и калибровка · {robot.name}
          </DialogTitle>
          <DialogDescription>
            Диагностика бортовых систем USV. Калибровка датчиков качества воды выполняется
            автоматически по завершении проверки.
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-1.5" />

        <div className="space-y-1.5">
          {CHECKS.map((c, i) => {
            const state: CheckState =
              i <= done ? results[i] : running && i === done + 1 ? "run" : "idle";
            return (
              <div
                key={c}
                className="flex items-center gap-2 text-sm rounded-md border border-border bg-panel/40 px-3 py-2"
              >
                {state === "ok" && <CheckCircle2 className="size-4 text-success" />}
                {state === "warn" && <AlertTriangle className="size-4 text-warning" />}
                {state === "run" && <Loader2 className="size-4 animate-spin text-primary" />}
                {state === "idle" && <Activity className="size-4 text-muted-foreground/40" />}
                <span className={state === "idle" ? "text-muted-foreground" : ""}>{c}</span>
                <span className="ml-auto text-xs font-mono text-muted-foreground">
                  {state === "ok"
                    ? "OK"
                    : state === "warn"
                      ? "ПРОВЕРИТЬ"
                      : state === "run"
                        ? "..."
                        : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button
            onClick={run}
            disabled={running}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {running ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Activity className="size-4" />
            )}
            {running ? "Выполняется..." : "Запустить самотест"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
