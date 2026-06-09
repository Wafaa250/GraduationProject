import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import "@/styles/profile-hub.css";
import { getMe } from "@/api/meApi";
import { updateProfile } from "@/api/profileApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  Camera,
  User,
  Briefcase,
  Sparkles,
  Link as LinkIcon,
  Github,
  Linkedin,
  Globe,
  Plus,
  Trash2,
  Save,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/profile/SectionCard";
import { TagInput } from "@/components/profile/TagInput";

const BIO_MAX = 280;

const workingStyles = [
  { value: "deep-focus", label: "Deep focus" },
  { value: "fast-iteration", label: "Fast iteration" },
  { value: "structured", label: "Structured & planned" },
  { value: "exploratory", label: "Exploratory" },
];

const availabilityOptions = [
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "evenings", label: "Evenings" },
  { value: "flexible", label: "Flexible" },
];

const teamworkPrefs = ["Solo", "Pair", "Small team (3-5)", "Large team"];
const collabPrefs = ["Async-first", "Sync calls", "In-person", "Hybrid"];

type LinkRow = { id: string; label: string; url: string };

function resolveAvailability(value: string | null | undefined): string {
  if (!value) return "flexible";
  return availabilityOptions.some((o) => o.value === value) ? value : "flexible";
}

const StudentProfileEditPage = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);

  const [workingStyle, setWorkingStyle] = useState("deep-focus");
  const [teamwork, setTeamwork] = useState<string>("Small team (3-5)");
  const [collab, setCollab] = useState<string>("Async-first");
  const [availability, setAvailability] = useState("flexible");

  const [techSkills, setTechSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [otherLinks, setOtherLinks] = useState<LinkRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const applyMe = useCallback((data: Awaited<ReturnType<typeof getMe>>) => {
    setFullName(data.name ?? "");
    setBio(data.bio ?? "");
    setLanguages(data.languages ?? []);
    setAvailability(resolveAvailability(data.availability));
    setTechSkills(data.technicalSkills ?? data.majorSkills ?? []);
    setTools(data.tools ?? []);
    setRoles(data.roles ?? data.generalSkills ?? []);
    setLinkedin(data.linkedin ?? "");
    setGithub(data.github ?? "");
    setPortfolio(data.portfolio ?? "");
    setPhoto(data.profilePictureBase64 ?? null);
    const prefs = data.collaborationPreferences;
    if (prefs?.workingStyle) setWorkingStyle(prefs.workingStyle);
    if (prefs?.teamwork) setTeamwork(prefs.teamwork);
    if (prefs?.collaboration) setCollab(prefs.collaboration);
    if (data.otherLinks?.length) {
      setOtherLinks(
        data.otherLinks.map((link) => ({
          id: crypto.randomUUID(),
          label: link.label,
          url: link.url,
        })),
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMe();
        if (!cancelled) applyMe(data);
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Could not load profile",
            description: parseApiErrorMessage(err),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMe]);

  const onPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addOtherLink = () =>
    setOtherLinks((p) => [...p, { id: crypto.randomUUID(), label: "", url: "" }]);

  const updateOtherLink = (id: string, patch: Partial<LinkRow>) =>
    setOtherLinks((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const removeOtherLink = (id: string) =>
    setOtherLinks((p) => p.filter((l) => l.id !== id));

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({ title: "Full name required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (bio.length > BIO_MAX) {
      toast({
        title: "Bio too long",
        description: `Bio must be ${BIO_MAX} characters or fewer.`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        bio: bio.trim() || undefined,
        availability,
        languages,
        roles,
        technicalSkills: techSkills,
        tools,
        github: github.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
        profilePictureBase64: photo,
        collaborationPreferences: {
          workingStyle,
          teamwork,
          collaboration: collab,
        },
        otherLinks: otherLinks
          .filter((l) => l.label.trim() && l.url.trim())
          .map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
      });
      const data = await getMe();
      applyMe(data);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      const data = await getMe();
      applyMe(data);
      toast({ title: "Changes discarded", description: "Your edits were not saved." });
    } catch (err) {
      toast({
        title: "Could not reload profile",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="profile-hub min-h-screen bg-gradient-subtle font-sans text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="profile-hub min-h-full bg-gradient-subtle font-sans text-foreground">
      <div className="bg-gradient-hero">
        <div className="mx-auto max-w-5xl px-4 pb-6 pt-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Account</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground">Edit profile</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Edit your profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Keep your information up to date so collaborators can find the right match for your next project.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-6 px-4 pb-32 sm:px-6 lg:px-8">
        {/* Profile header */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="h-24 bg-gradient-primary sm:h-32" />
          <div className="flex flex-col gap-6 px-6 pb-6 sm:flex-row sm:items-end sm:gap-8 sm:px-8 sm:pb-8">
            <div className="-mt-12 sm:-mt-16">
              <div className="group relative">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-accent shadow-elegant sm:h-32 sm:w-32">
                  {photo ? (
                    <img src={photo} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-3xl font-bold text-primary">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-foreground/60 text-primary-foreground opacity-0 transition-smooth hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:shadow-focus"
                >
                  <Camera className="h-6 w-6" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPhotoUpload}
                  className="sr-only"
                  aria-label="Upload profile photo"
                />
              </div>
            </div>

            <div className="flex-1 sm:pb-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {fullName || "Your name"}
              </h2>
              <p className="mt-1 line-clamp-2 max-w-xl text-sm text-muted-foreground">
                {bio || "Add a short summary to introduce yourself."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg"
                  disabled={saving}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {photo ? "Change photo" : "Upload photo"}
                </Button>
                {photo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhoto(null)}
                    className="rounded-lg text-muted-foreground hover:text-destructive"
                    disabled={saving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Basic info */}
        <SectionCard
          title="Basic information"
          description="Tell the community a little about yourself."
          icon={<User className="h-5 w-5" />}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="h-11"
                disabled={saving}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio">Bio / About me</Label>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    bio.length > BIO_MAX ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {bio.length}/{BIO_MAX}
                </span>
              </div>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                placeholder="Share a short intro about your background and interests."
                rows={4}
                className="resize-none"
                disabled={saving}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <TagInput
                id="languages"
                label="Languages"
                placeholder="e.g. English, Spanish"
                values={languages}
                onChange={setLanguages}
              />
            </div>
          </div>
        </SectionCard>

        {/* Work style */}
        <SectionCard
          title="Work style preferences"
          description="Help us match you with compatible teammates and projects."
          icon={<Briefcase className="h-5 w-5" />}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workingStyle">Preferred working style</Label>
              <Select value={workingStyle} onValueChange={setWorkingStyle} disabled={saving}>
                <SelectTrigger id="workingStyle" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workingStyles.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Select value={availability} onValueChange={setAvailability} disabled={saving}>
                <SelectTrigger id="availability" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Teamwork preference</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
                {teamworkPrefs.map((opt) => {
                  const active = teamwork === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setTeamwork(opt)}
                      disabled={saving}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-smooth focus:outline-none focus-visible:shadow-focus",
                        active
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-input bg-background text-foreground hover:border-primary/50 hover:bg-accent/50",
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Collaboration preference</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
                {collabPrefs.map((opt) => {
                  const active = collab === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setCollab(opt)}
                      disabled={saving}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-smooth focus:outline-none focus-visible:shadow-focus",
                        active
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-input bg-background text-foreground hover:border-primary/50 hover:bg-accent/50",
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Skills */}
        <SectionCard
          title="Skills"
          description="Showcase what you bring to the table."
          icon={<Sparkles className="h-5 w-5" />}
        >
          <div className="space-y-6">
            <TagInput
              id="techSkills"
              label="Technical skills"
              placeholder="e.g. TypeScript, Python"
              values={techSkills}
              onChange={setTechSkills}
            />
            <TagInput
              id="tools"
              label="Tools & technologies"
              placeholder="e.g. Figma, Docker"
              values={tools}
              onChange={setTools}
            />
            <TagInput
              id="roles"
              label="Roles / areas of interest"
              placeholder="e.g. Frontend Engineer, UX Researcher"
              values={roles}
              onChange={setRoles}
            />
          </div>
        </SectionCard>

        {/* Links */}
        <SectionCard
          title="Professional links"
          description="Where can others learn more about your work?"
          icon={<LinkIcon className="h-5 w-5" />}
        >
          <div className="space-y-5">
            <LinkField
              id="linkedin"
              label="LinkedIn"
              icon={<Linkedin className="h-4 w-4" />}
              placeholder="https://linkedin.com/in/username"
              value={linkedin}
              onChange={setLinkedin}
              disabled={saving}
            />
            <LinkField
              id="github"
              label="GitHub"
              icon={<Github className="h-4 w-4" />}
              placeholder="https://github.com/username"
              value={github}
              onChange={setGithub}
              disabled={saving}
            />
            <LinkField
              id="portfolio"
              label="Portfolio website"
              icon={<Globe className="h-4 w-4" />}
              placeholder="https://yourportfolio.com"
              value={portfolio}
              onChange={setPortfolio}
              disabled={saving}
            />

            {otherLinks.length > 0 && (
              <div className="space-y-3 border-t border-border/70 pt-5">
                <Label className="text-sm">Other links</Label>
                {otherLinks.map((l) => (
                  <div key={l.id} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                    <Input
                      placeholder="Label (e.g. Dribbble)"
                      value={l.label}
                      onChange={(e) => updateOtherLink(l.id, { label: e.target.value })}
                      className="h-11"
                      aria-label="Link label"
                      disabled={saving}
                    />
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={l.url}
                      onChange={(e) => updateOtherLink(l.id, { url: e.target.value })}
                      className="h-11"
                      aria-label="Link URL"
                      disabled={saving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOtherLink(l.id)}
                      aria-label="Remove link"
                      className="h-11 w-11 text-muted-foreground hover:text-destructive"
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addOtherLink}
              className="rounded-lg"
              disabled={saving}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add another link
            </Button>
          </div>
        </SectionCard>
      </main>

      {/* Sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="hidden text-sm text-muted-foreground sm:block">
            Changes are saved to your SkillSwap profile.
          </p>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 rounded-lg sm:flex-none"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel changes
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth hover:opacity-95 sm:flex-none"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LinkFieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const LinkField = ({ id, label, icon, placeholder, value, onChange, disabled }: LinkFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex items-center gap-2 rounded-xl border border-input bg-background pl-3 transition-smooth focus-within:border-ring focus-within:shadow-focus">
      <span className="text-muted-foreground">{icon}</span>
      <Input
        id={id}
        type="url"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
        disabled={disabled}
      />
    </div>
  </div>
);

export default StudentProfileEditPage;
