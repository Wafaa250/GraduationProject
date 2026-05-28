import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceModal } from "@/components/doctor/course-workspace/WorkspaceModal";
import {
  createCourseSection,
  updateCourseSection,
  type CourseSection,
  type CreateCourseSectionPayload,
} from "@/api/doctorCoursesApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

const DAY_OPTIONS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

type SectionFormDialogProps = {
  open: boolean;
  courseId: number;
  section?: CourseSection | null;
  onClose: () => void;
  onSaved: () => void;
};

export function SectionFormDialog({
  open,
  courseId,
  section,
  onClose,
  onSaved,
}: SectionFormDialogProps) {
  const isEdit = section != null;
  const [name, setName] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(section?.name ?? "");
    setDays(section?.days ?? []);
    setTimeFrom(section?.timeFrom ?? "");
    setTimeTo(section?.timeTo ?? "");
    setCapacity(String(section?.capacity ?? 30));
  }, [open, section]);

  const payload = (): CreateCourseSectionPayload => ({
    name,
    days,
    timeFrom,
    timeTo,
    capacity: Math.max(1, Number(capacity) || 1),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEdit && section) {
        await updateCourseSection(section.id, payload());
        toast({ title: "Section updated" });
      } else {
        await createCourseSection(courseId, payload());
        toast({ title: "Section created" });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({
        variant: "destructive",
        title: isEdit ? "Could not update section" : "Could not create section",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceModal
      open={open}
      title={isEdit ? "Edit section" : "Create section"}
      description="Organize students by schedule and capacity."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="section-name">Section name</Label>
          <Input
            id="section-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Section A"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Meeting days</Label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_OPTIONS.map((day) => {
              const selected = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setDays((prev) =>
                      selected ? prev.filter((d) => d !== day) : [...prev, day],
                    )
                  }
                  className={
                    selected
                      ? "rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
                      : "rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground"
                  }
                >
                  {day.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="time-from">From</Label>
            <Input
              id="time-from"
              type="time"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time-to">To</Label>
            <Input
              id="time-to"
              type="time"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Save changes" : "Create section"}
          </Button>
        </div>
      </form>
    </WorkspaceModal>
  );
}
