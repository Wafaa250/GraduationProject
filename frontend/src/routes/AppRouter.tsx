import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { PublicLayout } from "@/layouts/PublicLayout";
import { StudentSidebarLayout } from "@/layouts/StudentSidebarLayout";
import { DoctorHubLayout } from "@/layouts/DoctorHubLayout";
import StudentDashboardPage from "@/pages/student/StudentDashboardPage";
import StudentProfilePage from "@/pages/student/StudentProfilePage";
import StudentProfileEditPage from "@/pages/student/StudentProfileEditPage";
import CreateGraduationProjectPage from "@/pages/student/CreateGraduationProjectPage";
import GraduationProjectWorkspacePage from "@/pages/student/GraduationProjectWorkspacePage";
import StudentBrowseProjectsPage from "@/pages/student/StudentBrowseProjectsPage";
import StudentMessagesPage from "@/pages/student/StudentMessagesPage";
import StudentSettingsPage from "@/pages/student/StudentSettingsPage";
import FollowingPage from "@/pages/student/FollowingPage";
import StudentManageCoursesPage from "@/pages/student/StudentManageCoursesPage";
import StudentCourseProjectDetailsPage from "@/pages/student/StudentCourseProjectDetailsPage";
import DoctorDashboardPage from "@/pages/doctor/DoctorDashboardPage";
import DoctorProfilePage from "@/pages/doctor/DoctorProfilePage";
import DoctorProfileEditPage from "@/pages/doctor/DoctorProfileEditPage";
import DoctorMessagesPage from "@/pages/doctor/DoctorMessagesPage";
import DoctorSupervisionRequestsPage from "@/pages/doctor/DoctorSupervisionRequestsPage";
import DoctorProjectsPage from "@/pages/doctor/DoctorProjectsPage";
import DoctorProjectDetailPage from "@/pages/doctor/DoctorProjectDetailPage";
import DoctorProjectTeamChatPage from "@/pages/doctor/DoctorProjectTeamChatPage";
import DoctorCoursesPage from "@/pages/doctor/DoctorCoursesPage";
import DoctorCreateCoursePage from "@/pages/doctor/DoctorCreateCoursePage";
import DoctorCourseDetailPage from "@/pages/doctor/DoctorCourseDetailPage";
import DoctorSectionDetailPage from "@/pages/doctor/DoctorSectionDetailPage";
import DoctorCourseProjectDetailPage from "@/pages/doctor/DoctorCourseProjectDetailPage";
import DoctorStudentProfilePage from "@/pages/doctor/DoctorStudentProfilePage";
import DoctorSettingsPage from "@/pages/doctor/DoctorSettingsPage";
import { LandingPage } from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ForgotPasswordVerifyPage from "@/pages/auth/ForgotPasswordVerifyPage";
import ForgotPasswordNewPasswordPage from "@/pages/auth/ForgotPasswordNewPasswordPage";
import ForgotPasswordSuccessPage from "@/pages/auth/ForgotPasswordSuccessPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import { ChangePasswordPage } from "@/pages/auth/ChangePasswordPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import StudentAssociationRegisterPage from "@/pages/auth/StudentAssociationRegisterPage";
import { RoleThemeProvider } from "@/context/RoleThemeContext";
import { CompanyWorkspaceLayout } from "@/layouts/CompanyWorkspaceLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { CompanyRoute } from "@/routes/companyRoutes";
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
import { CompanyThemeShowcasePage } from "@/pages/company/CompanyThemeShowcasePage";
import { ASSOCIATION_ROUTES, COMPANY_ROUTES, ROUTES } from "@/routes/paths";
import { AssociationRoute } from "@/routes/associationRoutes";
import AssociationDashboardPage from "@/pages/association/AssociationDashboardPage";
import AssociationProfilePage from "@/pages/association/AssociationProfilePage";
import OrganizationEventsListPage from "@/pages/association/events/OrganizationEventsListPage";
import OrganizationEventCreatePage from "@/pages/association/events/OrganizationEventCreatePage";
import OrganizationEventDetailsPage from "@/pages/association/events/OrganizationEventDetailsPage";
import OrganizationEventRegistrationDetailPage from "@/pages/association/events/OrganizationEventRegistrationDetailPage";
import OrganizationEventEditPage from "@/pages/association/events/OrganizationEventEditPage";
import OrganizationEventRegistrationFormPage from "@/pages/association/events/OrganizationEventRegistrationFormPage";
import OrganizationTeamMembersPage from "@/pages/association/OrganizationTeamMembersPage";
import OrganizationRecruitmentCampaignsListPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignsListPage";
import OrganizationRecruitmentCampaignCreatePage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignCreatePage";
import OrganizationRecruitmentCampaignDetailsPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignDetailsPage";
import OrganizationRecruitmentCampaignEditPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignEditPage";
import OrganizationRecruitmentPositionFormPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentPositionFormPage";
import OrganizationRecruitmentApplicationDetailPage from "@/pages/association/recruitment-campaigns/OrganizationRecruitmentApplicationDetailPage";
import StudentDirectoryProfilePage from "@/pages/student/StudentDirectoryProfilePage";
import DoctorPublicProfilePage from "@/pages/student/DoctorPublicProfilePage";
import OrganizationVisitorProfilePage from "@/pages/student/OrganizationVisitorProfilePage";
import CompanyVisitorProfilePage from "@/pages/student/CompanyVisitorProfilePage";
import { CompanyTalentRequestDetailPage } from "@/pages/company/CompanyTalentRequestDetailPage";
import { StudentCommunicationHubRoute } from "@/routes/studentRoutes";
import { StudentCompanyRequestDetailRoute } from "@/routes/StudentCompanyRequestDetailRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <RoleThemeProvider>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.forgotPasswordVerify} element={<ForgotPasswordVerifyPage />} />
        <Route path={ROUTES.forgotPasswordNew} element={<ForgotPasswordNewPasswordPage />} />
        <Route path={ROUTES.forgotPasswordSuccess} element={<ForgotPasswordSuccessPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        <Route path={ROUTES.changePassword} element={<ChangePasswordPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route path={ROUTES.registerAssociation} element={<StudentAssociationRegisterPage />} />

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
          <Route path="talent-requests/:id" element={<CompanyTalentRequestDetailPage />} />
          <Route path="matches" element={<Navigate to={COMPANY_ROUTES.requests} replace />} />
          <Route path="discover" element={<Navigate to={COMPANY_ROUTES.requests} replace />} />
          <Route path="collaborations" element={<Navigate to={COMPANY_ROUTES.dashboard} replace />} />
          <Route path="messages" element={<Navigate to={COMPANY_ROUTES.dashboard} replace />} />
          <Route path="profile" element={<CompanyProfilePage />} />
          <Route path="members" element={<CompanyMembersPage />} />
          <Route path="saved" element={<CompanySavedRecommendationsPage />} />
          <Route path="settings" element={<CompanySettingsPage />} />
          <Route path="themes" element={<CompanyThemeShowcasePage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <StudentSidebarLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.dashboard} element={<StudentDashboardPage />} />
          <Route path={ROUTES.communicationHub} element={<StudentCommunicationHubRoute />} />
          <Route path="/students/:userId" element={<StudentDirectoryProfilePage />} />
          <Route path="/doctors/:userId" element={<DoctorPublicProfilePage />} />
          <Route path="/organizations/:organizationId" element={<OrganizationVisitorProfilePage />} />
          <Route path="/companies/:companyProfileId" element={<CompanyVisitorProfilePage />} />
          <Route path="/association/events/:eventId" element={<OrganizationEventDetailsPage />} />
          <Route
            path="/association/recruitment/:campaignId"
            element={<OrganizationRecruitmentCampaignDetailsPage />}
          />
          <Route path="/company/requests/:id" element={<StudentCompanyRequestDetailRoute />} />
          <Route path={ROUTES.profile} element={<StudentProfilePage />} />
          <Route path={ROUTES.editProfile} element={<StudentProfileEditPage />} />
          <Route path={ROUTES.createGraduationProject} element={<CreateGraduationProjectPage />} />
          <Route
            path={ROUTES.graduationProjectWorkspace}
            element={<GraduationProjectWorkspacePage />}
          />
          <Route path={ROUTES.browseProjects} element={<StudentBrowseProjectsPage />} />
          <Route path={ROUTES.studentCourses} element={<StudentManageCoursesPage />} />
          <Route path={ROUTES.studentCourseDetail} element={<StudentManageCoursesPage />} />
          <Route
            path={ROUTES.studentCourseProjectDetail}
            element={<StudentCourseProjectDetailsPage />}
          />
          <Route path={ROUTES.studentMessages} element={<StudentMessagesPage />} />
          <Route path={ROUTES.studentMessageThread} element={<StudentMessagesPage />} />
          <Route path={ROUTES.following} element={<FollowingPage />} />
          <Route path={ROUTES.settings} element={<StudentSettingsPage />} />
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
          <Route path="/doctor/notifications" element={<Navigate to={ROUTES.doctorDashboard} replace />} />
          <Route path={ROUTES.doctorMessages} element={<DoctorMessagesPage />} />
          <Route path={ROUTES.doctorMessageThread} element={<DoctorMessagesPage />} />
          <Route path={ROUTES.doctorRequests} element={<DoctorSupervisionRequestsPage />} />
          <Route path={ROUTES.doctorProjects} element={<DoctorProjectsPage />} />
          <Route path={ROUTES.doctorProjectDetail} element={<DoctorProjectDetailPage />} />
          <Route path={ROUTES.doctorProjectChat} element={<DoctorProjectTeamChatPage />} />
          <Route path={ROUTES.doctorCourses} element={<DoctorCoursesPage />} />
          <Route path={ROUTES.doctorCreateCourse} element={<DoctorCreateCoursePage />} />
          <Route path={ROUTES.doctorCourseDetail} element={<DoctorCourseDetailPage />} />
          <Route path={ROUTES.doctorSectionDetail} element={<DoctorSectionDetailPage />} />
          <Route path={ROUTES.doctorCourseProjectDetail} element={<DoctorCourseProjectDetailPage />} />
          <Route path={ROUTES.doctorStudentProfile} element={<DoctorStudentProfilePage />} />
          <Route path={ROUTES.doctorSettings} element={<DoctorSettingsPage />} />
        </Route>

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
          <Route
            path="/association/events/:eventId/registrations/:registrationId"
            element={<OrganizationEventRegistrationDetailPage />}
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

        <Route element={<PublicLayout />}>
          <Route path={ROUTES.home} element={<LandingPage />} />
        </Route>
      </Routes>
      <Toaster />
      </RoleThemeProvider>
    </BrowserRouter>
  );
}
