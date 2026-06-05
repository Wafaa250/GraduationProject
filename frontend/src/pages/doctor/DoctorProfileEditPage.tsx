import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getDoctorMe } from "@/api/meApi";
import { updateDoctorProfile } from "@/api/doctorProfileApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { primaryActionButtonClassName } from "@/lib/primaryButtonClasses";

const ACADEMIC_RANKS = [
  "Lecturer",
  "Assistant Professor",
  "Associate Professor",
  "Professor",
] as const;

const PROJECT_AREAS = [
  "AI",
  "Machine Learning",
  "Software Engineering",
  "Cyber Security",
  "Networks",
  "Mobile Development",
  "Web Development",
] as const;

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function fieldClassName(extra?: string) {
  return cn(
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
    extra,
  );
}

function SaveButton({
  label,
  saving,
  type = "button",
  onClick,
}: {
  label: string;
  saving: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <div className="mt-6 flex justify-end">
      <button
        type={type}
        disabled={saving}
        onClick={onClick}
        className={cn(primaryActionButtonClassName, "min-w-[8rem]")}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}

export default function DoctorProfileEditPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [university, setUniversity] = useState("");
  const [academicRank, setAcademicRank] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [technicalSkills, setTechnicalSkills] = useState("");
  const [researchSkills, setResearchSkills] = useState("");
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [researchInterestInput, setResearchInterestInput] = useState("");
  const [preferredProjectAreas, setPreferredProjectAreas] = useState<string[]>([]);

  useEffect(() => {
    void getDoctorMe()
      .then((me) => {
        setFullName(me.user?.name ?? "");
        const dp = me.doctorProfile;
        setDepartment(dp?.department ?? "");
        setFaculty(dp?.faculty ?? "");
        setSpecialization(dp?.specialization ?? "");
        setUniversity(dp?.university ?? "");
        setAcademicRank(dp?.academicRank ?? "");
        setBio(dp?.bio ?? "");
        setLinkedin(dp?.linkedin ?? "");
        setOfficeHours(dp?.officeHours ?? "");
        setYearsOfExperience(
          dp?.yearsOfExperience != null ? String(dp.yearsOfExperience) : "",
        );
        setTechnicalSkills((dp?.technicalSkills ?? []).join(", "));
        setResearchSkills((dp?.researchSkills ?? []).join(", "));
        setResearchInterests(dp?.researchInterests ?? []);
        setPreferredProjectAreas(dp?.preferredProjectAreas ?? []);
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Could not load profile",
          description: parseApiErrorMessage(err),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const splitList = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const addResearchInterest = () => {
    const value = researchInterestInput.trim();
    if (!value || researchInterests.includes(value)) return;
    setResearchInterests((prev) => [...prev, value]);
    setResearchInterestInput("");
  };

  const toggleProjectArea = (area: string) => {
    setPreferredProjectAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: "Full name required", variant: "destructive" });
      return;
    }
    if (!department.trim()) {
      toast({ title: "Department required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateDoctorProfile({
        fullName: fullName.trim(),
        department: department.trim(),
        faculty: faculty.trim(),
        specialization: specialization.trim(),
        university: university.trim(),
        academicRank: academicRank || undefined,
        bio: bio.trim(),
        linkedin: linkedin.trim() || undefined,
        officeHours: officeHours.trim() || undefined,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
        technicalSkills: splitList(technicalSkills),
        researchSkills: splitList(researchSkills),
        researchInterests,
        preferredProjectAreas,
      });
      localStorage.setItem("name", fullName.trim());
      toast({ title: "Profile saved" });
      navigate(ROUTES.doctorProfile);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Loading profile…</span>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-2xl mx-auto pb-10">
        <DoctorHubPageHeader
          title="Edit Profile"
          description="Your professional and academic information visible to students."
          backTo={ROUTES.doctorProfile}
          backLabel="Profile"
        />

        <form onSubmit={handleSave} className="space-y-6">
          <SettingsCard
            title="Personal Information"
            description="How students will identify you on SkillSwap."
          >
            <div className="space-y-4">
              <FieldGroup label="Full Name">
                <input
                  className={fieldClassName()}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </FieldGroup>
              <FieldGroup label="Bio">
                <textarea
                  className={cn(fieldClassName(), "min-h-[96px] resize-y")}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief overview of your supervision focus and expertise."
                  rows={4}
                />
              </FieldGroup>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Academic Information"
            description="Your faculty affiliation and academic credentials."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="Faculty">
                <input
                  className={fieldClassName()}
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="Department">
                <input
                  className={fieldClassName()}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </FieldGroup>
              <FieldGroup label="Specialization">
                <input
                  className={fieldClassName()}
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="University">
                <input
                  className={fieldClassName()}
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label="Academic Rank">
                <select
                  className={fieldClassName()}
                  value={academicRank}
                  onChange={(e) => setAcademicRank(e.target.value)}
                >
                  <option value="">Select rank</option>
                  {ACADEMIC_RANKS.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Years of Experience">
                <input
                  type="number"
                  min={0}
                  className={fieldClassName()}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                />
              </FieldGroup>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Contact & Availability"
            description="How students can reach you outside of SkillSwap messages."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="Office Hours">
                <input
                  className={fieldClassName()}
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  placeholder="e.g. Sun–Thu 10:00–12:00"
                />
              </FieldGroup>
              <FieldGroup label="LinkedIn">
                <input
                  className={fieldClassName()}
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </FieldGroup>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Expertise & Research"
            description="Skills and interests used for student matching and your public profile."
          >
            <div className="space-y-5">
              <FieldGroup label="Technical Skills">
                <input
                  className={fieldClassName()}
                  value={technicalSkills}
                  onChange={(e) => setTechnicalSkills(e.target.value)}
                  placeholder="Comma-separated, e.g. Python, Cloud, Databases"
                />
              </FieldGroup>
              <FieldGroup label="Research Skills">
                <input
                  className={fieldClassName()}
                  value={researchSkills}
                  onChange={(e) => setResearchSkills(e.target.value)}
                  placeholder="Comma-separated, e.g. Data Mining, NLP"
                />
              </FieldGroup>

              <FieldGroup label="Research Interests">
                <div className="flex flex-wrap gap-2">
                  {researchInterests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                      onClick={() =>
                        setResearchInterests((prev) => prev.filter((i) => i !== interest))
                      }
                      title="Remove"
                    >
                      {interest}
                      <span aria-hidden>×</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    className={fieldClassName()}
                    value={researchInterestInput}
                    onChange={(e) => setResearchInterestInput(e.target.value)}
                    placeholder="Add a research interest"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addResearchInterest();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/50"
                    onClick={addResearchInterest}
                  >
                    Add
                  </button>
                </div>
              </FieldGroup>

              <FieldGroup label="Preferred Project Areas">
                <div className="flex flex-wrap gap-2">
                  {PROJECT_AREAS.map((area) => {
                    const active = preferredProjectAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                          active
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-background text-foreground hover:border-primary/40",
                        )}
                        onClick={() => toggleProjectArea(area)}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
            </div>

            <SaveButton label="Save Profile" saving={saving} type="submit" />
          </SettingsCard>
        </form>
      </div>
    </main>
  );
}
