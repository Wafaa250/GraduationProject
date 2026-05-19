import { Brain, Building2, GraduationCap, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Brain,
    title: "AI Team Matching",
    description:
      "Built around complementary skills and collaboration fit. Each match explained in plain language.",
  },
  {
    icon: GraduationCap,
    title: "Supervisor Recommendation",
    description:
      "Doctors ranked by research overlap, supervision capacity, and expertise.",
  },
  {
    icon: Building2,
    title: "Company Requests",
    description: "Companies post needs. AI shortlists students and teams ready to deliver.",
  },
  {
    icon: Megaphone,
    title: "Association Teams",
    description: "Form campaign squads with the exact roles you're missing.",
  },
];

export function Features() {
  return (
    <section className="py-20" id="features">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-ai">AI is the heart of it</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Matching, not management.</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every recommendation includes a clear, human-readable explanation — not just a score.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ai-soft text-ai">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display font-semibold">{feature.title}</p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
