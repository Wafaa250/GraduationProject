import { motion } from "framer-motion";
import {
  Brain,
  Code,
  Database,
  FolderPlus,
  Palette,
  Sparkles,
  Tag,
  UserPlus,
  Users,
} from "lucide-react";
import { ExperienceSection } from "@/components/landing/ExperienceSection";

function StudentsPanel() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-radial opacity-50 blur-2xl" />
      <div className="relative glass rounded-3xl p-6 shadow-elegant">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-primary" />
            <div>
              <div className="text-sm font-semibold">Layla Hassan</div>
              <div className="text-xs text-muted-foreground">CS · Final Year</div>
            </div>
          </div>
          <div className="text-xs px-2 py-1 rounded-md bg-secondary/10 text-secondary">Active</div>
        </div>

        <div className="text-xs text-muted-foreground mb-2">Selected Skills</div>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {[
            { icon: Code, label: "React" },
            { icon: Brain, label: "AI/ML" },
            { icon: Database, label: "PostgreSQL" },
            { icon: Palette, label: "UI/UX" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs"
            >
              <Icon className="w-3 h-3" /> {label}
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-surface-1 border border-border/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-muted-foreground">AI Suggested Teammates</div>
            <div className="text-xs text-primary-glow">View all</div>
          </div>
          {[
            { name: "Omar K.", role: "Backend", score: 96 },
            { name: "Sara M.", role: "Designer", score: 92 },
            { name: "Yusuf A.", role: "ML Engineer", score: 89 },
          ].map((person, index) => (
            <motion.div
              key={person.name}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-secondary" />
                <div>
                  <div className="text-sm font-medium">{person.name}</div>
                  <div className="text-[11px] text-muted-foreground">{person.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-bold text-gradient-primary">{person.score}%</div>
                <button
                  type="button"
                  className="text-xs px-3 py-1 rounded-md bg-gradient-primary text-white"
                >
                  Invite
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentsSection() {
  return (
    <ExperienceSection
      id="students"
      eyebrow="For Students"
      title={
        <>
          Find your <span className="text-gradient-primary">perfect team</span>
        </>
      }
      subtitle="From profile to graduation project, SkillSwap guides every step."
      steps={[
        {
          icon: UserPlus,
          title: "Create Your Profile",
          desc: "Showcase who you are, what you've built, and what you want to learn.",
        },
        {
          icon: Tag,
          title: "Select Your Skills",
          desc: "Pick technical and soft skills so the AI can match you accurately.",
        },
        {
          icon: FolderPlus,
          title: "Create a Graduation Project",
          desc: "Describe your idea, scope, and the kind of teammates you need.",
        },
        {
          icon: Sparkles,
          title: "Get AI Suggestions",
          desc: "Receive ranked teammates and supervisors tailored to your project.",
        },
        {
          icon: Users,
          title: "Form Your Team",
          desc: "Invite, chat, and lock in a balanced team in minutes — not weeks.",
        },
      ]}
      panel={<StudentsPanel />}
    />
  );
}
