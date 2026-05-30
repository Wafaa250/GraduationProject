import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Users, FolderKanban } from "lucide-react";
import type { ManageCourseCardModel } from "@/lib/studentManageCourses";

const accentMap: Record<
  ManageCourseCardModel["color"],
  { bar: string; chip: string; ring: string }
> = {
  primary: {
    bar: "bg-gradient-primary",
    chip: "bg-primary-soft text-primary",
    ring: "group-hover:ring-primary/30",
  },
  info: {
    bar: "bg-gradient-to-r from-info to-info/70",
    chip: "bg-info-soft text-info",
    ring: "group-hover:ring-info/30",
  },
  success: {
    bar: "bg-gradient-to-r from-success to-success/70",
    chip: "bg-success-soft text-success",
    ring: "group-hover:ring-success/30",
  },
  warning: {
    bar: "bg-gradient-to-r from-warning to-warning/70",
    chip: "bg-warning-soft text-warning",
    ring: "group-hover:ring-warning/30",
  },
};

type CourseCardProps = {
  course: ManageCourseCardModel;
  onOpen: (courseId: number) => void;
};

export function CourseCard({ course, onOpen }: CourseCardProps) {
  const a = accentMap[course.color];
  const doctorInitials = course.doctor
    .split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("");

  return (
    <article
      className={cn(
        "group relative bg-card border border-border rounded-2xl overflow-hidden shadow-card",
        "hover:shadow-elevated hover:-translate-y-0.5 transition-smooth ring-1 ring-transparent",
        a.ring,
      )}
    >
      <div className={cn("h-1.5 w-full", a.bar)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className={cn("px-2 py-0.5 rounded-md font-semibold tracking-wide", a.chip)}>
                {course.code}
              </span>
              <span>·</span>
              <span>Section {course.section}</span>
            </div>
            <h3 className="mt-2 font-display text-lg font-bold leading-snug">{course.name}</h3>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-[11px] font-bold">
            {doctorInitials}
          </div>
          <div className="text-sm">
            <div className="font-medium text-foreground leading-tight">{course.doctor}</div>
            <div className="text-xs text-muted-foreground">{course.doctorTitle}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{course.students}</span>
            <span className="text-muted-foreground text-xs">Students</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{course.projects}</span>
            <span className="text-muted-foreground text-xs">Projects</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            Enrolled
          </div>
          <Button onClick={() => onOpen(course.courseId)} className="rounded-lg group/btn">
            Open Course
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
