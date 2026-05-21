import { BookOpen, Inbox } from "lucide-react";

import type { EnrolledCourse } from "../../../../api/studentCoursesApi";
import { getCourseId } from "../../../../utils/normalize";
import { cn } from "../../../components/ui/utils";
import { asText } from "./studentCourseHelpers";

export type StudentCoursesSidebarProps = {
  courses: EnrolledCourse[];
  selectedCourseId: number | null;
  onSelectCourse: (courseId: number) => void;
};

export function StudentCoursesSidebar({
  courses,
  selectedCourseId,
  onSelectCourse,
}: StudentCoursesSidebarProps) {
  return (
    <aside className="rounded-2xl border border-border bg-card p-4 shadow-soft lg:sticky lg:top-4 lg:self-start">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Enrolled courses
      </h2>

      {courses.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-semibold text-foreground">No enrolled courses yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Once you enroll in courses, they will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {courses.map((course) => {
            const cid = getCourseId(course);
            if (cid == null) return null;
            const active = selectedCourseId === cid;
            return (
              <button
                key={cid}
                type="button"
                onClick={() => onSelectCourse(cid)}
                className={cn(
                  "w-full rounded-xl border px-3.5 py-3 text-left transition-all",
                  active
                    ? "border-primary/30 bg-primary/10 shadow-soft ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-primary/20 hover:bg-muted/40",
                )}
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BookOpen
                    className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                  />
                  <span className="truncate">{asText(course.name)}</span>
                </p>
                <p className="mt-1 pl-6 text-[11px] font-bold text-primary">{asText(course.code)}</p>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
