import { motion } from 'framer-motion'

const steps = [
  {
    step: '01',
    title: 'Build your skill profile',
    description:
      'Students and faculty add roles, technical skills, and context so matching starts from substance—not empty bios.',
  },
  {
    step: '02',
    title: 'Define the need',
    description:
      'A graduation project, course assignment, talent search, or recruitment campaign becomes the anchor for recommendations.',
  },
  {
    step: '03',
    title: 'Match with intelligence',
    description:
      'SkillSwap scores overlap, then layers AI ranking with clear reasons—who fits the team, who should supervise, who fits the role.',
  },
  {
    step: '04',
    title: 'Collaborate with clarity',
    description:
      'Invitations, acceptances, and team changes flow through notifications and messaging so everyone stays aligned.',
  },
] as const

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-semibold tracking-wide text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              From profile to project in four steps
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
              Whether you are forming a graduation team, assigning lab groups, hiring interns,
              or recruiting club members—the same principle applies: connect the right people
              to the right work.
            </p>
            <div className="mt-8 hidden h-px w-24 bg-gradient-to-r from-primary to-transparent lg:block" />
          </div>

          <ol className="relative space-y-4">
            <div className="absolute bottom-4 left-[19px] top-4 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
            {steps.map((item, index) => (
              <motion.li
                key={item.step}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="relative flex gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md hover:shadow-primary/5"
              >
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(262_70%_52%)] text-xs font-bold text-white shadow-md shadow-primary/25">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
