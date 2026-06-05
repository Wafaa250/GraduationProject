import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "@/styles/skill-profile-hub.css";
import { getMe, type StudentMeResponse } from "@/api/meApi";
import { getStudentDirectoryProfile } from "@/api/studentDirectoryApi";
import { mapDirectoryProfileToMe } from "@/lib/mapStudentDirectoryProfile";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import type { GradProject } from "@/api/gradProjectApi";
import type { ProfileStrength } from "@/api/dashboardApi";
import {
  getGraduationProjectsForStudent,
  getOrganizationMemberships,
  getProfileStrength,
  type OrganizationMembership,
} from "@/api/studentProfileApi";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Calendar,
  Award,
  Share2,
  Pencil,
  Sparkles,
  Briefcase,
  Target,
  Heart,
  BookOpen,
  Code2,
  Wrench,
  Users,
  Building2,
  Globe,
  Github,
  Linkedin,
  Link as LinkIcon,
  ExternalLink,
  Clock,
  Layers,
  MessageSquare,
  Crown,
  Gauge,
  CheckCircle2,
  Circle,
  Trophy,
  HeartHandshake,
  Cpu,
  Shield,
  Smartphone,
  Cloud,
  Wifi,
  Microchip,
  BarChart3,
  ArrowRight,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  "Artificial Intelligence": Sparkles,
  "Cyber Security": Shield,
  "Web Development": Globe,
  "Mobile Development": Smartphone,
  Networking: Wifi,
  "Cloud Computing": Cloud,
  IoT: Cpu,
  "Embedded Systems": Microchip,
  "Data Science": BarChart3,
};

const PREFERENCE_LABELS = [
  { icon: Users, label: "Preferred Team Size" },
  { icon: Gauge, label: "Work Style" },
  { icon: Crown, label: "Leadership Preference" },
  { icon: MessageSquare, label: "Communication Style" },
  { icon: Clock, label: "Weekly Availability" },
  { icon: Layers, label: "Project Complexity" },
] as const;

const LINK_DEFS = [
  { key: "github" as const, icon: Github, label: "GitHub" },
  { key: "linkedin" as const, icon: Linkedin, label: "LinkedIn" },
  { key: "portfolio" as const, icon: Globe, label: "Portfolio" },
  { key: "website" as const, icon: LinkIcon, label: "Personal Website" },
];

type SectionTitleProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
};

