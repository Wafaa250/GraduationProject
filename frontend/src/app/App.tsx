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
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />

                    {/* Protected – Doctor */}
                    <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboardPage /></ProtectedRoute>} />
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