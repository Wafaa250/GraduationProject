import type { LucideIcon } from "lucide-react";

export type InsightMetric = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tint: string;
  icon_color: string;
};

type StudentInsightsProps = {
  metrics: InsightMetric[];
};

export const StudentInsights = ({ metrics }: StudentInsightsProps) => (
  <section aria-labelledby="insights-heading" className="animate-fade-in-up">
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 id="insights-heading" className="text-xl md:text-2xl font-display font-bold tracking-tight">
          Student Insights
        </h2>
        <p className="text-sm text-muted-foreground">Your collaboration signals at a glance.</p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <article
            key={m.label}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-spring"
          >
            <div
              className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${m.tint} blur-2xl opacity-80 group-hover:opacity-100 transition-smooth`}
              aria-hidden
            />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </p>
                <p className="mt-3 font-display text-4xl font-bold tracking-tight">{m.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center ${m.icon_color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);
