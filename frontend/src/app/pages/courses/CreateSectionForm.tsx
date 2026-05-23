import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cn } from "../../components/ui/utils";

const WEEKDAY_OPTIONS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
] as const;

export type NewSectionPayload = {
  name: string;
  days: string[];
  timeFrom: string;
  timeTo: string;
  capacity: number;
};

type Props = {
  onSubmit: (payload: NewSectionPayload) => void;
  onCancel: () => void;
  submitting?: boolean;
  className?: string;
};

export function CreateSectionForm({ onSubmit, onCancel, submitting = false, className }: Props) {
  const [name, setName] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [capacityInput, setCapacityInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (id: string, checked: boolean) => {
    setDays((prev) => {
      const next = checked ? [...prev, id] : prev.filter((d) => d !== id);
      return [...next].sort(byWeekdayOrder);
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      setError("Enter a section name.");
      return;
    }
    if (days.length === 0) {
      setError("Select at least one day.");
      return;
    }
    if (!timeFrom || !timeTo) {
      setError("Choose a start and end time.");
      return;
    }
    const cap = Number.parseInt(capacityInput, 10);
    if (!Number.isFinite(cap) || cap < 1) {
      setError("Enter a capacity of at least 1.");
      return;
    }
    onSubmit({
      name: nameTrim,
      days: [...days],
      timeFrom,
      timeTo,
      capacity: cap,
    });
    setName("");
    setDays([]);
    setTimeFrom("");
    setTimeTo("");
    setCapacityInput("");
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="section-name">Section name</Label>
        <Input
          id="section-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Section A — Morning"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label>Days</Label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_OPTIONS.map(({ id, label }) => (
            <label
              key={id}
              className="flex items-center gap-1.5 text-sm border border-border rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-accent/50"
            >
              <Checkbox
                checked={days.includes(id)}
                onCheckedChange={(c) => toggleDay(id, c === true)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="time-from">Start</Label>
          <Input
            id="time-from"
            type="time"
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time-to">End</Label>
          <Input
            id="time-to"
            type="time"
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={capacityInput}
          onChange={(e) => setCapacityInput(e.target.value)}
          placeholder="e.g. 40"
        />
      </div>

      {error ? <p className="text-sm font-medium text-destructive m-0">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create section"}
        </Button>
      </div>
    </form>
  );
}

function byWeekdayOrder(a: string, b: string): number {
  const order = WEEKDAY_OPTIONS.map((d) => d.id);
  return order.indexOf(a) - order.indexOf(b);
}

const DAY_LOOKUP: Record<string, string> = Object.fromEntries(
  WEEKDAY_OPTIONS.map((d) => [d.id, d.label]),
);

function formatTimeLabel(hhmm: string): string {
  const parts = hhmm.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Human-readable schedule for section cards. */
export function formatSectionSchedule(days: string[], timeFrom: string, timeTo: string): string {
  const labels = [...days].sort(byWeekdayOrder).map((id) => DAY_LOOKUP[id] ?? id);
  const daysPart = labels.length > 0 ? labels.join(", ") : "—";
  if (!timeFrom || !timeTo) return daysPart;
  return `${daysPart} · ${formatTimeLabel(timeFrom)} – ${formatTimeLabel(timeTo)}`;
}
