import { dash } from "../doctorDashTokens";

/** Circular AI match indicator (Lovable design). */
export function MatchScore({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="dd-match-score">
      <div
        className="dd-match-score-ring"
        style={{
          background: `conic-gradient(${dash.accent} ${clamped * 3.6}deg, rgba(148, 163, 184, 0.35) 0)`,
        }}
      >
        <span className="dd-match-score-value">{clamped}%</span>
      </div>
      <div className="dd-match-score-label">
        AI match
        <br />
        score
      </div>
    </div>
  );
}
