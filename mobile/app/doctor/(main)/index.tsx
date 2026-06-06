import { Redirect, type Href } from "expo-router";

import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";

export default function DoctorIndex() {
  return <Redirect href={DOCTOR_ROUTES.dashboard as Href} />;
}
