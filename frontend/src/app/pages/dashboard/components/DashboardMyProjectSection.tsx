import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Users, CheckCircle2, UserPlus } from "lucide-react";
import type { GradProject, GradProjectMember } from "../../../../api/gradProjectApi";
import type { GradProjectRecommendedStudent } from "../../../../api/gradProjectApi";
import ProfileLink from "../../../components/common/ProfileLink";
import { AiTeammateRecommendations } from "../../../components/project/AiTeammateRecommendations";
import type { AiRecommendationPanelUiState } from "../../../components/project/AiRecommendationPanel";
import { aiPanelStyles } from "../../../components/project/aiRecommendationPanelStyles";
import { TeamMemberRow } from "./TeamMemberRow";
import { initialsFromName } from "../dashboardUtils";
import { formatSupervisorDoctorName } from "../dashboardFormat";

type DashboardMyProjectSectionProps = {
  gradLoading: boolean;
  gradProject: GradProject | null;
  teamMembers: GradProjectMember[];
  currentMembers: number;
  isFull: boolean;
  myRole: "owner" | "leader" | "member" | null;
  myStudentId: number | null;
  removingId: number | null;
  promotingId: number | null;
  removeMsg: { msg: string; ok: boolean } | null;
  leaderMsg: { msg: string; ok: boolean } | null;
  onOpenCreate: () => void;
  onOpenEdit: () => void;
  onDelete: () => void;
  onLeave: () => void;
  onRemoveMember: (studentId: number) => void;
  onMakeLeader: (studentId: number) => void;
  aiStudentsUiState: AiRecommendationPanelUiState;
  aiStudents: GradProjectRecommendedStudent[];
  aiStudentsError: string | null;
  onAiRecommendStudents: () => void;
  onAiInviteStudent: (studentId: number) => void;
  aiCardInviteLoadingId: number | null;
  skillChipStyle: React.CSSProperties;
};

