import { motion } from "framer-motion";
import { Mail, Megaphone, Sparkles, UserCheck } from "lucide-react";
import { ExperienceSection } from "@/components/landing/ExperienceSection";

function CompaniesPanel() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-radial opacity-50 blur-2xl" />
      <div className="relative glass rounded-3xl p-6 shadow-elegant">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold">
              N
            </div>
            <div>
              <div className="font-semibold">NovaTech Labs</div>
              <div className="text-xs text-muted-foreground">Project request · Frontend</div>
            </div>
          </div>
          <div className="text-xs px-2 py-1 rounded-md bg-secondary/10 text-secondary border border-secondary/20">
            Open
          </div>
        </div>

        <div className="rounded-xl bg-surface-1 border border-border/40 p-4 mb-4">
          <div className="text-xs text-muted-foreground mb-2">Required Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {["React", "TypeScript", "TailwindCSS", "REST APIs"].map((skill) => (
              <span
                key={skill}
                className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-surface-1 border border-border/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-muted-foreground">AI Recommended Candidates</div>
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
          </div>
          {[
            { name: "Hala Z.", match: 97, tag: "Top match" },
            { name: "Karim S.", match: 91, tag: "Strong" },
            { name: "Nour A.", match: 86, tag: "Good fit" },
          ].map((candidate, index) => (
            <motion.div
              key={candidate.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent" />
                <div>
                  <div className="text-sm font-medium">{candidate.name}</div>
                  <div className="text-[11px] text-muted-foreground">{candidate.tag}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-gradient-primary">{candidate.match}%</div>
                <button type="button" className="text-xs px-3 py-1 rounded-md glass">
                  View
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CompaniesSection() {
  return (
    <ExperienceSection
      id="companies"
      eyebrow="For Companies"
      title={
        <>
          Recruit talent <span className="text-gradient-primary">that actually fits</span>
        </>
      }
      subtitle="Skip the resume pile. SkillSwap surfaces students who match your real requirements."
      steps={[
        {
          icon: Megaphone,
          title: "Publish a Request",
          desc: "Describe the role, skills, and the type of student you're looking for.",
        },
        {
          icon: Sparkles,
          title: "AI Recommends Students",
          desc: "Get ranked candidates based on real skills and project history.",
        },
        {
          icon: UserCheck,
          title: "Review Candidates",
          desc: "Inspect profiles, portfolios, and match reasoning in one place.",
        },
        {
          icon: Mail,
          title: "Contact Talents",
          desc: "View student contact information and connect through external communication channels.",
        },
      ]}
      panel={<CompaniesPanel />}
    />
  );
}
