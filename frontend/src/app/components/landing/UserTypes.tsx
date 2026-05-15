import { ImageWithFallback } from "../ui/ImageWithFallback";
import studentImg from "../../../assets/images/student.jpg";
import doctorImg from "../../../assets/images/doctor.jpg";
import companyImg from "../../../assets/images/company.jpg";
import assocImg from "../../../assets/images/association.jpg";

const userTypes = [
  {
    image: studentImg,
    role: "Students",
    icon: "🎓",
    want: "Find teammates and projects that match their skills.",
    aiHelp: "AI analyzes their skill profile and suggests compatible teammates, fitting projects, and supervisors — based on requirements, not friendships.",
    gradient: "from-blue-600 to-blue-700",
    light: "bg-blue-50",
    accent: "text-blue-600",
    border: "border-blue-100",
  },
  {
    image: doctorImg,
    role: "Supervisors",
    icon: "🏫",
    want: "Supervise projects that align with their expertise.",
    aiHelp: "AI matches supervisors to projects based on topic and required expertise, so they only see relevant collaboration requests.",
    gradient: "from-purple-600 to-purple-700",
    light: "bg-purple-50",
    accent: "text-purple-600",
    border: "border-purple-100",
  },
  {
    image: companyImg,
    role: "Companies",
    icon: "🏢",
    want: "Connect with student teams capable of solving real problems.",
    aiHelp: "AI matches their posted project requests with student teams whose combined skills meet the required technical profile.",
    gradient: "from-indigo-600 to-indigo-700",
    light: "bg-indigo-50",
    accent: "text-indigo-600",
    border: "border-indigo-100",
  },
  {
    image: assocImg,
    role: "Student Organizations",
    icon: "🤝",
    want: "Recruit members with the right skills for their initiatives.",
    aiHelp: "AI identifies students whose skills fit the organization's open roles and project needs, enabling targeted and effective recruitment.",
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
          <h2 className="text-4xl font-bold text-slate-900 mb-4">How AI Helps Each Role</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Every role on SkillSwap interacts with the AI matching system differently — but all get the same result: the right connection, based on skills.
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
                <h3 className="text-lg font-bold text-slate-800 mb-4">{type.role}</h3>

                {/* Want */}
                <div className="mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">They want</span>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1">{type.want}</p>
                </div>

                {/* AI Help */}
                <div className={`rounded-2xl ${type.light} px-4 py-3`}>
                  <span className={`text-xs font-bold uppercase tracking-wide ${type.accent}`}>AI does</span>
                  <p className={`text-sm leading-relaxed mt-1 ${type.accent} opacity-90`}>{type.aiHelp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
