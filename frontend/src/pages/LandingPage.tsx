import { useEffect } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { RolesTabbedSection } from "@/components/landing/RolesTabbedSection";
import { ProductOverviewSection } from "@/components/landing/ProductOverviewSection";
import { WhySkillSwapSection } from "@/components/landing/WhySkillSwapSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { hashToRole, LANDING_SECTIONS, scrollToLandingSection } from "@/lib/landingNav";

function useLandingHashScroll() {
  useEffect(() => {
    const run = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;

      const role = hashToRole(hash);
      if (role) {
        scrollToLandingSection(LANDING_SECTIONS.roles, { updateHash: false });
        window.history.replaceState(null, "", `#${role}`);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        return;
      }

      if (document.getElementById(hash)) {
        scrollToLandingSection(hash, { updateHash: false });
      }
    };

    const t = window.setTimeout(run, 0);
    return () => window.clearTimeout(t);
  }, []);
}

export function LandingPage() {
  useLandingHashScroll();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RolesTabbedSection />
        <ProductOverviewSection />
        <WhySkillSwapSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
