import type { ReactNode } from "react";
import { DoctorHubShellPage } from "../../../pages/doctor/DoctorHubShellPage";

type Props = {
  children: ReactNode;
};

/** Wraps shared routes (e.g. `/students`) with hub chrome when the signed-in user is a doctor. */
export function DoctorAdaptiveShell({ children }: Props) {
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  if (role === "doctor") {
    return <DoctorHubShellPage>{children}</DoctorHubShellPage>;
  }
  return <>{children}</>;
}
