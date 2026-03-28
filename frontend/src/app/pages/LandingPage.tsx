import { Navbar } from "../components/layout/Navbar";
import { Hero } from "../components/landing/Hero";
import { ProblemSolution } from "../components/landing/ProblemSolution";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Features } from "../components/landing/Features";
import { SystemArchitecture } from "../components/landing/SystemArchitecture";
import { UserTypes } from "../components/landing/UserTypes";
import { Testimonials } from "../components/landing/Testimonials";
import { CTA } from "../components/landing/CTA";
import { Footer } from "../components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <Features />
      <SystemArchitecture />
      <UserTypes />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}