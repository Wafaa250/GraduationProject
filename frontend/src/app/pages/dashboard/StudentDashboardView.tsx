import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "./components/DashboardSidebar";
import { DashboardTopbar } from "./components/DashboardTopbar";
import { DashboardHero } from "./components/DashboardHero";
import { DashboardStatsCards } from "./components/DashboardStatsCards";
import { DashboardTeammateRecs } from "./components/DashboardTeammateRecs";
import { DashboardMyProjectSection } from "./components/DashboardMyProjectSection";
import { DashboardSupervisorsSection } from "./components/DashboardSupervisorsSection";
import {
  DashboardActivityFeed,
  buildDashboardActivityItems,
} from "./components/DashboardActivityFeed";
import { DashboardQuickAccess } from "./components/DashboardQuickAccess";
import { DashboardOpportunities } from "./components/DashboardOpportunities";
import { DashboardCourseTeamsCard } from "./components/DashboardCourseTeamsCard";
import { formatStatValue } from "./dashboardUtils";
import { formatSupervisorDoctorName } from "./dashboardFormat";
import type { DashboardInvitation } from "./dashboardInvitationTypes";
import type { SuggestedTeammate } from "../../../api/dashboardApi";
import type { GradProject, GradProjectMember } from "../../../api/gradProjectApi";
import type { GradProjectRecommendedStudent } from "../../../api/gradProjectApi";
import type {
  AiSupervisionSnapshot,
  AiSupervisorCardRequestState,
  AiSupervisorRecommendUiState,
  EnrichedAiSupervisorRow,
} from "../../components/project/AiSupervisorRecommendations";
import type { AiRecommendationPanelUiState } from "../../components/project/AiRecommendationPanel";

export type StudentDashboardViewProps = {
  greeting: string;
  user: {
    name?: string;
    major?: string;
    faculty?: string;
    academicYear?: string;
    university?: string;
    profilePic?: string | null;
  } | null;
  heroTeammateCount: number;
  heroMatchedGp: number;
  heroBestMatch: number | null;
  heroInviteCount: number;
  teammates: SuggestedTeammate[];
  invitations: DashboardInvitation[];
  inviteLoading: number | null;
  inviteMsg: { id: number; msg: string; ok: boolean } | null;
  onInviteAction: (id: number, action: "accept" | "reject") => void;
  completeness: number;
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
  ctDashCardCoursesCount: number | null;
  ctDashCardRequestsCount: number | null;
  aiRecommendUiState: AiSupervisorRecommendUiState;
  aiRecommendItems: EnrichedAiSupervisorRow[];
  aiRecommendError: string | null;
  aiSupervisorCardRequests: Record<number, AiSupervisorCardRequestState>;
  aiSupervisionSnapshot: AiSupervisionSnapshot;
  supervisionPending: boolean;
  aiStudentsUiState: AiRecommendationPanelUiState;
  aiStudents: GradProjectRecommendedStudent[];
  aiStudentsError: string | null;
  aiCardInviteLoadingId: number | null;
  skillChipStyle: React.CSSProperties;
  messageUnread: number;
  notificationUnread: number;
  recommendedProjectsCount: number;
  onOpenSettings: () => void;
  onOpenBrowseProjects: () => void;
  onOpenFindTeammates: () => void;
  onOpenCreateGrad: () => void;
  onOpenEditGrad: () => void;
  onDeleteGrad: () => void;
  onLeaveGrad: () => void;
  onRemoveMember: (id: number) => void;
  onMakeLeader: (id: number) => void;
  onAiRecommendStudents: () => void;
  onAiInviteStudent: (id: number) => void;
  onRecommendSupervisors: () => void;
  onRequestSupervisor: (doctorId: number) => void;
  onTeammateInvite?: (profileId: number) => void;
  teammateInviteLoadingId?: number | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  globalSearchWrapRef: React.RefObject<HTMLDivElement | null>;
  topbarSearchDropdown: ReactNode;
  topbarNavActions: ReactNode;
  profileAvatar: ReactNode;
};

