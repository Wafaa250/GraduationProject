import { Link } from "react-router-dom";
import { Award, Plus, Sparkles } from "lucide-react";

import { SkillChip } from "../../../components/design-system/SkillChip";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import { StudentOrganizationMembershipsSection } from "../../../components/student/StudentOrganizationMembershipsSection";
import { ProfileCoverHero } from "./ProfileCoverHero";

export type MyProfileViewProps = {
  name: string;
  major?: string;
  academicYear?: string;
  university?: string;
  bio?: string;
  availability?: string;
  lookingFor?: string;
  profilePic?: string | null;
  generalSkills: string[];
  majorSkills: string[];
  completeness: number;
  profileTasks: { label: string; done: boolean }[];
  onAddSkill: () => void;
};

export function MyProfileView({
  name,
  major,
  academicYear,
  university,
  bio,
  availability,
  lookingFor,
  profilePic,
  generalSkills,
  majorSkills,
  completeness,
  profileTasks,
  onAddSkill,
}: MyProfileViewProps) {
  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  const headline = [academicYear, major].filter(Boolean).join(" · ");
  return (
    <>
      <ProfileCoverHero
        className="mb-14 sm:mb-20"
        variant="owner"
        displayName={name}
        headline={headline || undefined}
        campusLabel={university || undefined}
        avatarUrl={profilePic}
        initials={initials}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-2 font-display font-semibold">About</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {bio?.trim() ||
                "Tell teammates about yourself — add a bio from Edit profile to help AI matching."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display font-semibold">Skills</h2>
              <Button variant="ghost" size="sm" onClick={onAddSkill} type="button">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              I have
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {generalSkills.length === 0 && majorSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills yet.</p>
              ) : (
                <>
                  {generalSkills.map((s) => (
                    <SkillChip key={`g-${s}`} label={s} variant="have" />
                  ))}
                  {majorSkills.map((s) => (
                    <SkillChip key={`m-${s}`} label={s} variant="have" />
                  ))}
                </>
              )}
            </div>
            {lookingFor ? (
              <>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Looking for
                </p>
                <div className="flex flex-wrap gap-2">
                  <SkillChip label={lookingFor} variant="need" />
                </div>
              </>
            ) : null}
            <p className="mt-4">
              <Link
                to="/edit-profile#skills"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Manage skills in Edit profile →
              </Link>
            </p>
          </div>

          <StudentOrganizationMembershipsSection
            cardStyle={{
              borderRadius: 16,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              padding: 24,
              boxShadow: "var(--shadow-soft)",
            }}
            titleStyle={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 16,
            }}
            mutedStyle={{ margin: 0, fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}
          />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-ai/20 bg-ai-soft/60 p-4">
            <div className="flex items-center gap-2 text-ai">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">AI readiness</p>
            </div>
            <p className="mt-2 font-display text-3xl font-bold gradient-text-ai">{completeness}%</p>
            <Progress
              value={completeness}
              className="mt-2 bg-ai/10 [&>[data-slot=progress-indicator]]:bg-gradient-ai"
            />
            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              {profileTasks.map((task) => (
                <li key={task.label} className={task.done ? "" : "text-foreground/80"}>
                  {task.done ? "✓" : "○"} {task.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" />
              <p className="font-display text-sm font-semibold">Collaboration history</p>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground">
                <b className="text-foreground">Teams & projects</b> appear here as you collaborate on
                SkillSwap.
              </p>
              <p className="rounded-lg bg-muted p-2 italic text-muted-foreground">
                Complete your profile to unlock better AI teammate recommendations.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
