export function LandingHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 mesh-gradient opacity-80" />
      <div className="absolute inset-0 hero-spotlight" />
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-primary/12 blur-[120px]" />
      <div className="absolute -right-24 top-24 h-[360px] w-[360px] rounded-full bg-[hsl(262_80%_62%/_0.08)] blur-[100px]" />
    </div>
  )
}
