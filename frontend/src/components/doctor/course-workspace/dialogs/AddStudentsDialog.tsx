import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkspaceModal } from "@/components/doctor/course-workspace/WorkspaceModal";
import { addStudentsToSection } from "@/api/doctorCoursesApi";
import type { CourseSectionView } from "@/hooks/useCourseWorkspace";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

type AddStudentsDialogProps = {
  open: boolean;
  sections: CourseSectionView[];
  defaultSectionId?: number | null;
  /** When set, enrollment is fixed to this section (section workspace). */
  fixedSectionId?: number;
  onClose: () => void;
  onSaved: () => void;
};

export function AddStudentsDialog({
  open,
  sections,
  defaultSectionId,
  fixedSectionId,
  onClose,
  onSaved,
}: AddStudentsDialogProps) {
  const [sectionId, setSectionId] = useState<string>("");
  const [idsText, setIdsText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial =
      fixedSectionId != null
        ? String(fixedSectionId)
        : defaultSectionId != null
          ? String(defaultSectionId)
          : sections[0]
            ? String(sections[0].id)
            : "";
    setSectionId(initial);
    setIdsText("");
  }, [open, defaultSectionId, fixedSectionId, sections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sid = Number(sectionId);
    if (!Number.isFinite(sid)) return;

    const studentIds = idsText
      .split(/[\n,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (studentIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Enter at least one student ID",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await addStudentsToSection(sid, studentIds);
      const parts = [`${result.added} added`];
      if (result.alreadyEnrolled.length > 0) {
        parts.push(`${result.alreadyEnrolled.length} already enrolled`);
      }
      if (result.notFound.length > 0) {
        parts.push(`${result.notFound.length} not found`);
      }
      toast({ title: "Enrollment updated", description: parts.join(" · ") });
      onSaved();
      onClose();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not add students",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceModal
      open={open}
      title="Add students"
      description="Enter university student IDs (one per line or comma-separated)."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {fixedSectionId == null ? (
          <div className="space-y-1.5">
            <Label>Section</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={String(section.id)}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="student-ids">Student IDs</Label>
          <Textarea
            id="student-ids"
            value={idsText}
            onChange={(e) => setIdsText(e.target.value)}
            placeholder={"2021001\n2021002"}
            rows={6}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || sections.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add students
          </Button>
        </div>
      </form>
    </WorkspaceModal>
  );
}
