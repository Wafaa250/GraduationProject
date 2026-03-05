const links = {
  Platform: ["How It Works", "Features", "Pricing", "Roadmap"],
  "For Users": ["Students", "Supervisors", "Companies", "Associations"],
  Company: ["About Us", "Blog", "Careers", "Press"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
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
              An AI-powered academic collaboration platform helping students build smarter teams based on skills, not social networks.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {["Twitter", "LinkedIn", "GitHub", "Discord"].map((social) => (
                <a key={social} href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors" aria-label={social}>
                  <span className="text-xs font-bold text-slate-400">{social[0]}</span>
                </a>
              ))}
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
          <p className="text-sm">© 2026 SkillSwap. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
