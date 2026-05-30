import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, MapPin, Pencil, ExternalLink, Compass } from "lucide-react";
import { ROUTES } from "@/routes/paths";

export type StudentOverviewData = {
  name: string;
  major: string;
  year: string;
  university: string;
  skills: string[];
  initials: string;
  photoUrl: string | null;
};

type StudentOverviewProps = {
  student: StudentOverviewData;
};

export const StudentOverview = ({ student }: StudentOverviewProps) => (
  <section
    aria-labelledby="overview-heading"
    className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border shadow-elevated animate-fade-in-up"
  >
    <div className="absolute inset-0 bg-mesh pointer-events-none" aria-hidden />
    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-primary opacity-20 blur-3xl pointer-events-none" aria-hidden />

    <div className="relative p-6 md:p-8 lg:p-10">
      <h2 id="overview-heading" className="sr-only">
        Student Overview
      </h2>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
        <div className="flex items-center gap-5 lg:flex-col lg:items-start">
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-2xl md:text-3xl shadow-glow overflow-hidden">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                student.initials
              )}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-white"
              aria-label="Active"
            />
          </div>
          <div className="lg:hidden">
            <p className="font-display text-xl font-bold">{student.name}</p>
            <p className="text-sm text-muted-foreground">{student.major}</p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="hidden lg:block">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Student Profile
            </p>
            <h3 className="font-display text-3xl xl:text-4xl font-bold tracking-tight">{student.name}</h3>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-foreground/80">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="font-medium">{student.major}</span>
              {student.year ? (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{student.year}</span>
                </>
              ) : null}
            </span>
            <span className="inline-flex items-center gap-1.5 text-foreground/80">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">{student.university}</span>
            </span>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Skills</p>
            <div className="flex flex-wrap gap-2">
              {student.skills.length > 0 ? (
                student.skills.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-smooth cursor-default"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No skills added yet.</span>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-95 hover:shadow-glow transition-smooth gap-2 font-semibold"
              asChild
            >
              <Link to={ROUTES.browseProjects}>
                <Compass className="w-4 h-4" />
                Browse Projects
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 hover:border-primary/50 hover:text-primary transition-smooth"
              asChild
            >
              <Link to={ROUTES.editProfile}>
                <Pencil className="w-4 h-4" />
                Edit Profile
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 hover:border-primary/50 hover:text-primary transition-smooth"
              asChild
            >
              <Link to={ROUTES.profile}>
                <ExternalLink className="w-4 h-4" />
                View Full Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);
