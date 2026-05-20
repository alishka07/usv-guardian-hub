import { Map as MapIcon, Cpu, BarChart3, Waves, Activity, Radio } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

type View = "map" | "devices" | "analytics";

type Props = {
  view: View;
  onChange: (v: View) => void;
  onlineCount: number;
  totalCount: number;
  rtlCount: number;
  sampleCount: number;
  clock: string;
};

const items: { id: View; title: string; icon: typeof MapIcon; badge?: (p: Props) => string | number }[] = [
  { id: "map", title: "Карта", icon: MapIcon, badge: (p) => p.sampleCount },
  { id: "devices", title: "Устройства", icon: Cpu, badge: (p) => p.totalCount },
  { id: "analytics", title: "Аналитика и отчёты", icon: BarChart3 },
];

export function AppSidebar(props: Props) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 rounded-xl flex items-center justify-center shadow-lg glow-cyan"
               style={{ background: "var(--gradient-cyan)" }}>
            <Waves className="size-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[13px] font-display font-semibold leading-tight tracking-tight gradient-text">
                AquaWatch · USV
              </div>
              <div className="text-[10.5px] text-sidebar-foreground/60 mt-0.5 truncate">
                Капшагай · мониторинг
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <div className="hairline mx-3" />

      <SidebarContent className="px-1.5 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/45 font-display">
            Навигация
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = props.view === item.id;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-10 rounded-lg transition-all data-[active=true]:bg-sidebar-accent data-[active=true]:text-cyan-accent data-[active=true]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--cyan-accent)_35%,transparent)]"
                    >
                      <button onClick={() => props.onChange(item.id)} className="w-full flex items-center gap-3">
                        <Icon className="size-4" />
                        {!collapsed && (
                          <>
                            <span className="text-[13px] font-medium">{item.title}</span>
                            {item.badge && (
                              <span className="ml-auto text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-sidebar-foreground/8 text-sidebar-foreground/70">
                                {item.badge(props)}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4 pt-2">
        {!collapsed ? (
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 backdrop-blur px-3 py-3 space-y-2">
            <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.14em] text-sidebar-foreground/60 font-display">
              <span className="flex items-center gap-1.5">
                <Radio className="size-3 text-success pulse-dot" /> Live
              </span>
              <span className="font-mono tabular-nums text-cyan-accent/90">{props.clock}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Activity className="size-3.5 text-success" />
              <span className="text-sidebar-foreground/80">В сети</span>
              <span className="ml-auto font-display font-semibold text-success">
                {props.onlineCount}<span className="text-sidebar-foreground/40 font-normal">/{props.totalCount}</span>
              </span>
            </div>
            {props.rtlCount > 0 && (
              <div className="flex items-center gap-2 text-[11px]">
                <Activity className="size-3.5 text-warning" />
                <span className="text-sidebar-foreground/80">RTL</span>
                <span className="ml-auto font-display font-semibold text-warning">{props.rtlCount}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <Radio className="size-4 text-success pulse-dot" />
            <div className="text-[10px] font-mono text-success">{props.onlineCount}</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}