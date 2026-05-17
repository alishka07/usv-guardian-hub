import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map as MapIcon, Cpu, BarChart3, Waves, Activity } from "lucide-react";
import { ConnectDeviceDialog } from "@/components/app/ConnectDeviceDialog";
import { MapView } from "@/components/app/MapView";
import { RobotPanel } from "@/components/app/RobotPanel";
import { SampleDialog } from "@/components/app/SampleDialog";
import { DevicesView } from "@/components/app/DevicesView";
import { AnalyticsView } from "@/components/app/AnalyticsView";
import { initialRobots, initialSamples } from "@/components/app/mock-data";
import type { Robot, Sample } from "@/components/app/types";

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      { title: "Система мониторинга качества воды (USV)" },
      { name: "description", content: "Платформа управления автономными аппаратами для мониторинга качества воды в реальном времени." },
    ],
  }),
});

function App() {
  const [robots, setRobots] = useState<Robot[]>(initialRobots);
  const [samples] = useState<Sample[]>(initialSamples);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [tab, setTab] = useState("map");

  const onlineCount = robots.filter((r) => r.status === "online").length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-cyan-accent flex items-center justify-center glow-primary">
                <Waves className="size-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight">Система мониторинга качества воды (USV)</h1>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Activity className="size-3 text-success pulse-dot" />
                Активных устройств: <span className="text-success font-semibold">{onlineCount}</span> из {robots.length}
              </div>
            </div>
          </div>
          <div className="ml-auto">
            <ConnectDeviceDialog onAdd={(r) => setRobots((prev) => [...prev, r])} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-card border border-border h-12 p-1">
            <TabsTrigger value="map" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 h-10">
              <MapIcon className="size-4" /> Карта
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 h-10">
              <Cpu className="size-4" /> Устройства
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 h-10">
              <BarChart3 className="size-4" /> Аналитика и Отчеты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <div className="relative h-[calc(100vh-220px)] min-h-[600px]">
              <MapView
                robots={robots}
                samples={samples}
                onSelectRobot={setSelectedRobot}
                onSelectSample={setSelectedSample}
                selectedRobotId={selectedRobot?.id}
              />
              {selectedRobot && (
                <RobotPanel
                  robot={selectedRobot}
                  onClose={() => setSelectedRobot(null)}
                  onUpdate={(r) => {
                    setRobots((prev) => prev.map((p) => (p.id === r.id ? r : p)));
                    setSelectedRobot(r);
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="devices" className="mt-4">
            <DevicesView robots={robots} />
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
