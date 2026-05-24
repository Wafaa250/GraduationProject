import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { PublicLayout } from "@/layouts/PublicLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import {
  StudentCreateGraduationProjectRoute,
  StudentDashboardRoute,
  StudentEditProfileRoute,
  StudentGraduationProjectWorkspaceRoute,
  StudentProfileRoute,
} from "@/routes/studentRoutes";
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
          path={ROUTES.dashboard}
          element={
            <ProtectedRoute>
              <StudentDashboardRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.profile}
          element={
            <ProtectedRoute>
              <StudentProfileRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.editProfile}
          element={
            <ProtectedRoute>
              <StudentEditProfileRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.createGraduationProject}
          element={
            <ProtectedRoute>
              <StudentCreateGraduationProjectRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.graduationProjectWorkspace}
          element={
            <ProtectedRoute>
              <StudentGraduationProjectWorkspaceRoute />
            </ProtectedRoute>
          }
        />

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
