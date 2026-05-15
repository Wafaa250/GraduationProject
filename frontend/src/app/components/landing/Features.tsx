import aiImage from "../../../assets/images/ai-network.jpg";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "AI Team Matching",
    description: "AI analyzes each student's skills, experience level, and role preferences to automatically compose balanced, compatible teams for a given project.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    badge: "Core AI",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    title: "AI Supervisor Suggestion",
    description: "AI matches student teams with the most suitable supervisors by comparing project topics, required expertise, and supervisor availability.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    badge: "Supervision",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: "Smart Project Recommendations",
    description: "AI suggests open projects that align with a student's skill set and academic background, so students discover opportunities they are genuinely qualified for.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    badge: "Discovery",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
    title: "Skill-Based Compatibility Scoring",
    description: "AI computes a compatibility score for every suggested team by evaluating skill balance, role coverage, and complementary strengths — not social ties.",
    color: "text-teal-600",
    bg: "bg-teal-50",
    badge: "Analytics",
    badgeColor: "bg-teal-100 text-teal-700",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: "Company & Organization Matching",
    description: "AI connects student teams with external companies or student organizations that have posted real project requests, matching based on required skills and project scope.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    badge: "External",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: "AI Insights from Past Projects",
    description: "AI mines completed projects to surface reusable components, identify skill gaps that led to poor outcomes, and guide new teams with evidence-based recommendations.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    badge: "Intelligence",
    badgeColor: "bg-rose-100 text-rose-700",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/30" id="features">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-purple-50 text-purple-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            AI Capabilities
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">What the AI Does for You</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Every feature in SkillSwap is powered by AI — matching students, supervisors, and opportunities based on skills, not guesswork.
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
              <img
                src={aiImage}
                alt="AI matching system visualization"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/30 rounded-3xl" />
            </div>

            {/* Floating matching card */}
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

            {/* Floating compatibility card */}
            <div className="absolute bottom-6 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 max-w-[200px]">
              <div className="text-xs font-semibold text-slate-500 mb-2">AI Match Criteria</div>
              <div className="space-y-2">
                {["Skill Compatibility", "Role Coverage", "Project Alignment"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-blue-600 font-semibold">Score: 94% →</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
