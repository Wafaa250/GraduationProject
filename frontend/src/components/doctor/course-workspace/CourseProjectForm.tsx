import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCourseProject,
  updateCourseProject,
  getDoctorCourseById,
  type CourseProjectWithTeams,
  type CreateCourseProjectPayload,
} from "@/api/doctorCoursesApi";
import type { CourseSectionView } from "@/hooks/useCourseWorkspace";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ACCEPT_PROJECT_FILES = ".pdf,.doc,.docx";

export type CourseProjectFormProps = {
  active: boolean;
  courseId: number;
  sections: CourseSectionView[];
  project?: CourseProjectWithTeams | null;
  defaultSectionId?: number;
  onCancel: () => void;
  onSaved: () => void;
};

export function CourseProjectForm({
  active,
  courseId,
  sections,
  project,
  defaultSectionId,
  onCancel,
  onSaved,
}: CourseProjectFormProps) {
  const isEdit = project != null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teamSize, setTeamSize] = useState("4");
  const [applyToAllSections, setApplyToAllSections] = useState(true);
  const [allowCrossSectionTeams, setAllowCrossSectionTeams] = useState(false);
  const [aiMode, setAiMode] = useState<"doctor" | "student">("doctor");
  const [sectionIds, setSectionIds] = useState<number[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!active) return;
    setTitle(project?.title ?? "");
    setDescription(project?.description ?? "");
    setTeamSize(String(project?.teamSize ?? 4));
    setApplyToAllSections(project?.applyToAllSections ?? true);
    setAllowCrossSectionTeams(project?.allowCrossSectionTeams ?? false);
    if (project) {
      setAiMode(project.aiMode === "student" ? "student" : "doctor");
      setSectionIds(project.sections.map((s) => s.sectionId));
    } else {
      setAiMode("doctor");
      void getDoctorCourseById(courseId)
        .then((course) => {
          setAiMode(
            course.defaultTeamFormationStrategy === "student" ? "student" : "doctor",
          );
        })
        .catch(() => {
          /* keep default */
        });
      if (defaultSectionId != null) {
        setApplyToAllSections(false);
        setSectionIds([defaultSectionId]);
      } else {
        setSectionIds([]);
      }
    }
    setPendingFiles([]);
  }, [active, project, defaultSectionId, courseId]);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const allowed = Array.from(list).filter((f) => {
      const n = f.name.toLowerCase();
      return n.endsWith(".pdf") || n.endsWith(".doc") || n.endsWith(".docx");
    });
    if (allowed.length < list.length) {
      toast({
        variant: "destructive",
        title: "Some files were skipped",
        description: "Only PDF, DOC, and DOCX files are allowed.",
      });
    }
    setPendingFiles((prev) => [...prev, ...allowed]);
  };

  const payload = (): CreateCourseProjectPayload => ({
    title,
    description,
    teamSize: Math.min(50, Math.max(1, Number(teamSize) || 4)),
    applyToAllSections,
    allowCrossSectionTeams,
    aiMode,
    sectionIds: applyToAllSections ? [] : sectionIds,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!applyToAllSections && sectionIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Select at least one section",
        description: "Choose which sections this project applies to.",
      });
      return;
    }
    setSaving(true);
    try {
      if (isEdit && project) {
        await updateCourseProject(project.id, payload());
        toast({ title: "Project updated" });
      } else {
        await createCourseProject(courseId, payload());
        if (pendingFiles.length > 0) {
          toast({
            title: "Course project created",
            description:
              "Project documents were not uploaded — file upload API is not available on the backend yet.",
          });
        } else {
          toast({ title: "Course project created" });
        }
      }
      onSaved();
      onCancel();
    } catch (err) {
      toast({
        variant: "destructive",
        title: isEdit ? "Could not update project" : "Could not create project",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!active) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="project-title">Project title</Label>
        <Input
          id="project-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="project-desc">Description</Label>
        <Textarea
          id="project-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Project documents</Label>
        <div
          className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_PROJECT_FILES}
            multiple
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />
          <FileUp className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-[12px] text-foreground">PDF, DOC, or DOCX</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose files
          </Button>
        </div>
        {pendingFiles.length > 0 ? (
          <ul className="space-y-1">
            {pendingFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-card px-2 py-1 text-[11px]"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-[11px] text-muted-foreground">
          Backend integration pending: selected files are not uploaded until a course project
          documents API is added.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="team-size">Team size</Label>
        <Input
          id="team-size"
          type="number"
          min={1}
          max={50}
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={applyToAllSections}
          onChange={(e) => setApplyToAllSections(e.target.checked)}
          className="rounded border-border"
        />
        Apply to all sections
      </label>
      {!applyToAllSections ? (
        <div className="space-y-1.5">
          <Label>Sections</Label>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((section) => {
              const selected = sectionIds.includes(section.id);
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() =>
                    setSectionIds((prev) =>
                      selected
                        ? prev.filter((id) => id !== section.id)
                        : [...prev, section.id],
                    )
                  }
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px]",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {section.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={allowCrossSectionTeams}
          onChange={(e) => setAllowCrossSectionTeams(e.target.checked)}
          className="rounded border-border"
        />
        Allow cross-section teams
      </label>
      <div className="space-y-1.5">
        <Label>Team formation mode</Label>
        <div className="flex gap-2">
          {(["doctor", "student"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setAiMode(mode)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium",
                aiMode === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {mode === "doctor" ? "Doctor generates" : "Student-led"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !title.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEdit ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
