import { CourseProjectForm, type CourseProjectFormProps } from "@/components/doctor/course-workspace/CourseProjectForm";
import type { CourseSectionView } from "@/hooks/useCourseWorkspace";

type CourseProjectCreatePanelProps = {
  open: boolean;
  courseId: number;
  sections: CourseSectionView[];
  defaultSectionId?: number;
  onClose: () => void;
  onSaved: () => void;
};

export function CourseProjectCreatePanel({
  open,
  courseId,
  sections,
  defaultSectionId,
  onClose,
  onSaved,
}: CourseProjectCreatePanelProps) {
  if (!open) return null;

  const formProps: CourseProjectFormProps = {
    active: open,
    courseId,
    sections,
    defaultSectionId,
    onCancel: onClose,
    onSaved,
  };

  return (
    <section className="rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
      <div className="mb-4 border-b border-border/70 pb-4">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          Create course project
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure team formation for students in this course.
        </p>
      </div>
      <CourseProjectForm {...formProps} />
    </section>
  );
}
