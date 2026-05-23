import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Briefcase, GraduationCap, Stethoscope, Users } from 'lucide-react'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/cn'

const roles = [
  {
    icon: GraduationCap,
    title: 'Students',
    description:
      'Own or join one graduation project, discover peers, follow organizations, and collaborate in course teams.',
    href: ROUTES.registerStudent,
    gradient: 'from-violet-600/20 via-indigo-500/10 to-transparent',
    iconBg: 'from-violet-500 to-indigo-600',
  },
  {
    icon: Stethoscope,
    title: 'Doctors & supervisors',
    description:
      'Review supervision requests, manage courses, and generate balanced teams with AI when you choose instructor-led mode.',
    href: ROUTES.registerDoctor,
    gradient: 'from-blue-600/20 via-cyan-500/10 to-transparent',
    iconBg: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Briefcase,
    title: 'Companies',
    description:
      'Search student talent by skills and engagement type. Get ranked matches with explanations—not a generic job board.',
    href: ROUTES.registerCompany,
    gradient: 'from-emerald-600/20 via-teal-500/10 to-transparent',
    iconBg: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Users,
    title: 'Student organizations',
    description:
      'Publish events, run recruitment campaigns, and review applicants with AI-assisted ranking and membership sync.',
    href: ROUTES.registerOrganization,
    gradient: 'from-amber-600/20 via-orange-500/10 to-transparent',
    iconBg: 'from-amber-500 to-orange-500',
  },
] as const

export function LandingUserTypes() {
  return (
    <section id="roles" className="relative border-t border-border/80 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">Built for every role</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            One platform, four distinct experiences
          </h2>
          <p className="mt-4 text-muted-foreground">
            Each account type gets a focused workspace—no cluttered one-size-fits-all dashboard.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07, duration: 0.45 }}
            >
              <Link
                to={role.href}
                className={cn(
                  'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-sm',
                  'transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10',
                )}
              >
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                    role.gradient,
                  )}
                />
                <div className="relative">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
                      role.iconBg,
                    )}
                  >
                    <role.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{role.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {role.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Create account
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
