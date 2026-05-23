import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import { DoctorDashboardLayout } from "./dashboard/DoctorDashboardLayout";
import { sectionToSearchParam } from "../../components/doctor/hub/doctorHubNav";
import { resolveDoctorHubActiveSection } from "../../components/doctor/hub/doctorHubActiveSection";
import type { DoctorDashboardSection, DoctorMeResponse } from "./doctorDashboardTypes";
import { formatDepartmentLine } from "./dashboard/doctorDisplayCopy";
import { normalizeDoctorMe } from "./dashboard/doctorDashboardApiMappers";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Loader2 } from "lucide-react";
import "./hub/doctor-hub-theme.css";

function doctorRole(): string {
  return (localStorage.getItem("role") ?? "").toLowerCase();
}

/** Route guard + shared sidebar/topbar shell for nested doctor hub routes. */
export function DoctorHubShellLayoutRoute() {
  const role = doctorRole();
  if (role === "student") return <Navigate to="/dashboard" replace />;
  if (role !== "doctor") return <Navigate to="/" replace />;
  return <DoctorHubShellLayout />;
}

function DoctorHubShellFrame({ content }: { content: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [me, setMe] = useState<DoctorMeResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setPageLoading(true);
      setPageError(null);
      try {
        const { data } = await api.get("/me");
        const doctorMe = normalizeDoctorMe(data);
        if (!doctorMe) {
          setPageError("This account is not a doctor profile.");
          setMe(null);
          return;
        }
        setMe(doctorMe);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          setPageError("Your session expired. Sign in again.");
          setMe(null);
          return;
        }
        setPageError(parseApiErrorMessage(err) || "Could not load your account.");
        setMe(null);
      } finally {
        setPageLoading(false);
      }
    };
    void run();
  }, []);

  const initials = useMemo(() => {
    const n = (me?.name ?? "").trim();
    if (!n) return "DR";
    return n
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [me?.name]);

  const doctorSubtitle = useMemo(
    () => formatDepartmentLine(me?.specialization, me?.department, me?.faculty),
    [me?.specialization, me?.department, me?.faculty],
  );

  const activeSection = useMemo(
    () => resolveDoctorHubActiveSection(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const handleSectionChange = useCallback(
    (section: DoctorDashboardSection) => {
      navigate(`/doctor-dashboard?section=${sectionToSearchParam(section)}`);
    },
    [navigate],
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  if (pageLoading) {
    return (
      <div className="doctor-hub min-h-screen grid place-items-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (pageError || !me) {
    return (
      <div className="doctor-hub min-h-screen p-6 max-w-lg mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{pageError ?? "Could not load doctor profile."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <DoctorDashboardLayout
      doctorName={me.name}
      doctorSubtitle={doctorSubtitle}
      initials={initials}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      onLogout={handleLogout}
    >
      {content}
    </DoctorDashboardLayout>
  );
}

/** Parent route layout — renders nested routes via `<Outlet />`. */
export function DoctorHubShellLayout() {
  return <DoctorHubShellFrame content={<Outlet />} />;
}

/** Shell wrapper for pages outside the layout route (e.g. shared `/students`). */
export function DoctorHubShellPage({ children }: { children: ReactNode }) {
  return <DoctorHubShellFrame content={children} />;
}
