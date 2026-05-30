import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Hash,
  Calendar,
  GraduationCap,
  FileText,
  Settings2,
  Sparkles,
  Users,
  FolderKanban,
  MessagesSquare,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { createCourse } from "@/api/doctorCoursesApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { WorkspaceCard } from "@/components/doctor/create-course/WorkspaceCard";
import { FormField, inputClass } from "@/components/doctor/create-course/FormField";
import { AcademicYearPicker } from "@/components/doctor/create-course/AcademicYearPicker";
import { PremiumToggle } from "@/components/doctor/create-course/PremiumToggle";
import { toast } from "@/hooks/use-toast";
import { doctorCoursePath, ROUTES } from "@/routes/paths";
import { formatAcademicYear } from "@/lib/academicYear";
import { cn } from "@/lib/utils";
import "@/styles/doctor-create-course.css";

const semesters = ["Fall", "Spring", "Summer"];

const toggleOptions = [
  {
    key: "projects",
    icon: FolderKanban,
    title: "Allow Course Projects",
    description:
      "Enable structured project workspaces so students can build, submit, and iterate together.",
  },
  {
    key: "teams",
    icon: Users,
    title: "Allow Team Formation",
    description:
      "Let students form teams with shared goals, roles, and collaborative milestones.",
  },
  {
    key: "ai",
    icon: Sparkles,
    title: "Allow AI Team Suggestions",
    description:
      "Use AI to match students by skills, interests, and availability for stronger teams.",
  },
  {
    key: "collab",
    icon: MessagesSquare,
    title: "Allow Student Collaboration",
    description:
      "Open discussions, shared notes, and peer feedback inside the course workspace.",
  },
] as const;

type ToggleKey = (typeof toggleOptions)[number]["key"];

