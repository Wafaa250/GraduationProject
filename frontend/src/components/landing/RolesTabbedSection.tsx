import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Brain,
  ClipboardList,
  Code,
  Database,
  FolderPlus,
  Mail,
  Megaphone,
  Palette,
  Sparkles,
  Tag,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { hashToRole, type RoleTabId } from "@/lib/landingNav";

const tabs: { id: RoleTabId; label: string }[] = [
  { id: "students", label: "Students" },
  { id: "doctors", label: "Doctors" },
  { id: "companies", label: "Companies" },
  { id: "organizations", label: "Organizations" },
];

type RoleContent = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  steps: { icon: LucideIcon; title: string; desc: string }[];
  panel: ReactNode;
};

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
          ].map((person) => (
            <div key={person.name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-secondary" />
                <div>
                  <div className="text-sm font-medium">{person.name}</div>
                  <div className="text-[11px] text-muted-foreground">{person.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-bold text-gradient-primary">{person.score}%</div>
                <span className="text-xs px-3 py-1 rounded-md bg-gradient-primary text-white">
                  Invite
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          ].map((project) => (
            <div key={project.name} className="py-2.5 border-b border-border/30 last:border-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{project.name}</span>
                <span className="text-[11px] text-muted-foreground">{project.team} members</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          ].map((candidate) => (
            <div
              key={candidate.name}
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
                <span className="text-xs px-3 py-1 rounded-md glass">View</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          ].map((person) => (
            <div
              key={person.name}
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
                <span className="text-xs px-3 py-1 rounded-md bg-gradient-primary text-white">
                  Accept
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const roleContent: Record<RoleTabId, RoleContent> = {
  students: {
    eyebrow: "For Students",
    title: (
      <>
        Find your <span className="text-gradient-primary">perfect team</span>
      </>
    ),
    subtitle: "From profile to graduation project — one workspace built for how students actually form teams.",
    steps: [
      {
        icon: UserPlus,
        title: "Create Your Profile",
        desc: "Showcase who you are, what you've built, and what you want to learn.",
      },
      {
        icon: Tag,
        title: "Select Your Skills",
        desc: "Pick technical and soft skills so matching stays accurate.",
      },
      {
        icon: FolderPlus,
        title: "Launch Your Project",
        desc: "Describe your idea, scope, and the teammates you need.",
      },
      {
        icon: Users,
        title: "Form Your Team",
        desc: "Invite ranked teammates and supervisors in minutes — not weeks.",
      },
    ],
    panel: <StudentsPanel />,
  },
  doctors: {
    eyebrow: "For Doctors & Supervisors",
    title: (
      <>
        Supervise smarter, <span className="text-gradient-primary">not harder</span>
      </>
    ),
    subtitle: "Oversee projects, review students, and let AI propose balanced teams from your applicant pool.",
    steps: [
      {
        icon: FolderPlus,
        title: "Create Projects",
        desc: "Define topics, scope, and the team profile you want to attract.",
      },
      {
        icon: Activity,
        title: "Monitor Teams",
        desc: "Track progress, communication, and shared files in one place.",
      },
      {
        icon: ClipboardList,
        title: "Review Students",
        desc: "Read profiles, prior work, and skill maps at a glance.",
      },
      {
        icon: Sparkles,
        title: "Generate AI Teams",
        desc: "Get balanced team proposals from your applicant pool.",
      },
    ],
    panel: <DoctorsPanel />,
  },
  companies: {
    eyebrow: "For Companies",
    title: (
      <>
        Recruit talent <span className="text-gradient-primary">that actually fits</span>
      </>
    ),
    subtitle: "Publish requests and receive ranked students who match your skills and role requirements.",
    steps: [
      {
        icon: Megaphone,
        title: "Publish a Request",
        desc: "Describe the role, skills, and student profile you're looking for.",
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
    ],
    panel: <CompaniesPanel />,
  },
  organizations: {
    eyebrow: "For Organizations",
    title: (
      <>
        Mobilize talent for <span className="text-gradient-primary">meaningful impact</span>
      </>
    ),
    subtitle: "Publish opportunities and onboard volunteers or members matched to your mission and skills.",
    steps: [
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
        title: "Accept Volunteers",
        desc: "Onboard contributors with a single click.",
      },
    ],
    panel: <OrganizationsPanel />,
  },
};

export function RolesTabbedSection() {
  const [activeTab, setActiveTab] = useState<RoleTabId>("students");
  const sectionRef = useRef<HTMLElement>(null);

  const syncFromHash = useCallback(() => {
    const role = hashToRole(window.location.hash.replace("#", ""));
    if (role) setActiveTab(role);
  }, []);

  useEffect(() => {
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [syncFromHash]);

  const selectTab = (id: RoleTabId) => {
    setActiveTab(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  const content = roleContent[activeTab];

  return (
    <section ref={sectionRef} id="roles" className="py-16 lg:py-24 relative scroll-mt-28">
      {tabs.map((tab) => (
        <span key={tab.id} id={tab.id} className="block h-0 scroll-mt-28" aria-hidden />
      ))}

      <div className="container">
        <SectionHeading
          eyebrow="Built for every role"
          title={
            <>
              One platform,{" "}
              <span className="text-gradient-primary">four tailored experiences</span>
            </>
          }
          subtitle="Students, supervisors, companies, and organizations each get a focused workflow — switch to see yours."
        />

        <div
          className="mt-10 flex flex-wrap justify-center gap-1 p-1 rounded-xl glass max-w-2xl mx-auto"
          role="tablist"
          aria-label="Audience"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`role-panel-${tab.id}`}
                id={`role-tab-${tab.id}`}
                onClick={() => selectTab(tab.id)}
                className={`flex-1 min-w-[7rem] px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-primary text-white shadow-[0_4px_20px_hsl(var(--primary)/0.35)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            id={`role-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`role-tab-${activeTab}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-12"
          >
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium mb-3 text-primary-glow">
                {content.eyebrow}
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {content.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{content.subtitle}</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <div className="space-y-3">
                {content.steps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-xl glass flex items-center justify-center group-hover:bg-gradient-primary transition-all">
                      <step.icon
                        className="w-4.5 h-4.5 text-primary-glow group-hover:text-white"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-0.5">{step.title}</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div>{content.panel}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
