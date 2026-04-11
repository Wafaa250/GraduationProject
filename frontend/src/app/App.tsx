// src/app/App.tsx
import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

import StudentsPage from "./pages/students/StudentsPage";
import StudentProfilePage from "./pages/students/StudentProfilePage"
import ReceivedInvitationsPage from "./pages/invitations/ReceivedInvitationsPage";
import ProjectWorkspacePage from "./pages/doctor/ProjectWorkspacePage";

function ProtectedRoute({ children }: { children: ReactNode }) {
    const token = localStorage.getItem('token')
    if (!token) return <Navigate to="/login" replace />
    return <>{children}</>
}

/** Student dashboard — doctors and unknown roles are redirected to avoid wrong UI. */
function StudentDashboardRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (role === "student") return <DashboardPage />;
    return <Navigate to="/" replace />;
}

/** Doctor dashboard — students and unknown roles are redirected. */
function DoctorDashboardRoute() {
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    if (role === "student") return <Navigate to="/dashboard" replace />;
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

export default function App() {
    return (
        <UserProvider>
            <DoctorProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected – Student */}
                    <Route path="/dashboard" element={<ProtectedRoute><StudentDashboardRoute /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfileRoute /></ProtectedRoute>} />
                    <Route path="/edit-profile" element={<ProtectedRoute><EditProfileRoute /></ProtectedRoute>} />

                    {/* Protected – Doctor */}
                    <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboardRoute /></ProtectedRoute>} />
                    <Route path="/doctor/profile" element={<ProtectedRoute><DoctorProfileRoute /></ProtectedRoute>} />
                    <Route path="/doctor/edit-profile" element={<ProtectedRoute><EditDoctorProfileRoute /></ProtectedRoute>} />
                    <Route path="/doctor/channels/:channelId" element={<ProtectedRoute><ChannelPageWrapper /></ProtectedRoute>} />

                    {/* ✅ التعديل تبعك */}
                    <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
                    <Route path="/students/:userId" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
                    <Route path="/invitations" element={<ProtectedRoute><ReceivedInvitationsPage /></ProtectedRoute>} />
<Route path="/project/:projectId" element={<ProjectWorkspacePage />} />
                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </DoctorProvider>
        </UserProvider>
    );
}