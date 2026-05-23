import { parseSectionFromSearch } from "./doctorHubNav";
import type { DoctorDashboardSection } from "../../../pages/doctor/doctorDashboardTypes";

/** Sidebar section highlight from the current URL (route items use pathname separately). */
export function resolveDoctorHubActiveSection(
  pathname: string,
  search: string,
): DoctorDashboardSection {
  if (pathname.startsWith("/courses")) return "courses";
  const parsed = parseSectionFromSearch(search);
  if (pathname === "/doctor-dashboard" && parsed) return parsed;
  return "overview";
}
