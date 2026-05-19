import { ArrowRight, MessageCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { SuggestedTeammate } from "../../../../api/dashboardApi";
import { MatchScoreBadge, SkillChip } from "../../../components/design-system";
import ProfileLink, { getProfileUrl } from "../../../components/common/ProfileLink";
import { Button } from "../../../components/ui/button";

export type DashboardTeammateMatchesProps = {
  teammates: SuggestedTeammate[];
  onInvite?: (profileId: number) => void;
  inviteLoadingId?: number | null;
  canInvite: boolean;
  onSeeAll: () => void;
};

export function DashboardTeammateMatches({
  teammates,
  onInvite,
  inviteLoadingId,
  canInvite,
  onSeeAll,
}: DashboardTeammateMatchesProps) {
  const navigate = useNavigate();
  const preview = teammates.slice(0, 2);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">Top teammate matches</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Students aligned with your skills and project goals.
          </p>
        </div>
        {teammates.length > 0 ? (
          <Button variant="ghost" size="sm" className="text-primary" onClick={onSeeAll}>
            See all
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      {preview.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
          <p className="font-display font-semibold">No matches yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your profile and create a project to unlock AI teammate suggestions.
          </p>
          <Button className="mt-4" variant="gradient" size="sm" onClick={onSeeAll}>
            Browse students
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {preview.map((student) => {
            const initials = student.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const reason =
              student.skills.length > 0
                ? `Strong overlap in ${student.skills.slice(0, 3).join(", ")}.`
                : `Matched at ${student.matchScore}% based on your profile.`;

            return (
              <article
                key={student.userId}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground shadow-glow">
                      {student.profilePicture ? (
                        <img
                          src={student.profilePicture}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold leading-tight">
                        <ProfileLink userId={student.userId} role="student">
                          {student.name}
                        </ProfileLink>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[student.major, student.academicYear].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <MatchScoreBadge score={student.matchScore} />
                </div>

                {student.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {student.skills.slice(0, 4).map((skill) => (
                      <SkillChip key={skill} label={skill} variant="have" />
                    ))}
                  </div>
                ) : null}

                <p className="rounded-xl border border-ai/15 bg-ai-soft/60 px-3 py-2 text-xs leading-relaxed text-ai">
                  <span className="font-semibold">AI:</span> {reason}
                </p>

                <div className="flex gap-2 pt-1">
                  {canInvite && onInvite ? (
                    <Button
                      size="sm"
                      variant="gradient"
                      className="flex-1"
                      disabled={inviteLoadingId === student.profileId}
                      onClick={() => onInvite(student.profileId)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {inviteLoadingId === student.profileId ? "Sending…" : "Invite"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="gradient"
                      className="flex-1"
                      onClick={() => {
                        const href = getProfileUrl({
                          role: "student",
                          userId: student.userId,
                        });
                        navigate(href ?? "/students");
                      }}
                    >
                      View profile
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/messages")}
                    aria-label="Message"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
