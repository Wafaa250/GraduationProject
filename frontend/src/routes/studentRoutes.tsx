import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ROUTES } from "@/routes/paths";
import StudentDashboardPage from "@/pages/student/StudentDashboardPage";
import StudentProfilePage from "@/pages/student/StudentProfilePage";
import StudentProfileEditPage from "@/pages/student/StudentProfileEditPage";

/** Student dashboard — other roles redirect away (legacy App.tsx). */
export function StudentDashboardRoute() {
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  if (role === "student") return <StudentDashboardPage />;
  return <Navigate to={ROUTES.home} replace />;
}

/** Own profile view — students only (legacy ProfileRoute). */
export function StudentProfileRoute() {
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  if (role === "student") return <StudentProfilePage />;
  return <Navigate to={ROUTES.home} replace />;
}

/** Edit profile form — students only (legacy EditProfileRoute). */
export function StudentEditProfileRoute() {
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  if (role === "student") return <StudentProfileEditPage />;
  return <Navigate to={ROUTES.home} replace />;
}

export function StudentOnlyRoute({ children }: { children: ReactNode }) {
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  if (role === "student") return <>{children}</>;
  return <Navigate to={ROUTES.home} replace />;
}
