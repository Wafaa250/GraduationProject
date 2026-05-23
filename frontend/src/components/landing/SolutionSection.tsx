import { motion } from "framer-motion";
import {
  Briefcase,
  FileSearch,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const solutions = [
  {
    icon: Sparkles,
    title: "AI Team Generation",
    desc: "Automatically build balanced teams from a candidate pool using skill complementarity.",
  },
  {
    icon: GraduationCap,
    title: "Supervisor Recommendations",
    desc: "Match graduation projects with the supervisors most aligned with the work.",
  },
  {
    icon: Target,
    title: "Skill-Based Matching",
    desc: "Recommendations grounded in real skills, interests, and prior experience.",
  },
  {
    icon: FileSearch,
    title: "Project Analysis",
    desc: "AI parses project briefs to surface required competencies and gaps.",
  },
  {
    icon: Briefcase,
    title: "Talent Discovery",
    desc: "Companies and organizations discover students aligned with their needs.",
  },
  {
    icon: MessageSquare,
    title: "Smart Collaboration",
    desc: "Built-in messaging and notifications keep matched groups moving fast.",
  },
];

export function SolutionSection() {
  return (
    <section className="py-20 lg:py-32 relative">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[500px] bg-gradient-radial opacity-30 pointer-events-none" />
      <div className="container relative">
        <SectionHeading
          eyebrow="The Solution"
          title={
            <>
              How SkillSwap <span className="text-gradient-primary">Solves This</span>
            </>
          }
          subtitle="A unified, AI-powered layer that turns scattered profiles into perfectly composed teams."
        />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {solutions.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.5 }}
              className="group relative p-6 rounded-2xl glass hover:bg-white/[0.06] transition-all hover:-translate-y-1.5 hover:shadow-elegant"
            >
              <div className="relative w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 shadow-[0_8px_30px_hsl(var(--primary)/0.35)] group-hover:scale-110 transition-transform">
                <item.icon className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at top, hsl(239 84% 67% / 0.08), transparent 60%)",
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
