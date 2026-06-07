import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import {
  buildDescriptionWithFormation,
  parseAiFormationFromDescription,
  type AiFormationConfig,
} from "@/components/doctor/course-project-workspace/courseProjectAiConfig";
import type { CourseProjectWorkspacePanelProps } from "@/components/doctor/course-project-workspace/types";
import {
  generateCourseProjectTeams,
  previewCourseProjectTeams,
  updateCourseProject,
} from "@/api/doctorCoursesApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

const BALANCE_OPTIONS = [
  { value: "balanced-skills", label: "Balanced skills across teams" },
  { value: "mixed-majors", label: "Mixed majors / backgrounds" },
  { value: "high-skill-spread", label: "Spread high-skill students evenly" },
  { value: "homogeneous", label: "Similar skill levels per team" },
];

export function ProjectAiFormationPanel({
  workspace,
  bundle,
  bundleLoading,
  onReload,
  onPreviewReady,
  onClearPreview,
  onNavigateToTeams,
}: CourseProjectWorkspacePanelProps) {
  const [config, setConfig] = useState<AiFormationConfig>({
    teamSize: 4,
    allowCrossSectionTeams: false,
    requiredSkills: "",
    balancePreference: BALANCE_OPTIONS[0].value,
    aiMatchingNotes: "",
  });
  const [configSaved, setConfigSaved] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!bundle?.project) return;
    const { publicDescription, config: parsed } = parseAiFormationFromDescription(
      bundle.project.description,
    );
    void publicDescription;
    setConfig({
      teamSize: bundle.project.teamSize,
      allowCrossSectionTeams: bundle.project.allowCrossSectionTeams,
      requiredSkills: parsed.requiredSkills ?? "",
      balancePreference: parsed.balancePreference ?? BALANCE_OPTIONS[0].value,
      aiMatchingNotes: parsed.aiMatchingNotes ?? "",
    });
    setConfigSaved(true);
    onClearPreview?.();
  }, [bundle?.project, onClearPreview]);

  if (bundleLoading || !bundle) {
    return <div className="h-56 animate-pulse rounded-xl border border-border/60 bg-card" />;
  }

  if (bundle.project.aiMode !== "doctor") {
    return (
      <CourseWorkspaceEmptyState
        icon={Sparkles}
        title="Student-led team formation"
        description="This project uses student-led teams. Doctors configure teams in the AI tab only for doctor-generated projects."
      />
    );
  }

  const hasSavedTeams = (bundle.teams?.teamCount ?? 0) > 0;
  const markDirty = () => setConfigSaved(false);

  const saveConfiguration = async () => {
    setSavingConfig(true);
    try {
      const { publicDescription } = parseAiFormationFromDescription(bundle.project.description);
      const description = buildDescriptionWithFormation(publicDescription, config);

      await updateCourseProject(bundle.project.id, {
        title: bundle.project.title,
        description,
        teamSize: config.teamSize,
        applyToAllSections: bundle.project.applyToAllSections,
        allowCrossSectionTeams: config.allowCrossSectionTeams,
        aiMode: "doctor",
        sectionIds: bundle.project.sections.map((s) => s.sectionId),
      });

      setConfigSaved(true);
      toast({ title: "Formation settings saved" });
      onReload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save settings",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handlePreview = async () => {
    if (!configSaved) {
      toast({
        variant: "destructive",
        title: "Save configuration first",
        description: "Update formation settings before previewing teams.",
      });
      return;
    }
    setPreviewing(true);
    try {
      const result = await previewCourseProjectTeams(workspace.courseId, workspace.projectId);
      onPreviewReady?.(result);
      toast({ title: "Preview ready", description: `${result.teamCount} proposed teams.` });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not preview teams",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async (regenerate: boolean) => {
    if (!configSaved) {
      toast({
        variant: "destructive",
        title: "Save configuration first",
        description: "Update formation settings before generating teams.",
      });
      return;
    }
    if (regenerate && hasSavedTeams) {
      if (!window.confirm("Replace existing teams for this project?")) return;
    }
    setGenerating(true);
    try {
      const result = await generateCourseProjectTeams(workspace.courseId, workspace.projectId);
      onClearPreview?.();
      toast({
        title: regenerate ? "Teams regenerated" : "Teams generated",
        description: `${result.teamCount} teams saved for this project.`,
      });
      onReload();
      onNavigateToTeams?.();
    } catch (err) {
      toast({
        variant: "destructive",
        title: regenerate ? "Could not regenerate teams" : "Could not generate teams",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Formation configuration</h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Save settings before previewing or generating teams. AI uses the project description and
            formation notes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ai-team-size">Team size</Label>
            <Input
              id="ai-team-size"
              type="number"
              min={1}
              max={50}
              value={config.teamSize}
              onChange={(e) => {
                markDirty();
                setConfig((c) => ({ ...c, teamSize: Number(e.target.value) || 1 }));
              }}
            />
          </div>
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.allowCrossSectionTeams}
                onChange={(e) => {
                  markDirty();
                  setConfig((c) => ({ ...c, allowCrossSectionTeams: e.target.checked }));
                }}
                className="rounded border-border"
              />
              Allow cross-section teams
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="required-skills">Required skills</Label>
          <Input
            id="required-skills"
            value={config.requiredSkills}
            onChange={(e) => {
              markDirty();
              setConfig((c) => ({ ...c, requiredSkills: e.target.value }));
            }}
            placeholder="e.g. Python, SQL, React (comma-separated)"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="balance-pref">Team balance preference</Label>
          <select
            id="balance-pref"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={config.balancePreference}
            onChange={(e) => {
              markDirty();
              setConfig((c) => ({ ...c, balancePreference: e.target.value }));
            }}
          >
            {BALANCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ai-notes">AI matching notes</Label>
          <Textarea
            id="ai-notes"
            value={config.aiMatchingNotes}
            onChange={(e) => {
              markDirty();
              setConfig((c) => ({ ...c, aiMatchingNotes: e.target.value }));
            }}
            rows={3}
            placeholder="Optional guidance for how teams should be formed"
          />
        </div>

        <Button type="button" size="sm" onClick={saveConfiguration} disabled={savingConfig}>
          {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save configuration
        </Button>
        {!configSaved ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Unsaved changes — save before preview or generate.
          </p>
        ) : null}
      </section>

      <section className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handlePreview} disabled={previewing || generating}>
          {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Preview teams
        </Button>
        {!hasSavedTeams ? (
          <Button type="button" onClick={() => handleGenerate(false)} disabled={generating || previewing}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Generate teams
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleGenerate(true)}
            disabled={generating || previewing}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Regenerate teams
          </Button>
        )}
      </section>
    </div>
  );
}
