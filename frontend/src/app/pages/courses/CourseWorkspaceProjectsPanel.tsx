import { useNavigate } from "react-router-dom";
import { Bot, FolderKanban, PlusCircle, Sparkles, Users } from "lucide-react";
import type { DoctorCourseProject } from "../../../api/doctorCoursesApi";
import { DoctorHubEmptyState } from "../../components/doctor/hub/DoctorHubEmptyState";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import type { NewWorkspaceProjectPayload } from "./courseProjectTypes";
import { doctorProjectSectionDisplayLabel, parseBackendCourseId } from "./courseProjectUtils";

export type WorkspaceProjectRow = NewWorkspaceProjectPayload & { id: string };

type TeamMember = { id: number; name: string; role: string };
type TeamMessage = { id: number; sender: string; text: string };

type Props = {
  courseId: string | undefined;
  isDoctor: boolean;
  apiProjects: DoctorCourseProject[];
  localProjects: WorkspaceProjectRow[];
  projectTeamCounts: Record<number, number>;
  openedTeamProjectId: number | null;
  onOpenedTeamProjectIdChange: (id: number | null) => void;
  teamMembers: TeamMember[];
  teamMessages: TeamMessage[];
  teamChatInput: string;
  onTeamChatInputChange: (value: string) => void;
  onSendTeamMessage: () => void;
  onCreateProject: () => void;
};

export function CourseWorkspaceProjectsPanel({
  courseId,
  isDoctor,
  apiProjects,
  localProjects,
  projectTeamCounts,
  openedTeamProjectId,
  onOpenedTeamProjectIdChange,
  teamMembers,
  teamMessages,
  teamChatInput,
  onTeamChatInputChange,
  onSendTeamMessage,
  onCreateProject,
}: Props) {
  const navigate = useNavigate();
  const isReal = parseBackendCourseId(courseId) != null;
  const displayProjects = isReal ? apiProjects : localProjects;

  const goToTeams = (projectId: number | string, projectName: string, sectionLabel?: string) => {
    if (!courseId) return;
    navigate(`/courses/${courseId}/projects/${projectId}/teams`, {
      state: { projectName, sectionName: sectionLabel },
    });
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button type="button" onClick={onCreateProject}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create project
        </Button>
      </div>

      {displayProjects.length === 0 ? (
        <DoctorHubEmptyState
          icon={FolderKanban}
          title="No course projects"
          description="Create a project to define title, scope, section targeting, and team formation mode."
          action={
            <Button type="button" onClick={onCreateProject}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create project
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {isReal
            ? apiProjects.map((project) => {
                const isDoctorAssigned = isDoctor && project.aiMode === "doctor";
                const sectionLabel = doctorProjectSectionDisplayLabel(project);
                const teamCount = projectTeamCounts[project.id];

                return (
                  <Card
                    key={project.id}
                    className={
                      isDoctorAssigned
                        ? "hover:border-primary/40 transition-colors cursor-pointer"
                        : "transition-colors"
                    }
                    onClick={() => {
                      if (isDoctorAssigned) {
                        goToTeams(project.id, project.title, sectionLabel);
                      }
                    }}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground leading-snug">
                            {project.title}
                          </div>
                          {project.description ? (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 mb-0">
                              {project.description}
                            </p>
                          ) : null}
                        </div>
                        <AiModeBadge mode={project.aiMode} />
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="m-0">
                          <span className="font-medium text-foreground">Section:</span>{" "}
                          {sectionLabel}
                        </p>
                        <p className="m-0">
                          <span className="font-medium text-foreground">Team size:</span>{" "}
                          {project.teamSize}
                        </p>
                        <p className="m-0">
                          <span className="font-medium text-foreground">Teams:</span>{" "}
                          {teamCount ?? "—"}
                        </p>
                      </div>
                      <div className="flex justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        {isDoctor ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => goToTeams(project.id, project.title, sectionLabel)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Assign teams
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onOpenedTeamProjectIdChange(
                                openedTeamProjectId === project.id ? null : project.id,
                              )
                            }
                          >
                            View my team
                          </Button>
                        )}
                      </div>
                      {!isDoctor ? (
                        <StudentTeamPreview
                          open={openedTeamProjectId === project.id}
                          teamMembers={teamMembers}
                          teamMessages={teamMessages}
                          teamChatInput={teamChatInput}
                          onTeamChatInputChange={onTeamChatInputChange}
                          onSendTeamMessage={onSendTeamMessage}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })
            : localProjects.map((p) => (
                <Card key={p.id} className="transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <div className="font-semibold text-foreground">{p.title}</div>
                    <p className="text-xs text-muted-foreground m-0">
                      <span className="font-medium text-foreground">Section:</span> {p.sectionLabel}
                    </p>
                    <p className="text-xs text-muted-foreground m-0">
                      <span className="font-medium text-foreground">Team size:</span> {p.teamSize}
                    </p>
                    {p.abstract ? (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-0">{p.abstract}</p>
                    ) : null}
                    <AiModeBadge mode={p.aiMode} />
                  </CardContent>
                </Card>
              ))}
        </div>
      )}
    </>
  );
}

function AiModeBadge({ mode }: { mode: "doctor" | "student" }) {
  if (mode === "doctor") {
    return (
      <Badge className="shrink-0 gap-1">
        <Bot className="h-3 w-3" />
        Doctor assigns
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="shrink-0 gap-1">
      <Sparkles className="h-3 w-3" />
      Student selects
    </Badge>
  );
}

function StudentTeamPreview({
  open,
  teamMembers,
  teamMessages,
  teamChatInput,
  onTeamChatInputChange,
  onSendTeamMessage,
}: {
  open: boolean;
  teamMembers: TeamMember[];
  teamMessages: TeamMessage[];
  teamChatInput: string;
  onTeamChatInputChange: (value: string) => void;
  onSendTeamMessage: () => void;
}) {
  return (
    <div
      className="overflow-hidden transition-all duration-250"
      style={{
        maxHeight: open ? 420 : 0,
        opacity: open ? 1 : 0,
      }}
    >
      <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {member.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium m-0">{member.name}</p>
                <p className="text-xs text-muted-foreground m-0">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 space-y-2">
          <div className="max-h-[120px] overflow-y-auto flex flex-col gap-1.5">
            {teamMessages.map((m) => (
              <div
                key={m.id}
                className={`text-xs rounded-lg px-2.5 py-1.5 max-w-[85%] ${
                  m.sender === "You"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted text-foreground"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={teamChatInput}
              onChange={(e) => onTeamChatInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSendTeamMessage();
                }
              }}
              placeholder="Type a message…"
              className="h-9 rounded-full text-xs"
            />
            <Button type="button" size="sm" className="rounded-full h-9 w-9 p-0" onClick={onSendTeamMessage}>
              ➤
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
