import { Outlet } from "react-router-dom";
import { DoctorHubSidebar } from "@/components/doctor/hub/DoctorHubSidebar";
import { DoctorHubHeader } from "@/components/doctor/hub/DoctorHubHeader";
import { DoctorHubProfileProvider } from "@/components/doctor/hub/DoctorHubProfileContext";
import "@/styles/doctor-hub-theme.css";

/** Lovable supervisor dashboard shell — sidebar + header + outlet. */
export function DoctorHubLayout() {
  return (
    <DoctorHubProfileProvider>
      <div className="doctor-hub h-screen flex overflow-hidden bg-background antialiased">
        <DoctorHubSidebar />
        <div className="doctor-hub__main flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
          <DoctorHubHeader />
          <div className="doctor-hub__content flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </DoctorHubProfileProvider>
  );
}
