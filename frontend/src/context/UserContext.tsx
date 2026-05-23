import { createContext, useContext, useState, type ReactNode } from "react";

export interface UserProfile {
  fullName: string;
  email: string;
  profilePic: string | null;
  studentId: string;
  university: string;
  faculty: string;
  major: string;
  academicYear: string;
  gpa: string;
  roles: string[];
  technicalSkills: string[];
  tools: string[];
  role: string;
}

export const EMPTY_PROFILE: UserProfile = {
  fullName: "",
  email: "",
  profilePic: null,
  studentId: "",
  university: "",
  faculty: "",
  major: "",
  academicYear: "",
  gpa: "",
  roles: [],
  technicalSkills: [],
  tools: [],
  role: "student",
};

type UserContextValue = {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);

  const updateProfile = (patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
