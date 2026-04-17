export function ProblemSolution() {
  return (
    <section className="py-24 bg-white" id="problem-solution">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Problem & Solution
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Why SkillSwap Exists</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            University project teams are still formed the wrong way. SkillSwap fixes that with AI.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Problem */}
          <div className="bg-blue-950 border border-blue-900 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-white">The Problem</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Students form teams based on friendships, not skills — resulting in unbalanced groups with critical gaps.",
                "Finding a supervisor whose expertise matches the project topic is left to chance.",
                "There is no structured way for companies and associations to connect with student teams for real projects.",
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

          {/* Solution */}
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">
                💡
              </div>
              <h3 className="text-xl font-bold text-blue-700">The Solution</h3>
            </div>
            <ul className="space-y-4">
              {[
                "AI matches students into teams based on skills and project requirements — not personal connections.",
                "AI suggests supervisors whose expertise aligns with the project topic and scope.",
                "Companies and associations post real project requests; AI connects them with qualified student teams.",
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
