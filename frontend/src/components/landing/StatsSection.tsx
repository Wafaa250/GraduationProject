import { motion, useInView } from "framer-motion";
import { FolderKanban, GraduationCap, Sparkles, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 1000, suffix: "+", label: "Students", icon: Users },
  { value: 500, suffix: "+", label: "Projects", icon: FolderKanban },
  { value: 200, suffix: "+", label: "Supervisors", icon: GraduationCap },
  { value: 100, suffix: "%", label: "AI-Powered Matching", icon: Sparkles },
];

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * to));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="py-16 lg:py-24 relative">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="relative group"
            >
              <div className="glass rounded-2xl p-6 lg:p-8 hover:bg-white/[0.06] transition-all hover:-translate-y-1">
                <stat.icon className="w-6 h-6 text-primary-glow mb-4" strokeWidth={1.5} />
                <div className="font-display text-4xl lg:text-5xl font-bold text-gradient">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
