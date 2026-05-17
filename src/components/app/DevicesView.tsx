import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Bot, Battery, Signal, Settings2, Cpu } from "lucide-react";
import type { Robot } from "./types";

export function DevicesView({ robots }: { robots: Robot[] }) {
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
              <div className="flex items-center gap-1 text-xs"><Battery className="size-3" />{r.battery}%</div>
              <Progress value={r.battery} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs"><Signal className="size-3" />{r.signal}%</div>
              <Progress value={r.signal} className="h-1" />
            </div>
            <div className="text-sm font-mono">{r.samplesPerTrip} / выезд</div>
            <div className="flex justify-end"><Button variant="ghost" size="sm"><Settings2 className="size-4" /></Button></div>
          </div>
        ))}
      </Card>
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
