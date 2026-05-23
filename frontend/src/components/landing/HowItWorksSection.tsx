import { motion } from "framer-motion";
import { Brain, FileText, Sparkles, UserCircle } from "lucide-react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const steps = [
  {
    n: "01",
    icon: UserCircle,
    title: "Create Profile",
    desc: "Students add their skills, interests, and prior experience.",
  },
  {
    n: "02",
    icon: FileText,
    title: "Submit Needs",
    desc: "Post a project, recruitment request, or organization opportunity.",
  },
  {
    n: "03",
    icon: Brain,
    title: "AI Analysis",
    desc: "Our engine analyzes skills, profiles, and requirements.",
  },
  {
    n: "04",
    icon: Sparkles,
    title: "Get Recommendations",
    desc: "Receive intelligent matches: teams, partners, supervisors, candidates.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="py-20 lg:py-32 relative">
      <div className="container">
        <SectionHeading
          eyebrow="How It Works"
          title={
            <>
              Four steps to <span className="text-gradient-primary">perfect matches</span>
            </>
          }
          subtitle="From profile creation to AI-driven recommendations, the journey is seamless."
        />

        <div className="mt-16 relative">
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="grid lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12, duration: 0.6 }}
                className="relative text-center lg:px-4"
              >
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-40" />
                  <div className="relative w-24 h-24 rounded-2xl glass flex items-center justify-center">
                    <step.icon className="w-9 h-9 text-primary-glow" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-primary text-white text-xs font-bold">
                    {step.n}
                  </div>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
