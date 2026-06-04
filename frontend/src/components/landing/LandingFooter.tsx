import { Link } from "react-router-dom";
import { LandingBrandLogo } from "@/components/brand/LandingBrandLogo";
import { LandingSectionLink } from "@/components/landing/LandingSectionLink";
import { LANDING_SECTIONS, navigateToRoleTab, type RoleTabId } from "@/lib/landingNav";
import { ROUTES } from "@/routes/paths";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const productLinks = [
  { label: "Features", section: LANDING_SECTIONS.features },
  { label: "How It Works", section: LANDING_SECTIONS.how },
  { label: "Product Overview", section: LANDING_SECTIONS.product },
  { label: "FAQ", section: LANDING_SECTIONS.faq },
] as const;

const audienceLinks: { label: string; role: RoleTabId }[] = [
  { label: "Students", role: "students" },
  { label: "Doctors", role: "doctors" },
  { label: "Companies", role: "companies" },
  { label: "Organizations", role: "organizations" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 pt-16 pb-10 relative">
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <LandingBrandLogo />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
              Build Better Teams Through Skills and AI. An intelligent platform that matches
              students, supervisors, companies, and organizations.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={ROUTES.register}
                className="text-sm font-medium text-primary-glow hover:text-foreground transition-colors"
              >
                Create account
              </Link>
              <Link
                to={ROUTES.login}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div>
            <div className="font-semibold mb-4 text-sm">Product</div>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <LandingSectionLink
                    section={link.section}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </LandingSectionLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-semibold mb-4 text-sm">For You</div>
            <ul className="space-y-2.5">
              {audienceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={`#${link.role}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(event) => {
                      if (window.location.pathname !== ROUTES.home && window.location.pathname !== "/") {
                        return;
                      }
                      event.preventDefault();
                      navigateToRoleTab(link.role);
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-semibold mb-4 text-sm">Explore</div>
            <ul className="space-y-2.5">
              <li>
                <LandingSectionLink
                  section={LANDING_SECTIONS.why}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Why SkillSwap
                </LandingSectionLink>
              </li>
              <li>
                <LandingSectionLink
                  section={LANDING_SECTIONS.roles}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Who Uses SkillSwap
                </LandingSectionLink>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SkillSwap. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <ThemeToggle placement="inline" />
            <span className="hidden sm:inline">Build Better Teams Through Skills and AI.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
