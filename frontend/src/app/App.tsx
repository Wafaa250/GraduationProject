import { Routes, Route } from "react-router-dom";
import { UserProvider } from '../context/UserContext';
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProfilePage from "./pages/profile/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";

export default function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/"             element={<LandingPage />} />
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/dashboard"    element={<DashboardPage />} />
        <Route path="/profile"      element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
      </Routes>
    </UserProvider>
  );
}