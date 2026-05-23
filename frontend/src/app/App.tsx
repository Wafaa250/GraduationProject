// src/app/App.tsx
import React, { type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { ToastProvider } from "../context/ToastContext";
import { UserProvider } from '../context/UserContext';
import { DoctorProvider } from './pages/doctor/DoctorContext';
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProfilePage from "./pages/profile/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import DoctorDashboardPage from "./pages/doctor/DoctorDashboardPage";
import DoctorNotificationsPage from "./pages/doctor/DoctorNotificationsPage";
import { DoctorHubShellLayoutRoute } from "./pages/doctor/DoctorHubShellLayout";
import { DoctorAdaptiveShell } from "./components/doctor/hub/DoctorAdaptiveShell";
import DoctorProfilePage from "./pages/doctor/DoctorProfilePage";
import EditDoctorProfilePage from "./pages/doctor/EditDoctorProfilePage";
import ChannelPageWrapper from "./pages/doctor/ChannelPageWrapper";

import StudentFollowingOrganizationsPage from "./pages/students/StudentFollowingOrganizationsPage";
import StudentProfilePage from "./pages/students/StudentProfilePage";
import StudentsPage from "./pages/students/StudentsPage";
import ProjectWorkspacePage from "./pages/doctor/ProjectWorkspacePage";
import CreateCoursePage from "./pages/courses/CreateCoursePage";
import CourseWorkspacePage from "./pages/courses/CourseWorkspacePage";
import SectionStudentsPage from "./pages/courses/SectionStudentsPage";
import CourseProjectCreatePage from "./pages/courses/CourseProjectCreatePage";
import ProjectTeamsPage from "./pages/courses/ProjectTeamsPage";
import TeamManagementPage from "./pages/doctor/TeamManagementPage";
import StudentCoursesPage from "./pages/courses/StudentCoursesPage";
import StudentTeamGenerationChoicePage from "./pages/courses/StudentTeamGenerationChoicePage";
import StudentManualTeamPage from "./pages/courses/StudentManualTeamPage";
import StudentTeamInvitationsPage from "./pages/courses/StudentTeamInvitationsPage";
import StudentTeamPage from "./pages/team/StudentTeamPage";
import StudentAiTeamPage from "./pages/projects/StudentAiTeamPage";
import DoctorsPage from "./pages/doctors/DoctorsPage";
import ChatPage from "./pages/messages/ChatPage";
import StudentAssociationRegisterPage from "./pages/auth/StudentAssociationRegisterPage";
import CompanyDashboardPage from "./pages/company/CompanyDashboardPage";
import CompanyTalentSearchPage from "./pages/company/CompanyTalentSearchPage";
import CompanyTalentSearchResultsPage from "./pages/company/CompanyTalentSearchResultsPage";
import AssociationDashboardPage from "./pages/association/AssociationDashboardPage";
import AssociationProfilePage from "./pages/association/AssociationProfilePage";
import OrganizationEventsListPage from "./pages/association/events/OrganizationEventsListPage";
import OrganizationEventCreatePage from "./pages/association/events/OrganizationEventCreatePage";
import OrganizationEventDetailsPage from "./pages/association/events/OrganizationEventDetailsPage";
import OrganizationEventEditPage from "./pages/association/events/OrganizationEventEditPage";
import OrganizationEventRegistrationFormPage from "./pages/association/events/OrganizationEventRegistrationFormPage";
import OrganizationTeamMembersPage from "./pages/association/OrganizationTeamMembersPage";
import OrganizationRecruitmentCampaignsListPage from "./pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignsListPage";
import OrganizationRecruitmentCampaignCreatePage from "./pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignCreatePage";
import OrganizationRecruitmentCampaignDetailsPage from "./pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignDetailsPage";
import OrganizationRecruitmentCampaignEditPage from "./pages/association/recruitment-campaigns/OrganizationRecruitmentCampaignEditPage";
import OrganizationRecruitmentPositionFormPage from "./pages/association/recruitment-campaigns/OrganizationRecruitmentPositionFormPage";
import OrganizationRecruitmentApplicationDetailPage from "./pages/association/recruitment-campaigns/OrganizationRecruitmentApplicationDetailPage";
import StudentOrganizationsPage from "./pages/organizations/StudentOrganizationsPage";
import PublicOrganizationProfilePage from "./pages/organizations/PublicOrganizationProfilePage";
import PublicOrganizationEventPage from "./pages/organizations/PublicOrganizationEventPage";
import PublicRecruitmentCampaignPage from "./pages/organizations/PublicRecruitmentCampaignPage";
import CommunitiesHubPage from "./pages/communities/CommunitiesHubPage";
import CommunityEventsPage from "./pages/communities/CommunityEventsPage";
import CommunityRecruitmentPage from "./pages/communities/CommunityRecruitmentPage";
import { isAssociationRole } from "../api/associationApi";

function ProtectedRoute({ children }: { children: ReactNode }) {
    const token = localStorage.getItem('token')
    if (!token) return <Navigate to="/login" replace />
    return <>{children}</>
}

function StudentFollowingOrganizationsRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <StudentFollowingOrganizationsPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentCommunitiesHubRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <CommunitiesHubPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentOrganizationsRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <StudentOrganizationsPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentCommunityEventsRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <CommunityEventsPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentCommunityRecruitmentRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <CommunityRecruitmentPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    return <Navigate to="/" replace />;
}

