import { Building2, GraduationCap, Megaphone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ImageWithFallback } from "../ui/ImageWithFallback";
import studentImg from "../../../assets/images/student.jpg";
import doctorImg from "../../../assets/images/doctor.jpg";
import companyImg from "../../../assets/images/company.jpg";
import assocImg from "../../../assets/images/association.jpg";

const userTypes: {
  image: string;
  role: string;
  icon: LucideIcon;
  iconGradient: string;
  description: string;
}[] = [
  {
    image: studentImg,
    role: "Student",
    icon: Users,
    iconGradient: "bg-gradient-primary",
    description:
      "Build a smart profile. Get matched to projects, teammates and supervisors.",
  },
  {
    image: doctorImg,
    role: "Doctor",
    icon: GraduationCap,
    iconGradient: "bg-gradient-to-br from-accent to-primary",
    description:
      "Receive supervision requests for projects that actually fit your research.",
  },
  {
    image: companyImg,
    role: "Company",
    icon: Building2,
    iconGradient: "bg-gradient-ai",
    description: "Find skilled students or full teams for paid projects and internships.",
  },
  {
    image: assocImg,
    role: "Association",
    icon: Megaphone,
    iconGradient: "bg-gradient-to-br from-primary to-accent",
    description:
      "Form campaign teams with the right roles, not just the loudest volunteers.",
  },
];

export function UserTypes() {
  return (
    <section className="py-20" id="for-who">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            For everyone on campus
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">One platform, four roles.</h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {userTypes.map((type) => {
            const Icon = type.icon;
            return (
              <article
                key={type.role}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop"
              >
                <div className="relative h-40 overflow-hidden">
                  <ImageWithFallback
                    src={type.image}
                    alt={type.role}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                  <div
                    className={`absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground shadow-glow ${type.iconGradient}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold">{type.role}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{type.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
