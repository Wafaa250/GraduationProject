import { motion } from "framer-motion";
import { Megaphone, Sparkles, Tag, UserCheck } from "lucide-react";
import { ExperienceSection } from "@/components/landing/ExperienceSection";

function OrganizationsPanel() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-radial opacity-50 blur-2xl" />
      <div className="relative glass rounded-3xl p-6 shadow-elegant">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold">
            G
          </div>
          <div>
            <div className="font-semibold">GreenFuture Org</div>
            <div className="text-xs text-muted-foreground">Volunteer Initiative</div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-1 border border-border/40 p-4 mb-4">
          <div className="text-xs text-muted-foreground mb-2">Opportunity</div>
          <div className="font-medium text-sm mb-2">Community Climate Awareness Campaign</div>
          <div className="flex flex-wrap gap-1.5">
            {["Marketing", "Content Writing", "Photography", "Event Planning"].map((skill) => (
              <span
                key={skill}
                className="text-xs px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-surface-1 border border-border/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-muted-foreground">AI Suggested Volunteers</div>
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
          </div>
          {[
            { name: "Mariam D.", role: "Content Writer", match: 95 },
            { name: "Tariq F.", role: "Photographer", match: 90 },
            { name: "Lina R.", role: "Event Coordinator", match: 87 },
          ].map((person, index) => (
            <motion.div
              key={person.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent" />
                <div>
                  <div className="text-sm font-medium">{person.name}</div>
                  <div className="text-[11px] text-muted-foreground">{person.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gradient-primary">{person.match}%</span>
                <button
                  type="button"
                  className="text-xs px-3 py-1 rounded-md bg-gradient-primary text-white"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrganizationsSection() {
  return (
    <ExperienceSection
      id="organizations"
      reverse
      eyebrow="For Organizations"
      title={
        <>
          Mobilize talent for <span className="text-gradient-primary">meaningful impact</span>
        </>
      }
      subtitle="Whether you need volunteers, members, or specialized contributors — find the right people fast."
      steps={[
        {
          icon: Megaphone,
          title: "Publish an Opportunity",
          desc: "Share your initiative, mission, and time commitment.",
        },
        {
          icon: Tag,
          title: "Define Needed Skills",
          desc: "Specify what each role requires so matches stay relevant.",
        },
        {
          icon: Sparkles,
          title: "AI Suggests Students",
          desc: "Receive a curated shortlist aligned with your goals.",
        },
        {
          icon: UserCheck,
          title: "Accept Volunteers & Members",
          desc: "Onboard contributors with a single click.",
        },
      ]}
      panel={<OrganizationsPanel />}
    />
  );
}
