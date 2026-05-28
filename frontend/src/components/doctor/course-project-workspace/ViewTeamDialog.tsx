import { WorkspaceModal } from "@/components/doctor/course-workspace/WorkspaceModal";
import type { CourseTeam } from "@/api/doctorCoursesApi";
import { initialsFromName } from "@/lib/doctorHubMappers";

type ViewTeamDialogProps = {
  open: boolean;
  team: CourseTeam | null;
  projectTitle: string;
  onClose: () => void;
};

export function ViewTeamDialog({ open, team, projectTitle, onClose }: ViewTeamDialogProps) {
  if (!team) return null;

  return (
    <WorkspaceModal
      open={open}
      title={`Team ${team.teamIndex + 1}`}
      description={projectTitle}
      onClose={onClose}
      className="max-w-lg"
    >
      <div className="space-y-3">
        <p className="text-[12px] text-muted-foreground">
          {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
        </p>
        {team.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">This team has no members yet.</p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/70">
            {team.members.map((member) => (
              <li key={member.studentId} className="flex items-center gap-3 px-3 py-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {initialsFromName(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{member.name}</div>
                  {member.universityId ? (
                    <div className="text-[11px] text-muted-foreground">{member.universityId}</div>
                  ) : null}
                  {typeof member.matchScore === "number" ? (
                    <div className="text-[11px] text-muted-foreground">
                      Match score: {member.matchScore}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WorkspaceModal>
  );
}
