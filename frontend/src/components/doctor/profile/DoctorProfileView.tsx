import { Loader2 } from "lucide-react";
import { DoctorProfileHeader } from "@/components/doctor/profile/DoctorProfileHeader";
import {
  DoctorProfileField,
  DoctorProfileSection,
} from "@/components/doctor/profile/DoctorProfileSection";
import { DoctorProfileSupervisionSummary } from "@/components/doctor/profile/DoctorProfileSupervisionSummary";
import { DoctorProfileExpertiseTags } from "@/components/doctor/profile/DoctorProfileExpertiseTags";

export type DoctorProfileViewData = {
  name: string;
  email: string;
  faculty: string;
  department: string;
  specialization: string;
  university: string;
  academicRank: string;
  bio: string;
  yearsOfExperience: number | null;
  officeHours: string;
  linkedin: string;
  photoUrl: string | null;
  technicalSkills: string[];
  researchSkills: string[];
  researchInterests: string[];
  preferredProjectAreas: string[];
  supervisedStudents: number;
  activeProjects: number;
  completedProjects: number;
};

type Props = {
  mode: "owner" | "visitor";
  loading: boolean;
  data: DoctorProfileViewData | null;
  error?: string | null;
  showMessageButton?: boolean;
  messaging?: boolean;
  onMessage?: () => void;
};

export function DoctorProfileView({
  mode,
  loading,
  data,
  error,
  showMessageButton = false,
  messaging = false,
  onMessage,
}: Props) {
  if (loading) {
    return (
      <main className="flex min-h-[40vh] flex-1 items-center justify-center bg-gradient-mesh">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading profile" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-[40vh] flex-1 items-center justify-center bg-gradient-mesh px-4">
        <p className="text-sm text-muted-foreground text-center">{error ?? "Doctor not found."}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="mx-auto max-w-4xl space-y-6 px-5 py-5 lg:px-8 lg:py-6">
        <header className="sr-only">
          <h1>{mode === "owner" ? "My Profile" : `${data.name} profile`}</h1>
        </header>

        <DoctorProfileHeader
          name={data.name}
          email={data.email}
          faculty={data.faculty}
          department={data.department}
          specialization={data.specialization}
          photoUrl={data.photoUrl}
          showEditButton={mode === "owner"}
          showMessageButton={showMessageButton}
          messaging={messaging}
          onMessage={onMessage}
        />

        {data.bio.trim() ? (
          <DoctorProfileSection title="About">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{data.bio}</p>
          </DoctorProfileSection>
        ) : null}

        <DoctorProfileSection title="Academic Information">
          <dl className="space-y-4">
            <DoctorProfileField label="Faculty" value={data.faculty} />
            <DoctorProfileField label="Department" value={data.department} />
            <DoctorProfileField label="Academic rank" value={data.academicRank} />
            <DoctorProfileField label="Specialization" value={data.specialization} />
            <DoctorProfileField label="University" value={data.university} />
            <DoctorProfileField
              label="Years of experience"
              value={data.yearsOfExperience != null ? String(data.yearsOfExperience) : ""}
            />
          </dl>
        </DoctorProfileSection>

        <DoctorProfileSupervisionSummary
          supervisedStudents={data.supervisedStudents}
          activeProjects={data.activeProjects}
          completedProjects={data.completedProjects}
        />

        <DoctorProfileExpertiseTags
          technicalSkills={data.technicalSkills}
          researchSkills={data.researchSkills}
          researchInterests={data.researchInterests}
          preferredProjectAreas={data.preferredProjectAreas}
        />

        <DoctorProfileSection title="Contact Information">
          <dl className="space-y-4">
            <DoctorProfileField label="Email" value={data.email} />
            <DoctorProfileField label="Office hours" value={data.officeHours} />
            <DoctorProfileField label="LinkedIn" value={data.linkedin} />
          </dl>
        </DoctorProfileSection>
      </div>
    </main>
  );
}
