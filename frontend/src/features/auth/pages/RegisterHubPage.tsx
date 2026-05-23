import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Briefcase, GraduationCap, Stethoscope, Users } from 'lucide-react'
import { AuthCard } from '../components/AuthCard'
import { ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/cn'

const options = [
  {
    title: 'Student',
    description: 'Match teammates, join projects, and discover opportunities.',
    icon: GraduationCap,
    to: ROUTES.registerStudent,
    gradient: 'from-violet-500 to-indigo-600',
  },
  {
    title: 'Doctor / Supervisor',
    description: 'Supervise graduation projects and manage course teams.',
    icon: Stethoscope,
    to: ROUTES.registerDoctor,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Company',
    description: 'Search student talent with intelligent matching.',
    icon: Briefcase,
    to: ROUTES.registerCompany,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Student organization',
    description: 'Run events, recruitment campaigns, and grow membership.',
    icon: Users,
    to: ROUTES.registerOrganization,
    gradient: 'from-amber-500 to-orange-500',
  },
] as const

export function RegisterHubPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Select your account type."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={ROUTES.login} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <ul className="space-y-3">
        {options.map((option, index) => (
          <motion.li
            key={option.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={option.to}
              className={cn(
                'group flex items-center gap-4 rounded-xl border border-border bg-card p-4',
                'transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5',
              )}
            >
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                  option.gradient,
                )}
              >
                <option.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{option.title}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </motion.li>
        ))}
      </ul>
    </AuthCard>
  )
}
