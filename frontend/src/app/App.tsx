import { Routes, Route } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Features } from "./components/Features";
import { UserTypes } from "./components/UserTypes";
import { Testimonials } from "./components/Testimonials";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import LoginPage from "./pages/auth/LoginPage";

function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <UserTypes />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>

      {/* Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Login */}
      <Route path="/login" element={<LoginPage />} />

    </Routes>
  );
}