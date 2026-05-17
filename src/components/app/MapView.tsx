import { useMemo, useState } from "react";
import { Bot, Droplet, ZoomIn, ZoomOut, Layers, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Robot, Sample } from "./types";

type Props = {
  robots: Robot[];
  samples: Sample[];
  onSelectRobot: (r: Robot) => void;
  onSelectSample: (s: Sample) => void;
  selectedRobotId?: string;
};

export function MapView({ robots, samples, onSelectRobot, onSelectSample, selectedRobotId }: Props) {
  const [zoom, setZoom] = useState(2); // 1 = zoomed out (clustered), 3 = zoomed in

  // Simple clustering: when zoom is low, group samples within proximity buckets
  const clusters = useMemo(() => {
    if (zoom >= 3) return samples.map((s) => ({ type: "single" as const, sample: s, x: s.position.x, y: s.position.y }));
    const cellSize = zoom === 1 ? 18 : 10;
    const map = new Map<string, Sample[]>();
    samples.forEach((s) => {
      const key = `${Math.floor(s.position.x / cellSize)}_${Math.floor(s.position.y / cellSize)}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    });
    return Array.from(map.values()).map((arr) => {
      if (arr.length === 1) return { type: "single" as const, sample: arr[0], x: arr[0].position.x, y: arr[0].position.y };
      const x = arr.reduce((a, b) => a + b.position.x, 0) / arr.length;
      const y = arr.reduce((a, b) => a + b.position.y, 0) / arr.length;
      return { type: "cluster" as const, count: arr.length, x, y, sample: arr[0] };
    });
  }, [samples, zoom]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-panel">
        {/* Map background */}
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-accent/10" />
        {/* Mock water bodies */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="lake" cx="50%" cy="50%">
              <stop offset="0%" stopColor="oklch(0.4 0.12 220)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="oklch(0.3 0.08 220)" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <path d="M10,40 Q25,20 45,35 T80,30 Q90,50 75,70 Q55,85 30,75 Q5,60 10,40 Z" fill="url(#lake)" stroke="oklch(0.72 0.18 220 / 0.4)" strokeWidth="0.2" />
          <path d="M55,55 Q65,45 80,55 Q85,70 70,75 Q55,72 55,55 Z" fill="url(#lake)" stroke="oklch(0.72 0.18 220 / 0.4)" strokeWidth="0.2" />
        </svg>
        {/* scan line */}
        <div className="absolute inset-0 scan-line pointer-events-none" />

        {/* Sample markers / clusters */}
        {clusters.map((c, i) => (
          <button
            key={i}
            onClick={() => c.type === "single" && onSelectSample(c.sample)}
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
          >
            {c.type === "cluster" ? (
              <div className="size-9 rounded-full bg-cyan-accent/30 border-2 border-cyan-accent text-cyan-accent flex items-center justify-center font-bold text-sm backdrop-blur hover:scale-110 transition">
                {c.count}
              </div>
            ) : (
              <div className="size-3 rounded-full bg-cyan-accent border-2 border-background hover:size-5 transition-all cursor-pointer shadow-lg shadow-cyan-accent/50" />
            )}
          </button>
        ))}

        {/* Robot markers */}
        {robots.map((r) => (
          <Tooltip key={r.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectRobot(r)}
                style={{ left: `${r.position.x}%`, top: `${r.position.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="relative">
                  {r.status === "online" && (
                    <div className="absolute inset-0 rounded-full bg-success/40 animate-ping" />
                  )}
                  <div className={`relative size-12 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110 ${
                    r.status === "online" ? "bg-success/20 border-success glow-success" : "bg-muted border-muted-foreground/40"
                  } ${selectedRobotId === r.id ? "ring-4 ring-primary/50" : ""}`}>
                    <Bot className={`size-5 ${r.status === "online" ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-card ${
                    r.status === "online" ? "bg-success pulse-dot" : "bg-muted-foreground"
                  }`} />
                </div>
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono font-semibold bg-card/90 px-1.5 py-0.5 rounded border border-border">
                  {r.name}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-xs">
                <div className="font-semibold">{r.name}</div>
                {r.status === "offline" && <div className="text-muted-foreground">Последний раз в сети: {r.lastSeen}</div>}
                {r.status === "online" && <div className="text-success">В сети · Батарея {r.battery}%</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Map controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 bg-card/80 backdrop-blur border border-border rounded-lg p-1">
          <Button size="icon" variant="ghost" onClick={() => setZoom(Math.min(3, zoom + 1))}><ZoomIn className="size-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setZoom(Math.max(1, zoom - 1))}><ZoomOut className="size-4" /></Button>
          <Button size="icon" variant="ghost"><Layers className="size-4" /></Button>
          <Button size="icon" variant="ghost"><Compass className="size-4" /></Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur border border-border rounded-lg p-3 text-xs space-y-1.5">
          <div className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Легенда</div>
          <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-success" />USV онлайн</div>
          <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-muted-foreground" />USV офлайн</div>
          <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-cyan-accent" />Точка пробы</div>
        </div>

        {/* Coordinates HUD */}
        <div className="absolute top-4 right-4 bg-card/80 backdrop-blur border border-border rounded-lg px-3 py-2 text-xs font-mono">
          59.9311° N · 30.3609° E · ZOOM {zoom}/3
        </div>
      </div>
    </TooltipProvider>
  );
}
