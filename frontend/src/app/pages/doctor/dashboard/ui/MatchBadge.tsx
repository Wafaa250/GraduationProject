import { dash } from "../doctorDashTokens";

export function MatchBadge({ value }: { value: number }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        padding: "5px 10px",
        borderRadius: 20,
        background: dash.gradientSoft,
        color: dash.accentDeep,
        border: `1px solid ${dash.accentBorder}`,
        flexShrink: 0,
      }}
    >
      {value}% fit
    </span>
  );
}
