import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Briefcase,
  Building2,
  Code,
  Database,
  GraduationCap,
  Palette,
  Play,
  Sparkles,
  Users,
} from "lucide-react";

export function HeroSection() {
  return (
    <section id="home" className="relative pt-32 lg:pt-40 pb-20 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial opacity-60 pointer-events-none" />

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium mb-6"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <Sparkles className="w-3 h-3 text-primary-glow" />
              <span className="text-muted-foreground">AI-Powered Skill Matching</span>
            </motion.div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Find the Right Team.
              <br />
              <span className="text-gradient-hero">Build Better Projects.</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              SkillSwap intelligently connects students, supervisors, companies, and organizations
              using skills, interests, project requirements, and AI-powered recommendations.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-primary text-white font-semibold rounded-xl shadow-[0_8px_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_12px_40px_hsl(var(--primary)/0.6)] transition-all hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                className="group inline-flex items-center gap-2 px-6 py-3.5 glass rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Demo
              </button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent"
                  />
                ))}
              </div>
              <span>
                Trusted by <span className="text-foreground font-semibold">1,200+</span> students
                &amp; supervisors
              </span>
            </div>
          </motion.div>

          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  const skills = [
    { icon: Code, label: "React", x: "10%", y: "20%" },
    { icon: Brain, label: "AI/ML", x: "75%", y: "10%" },
    { icon: Palette, label: "Design", x: "5%", y: "65%" },
    { icon: Database, label: "Backend", x: "78%", y: "60%" },
  ];
  const roles = [
    { icon: GraduationCap, label: "Student", color: "from-primary to-accent" },
    { icon: Users, label: "Supervisor", color: "from-accent to-secondary" },
    { icon: Briefcase, label: "Company", color: "from-secondary to-primary" },
    { icon: Building2, label: "Organization", color: "from-primary to-secondary" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative aspect-square max-w-[560px] mx-auto"
    >
      <div className="absolute inset-0 bg-gradient-radial animate-glow-pulse" />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" aria-hidden>
        <defs>
          <linearGradient id="hero-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(239 84% 67%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(258 90% 66%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[
          [200, 200, 60, 100],
          [200, 200, 320, 60],
          [200, 200, 50, 280],
          [200, 200, 330, 290],
        ].map(([x1, y1, x2, y2], index) => (
          <motion.line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#hero-line)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
          />
        ))}
      </svg>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-3xl bg-gradient-primary opacity-20 blur-xl"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl glass flex items-center justify-center shadow-[0_0_60px_hsl(var(--primary)/0.6)]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-30" />
        <Brain className="w-10 h-10 text-white relative z-10" strokeWidth={1.5} />
      </div>

      {skills.map((skill, index) => (
        <motion.div
          key={skill.label}
          style={{ left: skill.x, top: skill.y }}
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 4 + index * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.3,
          }}
          className="absolute glass rounded-xl px-3 py-2 flex items-center gap-2 shadow-card"
        >
          <skill.icon className="w-4 h-4 text-primary-glow" />
          <span className="text-xs font-medium">{skill.label}</span>
        </motion.div>
      ))}

      {roles.map((role, index) => {
        const positions = [
          { bottom: "8%", left: "50%", translateX: "-50%" },
          { top: "50%", right: "-2%", translateY: "-50%" },
          { top: "8%", left: "50%", translateX: "-50%" },
          { top: "50%", left: "-2%", translateY: "-50%" },
        ];
        const position = positions[index];
        return (
          <motion.div
            key={role.label}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.15 }}
            style={{
              position: "absolute",
              ...position,
              transform: `translate(${position.translateX ?? "0"}, ${position.translateY ?? "0"})`,
            }}
            className="px-3 py-2 rounded-xl glass flex items-center gap-2 shadow-card"
          >
            <div
              className={`w-7 h-7 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center`}
            >
              <role.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold">{role.label}</span>
          </motion.div>
        );
      })}

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] right-[5%] glass rounded-xl p-3 shadow-elegant min-w-[140px]"
      >
        <div className="text-[10px] text-muted-foreground mb-1">Match Score</div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-gradient-primary">94%</span>
          <span className="text-[10px] text-secondary mb-1">↑ Excellent</span>
        </div>
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "94%" }}
            transition={{ duration: 1.5, delay: 1 }}
            className="h-full bg-gradient-primary"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
