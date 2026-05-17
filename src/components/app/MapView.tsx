import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Bot, ZoomIn, ZoomOut, Layers, Compass, Anchor, Building2, Waves, MapPin, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Robot, Sample } from "./types";
import { MAP_LANDMARKS, RESERVOIR } from "./mock-data";

type Props = {
  robots: Robot[];
  samples: Sample[];
  onSelectRobot: (r: Robot) => void;
  onSelectSample: (s: Sample) => void;
  selectedRobotId?: string;
  editMode?: boolean;
  editingRobotId?: string;
  draftWaypoints?: { x: number; y: number }[];
  onMapClick?: (x: number, y: number) => void;
};

// Stylised Kapshagay reservoir outline (oriented NE→SW), with a narrow Ili river inlet on the east.
const RESERVOIR_PATH = `
  M 8,68
  C 6,62 10,58 16,57
  C 24,55 30,54 38,52
  C 46,50 54,47 62,44
  C 70,41 78,38 86,33
  C 90,31 93,32 93,36
  C 93,40 89,42 84,44
  C 76,47 68,49 60,51
  C 52,53 44,55 36,58
  C 28,60 20,62 14,66
  C 11,68 10,70 8,68 Z
`;
const RIVER_PATH = `M 86,33 C 92,28 97,24 99,18`;

