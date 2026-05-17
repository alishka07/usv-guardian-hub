import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map as MapIcon, Cpu, BarChart3, Waves, Activity, Clock, Radio } from "lucide-react";
import { ConnectDeviceDialog } from "@/components/app/ConnectDeviceDialog";
import { MapView } from "@/components/app/MapView";
import { RobotPanel } from "@/components/app/RobotPanel";
import { SampleDialog } from "@/components/app/SampleDialog";
import { DevicesView } from "@/components/app/DevicesView";
import { AnalyticsView } from "@/components/app/AnalyticsView";
import { initialRobots, initialSamples, RESERVOIR } from "@/components/app/mock-data";
import { useRealtimeSimulation } from "@/components/app/useRealtimeSimulation";
import { useEventLog } from "@/components/app/useEventLog";
import type { Robot, Sample } from "@/components/app/types";

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      { title: "USV · Капшагай · Мониторинг качества воды" },
      { name: "description", content: "Платформа управления автономными аппаратами USV на Капшагайском водохранилище: телеметрия в реальном времени, маршруты, отчёты." },
    ],
  }),
});

function App() {
  const [robots, setRobots] = useState<Robot[]>(initialRobots);
  const [samples] = useState<Sample[]>(initialSamples);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [tab, setTab] = useState("map");
  const [clock, setClock] = useState<Date | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftWaypoints, setDraftWaypoints] = useState<{ x: number; y: number }[]>([]);

  useRealtimeSimulation(setRobots, true);
  const { log } = useEventLog(robots);

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-cyan-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Waves className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-[15px] md:text-base font-bold tracking-tight leading-tight">
                Система мониторинга качества воды <span className="text-muted-foreground font-medium">· USV</span>
              </h1>
              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <Activity className="size-3 text-success pulse-dot" /> {RESERVOIR.name}
                </span>
                <span className="text-border">|</span>
                <span>В сети: <span className="text-success font-semibold">{onlineCount}</span>/{robots.length}</span>
                {rtlCount > 0 && (
                  <>
                    <span className="text-border">|</span>
                    <span>RTL: <span className="text-warning font-semibold">{rtlCount}</span></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 ml-4 px-3 py-1.5 rounded-lg border border-border bg-panel/50 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Radio className="size-3.5 text-success pulse-dot" /> LIVE
            </span>
            <span className="text-border">·</span>
            <span className="font-mono tabular-nums min-w-[64px] inline-block">{clock ? clock.toLocaleTimeString("ru-RU") : "—"}</span>
            <span className="text-muted-foreground text-[10px]">Алматы UTC+5</span>
          </div>

          <div className="ml-auto">
            <ConnectDeviceDialog onAdd={(r) => setRobots((prev) => [...prev, r])} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-5">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-card border border-border h-12 p-1 gap-1">
            <TabsTrigger value="map" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 h-10 transition-all">
              <MapIcon className="size-4" /> Карта
              <span className="ml-1 text-[10px] font-mono opacity-70 tabular-nums">{samples.length}</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 h-10 transition-all">
              <Cpu className="size-4" /> Устройства
              <span className="ml-1 text-[10px] font-mono opacity-70 tabular-nums">{robots.length}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 h-10 transition-all">
              <BarChart3 className="size-4" /> Аналитика и Отчёты
            </TabsTrigger>
            <div className="ml-auto hidden md:flex items-center gap-1 pr-2 text-[10px] text-muted-foreground">
              <Clock className="size-3" />
              <span>Тик симуляции: 1.5 с</span>
            </div>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <div className="relative h-[calc(100vh-220px)] min-h-[600px]">
              <MapView
                robots={robots}
                samples={samples}
                onSelectRobot={setSelectedRobot}
                onSelectSample={setSelectedSample}
                selectedRobotId={selectedRobot?.id}
                editMode={editMode && !!selectedRobot}
                editingRobotId={selectedRobot?.id}
                draftWaypoints={draftWaypoints}
                onMapClick={(x, y) => setDraftWaypoints((wps) => [...wps, { x, y }])}
              />
              {selectedRobot && (
                <RobotPanel
                  robot={selectedRobot}
                  onClose={() => { setSelectedRobot(null); setEditMode(false); }}
                  onUpdate={(r) => {
                    setRobots((prev) => prev.map((p) => (p.id === r.id ? r : p)));
                    setSelectedRobot(r);
                  }}
                  editMode={editMode}
                  setEditMode={setEditMode}
                  draftWaypoints={draftWaypoints}
                  setDraftWaypoints={setDraftWaypoints}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="devices" className="mt-4">
            <DevicesView robots={robots} log={log} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <AnalyticsView robots={robots} />
          </TabsContent>
        </Tabs>
      </main>

      <SampleDialog sample={selectedSample} onClose={() => setSelectedSample(null)} />
    </div>
  );
}
