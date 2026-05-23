import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  GraduationCap,
  BookUser,
  Building2,
  Briefcase,
  Sparkles,
} from 'lucide-react'
import { AuthShell } from '../../components/auth/AuthShell'
import { RoleCard } from '../../components/auth/RoleCard'
import { Button } from '../../components/ui/button'
import { cn } from '../../components/ui/utils'
import DoctorRegisterForm from '../forms/DoctorRegisterForm'
import CompanyRegisterForm from '../forms/CompanyRegisterForm'
import StudentRegisterForm from '../forms/StudentRegisterForm'

type UserRole = 'student' | 'doctor' | 'company' | 'association'

const ROLES: {
  id: UserRole
  icon: typeof GraduationCap
  title: string
  description: string
  badge?: string
}[] = [
  {
    id: 'student',
    icon: GraduationCap,
    title: 'Student',
    description:
      'Build a skill-based profile, find compatible teammates and join balanced AI-formed project teams.',
  },
  {
    id: 'doctor',
    icon: BookUser,
    title: 'Doctor',
    description:
      'Supervise graduation projects, mentor student teams, and review supervision requests within your expertise.',
  },
  {
    id: 'association',
    icon: Building2,
    title: 'Organization',
    description:
      'Manage organization initiatives, recruit members, and connect with students across campus.',
  },
  {
    id: 'company',
    icon: Briefcase,
    title: 'Company',
    description:
      'Describe project needs, discover matching students, and build complementary project teams.',
  },
]

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const navigate = useNavigate()

  const handleContinue = () => {
    if (!selectedRole) return
    sessionStorage.setItem('selectedRole', selectedRole)
    if (selectedRole === 'association') {
      navigate('/register/association')
      return
    }
    setStep(2)
  }

  const handleBack = () => {
    sessionStorage.removeItem('selectedRole')
    setSelectedRole(null)
    setStep(1)
  }

  const renderRoleForm = () => {
    switch (selectedRole) {
      case 'student':
        return <StudentRegisterForm onBack={handleBack} />
      case 'doctor':
        return <DoctorRegisterForm onBack={handleBack} />
      case 'company':
        return <CompanyRegisterForm onBack={handleBack} />
      default:
        return null
    }
  }

  if (step === 2) {
    return renderRoleForm()
  }

  return (
    <AuthShell
      wide
      topRight={
        <span className="text-muted-foreground">
          Already on SkillSwap?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-deep transition-colors"
          >
            Sign in
          </Link>
        </span>
      }
    >
      <div className="text-center mb-8 sm:mb-10 animate-fade-up">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/90 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground mb-5 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Step 1 of 2 · Choose account type
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-foreground tracking-tight leading-tight">
          Choose your <span className="text-gradient-brand">SkillSwap</span> account type
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
          Choose how you want to participate in SkillSwap. Your registration fields and workspace will be
          tailored to your role.
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10 animate-fade-up max-w-[1120px] mx-auto"
        style={{ animationDelay: '80ms' }}
      >
        {ROLES.map((role) => (
          <RoleCard
            key={role.id}
            icon={role.icon}
            title={role.title}
            description={role.description}
            badge={role.badge}
            selected={selectedRole === role.id}
            onSelect={() => setSelectedRole(role.id)}
          />
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto animate-fade-up">
        <Link
          to="/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center sm:text-left"
        >
          ← Back to Sign in
        </Link>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedRole}
          className={cn(
            'w-full sm:w-auto min-w-[220px] h-12 rounded-xl text-sm font-semibold',
            'bg-gradient-brand text-primary-foreground hover:opacity-95 hover:shadow-glow',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none'
          )}
        >
          Continue
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </AuthShell>
  )
}
