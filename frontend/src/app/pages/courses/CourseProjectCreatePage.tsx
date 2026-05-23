import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Sparkles, Upload, Users } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useToast } from "../../../context/ToastContext";
import type {
  CourseProjectCreateLocationState,
  CourseWorkspaceSectionOption,
  NewWorkspaceProjectPayload,
} from "./courseProjectTypes";
import {
  createDoctorCourseProject,
  getDoctorCourseSections,
} from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorSubpageLayout } from "../../components/doctor/hub/DoctorSubpageLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { parseBackendCourseId } from "./courseProjectUtils";

export default function CourseProjectCreatePage() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const { showToast } = useToast();

  const [sectionOptions, setSectionOptions] = useState<CourseWorkspaceSectionOption[]>(
    (location.state as CourseProjectCreateLocationState | null)?.sections ?? [],
  );

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [teamSize, setTeamSize] = useState(1);
  const [duration, setDuration] = useState("");
  const [allSections, setAllSections] = useState(true);
  const [allowCrossSectionTeams, setAllowCrossSectionTeams] = useState(false);
  const [sectionId, setSectionId] = useState("");
  const [aiMode, setAiMode] = useState<"doctor" | "student">("doctor");
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const backendCourseId = parseBackendCourseId(courseId);

  useEffect(() => {
    if (backendCourseId == null) return;
    let cancelled = false;
    getDoctorCourseSections(backendCourseId)
      .then((secs) => {
        if (cancelled) return;
        const apiOpts: CourseWorkspaceSectionOption[] = secs.map((s) => ({
          id: String(s.id),
          name: s.name,
        }));
        if (apiOpts.length > 0) setSectionOptions(apiOpts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [backendCourseId]);

  useEffect(() => {
    if (!allSections) {
      setAllowCrossSectionTeams(false);
    }
  }, [allSections]);

  const backToWorkspace = () => {
    if (!courseId) {
      navigate("/doctor-dashboard?section=courses");
      return;
    }
    navigate(`/courses/${courseId}?tab=projects`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const t = title.trim();
    if (!t) {
      showToast("Title is required.", "error");
      return;
    }
    if (!allSections) {
      if (sectionOptions.length === 0) {
        showToast("Add sections in the workspace first, or choose All sections.", "error");
        return;
      }
      if (!sectionId) {
        showToast("Select a section, or enable All sections.", "error");
        return;
      }
    }
    const ts = Number(teamSize);
    if (!Number.isFinite(ts) || ts < 1 || ts > 50) {
      showToast("Team size must be between 1 and 50.", "error");
      return;
    }
    if (!courseId) {
      showToast("Missing course in route.", "error");
      return;
    }

    let sectionLabel = "All sections";
    if (!allSections) {
      const pick = sectionOptions.find((s) => s.id === sectionId);
      sectionLabel = pick?.name?.trim() || "Section";
    }

    const payload: NewWorkspaceProjectPayload = {
      title: t,
      abstract: abstract.trim(),
      teamSize: ts,
      duration: duration.trim(),
      sectionLabel,
      aiMode,
    };

    if (backendCourseId != null) {
      setSubmitting(true);
      try {
        const selectedSectionIds = allSections
          ? []
          : [Number(sectionId)].filter((n) => Number.isFinite(n) && n > 0);

        const newProject = await createDoctorCourseProject(backendCourseId, {
          title: t,
          description: abstract.trim(),
          teamSize: ts,
          applyToAllSections: allSections,
          allowCrossSectionTeams: allSections ? allowCrossSectionTeams : false,
          aiMode,
          sectionIds: selectedSectionIds,
        });
        if (newProject.aiMode === "doctor") {
          navigate(`/courses/${courseId}/projects/${newProject.id}/teams`, {
            state: { projectName: t, sectionName: sectionLabel },
          });
        } else {
          navigate(`/courses/${courseId}?tab=projects`);
        }
        return;
      } catch (err) {
        showToast(parseApiErrorMessage(err), "error");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (aiMode === "doctor") {
      const tempProjectId = `temp-${Date.now()}`;
      navigate(`/courses/${courseId}/projects/${tempProjectId}/teams`, {
        state: { projectName: t },
      });
      return;
    }
    navigate(`/courses/${courseId}`, {
      state: { newProject: payload, importNonce: Date.now() },
    });
  };

  return (
    <DoctorSubpageLayout
      wide
      backTo={courseId ? `/courses/${courseId}?tab=projects` : "/doctor-dashboard?section=courses"}
      backLabel="Back to workspace"
    >
      <DoctorHubPageHeader
        eyebrow="Course workspace"
        title="Create project"
        description={
          backendCourseId != null
            ? "Define the project scope, sections, and how teams will be formed."
            : "Draft project for this course (saved locally until the course is created on the server)."
        }
      />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="project-title">Title</Label>
              <Input
                id="project-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Capstone design project"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-abstract">Abstract</Label>
              <Textarea
                id="project-abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Short summary for students"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Project file (UI only)</Label>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={() => {
                  const f = fileRef.current?.files?.[0];
                  setFileLabel(f ? f.name : null);
                }}
              />
              <div className="flex flex-wrap gap-2 items-center">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose file
                </Button>
                <span className="text-sm text-muted-foreground">
                  {fileLabel ?? "No file selected"}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team-size">Team size</Label>
                <Input
                  id="team-size"
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={teamSize}
                  onChange={(e) => {
                    const n = Number.parseInt(e.target.value, 10);
                    setTeamSize(Number.isFinite(n) ? n : 1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 8 weeks"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <Label className="text-sm font-semibold">Sections</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="all-sections"
                  checked={allSections}
                  onCheckedChange={(c) => {
                    const on = c === true;
                    setAllSections(on);
                    if (on) setSectionId("");
                  }}
                />
                <Label htmlFor="all-sections" className="font-normal cursor-pointer">
                  All sections
                </Label>
              </div>
              {allSections ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cross-section"
                    checked={allowCrossSectionTeams}
                    onCheckedChange={(c) => setAllowCrossSectionTeams(c === true)}
                  />
                  <Label htmlFor="cross-section" className="font-normal cursor-pointer">
                    Allow cross-section teams
                  </Label>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="section-pick" className="text-muted-foreground text-xs">
                  Specific section
                </Label>
                <Select
                  value={sectionId || "__none__"}
                  onValueChange={(v) => setSectionId(v === "__none__" ? "" : v)}
                  disabled={allSections || sectionOptions.length === 0}
                >
                  <SelectTrigger id="section-pick">
                    <SelectValue
                      placeholder={
                        sectionOptions.length === 0
                          ? "No sections defined yet"
                          : "Select section…"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {sectionOptions.length === 0 ? "No sections defined yet" : "Select section…"}
                    </SelectItem>
                    {sectionOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">AI mode</Label>
              <p className="text-xs text-muted-foreground m-0">
                How teams are formed for this project.
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={aiMode === "doctor" ? "default" : "outline"}
                  className="justify-start gap-2"
                  onClick={() => setAiMode("doctor")}
                >
                  <Bot className="h-4 w-4" />
                  Doctor assigns
                </Button>
                <Button
                  type="button"
                  variant={aiMode === "student" ? "default" : "outline"}
                  className="justify-start gap-2"
                  onClick={() => setAiMode("student")}
                >
                  <Sparkles className="h-4 w-4" />
                  Student selects
                </Button>
              </div>
              {aiMode === "doctor" ? (
                <p className="text-xs text-muted-foreground m-0">
                  Teams can be assigned from the project teams page after creation.
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={backToWorkspace}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Users className="h-4 w-4 mr-2" />
                {submitting ? "Creating…" : "Create project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DoctorSubpageLayout>
  );
}
