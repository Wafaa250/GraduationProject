import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useUser } from "../../../../context/UserContext";
import type { StudentDashboardShellProps } from "../components/StudentDashboardShell";

export function useStudentDashboardShellProps(
  overrides?: Partial<
    Pick<StudentDashboardShellProps, "gradProjectId" | "globalSearchResults" | "globalSearchLoading">
  >,
): Omit<StudentDashboardShellProps, "children"> {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return {
    userName: profile.fullName,
    profilePic: profile.profilePic,
    gradProjectId: overrides?.gradProjectId ?? null,
    searchQuery,
    onSearchChange: setSearchQuery,
    searchWrapRef,
    globalSearchResults: overrides?.globalSearchResults ?? null,
    globalSearchLoading: overrides?.globalSearchLoading ?? false,
    onSelectStudent: (id: number) => navigate(`/students/${id}`),
    onSelectDoctor: (id: number) => navigate(`/doctors/${id}`),
    onOpenSettings: () => navigate("/edit-profile"),
    onLogout: handleLogout,
  };
}
