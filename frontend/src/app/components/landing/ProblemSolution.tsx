export function ProblemSolution() {
  return (
    <section className="py-24 bg-white" id="problem-solution">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Research Motivation
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Why SkillSwap Was Developed</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            SkillSwap is a platform designed to support better collaboration in university projects.
            It analyzes students' skills to form balanced teams, helps match supervisors with projects, and allows organizations to connect with student teams.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Problem - Dark Blue */}
          <div className="bg-blue-950 border border-blue-900 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-white">The Problem</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Students often form project teams randomly.",
                "This results in unbalanced teams with missing skills.",
                "Finding suitable supervisors for projects can be difficult.",
                "There is limited connection between students and real industry challenges.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-800 text-blue-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-blue-100 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution - Light Blue */}
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">
                💡
              </div>
              <h3 className="text-xl font-bold text-blue-700">Our Solution</h3>
            </div>
            <ul className="space-y-4">
              {[
                "SkillSwap analyzes students' skills and project requirements.",
                "The system recommends balanced teams using compatibility analysis.",
                "Supervisors are matched with projects based on expertise.",
                "Companies can explore student projects and connect with suitable students or teams.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-sm text-blue-800 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}