export default function DoctorCreateCoursePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("");
  const [startYear, setStartYear] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<Record<ToggleKey, boolean>>({
    projects: true,
    teams: true,
    ai: true,
    collab: true,
  });

  const enabledCount = Object.values(config).filter(Boolean).length;
  const academicYear = startYear != null ? formatAcademicYear(startYear) : "";

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Course name is required", variant: "destructive" });
      return;
    }
    if (!code.trim()) {
      toast({ title: "Course code is required", variant: "destructive" });
      return;
    }
    if (!semester) {
      toast({ title: "Select a semester", variant: "destructive" });
      return;
    }
    if (startYear == null) {
      toast({ title: "Select a start year", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const defaultTeamFormationStrategy =
        config.ai && config.teams ? ("doctor" as const) : ("student" as const);
      const created = await createCourse({
        name: name.trim(),
        code: code.trim(),
        semester,
        academicYear,
        description: description.trim() || undefined,
        allowCourseProjects: config.projects,
        allowTeamFormation: config.teams,
        allowAiTeamSuggestions: config.ai,
        allowStudentCollaboration: config.collab,
        defaultTeamFormationStrategy,
      });
      toast({ title: "Course created", description: `${created.name} is ready to manage.` });
      navigate(doctorCoursePath(created.courseId));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not create course",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="doctor-create-course flex flex-col min-h-full bg-background text-foreground font-sans">
      <div className="flex-1">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-8 pb-32">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between mb-8">
            <div className="max-w-2xl">
              <Link
                to={ROUTES.doctorCourses}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 no-underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Courses
              </Link>
              <h1 className="font-display text-[30px] lg:text-[34px] font-semibold tracking-tight text-foreground leading-[1.15] text-balance">
                Create Course
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                Create a new course workspace where students, projects, teams, and course
                activities will be managed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6">
            <div className="space-y-6 min-w-0">
              <WorkspaceCard
                icon={<BookOpen className="h-5 w-5" />}
                title="Course Information"
                description="The essentials that define this course inside your workspace."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    label="Course Name"
                    htmlFor="course-name"
                    hint="Use the full official name of the course."
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                    className="md:col-span-2"
                  >
                    <input
                      id="course-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Advanced Software Engineering"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField
                    label="Course Code"
                    htmlFor="course-code"
                    hint="Official faculty identifier."
                    icon={<Hash className="h-3.5 w-3.5" />}
                  >
                    <input
                      id="course-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="CSE-401"
                      className={cn(inputClass, "font-mono tracking-wide")}
                    />
                  </FormField>

                  <FormField
                    label="Semester"
                    htmlFor="semester"
                    icon={<Calendar className="h-3.5 w-3.5" />}
                  >
                    <div className="flex gap-1.5 p-1 rounded-xl border border-border bg-surface-muted h-11">
                      {semesters.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSemester(s)}
                          className={cn(
                            "flex-1 rounded-lg text-[13px] font-medium transition-all",
                            semester === s
                              ? "bg-card text-foreground shadow-elev-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </FormField>

                  <FormField
                    label="Academic Year"
                    htmlFor="academic-year-start"
                    hint="Choose the starting year — the full academic year is generated automatically."
                    icon={<GraduationCap className="h-3.5 w-3.5" />}
                    className="md:col-span-2"
                  >
                    <AcademicYearPicker
                      id="academic-year-start"
                      value={startYear}
                      onChange={setStartYear}
                    />
                  </FormField>

                  <FormField
                    label="Description"
                    htmlFor="desc"
                    hint="Briefly describe the course goals, learning outcomes, and collaborative spirit."
                    icon={<FileText className="h-3.5 w-3.5" />}
                    className="md:col-span-2"
                  >
                    <div className="rounded-xl border border-border bg-surface focus-within:ring-4 focus-within:ring-ring/15 focus-within:border-ring transition-all overflow-hidden">
                      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-surface-muted/50">
                        {["B", "I", "U", "•", "1."].map((t, i) => (
                          <button
                            key={i}
                            type="button"
                            className="h-7 w-7 rounded-md text-[12px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          {description.length}/600
                        </span>
                      </div>
                      <textarea
                        id="desc"
                        rows={5}
                        maxLength={600}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write a short, inspiring description of what students will explore and build in this course…"
                        className="w-full px-3.5 py-3 text-[14px] leading-relaxed bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground/70"
                      />
                    </div>
                  </FormField>
                </div>
              </WorkspaceCard>

              <WorkspaceCard
                icon={<Settings2 className="h-5 w-5" />}
                title="Course Configuration"
                description="Shape the collaborative behavior of this workspace."
                badge={`${enabledCount}/4 enabled`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {toggleOptions.map((opt) => {
                    const active = config[opt.key];
                    return (
                      <div
                        key={opt.key}
                        className={cn(
                          "group rounded-xl border p-4 transition-all duration-300 cursor-pointer",
                          active
                            ? "border-primary/30 bg-gradient-subtle shadow-elev-sm"
                            : "border-border bg-surface hover:border-ring/30",
                        )}
                        onClick={() => setConfig((c) => ({ ...c, [opt.key]: !c[opt.key] }))}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "grid place-items-center h-9 w-9 rounded-lg shrink-0 transition-colors",
                              active
                                ? "bg-gradient-primary text-primary-foreground shadow-primary"
                                : "bg-secondary text-muted-foreground",
                            )}
                          >
                            <opt.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-[14px] font-semibold text-foreground leading-snug">
                                {opt.title}
                              </div>
                              <PremiumToggle
                                checked={active}
                                onChange={(v) => setConfig((c) => ({ ...c, [opt.key]: v }))}
                              />
                            </div>
                            <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">
                              {opt.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </WorkspaceCard>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
              <section className="rounded-2xl border border-border bg-card shadow-elev-md overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-display text-[15px] font-semibold text-foreground">
                    Course Summary
                  </h3>
                </div>

                <div className="p-5">
                  <div className="rounded-2xl border border-border bg-gradient-surface p-5 space-y-4">
                    <SummaryField
                      label="Course Name"
                      value={name}
                      placeholder="Untitled course"
                    />
                    <SummaryField
                      label="Course Code"
                      value={code}
                      placeholder="COURSE-CODE"
                      mono
                    />
                    <SummaryField
                      label="Semester"
                      value={semester}
                      placeholder="Not selected"
                    />
                    <SummaryField
                      label="Academic Year"
                      value={academicYear}
                      placeholder="Not selected"
                    />
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-3.5 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate(ROUTES.doctorCourses)}
            className="h-10 px-4 rounded-xl text-[13.5px] font-semibold text-foreground bg-surface border border-border hover:bg-secondary transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleCreate()}
            className="group inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13.5px] font-semibold text-primary-foreground bg-gradient-primary shadow-primary hover:shadow-elev-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Creating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Create Course
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryField({
  label,
  value,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  placeholder: string;
  mono?: boolean;
}) {
  const trimmed = value.trim();
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-[14px] font-semibold leading-snug",
          mono && "font-mono text-[13px] tracking-wide",
          trimmed ? "text-foreground" : "text-muted-foreground/70",
        )}
      >
        {trimmed || placeholder}
      </p>
    </div>
  );
}
