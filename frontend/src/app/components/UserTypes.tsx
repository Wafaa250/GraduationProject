import { ImageWithFallback } from "./figma/ImageWithFallback";

const studentImg = "https://images.unsplash.com/photo-1659080907111-7c726e435a28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwcHJvZmlsZSUyMGF2YXRhciUyMGFjYWRlbWljfGVufDF8fHx8MTc3MjU2OTM1Mnww&ixlib=rb-4.1.0&q=80&w=1080";
const doctorImg = "https://images.unsplash.com/photo-1561089489-f13d5e730d72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzb3IlMjBkb2N0b3IlMjB1bml2ZXJzaXR5JTIwdGVhY2hpbmd8ZW58MXx8fHwxNzcyNTY5MzUyfDA&ixlib=rb-4.1.0&q=80&w=1080";
const companyImg = "https://images.unsplash.com/photo-1758691737644-ef8be18256c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbXBhbnklMjBvZmZpY2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzcyNTY5MzU0fDA&ixlib=rb-4.1.0&q=80&w=1080";
const assocImg = "https://images.unsplash.com/photo-1757143090721-b93a0aef6363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwYXNzb2NpYXRpb24lMjBncm91cCUyMGNhbXB1cyUyMGV2ZW50fGVufDF8fHx8MTc3MjU2OTM1NXww&ixlib=rb-4.1.0&q=80&w=1080";

const userTypes = [
  {
    image: studentImg,
    role: "Students",
    icon: "🎓",
    description: "Find teammates with complementary skills, join exciting projects, and build your academic portfolio with real collaboration.",
    perks: ["Skill-based team matching", "Join & publish projects", "Peer reviews & feedback"],
    gradient: "from-blue-600 to-blue-700",
    light: "bg-blue-50",
    accent: "text-blue-600",
    border: "border-blue-100",
  },
  {
    image: doctorImg,
    role: "Doctors & Supervisors",
    icon: "🏫",
    description: "Supervise the right student projects based on your expertise. Discover talented students ready to work on meaningful research.",
    perks: ["Tailored student discovery", "Project supervision tools", "Research collaboration"],
    gradient: "from-purple-600 to-purple-700",
    light: "bg-purple-50",
    accent: "text-purple-600",
    border: "border-purple-100",
  },
  {
    image: companyImg,
    role: "Companies",
    icon: "🏢",
    description: "Post real-world challenges and connect with student teams that have the skills to bring your projects to life.",
    perks: ["Post industry challenges", "Access skilled teams", "Early talent discovery"],
    gradient: "from-indigo-600 to-indigo-700",
    light: "bg-indigo-50",
    accent: "text-indigo-600",
    border: "border-indigo-100",
  },
  {
    image: assocImg,
    role: "Student Associations",
    icon: "🤝",
    description: "Organize events, recruit members with the right skill sets, and collaborate with other associations on campus-wide initiatives.",
    perks: ["Event & project management", "Smart member recruitment", "Inter-association networking"],
    gradient: "from-teal-600 to-teal-700",
    light: "bg-teal-50",
    accent: "text-teal-600",
    border: "border-teal-100",
  },
];

export function UserTypes() {
  return (
    <section className="py-24 bg-white" id="for-who">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-indigo-50 text-indigo-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Who It's For
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Built for Every Academic Role</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            SkillSwap serves all stakeholders in the academic ecosystem — from students to supervisors, companies to associations.
          </p>
        </div>

        {/* User Type Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userTypes.map((type) => (
            <div
              key={type.role}
              className={`group relative rounded-3xl border ${type.border} overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white`}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <ImageWithFallback
                  src={type.image}
                  alt={type.role}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${type.gradient} opacity-50 group-hover:opacity-60 transition-opacity`} />
                <div className="absolute bottom-4 left-4 text-3xl">{type.icon}</div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{type.role}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{type.description}</p>

                {/* Perks */}
                <ul className="space-y-1.5">
                  {type.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className={`w-4 h-4 ${type.accent} flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {perk}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button className={`mt-5 w-full py-2.5 rounded-full text-sm font-semibold ${type.light} ${type.accent} hover:opacity-80 transition-opacity`}>
                  Join as {type.role.split(" ")[0]} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
