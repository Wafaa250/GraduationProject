import { Sparkles } from "lucide-react";
import ProfileLink from "../../../components/common/ProfileLink";
import { SectionSpinner } from "./SectionSpinner";
import { dash } from "./doctorDashTokens";
import type { SuggestionRow } from "./doctorDashboardHelpers";
import { PageHeader } from "./ui/PageHeader";
import { EmptyState } from "./ui/EmptyState";
import { MatchBadge } from "./ui/MatchBadge";
import { SkillChip } from "./ui/SkillChip";

type Props = {
  suggestions: SuggestionRow[];
  loading: boolean;
};

export function RecommendationsSection({ suggestions, loading }: Props) {
  return (
    <div className="dd-section-page">
      <PageHeader eyebrow="AI matching" title="Recommendations" />

      {loading && suggestions.length === 0 ? (
        <SectionSpinner label="Loading recommendations…" />
      ) : suggestions.length === 0 ? (
        <EmptyState icon={Sparkles} title="No recommendations yet" />
      ) : (
        <div className="dd-teams-grid">
          {suggestions.map((s) => (
            <article
              key={s.userId}
              className="dd-panel dd-card-hover"
              style={{ padding: 22 }}
            >
              <div className="dd-section-head" style={{ marginBottom: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <ProfileLink
                    userId={s.userId}
                    role="student"
                    className="dd-rec-name"
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      fontFamily: dash.fontDisplay,
                      color: dash.text,
                      textDecoration: "none",
                      display: "block",
                    }}
                  >
                    {s.name}
                  </ProfileLink>
                  <p className="dd-text-desc" style={{ margin: "4px 0 0", fontSize: dash.textDescSm }}>
                    {s.major}
                    {s.university ? ` · ${s.university}` : ""}
                  </p>
                </div>
                <MatchBadge value={s.matchScore} />
              </div>
              {s.skills.length > 0 ? (
                <div className="dd-chip-row">
                  {s.skills.slice(0, 6).map((sk, i) => (
                    <SkillChip key={`${s.userId}-${i}`}>{sk}</SkillChip>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
