import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  Code2,
  ExternalLink,
  Github,
  GraduationCap,
  Layers,
  Linkedin,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentDirectoryProfile } from "@/api/studentDirectoryApi";
import type { GradProject } from "@/api/gradProjectApi";
import type { DoctorStudentCourseTeam } from "@/hooks/useDoctorStudentProfileExtras";
import { doctorCourseProjectPath } from "@/routes/paths";
import { projectTypeLabel } from "@/api/gradProjectApi";
import { initialsFromName } from "@/lib/doctorHubMappers";

type DoctorStudentProfileViewProps = {
  student: StudentDirectoryProfile;
  graduationProjects: GradProject[];
  courseTeams: DoctorStudentCourseTeam[];
  enrollmentCount: number;
  extrasLoading?: boolean;
  onMessage?: () => void;
  messaging?: boolean;
};

function photoSrc(base64: string | null | undefined): string | null {
  const photo = base64?.trim();
  if (!photo) return null;
  return photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`;
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function displayText(value: string | null | undefined, fallback = "—") {
  const v = value?.trim();
  return v || fallback;
}

function BadgeList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Not provided yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="doctor-student-profile__badge">
          {item}
        </span>
      ))}
    </div>
  );
}

function ProfileSection({
  icon: Icon,
  title,
  subtitle,
  children,
  wide,
}: {
  icon: typeof BookOpen;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      className={`doctor-student-profile__section${wide ? " doctor-student-profile__grid--wide" : ""}`}
    >
      <div className="doctor-student-profile__section-head">
        <div className="doctor-student-profile__section-icon">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="doctor-student-profile__section-title">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function DoctorStudentProfileView({
  student,
  graduationProjects,
  courseTeams,
  enrollmentCount,
  extrasLoading,
  onMessage,
  messaging = false,
}: DoctorStudentProfileViewProps) {
  const avatar = photoSrc(student.profilePictureBase64);
  const technicalSkills = student.technicalSkills ?? [];
  const roles = student.roles ?? [];
  const tools = student.tools ?? [];

  const links = [
    { key: "github", label: "GitHub", icon: Github, href: student.github },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin, href: student.linkedin },
    { key: "portfolio", label: "Portfolio", icon: LinkIcon, href: student.portfolio },
  ].filter((l) => l.href?.trim());

  return (
    <div className="doctor-student-profile space-y-6">
      <header className="doctor-student-profile__hero">
        <div className="doctor-student-profile__hero-inner">
          <div className="flex shrink-0">
            {avatar ? (
              <img src={avatar} alt="" className="doctor-student-profile__avatar" />
            ) : (
              <div className="doctor-student-profile__avatar-fallback">
                {initialsFromName(student.name)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {student.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {student.email}
            </p>
            {onMessage ? (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                disabled={messaging}
                onClick={onMessage}
              >
                <MessageCircle className="h-4 w-4" />
                {messaging ? "Opening…" : "Message student"}
              </Button>
            ) : null}
            <div className="doctor-student-profile__meta">
              {student.major ? (
                <span className="doctor-student-profile__meta-pill">
                  <GraduationCap className="h-3 w-3" />
                  {student.major}
                </span>
              ) : null}
              {student.faculty ? (
                <span className="doctor-student-profile__meta-pill">{student.faculty}</span>
              ) : null}
              {student.academicYear ? (
                <span className="doctor-student-profile__meta-pill">{student.academicYear}</span>
              ) : null}
              {student.university ? (
                <span className="doctor-student-profile__meta-pill">{student.university}</span>
              ) : null}
            </div>
            <div className="doctor-student-profile__stats">
              <div className="doctor-student-profile__stat">
                <div className="doctor-student-profile__stat-value">{technicalSkills.length}</div>
                <div className="doctor-student-profile__stat-label">Technical skills</div>
              </div>
              <div className="doctor-student-profile__stat">
                <div className="doctor-student-profile__stat-value">{roles.length}</div>
                <div className="doctor-student-profile__stat-label">Roles</div>
              </div>
              <div className="doctor-student-profile__stat">
                <div className="doctor-student-profile__stat-value">{tools.length}</div>
                <div className="doctor-student-profile__stat-label">Tools</div>
              </div>
              <div className="doctor-student-profile__stat">
                <div className="doctor-student-profile__stat-value">
                  {extrasLoading ? "…" : enrollmentCount}
                </div>
                <div className="doctor-student-profile__stat-label">Course enrollments</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="doctor-student-profile__grid">
        <ProfileSection icon={BookOpen} title="About" subtitle="Student introduction">
          <p className="text-sm leading-relaxed text-foreground">
            {displayText(student.bio, "This student has not added a bio yet.")}
          </p>
        </ProfileSection>

        <ProfileSection icon={Code2} title="Technical skills">
          <BadgeList items={technicalSkills} />
        </ProfileSection>

        <ProfileSection icon={Users} title="Roles">
          <BadgeList items={roles} />
        </ProfileSection>

        <ProfileSection icon={Wrench} title="Tools & technologies">
          <BadgeList items={tools} />
        </ProfileSection>

        <ProfileSection icon={GraduationCap} title="Academic information">
          <div className="space-y-0">
            <InfoRow label="Student ID" value={displayText(student.studentId)} />
            <InfoRow label="Faculty" value={displayText(student.faculty)} />
            <InfoRow label="Major" value={displayText(student.major)} />
            <InfoRow label="Academic year" value={displayText(student.academicYear)} />
            <InfoRow label="University" value={displayText(student.university)} />
            {student.gpa != null ? (
              <InfoRow label="GPA" value={`${student.gpa} / 4.0`} />
            ) : null}
          </div>
        </ProfileSection>

        <ProfileSection icon={LinkIcon} title="Professional links">
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">No professional links added.</p>
          ) : (
            <ul className="space-y-2">
              {links.map(({ key, label, icon: Icon, href }) => (
                <li key={key}>
                  <a
                    href={normalizeUrl(href!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doctor-student-profile__link"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </ProfileSection>

        {(graduationProjects.length > 0 || extrasLoading) && (
          <ProfileSection
            icon={Briefcase}
            title="Graduation project"
            subtitle="Final-year project on SkillSwap"
            wide
          >
            {extrasLoading && graduationProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading project details…</p>
            ) : (
              <div className="space-y-3">
                {graduationProjects.map((project) => (
                  <article key={project.id} className="doctor-student-profile__gp-card">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      <span className="doctor-student-profile__badge">
                        {project.projectTypeLabel?.trim() ||
                          projectTypeLabel(
                            project.projectType,
                            project.ownerFaculty,
                            project.ownerMajor,
                          )}
                      </span>
                    </div>
                    {project.abstract?.trim() ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {project.abstract}
                      </p>
                    ) : null}
                    {project.supervisor?.name ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Supervisor:{" "}
                        <span className="font-medium text-foreground">{project.supervisor.name}</span>
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </ProfileSection>
        )}

        <ProfileSection
          icon={Layers}
          title="Current course teams"
          subtitle="Teams across your courses"
          wide
        >
          {extrasLoading && courseTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading team memberships…</p>
          ) : courseTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This student is not on a course project team in your courses yet.
            </p>
          ) : (
            <div>
              {courseTeams.map((team) => (
                <div key={`${team.teamId}-${team.projectId}`} className="doctor-student-profile__team-row">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{team.projectTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.courseName} ({team.courseCode}) · {team.teamLabel}
                    </p>
                  </div>
                  <Link
                    to={doctorCourseProjectPath(team.courseId, team.sectionId, team.projectId)}
                    className="text-xs font-semibold text-primary hover:underline shrink-0"
                  >
                    View project
                  </Link>
                </div>
              ))}
            </div>
          )}
        </ProfileSection>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="doctor-student-profile__info-row">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
