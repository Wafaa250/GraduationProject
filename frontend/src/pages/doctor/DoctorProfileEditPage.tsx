import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Save } from "lucide-react";
import { getDoctorMe } from "@/api/meApi";
import { updateDoctorProfile } from "@/api/doctorProfileApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";

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
  const [office, setOffice] = useState("");
  const [phone, setPhone] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [technicalSkills, setTechnicalSkills] = useState("");
  const [researchSkills, setResearchSkills] = useState("");

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
        setOffice(dp?.office ?? "");
        setPhone(dp?.phone ?? "");
        setOfficeHours(dp?.officeHours ?? "");
        setYearsOfExperience(
          dp?.yearsOfExperience != null ? String(dp.yearsOfExperience) : "",
        );
        setTechnicalSkills((dp?.technicalSkills ?? []).join(", "));
        setResearchSkills((dp?.researchSkills ?? []).join(", "));
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const split = (s: string) =>
        s
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      await updateDoctorProfile({
        fullName: fullName.trim(),
        department: department.trim(),
        faculty: faculty.trim(),
        specialization: specialization.trim(),
        university: university.trim(),
        academicRank: academicRank.trim(),
        bio: bio.trim(),
        linkedin: linkedin.trim() || undefined,
        office: office.trim(),
        phone: phone.trim(),
        officeHours: officeHours.trim() || undefined,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
        technicalSkills: split(technicalSkills),
        researchSkills: split(researchSkills),
      });
      toast({ title: "Profile updated" });
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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-xl mx-auto">
        <DoctorHubPageHeader
          title="Edit Profile"
          backTo={ROUTES.doctorProfile}
          backLabel="Profile"
        />
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4"
        >
          <Field label="Full name" value={fullName} onChange={setFullName} required />
          <Field label="Department" value={department} onChange={setDepartment} />
          <Field label="Faculty" value={faculty} onChange={setFaculty} />
          <Field label="Specialization" value={specialization} onChange={setSpecialization} />
          <Field label="University" value={university} onChange={setUniversity} />
          <Field label="Academic rank" value={academicRank} onChange={setAcademicRank} />
          <Field label="Years of experience" value={yearsOfExperience} onChange={setYearsOfExperience} />
          <Field label="Office" value={office} onChange={setOffice} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Office hours" value={officeHours} onChange={setOfficeHours} />
          <Field label="LinkedIn" value={linkedin} onChange={setLinkedin} />
          <div>
            <label className="text-sm font-medium text-foreground">Bio</label>
            <textarea
              className="mt-1 w-full min-h-[100px] rounded-lg border border-border px-3 py-2 text-sm"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <Field
            label="Technical skills (comma-separated)"
            value={technicalSkills}
            onChange={setTechnicalSkills}
          />
          <Field
            label="Research skills (comma-separated)"
            value={researchSkills}
            onChange={setResearchSkills}
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
