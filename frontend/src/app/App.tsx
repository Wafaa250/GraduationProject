// src/app/App.tsx
import React, { type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "../context/ToastContext";
import { UserProvider } from '../context/UserContext';
import { DoctorProvider } from './pages/doctor/DoctorContext';
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProfilePage from "./pages/profile/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import DoctorDashboardPage from "./pages/doctor/DoctorDashboardPage";
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
import PublicOrganizationProfilePage from "./pages/organizations/PublicOrganizationProfilePage";
import PublicOrganizationEventPage from "./pages/organizations/PublicOrganizationEventPage";
import PublicRecruitmentCampaignPage from "./pages/organizations/PublicRecruitmentCampaignPage";
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
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
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

function DoctorProjectTeamsRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <DoctorProjectTeamsPage />;
    if (role === "student") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
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
                    <Route path="/organization/recruitment-campaigns/:campaignId" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationRecruitmentCampaignDetailsPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/recruitment-campaigns/:campaignId/edit" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationRecruitmentCampaignEditPage /></OrganizationEventsRoute></ProtectedRoute>} />
                    <Route path="/organization/recruitment-campaigns/:campaignId/positions/:positionId/form" element={<ProtectedRoute><OrganizationEventsRoute><OrganizationRecruitmentPositionFormPage /></OrganizationEventsRoute></ProtectedRoute>} />

                    {/* Protected – Doctor */}
                    <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboardRoute /></ProtectedRoute>} />
                    <Route path="/doctor/profile" element={<ProtectedRoute><DoctorProfileRoute /></ProtectedRoute>} />
                    <Route path="/doctor/edit-profile" element={<ProtectedRoute><EditDoctorProfileRoute /></ProtectedRoute>} />
                    <Route path="/doctor/channels/:channelId" element={<ProtectedRoute><ChannelPageWrapper /></ProtectedRoute>} />
                    <Route path="/doctor/courses/:courseId" element={<ProtectedRoute><DoctorCoursesLegacyRedirect /></ProtectedRoute>} />
                    <Route path="/doctor/courses" element={<ProtectedRoute><DoctorCoursesLegacyRedirect /></ProtectedRoute>} />
                    <Route path="/courses/create" element={<ProtectedRoute><CreateCourseDoctorRoute /></ProtectedRoute>} />
                    <Route
                        path="/courses/:courseId/sections/:sectionId/students"
                        element={<ProtectedRoute><SectionStudentsDoctorRoute /></ProtectedRoute>}
                    />
                    <Route
                        path="/courses/:courseId/projects/create"
                        element={<ProtectedRoute><CourseProjectCreatePage /></ProtectedRoute>}
                    />
                    <Route
                        path="/courses/:courseId/projects/:projectId/teams"
                        element={<ProtectedRoute><ProjectTeamsDoctorRoute /></ProtectedRoute>}
                    />
                    <Route
                        path="/doctor/projects/:projectId/teams"
                        element={<ProtectedRoute><DoctorProjectTeamsRoute /></ProtectedRoute>}
                    />
                    <Route
                        path="/doctor/projects/:projectId/teams/:teamId"
                        element={<ProtectedRoute><TeamManagementDoctorRoute /></ProtectedRoute>}
                    />
                    <Route path="/courses/:courseId" element={<ProtectedRoute><CourseWorkspaceDoctorRoute /></ProtectedRoute>} />

                    {/* ✅ التعديل تبعك */}
                    <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
                    <Route path="/student/following" element={<ProtectedRoute><StudentFollowingOrganizationsRoute /></ProtectedRoute>} />
                    <Route
                        path="/students/profile/:userId"
                        element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>}
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