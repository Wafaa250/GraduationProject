const steps = [
  {
    number: "01",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: "Create Your Profile",
    description: "Sign up and build your academic profile. List your skills, experience, and areas you're passionate about to stand out.",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    tag: "bg-blue-100 text-blue-700",
  },
  {
    number: "02",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    title: "Define Your Project or Role",
    description: "Post your project idea or specify what role you're looking to fill. Define the skills, timeline, and goals clearly.",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
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
    title: "Get Smart AI Matches",
    description: "Our AI engine analyzes profiles and projects to recommend the most compatible teammates and supervisors for you.",
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    tag: "bg-indigo-100 text-indigo-700",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Simple Process
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Getting started with SkillSwap takes only a few minutes. Here's how we help you find the right academic team.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-14 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 z-0" style={{left: '20%', right: '20%'}} />

          {steps.map((step, index) => (
            <div key={step.number} className={`relative bg-white rounded-3xl p-8 border ${step.border} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
              {/* Step number */}
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}>
                  {step.icon}
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${step.tag}`}>
                  Step {step.number}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
              <p className="text-slate-500 leading-relaxed">{step.description}</p>

              {/* Arrow indicator for non-last items */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-5 top-14 w-10 h-10 bg-white border border-slate-100 rounded-full items-center justify-center shadow-md z-10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
