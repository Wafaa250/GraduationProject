import { ROUTES } from "@/routes/paths";

export const DOCTOR_NAV_ROUTES: Record<string, string> = {
  dashboard: ROUTES.doctorDashboard,
  requests: ROUTES.doctorRequests,
  projects: ROUTES.doctorProjects,
  courses: ROUTES.doctorCourses,
  messages: ROUTES.doctorMessages,
  notifications: ROUTES.doctorNotifications,
  profile: ROUTES.doctorProfile,
  settings: ROUTES.doctorEditProfile,
};

export function doctorNavKeyFromPath(pathname: string): string {
  if (pathname.startsWith(ROUTES.doctorRequests)) return "requests";
  if (pathname.startsWith("/doctor/projects")) return "projects";
  if (pathname.startsWith("/doctor/courses")) return "courses";
  if (pathname.startsWith("/doctor/messages")) return "messages";
  if (pathname.startsWith(ROUTES.doctorNotifications)) return "notifications";
  if (pathname === ROUTES.doctorProfile) return "profile";
  if (pathname === ROUTES.doctorEditProfile) return "settings";
  if (pathname === ROUTES.doctorDashboard) return "dashboard";
  return "dashboard";
}

/** Global header search — only on doctor workflows where lookup adds value. */
export function doctorHubShowsGlobalSearch(pathname: string): boolean {
  if (pathname === ROUTES.doctorProfile) return false;
  if (pathname === ROUTES.doctorEditProfile) return false;
  if (pathname.startsWith(ROUTES.doctorNotifications)) return false;
  if (pathname.startsWith(ROUTES.doctorRequests)) return false;
  if (pathname === ROUTES.doctorDashboard) return true;
  if (pathname.startsWith("/doctor/students")) return true;
  if (pathname.startsWith("/doctor/messages")) return true;
  if (pathname.startsWith("/doctor/courses")) return true;
  if (pathname.startsWith("/doctor/projects")) return true;
  return false;
}
