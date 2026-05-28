import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightLeft,
  ChevronDown,
  GraduationCap,
  Upload,
  User,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import { AddStudentsDialog } from "@/components/doctor/course-workspace/dialogs/AddStudentsDialog";
import { ImportStudentsDialog } from "@/components/doctor/course-workspace/dialogs/ImportStudentsDialog";
import { MoveSectionDialog } from "@/components/doctor/course-workspace/dialogs/MoveSectionDialog";
import type { CourseEnrolledStudent } from "@/api/doctorCoursesApi";
import { removeStudentFromSection } from "@/api/doctorCoursesApi";
import type { CourseWorkspacePanelProps } from "@/components/doctor/course-workspace/types";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { cn } from "@/lib/utils";
import {
  getStudentAssignmentContext,
  getStudentSectionName,
} from "@/components/doctor/course-workspace/courseWorkspaceUtils";
import { doctorStudentPath } from "@/routes/paths";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

const MAX_SKILL_CHIPS = 4;

type StudentSectionGroup = {
  sectionKey: string;
  sectionName: string;
  sectionId: number | null;
  students: CourseEnrolledStudent[];
};

export function StudentsPanel({ bundle, bundleLoading, onReload }: CourseWorkspacePanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [moveStudent, setMoveStudent] = useState<CourseEnrolledStudent | null>(null);
  const [addDefaultSectionId, setAddDefaultSectionId] = useState<number | null>(null);

  const grouped = useMemo((): StudentSectionGroup[] => {
    const students = bundle?.students ?? [];
    const sections = bundle?.sections ?? [];
    const bySection = new Map<number | "unassigned", CourseEnrolledStudent[]>();

    for (const student of students) {
      const key = student.sectionId ?? "unassigned";
      const list = bySection.get(key) ?? [];
      list.push(student);
      bySection.set(key, list);
    }

    const sectionGroups: StudentSectionGroup[] = sections.map((section) => ({
      sectionKey: String(section.id),
      sectionName: section.name,
      sectionId: section.id,
      students: bySection.get(section.id) ?? [],
    }));

    if ((bySection.get("unassigned")?.length ?? 0) > 0) {
      sectionGroups.push({
        sectionKey: "unassigned",
        sectionName: "No section assigned",
        sectionId: null,
        students: bySection.get("unassigned") ?? [],
      });
    }

    return sectionGroups.filter((group) => group.students.length > 0);
  }, [bundle]);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isSectionOpen = (key: string) => open[key] !== false;

  const handleRemove = async (student: CourseEnrolledStudent) => {
    if (!student.sectionId) return;
    if (!window.confirm(`Remove ${student.name ?? "this student"} from the course?`)) return;
    try {
      await removeStudentFromSection(student.sectionId, student.studentId);
      toast({ title: "Student removed from course" });
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
          <div key={index} className="h-28 animate-pulse rounded-xl border border-border/60 bg-card" />
        ))}
      </div>
    );
  }

  const totalStudents = bundle?.students.length ?? 0;
  const sections = bundle?.sections ?? [];

  if (totalStudents === 0 && sections.length === 0) {
    return (
      <>
        <CourseWorkspaceEmptyState
          icon={GraduationCap}
          title="No students enrolled"
          description="Add students by university ID once you have created a section."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setAddOpen(true)} disabled={sections.length === 0}>
            <UserPlus className="h-4 w-4" />
            Add student
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import students
          </Button>
        </div>
        <AddStudentsDialog
          open={addOpen}
          sections={sections}
          onClose={() => setAddOpen(false)}
          onSaved={onReload}
        />
        <ImportStudentsDialog
          open={importOpen}
          sections={sections}
          onClose={() => setImportOpen(false)}
          onSaved={onReload}
          onUseManualAdd={() => setAddOpen(true)}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          <Users className="mr-1 inline h-3.5 w-3.5" />
          <span className="font-medium tabular-nums text-foreground">{totalStudents}</span> enrolled
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setAddDefaultSectionId(null);
              setAddOpen(true);
            }}
            disabled={sections.length === 0}
          >
            <UserPlus className="h-4 w-4" />
            Add student
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {totalStudents === 0 ? (
        <CourseWorkspaceEmptyState
          icon={GraduationCap}
          title="No students enrolled"
          description="Enroll students into a section using their university ID."
          compact
        />
      ) : (
        <div className="space-y-3">
          {grouped.map((group) => {
            const isOpen = isSectionOpen(group.sectionKey);
            return (
              <div
                key={group.sectionKey}
                className="overflow-hidden rounded-xl border border-border/70 bg-card"
              >
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setOpen((prev) => ({
                        ...prev,
                        [group.sectionKey]: !isSectionOpen(group.sectionKey),
                      }))
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-80"
                  >
                    <span className="text-sm font-semibold">{group.sectionName}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {group.students.length} student{group.students.length === 1 ? "" : "s"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {group.sectionId != null ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 shrink-0 text-xs"
                      onClick={() => {
                        setAddDefaultSectionId(group.sectionId);
                        setAddOpen(true);
                      }}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
                {isOpen ? (
                  <div className="divide-y divide-border/60 border-t border-border/70">
                    {group.students.map((student) => {
                      const assignment = getStudentAssignmentContext(student, bundle);
                      const sectionName = getStudentSectionName(student, bundle) ?? group.sectionName;
                      const skills = (student.skills ?? []).slice(0, MAX_SKILL_CHIPS);
                      const profilePath =
                        student.userId != null && student.userId > 0
                          ? doctorStudentPath(student.userId)
                          : null;

                      return (
                        <div
                          key={student.studentId}
                          className="flex items-start gap-3 px-4 py-2.5 hover:bg-secondary/40"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {initialsFromName(student.name ?? "?")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{student.name ?? "Student"}</div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {sectionName}
                              {student.major ? ` · ${student.major}` : ""}
                              {student.universityId ? ` · ${student.universityId}` : ""}
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
                            {student.sectionId != null && sections.length > 1 ? (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:bg-secondary"
                                onClick={() => setMoveStudent(student)}
                              >
                                <ArrowRightLeft className="h-3 w-3" />
                                Move
                              </button>
                            ) : null}
                            {student.sectionId != null ? (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemove(student)}
                              >
                                <UserMinus className="h-3 w-3" />
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <AddStudentsDialog
        open={addOpen}
        sections={sections}
        defaultSectionId={addDefaultSectionId}
        onClose={() => {
          setAddOpen(false);
          setAddDefaultSectionId(null);
        }}
        onSaved={onReload}
      />
      <ImportStudentsDialog
        open={importOpen}
        sections={sections}
        defaultSectionId={addDefaultSectionId}
        onClose={() => setImportOpen(false)}
        onSaved={onReload}
        onUseManualAdd={() => setAddOpen(true)}
      />
      <MoveSectionDialog
        open={moveStudent != null}
        student={moveStudent}
        sections={sections}
        onClose={() => setMoveStudent(null)}
        onSaved={onReload}
      />
    </div>
  );
}
