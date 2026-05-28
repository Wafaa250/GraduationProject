import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkspaceModal } from "@/components/doctor/course-workspace/WorkspaceModal";
import { moveStudentToSection } from "@/api/doctorCoursesApi";
import type { CourseEnrolledStudent } from "@/api/doctorCoursesApi";
import type { CourseSectionView } from "@/hooks/useCourseWorkspace";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

type MoveSectionDialogProps = {
  open: boolean;
  student: CourseEnrolledStudent | null;
  sections: CourseSectionView[];
  onClose: () => void;
  onSaved: () => void;
};

export function MoveSectionDialog({
  open,
  student,
  sections,
  onClose,
  onSaved,
}: MoveSectionDialogProps) {
  const [targetSectionId, setTargetSectionId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !student) return;
    const other = sections.find((s) => s.id !== student.sectionId);
    setTargetSectionId(other ? String(other.id) : "");
  }, [open, student, sections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.sectionId) return;
    const target = Number(targetSectionId);
    if (!Number.isFinite(target)) return;

    setSaving(true);
    try {
      await moveStudentToSection(student.sectionId, student.studentId, target);
      toast({ title: "Student moved to new section" });
      onSaved();
      onClose();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not move student",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const available = sections.filter((s) => s.id !== student?.sectionId);

  return (
    <WorkspaceModal
      open={open}
      title="Move section"
      description={student?.name ? `Move ${student.name} to another section.` : undefined}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Target section</Label>
          <Select value={targetSectionId} onValueChange={setTargetSectionId}>
            <SelectTrigger>
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {available.map((section) => (
                <SelectItem key={section.id} value={String(section.id)}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || available.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Move student
          </Button>
        </div>
      </form>
    </WorkspaceModal>
  );
}
