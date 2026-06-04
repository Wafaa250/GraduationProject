import { motion } from "framer-motion";
import { Layers, Network, Shield } from "lucide-react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const pillars = [
  {
    icon: Layers,
    title: "Unified workspace",
    desc: "Profiles, projects, recruitment, and organization opportunities live in one place — no scattered spreadsheets or group chats.",
  },
  {
    icon: Network,
    title: "Skill-first graph",
    desc: "Every match starts from declared skills, interests, and requirements so teams and hires reflect real capability.",
  },
  {
    icon: Shield,
    title: "Explainable AI",
    desc: "Ranked recommendations include clear fit signals for teammates, supervisors, candidates, and volunteers.",
  },
];

export function ProductOverviewSection() {
  return (
    <section id="product" className="py-16 lg:py-24 relative scroll-mt-28">
      <div className="container">
        <SectionHeading
          eyebrow="Product"
          title={
            <>
              One platform for{" "}
              <span className="text-gradient-primary">academic &amp; professional matching</span>
            </>
          }
          subtitle="SkillSwap connects the full collaboration loop — from forming graduation teams to company discovery and organization recruiting."
        />

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="p-6 rounded-2xl glass hover:bg-white/[0.06] transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <pillar.icon className="w-5 h-5 text-primary-glow" strokeWidth={1.75} />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
