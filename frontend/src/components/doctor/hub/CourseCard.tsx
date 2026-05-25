import { Link } from "react-router-dom";
import { ArrowUpRight, Layers, GraduationCap, FolderGit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { doctorCoursePath } from "@/routes/paths";

const toneMap: Record<string, string> = {
  primary: "from-primary/20 to-primary-glow/10 text-primary",
  info: "from-info/20 to-info/5 text-info",
  success: "from-success/20 to-success/5 text-success",
  warning: "from-warning/20 to-warning/5 text-warning",
};

type Course = {
  courseId: number;
  code: string;
  name: string;
  sections: number;
  students: number;
  projects: number;
  color: string;
};

export function CourseCard({ c }: { c: Course }) {
  return (
    <div className="group rounded-2xl border border-border bg-white p-5 shadow-card hover:shadow-elevated hover:border-primary/30 transition-smooth">
      <div className="flex items-start justify-between">
        <div
          className={cn("h-11 w-11 rounded-xl grid place-items-center bg-gradient-to-br", toneMap[c.color])}
        >
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="text-[10.5px] font-semibold tracking-wider text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
          {c.code}
        </span>
      </div>
      <h3 className="mt-3 font-display text-[15px] font-bold text-foreground leading-snug">{c.name}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat icon={<Layers className="h-3 w-3" />} v={c.sections} l="Sections" />
        <Stat icon={<GraduationCap className="h-3 w-3" />} v={c.students} l="Students" />
        <Stat icon={<FolderGit2 className="h-3 w-3" />} v={c.projects} l="Projects" />
      </div>
      <Link
        to={doctorCoursePath(c.courseId)}
        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground text-[12.5px] font-semibold py-2 hover:bg-primary hover:text-primary-foreground transition-smooth"
      >
        Open course <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Stat({ icon, v, l }: { icon: React.ReactNode; v: number; l: string }) {
  return (
    <div className="rounded-lg bg-muted/60 py-1.5">
      <div className="text-[13.5px] font-bold text-foreground">{v}</div>
      <div className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
        {icon}
        {l}
      </div>
    </div>
  );
}
