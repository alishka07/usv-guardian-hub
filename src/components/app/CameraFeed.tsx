import { useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";

type Props = {
  label?: string;
  className?: string;
  live?: boolean; // animated feed vs a frozen snapshot
};

// Simulated onboard camera — a canvas-rendered underwater scene with drifting
// microparticles and an operator HUD. Stands in for a real video stream until
// the USV hardware is connected.
export function CameraFeed({ label = "USV-CAM", className = "", live = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("ru-RU"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    let raf = 0;
    let frame = live ? 0 : 240;

    const particles = Array.from({ length: 34 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.8,
      sp: 0.0006 + Math.random() * 0.002,
    }));

    const render = () => {
      const w = (canvas.width = Math.max(1, canvas.clientWidth) * dpr);
      const h = (canvas.height = Math.max(1, canvas.clientHeight) * dpr);
      const t = frame;

      // water column gradient
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#11383f");
      g.addColorStop(0.55, "#0c2730");
      g.addColorStop(1, "#06161d");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // caustic ripples
      ctx.strokeStyle = "rgba(150,220,235,0.10)";
      ctx.lineWidth = 2 * dpr;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const yBase = (h / 6) * i + h / 12;
        for (let x = 0; x <= w; x += 8 * dpr) {
          const y = yBase + Math.sin(x / (60 * dpr) + t / 30 + i) * 8 * dpr;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // sunlight shaft
      ctx.fillStyle = "rgba(170,230,240,0.05)";
      ctx.beginPath();
      const sx = w * (0.3 + 0.2 * Math.sin(t / 120));
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx + w * 0.18, 0);
      ctx.lineTo(sx + w * 0.32, h);
      ctx.lineTo(sx - w * 0.05, h);
      ctx.closePath();
      ctx.fill();

      // drifting microparticles
      ctx.fillStyle = "rgba(210,240,245,0.55)";
      for (const p of particles) {
        if (live) {
          p.y -= p.sp;
          if (p.y < -0.05) {
            p.y = 1.05;
            p.x = Math.random();
          }
        }
        const px = (p.x + Math.sin(t / 60 + p.y * 8) * 0.01) * w;
        const py = p.y * h;
        ctx.beginPath();
        ctx.arc(px, py, p.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // vignette
      const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.78);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);

      if (live) {
        frame += 1;
        raf = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [live]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-black ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="absolute inset-0 scan-line pointer-events-none opacity-25" />
      <div className="absolute inset-0 p-2 flex flex-col justify-between pointer-events-none font-mono text-[10px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-red-400">
            <span className={`size-1.5 rounded-full bg-red-500 ${live ? "pulse-dot" : ""}`} />
            {live ? "REC" : "STILL"}
          </span>
          <span className="text-cyan-accent/80">{label}</span>
        </div>
        <Crosshair className="size-6 self-center text-cyan-accent/35" />
        <div className="flex items-center justify-between text-cyan-accent/70">
          <span suppressHydrationWarning>{clock}</span>
          <span>AUTO · ISO 800</span>
        </div>
      </div>
    </div>
  );
}
