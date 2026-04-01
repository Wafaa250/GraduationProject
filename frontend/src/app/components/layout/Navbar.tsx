import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800">
            Skill<span className="text-blue-600">Swap</span>
          </span>
        </Link>

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
