import { BookOpen, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

type DashboardCourseTeamsCardProps = {
  coursesCount: number | null;
  requestsCount: number | null;
};

export function DashboardCourseTeamsCard({
  coursesCount,
  requestsCount,
}: DashboardCourseTeamsCardProps) {
  const navigate = useNavigate();

  return (
    <section className="bg-card border border-border rounded-3xl p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="size-[18px] text-primary" />
        <h3 className="font-display font-bold text-lg text-foreground">My Courses</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-primary-soft/50 border border-primary/10 p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase">Enrolled courses</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">
            {coursesCount === null ? "—" : coursesCount}
          </p>
        </div>
        <div className="rounded-xl bg-muted/60 border border-border p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase">Partner activity</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">
            {requestsCount === null ? "—" : requestsCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Incoming & outgoing</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        View teams, project settings, classmates, and partner requests for each course.
      </p>
      <button
        type="button"
        onClick={() => navigate("/student/courses")}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-glow transition-all"
      >
        <Users className="size-4" />
        Manage My Courses
      </button>
    </section>
  );
}
