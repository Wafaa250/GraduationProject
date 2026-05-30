import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, ArrowRight } from "lucide-react";
import { ROUTES } from "@/routes/paths";

type CoursesAreaProps = {
  enrolled: number;
  partners: number;
};

export const CoursesArea = ({ enrolled, partners }: CoursesAreaProps) => (
  <section
    aria-labelledby="courses-heading"
    className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-soft p-6 md:p-7 animate-fade-in-up"
  >
    <div
      className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-accent opacity-10 blur-3xl pointer-events-none"
      aria-hidden
    />

    <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
      <div className="flex-1">
        <h2 id="courses-heading" className="text-xl font-display font-bold tracking-tight">
          Courses Area
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track the courses you're enrolled in and your classroom collaborators.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:gap-4 flex-1 max-w-md w-full">
        <div className="rounded-xl p-4 bg-gradient-card border border-border hover:border-primary/30 hover:shadow-soft transition-smooth">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight">{enrolled}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Enrolled Courses</p>
        </div>
        <div className="rounded-xl p-4 bg-gradient-card border border-border hover:border-accent/30 hover:shadow-soft transition-smooth">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight">{partners}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Partner Activity</p>
        </div>
      </div>

      <div className="lg:shrink-0">
        <Button
          size="lg"
          className="w-full lg:w-auto bg-gradient-primary hover:opacity-95 hover:shadow-glow transition-smooth gap-2 font-semibold"
          asChild
        >
          <Link to={ROUTES.studentCourses}>
            Manage My Courses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);
