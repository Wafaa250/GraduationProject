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
import { ASSOCIATION_ROUTES, COMPANY_ROUTES, ROUTES } from "@/routes/paths";
import { AssociationRoute } from "@/routes/associationRoutes";
import AssociationDashboardPage from "@/pages/association/AssociationDashboardPage";
import AssociationProfilePage from "@/pages/association/AssociationProfilePage";
import OrganizationEventsListPage from "@/pages/association/events/OrganizationEventsListPage";
import OrganizationEventCreatePage from "@/pages/association/events/OrganizationEventCreatePage";
import OrganizationEventDetailsPage from "@/pages/association/events/OrganizationEventDetailsPage";
import OrganizationEventEditPage from "@/pages/association/events/OrganizationEventEditPage";
import OrganizationEventRegistrationFormPage from "@/pages/association/events/OrganizationEventRegistrationFormPage";
import OrganizationTeamMembersPage from "@/pages/association/OrganizationTeamMembersPage";
import OrganizationRecruitmentCampaignsListPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignsListPage";
import OrganizationRecruitmentCampaignCreatePage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignCreatePage";
import OrganizationRecruitmentCampaignDetailsPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignDetailsPage";
import OrganizationRecruitmentCampaignEditPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignEditPage";
import OrganizationRecruitmentPositionFormPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentPositionFormPage";
import OrganizationRecruitmentApplicationDetailPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentApplicationDetailPage";

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
          element={
            <ProtectedRoute>
              <AssociationRoute />
            </ProtectedRoute>
          }
        >
          <Route path={ASSOCIATION_ROUTES.dashboard} element={<AssociationDashboardPage />} />
          <Route path={ASSOCIATION_ROUTES.events} element={<OrganizationEventsListPage />} />
          <Route path={ASSOCIATION_ROUTES.eventCreate} element={<OrganizationEventCreatePage />} />
          <Route path="/association/events/:eventId" element={<OrganizationEventDetailsPage />} />
          <Route path="/association/events/:eventId/edit" element={<OrganizationEventEditPage />} />
          <Route
            path="/association/events/:eventId/registration-form"
            element={<OrganizationEventRegistrationFormPage />}
          />
          <Route path={ASSOCIATION_ROUTES.recruitment} element={<OrganizationRecruitmentCampaignsListPage />} />
          <Route path={ASSOCIATION_ROUTES.recruitmentCreate} element={<OrganizationRecruitmentCampaignCreatePage />} />
          <Route
            path="/association/recruitment/:campaignId/applications/:applicationId"
            element={<OrganizationRecruitmentApplicationDetailPage />}
          />
          <Route path="/association/recruitment/:campaignId" element={<OrganizationRecruitmentCampaignDetailsPage />} />
          <Route path="/association/recruitment/:campaignId/edit" element={<OrganizationRecruitmentCampaignEditPage />} />
          <Route
            path="/association/recruitment/:campaignId/positions/:positionId/form"
            element={<OrganizationRecruitmentPositionFormPage />}
          />
          <Route path={ASSOCIATION_ROUTES.leadership} element={<OrganizationTeamMembersPage />} />
          <Route path={ASSOCIATION_ROUTES.profile} element={<AssociationProfilePage />} />
          <Route path={ASSOCIATION_ROUTES.settings} element={<AssociationProfilePage />} />
        </Route>

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
