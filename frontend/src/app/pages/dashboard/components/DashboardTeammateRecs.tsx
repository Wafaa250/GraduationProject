import { Sparkles, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { SuggestedTeammate } from "../../../../api/dashboardApi";
import ProfileLink from "../../../components/common/ProfileLink";
import {
  initialsFromName,
  matchScoreClass,
  teammateCardGradient,
} from "../dashboardUtils";
import { cn } from "../../../components/ui/utils";

type DashboardTeammateRecsProps = {
  teammates: SuggestedTeammate[];
  onViewAll: () => void;
  onInvite?: (profileId: number) => void;
  inviteLoadingId?: number | null;
  canInvite?: boolean;
};

export function DashboardTeammateRecs({
  teammates,
  onViewAll,
  onInvite,
  inviteLoadingId,
  canInvite = false,
}: DashboardTeammateRecsProps) {
  const navigate = useNavigate();
  const shown = teammates.slice(0, 3);

  return (
    <section className="bg-card border border-border rounded-3xl p-6 lg:p-7 shadow-card">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary-soft px-2.5 py-1 rounded-full mb-2">
            <Sparkles className="size-3" />
            AI recommendations
          </div>
          <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground">
            AI teammate recommendations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Curated for your graduation project goals and complementary skills.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-semibold text-primary hover:text-primary-glow transition-colors"
        >
          View all matches →
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No teammate suggestions yet. Complete your profile skills to improve matches.
          </p>
          <Link
            to="/students"
            className="inline-block mt-4 text-sm font-semibold text-primary no-underline"
          >
            Browse students →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {shown.map((t, i) => (
            <article
              key={t.profileId}
              className="group relative rounded-2xl border border-border bg-gradient-card p-5 hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-20 bg-gradient-to-br rounded-t-2xl opacity-50",
                  teammateCardGradient(i),
                )}
              />

              <div className="relative flex items-start gap-3">
                {t.profilePicture ? (
                  <img
                    src={t.profilePicture}
                    alt=""
                    className="size-14 rounded-2xl object-cover shadow-md ring-4 ring-card"
                  />
                ) : (
                  <div className="size-14 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground font-display font-bold text-lg shadow-md ring-4 ring-card">
                    {initialsFromName(t.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="font-display font-bold text-base leading-tight text-foreground">
                    <ProfileLink userId={t.userId} role="student">
                      {t.name}
                    </ProfileLink>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {[t.major, t.academicYear].filter(Boolean).join(" · ") || t.university}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full",
                    matchScoreClass(t.matchScore),
                  )}
                >
                  {t.matchScore}%
                </span>
              </div>

              {t.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {t.skills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-medium bg-muted text-foreground/80 px-2.5 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/students/${t.userId}`)}
                  className="flex-1 text-sm font-semibold border border-border hover:border-primary/40 hover:bg-primary-soft/40 rounded-xl py-2 transition-colors text-foreground"
                >
                  View Profile
                </button>
                {canInvite && onInvite ? (
                  <button
                    type="button"
                    disabled={inviteLoadingId === t.profileId}
                    onClick={() => onInvite(t.profileId)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-gradient-primary text-primary-foreground rounded-xl py-2 hover:shadow-glow transition-all disabled:opacity-60"
                  >
                    <UserPlus className="size-4" />
                    {inviteLoadingId === t.profileId ? "…" : "Invite"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onViewAll}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-gradient-primary text-primary-foreground rounded-xl py-2 hover:shadow-glow transition-all"
                  >
                    <UserPlus className="size-4" /> Find team
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
