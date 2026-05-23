import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { LandingBrandLogo } from "@/components/brand/LandingBrandLogo";

const footerColumns = [
  {
    title: "Product",
    links: ["Features", "How It Works", "AI Engine", "Pricing"],
  },
  {
    title: "For You",
    links: ["Students", "Doctors", "Companies", "Organizations"],
  },
  {
    title: "Company",
    links: ["About", "Contact", "Privacy", "Terms"],
  },
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
            <div className="mt-6 flex items-center gap-2">
              {[Twitter, Github, Linkedin, Mail].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <div className="font-semibold mb-4 text-sm">{column.title}</div>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SkillSwap. All rights reserved.</span>
          <span>Build Better Teams Through Skills and AI.</span>
        </div>
      </div>
    </footer>
  );
}
