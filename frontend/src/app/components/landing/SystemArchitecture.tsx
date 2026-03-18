const layers = [
  {
    label: "Frontend",
    tech: "React + TypeScript",
    detail: "Vite · Tailwind CSS · shadcn/ui",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    label: "Backend",
    tech: ".NET Web API",
    detail: "RESTful API · JWT Auth · C#",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  {
    label: "Database",
    tech: "PostgreSQL",
    detail: "Relational DB · Prisma ORM",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    label: "AI Engine",
    tech: "Python · FastAPI",
    detail: "Skill Matching · ML Algorithm",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
];

export function SystemArchitecture() {
  return (
    <section className="py-24 bg-slate-50" id="architecture">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-slate-200 text-slate-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Technical Overview
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">System Architecture</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            SkillSwap is built using modern technologies following a layered architecture that separates concerns between the frontend, backend, database, and AI engine.
          </p>
        </div>

        {/* Architecture layers */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {layers.map((layer) => (
            <div key={layer.label} className={`bg-white rounded-3xl p-6 border ${layer.border} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
              <div className={`w-12 h-12 rounded-2xl ${layer.bg} ${layer.color} flex items-center justify-center mb-4`}>
                {layer.icon}
              </div>
              <div className={`text-xs font-bold uppercase tracking-wider ${layer.color} mb-1`}>{layer.label}</div>
              <div className="text-lg font-bold text-slate-800 mb-1">{layer.tech}</div>
              <div className="text-xs text-slate-400">{layer.detail}</div>
            </div>
          ))}
        </div>

        {/* Architecture diagram (simplified) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-center text-sm font-semibold text-slate-500 mb-8 uppercase tracking-wider">Data Flow</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {[
              { label: "User Browser", sub: "React Frontend", color: "bg-blue-100 text-blue-700 border-blue-200" },
              { label: "↔", sub: "HTTPS / REST", color: "bg-transparent text-slate-400", isArrow: true },
              { label: ".NET API", sub: "Business Logic", color: "bg-purple-100 text-purple-700 border-purple-200" },
              { label: "↔", sub: "", color: "bg-transparent text-slate-400", isArrow: true },
              { label: "PostgreSQL", sub: "Data Storage", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
              { label: "↕", sub: "", color: "bg-transparent text-slate-400", isArrow: true },
              { label: "Python AI", sub: "Matching Engine", color: "bg-teal-100 text-teal-700 border-teal-200" },
            ].map((item, i) => (
              item.isArrow ? (
                <div key={i} className="text-2xl font-light text-slate-300 hidden md:block">{item.label}</div>
              ) : (
                <div key={i} className={`px-5 py-3 rounded-2xl border text-center ${item.color}`}>
                  <div className="font-bold text-sm">{item.label}</div>
                  {item.sub && <div className="text-xs opacity-70 mt-0.5">{item.sub}</div>}
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
