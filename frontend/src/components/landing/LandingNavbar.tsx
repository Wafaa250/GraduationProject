import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LandingBrandLogo } from "@/components/brand/LandingBrandLogo";
import { LandingSectionLink } from "@/components/landing/LandingSectionLink";
import { landingNavLinks } from "@/lib/landingNav";
import { ROUTES } from "@/routes/paths";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-strong py-3" : "py-5 bg-transparent"
      }`}
    >
      <nav className="container flex items-center justify-between">
        <LandingBrandLogo />
        <ul className="hidden lg:flex items-center gap-1">
          {landingNavLinks.map((link) => (
            <li key={link.section}>
              <LandingSectionLink
                section={link.section}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
              >
                {link.label}
              </LandingSectionLink>
            </li>
          ))}
        </ul>
        <div className="hidden lg:flex items-center gap-2">
          <Link
            to={ROUTES.login}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            to={ROUTES.register}
            className="group inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gradient-primary text-white rounded-lg shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.6)] transition-all hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-foreground"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-strong overflow-hidden"
          >
            <div className="container py-4 flex flex-col gap-1">
              {landingNavLinks.map((link) => (
                <LandingSectionLink
                  key={link.section}
                  section={link.section}
                  onNavigate={closeMenu}
                  className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-white/5"
                >
                  {link.label}
                </LandingSectionLink>
              ))}
              <div className="flex gap-2 pt-3 mt-2 border-t border-white/5">
                <Link
                  to={ROUTES.login}
                  onClick={closeMenu}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-border rounded-lg text-center"
                >
                  Sign In
                </Link>
                <Link
                  to={ROUTES.register}
                  onClick={closeMenu}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-gradient-primary text-white rounded-lg text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
