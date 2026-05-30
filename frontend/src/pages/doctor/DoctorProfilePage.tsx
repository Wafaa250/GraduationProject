import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getDoctorMe } from "@/api/meApi";
import { getDoctorDashboardSummary } from "@/api/doctorDashboardApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DoctorProfileHeader } from "@/components/doctor/profile/DoctorProfileHeader";
import {
  DoctorProfileField,
  DoctorProfileSection,
} from "@/components/doctor/profile/DoctorProfileSection";
import { DoctorProfileSupervisionSummary } from "@/components/doctor/profile/DoctorProfileSupervisionSummary";
import { DoctorProfileExpertiseTags } from "@/components/doctor/profile/DoctorProfileExpertiseTags";
import { toast } from "@/hooks/use-toast";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [university, setUniversity] = useState("");
  const [academicRank, setAcademicRank] = useState("");
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | null>(null);
  const [officeHours, setOfficeHours] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [researchSkills, setResearchSkills] = useState<string[]>([]);
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [preferredProjectAreas, setPreferredProjectAreas] = useState<string[]>([]);
  const [supervisedStudents, setSupervisedStudents] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [completedProjects, setCompletedProjects] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void Promise.all([getDoctorMe(), getDoctorDashboardSummary()])
      .then(([me, summary]) => {
        if (cancelled) return;
        setName(me.user?.name ?? "");
        setEmail(me.user?.email ?? "");
        const dp = me.doctorProfile;
        setDepartment(dp?.department ?? "");
        setFaculty(dp?.faculty ?? "");
        setSpecialization(dp?.specialization ?? "");
        setUniversity(dp?.university ?? "");
        setAcademicRank(dp?.academicRank ?? "");
        setBio(dp?.bio ?? "");
        setYearsOfExperience(dp?.yearsOfExperience ?? null);
        setOfficeHours(dp?.officeHours ?? "");
        setLinkedin(dp?.linkedin ?? "");
        setTechnicalSkills(dp?.technicalSkills ?? []);
        setResearchSkills(dp?.researchSkills ?? []);
        setResearchInterests(dp?.researchInterests ?? []);
        setPreferredProjectAreas(dp?.preferredProjectAreas ?? []);
        setPhoto(
          profilePhotoUrl(dp?.profilePictureBase64) ??
            profilePhotoUrl(me.user?.profilePictureBase64),
        );
        setActiveProjects(summary.supervisedCount);
        setSupervisedStudents(summary.supervisedStudentsCount);
        setCompletedProjects(summary.completedSupervisionsCount);
      })
      .catch((err) => {
        if (cancelled) return;
        toast({
          variant: "destructive",
          title: "Could not load profile",
          description: parseApiErrorMessage(err),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[40vh] flex-1 items-center justify-center bg-gradient-mesh">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading profile" />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="mx-auto max-w-4xl space-y-6 px-5 py-5 lg:px-8 lg:py-6">
        <header className="sr-only">
          <h1>My Profile</h1>
        </header>

        <DoctorProfileHeader
          name={name}
          email={email}
          faculty={faculty}
          department={department}
          specialization={specialization}
          photoUrl={photo}
        />

        {bio.trim() ? (
          <DoctorProfileSection title="About">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{bio}</p>
          </DoctorProfileSection>
        ) : null}

        <DoctorProfileSection title="Academic Information">
          <dl className="space-y-4">
            <DoctorProfileField label="Faculty" value={faculty} />
            <DoctorProfileField label="Department" value={department} />
            <DoctorProfileField label="Academic rank" value={academicRank} />
            <DoctorProfileField label="Specialization" value={specialization} />
            <DoctorProfileField label="University" value={university} />
            <DoctorProfileField
              label="Years of experience"
              value={yearsOfExperience != null ? String(yearsOfExperience) : ""}
            />
          </dl>
        </DoctorProfileSection>

        <DoctorProfileSupervisionSummary
          supervisedStudents={supervisedStudents}
          activeProjects={activeProjects}
          completedProjects={completedProjects}
        />

        <DoctorProfileExpertiseTags
          technicalSkills={technicalSkills}
          researchSkills={researchSkills}
          researchInterests={researchInterests}
          preferredProjectAreas={preferredProjectAreas}
        />

        <DoctorProfileSection title="Contact Information">
          <dl className="space-y-4">
            <DoctorProfileField label="Email" value={email} />
            <DoctorProfileField label="Office hours" value={officeHours} />
            <DoctorProfileField label="LinkedIn" value={linkedin} />
          </dl>
        </DoctorProfileSection>
      </div>
    </main>
  );
}
