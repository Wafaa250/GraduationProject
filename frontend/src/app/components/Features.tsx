import { ImageWithFallback } from "./figma/ImageWithFallback";

const aiImage = "https://images.unsplash.com/photo-1749006590475-4592a5dbf99f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHRlY2hub2xvZ3klMjBuZXR3b3JrJTIwY29ubmVjdGlvbiUyMGFic3RyYWN0fGVufDF8fHx8MTc3MjU2OTM1MHww&ixlib=rb-4.1.0&q=80&w=1080";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
    title: "Smart Matching Engine",
    description: "Our AI analyzes skill sets, interests, and project requirements to connect you with the most compatible teammates instantly.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    badge: "Core Feature",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    title: "Supervisor Selection",
    description: "Browse qualified academic supervisors and doctors. Filter by field of expertise and research focus to find your ideal mentor.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    badge: "Academic",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: "Project Publishing & Feedback",
    description: "Publish your projects publicly, collect structured feedback, and iterate with peer reviews from the academic community.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    badge: "Collaboration",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    title: "Company & Association Collaboration",
    description: "Companies and student associations can post real-world challenges and discover talented student teams ready to solve them.",
    color: "text-teal-600",
    bg: "bg-teal-50",
    badge: "Industry",
    badgeColor: "bg-teal-100 text-teal-700",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/30" id="features">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-purple-50 text-purple-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Platform Features
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need to Succeed</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            SkillSwap is built with features designed specifically for the academic environment — from students to supervisors and beyond.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Feature Cards Grid */}
          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center`}>
                    {feature.icon}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Visual Side */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src={aiImage}
                alt="AI matching technology"
                className="w-full h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/30 rounded-3xl" />
            </div>

            {/* Floating stat card */}
            <div className="absolute top-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  AI
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Matching Algorithm</div>
                  <div className="text-xs text-slate-400">Skill-based • Real-time</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                </div>
                <span className="text-xs font-semibold text-blue-600">94%</span>
              </div>
            </div>

            {/* Floating projects card */}
            <div className="absolute bottom-6 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 max-w-[200px]">
              <div className="text-xs font-semibold text-slate-500 mb-2">Active Projects</div>
              <div className="space-y-2">
                {["Mobile App Dev", "AI Research", "UI/UX Design"].map((proj) => (
                  <div key={proj} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-slate-600">{proj}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-blue-600 font-semibold">+3.4K more →</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
