import { motion } from "framer-motion";
import { Activity, ClipboardList, FolderPlus, GraduationCap, Sparkles } from "lucide-react";
import { ExperienceSection } from "@/components/landing/ExperienceSection";

function DoctorsPanel() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-radial opacity-50 blur-2xl" />
      <div className="relative glass rounded-3xl p-6 shadow-elegant">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-muted-foreground">Supervisor Dashboard</div>
            <div className="font-semibold">Dr. Ahmad Mansour</div>
          </div>
          <div className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary-glow border border-primary/20">
            5 Projects
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Teams", value: 8 },
            { label: "Pending", value: 3 },
            { label: "Reviews", value: 12 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-surface-1 border border-border/40 p-3 text-center"
            >
              <div className="text-2xl font-bold text-gradient-primary">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-surface-1 border border-border/40 p-4">
          <div className="text-xs text-muted-foreground mb-3">Active Projects</div>
          {[
            { name: "AI Medical Imaging", progress: 78, team: 4 },
            { name: "Smart City IoT", progress: 52, team: 5 },
            { name: "EdTech Platform", progress: 35, team: 3 },
          ].map((project, index) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="py-2.5 border-b border-border/30 last:border-0"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{project.name}</span>
                <span className="text-[11px] text-muted-foreground">{project.team} members</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${project.progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                  className="h-full bg-gradient-primary"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DoctorsSection() {
  return (
    <ExperienceSection
      id="doctors"
      reverse
      eyebrow="For Doctors & Supervisors"
      title={
        <>
          Supervise smarter, <span className="text-gradient-primary">not harder</span>
        </>
      }
      subtitle="A focused workspace to oversee projects, review students, and trust AI for team formation."
      steps={[
        {
          icon: FolderPlus,
          title: "Create Projects",
          desc: "Define topics, scope, and the team profile you want to attract.",
        },
        {
          icon: Activity,
          title: "Monitor Teams",
          desc: "Track team progress, communication, and shared project files in one place.",
        },
        {
          icon: ClipboardList,
          title: "Review Students",
          desc: "Read profiles, prior work, and skill maps at a glance.",
        },
        {
          icon: Sparkles,
          title: "Generate AI Teams",
          desc: "Let SkillSwap propose balanced teams from your applicant pool.",
        },
        {
          icon: GraduationCap,
          title: "Recommend Supervisors",
          desc: "Suggest colleagues better suited to specific projects.",
        },
      ]}
      panel={<DoctorsPanel />}
    />
  );
}
