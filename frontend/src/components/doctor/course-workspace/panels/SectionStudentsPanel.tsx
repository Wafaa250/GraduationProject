import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, GraduationCap, Upload, User, UserMinus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import { AddStudentsDialog } from "@/components/doctor/course-workspace/dialogs/AddStudentsDialog";
import { ImportStudentsDialog } from "@/components/doctor/course-workspace/dialogs/ImportStudentsDialog";
import { MoveSectionDialog } from "@/components/doctor/course-workspace/dialogs/MoveSectionDialog";
import type { CourseEnrolledStudent } from "@/api/doctorCoursesApi";
import { removeStudentFromSection } from "@/api/doctorCoursesApi";
import type { SectionWorkspacePanelProps } from "@/components/doctor/course-workspace/types";
import { getStudentAssignmentContext } from "@/components/doctor/course-workspace/courseWorkspaceUtils";
import { doctorStudentPath } from "@/routes/paths";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { initialsFromName } from "@/lib/doctorHubMappers";

const MAX_SKILL_CHIPS = 4;

export function SectionStudentsPanel({ section, bundle, bundleLoading, onReload }: SectionWorkspacePanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [moveStudent, setMoveStudent] = useState<CourseEnrolledStudent | null>(null);

  const sectionId = section.sectionId;
  const allSections = bundle?.allSections ?? [];
  const sectionOnly = bundle?.section ? [bundle.section] : [];
  const students = bundle?.students ?? [];
  const canMove = allSections.length > 1;

  const assignmentBundle = bundle
    ? { sections: bundle.allSections, students: bundle.students, courseProjects: bundle.courseProjects, teams: bundle.teams }
    : null;

  const handleRemove = async (student: CourseEnrolledStudent) => {
    if (!student.sectionId) return;
    if (!window.confirm(`Remove ${student.name ?? "this student"} from this section?`)) return;
    try {
      await removeStudentFromSection(student.sectionId, student.studentId);
      toast({ title: "Student removed from section" });
      onReload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not remove student",
        description: parseApiErrorMessage(err),
      });
    }
  };

  if (bundleLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl border border-border/60 bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          <Users className="mr-1 inline h-3.5 w-3.5" />
          <span className="font-medium tabular-nums text-foreground">{students.length}</span> enrolled in this
          section
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add student
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <CourseWorkspaceEmptyState
          icon={GraduationCap}
          title="No students in this section"
          description="Add or import students by university ID to enroll them in this section."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Add student
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
          }
        />
      ) : (
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
          {students.map((student) => {
            const assignment = getStudentAssignmentContext(student, assignmentBundle);
            const skills = (student.skills ?? []).slice(0, MAX_SKILL_CHIPS);
            const profilePath =
              student.userId != null && student.userId > 0 ? doctorStudentPath(student.userId) : null;

            return (
              <div
                key={student.studentId}
                className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {initialsFromName(student.name ?? "?")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{student.name ?? "Student"}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {student.major ? `${student.major} · ` : ""}
                    {student.universityId ?? "—"}
                  </div>
                  {assignment ? (
                    <div className="mt-0.5 truncate text-[11px] text-foreground/80">
                      {assignment.label}
                      {assignment.detail ? (
                        <span className="text-muted-foreground"> · {assignment.detail}</span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      Not assigned to a course project team
                    </div>
                  )}
                  {skills.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  {profilePath ? (
                    <Link
                      to={profilePath}
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:bg-secondary"
                    >
                      <User className="h-3 w-3" />
                      Profile
                    </Link>
                  ) : null}
                  {canMove ? (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:bg-secondary"
                      onClick={() => setMoveStudent(student)}
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Move
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(student)}
                  >
                    <UserMinus className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddStudentsDialog
        open={addOpen}
        sections={sectionOnly}
        fixedSectionId={sectionId}
        onClose={() => setAddOpen(false)}
        onSaved={onReload}
      />
      <ImportStudentsDialog
        open={importOpen}
        sections={sectionOnly}
        fixedSectionId={sectionId}
        onClose={() => setImportOpen(false)}
        onSaved={onReload}
        onUseManualAdd={() => setAddOpen(true)}
      />
      <MoveSectionDialog
        open={moveStudent != null}
        student={moveStudent}
        sections={allSections}
        onClose={() => setMoveStudent(null)}
        onSaved={onReload}
      />
    </div>
  );
}
