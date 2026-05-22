import { Link } from "react-router-dom";
import { Sparkles, Compass, UserPlus, GraduationCap, Mail } from "lucide-react";
import { initialsFromName } from "../dashboardUtils";

type DashboardHeroProps = {
  greeting: string;
  firstName: string;
  subtitle: string;
  summaryText: string;
  profilePic?: string | null;
  onDiscoverProjects: () => void;
  onFindTeammates: () => void;
  onFindSupervisors: () => void;
  onViewInvitations: () => void;
};

export function DashboardHero({
  greeting,
  firstName,
  subtitle,
  summaryText,
  profilePic,
  onDiscoverProjects,
  onFindTeammates,
  onFindSupervisors,
  onViewInvitations,
}: DashboardHeroProps) {
  const initial = initialsFromName(firstName || "S", 1);

  const actions = [
    { icon: Compass, label: "Discover Projects", onClick: onDiscoverProjects, primary: true },
    { icon: UserPlus, label: "Find Teammates", onClick: onFindTeammates, primary: false },
    { icon: GraduationCap, label: "Find Supervisors", onClick: onFindSupervisors, primary: false },
    { icon: Mail, label: "View Invitations", onClick: onViewInvitations, primary: false },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-hero border border-border p-8 lg:p-10">
      <div className="absolute inset-0 bg-gradient-mesh opacity-80 pointer-events-none" />
      <div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 bottom-0 size-56 rounded-full bg-primary-glow/20 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
        <div className="flex items-start gap-5 flex-1">
          <div className="relative shrink-0">
            {profilePic ? (
              <img
                src={profilePic}
                alt=""
                className="size-20 rounded-2xl object-cover shadow-glow"
              />
            ) : (
              <div className="size-20 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground text-2xl font-display font-bold shadow-glow">
                {initial}
              </div>
            )}
            <div className="absolute -bottom-1.5 -right-1.5 size-7 rounded-full bg-card border-2 border-background grid place-items-center shadow-sm">
              <Sparkles className="size-3.5 text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary-soft px-2.5 py-1 rounded-full mb-3">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              AI match engine · live
            </div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight text-foreground">
              {greeting},{" "}
              <span className="text-gradient">{firstName || "there"}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
            <p className="mt-4 text-[15px] text-foreground/80 max-w-2xl leading-relaxed">
              {summaryText}
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-8 flex flex-wrap gap-2.5">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={
              a.primary
                ? "inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-glow hover:-translate-y-0.5 transition-all"
                : "inline-flex items-center gap-2 bg-card/80 backdrop-blur border border-border text-foreground font-medium text-sm px-4 py-2.5 rounded-xl hover:bg-card hover:border-primary/30 hover:-translate-y-0.5 transition-all"
            }
          >
            <a.icon className="size-4" />
            {a.label}
          </button>
        ))}
        <Link
          to="/edit-profile"
          className="inline-flex items-center gap-2 bg-card/80 backdrop-blur border border-border text-foreground font-medium text-sm px-4 py-2.5 rounded-xl hover:bg-card hover:border-primary/30 hover:-translate-y-0.5 transition-all no-underline"
        >
          Edit profile
        </Link>
      </div>
    </section>
  );
}