/** Student dashboard — doctors and unknown roles are redirected to avoid wrong UI. */
function StudentDashboardRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    if (role === "student") return <DashboardPage />;
    return <Navigate to="/" replace />;
}

function AssociationDashboardRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (isAssociationRole(role)) return <AssociationDashboardPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function CompanyDashboardRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "company") return <CompanyDashboardPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function CompanyTalentSearchRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "company") return <CompanyTalentSearchPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function CompanyTalentSearchResultsRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "company") return <CompanyTalentSearchResultsPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function AssociationProfileRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (isAssociationRole(role)) return <AssociationProfilePage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function OrganizationEventsRoute({ children }: { children: ReactNode }) {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (isAssociationRole(role)) return <>{children}</>;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

/** Doctor dashboard — students and unknown roles are redirected. */
function DoctorDashboardRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <Navigate to="/dashboard" replace />;
    if (isAssociationRole(role)) return <Navigate to="/association/dashboard" replace />;
    if (role === "doctor") return <DoctorDashboardPage />;
    return <Navigate to="/" replace />;
}

/** Profile route split by role to avoid rendering student UI for doctors. */
function ProfileRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <Navigate to="/doctor/profile" replace />;
    if (role === "student") return <ProfilePage />;
    return <Navigate to="/" replace />;
}

/** Edit profile route split by role to keep doctor edit form separate. */
function EditProfileRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <Navigate to="/doctor/edit-profile" replace />;
    if (role === "student") return <EditProfilePage />;
    return <Navigate to="/" replace />;
}

/** Doctor-only profile route. */
function DoctorProfileRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <DoctorProfilePage />;
    if (role === "student") return <Navigate to="/profile" replace />;
    return <Navigate to="/" replace />;
}

/** Doctor-only edit profile route. */
function EditDoctorProfileRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <EditDoctorProfilePage />;
    if (role === "student") return <Navigate to="/edit-profile" replace />;
    return <Navigate to="/" replace />;
}

/** Old course URLs → doctor dashboard (courses live in-dashboard). */
function DoctorCoursesLegacyRedirect() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <Navigate to="/dashboard" replace />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard?section=courses" replace />;
    return <Navigate to="/" replace />;
}

/** Doctor-only create course page. */
function CreateCourseDoctorRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <CreateCoursePage />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

/** Doctor-only course workspace (must stay below `/courses/create` so `create` is not a param). */
function CourseWorkspaceDoctorRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <CourseWorkspacePage />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

/** Doctor-only section roster UI (more specific than `/courses/:courseId`). */
function SectionStudentsDoctorRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <SectionStudentsPage />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

/** Doctor-only AI teams preview (local UI; no API). */
function ProjectTeamsDoctorRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <ProjectTeamsPage />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

