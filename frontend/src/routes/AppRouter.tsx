import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { PublicLayout } from "@/layouts/PublicLayout";
import { CompanyWorkspaceLayout } from "@/layouts/CompanyWorkspaceLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { CompanyRoute } from "@/routes/companyRoutes";
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
import { CompanyDashboardPage } from "@/pages/company/CompanyDashboardPage";
import { CompanyRequestsPage } from "@/pages/company/CompanyRequestsPage";
import { CompanyRequestDetailPage } from "@/pages/company/CompanyRequestDetailPage";
import { CompanyNewRequestPage } from "@/pages/company/CompanyNewRequestPage";
import { CompanyRequestRecommendationsPage } from "@/pages/company/CompanyRequestRecommendationsPage";
import { CompanyAiMatchesPage } from "@/pages/company/CompanyAiMatchesPage";
import { CompanyDiscoverPage } from "@/pages/company/CompanyDiscoverPage";
import { CompanyCollaborationsPage } from "@/pages/company/CompanyCollaborationsPage";
import { CompanyMessagesPage } from "@/pages/company/CompanyMessagesPage";
import { CompanyProfilePage } from "@/pages/company/CompanyProfilePage";
import { CompanySettingsPage } from "@/pages/company/CompanySettingsPage";
import { COMPANY_ROUTES, ROUTES } from "@/routes/paths";

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

        <Route
          path={COMPANY_ROUTES.root}
          element={
            <ProtectedRoute>
              <CompanyRoute>
                <CompanyWorkspaceLayout />
              </CompanyRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<CompanyDashboardPage />} />
          <Route path="requests" element={<CompanyRequestsPage />} />
          <Route path="requests/new" element={<CompanyNewRequestPage />} />
          <Route path="requests/:id/edit" element={<CompanyNewRequestPage />} />
          <Route path="requests/:id/recommendations" element={<CompanyRequestRecommendationsPage />} />
          <Route path="requests/:id" element={<CompanyRequestDetailPage />} />
          <Route path="matches" element={<CompanyAiMatchesPage />} />
          <Route path="discover" element={<CompanyDiscoverPage />} />
          <Route path="collaborations" element={<CompanyCollaborationsPage />} />
          <Route path="messages" element={<CompanyMessagesPage />} />
          <Route path="profile" element={<CompanyProfilePage />} />
          <Route path="settings" element={<CompanySettingsPage />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path={ROUTES.home} element={<LandingPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
