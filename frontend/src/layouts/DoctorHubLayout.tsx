import { Navigate, Outlet } from "react-router-dom";
import { getMe } from "@/api/meApi";
import { ROUTES } from "@/routes/paths";
import { useEffect, useState } from "react";
import { DoctorHubSidebar } from "@/components/doctor/hub/DoctorHubSidebar";
import { DoctorHubHeader } from "@/components/doctor/hub/DoctorHubHeader";
import { DoctorHubProfileProvider } from "@/components/doctor/hub/DoctorHubProfileContext";
import { DoctorShareUpdateProvider } from "@/components/doctor/hub/DoctorShareUpdateContext";
import "@/styles/doctor-hub-theme.css";
import "@/styles/doctor-course-project-workspace.css";

/** Lovable supervisor dashboard shell — sidebar + header + outlet. */
export function DoctorHubLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getMe()
      .then((me) => {
        if (!cancelled) setRole((me as { role?: string }).role?.toLowerCase() ?? null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div className="doctor-hub h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading doctor workspace…
      </div>
    );
  }

  if (role !== "doctor") {
    return <Navigate to={ROUTES.home} replace />;
  }

  return (
    <DoctorHubProfileProvider>
      <DoctorShareUpdateProvider>
        <div className="doctor-hub h-screen flex overflow-hidden bg-background antialiased">
          <DoctorHubSidebar />
          <div className="doctor-hub__main flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
            <DoctorHubHeader />
            <div className="doctor-hub__content flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <Outlet />
            </div>
          </div>
        </div>
      </DoctorShareUpdateProvider>
    </DoctorHubProfileProvider>
  );
}
