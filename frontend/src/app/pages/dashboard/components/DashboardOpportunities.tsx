import {
  ArrowUpRight,
  Sparkles,
  FolderKanban,
  FlaskConical,
  Building2,
  Trophy,
  LucideIcon,
} from "lucide-react";

type OpportunityItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
  badge: string;
  gradient: string;
  onExplore: () => void;
};

type DashboardOpportunitiesProps = {
  matchedProjectsCount: number;
  onExploreGradProjects: () => void;
  onExploreCourses: () => void;
  onExploreOrganizations: () => void;
  onExploreCommunities: () => void;
};

export function DashboardOpportunities({
  matchedProjectsCount,
  onExploreGradProjects,
  onExploreCourses,
  onExploreOrganizations,
  onExploreCommunities,
}: DashboardOpportunitiesProps) {
  const projectBadge =
    matchedProjectsCount > 0
      ? `${matchedProjectsCount} matched`
      : "From your channels";

  const items: OpportunityItem[] = [
    {
      icon: FolderKanban,
      title: "Graduation Projects",
      desc: "Open teams seeking collaborators across business, design, engineering, and health.",
      badge: projectBadge,
      gradient: "from-primary/80 to-primary-glow",
      onExplore: onExploreGradProjects,
    },
    {
      icon: FlaskConical,
      title: "Research Opportunities",
      desc: "Course projects and partner matching from your enrolled classes.",
      badge: "Course teams",
      gradient: "from-pink-400 to-primary",
      onExplore: onExploreCourses,
    },
    {
      icon: Building2,
      title: "University Organizations",
      desc: "Student-run clubs and societies recruiting leadership and committee roles.",
      badge: "Browse organizations",
      gradient: "from-blue-400 to-primary-glow",
      onExplore: onExploreOrganizations,
    },
    {
      icon: Trophy,
      title: "Innovation Challenges",
      desc: "Communities, events, and recruitment campaigns across campus.",
      badge: "Explore communities",
      gradient: "from-amber-400 to-pink-500",
      onExplore: onExploreCommunities,
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground">
            Discover opportunities
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tailored pathways across the university.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((it) => (
          <article
            key={it.title}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-card hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className={`relative h-32 bg-gradient-to-br ${it.gradient} overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
              <div className="absolute -right-6 -bottom-6 size-32 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute inset-0 grid place-items-center">
                <it.icon
                  className="size-12 text-primary-foreground/90 drop-shadow-md"
                  strokeWidth={1.5}
                />
              </div>
              <div className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold bg-white/25 backdrop-blur text-primary-foreground px-2 py-1 rounded-full">
                <Sparkles className="size-2.5" /> AI relevant
              </div>
            </div>

            <div className="p-5">
              <div className="font-display font-bold text-base text-foreground">{it.title}</div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{it.desc}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-primary bg-primary-soft px-2 py-1 rounded-full truncate">
                  {it.badge}
                </span>
                <button
                  type="button"
                  onClick={it.onExplore}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:text-primary transition-colors shrink-0"
                >
                  Explore <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
