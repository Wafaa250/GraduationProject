import { useCallback, useEffect, useState } from "react";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getDoctorDashboardSummary } from "@/api/doctorDashboardApi";
import { getDoctorMe } from "@/api/meApi";
import { mapDoctorMeToHeaderProfile } from "@/lib/doctorHubMappers";
import type { DoctorProfileViewData } from "@/lib/doctorProfileTypes";
import {
  sanitizeDoctorProfileList,
  sanitizeDoctorProfileText,
} from "@/lib/doctorProfileText";

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
        name: sanitizeDoctorProfileText(me.user?.name) || me.user?.name?.trim() || "",
        email: me.user?.email?.trim() ?? "",
        department: sanitizeDoctorProfileText(dp?.department),
        faculty: sanitizeDoctorProfileText(dp?.faculty),
        specialization: sanitizeDoctorProfileText(dp?.specialization),
        university: sanitizeDoctorProfileText(dp?.university),
        academicRank: sanitizeDoctorProfileText(dp?.academicRank),
        bio: sanitizeDoctorProfileText(dp?.bio),
        yearsOfExperience: dp?.yearsOfExperience ?? null,
        officeHours: sanitizeDoctorProfileText(dp?.officeHours),
        linkedin: sanitizeDoctorProfileText(dp?.linkedin),
        technicalSkills: sanitizeDoctorProfileList(dp?.technicalSkills),
        researchSkills: sanitizeDoctorProfileList(dp?.researchSkills),
        researchInterests: sanitizeDoctorProfileList(dp?.researchInterests),
        preferredProjectAreas: sanitizeDoctorProfileList(dp?.preferredProjectAreas),
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
