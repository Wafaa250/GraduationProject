import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const rows = [
  {
    topic: "Team formation",
    traditional: "Friendship groups and guesswork",
    skillswap: "Skill-balanced teams with AI suggestions",
  },
  {
    topic: "Supervisor fit",
    traditional: "Weeks of informal outreach",
    skillswap: "Ranked supervisors matched to project scope",
  },
  {
    topic: "Company hiring",
    traditional: "Resume piles with weak skill signal",
    skillswap: "Requests matched to student skill profiles",
  },
  {
    topic: "Organizations",
    traditional: "Manual volunteer coordination",
    skillswap: "Opportunity posts with curated shortlists",
  },
];

export function WhySkillSwapSection() {
  return (
    <section id="why" className="py-16 lg:py-24 relative scroll-mt-28">
      <div className="container">
        <SectionHeading
          eyebrow="Why SkillSwap"
          title={
            <>
              Traditional matching vs{" "}
              <span className="text-gradient-primary">skill-based collaboration</span>
            </>
          }
          subtitle="See how SkillSwap replaces chance-based teaming with structured, explainable recommendations."
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 rounded-2xl glass overflow-hidden border border-border/50"
        >
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-px bg-border/40 text-sm min-w-[320px]">
            <div className="bg-surface-2/80 p-4 font-medium text-muted-foreground" />
            <div className="bg-surface-2/80 p-4 font-semibold flex items-center gap-2">
              <X className="w-4 h-4 text-destructive shrink-0" />
              Traditional
            </div>
            <div className="bg-surface-2/80 p-4 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-secondary shrink-0" />
              SkillSwap
            </div>
            {rows.map((row) => (
              <div key={row.topic} className="contents">
                <div className="bg-background/80 p-4 font-medium border-t border-border/30">
                  {row.topic}
                </div>
                <div className="bg-background/60 p-4 text-muted-foreground border-t border-border/30">
                  {row.traditional}
                </div>
                <div className="bg-background/80 p-4 border-t border-border/30">{row.skillswap}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
