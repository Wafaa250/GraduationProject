import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "@/styles/project-wizard-pro.css";
import {
  fetchProjectMatchingPreview,
  hasSufficientProjectPreviewInput,
  type ProjectPreviewResponse,
} from "@/api/aiApi";
import {
  createGraduationProject,
  deleteGraduationProjectDraft,
  getGraduationProjectDraft,
  getGraduationProjectsMyEnvelope,
  partnersCountToTeamSize,
  saveGraduationProjectDraft,
  teamSizeToPartnersCount,
  projectTypeToStage,
  updateGraduationProject,
  uploadGraduationProjectAbstractFile,
  type GradProject,
} from "@/api/gradProjectApi";
import { getMe } from "@/api/meApi";
import {
  getGraduationProjectTypeOptions,
  stageToProjectType,
  type GraduationProjectTypeOption,
} from "@/lib/graduationProjectTypes";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  GraduationCap,
  FileText,
  Code2,
  Users,
  Layers,
  Eye,
  Save,
  Rocket,
  Plus,
  X,
  Brain,
  Database,
  Shield,
  Globe,
  Smartphone,
  Network,
  Cloud,
  Cpu,
  Radio,
  ChevronDown,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type FormData = {
  stage: string;
  title: string;
  summary: string;
  abstractFileName: string;
  skills: string[];
  technologies: string[];
  preferredRoles: string[];
  teamSize: number | null;
  requiredRoles: string[];
  skillPriorities: string[];
  lookingForTeammates: boolean;
  interests: string[];
};

const initialData: FormData = {
  stage: "",
  title: "",
  summary: "",
  abstractFileName: "",
  skills: [],
  technologies: [],
  preferredRoles: [],
  teamSize: null,
  requiredRoles: [],
  skillPriorities: [],
  lookingForTeammates: true,
  interests: [],
};

const SKILL_SUGGESTIONS = [
  "Python",
  "Machine Learning",
  "Data Analysis",
  "UI/UX",
  "Cloud",
  "DevOps",
  "Algorithms",
  "Statistics",
  "Security",
  "Mobile Dev",
];
const TECH_SUGGESTIONS = [
  "React",
  "Next.js",
  "Node.js",
  "TensorFlow",
  "PyTorch",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Firebase",
  "Flutter",
  "Kubernetes",
];
const ROLE_SUGGESTIONS = [
  "Frontend Dev",
  "Backend Dev",
  "ML Engineer",
  "Data Analyst",
  "Designer",
  "Project Manager",
  "DevOps",
  "QA Engineer",
  "Researcher",
];
const TEAM_SIZE_OPTIONS = [1, 2, 3, 4, 5] as const;

const WIZARD_DRAFT_KEY = "skillswap-create-grad-project-draft";

const PRIORITY_SUGGESTIONS = [
  "Communication",
  "Reliability",
  "Technical depth",
  "Research mindset",
  "Design sense",
  "Leadership",
];

const INTERESTS = [
  { id: "ai", label: "AI", icon: Brain },
  { id: "data", label: "Data Science", icon: Database },
  { id: "cyber", label: "Cyber Security", icon: Shield },
  { id: "web", label: "Web Development", icon: Globe },
  { id: "mobile", label: "Mobile Development", icon: Smartphone },
  { id: "network", label: "Networking", icon: Network },
  { id: "cloud", label: "Cloud Computing", icon: Cloud },
  { id: "iot", label: "IoT", icon: Radio },
  { id: "embedded", label: "Embedded Systems", icon: Cpu },
];

const STEPS = [
  { n: 1, title: "Stage", icon: GraduationCap },
  { n: 2, title: "Project Info", icon: FileText },
  { n: 3, title: "Skills & Tech", icon: Code2 },
  { n: 4, title: "Team", icon: Users },
  { n: 5, title: "Interests", icon: Layers },
  { n: 6, title: "Review", icon: Eye },
];

function projectToFormData(project: GradProject): FormData {
  const skills = project.requiredSkills ?? [];
  return {
    stage: projectTypeToStage(project.projectType),
    title: project.name,
    summary: (project.abstract ?? "").trim(),
    abstractFileName: "",
    skills: [...skills],
    technologies: [],
    preferredRoles: project.preferredRoles ?? [],
    teamSize: partnersCountToTeamSize(project.partnersCount ?? 0),
    requiredRoles: project.requiredRoles ?? [],
    skillPriorities: project.skillPriorities ?? [],
    lookingForTeammates: project.lookingForTeammates ?? true,
    interests: project.projectInterests ?? [],
  };
}

