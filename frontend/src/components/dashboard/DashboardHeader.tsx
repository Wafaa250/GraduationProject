import { Sparkles } from "lucide-react";

export const DashboardHeader = () => (
  <header className="mb-8 md:mb-10 animate-fade-in-up">
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-border shadow-sm">
        <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold tracking-tight text-sm">SkillSwap</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">· University Collaboration, powered by AI</span>
      </div>
    </div>
    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">
      Student <span className="text-gradient">Dashboard</span>
    </h1>
    <p className="mt-2 text-muted-foreground text-sm md:text-base max-w-xl">
      Welcome back — here's your collaboration snapshot, matched projects, and team activity at a glance.
    </p>
  </header>
);