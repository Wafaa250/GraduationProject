import { CheckCircle2, AlertTriangle } from "lucide-react";

const problems = [
  "Teams built on friendships, not skills — gaps show up when the project gets hard.",
  "Supervisor fit is luck, not signal.",
  "Companies and associations have no fast path to the right student talent.",
];

const solutions = [
  "AI builds teams from complementary skills — every match explained in plain language.",
  "Supervisors ranked by research overlap, capacity, and fit.",
  "Post a need; AI shortlists students and teams ready to deliver.",
];

export function ProblemSolution() {
  return (
    <section className="py-20" id="problem-solution">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">The old way vs. SkillSwap</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Campus collaboration, without friendship politics.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Matching should run on skills and project signals — not who you already know.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold">How it works today</h3>
            </div>
            <ul className="space-y-4">
              {problems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-accent-soft/30 p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold">How SkillSwap fixes it</h3>
            </div>
            <ul className="space-y-4">
              {solutions.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
