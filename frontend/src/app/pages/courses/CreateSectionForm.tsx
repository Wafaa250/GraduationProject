import { useState, type CSSProperties, type FormEvent } from "react";
import { dash } from "../doctor/dashboard/doctorDashTokens";

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
};

export function CreateSectionForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [capacityInput, setCapacityInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (id: string) => {
    setDays((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id].sort(byWeekdayOrder),
    );
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
    <form
      onSubmit={handleSubmit}
      style={{
        margin: "0 20px 20px",
        padding: 20,
        borderRadius: dash.radiusMd,
        border: `1px solid ${dash.border}`,
        background: "#f8fafc",
        boxSizing: "border-box",
      }}
    >
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 12,
          fontWeight: 700,
          color: dash.subtle,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        New section
      </p>

      <label style={F.label}>
        Section name
        <input
          style={F.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Section A — Morning"
          autoComplete="off"
        />
      </label>

      <div style={{ marginBottom: 16 }}>
        <span style={F.labelInline}>Days</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {WEEKDAY_OPTIONS.map(({ id, label }) => {
            const on = days.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleDay(id)}
                style={dayChipStyle(on)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ ...F.row, marginBottom: 16 }}>
        <label style={{ ...F.label, flex: 1, minWidth: 120, marginBottom: 0 }}>
          From
          <input
            type="time"
            style={F.input}
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
          />
        </label>
        <label style={{ ...F.label, flex: 1, minWidth: 120, marginBottom: 0 }}>
          To
          <input
            type="time"
            style={F.input}
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
          />
        </label>
      </div>

      <label style={F.label}>
        Capacity
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          style={F.input}
          value={capacityInput}
          onChange={(e) => setCapacityInput(e.target.value)}
          placeholder="e.g. 40"
        />
      </label>

      {error ? (
        <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: dash.danger }}>{error}</p>
      ) : null}

      <div style={F.actions}>
        <button type="button" onClick={onCancel} style={F.secondaryBtn}>
          Cancel
        </button>
        <button type="submit" style={F.primaryBtn}>
          Add section
        </button>
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

function dayChipStyle(selected: boolean): CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: 10,
    border: `1.5px solid ${selected ? dash.accent : dash.border}`,
    background: selected ? dash.accentMuted : dash.surface,
    color: selected ? dash.accent : dash.muted,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
  };
}

const F: Record<string, CSSProperties> = {
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 16,
  },
  labelInline: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "11px 12px",
    borderRadius: 10,
    border: `1.5px solid ${dash.border}`,
    fontSize: 14,
    color: dash.text,
    boxSizing: "border-box",
    fontFamily: dash.font,
    background: dash.surface,
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "flex-end",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
    paddingTop: 4,
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 18px",
    borderRadius: 10,
    border: "none",
    background: `linear-gradient(135deg,${dash.accent},#7c3aed)`,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
    boxShadow: "0 4px 16px rgba(79,70,229,0.3)",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 9,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    color: dash.muted,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
  },
};
