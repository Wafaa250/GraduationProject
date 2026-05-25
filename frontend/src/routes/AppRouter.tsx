import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { PublicLayout } from "@/layouts/PublicLayout";
import { StudentSidebarLayout } from "@/layouts/StudentSidebarLayout";
import { DoctorHubLayout } from "@/layouts/DoctorHubLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import StudentDashboardPage from "@/pages/student/StudentDashboardPage";
import StudentProfilePage from "@/pages/student/StudentProfilePage";
import StudentProfileEditPage from "@/pages/student/StudentProfileEditPage";
import CreateGraduationProjectPage from "@/pages/student/CreateGraduationProjectPage";
import GraduationProjectWorkspacePage from "@/pages/student/GraduationProjectWorkspacePage";
import DoctorDashboardPage from "@/pages/doctor/DoctorDashboardPage";
import DoctorProfilePage from "@/pages/doctor/DoctorProfilePage";
import DoctorProfileEditPage from "@/pages/doctor/DoctorProfileEditPage";
import DoctorNotificationsPage from "@/pages/doctor/DoctorNotificationsPage";
import DoctorMessagesPage from "@/pages/doctor/DoctorMessagesPage";
import DoctorSupervisionRequestsPage from "@/pages/doctor/DoctorSupervisionRequestsPage";
import DoctorProjectsPage from "@/pages/doctor/DoctorProjectsPage";
import DoctorProjectDetailPage from "@/pages/doctor/DoctorProjectDetailPage";
import DoctorCoursesPage from "@/pages/doctor/DoctorCoursesPage";
import DoctorCourseDetailPage from "@/pages/doctor/DoctorCourseDetailPage";
import DoctorStudentProfilePage from "@/pages/doctor/DoctorStudentProfilePage";
import { LandingPage } from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import StudentAssociationRegisterPage from "@/pages/auth/StudentAssociationRegisterPage";
import { ROUTES } from "@/routes/paths";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route path={ROUTES.registerAssociation} element={<StudentAssociationRegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <StudentSidebarLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.dashboard} element={<StudentDashboardPage />} />
          <Route path={ROUTES.profile} element={<StudentProfilePage />} />
          <Route path={ROUTES.editProfile} element={<StudentProfileEditPage />} />
          <Route path={ROUTES.createGraduationProject} element={<CreateGraduationProjectPage />} />
          <Route
            path={ROUTES.graduationProjectWorkspace}
            element={<GraduationProjectWorkspacePage />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <DoctorHubLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.doctorDashboard} element={<DoctorDashboardPage />} />
          <Route path={ROUTES.doctorProfile} element={<DoctorProfilePage />} />
          <Route path={ROUTES.doctorEditProfile} element={<DoctorProfileEditPage />} />
          <Route path={ROUTES.doctorNotifications} element={<DoctorNotificationsPage />} />
          <Route path={ROUTES.doctorMessages} element={<DoctorMessagesPage />} />
          <Route path={ROUTES.doctorMessageThread} element={<DoctorMessagesPage />} />
          <Route path={ROUTES.doctorRequests} element={<DoctorSupervisionRequestsPage />} />
          <Route path={ROUTES.doctorProjects} element={<DoctorProjectsPage />} />
          <Route path={ROUTES.doctorProjectDetail} element={<DoctorProjectDetailPage />} />
          <Route path={ROUTES.doctorCourses} element={<DoctorCoursesPage />} />
          <Route path={ROUTES.doctorCourseDetail} element={<DoctorCourseDetailPage />} />
          <Route path={ROUTES.doctorStudentProfile} element={<DoctorStudentProfilePage />} />
        </Route>

        <Route path="/student/profile" element={<Navigate to={ROUTES.editProfile} replace />} />

        <Route element={<PublicLayout />}>
          <Route path={ROUTES.home} element={<LandingPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