function buildProjectPayload(data: FormData) {
  return {
    name: data.title.trim(),
    abstract: data.summary.trim() || null,
    projectType: stageToProjectType(data.stage),
    requiredSkills: uniqueStrings([...data.skills, ...data.technologies]),
    preferredRoles: uniqueStrings(data.preferredRoles),
    requiredRoles: uniqueStrings(data.requiredRoles),
    skillPriorities: uniqueStrings(data.skillPriorities),
    lookingForTeammates: data.lookingForTeammates,
    partnersCount: teamSizeToPartnersCount(data.teamSize),
    projectInterests: uniqueStrings(data.interests),
  };
}

async function readFileBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

const ABSTRACT_FILE_ACCEPT = ".pdf,.docx";

function isAbstractFileAllowed(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".docx");
}

function isAbstractComplete(data: FormData): boolean {
  return data.summary.trim().length > 5 || data.abstractFileName.trim().length > 0;
}

function abstractLiveSummaryValue(data: FormData): string {
  const hasText = data.summary.trim().length > 5;
  const hasFile = data.abstractFileName.trim().length > 0;
  if (hasText && hasFile) return "Text and file";
  if (hasText) return "Written";
  if (hasFile) return data.abstractFileName;
  if (data.summary.trim().length > 0) return "In progress";
  return "";
}

function abstractReviewValue(data: FormData): string {
  const text = data.summary.trim();
  const file = data.abstractFileName.trim();
  if (text && file) return `${text}\n\n(File attached: ${file})`;
  if (text) return text;
  if (file) return `File: ${file}`;
  return "—";
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const v = item.trim();
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out;
}

