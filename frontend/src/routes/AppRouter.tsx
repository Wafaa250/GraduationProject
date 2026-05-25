import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { PublicLayout } from "@/layouts/PublicLayout";
import { StudentSidebarLayout } from "@/layouts/StudentSidebarLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import StudentDashboardPage from "@/pages/student/StudentDashboardPage";
import StudentProfilePage from "@/pages/student/StudentProfilePage";
import StudentProfileEditPage from "@/pages/student/StudentProfileEditPage";
import CreateGraduationProjectPage from "@/pages/student/CreateGraduationProjectPage";
import GraduationProjectWorkspacePage from "@/pages/student/GraduationProjectWorkspacePage";
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

        {/* Legacy path from earlier integration */}
        <Route path="/student/profile" element={<Navigate to={ROUTES.editProfile} replace />} />

        <Route element={<PublicLayout />}>
          <Route path={ROUTES.home} element={<LandingPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
