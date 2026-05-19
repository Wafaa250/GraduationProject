import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../ui/button";

/** Illustrative match preview — visual only, not live API data. */
const MATCH_PREVIEW = [
  { score: 96, name: "Layla Hassan", role: "Frontend", reason: "Covers UI/UX gap" },
  { score: 92, name: "Omar Khalid", role: "NLP Engineer", reason: "Published NLP paper" },
  { score: 88, name: "Dr. Reem Al-Saadi", role: "Supervisor", reason: "EdTech research overlap" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface" />
      <div className="absolute inset-0 surface-grid opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai-soft px-3 py-1 text-xs font-semibold text-ai">
            <Sparkles className="h-3 w-3" />
            AI matching for university collaboration
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Put the <span className="gradient-text">right person</span> in the right{" "}
            <span className="gradient-text-ai">project</span>.
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            SkillSwap is an AI-powered matching platform for university projects, teams, supervisors,
            companies and student associations — built on skills, not friendships.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-gradient-primary shadow-glow hover:opacity-95">
              <Link to="/register">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#features">Explore matches</a>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Not an LMS · Not attendance · Not grading — a collaboration &amp; matching layer for
            campus.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="relative rounded-3xl border border-border bg-card p-1 shadow-pop">
            <div className="rounded-[1.4rem] bg-gradient-to-br from-card to-background p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {MATCH_PREVIEW.map((m) => (
                  <article
                    key={m.name}
                    className="rounded-2xl border border-border bg-card p-4 shadow-soft"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                        {m.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span className="rounded-full bg-ai-soft px-2 py-0.5 text-[11px] font-bold text-ai">
                        {m.score}%
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                    <p className="mt-2 border-t border-border pt-2 text-[11px] text-ai">
                      <Sparkles className="mr-1 inline h-3 w-3" />
                      {m.reason}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