export default function CreateGraduationProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editProjectIdFromState = (location.state as { editProjectId?: number } | null)?.editProjectId;
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialData);
  const [dir, setDir] = useState<"f" | "b">("f");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingProject, setHasExistingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [abstractFile, setAbstractFile] = useState<File | null>(null);
  const [stageOptions, setStageOptions] = useState<GraduationProjectTypeOption[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);

  const isEditMode = editingProjectId != null;

  useEffect(() => {
    void getMe()
      .then((me) => setStageOptions(getGraduationProjectTypeOptions(me.faculty, me.major)))
      .catch(() => setStageOptions(getGraduationProjectTypeOptions(null, null)));
  }, []);

  useEffect(() => {
    if (stageOptions.length === 0) return;
    if (!data.stage || !stageOptions.some((o) => o.stageId === data.stage)) {
      setData((prev) => ({ ...prev, stage: stageOptions[0]!.stageId }));
    }
  }, [stageOptions, data.stage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const envelope = await getGraduationProjectsMyEnvelope();
        if (cancelled) return;

        const { role, project } = envelope;
        const isOwner =
          role === "owner" || project?.isOwner === true;

        if (
          editProjectIdFromState &&
          project &&
          project.id === editProjectIdFromState &&
          isOwner
        ) {
          setEditingProjectId(project.id);
          setData(projectToFormData(project));
          setHasExistingProject(false);
          return;
        }

        if (editProjectIdFromState) {
          navigate(ROUTES.graduationProjectWorkspace, { replace: true });
          return;
        }

        if (project) {
          setHasExistingProject(true);
          setData((d) => ({
            ...d,
            teamSize: partnersCountToTeamSize(project.partnersCount ?? 0),
            requiredRoles: project.requiredRoles ?? [],
            skillPriorities: project.skillPriorities ?? [],
            lookingForTeammates: project.lookingForTeammates ?? true,
          }));
          return;
        }

        try {
          const draft = await getGraduationProjectDraft();
          if (draft.payload && typeof draft.payload === "object") {
            setData((d) => ({ ...d, ...(draft.payload as Partial<FormData>) }));
          }
        } catch {
          const saved = sessionStorage.getItem(WIZARD_DRAFT_KEY);
          if (saved) {
            try {
              setData((d) => ({ ...d, ...JSON.parse(saved) }));
            } catch {
              /* ignore corrupt draft */
            }
          }
        }
      } catch {
        /* ignore — wizard still usable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editProjectIdFromState, navigate]);

  useEffect(() => {
    if (hasExistingProject || isEditMode) return;
    const timer = window.setTimeout(() => {
      void saveGraduationProjectDraft(data).catch(() => {
        sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(data));
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [data, hasExistingProject, isEditMode]);

  const update = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const toggleArr = (k: keyof FormData, v: string) => {
    const arr = data[k] as string[];
    update(
      k,
      (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]) as FormData[typeof k],
    );
  };

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return !!data.stage;
      case 2:
        return data.title.trim().length > 2 && isAbstractComplete(data);
      case 3:
        return data.skills.length > 0 && data.technologies.length > 0;
      case 4:
        return data.teamSize != null && data.requiredRoles.length > 0;
      case 5:
        return isEditMode || data.interests.length > 0;
      case 6:
        return true;
      default:
        return false;
    }
  }, [step, data]);

  const next = () => {
    if (stepValid && step < 6) {
      setDir("f");
      setStep(step + 1);
    }
  };
  const back = () => {
    if (step > 1) {
      setDir("b");
      setStep(step - 1);
    }
  };

  const readiness = [
    { label: "Stage selected", done: !!data.stage },
    { label: "Project info added", done: Boolean(data.title.trim() && isAbstractComplete(data)) },
    { label: "Skills added", done: data.skills.length > 0 && data.technologies.length > 0 },
    { label: "Team size selected", done: data.teamSize != null },
    { label: "Roles selected", done: data.requiredRoles.length > 0 },
    { label: "Interests selected", done: data.interests.length > 0 },
  ];
  const readyCount = readiness.filter((r) => r.done).length;
  const progressPct = Math.round(((step - 1) / 5) * 100);

  const handleSubmitProject = async () => {
    if (submitting) return;
    if (!isEditMode && hasExistingProject) return;
    if (data.teamSize == null) return;
    setSubmitting(true);
    try {
      const payload = buildProjectPayload(data);
      if (isEditMode && editingProjectId != null) {
        await updateGraduationProject(editingProjectId, payload);
        if (abstractFile) {
          const fileBase64 = await readFileBase64(abstractFile);
          await uploadGraduationProjectAbstractFile(
            editingProjectId,
            abstractFile.name,
            fileBase64,
          );
        }
        toast({
          title: "Project updated",
          description: "Your graduation project changes were saved.",
        });
        navigate(ROUTES.graduationProjectWorkspace, { replace: true });
      } else {
        const created = await createGraduationProject(payload);
        if (abstractFile) {
          const fileBase64 = await readFileBase64(abstractFile);
          await uploadGraduationProjectAbstractFile(created.id, abstractFile.name, fileBase64);
        }
        await deleteGraduationProjectDraft().catch(() => undefined);
        sessionStorage.removeItem(WIZARD_DRAFT_KEY);
        toast({
          title: "Graduation project created!",
          description: "Your project is live on SkillSwap.",
        });
        navigate(ROUTES.graduationProjectWorkspace, { replace: true });
      }
    } catch (err) {
      toast({
        title: isEditMode ? "Could not update project" : "Could not create project",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="project-wizard-pro min-h-full bg-background">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-hero pointer-events-none" />

      {hasExistingProject && !isEditMode && (
        <div className="relative container max-w-7xl pt-4">
          <p className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
            You already have a graduation project affiliation. Creating another project is not
            available until you leave your current project.
          </p>
        </div>
      )}

      {/* Stepper */}
      <div className="relative container max-w-7xl pt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-bold text-foreground text-lg sm:text-xl">
            {isEditMode ? "Edit Graduation Project" : "Create Graduation Project"}
          </h1>
          <Badge
            variant="secondary"
            className="bg-secondary/70 text-foreground/80 font-medium"
          >
            Step {step} of 6 · {progressPct}%
          </Badge>
        </div>
        <div className="hidden md:flex items-center justify-between gap-2 mb-2">
          {STEPS.map((s, i) => {
            const active = step === s.n;
            const done = step > s.n;
            const Icon = s.icon;
            return (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => done && setStep(s.n)}
                  disabled={!done && !active}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                    done && "hover:bg-secondary cursor-pointer",
                  )}
                >
                  <div
                    className={cn(
                      "size-10 rounded-xl grid place-items-center text-sm font-bold transition-all shrink-0",
                      active && "bg-gradient-primary text-primary-foreground shadow-glow scale-105",
                      done && "bg-success text-success-foreground",
                      !active && !done && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-5" /> : <Icon className="size-5" />}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Step {s.n}
                    </div>
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {s.title}
                    </div>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn("h-px flex-1 mx-2 transition-colors", done ? "bg-success" : "bg-border")}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="md:hidden mb-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">
              Step {step} of 6 · {STEPS[step - 1].title}
            </span>
            <span className="text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      <main className="relative container max-w-7xl py-6 grid lg:grid-cols-[1fr_340px] gap-6 pb-32">
        <section className="min-w-0">
          <div
            key={step}
            className={cn(
              "rounded-2xl border border-border/60 bg-card shadow-elegant p-6 sm:p-10",
              dir === "f" ? "animate-slide-in-right" : "animate-slide-in-left",
            )}
          >
            {step === 1 && <Step1 data={data} update={update} stageOptions={stageOptions} />}
            {step === 2 && (
              <Step2
                data={data}
                update={update}
                abstractFile={abstractFile}
                onAbstractFileChange={(file, name) => {
                  setAbstractFile(file);
                  update("abstractFileName", name);
                }}
              />
            )}
            {step === 3 && <Step3 data={data} update={update} toggleArr={toggleArr} />}
            {step === 4 && <Step4 data={data} update={update} toggleArr={toggleArr} />}
            {step === 5 && <Step5 data={data} toggleArr={toggleArr} />}
            {step === 6 && <Step6 data={data} stageOptions={stageOptions} />}
          </div>
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="lg:hidden mb-3">
            <button
              type="button"
              onClick={() => setSummaryOpen(!summaryOpen)}
              className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-semibold"
            >
              <span>Live summary · {readyCount}/5 ready</span>
              <ChevronDown
                className={cn("size-4 transition-transform", summaryOpen && "rotate-180")}
              />
            </button>
          </div>
          <div className={cn("space-y-4", !summaryOpen && "hidden lg:block")}>
            <LiveSummary data={data} readiness={readiness} readyCount={readyCount} stageOptions={stageOptions} />
          </div>
        </aside>
      </main>

      <div className="fixed bottom-0 inset-x-0 border-t border-border/60 bg-background/85 backdrop-blur-xl z-50">
        <div className="container max-w-7xl py-4 flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
            <div className="size-2 rounded-full bg-success animate-pulse" />
            Auto-saved
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {step > 1 && (
              <Button variant="outline" onClick={back} size="lg" className="rounded-xl" type="button">
                <ArrowLeft /> Back
              </Button>
            )}
            {step === 6 ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  type="button"
                  disabled={savingDraft}
                  onClick={() => {
                    setSavingDraft(true);
                    void saveGraduationProjectDraft(data)
                      .then(() => {
                        toast({ title: "Draft saved", description: "You can continue later." });
                      })
                      .catch((err) => {
                        toast({
                          title: "Could not save draft",
                          description: parseApiErrorMessage(err),
                          variant: "destructive",
                        });
                      })
                      .finally(() => setSavingDraft(false));
                  }}
                >
                  <Save /> {savingDraft ? "Saving…" : "Save Draft"}
                </Button>
                <Button
                  size="lg"
                  className="rounded-xl bg-gradient-primary hover:opacity-95 text-primary-foreground shadow-glow"
                  type="button"
                  onClick={() => void handleSubmitProject()}
                  disabled={submitting || (!isEditMode && hasExistingProject)}
                >
                  <Rocket />{" "}
                  {submitting
                    ? isEditMode
                      ? "Saving…"
                      : "Creating…"
                    : isEditMode
                      ? "Save Changes"
                      : "Create Graduation Project"}
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={next}
                disabled={!stepValid}
                type="button"
                className="rounded-xl bg-gradient-primary hover:opacity-95 text-primary-foreground shadow-glow disabled:shadow-none disabled:bg-muted disabled:text-muted-foreground disabled:bg-none"
              >
                Continue <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ eyebrow, title, desc }: { eyebrow: string; title: ReactNode; desc: string }) {
  return (
    <div className="mb-8">
      <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">{eyebrow}</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">{desc}</p>
    </div>
  );
}

function WizardStepTitleWithAmpersand({ before, after }: { before: string; after: string }) {
  return (
    <>
      {before}
      <span className="wizard-step-title-amp">&</span>
      {after}
    </>
  );
}

function Step1({
  data,
  update,
  stageOptions,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  stageOptions: GraduationProjectTypeOption[];
}) {
  return (
    <div className="animate-fade-in">
      <StepHeader
        eyebrow="Step 1"
        title="Choose your graduation project stage"
        desc="Students should only collaborate with others in the same graduation project stage. Pick the one you're currently enrolled in."
      />
      <div
        className={cn(
          "grid gap-4",
          stageOptions.length <= 1 ? "sm:grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {stageOptions.map((s) => {
          const sel = data.stage === s.stageId;
          return (
            <button
              key={s.stageId}
              type="button"
              onClick={() => update("stage", s.stageId)}
              className={cn(
                "text-left p-6 rounded-2xl border-2 transition-all group",
                sel
                  ? "border-primary bg-gradient-primary/5 shadow-glow"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-md",
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    "size-10 rounded-xl grid place-items-center transition-colors",
                    sel
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground group-hover:text-primary",
                  )}
                >
                  <GraduationCap className="size-5" />
                </div>
                {sel && (
                  <div className="size-6 rounded-full bg-primary grid place-items-center">
                    <Check className="size-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="font-bold text-base mb-1">{s.label}</div>
              <div className="text-sm text-muted-foreground">{s.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step2({
  data,
  update,
  abstractFile,
  onAbstractFileChange,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  abstractFile: File | null;
  onAbstractFileChange: (file: File | null, name: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyFile = (file: File | null) => {
    if (!file) {
      onAbstractFileChange(null, "");
      return;
    }
    if (!isAbstractFileAllowed(file)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or DOCX file only.",
        variant: "destructive",
      });
      return;
    }
    onAbstractFileChange(file, file.name);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    applyFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  return (
    <div className="animate-fade-in space-y-6">
      <StepHeader
        eyebrow="Step 2"
        title="Tell us about your project"
        desc="Give your project a clear identity. A great title and abstract help teammates discover you faster."
      />
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Project Title</Label>
        <Input
          value={data.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. AI-powered campus navigation assistant"
          className="h-12 rounded-xl text-base"
        />
        <p className="text-xs text-muted-foreground">
          Keep it concise and descriptive — 5 to 12 words is ideal.
        </p>
      </div>
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Project Abstract</Label>
        <Textarea
          value={data.summary}
          onChange={(e) => update("summary", e.target.value)}
          placeholder="Summarize your project's purpose, approach, and expected outcomes…"
          className="min-h-[220px] rounded-xl resize-y text-base leading-relaxed px-4 py-3"
        />
        <p className="text-xs text-muted-foreground">
          {data.summary.length > 0
            ? `${data.summary.length} characters`
            : "Write your abstract here, or upload a file below (at least one is required)."}
        </p>

        <div className="rounded-xl border border-dashed border-border/80 bg-secondary/30 px-4 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={ABSTRACT_FILE_ACCEPT}
            className="sr-only"
            onChange={onFileChange}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Optional: upload a PDF or DOCX abstract document.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl shrink-0 gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              Choose file
            </Button>
          </div>
          {abstractFile && data.abstractFileName ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2">
              <p className="text-sm font-medium truncate">{data.abstractFileName}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg"
                aria-label="Remove abstract file"
                onClick={() => {
                  applyFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ChipInput({
  label,
  value,
  onAdd,
  onRemove,
  suggestions,
  placeholder,
  disabled,
}: {
  label: string;
  value: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  suggestions: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const submit = () => {
    if (disabled) return;
    const v = input.trim();
    if (v && !value.includes(v)) onAdd(v);
    setInput("");
  };
  return (
    <div className={cn(disabled && "wizard-unsupported")}>
      {disabled && (
        <span className="wizard-unsupported-badge">Pending backend integration</span>
      )}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{label}</Label>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            className="h-11 rounded-xl"
          />
          <Button
            type="button"
            onClick={submit}
            variant="outline"
            className="h-11 rounded-xl"
            disabled={disabled}
          >
            <Plus />
          </Button>
        </div>
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {value.map((v) => (
              <Badge
                key={v}
                className="px-3 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground gap-1.5 cursor-pointer hover:opacity-90"
                onClick={() => !disabled && onRemove(v)}
              >
                {v} <X className="size-3" />
              </Badge>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {suggestions
            .filter((s) => !value.includes(s))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => onAdd(s)}
                className="text-xs px-2.5 py-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function Step3({
  data,
  update,
  toggleArr,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleArr: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      <StepHeader
        eyebrow="Step 3"
        title="Required skills & technologies"
        desc="Define the technical scope. This powers the matching engine to find teammates with the right strengths."
      />
      <ChipInput
        label="Required Skills"
        value={data.skills}
        onAdd={(v) => update("skills", [...data.skills, v])}
        onRemove={(v) => toggleArr("skills", v)}
        suggestions={SKILL_SUGGESTIONS}
        placeholder="Add a skill"
      />
      <ChipInput
        label="Technologies"
        value={data.technologies}
        onAdd={(v) => update("technologies", [...data.technologies, v])}
        onRemove={(v) => toggleArr("technologies", v)}
        suggestions={TECH_SUGGESTIONS}
        placeholder="Add a technology"
      />
      <ChipInput
        label="Preferred Roles Needed"
        value={data.preferredRoles}
        onAdd={(v) => update("preferredRoles", [...data.preferredRoles, v])}
        onRemove={(v) => toggleArr("preferredRoles", v)}
        suggestions={ROLE_SUGGESTIONS}
        placeholder="Add a role"
      />
    </div>
  );
}

function Step4({
  data,
  update,
  toggleArr,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleArr: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div className="animate-fade-in space-y-8">
      <StepHeader
        eyebrow="Step 4"
        title="Team formation"
        desc="Shape your team. Set the size, the roles you need, and the qualities that matter most."
      />

      <div className="p-6 rounded-2xl border border-border bg-gradient-surface">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm font-semibold">Desired team size</Label>
          <Badge className="bg-gradient-primary text-primary-foreground text-base px-3 py-1">
            {data.teamSize != null ? `${data.teamSize} members` : "Select size"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEAM_SIZE_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update("teamSize", n)}
              className={cn(
                "min-w-12 h-11 px-4 rounded-xl border-2 text-sm font-semibold transition-all",
                data.teamSize === n
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <ChipInput
        label="Required Roles"
        value={data.requiredRoles}
        onAdd={(v: string) => update("requiredRoles", [...data.requiredRoles, v])}
        onRemove={(v: string) => toggleArr("requiredRoles", v)}
        suggestions={ROLE_SUGGESTIONS}
        placeholder="e.g. ML Engineer"
      />

      <ChipInput
        label="Skill priorities"
        value={data.skillPriorities}
        onAdd={(v: string) => update("skillPriorities", [...data.skillPriorities, v])}
        onRemove={(v: string) => toggleArr("skillPriorities", v)}
        suggestions={PRIORITY_SUGGESTIONS}
        placeholder="What qualities matter most?"
      />

      <div className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card">
        <div>
          <div className="font-semibold">I'm looking for teammates</div>
          <div className="text-sm text-muted-foreground">Show this project on the matching board.</div>
        </div>
        <Switch
          checked={data.lookingForTeammates}
          onCheckedChange={(v) => update("lookingForTeammates", v)}
        />
      </div>
    </div>
  );
}

function Step5({
  data,
  toggleArr,
}: {
  data: FormData;
  toggleArr: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div className="animate-fade-in">
      <StepHeader
        eyebrow="Step 5"
        title={<WizardStepTitleWithAmpersand before="Project interests " after=" domains" />}
        desc="Pick the areas your project lives in. Used to surface compatible peers and supervisors."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {INTERESTS.map(({ id, label, icon: Icon }) => {
          const sel = data.interests.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleArr("interests", id)}
              className={cn(
                "p-5 rounded-2xl border-2 transition-all flex flex-col items-start gap-3 text-left",
                sel
                  ? "border-primary bg-gradient-primary/5 shadow-glow"
                  : "border-border hover:border-primary/40 hover:shadow-md",
              )}
            >
              <div
                className={cn(
                  "size-11 rounded-xl grid place-items-center transition-colors",
                  sel
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="font-semibold">{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step6({
  data,
  stageOptions,
}: {
  data: FormData;
  stageOptions: GraduationProjectTypeOption[];
}) {
  const stageLabel = stageOptions.find((s) => s.stageId === data.stage)?.label ?? "—";
  const interestLabels = useMemo(
    () =>
      data.interests
        .map((i) => INTERESTS.find((x) => x.id === i)?.label)
        .filter((label): label is string => Boolean(label)),
    [data.interests],
  );

  const previewInputReady = useMemo(
    () =>
      hasSufficientProjectPreviewInput({
        title: data.title,
        skills: data.skills,
        technologies: data.technologies,
      }),
    [data.title, data.skills, data.technologies],
  );

  const [preview, setPreview] = useState<ProjectPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewInputReady) {
      setPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    (async () => {
      try {
        const result = await fetchProjectMatchingPreview({
          projectType: data.stage ? stageToProjectType(data.stage) : "GP",
          title: data.title.trim(),
          abstract: data.summary.trim() || null,
          requiredSkills: data.skills,
          technologies: data.technologies,
          preferredRoles: uniqueStrings(data.preferredRoles),
          requiredRoles: uniqueStrings(data.requiredRoles),
          skillPriorities: uniqueStrings(data.skillPriorities),
          interests: interestLabels,
          teamSize: data.teamSize ?? 1,
        });
        if (!cancelled) setPreview(result);
      } catch (err) {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(parseApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    previewInputReady,
    data.title,
    data.summary,
    data.stage,
    data.skills,
    data.technologies,
    data.preferredRoles,
    data.requiredRoles,
    data.skillPriorities,
    data.teamSize,
    interestLabels,
  ]);

  const previewMetrics = useMemo(() => {
    if (!preview?.isAvailable) return null;
    return [
      { label: "Match confidence", value: `${preview.compatibilityScore}%` },
      {
        label: "Potential matches",
        value: String(preview.estimatedCompatibleStudentsCount),
      },
      { label: "Domain overlap", value: preview.domainOverlapLabel ?? "—" },
      { label: "Role coverage", value: preview.roleCoverageLabel ?? "—" },
    ];
  }, [preview]);

  return (
    <div className="animate-fade-in space-y-6">
      <StepHeader
        eyebrow="Step 6"
        title="Review & create"
        desc="Review everything before publishing. You can go back to edit any step."
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <ReviewCard title="Stage" value={stageLabel} />
        <ReviewCard title="Project Title" value={data.title || "—"} wide />
        <ReviewCard title="Abstract" value={abstractReviewValue(data)} wide />
        <ReviewChips title="Required Skills" items={data.skills} />
        <ReviewChips title="Technologies" items={data.technologies} />
        <ReviewChips title="Preferred Roles" items={data.preferredRoles} />
        <ReviewCard
          title="Desired team size"
          value={data.teamSize != null ? `${data.teamSize} members` : "—"}
        />
        <ReviewCard
          title="Looking for teammates"
          value={data.lookingForTeammates ? "Yes" : "No"}
        />
        <ReviewChips title="Required Roles" items={data.requiredRoles} wide />
        <ReviewChips title="Interests / Domains" items={interestLabels as string[]} wide />
      </div>

      <div className="p-6 rounded-2xl border border-primary/30 bg-gradient-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-60 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <div className="font-bold text-lg">AI Matching Preview</div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            SkillSwap will use your <b>project stage</b>, <b>skills</b>, <b>interests</b>, <b>roles</b>,
            and <b>team requirements</b> to help find compatible teammates. The more complete your
            profile, the stronger the matches.
          </p>

          {!previewInputReady ? (
            <p className="mt-4 text-sm text-muted-foreground">
              AI preview will become available once sufficient project information is provided.
            </p>
          ) : previewLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Analyzing potential teammate matches…
            </div>
          ) : previewError ? (
            <p className="mt-4 text-sm text-destructive">{previewError}</p>
          ) : preview && !preview.isAvailable ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {preview.message ??
                "AI preview will become available once sufficient project information is provided."}
            </p>
          ) : preview?.isAvailable && previewMetrics ? (
            <>
              {preview.message ? (
                <p className="mt-3 text-sm text-muted-foreground">{preview.message}</p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previewMetrics.map((m) => (
                  <div key={m.label} className="rounded-xl bg-card border border-border p-3">
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                    <div className="text-lg font-bold text-gradient">{m.value}</div>
                  </div>
                ))}
              </div>
              {(preview.topMatchingSkills.length > 0 || preview.topMatchingRoles.length > 0) && (
                <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                  {preview.topMatchingSkills.length > 0 ? (
                    <div className="rounded-xl bg-card border border-border p-3">
                      <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                        Top matching skills
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {preview.topMatchingSkills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="rounded-md">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {preview.topMatchingRoles.length > 0 ? (
                    <div className="rounded-xl bg-card border border-border p-3">
                      <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                        Top matching roles
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {preview.topMatchingRoles.map((role) => (
                          <Badge key={role} variant="secondary" className="rounded-md">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              {preview.topRecommendedStudents.length > 0 ? (
                <div className="mt-4 rounded-xl bg-card border border-border p-3">
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                    Top recommended students
                  </div>
                  <ul className="space-y-2">
                    {preview.topRecommendedStudents.map((student) => (
                      <li
                        key={student.studentId}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="font-medium text-foreground">{student.name}</span>
                        <span className="text-muted-foreground shrink-0">
                          {student.matchScore}% match
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ title, value, wide }: { title: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("p-4 rounded-xl border border-border bg-card", wide && "sm:col-span-2")}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {title}
      </div>
      <div className="text-sm font-medium text-foreground whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function ReviewChips({ title, items, wide }: { title: string; items: string[]; wide?: boolean }) {
  return (
    <div className={cn("p-4 rounded-xl border border-border bg-card", wide && "sm:col-span-2")}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">—</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <Badge key={i} variant="secondary" className="rounded-md">
              {i}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveSummary({
  data,
  readiness,
  readyCount,
  stageOptions,
}: {
  data: FormData;
  readiness: { label: string; done: unknown }[];
  readyCount: number;
  stageOptions: GraduationProjectTypeOption[];
}) {
  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold">Matching readiness</div>
          <Badge className="bg-gradient-primary text-primary-foreground">{readyCount}/5</Badge>
        </div>
        <Progress value={(readyCount / 5) * 100} className="h-2 mb-4" />
        <ul className="space-y-2">
          {readiness.map((r) => (
            <li key={r.label} className="flex items-center gap-2.5 text-sm">
              <div
                className={cn(
                  "size-5 rounded-md grid place-items-center shrink-0",
                  r.done
                    ? "bg-success text-success-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {r.done ? (
                  <Check className="size-3" />
                ) : (
                  <div className="size-1.5 rounded-full bg-current opacity-50" />
                )}
              </div>
              <span
                className={cn(
                  r.done ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {r.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border/60 bg-gradient-surface p-5 shadow-sm">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Live summary
        </div>
        <div className="space-y-3 text-sm">
          <SummaryRow
            label="Stage"
            value={stageOptions.find((s) => s.stageId === data.stage)?.label}
          />
          <SummaryRow label="Title" value={data.title} />
          <SummaryRow label="Abstract" value={abstractLiveSummaryValue(data)} />
          <SummaryRow
            label="Required Skills"
            value={data.skills.length ? `${data.skills.length} added` : ""}
          />
          <SummaryRow
            label="Technologies"
            value={data.technologies.length ? `${data.technologies.length} added` : ""}
          />
          <SummaryRow
            label="Team size"
            value={data.teamSize != null ? `${data.teamSize}` : undefined}
          />
          <SummaryRow
            label="Roles"
            value={data.requiredRoles.length ? `${data.requiredRoles.length} required` : ""}
          />
          <SummaryRow
            label="Interests"
            value={data.interests.length ? `${data.interests.length} selected` : ""}
          />
        </div>
      </div>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium text-right truncate max-w-[60%]",
          !value && "text-muted-foreground/60",
        )}
      >
        {value || "—"}
      </span>
    </div>
  );
}