export function DashboardMyProjectSection({
  gradLoading,
  gradProject,
  teamMembers,
  currentMembers,
  isFull,
  myRole,
  myStudentId,
  removingId,
  removeMsg,
  leaderMsg,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onLeave,
  onRemoveMember,
  onMakeLeader,
  aiStudentsUiState,
  aiStudents,
  aiStudentsError,
  onAiRecommendStudents,
  onAiInviteStudent,
  aiCardInviteLoadingId,
  skillChipStyle,
}: DashboardMyProjectSectionProps) {
  const navigate = useNavigate();
  const maxMembers = gradProject?.partnersCount ?? 0;
  const progressPct =
    maxMembers > 0 ? Math.min(100, Math.round((currentMembers / maxMembers) * 100)) : 0;
  const canManageTeam = myRole === "owner" || myRole === "leader";
  const onTrack = !!gradProject && !gradLoading;

  const openWorkspace = () => {
    if (gradProject?.id) navigate(`/student/team/${gradProject.id}`);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 lg:p-7 shadow-card">
      <div className="absolute -right-10 -top-10 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          {onTrack ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full mb-2">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              {isFull ? "Team complete" : "On track"}
            </div>
          ) : null}
          <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground">
            My graduation project
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {gradProject?.name ?? "Create your graduation project to get started"}
          </p>
        </div>
        {gradProject ? (
          <button
            type="button"
            onClick={openWorkspace}
            className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-glow transition-all"
          >
            Open Workspace <ArrowRight className="size-4" />
          </button>
        ) : !gradLoading ? (
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-glow transition-all"
          >
            Create project <ArrowRight className="size-4" />
          </button>
        ) : null}
      </div>

      {gradLoading ? (
        <p className="text-sm text-muted-foreground">Loading project…</p>
      ) : !gradProject ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            You don&apos;t have a graduation project yet. Create one and find teammates.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl"
          >
            Create Graduation Project
          </button>
        </div>
      ) : (
        <div className="relative grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">Team capacity</span>
                <span className="text-sm font-bold text-primary">
                  {currentMembers} / {maxMembers || "—"}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
                <span>Members joined</span>
                <span className={isFull ? "text-success font-semibold" : "text-primary font-semibold"}>
                  {isFull ? "Full" : `${Math.max(0, maxMembers - currentMembers)} seats open`}
                </span>
              </div>
            </div>

            {(gradProject.abstract ?? "").trim() ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {(gradProject.abstract ?? "").trim()}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 items-center">
              {gradProject.projectType ? (
                <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md text-muted-foreground border border-border">
                  {gradProject.projectType}
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {gradProject.isOwner ? "Owner" : "Member"} · by {gradProject.ownerName ?? "—"}
              </span>
              {gradProject.isOwner ? (
                <>
                  <button type="button" onClick={onOpenEdit} className="text-xs font-semibold text-primary">
                    Edit
                  </button>
                  <button type="button" onClick={onDelete} className="text-xs font-semibold text-destructive">
                    Delete
                  </button>
                </>
              ) : (
                <button type="button" onClick={onLeave} className="text-xs text-muted-foreground">
                  Leave
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="size-3" /> Team members
              </div>
              {teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-4">
                  No members yet — invite students to join.
                </p>
              ) : (
                teamMembers.map((m) => (
                  <TeamMemberRow
                    key={m.studentId}
                    member={m}
                    canManageTeam={canManageTeam}
                    isSelf={myStudentId !== null && m.studentId === myStudentId}
                    isRemoving={removingId === m.studentId}
                    onRemove={() => onRemoveMember(m.studentId)}
                    isPromoting={false}
                    onMakeLeader={() => onMakeLeader(m.studentId)}
                  />
                ))
              )}
              {(removeMsg || leaderMsg) && (
                <p
                  className={`text-xs font-semibold ${(removeMsg ?? leaderMsg)!.ok ? "text-success" : "text-destructive"}`}
                >
                  {(removeMsg ?? leaderMsg)!.msg}
                </p>
              )}
              {gradProject.isOwner && !isFull && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/students?projectId=${gradProject.id}`)
                  }
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary-soft/40"
                >
                  <UserPlus className="size-4" /> Browse Students to Join
                </button>
              )}
              {isFull && (
                <div className="flex items-center gap-2 text-sm text-success font-semibold">
                  <CheckCircle2 className="size-4" /> Team is complete
                </div>
              )}
            </div>

            {!isFull && (
              <div style={aiPanelStyles.groupShell}>
                <AiTeammateRecommendations
                  uiState={aiStudentsUiState}
                  students={aiStudents}
                  errorMessage={aiStudentsError}
                  onRecommend={onAiRecommendStudents}
                  onInvite={onAiInviteStudent}
                  inviteLoadingId={aiCardInviteLoadingId}
                  canTrigger={canManageTeam}
                  canInvite={!!gradProject.isOwner}
                  teamFull={isFull}
                  skillChipStyle={skillChipStyle}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-muted/40 border border-border p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Supervisor
            </div>
            {gradProject.supervisor ? (
              <div className="mt-2 flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-gradient-to-br from-primary-glow to-primary grid place-items-center text-primary-foreground font-bold text-sm">
                  {initialsFromName(
                    formatSupervisorDoctorName(gradProject.supervisor.name?.trim() || ""),
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight text-foreground">
                    <ProfileLink
                      userId={
                        gradProject.supervisor.userId > 0
                          ? gradProject.supervisor.userId
                          : gradProject.supervisor.doctorId
                      }
                      role="doctor"
                    >
                      {formatSupervisorDoctorName(
                        gradProject.supervisor.name?.trim() || "—",
                      )}
                    </ProfileLink>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {(gradProject.supervisor.specialization ?? "").trim() || "—"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No supervisor assigned yet.</p>
            )}

            <div className="mt-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="size-3" /> Team · {currentMembers} member
              {currentMembers !== 1 ? "s" : ""}
            </div>
            <div className="mt-2 flex -space-x-2 flex-wrap">
              {teamMembers.slice(0, 5).map((m) => (
                <div
                  key={m.studentId}
                  title={m.name}
                  className="size-9 rounded-full bg-gradient-primary ring-2 ring-card grid place-items-center text-primary-foreground font-semibold text-xs"
                >
                  {initialsFromName(m.name, 2)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
