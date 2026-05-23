import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Map as MapIcon, Cpu, BarChart3, Sliders } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ConnectDeviceDialog } from "@/components/app/ConnectDeviceDialog";
import { MapView } from "@/components/app/MapView";
import { RobotPanel } from "@/components/app/RobotPanel";
import { RobotHistoryPanel } from "@/components/app/RobotHistoryPanel";
import { SampleDialog } from "@/components/app/SampleDialog";
import { DevicesView } from "@/components/app/DevicesView";
import { AnalyticsView } from "@/components/app/AnalyticsView";
import { SettingsView } from "@/components/app/SettingsView";
import { initialRobots, initialSamples, RESERVOIR, clampToLake } from "@/domain/acquisition/seed";
import { useRealtimeSimulation } from "@/domain/acquisition/simulationSource";
import { useEventLog } from "@/domain/events/eventLog";
import { useThresholds } from "@/domain/analysis/quality";
import { microplasticAt } from "@/domain/analysis/microplastic";
import { useTier } from "@/domain/tiers/plan";
import type { Robot, Sample } from "@/domain/types";

// Builds a fresh measurement at a robot's current position — used both by the
// background collection loop and by the manual "взять пробу" command.
function makeSample(robot: Robot, seq: number): Sample {
  const rnd = (min: number, max: number, dp = 2) =>
    +(min + Math.random() * (max - min)).toFixed(dp);
  // keep the measurement point strictly inside the water, even if the robot
  // is hugging the shoreline
  const position = clampToLake(robot.position);
  return {
    id: `s-live-${seq}`,
    robotId: robot.id,
    position,
    date: new Date().toISOString(),
    ph: rnd(6.4, 8.8),
    oxygen: rnd(4, 11),
    turbidity: rnd(0.8, 11),
    temperature: rnd(11, 27, 1),
    depth: rnd(1.5, 20, 1),
    pollution: rnd(6, 82, 0),
    microplastic: microplasticAt(position, (Math.random() - 0.5) * 0.3),
  };
}

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      { title: "AquaWatch · Капшагай · Мониторинг качества воды" },
      {
        name: "description",
        content:
          "Платформа управления автономными аппаратами USV на Капшагайском водохранилище: телеметрия в реальном времени, маршруты, отчёты.",
      },
    ],
  }),
});

