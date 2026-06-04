import { COMPANY_ROUTES } from "@/routes/paths";

export type CompanyPageMeta = {
  title: string;
  subtitle?: string;
};

/** Route-aware page context for the company topbar (presentation only). */
export function getCompanyPageMeta(pathname: string): CompanyPageMeta | null {
  if (pathname === COMPANY_ROUTES.dashboard) {
    return { title: "Dashboard", subtitle: "Hiring workspace overview" };
  }
  if (pathname === COMPANY_ROUTES.requests) {
    return { title: "Project Requests", subtitle: "Manage collaboration requests" };
  }
  if (pathname === COMPANY_ROUTES.newRequest) {
    return { title: "New Request" };
  }
  if (pathname.startsWith(`${COMPANY_ROUTES.requests}/`) && pathname.includes("/recommendations")) {
    return { title: "AI Recommendations", subtitle: "Matched candidates and teams" };
  }
  if (pathname.startsWith(`${COMPANY_ROUTES.requests}/`) && pathname.includes("/edit")) {
    return { title: "Edit Request", subtitle: "Update project requirements" };
  }
  if (pathname.match(/^\/company\/requests\/\d+$/)) {
    return { title: "Request Details", subtitle: "Roles, status, and shortlists" };
  }
  if (pathname.startsWith(`${COMPANY_ROUTES.requests}/`)) {
    return { title: "Project Request", subtitle: "Request workspace" };
  }
  if (pathname === COMPANY_ROUTES.saved) {
    return { title: "Saved Recommendations", subtitle: "Your shortlisted talent" };
  }
  if (pathname === COMPANY_ROUTES.profile) {
    return { title: "Company Profile", subtitle: "Public company information" };
  }
  if (pathname === COMPANY_ROUTES.members) {
    return { title: "Workspace Members", subtitle: "Team access and invitations" };
  }
  if (pathname === COMPANY_ROUTES.settings) {
    return { title: "Settings", subtitle: "Security and workspace preferences" };
  }
  if (pathname === COMPANY_ROUTES.themeShowcase) {
    return { title: "Workspace themes", subtitle: "Preview and apply palettes" };
  }
  if (pathname === COMPANY_ROUTES.messages) {
    return { title: "Messages", subtitle: "Workspace conversations" };
  }
  if (pathname === COMPANY_ROUTES.matches) {
    return { title: "AI Matches", subtitle: "Discovery and matching" };
  }
  if (pathname === COMPANY_ROUTES.discover) {
    return { title: "Discover", subtitle: "Explore talent" };
  }
  if (pathname === COMPANY_ROUTES.collaborations) {
    return { title: "Collaborations", subtitle: "Active partnerships" };
  }
  return null;
}
