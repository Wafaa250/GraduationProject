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
import { ChangePasswordPage } from "@/pages/auth/ChangePasswordPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import StudentAssociationRegisterPage from "@/pages/auth/StudentAssociationRegisterPage";
import { CompanyDashboardPage } from "@/pages/company/CompanyDashboardPage";
import { CompanyRequestsPage } from "@/pages/company/CompanyRequestsPage";
import { CompanyRequestDetailPage } from "@/pages/company/CompanyRequestDetailPage";
import { CompanyNewRequestPage } from "@/pages/company/CompanyNewRequestPage";
import { CompanyRequestRecommendationsPage } from "@/pages/company/CompanyRequestRecommendationsPage";
import { CompanyStudentDiscoveryProfilePage } from "@/pages/company/CompanyStudentDiscoveryProfilePage";
import { CompanyTeamDiscoveryProfilePage } from "@/pages/company/CompanyTeamDiscoveryProfilePage";
import { CompanyProfilePage } from "@/pages/company/CompanyProfilePage";
import { CompanyMembersPage } from "@/pages/company/CompanyMembersPage";
import { CompanySavedRecommendationsPage } from "@/pages/company/CompanySavedRecommendationsPage";
import { CompanySettingsPage } from "@/pages/company/CompanySettingsPage";
import { COMPANY_ROUTES, ROUTES } from "@/routes/paths";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.changePassword} element={<ChangePasswordPage />} />
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
          <Route
            path="requests/:requestId/teams/:teamId"
            element={<CompanyTeamDiscoveryProfilePage />}
          />
          <Route
            path="requests/:requestId/students/:studentProfileId"
            element={<CompanyStudentDiscoveryProfilePage />}
          />
          <Route path="requests/:id" element={<CompanyRequestDetailPage />} />
          <Route path="matches" element={<Navigate to={COMPANY_ROUTES.requests} replace />} />
          <Route path="discover" element={<Navigate to={COMPANY_ROUTES.requests} replace />} />
          <Route path="collaborations" element={<Navigate to={COMPANY_ROUTES.dashboard} replace />} />
          <Route path="messages" element={<Navigate to={COMPANY_ROUTES.dashboard} replace />} />
          <Route path="profile" element={<CompanyProfilePage />} />
          <Route path="members" element={<CompanyMembersPage />} />
          <Route path="saved" element={<CompanySavedRecommendationsPage />} />
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
