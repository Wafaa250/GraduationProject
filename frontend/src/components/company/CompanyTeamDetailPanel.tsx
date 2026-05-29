import { useEffect, type ReactNode } from "react";
import { Check, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import type {
  CompanyRequestInvitationStatus,
  CompanyRequestTeamRecommendation,
  CompanyRequestTeamRecommendationMember,
} from "@/api/companyApi";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  team: CompanyRequestTeamRecommendation | null;
  invitingTeamId?: number | null;
  invitingMemberId?: number | null;
  invitationStatusByStudentId: Map<number, CompanyRequestInvitationStatus>;
  onClose: () => void;
  onInviteTeam: (team: CompanyRequestTeamRecommendation) => void;
  onInviteMember: (member: CompanyRequestTeamRecommendationMember) => void;
  onViewMember: (member: CompanyRequestTeamRecommendationMember) => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

export function CompanyTeamDetailPanel({
  team,
  invitingTeamId,
  invitingMemberId,
  invitationStatusByStudentId,
  onClose,
  onInviteTeam,
  onInviteMember,
  onViewMember,
}: Props) {
  useEffect(() => {
    if (!team) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [team, onClose]);

  if (!team) return null;

  const pendingCount = team.members.filter((m) => {
    const status = invitationStatusByStudentId.get(m.studentProfileId);
    return status !== "pending" && status !== "accepted";
  }).length;

  const allInvited = pendingCount === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close team details"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-lg bg-card border-l shadow-xl flex flex-col max-h-full">
        <div className="flex items-start justify-between gap-3 p-5 border-b shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              AI team composition
            </p>
            <h2 className="text-lg font-semibold tracking-tight mt-0.5">Team #{team.teamRank}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {team.members.length} members · {team.totalScore}% overall match
            </p>
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <CompatibilityRing value={team.totalScore} size={56} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-lg h-9 w-9"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {team.summaryReason && (
            <p className="text-sm text-muted-foreground leading-relaxed">{team.summaryReason}</p>
          )}

          <Section title="Role assignments">
            <ul className="space-y-2">
              {team.members.map((member) => {
                const invitationStatus = invitationStatusByStudentId.get(member.studentProfileId);
                const invited =
                  invitationStatus === "pending" || invitationStatus === "accepted";
                const subtitle = [member.major || member.faculty, member.university]
                  .filter(Boolean)
                  .join(" · ");
                const skills = member.highlights.filter(Boolean).slice(0, 5);

                return (
                  <li
                    key={`${member.companyRequestRoleId}-${member.studentProfileId}`}
                    className="rounded-xl border border-border/60 p-3 bg-background/40"
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="cw-candidate-avatar-fallback text-[10px] font-medium">
                          {initials(member.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="rounded-md text-[10px] font-normal border-primary/25 text-primary"
                          >
                            {member.roleName}
                          </Badge>
                          {invitationStatus && (
                            <Badge variant="outline" className="rounded-md text-[10px] capitalize">
                              {invitationStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-1.5">{member.studentName}</p>
                        {subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                        )}
                        {member.assignmentReason && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                            {member.assignmentReason}
                          </p>
                        )}
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {skills.map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="rounded-md text-[10px] font-normal h-5 px-1.5 bg-primary/8"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-lg h-8 text-xs"
                            onClick={() => onViewMember(member)}
                          >
                            View profile
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className={
                              invited
                                ? "rounded-lg h-8 text-xs text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30"
                                : "rounded-lg h-8 text-xs cw-btn-gradient border-0 shadow-none"
                            }
                            variant={invited ? "outline" : "default"}
                            disabled={invited || invitingMemberId === member.studentProfileId}
                            onClick={() => onInviteMember(member)}
                          >
                            {invited ? (
                              <>
                                <Check className="h-3 w-3 mr-1" /> Sent
                              </>
                            ) : invitingMemberId === member.studentProfileId ? (
                              "Inviting…"
                            ) : (
                              "Invite"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>

          {(team.strengths.length > 0 || team.risks.length > 0) && (
            <Section title="Signals">
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {team.strengths.length > 0 && (
                  <ul className="space-y-1 p-3 rounded-xl bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                    {team.strengths.slice(0, 4).map((item) => (
                      <li key={item} className="text-xs leading-relaxed">
                        + {item}
                      </li>
                    ))}
                  </ul>
                )}
                {team.risks.length > 0 && (
                  <ul className="space-y-1 p-3 rounded-xl bg-amber-500/10 text-amber-950 dark:text-amber-100">
                    {team.risks.slice(0, 4).map((item) => (
                      <li key={item} className="text-xs leading-relaxed">
                        ! {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Section>
          )}
        </div>

        <div className="p-5 border-t flex gap-2 shrink-0 bg-card">
          <Button type="button" variant="outline" className="rounded-xl flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            className="rounded-xl cw-btn-gradient shadow-sm border-0 flex-1"
            disabled={allInvited || invitingTeamId === team.teamId}
            onClick={() => onInviteTeam(team)}
          >
            <Users className="h-4 w-4 mr-1 shrink-0" />
            {invitingTeamId === team.teamId
              ? "Inviting team…"
              : allInvited
                ? "All invited"
                : "Invite team"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
