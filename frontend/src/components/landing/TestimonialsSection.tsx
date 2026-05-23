import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/landing/SectionHeading";

const testimonials = [
  {
    quote:
      "I found my entire graduation team in one afternoon. The AI matched me with people I'd never worked with — and we won the project showcase.",
    name: "Layla Hassan",
    role: "Computer Science Student",
    initial: "S",
  },
  {
    quote:
      "I supervise 8 projects this semester. SkillSwap saves me hours by suggesting balanced teams and matching projects to my expertise.",
    name: "Dr. Ahmad Mansour",
    role: "Software Engineering Supervisor",
    initial: "D",
  },
  {
    quote:
      "We hired two interns through SkillSwap. The candidates were genuinely qualified — not just well-presented resumes.",
    name: "Reem Khalil",
    role: "Talent Lead, NovaTech Labs",
    initial: "C",
  },
  {
    quote:
      "Mobilizing 30 volunteers for our climate campaign took one post. The skill matching made onboarding effortless.",
    name: "Jad Karam",
    role: "Director, GreenFuture Org",
    initial: "O",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-32 relative">
      <div className="container">
        <SectionHeading
          eyebrow="Loved by everyone"
          title={
            <>
              Stories from <span className="text-gradient-primary">our community</span>
            </>
          }
          subtitle="Students, supervisors, companies, and organizations are already building better teams."
        />
        <div className="mt-14 grid sm:grid-cols-2 gap-5">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.6 }}
              className="relative p-6 lg:p-8 rounded-2xl glass hover:bg-white/[0.06] transition-all"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />
              <p className="text-base lg:text-lg leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.initial}
                </div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
