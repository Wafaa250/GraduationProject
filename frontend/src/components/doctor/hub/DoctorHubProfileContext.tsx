import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getDoctorMe } from "@/api/meApi";
import { mapDoctorMeToProfile } from "@/lib/doctorHubMappers";

export type DoctorHubProfileView = ReturnType<typeof mapDoctorMeToProfile>;

const DoctorHubProfileContext = createContext<DoctorHubProfileView | null>(null);

export function DoctorHubProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DoctorHubProfileView | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getDoctorMe()
      .then((me) => {
        if (!cancelled) setProfile(mapDoctorMeToProfile(me));
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DoctorHubProfileContext.Provider value={profile}>
      {children}
    </DoctorHubProfileContext.Provider>
  );
}

export function useDoctorHubProfile(): DoctorHubProfileView {
  const ctx = useContext(DoctorHubProfileContext);
  if (ctx) return ctx;
  const name = (localStorage.getItem("name") ?? "").trim();
  return {
    profileId: null,
    userId: null,
    displayName: name || "—",
    email: (localStorage.getItem("email") ?? "").trim(),
    initials: name
      ? name
          .split(/\s+/)
          .map((p) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "—",
    title: "—",
    department: "—",
    faculty: "—",
    semester: "—",
    profilePhoto: null,
  };
}
