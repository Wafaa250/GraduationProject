import { Link } from "react-router-dom";
import { BrandLogo } from "../brand/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex flex-col gap-1">
          <BrandLogo to="/" size="sm" onDark />
          <p className="text-xs text-slate-500 mt-0.5 pl-[40px]">AI-based team matching for academic projects</p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm">
          <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium">
            Register
          </Link>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-slate-600 text-center">
          © 2026 SkillSwap · Graduation Project · An-Najah National University
        </div>
      </div>
    </footer>
  );
}
