import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getDoctorPublicProfile, type DoctorPublicProfile } from "@/api/doctorPublicApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { ROUTES } from "@/routes/paths";
import { DoctorProfileHeader } from "@/components/doctor/profile/DoctorProfileHeader";
import {
  DoctorProfileField,
  DoctorProfileSection,
} from "@/components/doctor/profile/DoctorProfileSection";
import { DoctorProfileSupervisionSummary } from "@/components/doctor/profile/DoctorProfileSupervisionSummary";
import { DoctorProfileExpertiseTags } from "@/components/doctor/profile/DoctorProfileExpertiseTags";

export default function DoctorPublicProfilePage() {
  const { userId: idParam } = useParams<{ userId: string }>();
  const userId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DoctorPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(userId)) return;
    setLoading(true);
    setError(null);
    void getDoctorPublicProfile(userId)
      .then(setProfile)
      .catch((err) => {
        setProfile(null);
        setError(parseApiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const dp = profile?.doctorProfile;
  const user = profile?.user;
  const photo =
    profilePhotoUrl(dp?.profilePictureBase64) ?? profilePhotoUrl(user?.profilePictureBase64);
  const bio = dp?.bio?.trim() ?? "";
  const technicalSkills = dp?.technicalSkills ?? [];
  const researchSkills = dp?.researchSkills ?? [];

  return (
    <div className="student-hub min-h-full flex-1 bg-gradient-mesh">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <Link
          to={ROUTES.communicationHub}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Communication Hub
        </Link>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
          </div>
        ) : !profile || !user || !dp ? (
          <p className="text-sm text-muted-foreground">{error ?? "Doctor not found."}</p>
        ) : (
          <>
            <DoctorProfileHeader
              name={user.name}
              email={user.email}
              faculty={dp.faculty ?? ""}
              department={dp.department}
              specialization={dp.specialization ?? ""}
              photoUrl={photo}
              showEditButton={false}
            />

            {bio ? (
              <DoctorProfileSection title="About">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{bio}</p>
              </DoctorProfileSection>
            ) : null}

            <DoctorProfileSection title="Academic Information">
              <dl className="space-y-4">
                <DoctorProfileField label="Faculty" value={dp.faculty ?? ""} />
                <DoctorProfileField label="Department" value={dp.department} />
                <DoctorProfileField label="Academic rank" value="" />
                <DoctorProfileField label="Specialization" value={dp.specialization ?? ""} />
                <DoctorProfileField label="University" value={dp.university ?? ""} />
                <DoctorProfileField
                  label="Years of experience"
                  value={dp.yearsOfExperience != null ? String(dp.yearsOfExperience) : ""}
                />
              </dl>
            </DoctorProfileSection>

            <DoctorProfileSupervisionSummary
              supervisedStudents={0}
              activeProjects={0}
              completedProjects={0}
            />

            <DoctorProfileExpertiseTags
              technicalSkills={technicalSkills}
              researchSkills={researchSkills}
            />

            <DoctorProfileSection title="Contact Information">
              <dl className="space-y-4">
                <DoctorProfileField label="Email" value={user.email} />
                <DoctorProfileField label="Office hours" value={dp.officeHours ?? ""} />
                <DoctorProfileField label="LinkedIn" value={dp.linkedin ?? ""} />
              </dl>
            </DoctorProfileSection>
          </>
        )}
      </div>
    </div>
  );
}
