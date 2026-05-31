type Props = {
  value: number;
  size?: number;
};

export function CompatibilityRing({ value, size = 56 }: Props) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = "hsl(var(--cw-match-ring, 38 92% 50%))";

  return (
    <div
      className="cw-match-ring relative inline-grid place-items-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${value}% match`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--muted))"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums">{value}%</span>
    </div>
  );
}
