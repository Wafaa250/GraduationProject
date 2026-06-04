import { motion } from "framer-motion";
import { BookOpen, Brain, Building2, GraduationCap, Search, UserPlus } from "lucide-react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const features = [
  {
    icon: Brain,
    title: "AI Team Formation",
    desc: "Automatically builds balanced teams from skills, interests, and availability.",
  },
  {
    icon: UserPlus,
    title: "Partner Recommendation",
    desc: "Suggests suitable teammates based on shared goals and complementary skills.",
  },
  {
    icon: GraduationCap,
    title: "Supervisor Recommendation",
    desc: "Matches projects with the supervisors most aligned with the work.",
  },
  {
    icon: BookOpen,
    title: "Graduation Project Support",
    desc: "Helps students improve their project planning, scope, and direction.",
  },
  {
    icon: Search,
    title: "Company Recruitment",
    desc: "Helps companies discover qualified students for internships and roles.",
  },
  {
    icon: Building2,
    title: "Organization Talent Discovery",
    desc: "Find volunteers and members with relevant skills for any initiative.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 lg:py-24 relative scroll-mt-28">
      <div className="container">
        <SectionHeading
          eyebrow="Core Features"
          title={
            <>
              Everything you need to{" "}
              <span className="text-gradient-primary">build great teams</span>
            </>
          }
          subtitle="A complete toolkit for students, supervisors, companies, and organizations — powered by intelligent matching."
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index % 4) * 0.06, duration: 0.5 }}
              className="group relative p-5 rounded-2xl bg-surface-2/50 border border-border/50 hover:border-primary/40 transition-all hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-gradient-primary group-hover:border-transparent transition-all">
                <feature.icon
                  className="w-4.5 h-4.5 text-primary-glow group-hover:text-white transition-colors"
                  strokeWidth={2}
                />
              </div>
              <h3 className="font-display font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
