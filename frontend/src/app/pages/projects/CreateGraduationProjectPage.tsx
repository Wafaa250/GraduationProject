import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  GraduationCap,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useUser } from "../../../context/UserContext";
import { useToast } from "../../../context/ToastContext";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { getGraduationProjectsMyEnvelope } from "../../../api/dashboardApi";
import {
  abstractForApi,
  createGraduationProject,
  isEngineeringOrITFaculty,
  projectTypeForApi,
  updateGraduationProject,
  type GraduationProjectType,
  type GradProject,
} from "../../../api/gradProjectApi";
import {
  CUSTOM_SKILL_MAX_LENGTH,
  getSkillsPack,
  normalizeCustomSkill,
} from "../../../constants/studentSkillPools";
import { StudentDashboardShell } from "../dashboard/components/StudentDashboardShell";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "../../components/ui/utils";

const STEPS = [
  { id: 1, title: "Idea basics" },
  { id: 2, title: "Skills & team" },
  { id: 3, title: "Supervisor & details" },
] as const;

function parseStoredAbstract(raw: string | null | undefined): {
  projectField: string;
  problem: string;
  supervisorNotes: string;
} {
  const text = (raw ?? "").trim();
  if (!text) {
    return { projectField: "", problem: "", supervisorNotes: "" };
  }

  let body = text;
  let supervisorNotes = "";
  const supMatch = body.match(/\n\nSupervisor preferences:\s*([\s\S]+)$/i);
  if (supMatch) {
    supervisorNotes = supMatch[1].trim();
    body = body.slice(0, supMatch.index).trim();
  }

  const domainMatch = body.match(/^Domain:\s*(.+?)\n\n([\s\S]+)$/i);
  if (domainMatch) {
    return {
      projectField: domainMatch[1].trim(),
      problem: domainMatch[2].trim(),
      supervisorNotes,
    };
  }

  return { projectField: "", problem: body, supervisorNotes };
}

