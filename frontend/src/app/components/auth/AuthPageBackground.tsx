/**
 * Decorative auth page atmosphere — matches landing Hero depth without competing with the card.
 */
export function AuthPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-surface" />
      <div className="absolute inset-0 surface-grid opacity-[0.22]" />

      {/* Soft gradient blobs */}
      <div
        className="absolute -right-[10%] -top-[20%] h-[min(28rem,52vw)] w-[min(28rem,52vw)] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(265 75% 55% / 0.16) 0%, hsl(265 75% 55% / 0.04) 45%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-[18%] -left-[12%] h-[min(26rem,48vw)] w-[min(26rem,48vw)] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(195 85% 55% / 0.12) 0%, hsl(195 85% 55% / 0.03) 50%, transparent 72%)",
        }}
      />
      <div
        className="absolute bottom-[8%] right-[6%] h-[min(18rem,36vw)] w-[min(18rem,36vw)] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(270 75% 60% / 0.08) 0%, transparent 68%)",
        }}
      />

      {/* Gentle center glow — keeps focus on the auth card */}
      <div
        className="absolute left-1/2 top-[45%] h-[min(20rem,42vh)] w-[min(32rem,88vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(245 65% 38% / 0.06) 0%, transparent 72%)",
        }}
      />

      {/* Subtle outline shapes — balanced left/right */}
      <div className="absolute left-[8%] top-[18%] hidden h-24 w-24 -rotate-12 rounded-3xl border border-primary/10 opacity-40 sm:block sm:h-28 sm:w-28" />
      <div className="absolute right-[8%] top-[18%] hidden h-24 w-24 rotate-12 rounded-3xl border border-primary/10 opacity-40 sm:block sm:h-28 sm:w-28" />
      <div className="absolute bottom-[16%] left-[10%] h-16 w-16 rounded-full border border-ai/15 opacity-35 sm:h-20 sm:w-20" />
      <div className="absolute bottom-[16%] right-[10%] h-16 w-16 rounded-full border border-ai/15 opacity-35 sm:h-20 sm:w-20" />
      <div className="absolute left-[18%] top-[26%] h-2 w-2 rounded-full bg-primary/25" />
      <div className="absolute right-[18%] top-[26%] h-2 w-2 rounded-full bg-primary/25" />
    </div>
  );
}
