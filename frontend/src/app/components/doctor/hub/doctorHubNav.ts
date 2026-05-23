import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import type { DoctorDashboardSection } from "../../../pages/doctor/doctorDashboardTypes";

export type DoctorHubNavItem =
  | {
      kind: "section";
      section: DoctorDashboardSection;
      title: string;
      icon: LucideIcon;
      countKey?: "pendingRequests";
    }
  | {
      kind: "route";
      title: string;
      icon: LucideIcon;
      to: string;
    };

export const DOCTOR_HUB_WORKSPACE_NAV: DoctorHubNavItem[] = [
  { kind: "section", section: "overview", title: "Dashboard", icon: LayoutDashboard },
  { kind: "section", section: "courses", title: "My Courses", icon: BookOpen },
  { kind: "route", title: "Student Directory", icon: Users, to: "/students" },
  { kind: "route", title: "Notifications", icon: Bell, to: "/doctor/notifications" },
];

export const DOCTOR_HUB_SUPERVISION_NAV: DoctorHubNavItem[] = [
  {
    kind: "section",
    section: "requests",
    title: "Supervision Requests",
    icon: ShieldCheck,
    countKey: "pendingRequests",
  },
  { kind: "section", section: "projects", title: "Supervised Projects", icon: GraduationCap },
  { kind: "section", section: "requests", title: "Cancellation Requests", icon: ShieldCheck },
];

export const DOCTOR_HUB_ACCOUNT_NAV: DoctorHubNavItem[] = [
  { kind: "section", section: "deleted", title: "Removed projects", icon: Trash2 },
  { kind: "route", title: "Profile Settings", icon: Settings, to: "/doctor/profile" },
];

export function sectionToSearchParam(section: DoctorDashboardSection): string {
  return section;
}

export function parseSectionFromSearch(search: string): DoctorDashboardSection | null {
  const section = new URLSearchParams(search).get("section");
  const tab = new URLSearchParams(search).get("tab");
  if (tab === "my-courses") return "courses";
  if (
    section === "overview" ||
    section === "requests" ||
    section === "projects" ||
    section === "courses" ||
    section === "deleted"
  ) {
    return section;
  }
  return null;
}
