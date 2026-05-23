import { Link } from "react-router-dom";
import React from "react";
import { BrandLogo } from "../brand/BrandLogo";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <BrandLogo to="/" size="sm" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a
            href="#how-it-works"
            className="hidden md:block text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            How It Works
          </a>

          <Link
            to="/login"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-blue-200"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
