const testimonials = [
  {
    quote: "SkillSwap helped me find the perfect teammates for my final-year project in under 24 hours. The AI matching is incredibly accurate!",
    name: "Amina Berber",
    role: "Computer Science Student",
    avatar: "AB",
    color: "from-blue-500 to-blue-600",
  },
  {
    quote: "As a supervisor, I can now easily discover students whose research interests align with mine. It saves so much time in the selection process.",
    name: "Dr. Karim Mansouri",
    role: "Associate Professor, AI Lab",
    avatar: "KM",
    color: "from-purple-500 to-purple-600",
  },
  {
    quote: "We posted a real-world challenge and had 5 student teams apply within a week. The quality of their profiles and skills was outstanding.",
    name: "Sarah Lemaire",
    role: "HR Lead, TechCorp Algeria",
    avatar: "SL",
    color: "from-indigo-500 to-indigo-600",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-white/10 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl font-bold text-white mb-4">Loved by the Academic Community</h2>
          <p className="text-blue-100 max-w-xl mx-auto">
            Join thousands of students, supervisors, and organizations who are already building smarter together.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/15 transition-all duration-300">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>

              <p className="text-white/90 leading-relaxed mb-6 text-sm italic">"{t.quote}"</p>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-blue-200 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
