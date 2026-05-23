import { motion } from 'framer-motion'
import {
  Bot,
  GraduationCap,
  MessageSquare,
  Search,
  Users,
  Building2,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const features = [
  {
    icon: GraduationCap,
    title: 'Graduation project engine',
    description:
      'Create a project, invite teammates, request supervisors, and manage your team—with rules that keep one clear affiliation per student.',
    featured: true,
  },
  {
    icon: Bot,
    title: 'Intelligent recommendations',
    description:
      'AI ranks teammates and supervisors from real profiles and project context, with skill-based fallback when AI is unavailable.',
    featured: true,
  },
  {
    icon: Users,
    title: 'Course collaboration',
    description:
      'Instructors generate balanced teams or let students self-form with guided matching, section chat, and team channels.',
    featured: false,
  },
  {
    icon: Building2,
    title: 'Organizations & recruitment',
    description:
      'Student clubs publish events and campaigns; applicants are ranked intelligently and onboarded into membership on acceptance.',
    featured: false,
  },
  {
    icon: Search,
    title: 'Company talent discovery',
    description:
      'Recruiters define skill needs and receive ranked student matches with explanations—built for discovery, not gradebooks.',
    featured: false,
  },
  {
    icon: MessageSquare,
    title: 'Unified communication',
    description:
      'Private messages, team chats, and a notification inbox that documents every invite, decision, and team change.',
    featured: false,
  },
] as const

export function LandingFeatures() {
  return (
    <section id="features" className="relative border-t border-border/80 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">Platform capabilities</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to match, not manage
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            SkillSwap is not Moodle or Zajel. No attendance, grades, or exams—just the
            collaboration layer universities are missing.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.05, duration: 0.45 }}
              className={cn(
                'group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300',
                'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/8',
                feature.featured
                  ? 'border-primary/20 shadow-md shadow-primary/5'
                  : 'border-border shadow-sm',
              )}
            >
              {feature.featured && (
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" />
              )}
              <div
                className={cn(
                  'relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300',
                  feature.featured
                    ? 'bg-gradient-to-br from-primary to-[hsl(262_70%_52%)] text-white shadow-md shadow-primary/25 group-hover:scale-105'
                    : 'bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground',
                )}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-5 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
