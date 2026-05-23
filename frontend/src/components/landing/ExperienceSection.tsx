import { motion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { SectionHeading } from "@/components/landing/SectionHeading";

export type ExperienceSectionProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  steps: { icon: LucideIcon; title: string; desc: string }[];
  panel: ReactNode;
  reverse?: boolean;
};

export function ExperienceSection({
  id,
  eyebrow,
  title,
  subtitle,
  steps,
  panel,
  reverse,
}: ExperienceSectionProps) {
  return (
    <section id={id} className="py-20 lg:py-32 relative">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div
          className={`mt-14 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
            reverse ? "lg:[&>*:first-child]:order-2" : ""
          }`}
        >
          <motion.div
            initial={{ opacity: 0, x: reverse ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-4"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group flex gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl glass flex items-center justify-center group-hover:bg-gradient-primary transition-all">
                  <step.icon
                    className="w-5 h-5 text-primary-glow group-hover:text-white"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <div className="font-semibold mb-1 flex items-center gap-2">
                    {step.title}
                    <Check className="w-3.5 h-3.5 text-secondary" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {panel}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
