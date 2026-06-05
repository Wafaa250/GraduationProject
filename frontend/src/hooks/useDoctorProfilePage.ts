import { useEffect, useState } from "react";
import { getDoctorMe } from "@/api/meApi";
import { getDoctorDashboardSummary } from "@/api/doctorDashboardApi";
import { getDoctorPublicProfile } from "@/api/doctorPublicApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import type { DoctorProfileViewData } from "@/components/doctor/profile/DoctorProfileView";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { toast } from "@/hooks/use-toast";

export type DoctorProfileMode = "owner" | "visitor";

export function useDoctorProfilePage(mode: DoctorProfileMode, userId?: number) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DoctorProfileViewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (mode === "visitor" && (!userId || userId <= 0)) {
      setLoading(false);
      setData(null);
      setError("Invalid doctor link.");
      return;
    }

    const load = async () => {
      try {
        if (mode === "owner") {
          const [me, summary] = await Promise.all([getDoctorMe(), getDoctorDashboardSummary()]);
          if (cancelled) return;
          const dp = me.doctorProfile;
          setData({
            name: me.user?.name ?? "",
            email: me.user?.email ?? "",
            department: dp?.department ?? "",
            faculty: dp?.faculty ?? "",
            specialization: dp?.specialization ?? "",
            university: dp?.university ?? "",
            academicRank: dp?.academicRank ?? "",
            bio: dp?.bio ?? "",
            yearsOfExperience: dp?.yearsOfExperience ?? null,
            officeHours: dp?.officeHours ?? "",
            linkedin: dp?.linkedin ?? "",
            technicalSkills: dp?.technicalSkills ?? [],
            researchSkills: dp?.researchSkills ?? [],
            researchInterests: dp?.researchInterests ?? [],
            preferredProjectAreas: dp?.preferredProjectAreas ?? [],
            photoUrl:
              profilePhotoUrl(dp?.profilePictureBase64) ??
              profilePhotoUrl(me.user?.profilePictureBase64),
            supervisedStudents: summary.supervisedStudentsCount,
            activeProjects: summary.supervisedCount,
            completedProjects: summary.completedSupervisionsCount,
          });
          return;
        }

        const profile = await getDoctorPublicProfile(userId!);
        if (cancelled) return;
        const dp = profile.doctorProfile;
        const user = profile.user;
        setData({
          name: user?.name ?? "",
          email: user?.email ?? "",
          department: dp?.department ?? "",
          faculty: dp?.faculty ?? "",
          specialization: dp?.specialization ?? "",
          university: dp?.university ?? "",
          academicRank: dp?.academicRank ?? "",
          bio: dp?.bio ?? "",
          yearsOfExperience: dp?.yearsOfExperience ?? null,
          officeHours: dp?.officeHours ?? "",
          linkedin: dp?.linkedin ?? "",
          technicalSkills: dp?.technicalSkills ?? [],
          researchSkills: dp?.researchSkills ?? [],
          researchInterests: dp?.researchInterests ?? [],
          preferredProjectAreas: dp?.preferredProjectAreas ?? [],
          photoUrl:
            profilePhotoUrl(dp?.profilePictureBase64) ??
            profilePhotoUrl(user?.profilePictureBase64),
          supervisedStudents: profile.supervisedStudentsCount ?? 0,
          activeProjects: profile.activeProjectsCount ?? 0,
          completedProjects: profile.completedProjectsCount ?? 0,
        });
      } catch (err) {
        if (cancelled) return;
        setData(null);
        const message = parseApiErrorMessage(err);
        setError(message);
        if (mode === "owner") {
          toast({
            variant: "destructive",
            title: "Could not load profile",
            description: message,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [mode, userId]);

  return { loading, data, error };
}
