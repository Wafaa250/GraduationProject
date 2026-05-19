import {
  Brain,
  CheckCircle2,
  FolderKanban,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const steps: {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    number: "01",
    title: "Build profile",
    description: "Skills, interests, and what you're looking for.",
    icon: UserCircle,
  },
  {
    number: "02",
    title: "Post or browse",
    description:
      "Projects, supervision requests, and collaboration opportunities — all in one place.",
    icon: FolderKanban,
  },
  {
    number: "03",
    title: "AI analyzes",
    description: "Profile + project signals scored together.",
    icon: Brain,
  },
  {
    number: "04",
    title: "Get matched",
    description:
      "Teammates, supervisors, companies, and campaigns — with reasons, not just scores.",
    icon: Users,
  },
  {
    number: "05",
    title: "Collaborate",
    description: "Invite, accept, and start working — together.",
    icon: CheckCircle2,
  },
];

export function HowItWorks() {
  return (
    <section className="py-20" id="how-it-works">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            From profile to collaboration — in five simple steps.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                key={step.number}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-pop"
              >
                <p className="font-display text-3xl font-bold gradient-text">{step.number}</p>
                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-ai-soft text-ai">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display font-semibold">{step.title}</p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