export function MapView({ robots, samples, onSelectRobot, onSelectSample, selectedRobotId, editMode, editingRobotId, draftWaypoints, onMapClick }: Props) {
  // continuous zoom (1..6) + pan offset in % of container size
  const [zoom, setZoom] = useState(1.4);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showTrails, setShowTrails] = useState(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const clampPan = useCallback((p: { x: number; y: number }, z: number) => {
    const max = (z - 1) * 50; // %
    return { x: Math.max(-max, Math.min(max, p.x)), y: Math.max(-max, Math.min(max, p.y)) };
  }, []);

  // wheel zoom around cursor
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    const delta = -e.deltaY * 0.002;
    const next = Math.max(1, Math.min(6, zoom * (1 + delta)));
    const k = next / zoom;
    const npx = (pan.x + (50 - cx)) * k - (50 - cx);
    const npy = (pan.y + (50 - cy)) * k - (50 - cy);
    setZoom(next);
    setPan(clampPan({ x: npx, y: npy }, next));
  };

  // pan with pointer drag
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editMode) return; // in edit mode left-click adds waypoint instead
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.y) / rect.height) * 100;
    setPan(clampPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy }, zoom));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    dragRef.current = null;
    setDragging(false);
  };

  // click → add waypoint in edit mode (compute % coords in untransformed map space)
  const onLayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onMapClick || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    // invert transform: container origin 50,50 → scale + translate(pan)
    const ux = (cx - 50 - pan.x) / zoom + 50;
    const uy = (cy - 50 - pan.y) / zoom + 50;
    if (ux < 1 || ux > 99 || uy < 1 || uy > 99) return;
    onMapClick(+ux.toFixed(2), +uy.toFixed(2));
  };

  // prevent native scroll-zoom of the page
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (ev: WheelEvent) => ev.preventDefault();
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const clusters = useMemo(() => {
    if (zoom >= 2.5) return samples.map((s) => ({ type: "single" as const, sample: s, x: s.position.x, y: s.position.y }));
    const cellSize = zoom < 1.6 ? 14 : 8;
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

  const transformStyle: React.CSSProperties = {
    transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`,
    transformOrigin: "50% 50%",
    transition: dragging ? "none" : "transform 0.15s ease-out",
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={wrapRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onLayerClick}
        className={`relative w-full h-full rounded-xl overflow-hidden border border-border bg-[oklch(0.18_0.025_245)] select-none ${editMode ? "cursor-crosshair" : dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        {/* zoom/pan transform layer (everything map-relative goes inside) */}
        <div className="absolute inset-0" style={transformStyle}>
        {/* terrain backdrop */}
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 40% at 30% 80%, oklch(0.27 0.05 80 / 0.35), transparent 70%), radial-gradient(ellipse 50% 30% at 80% 20%, oklch(0.26 0.06 60 / 0.3), transparent 70%)",
          }}
        />

        {/* Reservoir & river as SVG (positions match marker % coords) */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.45 0.13 220)" stopOpacity="0.9" />
              <stop offset="60%" stopColor="oklch(0.35 0.1 215)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="oklch(0.28 0.08 210)" stopOpacity="0.9" />
            </linearGradient>
            <filter id="ripple">
              <feTurbulence baseFrequency="0.9" numOctaves="2" seed="3" />
              <feColorMatrix values="0 0 0 0 0.7  0 0 0 0 0.85  0 0 0 0 1  0 0 0 0.07 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
            <radialGradient id="bay-glow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="oklch(0.72 0.18 220 / 0.25)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            {robots.map((r) => (
              <linearGradient key={r.id} id={`trail-${r.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={r.color} stopOpacity="0" />
                <stop offset="100%" stopColor={r.color} stopOpacity="0.95" />
              </linearGradient>
            ))}
          </defs>

          {/* shoreline shadow */}
          <path d={RESERVOIR_PATH} fill="oklch(0.2 0.03 245)" transform="translate(0.4 0.5)" opacity="0.7" />
          {/* water */}
          <path d={RESERVOIR_PATH} fill="url(#water)" stroke="oklch(0.78 0.14 210 / 0.55)" strokeWidth="0.25" />
          {/* ripple overlay */}
          <path d={RESERVOIR_PATH} fill="url(#water)" filter="url(#ripple)" opacity="0.6" />
          {/* bay highlight */}
          <ellipse cx="48" cy="44" rx="12" ry="5" fill="url(#bay-glow)" />
          {/* river Ili inlet */}
          <path d={RIVER_PATH} stroke="oklch(0.6 0.13 215)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d={RIVER_PATH} stroke="oklch(0.85 0.1 210)" strokeWidth="0.3" fill="none" strokeLinecap="round" />

          {/* depth contour lines */}
          <path d="M 22,60 C 36,56 56,49 80,40" fill="none" stroke="oklch(0.78 0.12 210 / 0.18)" strokeWidth="0.18" strokeDasharray="0.8 0.8" />
          <path d="M 26,62 C 42,58 60,52 82,44" fill="none" stroke="oklch(0.78 0.12 210 / 0.14)" strokeWidth="0.18" strokeDasharray="0.6 1" />

          {/* Trails */}
          {showTrails && zoom >= 1.2 && robots.map((r) => {
            if (r.trail.length < 2) return null;
            // Decimate at low zoom so the SVG path stays light and visually clean.
            const stride = zoom < 1.6 ? 4 : zoom < 2.4 ? 2 : 1;
            // Limit total drawn points based on zoom (more detail when zoomed in)
            const maxPts = zoom < 1.6 ? 8 : zoom < 2.4 ? 16 : 28;
            const decimated: { x: number; y: number }[] = [];
            for (let i = 0; i < r.trail.length; i += stride) decimated.push(r.trail[i]);
            if (decimated[decimated.length - 1] !== r.trail[r.trail.length - 1]) {
              decimated.push(r.trail[r.trail.length - 1]);
            }
            const trimmed = decimated.slice(-maxPts);
            const pts = trimmed.map((p) => `${p.x},${p.y}`).join(" ");
            // Stroke widths counter-scaled with zoom so they don't bloat on zoom-in
            const w1 = +(1.6 / zoom).toFixed(2);
            const w2 = +(0.45 / zoom).toFixed(2);
            return (
              <g key={`trail-g-${r.id}`}>
                <polyline points={pts} fill="none" stroke={r.color} strokeOpacity={0.22} strokeWidth={w1} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={pts} fill="none" stroke={r.color} strokeWidth={w2} strokeDasharray="0.4 1.2" strokeLinecap="round" />
              </g>
            );
          })}

          {/* Planned waypoint paths (dotted) */}
          {robots.map((r) => {
            if (r.status !== "online" && r.status !== "mission") return null;
            const remaining = r.waypoints.slice(r.waypointIdx).map((p) => `${p.x},${p.y}`).join(" ");
            return (
              <polyline
                key={`wp-${r.id}`}
                points={`${r.position.x},${r.position.y} ${remaining}`}
                fill="none"
                stroke={r.color}
                strokeOpacity={r.status === "mission" ? 0.85 : 0.35}
                strokeWidth={r.status === "mission" ? 0.45 : 0.35}
                strokeDasharray="0.6 0.8"
              />
            );
          })}

          {/* Draft route preview (edit mode) */}
          {editMode && draftWaypoints && draftWaypoints.length > 0 && (
            <g>
              <polyline
                points={draftWaypoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="oklch(0.85 0.15 200)"
                strokeOpacity="0.85"
                strokeWidth="0.5"
                strokeDasharray="0.8 0.8"
              />
            </g>
          )}
        </svg>

        {/* scan sweep */}
        <div className="absolute inset-0 scan-line pointer-events-none opacity-60" />

        {/* Landmarks */}
        {MAP_LANDMARKS.map((l) => (
          <div
            key={l.id}
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-foreground/60 ring-2 ring-background/40" />
              <span className="text-[10px] uppercase tracking-[0.12em] text-foreground/70 font-medium bg-background/30 backdrop-blur-sm px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                {l.kind === "base" && <Anchor className="inline size-2.5 mr-1 -mt-0.5" />}
                {l.kind === "infra" && <Building2 className="inline size-2.5 mr-1 -mt-0.5" />}
                {l.label}
              </span>
            </div>
          </div>
        ))}

        {/* Sample markers / clusters */}
        {clusters.map((c, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); if (c.type === "single") onSelectSample(c.sample); }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
              >
                {c.type === "cluster" ? (
                  <div className="flex flex-col items-center">
                    <div className="size-9 rounded-full bg-cyan-accent/25 border-[1.5px] border-cyan-accent/80 text-cyan-accent flex items-center justify-center font-bold text-sm backdrop-blur-md hover:scale-110 transition shadow-[0_0_12px_oklch(0.82_0.15_200/0.4)]">
                      {c.count}
                    </div>
                    <span className="text-[9px] text-cyan-accent/80 mt-0.5 font-medium">проб</span>
                  </div>
                ) : (
                  <div className="size-2.5 rounded-full bg-cyan-accent border border-background hover:size-4 transition-all cursor-pointer shadow-[0_0_8px_oklch(0.82_0.15_200/0.7)]" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-xs">
                {c.type === "cluster" ? `Кластер: ${c.count} проб` : `Проба ${c.sample.id.toUpperCase()} · pH ${c.sample.ph}`}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Robot markers */}
        {robots.map((r) => (
          <Tooltip key={r.id}>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); onSelectRobot(r); }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  left: `${r.position.x}%`,
                  top: `${r.position.y}%`,
                  transition: "left 1.4s linear, top 1.4s linear",
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="relative">
                  {(r.status === "online" || r.status === "mission") && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: r.color, opacity: 0.25 }}
                    />
                  )}
                  <div
                    className={`relative size-11 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110 ${
                      r.status === "offline" ? "bg-muted/70 border-muted-foreground/50" : ""
                    } ${selectedRobotId === r.id ? "ring-4 ring-offset-1 ring-offset-background ring-primary/60" : ""}`}
                    style={
                      r.status === "online" || r.status === "mission"
                        ? { background: `color-mix(in oklch, ${r.color} 22%, transparent)`, borderColor: r.color, boxShadow: `0 0 18px ${r.color}` }
                        : {}
                    }
                  >
                    <Bot className="size-5" style={{ color: r.status === "offline" ? "oklch(0.7 0.02 250)" : r.color }} />
                    {/* Heading indicator */}
                    {(r.status === "online" || r.status === "mission") && (
                      <div
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-0 origin-center"
                        style={{ transform: `translateX(-50%) rotate(${r.heading + 90}deg)` }}
                      >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px]"
                          style={{ borderBottomColor: r.color }} />
                      </div>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-card ${
                    r.status === "online" || r.status === "mission" ? "bg-success pulse-dot" : r.status === "rtl" ? "bg-warning pulse-dot" : "bg-muted-foreground"
                  }`} />
                </div>
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono font-semibold bg-card/85 backdrop-blur px-1.5 py-0.5 rounded border border-border">
                  {r.name}{r.status === "mission" ? " · миссия" : ""}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">{r.name}</div>
                {(r.status === "online" || r.status === "mission") && <div className="text-success">{r.status === "mission" ? "Выполняет миссию" : "В сети"} · {r.battery.toFixed(0)}% · {r.speed} м/с</div>}
                {r.status === "rtl" && <div className="text-warning">Возврат на базу · {r.battery.toFixed(0)}%</div>}
                {r.status === "offline" && <div className="text-muted-foreground">Последний раз в сети: {r.lastSeen}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Draft waypoint markers (edit mode) */}
        {editMode && draftWaypoints && draftWaypoints.map((w, i) => (
          <div
            key={`draft-${i}`}
            style={{ left: `${w.x}%`, top: `${w.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <div className="size-6 rounded-full bg-cyan-accent text-background border-2 border-background flex items-center justify-center text-[11px] font-bold shadow-lg">
              {i + 1}
            </div>
          </div>
        ))}
        </div>
        {/* /transform layer */}

        {/* Map controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 bg-card/85 backdrop-blur border border-border rounded-lg p-1 shadow-lg">
          <Button size="icon" variant="ghost" onClick={() => { const n = Math.min(6, zoom + 0.6); setZoom(n); setPan((p) => clampPan(p, n)); }} title="Приблизить"><ZoomIn className="size-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => { const n = Math.max(1, zoom - 0.6); setZoom(n); setPan((p) => clampPan(p, n)); }} title="Отдалить"><ZoomOut className="size-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => { setZoom(1.4); setPan({ x: 0, y: 0 }); }} title="Сбросить вид"><RotateCcw className="size-4" /></Button>
          <div className="h-px bg-border my-0.5" />
          <Button size="icon" variant={showTrails ? "secondary" : "ghost"} onClick={() => setShowTrails((s) => !s)} title="Следы движения"><Waves className="size-4" /></Button>
          <Button size="icon" variant="ghost" title="Слои"><Layers className="size-4" /></Button>
          <Button size="icon" variant="ghost" title="Компас"><Compass className="size-4" /></Button>
        </div>

        {editMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 mt-12 flex items-center gap-2 bg-cyan-accent/15 border border-cyan-accent/50 text-cyan-accent backdrop-blur rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg">
            <Pencil className="size-3.5" />
            Режим редактирования: кликните по водохранилищу, чтобы добавить точку
            {editingRobotId && <span className="opacity-70 font-mono">· {editingRobotId}</span>}
          </div>
        )}

        {/* Reservoir label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/70 backdrop-blur border border-border rounded-full px-3 py-1 text-xs text-foreground/80 flex items-center gap-1.5">
          <MapPin className="size-3 text-primary" />
          <span className="font-semibold">{RESERVOIR.name}</span>
          <span className="text-muted-foreground">· {RESERVOIR.river}</span>
        </div>

        {/* Coordinates HUD */}
        <div className="absolute top-4 right-4 bg-card/85 backdrop-blur border border-border rounded-lg px-3 py-2 text-[11px] font-mono leading-tight">
          <div>{RESERVOIR.lat} · {RESERVOIR.lon}</div>
          <div className="text-muted-foreground">ZOOM {zoom.toFixed(1)}× · UTC+5 Алматы</div>
        </div>

        {/* Scale bar */}
        <div className="absolute bottom-4 right-4 bg-card/85 backdrop-blur border border-border rounded-lg px-3 py-2 text-[10px] font-mono">
          <div className="flex items-end gap-0">
            <div className="h-2 w-10 bg-foreground/80" />
            <div className="h-2 w-10 bg-foreground/30" />
          </div>
          <div className="flex justify-between w-20 mt-0.5 text-muted-foreground"><span>0</span><span>5</span><span>10 км</span></div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/85 backdrop-blur border border-border rounded-lg p-3 text-xs space-y-1.5 shadow-lg">
          <div className="font-semibold text-muted-foreground uppercase tracking-[0.12em] text-[10px] mb-1.5">Легенда</div>
          {robots.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <div className="size-2.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
              <span className="font-mono text-[11px]">{r.name}</span>
            </div>
          ))}
          <div className="h-px bg-border my-1.5" />
          <div className="flex items-center gap-2"><div className="size-2.5 rounded-full bg-cyan-accent" />Точка пробы</div>
        </div>
      </div>
    </TooltipProvider>
  );
}
