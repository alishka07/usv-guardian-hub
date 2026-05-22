import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import {
  Bot,
  ZoomIn,
  ZoomOut,
  Layers,
  Compass,
  Anchor,
  Building2,
  Waves,
  MapPin,
  Pencil,
  RotateCcw,
  Maximize2,
  Crosshair,
  Ruler,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Robot, Sample, Thresholds } from "./types";
import { MAP_LANDMARKS, RESERVOIR } from "./mock-data";
import { MICRO_SOURCES } from "./microplastic";

// Heatmap colour ramp for microparticle concentration (particles/m³).
function heatColor(v: number): string {
  if (v < 500) return "oklch(0.80 0.15 200)"; // teal — low
  if (v < 1200) return "oklch(0.84 0.17 95)"; // amber — moderate
  if (v < 2200) return "oklch(0.64 0.22 25)"; // red — high
  return "oklch(0.62 0.25 320)"; // magenta — critical
}

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
  highlightedSampleId?: string;
  thresholds: Thresholds;
};

// Kapshagay reservoir — elongated W→E lens, narrow at the dam and at the Ili mouth, wider in the middle.
const RESERVOIR_PATH = `
  M 10,64
  C 8,62 9,59 13,58
  C 18,57 24,56 30,55
  C 38,53 46,51 54,49
  C 62,47 70,44 78,41
  C 84,38 88,36 91,35
  C 93,34 94,36 92,38
  C 89,40 84,42 78,44
  C 70,47 62,49 54,51
  C 46,53 38,55 30,57
  C 24,59 18,61 14,63
  C 12,64 11,65 10,64 Z
`;
const RIVER_PATH = `M 91,35 C 95,32 97,28 99,22`;
const TRIB_PATH = `M 64,49 C 66,53 67,57 65,62`;

