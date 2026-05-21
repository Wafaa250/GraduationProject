import { useEffect, useRef } from "react";
import {
  FolderKanban,
  Inbox,
  Layers,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { CourseDetails, CourseStudent } from "../../../../api/studentCoursesApi";
import ProfileLink from "../../../components/common/ProfileLink";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../components/ui/utils";
import {
  asText,
  formatSectionSchedule,
  getCourseStudentProfileId,
  getStudentProfileIdFromUser,
  isDoctorAssignedProject,
  type ChatMessage,
  type CourseBundle,
  type CourseProject,
  type CourseTab,
} from "./studentCourseHelpers";

function CourseTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-1 pb-2.5 pt-2 text-sm font-semibold transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function StudentAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StudentRosterList({ students }: { students: CourseStudent[] }) {
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <Users className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm font-semibold text-muted-foreground">No students found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {students.map((student, index) => {
        const studentName = asText(student.name ?? student.Name, "Student");
        const emailRaw = student.email ?? student.Email;
        const email =
          typeof emailRaw === "string" && emailRaw.trim() ? emailRaw.trim() : null;
        return (
          <div key={`${studentName}-${index}`} className="flex items-center gap-3 py-3">
            <StudentAvatar name={studentName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                <ProfileLink userId={student.userId ?? student.UserId} role="student">
                  {studentName}
                </ProfileLink>
              </p>
              {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type StudentCourseDetailPanelProps = {
  selectedCourseId: number;
  bundle: CourseBundle;
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
  mySection: CourseDetails["sections"][number] | null;
  mySectionStudents: CourseStudent[];
  courseStudents: CourseStudent[];
  mySectionProjects: CourseProject[];
  detailsLoading: boolean;
  user: unknown;
  authUserId: number | null;
  currentSectionId: number | null;
  messages: ChatMessage[];
  chatLoading: boolean;
  chatError: string | null;
  chatSending: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onRefreshChat: () => void;
  showMembers: boolean;
  onToggleMembers: () => void;
  onCloseMembers: () => void;
};

export function StudentCourseDetailPanel({
  selectedCourseId,
  bundle,
  activeTab,
  onTabChange,
  mySection,
  mySectionStudents,
  courseStudents,
  mySectionProjects,
  detailsLoading,
  user,
  authUserId,
  currentSectionId,
  messages,
  chatLoading,
  chatError,
  chatSending,
  input,
  onInputChange,
  onSendMessage,
  onRefreshChat,
  showMembers,
  onToggleMembers,
  onCloseMembers,
}: StudentCourseDetailPanelProps) {
  const navigate = useNavigate();
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-4">
      <article className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-soft">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Layers className="h-4 w-4 text-primary" />
          {asText(bundle.detail.name)}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Code: <span className="font-semibold text-foreground">{asText(bundle.detail.code)}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {bundle.detail.semester ? (
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              Semester: {bundle.detail.semester}
            </span>
          ) : null}
          {bundle.detail.doctorName ? (
            <span className="inline-flex rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Doctor:{" "}
              <ProfileLink userId={bundle.detail.doctorId} role="doctor">
                {bundle.detail.doctorName}
              </ProfileLink>
            </span>
          ) : null}
        </div>
      </article>

      <div className="flex gap-4 border-b border-border px-1">
        <CourseTabButton active={activeTab === "section"} onClick={() => onTabChange("section")}>
          My Section
        </CourseTabButton>
        <CourseTabButton active={activeTab === "chat"} onClick={() => onTabChange("chat")}>
          Chat
        </CourseTabButton>
        <CourseTabButton active={activeTab === "projects"} onClick={() => onTabChange("projects")}>
          Projects
        </CourseTabButton>
      </div>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        {activeTab === "section" ? (
          <>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Layers className="h-4 w-4 text-primary" />
              My Section
            </h3>
            {mySection ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Section info
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{asText(mySection.name)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatSectionSchedule(mySection.days, mySection.timeFrom, mySection.timeTo)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Capacity:{" "}
                    <span className="font-semibold text-foreground">{mySection.capacity}</span>
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Students in my section ({mySectionStudents.length})
                  </p>
                  <div className="mt-3">
                    <StudentRosterList students={mySectionStudents} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Section info
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You are not assigned yet, but here are course students.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Course students
                  </p>
                  <div className="mt-3">
                    <StudentRosterList students={courseStudents} />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}

        {activeTab === "chat" ? (
          <>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Chat
            </h3>
            {currentSectionId == null ? (
              <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  You need to be assigned to a section to use chat.
                </p>
              </div>
            ) : (
              <section className="mt-4 flex h-[400px] flex-col overflow-hidden rounded-xl border border-border bg-background">
                <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                      {(mySection?.name ?? "Section")
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? "")
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {mySection?.name ?? "Section Chat"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {mySectionStudents.length} members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {chatLoading ? (
                      <span className="text-[11px] text-muted-foreground">loading…</span>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onRefreshChat}
                      title="Refresh messages"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={onToggleMembers}>
                      Members
                    </Button>
                  </div>
                </div>

                <div
                  className={cn(
                    "grid min-h-0 flex-1",
                    showMembers ? "grid-cols-1 md:grid-cols-[1fr_250px]" : "grid-cols-1",
                  )}
                >
                  <div className="flex min-h-0 min-w-0 flex-col">
                    <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
                      {chatError ? (
                        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                          {chatError}
                        </p>
                      ) : null}
                      {messages.length === 0 && !chatLoading ? (
                        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                          <Inbox className="h-8 w-8 text-muted-foreground/50" />
                          <p className="mt-2 text-sm font-semibold text-muted-foreground">
                            Start chatting with your section
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const mine = msg.senderUserId === authUserId;
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex w-full items-end gap-2",
                                mine ? "justify-end" : "justify-start",
                              )}
                            >
                              {!mine ? (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                                  {(msg.senderName || "M").charAt(0).toUpperCase()}
                                </div>
                              ) : null}
                              <div
                                className={cn(
                                  "flex max-w-[60%] flex-col gap-0.5",
                                  mine ? "items-end" : "items-start",
                                )}
                              >
                                {!mine ? (
                                  <span className="px-0.5 text-[11px] font-semibold text-muted-foreground">
                                    {msg.senderName}
                                  </span>
                                ) : null}
                                <div
                                  className={cn(
                                    "rounded-2xl px-3 py-2 text-sm leading-relaxed break-words",
                                    mine
                                      ? "rounded-br-md bg-primary text-primary-foreground"
                                      : "rounded-bl-md bg-muted text-foreground",
                                  )}
                                >
                                  {msg.text}
                                </div>
                                <span className="px-0.5 text-[10px] text-muted-foreground">
                                  {new Date(msg.sentAt).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatBottomRef} />
                    </div>
                    <div className="flex items-center gap-2 border-t border-border bg-muted/20 p-2.5">
                      <Input
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            onSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="rounded-full bg-card"
                        disabled={chatSending}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="gradient"
                        className="shrink-0 rounded-full"
                        onClick={onSendMessage}
                        disabled={chatSending}
                        aria-label="Send message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {showMembers ? (
                    <aside className="flex min-h-0 flex-col border-t border-border bg-card p-2 md:border-t-0 md:border-l">
                      <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
                        <p className="text-sm font-semibold text-foreground">Section members</p>
                        <Button type="button" variant="ghost" size="sm" onClick={onCloseMembers}>
                          <X className="h-3.5 w-3.5" />
                          Close
                        </Button>
                      </div>
                      {mySectionStudents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No members in your section.</p>
                      ) : (
                        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                          {mySectionStudents.map((student, index) => {
                            const studentName = asText(student.name ?? student.Name, "Student");
                            const studentProfileId = getCourseStudentProfileId(student);
                            const isCurrentUser =
                              studentProfileId != null &&
                              studentProfileId === getStudentProfileIdFromUser(user);
                            return (
                              <div
                                key={`chat-member-${studentProfileId ?? index}`}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg px-2 py-1.5",
                                  isCurrentUser ? "bg-primary/10 ring-1 ring-primary/20" : "bg-muted/30",
                                )}
                              >
                                <StudentAvatar name={studentName} />
                                <p className="truncate text-xs font-semibold text-foreground">
                                  <ProfileLink
                                    userId={student.userId ?? student.UserId}
                                    role="student"
                                  >
                                    {studentName}
                                  </ProfileLink>
                                  {isCurrentUser ? " (You)" : ""}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </aside>
                  ) : null}
                </div>
              </section>
            )}
          </>
        ) : null}

        {activeTab === "projects" ? (
          <>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <FolderKanban className="h-4 w-4 text-primary" />
              Projects
            </h3>

            {detailsLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading projects…</p>
            ) : mySectionProjects.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-semibold text-foreground">No projects posted yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The doctor hasn&apos;t added any projects to your section.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {mySectionProjects.map((project) => {
                  const sectionName = project.applyToAllSections
                    ? "All sections"
                    : (mySection?.name ?? "My section");
                  const isDoctorAssigned = isDoctorAssignedProject(project);
                  const hasTeam = project.hasTeam === true;

                  return (
                    <div
                      key={project.id}
                      className="rounded-xl border border-border bg-background p-4 shadow-soft transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-display text-sm font-bold text-foreground">
                            {project.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Team size: {project.teamSize}
                          </p>
                          <p className="text-xs text-muted-foreground">Section: {sectionName}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold",
                              isDoctorAssigned
                                ? "border-primary/25 bg-primary/10 text-primary"
                                : "border-accent/25 bg-accent-soft text-accent",
                            )}
                          >
                            {isDoctorAssigned ? "Assigned by Doctor" : "Student Selection"}
                          </span>
                          {isDoctorAssigned || hasTeam ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="gradient"
                              onClick={() =>
                                navigate(
                                  `/student/courses/${selectedCourseId}/projects/${project.id}/team`,
                                )
                              }
                            >
                              View My Team
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="ai"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/student/courses/${selectedCourseId}/projects/${project.id}/team-choice`,
                                  { state: { projectTitle: project.title } },
                                );
                              }}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Generate Team
                            </Button>
                          )}
                        </div>
                      </div>

                      {project.description ? (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {project.description}
                        </p>
                      ) : null}

                      {project.allowCrossSectionTeams ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-lg border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Cross-section teams allowed
                          </span>
                        </div>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {project.applyToAllSections
                          ? "You can choose teammates from the whole course."
                          : "You can choose teammates from your section only."}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </article>
    </div>
  );
}
