import { ImageWithFallback } from "./figma/ImageWithFallback";

const heroImage = "https://images.unsplash.com/photo-1758270705518-b61b40527e76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjB0ZWFtd29yayUyMGNvbGxhYm9yYXRpb258ZW58MXx8fHwxNzcyNTY5MzUwfDA&ixlib=rb-4.1.0&q=80&w=1080";

const stats = [
  { value: "12K+", label: "Students Matched" },
  { value: "3.4K+", label: "Projects Launched" },
  { value: "98%", label: "Satisfaction Rate" },
];

const skillTags = ["React", "Machine Learning", "UI/UX", "Data Science", "Backend", "Research"];

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
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              AI-Powered Academic Collaboration
            </div>

            {/* Title */}
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
              Build Smarter{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Academic Teams
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              SkillSwap uses AI-powered skill-based matching to help students form the perfect project teams — no more relying on personal connections alone.
            </p>

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

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-2">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hero Visual */}
          <div className="relative">
            {/* Main image card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src={heroImage}
                alt="Students collaborating"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />

              {/* Floating match card */}
              <div className="absolute bottom-6 left-6 bg-white rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-[260px]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                  ✦
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">AI Match Found!</div>
                  <div className="text-xs text-slate-500">3 new team members match your skills</div>
                </div>
              </div>
            </div>

            {/* Skill tags floating card */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
              <div className="text-xs font-semibold text-slate-500 mb-2">Skill Tags</div>
              <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                {skillTags.map((tag) => (
                  <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Match percentage badge */}
            <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl p-4 shadow-xl">
              <div className="text-3xl font-bold">94%</div>
              <div className="text-xs opacity-90">Match Score</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
