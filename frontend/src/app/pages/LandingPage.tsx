import { Footer } from "../components/layout/Footer";
import { Navbar } from "../components/layout/Navbar";
import { Features } from "../components/landing/Features";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { LandingCta } from "../components/landing/LandingCta";
import { ProblemSolution } from "../components/landing/ProblemSolution";
import { UserTypes } from "../components/landing/UserTypes";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <UserTypes />
        <Features />
        <LandingCta />
      </main>
      <Footer />
    </div>
  );
}
