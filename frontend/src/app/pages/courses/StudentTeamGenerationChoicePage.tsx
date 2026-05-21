import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Bot, Clock, Users } from "lucide-react";

import api from "../../../api/axiosInstance";
import { normalizeCourseProject, type CourseProjectRaw } from "./components/studentCourseHelpers";
import { StudentCourseSubpageShell } from "./components/StudentCourseSubpageShell";
import { CourseHubEmptyState } from "./components/courseHub/CourseHubEmptyState";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

export default function StudentTeamGenerationChoicePage() {
  const { courseId, projectId: pathProjectId } = useParams<{ courseId?: string; projectId?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const safeCourseId = Number(courseId ?? 0);
  const safeProjectId = Number(
    pathProjectId ?? searchParams.get("projectId") ?? 0,
  );
  const state = location.state as { projectTitle?: string } | null;
  const [projectTitle, setProjectTitle] = useState(state?.projectTitle?.trim() || "");
  const [aiMode, setAiMode] = useState<"doctor" | "student" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!safeCourseId || !safeProjectId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .get<CourseProjectRaw[]>(`/courses/${safeCourseId}/projects`)
      .then((res) => {
        if (cancelled) return;
        const list = (res.data ?? []).map(normalizeCourseProject);
        const p = list.find((x) => x.id === safeProjectId);
        if (p) {
          setProjectTitle((prev) => prev || p.title);
          setAiMode(p.aiMode);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [safeCourseId, safeProjectId]);

  const title = projectTitle || `Project #${safeProjectId}`;

  return (
    <StudentCourseSubpageShell
      backTo={`/student/courses/${safeCourseId}?tab=projects`}
      backLabel="Back to course"
      eyebrow="Form your team"
      title={title}
      description="Choose how you want to build your team for this project."
    >
      {loading ? (
        <div className="h-72 animate-pulse rounded-3xl bg-muted/60" />
      ) : aiMode === "doctor" ? (
        <CourseHubEmptyState
          icon={<Clock className="h-6 w-6" />}
          title="Waiting for doctor to generate teams"
          description="Your doctor will assign teams for this project. You'll see your team as soon as it's ready."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <ChoiceCard
            to={`/student/courses/${safeCourseId}/projects/${safeProjectId}/manual-team`}
            state={{ projectTitle: title }}
            icon={<Users className="h-6 w-6" />}
            title="Pick teammates manually"
            description="Browse classmates, view their skills, and send invitations to people you want to work with."
            cta="Browse classmates"
          />
          <ChoiceCard
            to={`/student/courses/${safeCourseId}/projects/${safeProjectId}/ai-team`}
            state={{ projectTitle: title }}
            icon={<Bot className="h-6 w-6" />}
            title="Get AI recommendations"
            description="Let SkillSwap suggest classmates whose skills complement yours, ranked by match score."
            cta="See recommendations"
            highlight
          />
        </div>
      )}
    </StudentCourseSubpageShell>
  );
}

function ChoiceCard({
  to,
  state,
  icon,
  title,
  description,
  cta,
  highlight,
}: {
  to: string;
  state?: { projectTitle?: string };
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`group relative overflow-hidden border-border p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant ${
        highlight ? "bg-gradient-soft" : ""
      }`}
    >
      {highlight ? (
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
      ) : null}
      <div className="relative space-y-5">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant={highlight ? "gradient" : "outline"} className="shadow-glow" asChild>
          <Link to={to} state={state}>
            {cta}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
