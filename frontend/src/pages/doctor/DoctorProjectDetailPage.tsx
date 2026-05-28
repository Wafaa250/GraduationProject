import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  getGraduationProjectById,
  getGraduationProjectMembers,
  type GraduationProjectMembersResponse,
} from "@/api/gradProjectApi";
import {
  resignDoctorSupervision,
  parseApiErrorMessage,
} from "@/api/doctorDashboardApi";
import {
  createProjectMilestone,
  deleteProjectMilestone,
  getProjectMilestones,
  updateProjectMilestoneStatus,
  type ProjectMilestone,
} from "@/api/projectMilestonesApi";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { ROUTES } from "@/routes/paths";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { toast } from "@/hooks/use-toast";

export default function DoctorProjectDetailPage() {
  const { projectId: idParam } = useParams<{ projectId: string }>();
  const projectId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [members, setMembers] = useState<GraduationProjectMembersResponse | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [milestoneBusyId, setMilestoneBusyId] = useState<number | null>(null);
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [resigning, setResigning] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(projectId)) return;
    setLoading(true);
    try {
      const [project, team] = await Promise.all([
        getGraduationProjectById(projectId),
        getGraduationProjectMembers(projectId),
      ]);
      setName(project.name ?? "");
      setDescription(project.abstract ?? null);
      setSkills(project.requiredSkills ?? []);
      setMembers(team);
      const rows = await getProjectMilestones(projectId);
      setMilestones(rows);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load project",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResign = async () => {
    if (!confirm("Resign supervision for this project?")) return;
    setResigning(true);
    try {
      await resignDoctorSupervision(projectId);
      toast({ title: "Supervision ended" });
      window.location.href = ROUTES.doctorProjects;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Resign failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setResigning(false);
    }
  };

  const handleCreateMilestone = async () => {
    const title = newMilestoneTitle.trim();
    if (!title) return;

    setCreatingMilestone(true);
    try {
      const created = await createProjectMilestone(projectId, {
        title,
        description: newMilestoneDescription.trim() || undefined,
        dueDate: newMilestoneDueDate || undefined,
      });
      setMilestones((prev) => [created, ...prev]);
      setNewMilestoneTitle("");
      setNewMilestoneDescription("");
      setNewMilestoneDueDate("");
      toast({ title: "Milestone added" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not create milestone",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setCreatingMilestone(false);
    }
  };

  const handleUpdateMilestoneStatus = async (
    milestoneId: number,
    status: ProjectMilestone["status"],
  ) => {
    setMilestoneBusyId(milestoneId);
    try {
      const updated = await updateProjectMilestoneStatus(projectId, milestoneId, status);
      setMilestones((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not update milestone",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setMilestoneBusyId(null);
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    setMilestoneBusyId(milestoneId);
    try {
      await deleteProjectMilestone(projectId, milestoneId);
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      toast({ title: "Milestone deleted" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not delete milestone",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setMilestoneBusyId(null);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-3xl mx-auto space-y-6">
        <DoctorHubPageHeader title={name} backTo={ROUTES.doctorProjects} backLabel="Projects" />
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          {description && (
            <p className="text-sm text-foreground/90">{description}</p>
          )}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium border border-border"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {members && (
            <div id="team">
              <h2 className="font-semibold text-foreground mb-2">
                Team ({members.currentMembers}/{members.totalCapacity})
              </h2>
              <ul className="space-y-2">
                {members.members.map((m) => (
                  <li
                    key={m.studentId}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center text-xs font-bold">
                      {initialsFromName(m.name)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.role} · {m.major}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div id="milestones" className="space-y-3 border-t border-border pt-4">
            <h2 className="font-semibold text-foreground">Milestones ({milestones.length})</h2>

            <div className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3">
              <input
                value={newMilestoneTitle}
                onChange={(event) => setNewMilestoneTitle(event.target.value)}
                placeholder="Milestone title"
                className="h-10 rounded-lg border border-border px-3 text-sm"
              />
              <textarea
                value={newMilestoneDescription}
                onChange={(event) => setNewMilestoneDescription(event.target.value)}
                placeholder="Description (optional)"
                className="min-h-[72px] rounded-lg border border-border px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newMilestoneDueDate}
                  onChange={(event) => setNewMilestoneDueDate(event.target.value)}
                  className="h-10 rounded-lg border border-border px-3 text-sm"
                />
                <button
                  type="button"
                  disabled={creatingMilestone || !newMilestoneTitle.trim()}
                  className="inline-flex h-10 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  onClick={() => void handleCreateMilestone()}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones added yet.</p>
            ) : (
              <ul className="space-y-2">
                {milestones.map((milestone) => (
                  <li key={milestone.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{milestone.title}</p>
                        {milestone.description ? (
                          <p className="mt-0.5 text-sm text-muted-foreground">{milestone.description}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : "Not set"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={milestone.status}
                          disabled={milestoneBusyId === milestone.id}
                          onChange={(event) =>
                            void handleUpdateMilestoneStatus(
                              milestone.id,
                              event.target.value as ProjectMilestone["status"],
                            )
                          }
                          className="h-8 rounded-md border border-border px-2 text-xs"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <button
                          type="button"
                          disabled={milestoneBusyId === milestone.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-danger/30 text-danger disabled:opacity-50"
                          onClick={() => void handleDeleteMilestone(milestone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            disabled={resigning}
            className="rounded-lg border border-danger/30 text-danger px-4 py-2 text-sm font-semibold hover:bg-danger/10 disabled:opacity-50"
            onClick={() => void handleResign()}
          >
            Resign supervision
          </button>
        </div>
      </div>
    </main>
  );
}
