import { Navigate } from "react-router-dom";

/** @deprecated Courses are shown inside the doctor dashboard (My Courses section). */
export default function DoctorCoursesPage() {
  return <Navigate to="/doctor-dashboard" replace />;
}
