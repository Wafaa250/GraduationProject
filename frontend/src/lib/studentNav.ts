import { ROUTES } from "@/routes/paths";

/** Paths that represent the authenticated student's own profile area. */
const STUDENT_PROFILE_PREFIXES = [
  ROUTES.profile,
  ROUTES.editProfile,
  "/my-profile",
  "/students/me",
  "/student/profile",
] as const;

/**
 * True when the student is on their profile view or edit flow (not another user's profile).
 */
export function isStudentProfileRoute(pathname: string): boolean {
  return STUDENT_PROFILE_PREFIXES.some((base) => {
    if (pathname === base) return true;
    return pathname.startsWith(`${base}/`);
  });
}
