import { useCallback, useEffect, useState } from "react";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getDoctorDashboardSummary } from "@/api/doctorDashboardApi";
import { getDoctorMe } from "@/api/meApi";
import { mapDoctorMeToHeaderProfile } from "@/lib/doctorHubMappers";
import type { DoctorProfileViewData } from "@/lib/doctorProfileTypes";

export function useDoctorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DoctorProfileViewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [me, summary] = await Promise.all([getDoctorMe(), getDoctorDashboardSummary()]);
      const dp = me.doctorProfile;
      const header = mapDoctorMeToHeaderProfile(me);
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
        photoUrl: header.profilePhoto,
        supervisedStudents: summary.supervisedStudentsCount,
        activeProjects: summary.supervisedCount,
        completedProjects: summary.completedSupervisionsCount,
      });
    } catch (err) {
      setData(null);
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { loading, data, error, reload };
}
