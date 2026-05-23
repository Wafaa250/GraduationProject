import { motion } from "framer-motion";
import { Building2, EyeOff, Scale, Search, TrendingDown, UserX } from "lucide-react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const problems = [
  {
    icon: UserX,
    title: "Friendship-Based Teams",
    desc: "Students pick teammates by friendship, not by complementary skills.",
  },
  {
    icon: EyeOff,
    title: "Skills Are Ignored",
    desc: "Real competencies and interests rarely influence how teams form.",
  },
  {
    icon: Scale,
    title: "Unbalanced Groups",
    desc: "Teams end up missing critical roles or stacked on a single discipline.",
  },
  {
    icon: TrendingDown,
    title: "Weaker Outcomes",
    desc: "Projects underperform because the right people never met.",
  },
  {
    icon: Search,
    title: "Hard To Find Supervisors",
    desc: "Matching projects with the right supervisor takes weeks of guesswork.",
  },
  {
    icon: Building2,
    title: "Talent Stays Hidden",
    desc: "Companies and organizations can't discover qualified students.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 lg:py-32 relative">
      <div className="container">
        <SectionHeading
          eyebrow="The Problem"
          title={
            <>
              Why Traditional Team <span className="text-gradient-primary">Formation Fails</span>
            </>
          }
          subtitle="Academic and professional collaboration is broken by chance, friendships, and missing information."
        />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.5 }}
              className="group relative p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-destructive/30 transition-all hover:-translate-y-1"
            >
              <div className="w-11 h-11 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                <problem.icon className="w-5 h-5 text-destructive" strokeWidth={1.75} />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{problem.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{problem.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
