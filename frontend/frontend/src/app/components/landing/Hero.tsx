import heroImage from "../../../assets/images/hero.jpg";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div className="space-y-8">

            {/* AI Badge */}
            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
              </svg>
              AI-Powered Matching
            </span>

            {/* Title */}
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
              Find the right team, supervisor, and opportunity{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                using AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              SkillSwap uses AI to match students with teammates, supervisors, and projects —
              based on skills and project needs, not personal connections.
            </p>

            {/* Single CTA */}
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5"
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Right: Hero Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={heroImage}
              alt="Students collaborating on academic projects"
              className="w-full h-[420px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
          </div>

        </div>
      </div>
    </section>
  );
}
