const steps = [
  {
    number: "01",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: "Create Your Profile with Skills",
    description: "Register as a student, supervisor, or organization. Add your skills, experience level, and role preferences so the AI has accurate data to work with.",
    color: "from-blue-500 to-blue-600",
    border: "border-blue-100",
    tag: "bg-blue-100 text-blue-700",
  },
  {
    number: "02",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: "Post or Browse Projects",
    description: "Students can post a project idea or browse existing ones. Supervisors and companies can submit project requests that need a qualified team.",
    color: "from-purple-500 to-purple-600",
    border: "border-purple-100",
    tag: "bg-purple-100 text-purple-700",
  },
  {
    number: "03",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
    title: "AI Analyzes Profiles and Requirements",
    description: "The AI reads skill profiles, project requirements, and role gaps to compute compatibility scores across all students, supervisors, and projects in the system.",
    color: "from-indigo-500 to-indigo-600",
    border: "border-indigo-100",
    tag: "bg-indigo-100 text-indigo-700",
  },
  {
    number: "04",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "AI Suggests Teammates, Projects & Supervisors",
    description: "Based on the analysis, the AI recommends the best-fit teammates to complete your team, projects that match your skills, and supervisors whose expertise aligns with your topic.",
    color: "from-teal-500 to-teal-600",
    border: "border-teal-100",
    tag: "bg-teal-100 text-teal-700",
  },
  {
    number: "05",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    title: "Join or Build Your Team",
    description: "Accept or send team invitations, confirm your supervisor, and finalize the project. The system notifies all parties and the collaboration begins.",
    color: "from-green-500 to-green-600",
    border: "border-green-100",
    tag: "bg-green-100 text-green-700",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">From Profile to Team in 5 Steps</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            SkillSwap uses AI at every step to match you with the right people and projects — based on skills, not luck.
          </p>
        </div>

        {/* Steps — first row: 3 cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {steps.slice(0, 3).map((step, index) => (
            <div
              key={step.number}
              className={`relative bg-white rounded-3xl p-7 border ${step.border} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  {step.icon}
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${step.tag}`}>
                  Step {step.number}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>

              {index < 2 && (
                <div className="hidden md:block absolute -right-3 top-11 z-10">
                  <div className="flex items-center gap-0.5">
                    <div className="w-3 h-px bg-slate-300" />
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Steps — second row: 2 cards centered */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {steps.slice(3).map((step, index) => (
            <div
              key={step.number}
              className={`relative bg-white rounded-3xl p-7 border ${step.border} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  {step.icon}
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${step.tag}`}>
                  Step {step.number}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>

              {index === 0 && (
                <div className="hidden md:block absolute -right-3 top-11 z-10">
                  <div className="flex items-center gap-0.5">
                    <div className="w-3 h-px bg-slate-300" />
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
