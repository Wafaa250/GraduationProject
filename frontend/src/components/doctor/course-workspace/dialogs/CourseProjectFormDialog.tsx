import { WorkspaceModal } from "@/components/doctor/course-workspace/WorkspaceModal";
import { CourseProjectForm } from "@/components/doctor/course-workspace/CourseProjectForm";
import type { CourseProjectWithTeams } from "@/api/doctorCoursesApi";
import type { CourseSectionView } from "@/hooks/useCourseWorkspace";

type CourseProjectFormDialogProps = {
  open: boolean;
  courseId: number;
  sections: CourseSectionView[];
  project?: CourseProjectWithTeams | null;
  /** When creating from a section workspace, pre-select this section. */
  defaultSectionId?: number;
  onClose: () => void;
  onSaved: () => void;
};

export function CourseProjectFormDialog({
  open,
  courseId,
  sections,
  project,
  defaultSectionId,
  onClose,
  onSaved,
}: CourseProjectFormDialogProps) {
  const isEdit = project != null;

  return (
    <WorkspaceModal
      open={open}
      title={isEdit ? "Edit course project" : "Create course project"}
      description="Configure team formation for students in this course."
      onClose={onClose}
      className="max-w-xl"
    >
      <CourseProjectForm
        active={open}
        courseId={courseId}
        sections={sections}
        project={project}
        defaultSectionId={defaultSectionId}
        onCancel={onClose}
        onSaved={onSaved}
      />
    </WorkspaceModal>
  );
}
