import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RotateCw, Sparkles, Users } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  generateDoctorProjectTeams,
  getDoctorCourseProjects,
  getDoctorProjectTeams,
  openCourseTeamConversation,
  type DoctorCourseProject,
  type DoctorProjectTeam,
} from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";
import { ProjectTeamCard } from "../../components/courses/ProjectTeamCard";
import { DoctorHubEmptyState } from "../../components/doctor/hub/DoctorHubEmptyState";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorSubpageLayout } from "../../components/doctor/hub/DoctorSubpageLayout";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { sectionLabelFromProject } from "./courseProjectUtils";

type TeamsLocationState = {
  projectName?: string;
  projectId?: number;
  sectionName?: string;
  courseId?: number;
};

export default function ProjectTeamsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId, projectId } = useParams<{ courseId: string; projectId: string }>();
  const { showToast } = useToast();

  const st = location.state as TeamsLocationState | null;

  const projectName = useMemo(() => {
    const n = st?.projectName?.trim();
    return n && n.length > 0 ? n : "Project";
  }, [st]);

  const backendProjectId = useMemo(() => {
    if (projectId && /^\d+$/.test(projectId)) return Number(projectId);
    if (st?.projectId) return st.projectId;
    return null;
  }, [projectId, st]);

  const backendCourseId = useMemo(() => {
    if (courseId && /^\d+$/.test(courseId)) return Number(courseId);
    const fromState = st?.courseId;
    if (typeof fromState === "number" && Number.isFinite(fromState) && fromState > 0) return fromState;
    return null;
  }, [courseId, st]);

  const backHref =
    courseId != null ? `/courses/${courseId}?tab=projects` : "/doctor-dashboard?section=courses";

  const [teams, setTeams] = useState<DoctorProjectTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<number | null>(null);
  const [projectMeta, setProjectMeta] = useState<{
    title: string;
    sectionLabel: string;
    aiMode: "doctor" | "student";
  } | null>(null);
  const [openingChatTeamId, setOpeningChatTeamId] = useState<number | null>(null);

  const fetchTeams = useCallback(async () => {
    if (backendCourseId == null || backendProjectId == null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateDoctorProjectTeams(backendCourseId, backendProjectId);
      setTeams(data.teams);
      setTeamSize(data.teamSize);
      showToast(`Generated ${data.teamCount} team${data.teamCount === 1 ? "" : "s"}`, "success");
    } catch (err) {
      const msg = parseApiErrorMessage(err);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [backendCourseId, backendProjectId, showToast]);

  useEffect(() => {
    if (backendCourseId == null || backendProjectId == null) {
      setTeams([]);
      setTeamSize(null);
      setProjectMeta(null);
      return;
    }

    let cancelled = false;
    setTeams([]);
    setTeamSize(null);
    setProjectMeta(null);
    setError(null);
    setLoading(true);

    void (async () => {
      try {
        const res = await getDoctorProjectTeams(backendCourseId, backendProjectId);
        if (cancelled) return;

        let meta: DoctorCourseProject | undefined;
        try {
          const projects = await getDoctorCourseProjects(backendCourseId);
          if (!cancelled) {
            meta = projects.find((p) => p.id === backendProjectId);
            if (meta) {
              setProjectMeta({
                title: meta.title.trim() || "Project",
                sectionLabel: sectionLabelFromProject(meta),
                aiMode: meta.aiMode,
              });
            }
          }
        } catch {
          /* title/section from navigation state */
        }

        setTeams(res.teams);
        setTeamSize(res.teamSize);

        const hasSavedTeams = (res.teams?.length ?? 0) > 0 || (res.teamCount ?? 0) > 0;
        if (hasSavedTeams) return;

        if (!meta || meta.aiMode !== "doctor") return;

        const gen = await generateDoctorProjectTeams(backendCourseId, backendProjectId);
        if (cancelled) return;
        setTeams(gen.teams);
        setTeamSize(gen.teamSize);
      } catch (err) {
        if (cancelled) return;
        const msg = parseApiErrorMessage(err);
        setError(msg);
        showToast(msg, "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [backendCourseId, backendProjectId, showToast]);

  const openTeamChat = useCallback(
    async (teamId: number) => {
      setOpeningChatTeamId(teamId);
      try {
        const { conversationId } = await openCourseTeamConversation(teamId);
        navigate("/messages", { state: { conversationId } });
      } catch (err) {
        showToast(parseApiErrorMessage(err), "error");
      } finally {
        setOpeningChatTeamId(null);
      }
    },
    [navigate, showToast],
  );

  const handleManageTeam = (team: DoctorProjectTeam) => {
    if (backendCourseId == null || backendProjectId == null) return;
    navigate(`/doctor/projects/${backendProjectId}/teams/${team.teamIndex}`, {
      state: {
        courseId: backendCourseId,
        projectName: projectMeta?.title ?? projectName,
        teamIndex: team.teamIndex,
      },
    });
  };

  const sectionDisplay =
    projectMeta?.sectionLabel?.trim() ||
    st?.sectionName?.trim() ||
    "—";

  return (
    <DoctorSubpageLayout wide backTo={backHref} backLabel="Back to projects">
      <DoctorHubPageHeader
        eyebrow="Course workspace"
        title="Project teams"
        description={projectMeta?.title?.trim() || projectName}
        actions={
          projectMeta?.aiMode === "doctor" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || backendProjectId == null}
              onClick={() => void fetchTeams()}
              className="gap-2"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Regenerate teams
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="outline">Section: {sectionDisplay}</Badge>
        <Badge variant="outline">Team size: {teamSize ?? "—"}</Badge>
        <Badge variant="outline">
          Teams: {teams.length > 0 ? teams.length : "—"}
        </Badge>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm mt-3">Loading teams…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && backendProjectId == null ? (
        <Alert>
          <AlertDescription>
            Project was not saved yet — create the project first, then return here.
          </AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && teams.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-3">
          {teams.map((team) => (
            <ProjectTeamCard
              key={`${backendProjectId}-${team.teamId ?? team.teamIndex}`}
              team={team}
              aiMode={projectMeta?.aiMode ?? null}
              openingChatTeamId={openingChatTeamId}
              onOpenChat={(id) => void openTeamChat(id)}
              onManageTeam={handleManageTeam}
            />
          ))}
        </div>
      ) : null}

      {!loading && !error && teams.length === 0 && backendProjectId != null ? (
        <DoctorHubEmptyState
          icon={projectMeta?.aiMode === "student" ? Users : Sparkles}
          title="No teams yet"
          description={
            projectMeta?.aiMode === "student"
              ? "Students form teams by invitation for this project."
              : "Click Regenerate teams to create balanced teams from enrolled students."
          }
          action={
            projectMeta?.aiMode === "doctor" ? (
              <Button type="button" onClick={() => void fetchTeams()} disabled={loading}>
                <RotateCw className="h-4 w-4 mr-2" />
                Regenerate teams
              </Button>
            ) : undefined
          }
        />
      ) : null}
    </DoctorSubpageLayout>
  );
}