export function MapView({
  robots,
  samples,
  onSelectRobot,
  onSelectSample,
  selectedRobotId,
  editMode,
  editingRobotId,
  draftWaypoints,
  onMapClick,
  highlightedSampleId,
  thresholds,
}: Props) {
  const [zoom, setZoom] = useState(1.4);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showTrails, setShowTrails] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const clampPan = useCallback((p: { x: number; y: number }, z: number) => {
    const max = (z - 1) * 50;
    return { x: Math.max(-max, Math.min(max, p.x)), y: Math.max(-max, Math.min(max, p.y)) };
  }, []);

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

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editMode) return;
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
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer capture may already be released */
    }
    dragRef.current = null;
    setDragging(false);
  };

  const onLayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onMapClick || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    const ux = (cx - 50 - pan.x) / zoom + 50;
    const uy = (cy - 50 - pan.y) / zoom + 50;
    if (ux < 1 || ux > 99 || uy < 1 || uy > 99) return;
    onMapClick(+ux.toFixed(2), +uy.toFixed(2));
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (ev: WheelEvent) => ev.preventDefault();
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const clusters = useMemo(() => {
    if (zoom >= 2.5)
      return samples.map((s) => ({
        type: "single" as const,
        sample: s,
        x: s.position.x,
        y: s.position.y,
      }));
    const cellSize = zoom < 1.6 ? 14 : 8;
    const map = new Map<string, Sample[]>();
    samples.forEach((s) => {
      const key = `${Math.floor(s.position.x / cellSize)}_${Math.floor(s.position.y / cellSize)}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    });
    return Array.from(map.values()).map((arr) => {
      if (arr.length === 1)
        return {
          type: "single" as const,
          sample: arr[0],
          x: arr[0].position.x,
          y: arr[0].position.y,
        };
      const x = arr.reduce((a, b) => a + b.position.x, 0) / arr.length;
      const y = arr.reduce((a, b) => a + b.position.y, 0) / arr.length;
      return { type: "cluster" as const, count: arr.length, x, y, sample: arr[0] };
    });
  }, [samples, zoom]);

  const transformStyle: React.CSSProperties = {
    transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`,
    transformOrigin: "50% 50%",
    transition: dragging ? "none" : "transform 0.18s cubic-bezier(.2,.8,.2,1)",
  };

  const onlineCount = robots.filter((r) => r.status === "online" || r.status === "mission").length;

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
        className={`relative w-full h-full rounded-2xl overflow-hidden map-vignette select-none ${
          editMode ? "cursor-crosshair" : dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          background:
            "radial-gradient(ellipse 90% 65% at 55% 55%, oklch(0.22 0.05 230) 0%, oklch(0.16 0.04 235) 65%, oklch(0.12 0.04 238) 100%)",
          boxShadow:
            "inset 0 0 0 1px color-mix(in oklab, var(--cyan-accent) 14%, transparent), var(--shadow-elev)",
        }}
      >
        {/* === Transform layer === */}
        <div className="absolute inset-0" style={transformStyle}>
          {/* Subtle terrain — northern (mountain shading) + southern (steppe) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: [
                // Northern Ile-Alatau hills
                "radial-gradient(ellipse 70% 22% at 50% 14%, oklch(0.32 0.055 240 / 0.55), transparent 70%)",
                "radial-gradient(ellipse 40% 14% at 25% 22%, oklch(0.34 0.06 245 / 0.4), transparent 70%)",
                "radial-gradient(ellipse 38% 12% at 78% 18%, oklch(0.30 0.05 235 / 0.4), transparent 70%)",
                // Southern steppe glow
                "radial-gradient(ellipse 70% 22% at 50% 88%, oklch(0.26 0.07 80 / 0.18), transparent 70%)",
              ].join(","),
            }}
          />

          {/* Optional grid overlay */}
          {showGrid && <div className="absolute inset-0 grid-bg opacity-25" />}

          {/* === Water + features === */}
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              {/* Layered water gradient — bright cyan core, deep teal edges */}
              <radialGradient id="water-core" cx="50%" cy="48%" r="55%">
                <stop offset="0%" stopColor="oklch(0.78 0.10 200)" stopOpacity="1" />
                <stop offset="55%" stopColor="oklch(0.55 0.10 210)" stopOpacity="1" />
                <stop offset="100%" stopColor="oklch(0.32 0.08 220)" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="water-tilt" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.09 195)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="oklch(0.30 0.06 232)" stopOpacity="0.6" />
              </linearGradient>
              {/* Shoreline glow */}
              <linearGradient id="shoreline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.92 0.10 195)" stopOpacity="0.85" />
                <stop offset="100%" stopColor="oklch(0.66 0.10 210)" stopOpacity="0.6" />
              </linearGradient>
              {/* Subsurface ripple */}
              <filter id="ripple" x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7" />
                <feColorMatrix values="0 0 0 0 0.78  0 0 0 0 0.92  0 0 0 0 1  0 0 0 0.05 0" />
                <feComposite in2="SourceGraphic" operator="in" />
              </filter>
              {/* Soft shoreline blur */}
              <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.4" />
              </filter>
              {/* Microparticle heatmap blur */}
              <filter id="heat-blur" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.2" />
              </filter>
              {robots.map((r) => (
                <linearGradient key={r.id} id={`trail-${r.id}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={r.color} stopOpacity="0" />
                  <stop offset="100%" stopColor={r.color} stopOpacity="0.95" />
                </linearGradient>
              ))}
              {/* Clip everything water-overlay-ish to the reservoir polygon */}
              <clipPath id="water-clip" clipPathUnits="userSpaceOnUse">
                <path d={RESERVOIR_PATH} />
              </clipPath>
            </defs>

            {/* Soft outer halo (atmospheric glow) */}
            <path
              d={RESERVOIR_PATH}
              fill="oklch(0.78 0.10 200)"
              opacity="0.18"
              filter="url(#soft)"
              transform="translate(0 0.4) scale(1.02 1.04)"
            />

            {/* Drop shadow */}
            <path
              d={RESERVOIR_PATH}
              fill="oklch(0.10 0.04 238)"
              opacity="0.6"
              transform="translate(0.4 0.6)"
              filter="url(#soft)"
            />

            {/* Core water */}
            <path d={RESERVOIR_PATH} fill="url(#water-core)" />
            <path d={RESERVOIR_PATH} fill="url(#water-tilt)" />

            {/* Ripple texture inside water */}
            <g clipPath="url(#water-clip)">
              <rect x="0" y="0" width="100" height="100" filter="url(#ripple)" opacity="0.5" />
            </g>

            {/* Depth contour lines (suggest bathymetry) */}
            <g clipPath="url(#water-clip)" opacity="0.65">
              <path
                d="M 18,60 C 36,56 56,49 80,40"
                fill="none"
                stroke="oklch(0.88 0.09 200 / 0.35)"
                strokeWidth="0.18"
                strokeDasharray="0.9 0.9"
              />
              <path
                d="M 22,62 C 42,58 60,52 82,44"
                fill="none"
                stroke="oklch(0.88 0.09 200 / 0.25)"
                strokeWidth="0.16"
                strokeDasharray="0.6 1.1"
              />
              <path
                d="M 28,60 C 44,56 60,50 78,43"
                fill="none"
                stroke="oklch(0.88 0.09 200 / 0.18)"
                strokeWidth="0.14"
                strokeDasharray="0.4 1.4"
              />
            </g>

            {/* === Microparticle (microplastic) heatmap === */}
            {showHeatmap && (
              <g clipPath="url(#water-clip)">
                <g filter="url(#heat-blur)">
                  {samples.map((s) => {
                    const v = s.microplastic ?? 0;
                    const norm = Math.max(0, Math.min(1, v / 2600));
                    return (
                      <circle
                        key={`heat-${s.id}`}
                        cx={s.position.x}
                        cy={s.position.y}
                        r={5.5 + norm * 5.5}
                        fill={heatColor(v)}
                        opacity={0.1 + norm * 0.4}
                      />
                    );
                  })}
                </g>
              </g>
            )}

            {/* Bay highlight */}
            <ellipse cx="50" cy="47" rx="14" ry="3.4" fill="oklch(0.95 0.07 200 / 0.18)" />

            {/* Glowing shoreline (double stroke) */}
            <path
              d={RESERVOIR_PATH}
              fill="none"
              stroke="oklch(0.92 0.10 195 / 0.55)"
              strokeWidth="0.55"
              filter="url(#soft)"
            />
            <path d={RESERVOIR_PATH} fill="none" stroke="url(#shoreline)" strokeWidth="0.18" />

            {/* River Ili inlet — gradient + glow */}
            <path
              d={RIVER_PATH}
              stroke="oklch(0.62 0.12 215)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
              filter="url(#soft)"
            />
            <path
              d={RIVER_PATH}
              stroke="oklch(0.92 0.09 200)"
              strokeWidth="0.3"
              fill="none"
              strokeLinecap="round"
            />
            {/* Chilik tributary */}
            <path
              d={TRIB_PATH}
              stroke="oklch(0.62 0.12 215)"
              strokeWidth="0.7"
              fill="none"
              strokeLinecap="round"
              opacity="0.75"
              filter="url(#soft)"
            />
            <path
              d={TRIB_PATH}
              stroke="oklch(0.92 0.09 200)"
              strokeWidth="0.18"
              fill="none"
              strokeLinecap="round"
            />

            {/* === Trails === */}
            {showTrails &&
              zoom >= 1.2 &&
              robots.map((r) => {
                if (r.trail.length < 2) return null;
                const stride = zoom < 1.6 ? 4 : zoom < 2.4 ? 2 : 1;
                const maxPts = zoom < 1.6 ? 8 : zoom < 2.4 ? 16 : 28;
                const decimated: { x: number; y: number }[] = [];
                for (let i = 0; i < r.trail.length; i += stride) decimated.push(r.trail[i]);
                if (decimated[decimated.length - 1] !== r.trail[r.trail.length - 1]) {
                  decimated.push(r.trail[r.trail.length - 1]);
                }
                const trimmed = decimated.slice(-maxPts);
                const pts = trimmed.map((p) => `${p.x},${p.y}`).join(" ");
                const w1 = +(1.6 / zoom).toFixed(2);
                const w2 = +(0.45 / zoom).toFixed(2);
                return (
                  <g key={`trail-g-${r.id}`}>
                    <polyline
                      points={pts}
                      fill="none"
                      stroke={r.color}
                      strokeOpacity={0.22}
                      strokeWidth={w1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points={pts}
                      fill="none"
                      stroke={r.color}
                      strokeWidth={w2}
                      strokeDasharray="0.4 1.2"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

            {/* === Planned waypoint paths === */}
            {robots.map((r) => {
              if (r.status !== "online" && r.status !== "mission") return null;
              const remaining = r.waypoints
                .slice(r.waypointIdx)
                .map((p) => `${p.x},${p.y}`)
                .join(" ");
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

            {/* === Draft route === */}
            {editMode && draftWaypoints && draftWaypoints.length > 0 && (
              <polyline
                points={draftWaypoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="oklch(0.92 0.10 195)"
                strokeOpacity="0.9"
                strokeWidth="0.5"
                strokeDasharray="0.8 0.8"
              />
            )}
          </svg>

          {/* Animated shimmer over water (CSS) — clipped via SVG mask isn't worth it; the shimmer is subtle screen-blend */}
          <div className="absolute inset-0 water-shimmer pointer-events-none" />

          {/* Faint radar scan sweep */}
          <div className="absolute inset-0 scan-line pointer-events-none opacity-30" />

          {/* === Landmarks === */}
          {MAP_LANDMARKS.map((l) => (
            <div
              key={l.id}
              style={{ left: `${l.x}%`, top: `${l.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1]"
            >
              <div className="flex items-center gap-1.5">
                <div className="size-1.5 rounded-full bg-cyan-accent/90 ring-2 ring-background/70 shadow-[0_0_6px_oklch(0.82_0.09_195/0.6)]" />
                <span
                  className="text-[10px] uppercase tracking-[0.14em] font-medium text-foreground/85
                                 bg-card/65 backdrop-blur-md px-2 py-0.5 rounded-full whitespace-nowrap
                                 border border-cyan-accent/15 shadow-sm"
                >
                  {l.kind === "base" && (
                    <Anchor className="inline size-2.5 mr-1 -mt-0.5 text-cyan-accent" />
                  )}
                  {l.kind === "infra" && (
                    <Building2 className="inline size-2.5 mr-1 -mt-0.5 text-cyan-accent" />
                  )}
                  {l.label}
                </span>
              </div>
            </div>
          ))}

          {/* === Microparticle inflow sources === */}
          {showHeatmap &&
            MICRO_SOURCES.map((src) => (
              <div
                key={`src-${src.label}`}
                style={{ left: `${src.x}%`, top: `${src.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[2]"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3 text-[oklch(0.78_0.18_320)]" />
                  <span
                    className="text-[9px] uppercase tracking-[0.12em] font-medium text-foreground/85
                               bg-card/70 backdrop-blur-md px-1.5 py-0.5 rounded-full whitespace-nowrap
                               border border-[oklch(0.62_0.25_320)]/30 shadow-sm"
                  >
                    {src.label}
                  </span>
                </div>
              </div>
            ))}

          {/* === Sample markers / clusters === */}
          {clusters.map((c, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (c.type === "single") onSelectSample(c.sample);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-[2]"
                >
                  {c.type === "cluster" ? (
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-cyan-accent/15 blur-md" />
                        <div
                          className="relative size-10 rounded-full flex items-center justify-center
                                        font-display font-bold text-sm text-cyan-accent
                                        border-[1.5px] border-cyan-accent/80 bg-cyan-accent/12
                                        backdrop-blur-md hover:scale-110 transition
                                        shadow-[0_0_18px_oklch(0.82_0.09_195/0.4)]"
                        >
                          {c.count}
                        </div>
                      </div>
                      <span className="text-[9px] uppercase tracking-[0.1em] text-cyan-accent/80 mt-0.5 font-display">
                        проб
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      {highlightedSampleId === c.sample.id && (
                        <span
                          className="absolute left-1/2 top-1/2 size-9 rounded-full
                                         border border-cyan-accent/55 marker-halo"
                        />
                      )}
                      <div
                        className={`relative rounded-full transition-all cursor-pointer sample-pulse
                                    ${
                                      highlightedSampleId === c.sample.id
                                        ? "size-4 ring-2 ring-cyan-accent/70 ring-offset-1 ring-offset-background"
                                        : "size-2.5 hover:size-4"
                                    }`}
                        style={{
                          background:
                            "radial-gradient(circle at 30% 30%, oklch(0.95 0.06 195), oklch(0.78 0.10 200) 65%, oklch(0.55 0.10 210))",
                          boxShadow:
                            "0 0 8px oklch(0.82 0.09 195 / 0.85), inset 0 0 0 1px oklch(0.18 0.04 235 / 0.45)",
                        }}
                      />
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="p-0 bg-card/95 backdrop-blur border-border max-w-[260px]"
              >
                {c.type === "cluster" ? (
                  <div className="px-3 py-2 text-xs">
                    <div className="font-semibold text-foreground">Кластер: {c.count} проб</div>
                    <div className="text-muted-foreground mt-0.5">
                      Приблизьте карту для детального просмотра
                    </div>
                  </div>
                ) : (
                  (() => {
                    const s = c.sample;
                    const d = new Date(s.date);
                    const lat = (43.88 + (s.position.y - 50) * 0.0015).toFixed(5);
                    const lon = (77.07 + (s.position.x - 50) * 0.002).toFixed(5);
                    const phOk = s.ph >= thresholds.ph.min && s.ph <= thresholds.ph.max;
                    const oxOk = s.oxygen >= thresholds.oxygen.warn;
                    const turOk = s.turbidity <= thresholds.turbidity.warn;
                    const tempOk = s.temperature <= thresholds.temperature.warn;
                    const pollTone =
                      s.pollution < thresholds.pollution.ok
                        ? "text-success"
                        : s.pollution < thresholds.pollution.warn
                          ? "text-warning"
                          : s.pollution < thresholds.pollution.danger
                            ? "text-destructive"
                            : "text-[oklch(0.78_0.18_300)]";
                    const pollLabel =
                      s.pollution < thresholds.pollution.ok
                        ? "низкий"
                        : s.pollution < thresholds.pollution.warn
                          ? "умеренный"
                          : s.pollution < thresholds.pollution.danger
                            ? "высокий"
                            : "критический";
                    return (
                      <div className="text-xs">
                        <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-3">
                          <div className="font-semibold text-foreground">
                            Проба {s.id.toUpperCase()}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {d.toLocaleDateString("ru-RU")}{" "}
                            {d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div className="px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-1 tabular-nums">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">pH</span>{" "}
                            <span className={phOk ? "text-cyan-accent" : "text-warning"}>
                              {s.ph}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">O₂</span>{" "}
                            <span className={oxOk ? "text-success" : "text-warning"}>
                              {s.oxygen} мг/л
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Мутность</span>{" "}
                            <span className={turOk ? "text-foreground" : "text-warning"}>
                              {s.turbidity} NTU
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">T°</span>{" "}
                            <span className={tempOk ? "text-foreground" : "text-warning"}>
                              {s.temperature}°C
                            </span>
                          </div>
                          <div className="flex justify-between col-span-2">
                            <span className="text-muted-foreground">Глубина</span>{" "}
                            <span>{s.depth} м</span>
                          </div>
                          <div className="flex justify-between col-span-2">
                            <span className="text-muted-foreground">Загрязнение</span>{" "}
                            <span className={pollTone}>
                              {s.pollution}/100 · {pollLabel}
                            </span>
                          </div>
                          <div className="flex justify-between col-span-2">
                            <span className="text-muted-foreground">Микрочастицы</span>{" "}
                            <span style={{ color: heatColor(s.microplastic ?? 0) }}>
                              {s.microplastic ?? 0} частиц/м³
                            </span>
                          </div>
                        </div>
                        <div className="px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                          <span>
                            {lat}°N, {lon}°E
                          </span>
                          <span className="text-primary">клик · подробнее</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* === Robot markers === */}
          {robots.map((r) => {
            const active = r.status === "online" || r.status === "mission";
            return (
              <Tooltip key={r.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRobot(r);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      left: `${r.position.x}%`,
                      top: `${r.position.y}%`,
                      transition: "left 1.4s linear, top 1.4s linear",
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                  >
                    <div className="relative">
                      {/* outer halo */}
                      {active && (
                        <span
                          className="absolute left-1/2 top-1/2 size-14 rounded-full marker-halo"
                          style={{
                            background: `radial-gradient(circle, ${r.color} 0%, transparent 65%)`,
                            opacity: 0.35,
                          }}
                        />
                      )}

                      {/* heading wedge arc behind the badge */}
                      {active && (
                        <svg
                          className="absolute -inset-2 pointer-events-none"
                          viewBox="-50 -50 100 100"
                          style={{ transform: `rotate(${r.heading}deg)` }}
                        >
                          <path d="M -3,-46 L 3,-46 L 0,-30 Z" fill={r.color} opacity="0.95" />
                        </svg>
                      )}

                      {/* main badge */}
                      <div
                        className={`relative size-11 rounded-full flex items-center justify-center
                                    border-2 backdrop-blur-md transition-transform hover:scale-110
                                    ${r.status === "offline" ? "bg-muted/40 border-muted-foreground/40" : ""}
                                    ${selectedRobotId === r.id ? "ring-4 ring-offset-1 ring-offset-background ring-cyan-accent/55" : ""}`}
                        style={
                          active
                            ? {
                                background: `radial-gradient(circle at 30% 30%, color-mix(in oklch, ${r.color} 55%, transparent), color-mix(in oklch, ${r.color} 18%, transparent) 70%, transparent)`,
                                borderColor: r.color,
                                boxShadow: `0 0 22px ${r.color}, inset 0 0 0 1px color-mix(in oklch, ${r.color} 50%, transparent)`,
                              }
                            : { boxShadow: "inset 0 0 0 1px oklch(0.4 0.03 240 / 0.6)" }
                        }
                      >
                        <Bot
                          className="size-5"
                          style={{
                            color: r.status === "offline" ? "oklch(0.7 0.02 250)" : r.color,
                          }}
                        />
                      </div>

                      {/* status pip */}
                      <div
                        className={`absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-card ${
                          active
                            ? "bg-success pulse-dot"
                            : r.status === "rtl"
                              ? "bg-warning pulse-dot"
                              : "bg-muted-foreground"
                        }`}
                      />

                      {/* signal beacon */}
                      {r.beacon && r.status !== "offline" && (
                        <span
                          className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-card bg-warning pulse-dot"
                          style={{ boxShadow: "0 0 10px oklch(0.82 0.17 75)" }}
                        />
                      )}
                    </div>

                    {/* label */}
                    <div
                      className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap
                                    text-[10px] font-mono font-semibold
                                    bg-card/85 backdrop-blur px-1.5 py-0.5 rounded-md
                                    border border-cyan-accent/15 shadow-sm"
                    >
                      {r.name}
                      {r.status === "mission" ? " · миссия" : ""}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-card/95 backdrop-blur border-border">
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold">{r.name}</div>
                    {active && (
                      <div className="text-success">
                        {r.status === "mission" ? "Выполняет миссию" : "В сети"} ·{" "}
                        {r.battery.toFixed(0)}% · {r.speed} м/с
                      </div>
                    )}
                    {r.status === "rtl" && (
                      <div className="text-warning">Возврат на базу · {r.battery.toFixed(0)}%</div>
                    )}
                    {r.status === "offline" && (
                      <div className="text-muted-foreground">
                        Последний раз в сети: {r.lastSeen}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* === Draft waypoints === */}
          {editMode &&
            draftWaypoints &&
            draftWaypoints.map((w, i) => (
              <div
                key={`draft-${i}`}
                style={{ left: `${w.x}%`, top: `${w.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              >
                <div
                  className="size-6 rounded-full bg-cyan-accent text-background border-2 border-background
                              flex items-center justify-center text-[11px] font-bold shadow-lg
                              ring-2 ring-cyan-accent/30"
                >
                  {i + 1}
                </div>
              </div>
            ))}
        </div>
        {/* /transform layer */}

        {/* === Floating UI === */}

        {/* Top-left: zoom + view controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 glass-panel rounded-xl p-1">
          <ToolBtn
            label="Приблизить (Wheel ↑)"
            onClick={() => {
              const n = Math.min(6, zoom + 0.6);
              setZoom(n);
              setPan((p) => clampPan(p, n));
            }}
          >
            <ZoomIn className="size-4" />
          </ToolBtn>
          <ToolBtn
            label="Отдалить (Wheel ↓)"
            onClick={() => {
              const n = Math.max(1, zoom - 0.6);
              setZoom(n);
              setPan((p) => clampPan(p, n));
            }}
          >
            <ZoomOut className="size-4" />
          </ToolBtn>
          <ToolBtn
            label="Сбросить вид"
            onClick={() => {
              setZoom(1.4);
              setPan({ x: 0, y: 0 });
            }}
          >
            <RotateCcw className="size-4" />
          </ToolBtn>
          <ToolBtn
            label="Вписать"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <Maximize2 className="size-4" />
          </ToolBtn>
          <div className="h-px bg-cyan-accent/15 my-0.5" />
          <ToolBtn
            label={showTrails ? "Следы: вкл" : "Следы: выкл"}
            active={showTrails}
            onClick={() => setShowTrails((s) => !s)}
          >
            <Waves className="size-4" />
          </ToolBtn>
          <ToolBtn
            label={showGrid ? "Сетка: вкл" : "Сетка: выкл"}
            active={showGrid}
            onClick={() => setShowGrid((s) => !s)}
          >
            <Layers className="size-4" />
          </ToolBtn>
          <ToolBtn
            label={showHeatmap ? "Микрочастицы: вкл" : "Микрочастицы: выкл"}
            active={showHeatmap}
            onClick={() => setShowHeatmap((s) => !s)}
          >
            <Sparkles className="size-4" />
          </ToolBtn>
        </div>

        {/* Top-center: reservoir crest (always visible) */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2
                        glass-panel rounded-full px-3.5 py-1.5 text-xs"
        >
          <span className="size-1.5 rounded-full bg-cyan-accent pulse-dot" />
          <MapPin className="size-3.5 text-cyan-accent" />
          <span className="font-display font-semibold">{RESERVOIR.name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{RESERVOIR.river}</span>
          <span className="text-muted-foreground hidden md:inline">·</span>
          <span className="hidden md:inline text-cyan-accent/80 font-mono">
            <span className="text-success font-semibold">{onlineCount}</span>/{robots.length} в сети
          </span>
        </div>

        {/* Edit-mode hint */}
        {editMode && (
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2
                          bg-cyan-accent/15 border border-cyan-accent/55 text-cyan-accent backdrop-blur-md
                          rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg"
          >
            <Pencil className="size-3.5" />
            Режим редактирования: кликните по водохранилищу, чтобы добавить точку
            {editingRobotId && <span className="opacity-70 font-mono">· {editingRobotId}</span>}
          </div>
        )}

        {/* Top-right: compass + coords HUD */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <div className="glass-panel rounded-xl p-2 flex items-center gap-2">
            <div className="relative size-9">
              <div className="absolute inset-0 rounded-full border border-cyan-accent/30" />
              <div className="absolute inset-1 rounded-full border border-cyan-accent/20" />
              <div className="absolute left-1/2 top-0.5 -translate-x-1/2 text-[8px] text-cyan-accent font-bold">
                N
              </div>
              <div className="absolute left-1/2 bottom-0.5 -translate-x-1/2 text-[8px] text-muted-foreground">
                S
              </div>
              <Compass className="absolute inset-0 m-auto size-4 text-cyan-accent" />
            </div>
            <div className="text-[10px] leading-tight">
              <div className="font-mono text-foreground">{RESERVOIR.lat}</div>
              <div className="font-mono text-foreground">{RESERVOIR.lon}</div>
              <div className="text-muted-foreground">ZOOM {zoom.toFixed(1)}× · UTC+5</div>
            </div>
          </div>
        </div>

        {/* Bottom-left: legend */}
        <div className="absolute bottom-4 left-4 glass-panel rounded-xl p-3 text-xs space-y-1.5">
          <div className="font-display font-semibold text-muted-foreground uppercase tracking-[0.14em] text-[10px] mb-1.5 flex items-center gap-1.5">
            <Crosshair className="size-3" /> Легенда
          </div>
          {robots.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <div
                className="size-2.5 rounded-full"
                style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }}
              />
              <span className="font-mono text-[11px]">{r.name}</span>
              <span
                className={`ml-auto text-[10px] font-mono ${
                  r.status === "online" || r.status === "mission"
                    ? "text-success"
                    : r.status === "rtl"
                      ? "text-warning"
                      : "text-muted-foreground"
                }`}
              >
                {r.status === "online"
                  ? "online"
                  : r.status === "mission"
                    ? "mission"
                    : r.status === "rtl"
                      ? "RTL"
                      : "offline"}
              </span>
            </div>
          ))}
          <div className="h-px bg-cyan-accent/15 my-1.5" />
          <div className="flex items-center gap-2">
            <div
              className="size-2.5 rounded-full sample-pulse"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, oklch(0.95 0.06 195), oklch(0.78 0.10 200))",
              }}
            />
            Точка пробы
          </div>
          <div className="flex items-center gap-2">
            <Anchor className="size-3 text-cyan-accent" /> База / инфраструктура
          </div>
          {showHeatmap && (
            <>
              <div className="h-px bg-cyan-accent/15 my-1.5" />
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <Sparkles className="size-3" /> Микрочастицы, частиц/м³
              </div>
              <div className="flex items-center gap-2">
                {[
                  { c: "oklch(0.80 0.15 200)", t: "<500" },
                  { c: "oklch(0.84 0.17 95)", t: "<1200" },
                  { c: "oklch(0.64 0.22 25)", t: "<2200" },
                  { c: "oklch(0.62 0.25 320)", t: "≥2200" },
                ].map((g) => (
                  <span key={g.t} className="flex items-center gap-1 text-[10px] font-mono">
                    <span className="size-2.5 rounded-full" style={{ background: g.c }} />
                    {g.t}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom-right: scale bar */}
        <div className="absolute bottom-4 right-4 glass-panel rounded-xl px-3 py-2 text-[10px] font-mono">
          <div className="flex items-center gap-1 mb-1 text-muted-foreground">
            <Ruler className="size-3" />
            <span className="uppercase tracking-[0.14em] text-[9px]">Масштаб</span>
          </div>
          <div className="flex items-end">
            <div className="h-2 w-10 bg-foreground/80 rounded-l-sm" />
            <div className="h-2 w-10 bg-foreground/30 rounded-r-sm" />
          </div>
          <div className="flex justify-between w-20 mt-0.5 text-muted-foreground">
            <span>0</span>
            <span>5</span>
            <span>10 км</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ToolBtn({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClick}
          className={`size-8 rounded-lg hover:bg-cyan-accent/12 hover:text-cyan-accent ${
            active ? "bg-cyan-accent/15 text-cyan-accent" : "text-foreground/80"
          }`}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-card/95 backdrop-blur border-border text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
