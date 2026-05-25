import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  getGraduationProjectById,
  getGraduationProjectMembers,
  type GraduationProjectMembersResponse,
} from "@/api/gradProjectApi";
import {
  resignDoctorSupervision,
  parseApiErrorMessage,
} from "@/api/doctorDashboardApi";
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
