import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Cpu } from "lucide-react";
import { toast } from "sonner";
import type { Robot } from "./types";

export function ConnectDeviceDialog({ onAdd }: { onAdd: (r: Robot) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !model || !serial) return;
    onAdd({
      id: `r${Date.now()}`,
      name, model, serial,
      status: "online",
      battery: 100, signal: 88,
      position: { x: 40 + Math.random() * 30, y: 30 + Math.random() * 40 },
      samplesPerTrip: 10,
    });
    toast.success("Устройство подключено", { description: `${name} добавлен в систему` });
    setOpen(false);
    setName(""); setModel(""); setSerial("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold">
          <Plus className="size-4" /> Подключить устройство
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Cpu className="size-5 text-primary" /> Подключение нового USV
          </DialogTitle>
          <DialogDescription>Введите данные робота для регистрации в системе мониторинга.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Имя робота</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="AquaBot-04" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Модель</Label>
            <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="AB-X300" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serial">Серийный номер</Label>
            <Input id="serial" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="SN-0004-XX" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Подключить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
