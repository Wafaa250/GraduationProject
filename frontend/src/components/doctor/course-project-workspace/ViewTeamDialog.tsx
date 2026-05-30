import { Crown, Loader2, MessageCircle, Users2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkspaceModal } from "@/components/doctor/course-workspace/WorkspaceModal";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { CourseTeam } from "@/api/doctorCoursesApi";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { getTeamColorTheme } from "@/lib/courseTeamColors";
import { getTeamLeadMemberId } from "@/lib/courseTeamMembers";
import { openCourseTeamChat } from "@/lib/openCourseTeamChat";
import { doctorMessageThreadPath } from "@/routes/paths";
import { cn } from "@/lib/utils";

type ViewTeamDialogProps = {
  open: boolean;
  team: CourseTeam | null;
  projectTitle: string;
  onClose: () => void;
};

export function ViewTeamDialog({ open, team, projectTitle, onClose }: ViewTeamDialogProps) {
  const navigate = useNavigate();
  const [openingChat, setOpeningChat] = useState(false);

  if (!team) return null;

  const theme = getTeamColorTheme(team.teamIndex);
  const leadId = getTeamLeadMemberId(team.members);
  const teamName = `Team ${team.teamIndex + 1}`;

  async function handleOpenTeamChat() {
    setOpeningChat(true);
    try {
      await openCourseTeamChat(team!.teamId, navigate, doctorMessageThreadPath);
      onClose();
    } catch (err) {
      toast({
        title: "Could not open team chat",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setOpeningChat(false);
    }
  }

  return (
    <WorkspaceModal
      open={open}
      title={teamName}
      description={projectTitle}
      onClose={onClose}
      className="max-w-xl"
    >
      <div
        className={cn(
          "cpw-team-modal__header flex items-center gap-3 border-l-4",
          theme.borderClass,
          theme.headerClass,
        )}
      >
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
            theme.iconBgClass,
            theme.iconClass,
          )}
        >
          <Users2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{teamName}</p>
          <p className="text-[12px] text-muted-foreground">
            {team.memberCount} member{team.memberCount === 1 ? "" : "s"} · {theme.label} team
          </p>
        </div>
      </div>

      {team.members.length === 0 ? (
        <p className="text-sm text-muted-foreground">This team has no members yet.</p>
      ) : (
        <ul className="space-y-3">
          {team.members.map((member) => {
            const isLead = member.studentId === leadId;
            const skills = (member.skills ?? []).slice(0, 6);
            return (
              <li
                key={member.studentId}
                className={cn("cpw-team-modal__member", isLead && "cpw-team-modal__member--lead")}
              >
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    theme.iconBgClass,
                    theme.iconClass,
                  )}
                >
                  {initialsFromName(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{member.name}</span>
                    {isLead ? (
                      <span className="cpw-lead-badge">
                        <Crown className="h-3 w-3" />
                        Team lead
                      </span>
                    ) : null}
                  </div>
                  {member.universityId ? (
                    <p className="text-[11px] text-muted-foreground">{member.universityId}</p>
                  ) : null}
                  {typeof member.matchScore === "number" ? (
                    <p className="text-[11px] text-muted-foreground">
                      Match score: {member.matchScore}
                    </p>
                  ) : null}
                  {skills.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                            theme.badgeClass,
                          )}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          disabled={openingChat}
          onClick={() => void handleOpenTeamChat()}
        >
          {openingChat ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          Open team chat
        </Button>
      </div>
    </WorkspaceModal>
  );
}
