import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, ExternalLink, FileText, Loader2, MessageSquare } from "lucide-react";
import {
  getGraduationProjectAbstractFile,
  getGraduationProjectById,
  getGraduationProjectMembers,
  resolveProjectTypeLabel,
  type GradProject,
  type GradProjectAbstractFile,
  type GraduationProjectMembersResponse,
} from "@/api/gradProjectApi";
import { getAbstractDisplayText } from "@/lib/graduationProjectAbstractDocument";
import { resignDoctorSupervision, parseApiErrorMessage } from "@/api/doctorDashboardApi";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES, doctorProjectChatPath } from "@/routes/paths";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { toast } from "@/hooks/use-toast";

export default function DoctorProjectDetailPage() {
  const { projectId: idParam } = useParams<{ projectId: string }>();
  const projectId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<GradProject | null>(null);
  const [members, setMembers] = useState<GraduationProjectMembersResponse | null>(null);
  const [abstractFile, setAbstractFile] = useState<GradProjectAbstractFile | null>(null);
  const [resigning, setResigning] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(projectId)) return;
    setLoading(true);
    try {
      const [projectData, team] = await Promise.all([
        getGraduationProjectById(projectId),
        getGraduationProjectMembers(projectId),
      ]);
      setProject(projectData);
      setMembers(team);
      setAbstractFile(await getGraduationProjectAbstractFile(projectId, projectData));
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

  if (!project) {
    return (
      <main className="flex-1 bg-gradient-mesh">
        <div className="px-5 lg:px-8 py-5 max-w-3xl mx-auto">
          <DoctorHubPageHeader title="Project not found" backTo={ROUTES.doctorProjects} backLabel="Projects" />
        </div>
      </main>
    );
  }

  const description =
    getAbstractDisplayText(project.abstract) || project.description?.trim() || null;
  const technologies = project.technologies ?? [];
  const skills = project.requiredSkills ?? [];
  const supervisorSpec = project.supervisor?.specialization?.trim();
  const supervisorDept = project.supervisor?.department?.trim();
  const supervisorSubtitle = supervisorSpec || supervisorDept || null;
  const showSupervisorDepartment = Boolean(
    supervisorDept &&
      supervisorSpec &&
      supervisorDept.toLowerCase() !== supervisorSpec.toLowerCase(),
  );

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-3xl mx-auto space-y-6">
        <DoctorHubPageHeader
          title={project.name}
          description={
            project.projectTypeLabel ??
            (project.projectType
              ? `${resolveProjectTypeLabel(project)} graduation project`
              : undefined)
          }
          backTo={ROUTES.doctorProjects}
          backLabel="Active Projects"
        />

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" className="h-9" asChild>
            <Link to={doctorProjectChatPath(projectId)}>
              <MessageSquare className="mr-1.5 h-4 w-4" />
              Team Chat
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {description ?? "No description provided."}
                </p>
              </div>

              {technologies.length > 0 ? (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Technologies
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium border border-border"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {skills.length > 0 ? (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Required skills
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-border/70 bg-background px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {project.supervisor ? (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Supervisor
                  </h2>
                  <p className="mt-2 font-medium text-foreground">{project.supervisor.name}</p>
                  {supervisorSubtitle ? (
                    <p className="text-sm text-muted-foreground">{supervisorSubtitle}</p>
                  ) : null}
                  {showSupervisorDepartment ? (
                    <p className="text-sm text-muted-foreground">{supervisorDept}</p>
                  ) : null}
                </div>
              ) : null}
            </section>
          </TabsContent>

          <TabsContent value="files" className="mt-0">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Uploaded documents
              </h2>
              {abstractFile ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-border p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <FileText className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{abstractFile.fileName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Uploaded{" "}
                      {new Date(abstractFile.uploadedAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0" asChild>
                    <a href={abstractFile.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download
                      <ExternalLink className="ml-1 h-3 w-3 opacity-60" />
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No project documents uploaded yet. Students can attach an abstract file when creating
                  the project.
                </p>
              )}
            </section>
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Team members
                {members ? ` (${members.currentMembers}/${members.totalCapacity})` : ""}
              </h2>
              {members && members.members.length > 0 ? (
                <ul className="space-y-2">
                  {members.members.map((member) => (
                    <li
                      key={member.studentId}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center text-xs font-bold">
                        {initialsFromName(member.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.role} · {member.major}
                        </p>
                        {member.email ? (
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No team members listed.</p>
              )}
            </section>
          </TabsContent>
        </Tabs>

        <div className="rounded-2xl border border-danger/20 bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground mb-3">
            End your supervision role for this project. The team will need to request a new supervisor.
          </p>
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
