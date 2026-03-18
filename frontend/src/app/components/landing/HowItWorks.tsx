const steps = [
  {
    number: "01",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: "Create a Profile",
    description: "Users create a profile by filling out a form based on their role (student, supervisor, company, or association).",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    tag: "bg-blue-100 text-blue-700",
  },
  {
    number: "02",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    title: "Provide Skills or Project Requirements",
    description: "Students add their skills and interests, while supervisors and organizations specify their expertise or project needs.",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    tag: "bg-purple-100 text-purple-700",
  },
  {
    number: "03",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: "AI Analyzes Profiles and Requirements",
    description: "The system analyzes the submitted information to understand skills, expertise, and collaboration requirements.",
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    tag: "bg-indigo-100 text-indigo-700",
  },
  {
    number: "04",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
    title: "Smart Matching",
    description: "SkillSwap suggests suitable students, teams, or collaborations based on compatibility between profiles and project needs.",
    color: "from-teal-500 to-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    tag: "bg-teal-100 text-teal-700",
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
          <h2 className="text-4xl font-bold text-slate-900 mb-4">How the SkillSwap Platform Works</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            SkillSwap connects students, supervisors, companies, and university associations through structured profiles and AI-based matching to support smarter academic collaboration.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => (
            <div key={step.number} className={`relative bg-white rounded-3xl p-7 border ${step.border} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
              {/* Step number */}
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

              {/* Connector line + arrow for non-last items */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-11 z-10">
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