const SectionTitle = ({ icon: Icon, title, subtitle }: SectionTitleProps) => (
  <div className="flex items-start gap-3 mb-6">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

function displayText(value: string | null | undefined, fallback = "Not provided yet.") {
  const v = value?.trim();
  return v ? v : fallback;
}

function formatGpa(gpa: number | null | undefined): string {
  if (gpa == null || Number.isNaN(gpa)) return "—";
  return `${gpa} / 4.0`;
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function uniqueStrings(items: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const v = item?.trim();
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out;
}

function domainIconFor(name: string): LucideIcon {
  const exact = DOMAIN_ICONS[name];
  if (exact) return exact;
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(DOMAIN_ICONS)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase())) return icon;
  }
  return Sparkles;
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function linkHandle(url: string): string {
  try {
    const u = new URL(normalizeUrl(url));
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

function projectDuration(createdAt?: string): string {
  if (!createdAt) return "—";
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return "—";
  const months = Math.max(
    1,
    Math.round((Date.now() - start.getTime()) / (30 * 24 * 60 * 60 * 1000)),
  );
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year" : `${years} years`;
}

function projectRole(project: GradProject, profileId: number, userId: number): string {
  if (project.isOwner || project.ownerId === profileId) return "Project Owner";
  const member = project.members?.find(
    (m) => m.userId === userId || m.studentId === profileId,
  );
  if (member?.role === "leader") return "Team Lead";
  return "Team Member";
}

function buildCompletionSuggestions(
  me: StudentMeResponse,
  strength: ProfileStrength,
  projectCount: number,
) {
  const hasAcademic = Boolean(
    me.university?.trim() && me.major?.trim() && me.faculty?.trim() && me.gpa != null,
  );
  return [
    {
      done: strength.hasProfilePicture && strength.hasBio,
      text: "Profile photo and bio added",
    },
    { done: hasAcademic, text: "Academic information completed" },
    {
      done: strength.hasGeneralSkills && strength.hasMajorSkills,
      text: "Skills and tools listed",
    },
    { done: projectCount >= 2, text: "Add 2 more project case studies" },
    { done: Boolean(me.portfolio?.trim()), text: "Connect your personal website" },
    { done: false, text: "Add certifications or awards" },
  ];
}

function activityIcon(kind: string): LucideIcon {
  const k = kind.toLowerCase();
  if (k.includes("mentor")) return HeartHandshake;
  if (k.includes("lead") || k.includes("president") || k.includes("officer")) return Trophy;
  if (k.includes("volunteer")) return Heart;
  return Users;
}

export type StudentProfileMode = "owner" | "visitor";

export type StudentProfileViewProps = {
  mode?: StudentProfileMode;
  userId?: number;
  backHref?: string;
};

export function StudentProfileView({
  mode = "owner",
  userId,
  backHref = ROUTES.communicationHub,
}: StudentProfileViewProps) {
  const isOwner = mode === "owner";
  const [me, setMe] = useState<StudentMeResponse | null>(null);
  const [strength, setStrength] = useState<ProfileStrength | null>(null);
  const [projects, setProjects] = useState<GradProject[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (mode === "visitor" && (!userId || userId <= 0)) {
      setLoading(false);
      setError("Invalid student link.");
      return;
    }

    (async () => {
      try {
        const profile =
          mode === "owner"
            ? await getMe()
            : mapDirectoryProfileToMe(await getStudentDirectoryProfile(userId!));
        if (cancelled) return;
        setMe(profile);

        const [strengthRes, projectRes, membershipRes] = await Promise.all([
          isOwner ? getProfileStrength().catch(() => null) : Promise.resolve(null),
          getGraduationProjectsForStudent(profile.profileId).catch(() => [] as GradProject[]),
          isOwner
            ? getOrganizationMemberships().catch(() => [] as OrganizationMembership[])
            : Promise.resolve([] as OrganizationMembership[]),
        ]);

        if (cancelled) return;
        setStrength(strengthRes);
        setProjects(projectRes);
        setMemberships(membershipRes);
      } catch (err) {
        if (!cancelled) setError(parseApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOwner, mode, userId]);

  const completion = strength?.score ?? 0;

  const technicalSkills = useMemo(
    () => uniqueStrings([...(me?.technicalSkills ?? []), ...(me?.majorSkills ?? [])]),
    [me],
  );

  const tools = useMemo(() => uniqueStrings(me?.tools ?? []), [me]);
  const roles = useMemo(
    () => uniqueStrings([...(me?.roles ?? []), ...(me?.generalSkills ?? [])]),
    [me],
  );

  const tags = useMemo(
    () =>
      uniqueStrings([
        me?.major,
        ...(me?.roles ?? []).slice(0, 2),
        me?.academicYear,
      ]),
    [me],
  );

  const completionSuggestions = useMemo(
    () =>
      me && strength
        ? buildCompletionSuggestions(me, strength, projects.length)
        : [],
    [me, strength, projects.length],
  );

  const remainingCount = completionSuggestions.filter((s) => !s.done).length;

  const preferenceValues = useMemo(() => {
    const availability = me?.availability?.trim();
    return [
      "Not specified",
      "Not specified",
      "Not specified",
      "Not specified",
      availability ? availability : "Not specified",
      "Not specified",
    ];
  }, [me?.availability]);

  const portfolioLinks = useMemo(() => {
    if (!me) return [];
    return LINK_DEFS.map(({ key, icon, label }) => {
      if (key === "website") {
        return { icon, label, handle: "Not connected", url: null as string | null };
      }
      const url = me[key]?.trim();
      return {
        icon,
        label,
        handle: url ? linkHandle(url) : "Not connected",
        url: url ?? null,
      };
    });
  }, [me]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Profile URL copied to your clipboard.",
      });
    } catch {
      toast({
        title: "Could not copy link",
        description: "Copy the URL from your browser address bar.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="skill-profile-hub min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {isOwner ? "Loading your profile…" : "Loading profile…"}
        </p>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="skill-profile-hub min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground text-center">
          {error ?? (isOwner ? "Could not load your profile." : "Student not found.")}
        </p>
      </div>
    );
  }

  const photo = me.profilePictureBase64;
  const subtitle = [me.major, me.academicYear].filter(Boolean).join(" · ") || "—";
  const heroMeta = [
    { icon: Building2, text: displayText(me.university, "—") },
    { icon: Award, text: `GPA ${formatGpa(me.gpa)}` },
    { icon: Mail, text: displayText(me.email, "—") },
  ];

  const academicFields = [
    { icon: Building2, label: "University", value: displayText(me.university) },
    { icon: BookOpen, label: "Faculty", value: displayText(me.faculty) },
    { icon: Code2, label: "Major", value: displayText(me.major) },
    { icon: Calendar, label: "Academic Year", value: displayText(me.academicYear) },
    { icon: Award, label: "GPA", value: formatGpa(me.gpa) },
    { icon: Trophy, label: "Expected Graduation", value: "Not provided yet." },
  ];

  const aboutBlocks = [
    { icon: Target, title: "Career Goals", text: displayText(me.lookingFor) },
    {
      icon: GraduationCap,
      title: "Academic Interests",
      text:
        (me.majorSkills?.length ?? 0) > 0
          ? me.majorSkills!.join(", ")
          : displayText(undefined),
    },
    {
      icon: Heart,
      title: "Personal Interests",
      text:
        (me.languages?.length ?? 0) > 0
          ? me.languages!.join(", ")
          : displayText(undefined),
    },
  ];

  const projectDomains =
    technicalSkills.length > 0
      ? technicalSkills.map((name) => ({ name, icon: domainIconFor(name) }))
      : [];

  const activities = memberships.map((m) => ({
    name: m.organizationName,
    role: m.roleTitle || m.membershipKind,
    icon: activityIcon(m.roleTitle || m.membershipKind),
  }));

  return (
    <div className="skill-profile-hub">
      <main className="min-h-full bg-[var(--gradient-subtle)]">
        <div className="h-1.5 w-full bg-[var(--gradient-hero)]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
          {!isOwner ? (
            <Link
              to={backHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to Communication Hub
            </Link>
          ) : null}

          {/* HERO */}
          <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-lg)]">
            <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-[0.06]" />
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />

            <div className="relative p-6 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative shrink-0 mx-auto md:mx-0">
                  <div className="absolute -inset-1.5 rounded-full bg-[var(--gradient-hero)] blur-md opacity-70" />
                  {photo ? (
                    <img
                      src={photo}
                      alt={`${me.name} profile photo`}
                      width={160}
                      height={160}
                      className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-card shadow-xl"
                    />
                  ) : (
                    <div
                      className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-card shadow-xl bg-[var(--gradient-hero)] flex items-center justify-center text-primary-foreground text-3xl md:text-4xl font-bold"
                      aria-label={`${me.name} profile photo`}
                    >
                      {initialsFromName(me.name)}
                    </div>
                  )}
                  <div
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-success border-4 border-card"
                    aria-label="Available"
                  />
                </div>

                <div className="flex-1 w-full text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start text-xs font-semibold text-primary mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wider">Open to collaboration</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                    {me.name}
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground mt-2">{subtitle}</p>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 justify-center md:justify-start text-sm text-muted-foreground">
                    {heroMeta.map(({ icon: Icon, text }) => (
                      <span key={text} className="inline-flex items-center gap-1.5">
                        <Icon className="w-4 h-4" />
                        {text}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5 justify-center md:justify-start">
                    {tags.length > 0 ? (
                      tags.map((t) => (
                        <span key={t} className="chip chip-primary">
                          {t}
                        </span>
                      ))
                    ) : isOwner ? (
                      <span className="chip chip-primary text-muted-foreground">Add profile tags</span>
                    ) : null}
                  </div>

                  {isOwner ? (
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center md:justify-start">
                      <Button
                        size="lg"
                        className="bg-[var(--gradient-hero)] text-primary-foreground border-0 shadow-[var(--shadow-glow)] hover:opacity-95"
                        asChild
                      >
                        <Link to={ROUTES.editProfile}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-border/80"
                        type="button"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4 mr-2" /> Share Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center md:justify-start">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-border/80"
                        type="button"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4 mr-2" /> Share Profile
                      </Button>
                    </div>
                  )}
                </div>

                {isOwner ? (
                <div className="hidden lg:flex flex-col items-center gap-2 pl-6 border-l border-border/60">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="hsl(var(--muted))"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="url(#grad)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(completion / 100) * 264} 264`}
                      />
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(252 75% 58%)" />
                          <stop offset="100%" stopColor="hsl(195 90% 55%)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold gradient-text">{completion}%</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Profile Complete</p>
                </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* ABOUT */}
          <section className="glass-card p-6 md:p-8">
            <SectionTitle icon={BookOpen} title="About Me" subtitle="Personal narrative and aspirations" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <p className="text-foreground/90 leading-relaxed">{displayText(me.bio)}</p>
              </div>
              {aboutBlocks.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl p-5 bg-secondary/50 border border-border/40">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Icon className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">{title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ACADEMIC */}
          <section className="glass-card p-6 md:p-8">
            <SectionTitle
              icon={GraduationCap}
              title="Academic Information"
              subtitle="Verified university record"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {academicFields.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-xl p-4 bg-gradient-to-br from-background to-secondary/40 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </div>
                  <p className="font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SKILLS */}
          <section className="glass-card p-6 md:p-8">
            <SectionTitle icon={Sparkles} title="Skills, Tools & Roles" subtitle="What I bring to a team" />
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: Code2, title: "Technical Skills", items: technicalSkills, accent: "from-primary/10 to-primary/5" },
                { icon: Wrench, title: "Tools", items: tools, accent: "from-accent/10 to-accent/5" },
                { icon: Briefcase, title: "Preferred Roles", items: roles, accent: "from-primary/10 to-accent/5" },
              ].map(({ icon: Icon, title, items, accent }) => (
                <div
                  key={title}
                  className={`rounded-2xl p-5 border border-border/50 bg-gradient-to-br ${accent}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{title}</h3>
                    <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.length > 0 ? (
                      items.map((item) => (
                        <span key={item} className="chip">
                          {item}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">None listed yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* DOMAINS */}
          <section className="glass-card p-6 md:p-8">
            <SectionTitle
              icon={Target}
              title="Project Interests"
              subtitle="Domains I want to explore and build in"
            />
            {projectDomains.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {projectDomains.map(({ name, icon: Icon }) => (
                  <div
                    key={name}
                    className="group relative rounded-xl p-4 border border-border/60 bg-card hover:border-primary/40 transition-all hover:shadow-[var(--shadow-md)] cursor-default"
                  >
                    <div className="absolute inset-0 rounded-xl bg-[var(--gradient-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <Icon className="w-5 h-5 text-primary mb-2" />
                      <p className="text-sm font-medium leading-tight">{name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No project interests listed yet.</p>
            )}
          </section>

          {/* WORK PREFERENCES */}
          <section className="glass-card p-6 md:p-8">
            <SectionTitle icon={Gauge} title="Work Preferences" subtitle="How I collaborate best" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PREFERENCE_LABELS.map(({ icon: Icon, label }, index) => (
                <div
                  key={label}
                  className="rounded-2xl p-5 border border-border/50 bg-gradient-to-br from-card to-secondary/30 hover:from-primary/5 hover:to-accent/5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-semibold">{preferenceValues[index]}</p>
                </div>
              ))}
            </div>
          </section>

          {/* LINKS */}
          <section className="glass-card p-6 md:p-8">
            <SectionTitle icon={LinkIcon} title="Portfolio & Links" subtitle="Connect with me elsewhere" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {portfolioLinks.map(({ icon: Icon, label, handle, url }) =>
                url ? (
                  <a
                    key={label}
                    href={normalizeUrl(url)}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative rounded-2xl p-5 border border-border/50 bg-card hover:border-primary/40 hover:shadow-[var(--shadow-md)] transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{handle}</p>
                  </a>
                ) : (
                  <div
                    key={label}
                    className="group relative rounded-2xl p-5 border border-border/50 bg-card"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{handle}</p>
                  </div>
                ),
              )}
            </div>
          </section>

          {/* PROJECTS */}
          <section className="glass-card p-6 md:p-8">
            <SectionTitle
              icon={Briefcase}
              title="Previous Projects"
              subtitle="Selected academic and personal work"
            />
            <div className="space-y-4">
              {projects.length > 0 ? (
                projects.map((p) => (
                  <article
                    key={p.id}
                    className="group rounded-2xl p-5 md:p-6 border border-border/50 bg-gradient-to-br from-card to-secondary/20 hover:border-primary/30 hover:shadow-[var(--shadow-md)] transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-sm text-primary font-medium mt-0.5">
                          {projectRole(p, me.profileId, me.userId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {p.currentMembers} members
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {projectDuration(p.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {displayText(p.description ?? p.abstract, "No description provided.")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.requiredSkills ?? []).length > 0 ? (
                        p.requiredSkills!.map((t) => (
                          <span key={t} className="chip text-[11px] py-1">
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No skills listed</span>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No projects to show yet.
                </p>
              )}
            </div>
          </section>

          {isOwner ? (
          <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-md)]">
            <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-[0.04]" />
            <div className="relative p-6 md:p-8">
              <SectionTitle
                icon={Sparkles}
                title="Profile Completion"
                subtitle="A complete profile gets 4× more matches"
              />
              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className="text-4xl md:text-5xl font-bold gradient-text">{completion}%</span>
                  <span className="text-sm text-muted-foreground ml-2">complete</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {remainingCount} of {completionSuggestions.length} remaining
                </span>
              </div>
              <Progress value={completion} className="h-2.5 mb-6 profile-strength-progress" />
              <div className="grid sm:grid-cols-2 gap-2">
                {completionSuggestions.map((s) => (
                  <div
                    key={s.text}
                    className={`flex items-center gap-3 rounded-xl p-3 border ${
                      s.done
                        ? "border-success/20 bg-success/5"
                        : "border-border/50 bg-secondary/40"
                    }`}
                  >
                    {s.done ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        s.done ? "text-foreground" : "text-foreground/80 font-medium"
                      }`}
                    >
                      {s.text}
                    </span>
                    {!s.done && <ArrowRight className="w-4 h-4 ml-auto text-primary" />}
                  </div>
                ))}
              </div>
            </div>
          </section>
          ) : null}

          {/* ACTIVITIES */}
          <section className="glass-card p-6 md:p-8">
            <SectionTitle
              icon={HeartHandshake}
              title="Organizations & Activities"
              subtitle="Communities and clubs I'm part of"
            />
            {activities.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {activities.map(({ name, role, icon: Icon }) => (
                  <div
                    key={`${name}-${role}`}
                    className="flex items-center gap-4 rounded-2xl p-4 border border-border/50 bg-gradient-to-r from-card to-secondary/30 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No organizations or activities listed yet.</p>
            )}
          </section>

          <footer className="text-center text-xs text-muted-foreground py-6">
            SkillSwap · Student Profile Hub
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function StudentProfilePage() {
  return <StudentProfileView mode="owner" />;
}