function App() {
  const [robots, setRobots] = useState<Robot[]>(initialRobots);
  const [samples, setSamples] = useState<Sample[]>(initialSamples);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [highlightedSampleId, setHighlightedSampleId] = useState<string | undefined>(undefined);
  const [view, setView] = useState<"map" | "devices" | "analytics" | "settings">("map");
  const [clock, setClock] = useState<Date | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftWaypoints, setDraftWaypoints] = useState<{ x: number; y: number }[]>([]);
  const { thresholds, setThresholds, resetThresholds } = useThresholds();
  const { tier, setTier, has } = useTier();

  useRealtimeSimulation(setRobots, true);
  const { log, push: pushEvent } = useEventLog(robots);

  // live sample collection: active robots periodically log a new measurement
  const robotsRef = useRef(robots);
  robotsRef.current = robots;
  const sampleSeq = useRef(0);

  const collectSample = useCallback((robot: Robot): Sample => {
    sampleSeq.current += 1;
    const s = makeSample(robot, sampleSeq.current);
    setSamples((prev) => [s, ...prev].slice(0, 220));
    return s;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const active = robotsRef.current.filter(
        (r) => r.status === "mission" || r.status === "online",
      );
      if (active.length === 0) return;
      collectSample(active[Math.floor(Math.random() * active.length)]);
    }, 9000);
    return () => clearInterval(id);
  }, [collectSample]);

  // local clock (UTC+5 Almaty mock — just show local)
  useEffect(() => {
    setClock(new Date());
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // keep the selected robot reference in sync with simulation updates
  useEffect(() => {
    if (!selectedRobot) return;
    const updated = robots.find((r) => r.id === selectedRobot.id);
    if (updated && updated !== selectedRobot) setSelectedRobot(updated);
  }, [robots, selectedRobot]);

  const onlineCount = robots.filter((r) => r.status === "online" || r.status === "mission").length;
  const rtlCount = robots.filter((r) => r.status === "rtl").length;
  const clockText = clock ? clock.toLocaleTimeString("ru-RU") : "—";

  const viewMeta: Record<typeof view, { title: string; subtitle: string; icon: typeof MapIcon }> = {
    map: {
      title: "Оперативная карта",
      subtitle: `${RESERVOIR.name} · реальное время`,
      icon: MapIcon,
    },
    devices: { title: "Устройства", subtitle: `Парк USV · ${robots.length} аппаратов`, icon: Cpu },
    analytics: {
      title: "Аналитика и отчёты",
      subtitle: "Сводные показатели качества воды",
      icon: BarChart3,
    },
    settings: {
      title: "Пороги качества воды",
      subtitle: "Настройка границ для индикатора качества и отчётов",
      icon: Sliders,
    },
  };
  const meta = viewMeta[view];
  const HeaderIcon = meta.icon;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          view={view}
          onChange={setView}
          onlineCount={onlineCount}
          totalCount={robots.length}
          rtlCount={rtlCount}
          sampleCount={samples.length}
          clock={clockText}
          tier={tier}
          onTierChange={setTier}
        />

        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/60 backdrop-blur-xl">
            <div className="px-5 py-3.5 flex items-center gap-4">
              <SidebarTrigger className="text-foreground/70 hover:text-foreground hover:bg-accent/60" />
              <div className="hidden sm:flex items-center gap-3 min-w-0">
                <div
                  className="size-9 rounded-lg flex items-center justify-center shrink-0 glow-cyan"
                  style={{ background: "var(--gradient-cyan)" }}
                >
                  <HeaderIcon className="size-4 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-[15px] font-display font-semibold tracking-tight leading-tight truncate">
                    {meta.title}
                  </h1>
                  <div className="text-[11px] text-muted-foreground truncate">{meta.subtitle}</div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-card/40 backdrop-blur text-[11px] text-muted-foreground">
                  <span
                    suppressHydrationWarning
                    className="font-mono tabular-nums text-cyan-accent/90"
                  >
                    {clockText}
                  </span>
                  <span className="text-border">·</span>
                  <span>UTC+5</span>
                </div>
                <ConnectDeviceDialog
                  count={robots.length}
                  onAdd={(r) => setRobots((prev) => [...prev, r])}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 w-full px-5 py-5">
            {view === "map" && (
              <div className="relative h-[calc(100vh-130px)] min-h-[600px] rounded-2xl overflow-hidden glass-panel">
                <MapView
                  robots={robots}
                  samples={samples}
                  onSelectRobot={setSelectedRobot}
                  onSelectSample={(s) => {
                    setSelectedSample(s);
                    setHighlightedSampleId(s.id);
                  }}
                  selectedRobotId={selectedRobot?.id}
                  editMode={editMode && !!selectedRobot}
                  editingRobotId={selectedRobot?.id}
                  draftWaypoints={draftWaypoints}
                  onMapClick={(x, y) => setDraftWaypoints((wps) => [...wps, { x, y }])}
                  highlightedSampleId={highlightedSampleId}
                  thresholds={thresholds}
                />
                {selectedRobot && (
                  <RobotPanel
                    robot={selectedRobot}
                    onClose={() => {
                      setSelectedRobot(null);
                      setEditMode(false);
                    }}
                    onUpdate={(r) => {
                      setRobots((prev) => prev.map((p) => (p.id === r.id ? r : p)));
                      setSelectedRobot(r);
                    }}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    draftWaypoints={draftWaypoints}
                    setDraftWaypoints={setDraftWaypoints}
                    logEvent={pushEvent}
                    onCollectSample={collectSample}
                    has={has}
                  />
                )}
                {selectedRobot && (
                  <RobotHistoryPanel
                    robot={selectedRobot}
                    log={log}
                    samples={samples}
                    onClose={() => setSelectedRobot(null)}
                    onSelectSample={(s) => {
                      setSelectedSample(s);
                      setHighlightedSampleId(s.id);
                    }}
                    highlightedSampleId={highlightedSampleId}
                    thresholds={thresholds}
                  />
                )}
              </div>
            )}
            {view === "devices" && (
              <DevicesView
                robots={robots}
                log={log}
                onOpenRobot={(r) => {
                  setView("map");
                  setSelectedRobot(r);
                }}
              />
            )}
            {view === "analytics" && (
              <AnalyticsView robots={robots} samples={samples} thresholds={thresholds} />
            )}
            {view === "settings" && (
              <SettingsView
                thresholds={thresholds}
                onChange={setThresholds}
                onReset={resetThresholds}
                samples={samples}
              />
            )}
          </main>
        </SidebarInset>

        <SampleDialog
          sample={selectedSample}
          onClose={() => {
            setSelectedSample(null);
            setHighlightedSampleId(undefined);
          }}
          thresholds={thresholds}
        />
      </div>
    </SidebarProvider>
  );
}
