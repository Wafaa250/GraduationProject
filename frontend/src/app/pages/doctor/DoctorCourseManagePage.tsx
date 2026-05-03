import { Navigate } from "react-router-dom";

/** @deprecated Course management opens as a panel inside the doctor dashboard. */
export default function DoctorCourseManagePage() {
  return <Navigate to="/doctor-dashboard" replace />;
}