export function StudentDashboardView(props: StudentDashboardViewProps) {
  const navigate = useNavigate();
  const firstName = props.user?.name?.split(" ")[0] ?? "";
  const subtitle = [props.user?.major, props.user?.academicYear, props.user?.faculty, props.user?.university]
    .filter(Boolean)
    .join(" · ") || "Complete your profile to get started";

  const summaryParts: string[] = [];
  if (props.heroTeammateCount > 0) {
    summaryParts.push(
      `${props.heroTeammateCount} suggested teammate${props.heroTeammateCount === 1 ? "" : "s"}`,
    );
  }
  if (props.heroMatchedGp > 0) {
    summaryParts.push(
      `${props.heroMatchedGp} matched graduation project${props.heroMatchedGp === 1 ? "" : "s"}`,
    );
  }
  if (props.heroInviteCount > 0) {
    summaryParts.push(
      `${props.heroInviteCount} pending invitation${props.heroInviteCount === 1 ? "" : "s"}`,
    );
  }
  const summaryText =
    summaryParts.length > 0
      ? `Your AI match engine surfaced ${summaryParts.join(", ")}. Explore recommendations below or open your project workspace.`
      : "Complete your profile and skills to get personalized teammate and supervisor matches.";

  const supervisorStat =
    props.aiRecommendUiState === "success" && props.aiRecommendItems.length > 0
      ? String(props.aiRecommendItems.length)
      : "—";

  const activityItems = buildDashboardActivityItems({
    invitations: props.invitations,
    teammateCount: props.teammates.length,
    hasSupervisor: !!props.gradProject?.supervisor,
    supervisorName: props.gradProject?.supervisor
      ? formatSupervisorDoctorName(props.gradProject.supervisor.name?.trim() || "")
      : undefined,
    matchedProjectsCount: props.recommendedProjectsCount,
    inviteLoading: props.inviteLoading,
    inviteMsg: props.inviteMsg,
    onInvite: props.onInviteAction,
  });

  return (
    <div className="student-dashboard min-h-screen bg-background flex">
      <DashboardSidebar
        messageUnread={props.messageUnread}
        notificationUnread={props.notificationUnread}
        onOpenSettings={props.onOpenSettings}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <DashboardTopbar
          searchQuery={props.searchQuery}
          onSearchChange={props.onSearchChange}
          onSearchKeyDown={props.onSearchKeyDown}
          globalSearchWrapRef={props.globalSearchWrapRef}
          searchDropdown={props.topbarSearchDropdown}
          navActions={props.topbarNavActions}
          userName={props.user?.name}
          userMajor={props.user?.major}
          profileAvatar={props.profileAvatar}
        />

        <main className="flex-1 px-5 sm:px-8 lg:px-10 py-8 space-y-8 max-w-[1500px] w-full mx-auto">
          <DashboardHero
            greeting={props.greeting}
            firstName={firstName}
            subtitle={subtitle}
            summaryText={summaryText}
            profilePic={props.user?.profilePic}
            onDiscoverProjects={props.onOpenBrowseProjects}
            onFindTeammates={props.onOpenFindTeammates}
            onFindSupervisors={() => {
              document.getElementById("sd-supervisors")?.scrollIntoView({ behavior: "smooth" });
            }}
            onViewInvitations={() => navigate("/student/team-invitations")}
          />

          <DashboardStatsCards
            suggestedTeammates={formatStatValue(props.heroTeammateCount)}
            suggestedSupervisors={supervisorStat}
            pendingInvitations={String(props.heroInviteCount)}
            activeProjects={props.gradProject ? "1" : "0"}
            teammatesHelper={
              props.heroTeammateCount > 0
                ? "From your dashboard summary"
                : "Add skills to improve matches"
            }
            supervisorsHelper={
              props.aiRecommendItems.length > 0
                ? "AI-ranked for your project"
                : "Run recommendations from your project card"
            }
            invitationsHelper={
              props.invitations.length > 0
                ? `${props.invitations.length} awaiting your response`
                : "No pending invitations"
            }
          />

          <DashboardTeammateRecs
            teammates={props.teammates}
            onViewAll={() => props.onOpenFindTeammates()}
            onInvite={props.onTeammateInvite}
            inviteLoadingId={props.teammateInviteLoadingId}
            canInvite={!!props.gradProject?.isOwner && !!props.onTeammateInvite}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-8">
              <DashboardMyProjectSection
                gradLoading={props.gradLoading}
                gradProject={props.gradProject}
                teamMembers={props.teamMembers}
                currentMembers={props.currentMembers}
                isFull={props.isFull}
                myRole={props.myRole}
                myStudentId={props.myStudentId}
                removingId={props.removingId}
                promotingId={props.promotingId}
                removeMsg={props.removeMsg}
                leaderMsg={props.leaderMsg}
                onOpenCreate={props.onOpenCreateGrad}
                onOpenEdit={props.onOpenEditGrad}
                onDeleteGrad={props.onDeleteGrad}
                onLeave={props.onLeaveGrad}
                onRemoveMember={props.onRemoveMember}
                onMakeLeader={props.onMakeLeader}
                aiStudentsUiState={props.aiStudentsUiState}
                aiStudents={props.aiStudents}
                aiStudentsError={props.aiStudentsError}
                onAiRecommendStudents={props.onAiRecommendStudents}
                onAiInviteStudent={props.onAiInviteStudent}
                aiCardInviteLoadingId={props.aiCardInviteLoadingId}
                skillChipStyle={props.skillChipStyle}
              />
              <DashboardSupervisorsSection
                uiState={props.aiRecommendUiState}
                items={props.aiRecommendItems}
                errorMessage={props.aiRecommendError}
                onRecommend={props.onRecommendSupervisors}
                onRequestSupervisor={props.onRequestSupervisor}
                cardRequestByDoctor={props.aiSupervisorCardRequests}
                supervisionSnapshot={props.aiSupervisionSnapshot}
                supervisionPending={props.supervisionPending}
                canTriggerRecommend={props.myRole === "owner" || props.myRole === "leader"}
                formatDoctorName={formatSupervisorDoctorName}
                hasGradProject={!!props.gradProject}
              />
            </div>
            <div className="space-y-6">
              <DashboardActivityFeed items={activityItems} />
              <DashboardQuickAccess
                profileCompleteness={props.completeness}
                teamMemberCount={props.currentMembers}
                messageUnread={props.messageUnread}
                notificationUnread={props.notificationUnread}
                onOpenSettings={props.onOpenSettings}
                onOpenMessages={() => {
                  document.getElementById("sd-topbar-messages")?.querySelector("button")?.click();
                }}
                onOpenNotifications={() => {
                  document
                    .getElementById("sd-topbar-notifications")
                    ?.querySelector("button")
                    ?.click();
                }}
              />
              <DashboardCourseTeamsCard
                coursesCount={props.ctDashCardCoursesCount}
                requestsCount={props.ctDashCardRequestsCount}
              />
            </div>
          </div>

          <DashboardOpportunities
            matchedProjectsCount={props.recommendedProjectsCount}
            onExploreGradProjects={props.onOpenBrowseProjects}
            onExploreCourses={() => navigate("/student/courses")}
            onExploreOrganizations={() => navigate("/organizations")}
            onExploreCommunities={() => navigate("/communities")}
          />

          <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
            SkillSwap · AI-powered university collaboration platform
          </footer>
        </main>
      </div>
    </div>
  );
}
