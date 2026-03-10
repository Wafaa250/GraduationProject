import heroImage from "../../../assets/images/hero.jpg";

export function Hero() {
  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Title */}
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
             SkillSwap – Smart Team Matching for {" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
Academic Projects
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
SkillSwap is a university platform designed to assist students in forming project teams based on their skills and competencies.
By analyzing students’ profiles and project requirements, the system recommends suitable teammates and promotes more effective collaboration.            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-full font-semibold transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5">
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-7 py-3.5 rounded-full font-semibold border border-slate-200 transition-all shadow-sm hover:-translate-y-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Explore Projects
              </button>
            </div>
          </div>

          {/* Right: Hero Visual */}
          <div className="relative">
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
      </div>
    </section>
  );
}