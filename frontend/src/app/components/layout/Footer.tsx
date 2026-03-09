const links = {
  Platform: ["How It Works", "Features", "Architecture", "Problem & Solution"],
  "For Users": ["Students", "Supervisors", "Companies", "Associations"],
  Project: ["About SkillSwap", "Team", "University", "Contact"],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-12 mb-12">
          {/* Brand + Project Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Skill<span className="text-blue-400">Swap</span></span>
            </div>

            <p className="text-sm leading-relaxed max-w-xs mb-6">
              An AI-based platform for forming academic project teams at university level — matching students by skills, not friendships.
            </p>

            {/* Graduation Project Badge */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wider">Graduation Project</div>
              <div className="space-y-1">
                <div className="text-sm text-white font-medium">Computer Engineering Department</div>
                <div className="text-sm text-slate-300">An-Najah National University</div>
                <div className="text-sm text-slate-400">Academic Year 2025–2026</div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Developed by</div>
                <div className="text-sm text-slate-300">Wafaa & Rasmiya</div>
                <div className="text-xs text-slate-400 mt-1">Supervisor: Dr. ___________</div>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white font-semibold mb-4 text-sm">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© 2026 SkillSwap — Graduation Project · An-Najah National University</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Computer Engineering Dept.
          </div>
        </div>
      </div>
    </footer>
  );
}