function buildAbstract(
  projectField: string,
  problem: string,
  supervisorNotes: string,
  needSupervisor: boolean,
): string {
  const field = projectField.trim();
  const prob = problem.trim();
  let abstract = "";
  if (field) abstract += `Domain: ${field}\n\n`;
  abstract += prob;
  if (needSupervisor && supervisorNotes.trim()) {
    abstract += `\n\nSupervisor preferences: ${supervisorNotes.trim()}`;
  }
  return abstract;
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function ProjectTypeRow({
  value,
  onChange,
}: {
  value: GraduationProjectType;
  onChange: (v: GraduationProjectType) => void;
}) {
  const options: { value: GraduationProjectType; label: string }[] = [
    { value: "GP1", label: "GP1" },
    { value: "GP2", label: "GP2" },
    { value: "GP", label: "GP" },
  ];
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-colors",
            value === opt.value
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Stepper({
  active,
  onStepClick,
}: {
  active: number;
  onStepClick: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex-1 flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => onStepClick(s.id)}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
              active >= s.id
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "bg-muted text-muted-foreground",
            )}
          >
            {s.id}
          </button>
          <p
            className={cn(
              "text-xs font-semibold truncate hidden sm:block",
              active >= s.id ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {s.title}
          </p>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-px bg-border min-w-2" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CreateGraduationProjectPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profile } = useUser();

  const [loading, setLoading] = useState(true);
  const [existingProject, setExistingProject] = useState<GradProject | null>(
    null,
  );
  const [isEdit, setIsEdit] = useState(false);

  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [projectField, setProjectField] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("5");
  const [projectType, setProjectType] = useState<GraduationProjectType>("GP");
  const [needSupervisor, setNeedSupervisor] = useState(true);
  const [supervisorNotes, setSupervisorNotes] = useState("");
  const [skillDraft, setSkillDraft] = useState("");
  const [showSkillInput, setShowSkillInput] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const globalSearchWrapRef = useRef<HTMLDivElement>(null);

  const engIt = isEngineeringOrITFaculty(profile.faculty);
  const skillsPack = useMemo(
    () => getSkillsPack(profile.faculty, profile.major),
    [profile.faculty, profile.major],
  );

  const skillPool = useMemo(() => {
    if (!skillsPack) return [];
    const merged = [
      ...skillsPack.roles,
      ...skillsPack.technicalSkills,
      ...skillsPack.tools,
    ];
    return [...new Set(merged)].sort((a, b) => a.localeCompare(b));
  }, [skillsPack]);

  const hydrateFromProject = useCallback((project: GradProject) => {
    const parsed = parseStoredAbstract(project.abstract);
    setTitle(project.name);
    setProblem(parsed.problem);
    setProjectField(parsed.projectField);
    setSupervisorNotes(parsed.supervisorNotes);
    setRequiredSkills(project.requiredSkills ?? []);
    setTeamSize(String(project.partnersCount || 5));
    setProjectType((project.projectType as GraduationProjectType) ?? "GP");
    setNeedSupervisor(!project.supervisor);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { role, project } = await getGraduationProjectsMyEnvelope();
        if (cancelled) return;
        if (project && role === "owner") {
          setExistingProject(project);
          setIsEdit(true);
          hydrateFromProject(project);
        } else if (project && role === "member") {
          setExistingProject(project);
        }
      } catch {
        /* allow create */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromProject]);

  const currentMembers = existingProject?.currentMembers ?? 1;
  const ownerName = profile.fullName?.trim() || "You";

  const toggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const addCustomSkill = () => {
    const v = normalizeCustomSkill(skillDraft);
    if (!v) return;
    setRequiredSkills((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setSkillDraft("");
    setShowSkillInput(false);
  };

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!title.trim()) return "Project title is required.";
      if (!problem.trim()) return "Problem description is required.";
      return null;
    }
    if (step === 2) {
      if (requiredSkills.length === 0) return "Select at least one required skill.";
      const size = parseInt(teamSize, 10);
      if (!teamSize || Number.isNaN(size) || size < 1 || size > 10) {
        return "Team size must be between 1 and 10.";
      }
      return null;
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(activeStep);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setActiveStep((s) => Math.min(3, s + 1));
  };

  const handleSubmit = async () => {
    for (let s = 1; s <= 2; s += 1) {
      const err = validateStep(s);
      if (err) {
        setFormError(err);
        setActiveStep(s);
        return;
      }
    }

    const size = parseInt(teamSize, 10);
    const abstractPayload = abstractForApi(
      buildAbstract(projectField, problem, supervisorNotes, needSupervisor),
    );
    const apiProjectType = projectTypeForApi(profile.faculty, projectType);

    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && existingProject) {
        await updateGraduationProject(existingProject.id, {
          name: title.trim(),
          abstract: abstractPayload,
          projectType: apiProjectType,
          requiredSkills,
          partnersCount: size,
        });
        showToast("Project updated.", "success");
      } else {
        await createGraduationProject({
          name: title.trim(),
          abstract: abstractPayload,
          projectType: apiProjectType,
          requiredSkills,
          partnersCount: size,
        });
        showToast(
          "Project created. Explore AI matches on your dashboard.",
          "success",
        );
      }
      navigate("/dashboard#supervisor-recommendations", { replace: true });
    } catch (err) {
      setFormError(parseApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const shellProps = {
    userName: profile.fullName,
    profilePic: profile.profilePic,
    gradProjectId: existingProject?.id ?? null,
    searchQuery,
    onSearchChange: setSearchQuery,
    searchWrapRef: globalSearchWrapRef,
    globalSearchResults: null,
    globalSearchLoading: false,
    onSelectStudent: (id: number) => navigate(`/students/${id}`),
    onSelectDoctor: (id: number) => navigate(`/doctors/${id}`),
    onOpenSettings: () => {},
    onLogout: handleLogout,
    onCreateProject: () => navigate("/create-project"),
  };

  if (loading) {
    return (
      <StudentDashboardShell {...shellProps}>
        <p className="text-sm text-muted-foreground px-2 py-8">Loading…</p>
      </StudentDashboardShell>
    );
  }

  if (existingProject && !isEdit) {
    return (
      <StudentDashboardShell {...shellProps}>
        <div className="max-w-lg rounded-3xl border border-border bg-card p-8 shadow-soft">
          <h2 className="font-display text-xl font-bold text-foreground">
            You&apos;re already on a team
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Only project owners can edit graduation project details here. Open
            your dashboard to see team workspace and AI recommendations.
          </p>
          <Button
            className="mt-6"
            variant="gradient"
            onClick={() => navigate("/dashboard")}
          >
            Go to dashboard
          </Button>
        </div>
      </StudentDashboardShell>
    );
  }

  const seatsHint =
    currentMembers >= parseInt(teamSize || "0", 10)
      ? "Your team is at capacity."
      : `You (${ownerName}) are in. AI can suggest ${Math.max(0, parseInt(teamSize || "0", 10) - currentMembers)} more teammate${parseInt(teamSize || "0", 10) - currentMembers === 1 ? "" : "s"} after you save.`;

  return (
    <StudentDashboardShell {...shellProps}>
      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
          {isEdit ? "Edit graduation project" : "New graduation project"}
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground mt-1">
          {isEdit ? "Update your project" : "Create your project"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          A guided form, not a long intimidating one. AI will analyze the idea
          after submission.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <Stepper active={activeStep} onStepClick={setActiveStep} />

          {activeStep === 1 && (
            <div className="space-y-5">
              <FieldLabel label="Project title">
                <Input
                  className="mt-1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Campus Wellness Companion"
                />
              </FieldLabel>
              <FieldLabel label="Problem description">
                <Textarea
                  className="mt-1 min-h-32"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Describe the problem students face and what your project will solve…"
                />
              </FieldLabel>
              <FieldLabel label="Project field">
                <Input
                  className="mt-1"
                  value={projectField}
                  onChange={(e) => setProjectField(e.target.value)}
                  placeholder="e.g. HealthTech / AI"
                />
              </FieldLabel>
              {engIt && (
                <FieldLabel label="Project type">
                  <ProjectTypeRow
                    value={projectType}
                    onChange={setProjectType}
                  />
                </FieldLabel>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Required skills
                </label>
                {!skillsPack && (
                  <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Complete faculty and major on your profile to see skill
                    suggestions, or add custom skills below.
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {skillPool.map((skill) => {
                    const selected = requiredSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          "rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/50 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {skill}
                      </button>
                    );
                  })}
                  {requiredSkills
                    .filter((s) => !skillPool.includes(s))
                    .map((skill) => (
                      <button
                        key={`custom-${skill}`}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className="rounded-full border border-primary bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary"
                      >
                        {skill} ×
                      </button>
                    ))}
                  {!showSkillInput ? (
                    <button
                      type="button"
                      onClick={() => setShowSkillInput(true)}
                      className="rounded-full border border-dashed border-border px-3 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                    >
                      + Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 w-full sm:w-auto">
                      <Input
                        className="h-8 text-xs max-w-[180px]"
                        value={skillDraft}
                        maxLength={CUSTOM_SKILL_MAX_LENGTH}
                        placeholder="Custom skill"
                        onChange={(e) => setSkillDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomSkill();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={addCustomSkill}
                      >
                        Add
                      </Button>
                      <button
                        type="button"
                        className="text-muted-foreground p-1"
                        aria-label="Cancel"
                        onClick={() => {
                          setShowSkillInput(false);
                          setSkillDraft("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FieldLabel label="Needed team size">
                  <Input
                    className="mt-1"
                    type="number"
                    min={1}
                    max={10}
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Total seats including you (max 10).
                  </p>
                </FieldLabel>
                <FieldLabel label="Current members">
                  <Input
                    className="mt-1 bg-muted/40"
                    type="number"
                    readOnly
                    value={String(currentMembers)}
                  />
                </FieldLabel>
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-xs text-muted-foreground">
                <Users className="inline h-3.5 w-3.5 mr-1 text-primary" />
                {seatsHint}
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Do you need a supervisor?
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNeedSupervisor(true)}
                    className={cn(
                      "rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-colors",
                      needSupervisor
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    Yes — match me
                  </button>
                  <button
                    type="button"
                    onClick={() => setNeedSupervisor(false)}
                    className={cn(
                      "rounded-xl border-2 px-4 py-2 text-sm font-medium transition-colors",
                      !needSupervisor
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    No, already have one
                  </button>
                </div>
              </div>
              {needSupervisor && (
                <FieldLabel label="Anything specific about the supervisor?">
                  <Textarea
                    className="mt-1"
                    value={supervisorNotes}
                    onChange={(e) => setSupervisorNotes(e.target.value)}
                    placeholder="e.g. prefer someone with EdTech background, weekly meetings…"
                  />
                </FieldLabel>
              )}
              <FieldLabel label="Attach idea document (optional)">
                <div className="mt-1 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground opacity-70">
                  Drop a PDF / DOC here (coming soon)
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Document upload is not connected yet; describe your idea in
                  the problem field for now.
                </p>
              </FieldLabel>
            </div>
          )}

          {formError && (
            <p
              className="mt-4 text-sm font-medium text-destructive"
              role="alert"
            >
              {formError}
            </p>
          )}

          <div className="mt-8 flex justify-between items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              disabled={activeStep === 1 || submitting}
              onClick={() => {
                setFormError(null);
                setActiveStep((s) => s - 1);
              }}
            >
              Back
            </Button>
            {activeStep < 3 ? (
              <Button
                type="button"
                variant="gradient"
                onClick={goNext}
                disabled={submitting}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ai"
                disabled={submitting}
                onClick={() => void handleSubmit()}
              >
                <Sparkles className="h-4 w-4" />
                {submitting
                  ? "Saving…"
                  : isEdit
                    ? "Save & analyze"
                    : "Analyze with AI"}
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-ai/20 bg-ai-soft/60 p-4">
            <div className="flex items-center gap-2 text-ai">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                What AI will do next
              </p>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-foreground/80">
              <li>✓ Detect your project&apos;s domain</li>
              <li>✓ Identify required skills you&apos;re missing</li>
              <li>✓ Suggest 3–5 teammate matches</li>
              <li>✓ Recommend 2 supervisors with reasons</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <p className="font-display font-semibold text-sm">Tips</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Write the problem in plain language. Skip jargon. The AI matcher
              pulls signals from the description itself.
            </p>
          </div>
        </aside>
      </div>
    </StudentDashboardShell>
  );
}