/** Legacy `/doctor/projects/:id/teams` — requires `courseId` in location state. */
function DoctorProjectTeamsRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const courseId = (location.state as { courseId?: number } | null)?.courseId;
    if (role !== "doctor") {
        if (role === "student") return <Navigate to="/dashboard" replace />;
        return <Navigate to="/" replace />;
    }
    if (courseId && projectId) {
        return (
            <Navigate
                to={`/courses/${courseId}/projects/${projectId}/teams`}
                replace
                state={location.state}
            />
        );
    }
    return <Navigate to="/doctor-dashboard?section=courses" replace />;
}

function TeamManagementDoctorRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <TeamManagementPage />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentCoursesRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <StudentCoursesPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentTeamRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <StudentTeamPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentAiTeamRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <StudentAiTeamPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentTeamGenerationChoiceRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <StudentTeamGenerationChoicePage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentManualTeamRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <StudentManualTeamPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/" replace />;
}

function StudentTeamInvitationsRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <StudentTeamInvitationsPage />;
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/" replace />;
}

export default function App() {
    return (
        <ToastProvider>
        <Toaster position="top-right" />
        <UserProvider>
            <DoctorProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/register/association" element={<StudentAssociationRegisterPage />} />
                    <Route path="/students/:studentId" element={<ProfilePage />} />
                    <Route path="/doctors/:doctorId" element={<DoctorProfilePage />} />

                    {/* Protected – Student */}
                    <Route path="/dashboard" element={<ProtectedRoute><StudentDashboardRoute /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfileRoute /></ProtectedRoute>} />
                    <Route path="/edit-profile" element={<ProtectedRoute><EditProfileRoute /></ProtectedRoute>} />
                    <Route path="/student/courses" element={<ProtectedRoute><StudentCoursesRoute /></ProtectedRoute>} />
                    <Route path="/student/courses/:courseId" element={<ProtectedRoute><StudentCoursesRoute /></ProtectedRoute>} />
                    <Route
                        path="/student/courses/:courseId/projects/:projectId/team-choice"
                        element={<ProtectedRoute><StudentTeamGenerationChoiceRoute /></ProtectedRoute>}
                    />
                    <Route
                        path="/student/courses/:courseId/projects/:projectId/manual-team"
                        element={<ProtectedRoute><StudentManualTeamRoute /></ProtectedRoute>}
                    />
                    <Route
                        path="/student/team-invitations"
                        element={<ProtectedRoute><StudentTeamInvitationsRoute /></ProtectedRoute>}
                    />
                    <Route
                        path="/student/courses/:courseId/projects/:projectId/team"
                        element={<ProtectedRoute><StudentTeamRoute /></ProtectedRoute>}
                    />
                    <Route path="/student/team/:projectId" element={<ProtectedRoute><StudentTeamRoute /></ProtectedRoute>} />
                    <Route
                        path="/student/courses/:courseId/projects/:projectId/ai-team"
                        element={<ProtectedRoute><StudentAiTeamRoute /></ProtectedRoute>}
                    />
                    <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

                    {/* Student communities hub */}
                    <Route
                        path="/communities"
                        element={<ProtectedRoute><StudentCommunitiesHubRoute /></ProtectedRoute>}
                    />
                    <Route
                        path="/organizations"
                        element={<ProtectedRoute><StudentOrganizationsRoute /></ProtectedRoute>}
                    />
                    <Route
                        path="/following"
                        element={<ProtectedRoute><StudentFollowingOrganizationsRoute /></ProtectedRoute>}
                    />
                    <Route path="/student/following" element={<Navigate to="/following" replace />} />
                    <Route
                        path="/community-events"
                        element={<ProtectedRoute><StudentCommunityEventsRoute /></ProtectedRoute>}
                    />
                    <Route
                        path="/community-recruitment"
                        element={<ProtectedRoute><StudentCommunityRecruitmentRoute /></ProtectedRoute>}
                    />

                    {/* Public organization profiles (authenticated, view-only) */}
                    <Route
                        path="/organizations/:organizationId"
                        element={<ProtectedRoute><PublicOrganizationProfilePage /></ProtectedRoute>}
                    />
                    <Route
                        path="/organizations/:organizationId/events/:eventId"
                        element={<ProtectedRoute><PublicOrganizationEventPage /></ProtectedRoute>}
                    />
                    <Route
                        path="/organizations/:organizationId/recruitment-campaigns/:campaignId"
                        element={<ProtectedRoute><PublicRecruitmentCampaignPage /></ProtectedRoute>}
                    />

                    {/* Protected – Company */}
                    <Route path="/company/dashboard" element={<ProtectedRoute><CompanyDashboardRoute /></ProtectedRoute>} />
                    <Route path="/company/talent-search" element={<ProtectedRoute><CompanyTalentSearchRoute /></ProtectedRoute>} />
                    <Route path="/company/talent-search/results" element={<ProtectedRoute><CompanyTalentSearchResultsRoute /></ProtectedRoute>} />

                    {/* Protected – Student Organization */}
                    <Route path="/association/dashboard" element={<ProtectedRoute><AssociationDashboardRoute /></ProtectedRoute>} />
                    <Route path="/association/profile" element={<ProtectedRoute><AssociationProfileRoute /></ProtectedRoute>} />
                    <Route path="/organization/events" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationEventsListPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/events/create" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationEventCreatePage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/events/:eventId" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationEventDetailsPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/events/:eventId/edit" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationEventEditPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/events/:eventId/registration-form" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationEventRegistrationFormPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/team-members" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationTeamMembersPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/recruitment-campaigns" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationRecruitmentCampaignsListPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/recruitment-campaigns/create" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationRecruitmentCampaignCreatePage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/recruitment-campaigns/:campaignId/applications/:applicationId" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationRecruitmentApplicationDetailPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/recruitment-campaigns/:campaignId" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationRecruitmentCampaignDetailsPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/recruitment-campaigns/:campaignId/edit" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationRecruitmentCampaignEditPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/recruitment-campaigns/:campaignId/positions/:positionId/form" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationRecruitmentPositionFormPage /></OrganizationEventsRoute></ProtectedRoute>} />

                    {/* Protected – Doctor */}
                    <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboardRoute /></ProtectedRoute>} />
                    <Route path="/doctor/channels/:channelId" element={<ProtectedRoute><ChannelPageWrapper /></ProtectedRoute>} />
                    <Route path="/doctor/courses/:courseId" element={<ProtectedRoute><DoctorCoursesLegacyRedirect /></ProtectedRoute>} />
                    <Route path="/doctor/courses" element={<ProtectedRoute><DoctorCoursesLegacyRedirect /></ProtectedRoute>} />

                    {/* Doctor hub shell — sidebar + topbar on nested routes */}
                    <Route element={<ProtectedRoute><DoctorHubShellLayoutRoute /></ProtectedRoute>}>
                        <Route path="/doctor/notifications" element={<DoctorNotificationsPage />} />
                        <Route path="/doctor/profile" element={<DoctorProfileRoute />} />
                        <Route path="/doctor/edit-profile" element={<EditDoctorProfileRoute />} />
                        <Route path="/courses/create" element={<CreateCoursePage />} />
                        <Route
                            path="/courses/:courseId/sections/:sectionId/students"
                            element={<SectionStudentsPage />}
                        />
                        <Route path="/courses/:courseId/projects/create" element={<CourseProjectCreatePage />} />
                        <Route
                            path="/courses/:courseId/projects/:projectId/teams"
                            element={<ProjectTeamsPage />}
                        />
                        <Route path="/doctor/projects/:projectId/teams" element={<DoctorProjectTeamsRoute />} />
                        <Route path="/doctor/projects/:projectId/teams/:teamId" element={<TeamManagementPage />} />
                        <Route path="/courses/:courseId" element={<CourseWorkspacePage />} />
                    </Route>

                    {/* Shared with students — doctor gets hub shell via adaptive wrapper */}
                    <Route
                        path="/students"
                        element={
                            <ProtectedRoute>
                                <DoctorAdaptiveShell>
                                    <StudentsPage />
                                </DoctorAdaptiveShell>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/students/profile/:userId"
                        element={
                            <ProtectedRoute>
                                <DoctorAdaptiveShell>
                                    <StudentProfilePage />
                                </DoctorAdaptiveShell>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/doctors" element={<ProtectedRoute><DoctorsPage /></ProtectedRoute>} />
                    <Route path="/project/:projectId" element={<ProjectWorkspacePage />} />
                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </DoctorProvider>
        </UserProvider>
        </ToastProvider>
    );
}