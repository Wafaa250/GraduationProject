import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Stethoscope, Building2, Users } from 'lucide-react'

// ── Import each role's registration form ──────────────────────────────────────
import StudentRegisterForm from '../forms/StudentRegisterForm'
// import DoctorRegisterForm   from './forms/DoctorRegisterForm'
// import CompanyRegisterForm  from './forms/CompanyRegisterForm'
// import AssocRegisterForm    from './forms/AssocRegisterForm'

// ─────────────────────────────────────────────────────────────────────────────

type UserRole = 'student' | 'doctor' | 'company' | 'association' | null

const ROLES = [
  {
    id: 'student' as UserRole,
    icon: GraduationCap,
    title: 'Student',
    desc: 'Looking for teammates & projects',
    gradient: 'from-indigo-500 to-violet-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    selectedBorder: 'border-indigo-500',
    selectedBg: 'bg-indigo-50',
  },
  {
    id: 'doctor' as UserRole,
    icon: Stethoscope,
    title: 'Doctor / Supervisor',
    desc: 'Seeking research collaborators',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selectedBorder: 'border-blue-500',
    selectedBg: 'bg-blue-50',
  },
  {
    id: 'company' as UserRole,
    icon: Building2,
    title: 'Company',
    desc: 'Find talented students',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    selectedBorder: 'border-emerald-500',
    selectedBg: 'bg-emerald-50',
  },
  {
    id: 'association' as UserRole,
    icon: Users,
    title: 'Student Association',
    desc: 'Connect with student communities',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    selectedBorder: 'border-amber-500',
    selectedBg: 'bg-amber-50',
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep]                 = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)

  const selectedRoleData = ROLES.find(r => r.id === selectedRole)

  const handleNext = () => {
    if (selectedRole) {
      sessionStorage.setItem('selectedRole', selectedRole) // ✅ حفظ الـ role
      setStep(2)
    }
  }

  const handleBack = () => {
    sessionStorage.removeItem('selectedRole') // ✅ تنظيف لو رجع
    setStep(1)
  }

  // ── Render the correct form based on role ────────────────────────────────
  const renderRoleForm = () => {
    switch (selectedRole) {
      case 'student':
        return <StudentRegisterForm onBack={handleBack} />
      case 'doctor':
        return <ComingSoon role="Doctor / Supervisor" onBack={handleBack} />
      case 'company':
        return <ComingSoon role="Company" onBack={handleBack} />
      case 'association':
        return <ComingSoon role="Student Association" onBack={handleBack} />
      default:
        return null
    }
  }

  // ── If step 2, render the role-specific form full-page ───────────────────
  if (step === 2) {
    return renderRoleForm()
  }

  // ── Step 1: Role Selection ────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{
        fontFamily: 'DM Sans, sans-serif',
        background: 'linear-gradient(155deg, #f8f7ff 0%, #f0f4ff 40%, #faf5ff 100%)',
      }}
    >
      {/* Background blobs */}
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">

          {/* Top gradient bar */}
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7)' }} />

          <div className="px-8 py-10">

            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                Skill
                <span style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Swap
                </span>
              </span>
            </Link>

            {/* Stepper */}
            <div className="flex items-center gap-3 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s ? 'text-white shadow-md shadow-indigo-200'
                      : step > s ? 'text-white'
                      : 'bg-slate-100 text-slate-400'
                    }`}
                    style={step >= s ? { background: 'linear-gradient(135deg,#6366f1,#a855f7)' } : {}}
                  >
                    {s}
                  </div>
                  <span className={`text-xs font-medium ${step === s ? 'text-slate-700' : 'text-slate-400'}`}>
                    {s === 1 ? 'Choose Role' : 'Account Info'}
                  </span>
                  {s < 2 && <div className={`w-8 h-px ${step > 1 ? 'bg-indigo-300' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>

            {/* Role selection */}
            <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                How will you use SkillSwap?
              </h1>
              <p className="text-slate-500 text-sm mb-7">Choose your role to get started</p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {ROLES.map((role) => {
                  const Icon = role.icon
                  const isSelected = selectedRole === role.id
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`relative p-4 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 ${
                        isSelected
                          ? `${role.selectedBorder} ${role.selectedBg} shadow-md`
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center text-white mb-3 shadow-sm`}>
                        <Icon size={18} strokeWidth={1.8} />
                      </div>
                      <div className="text-sm font-bold text-slate-800">{role.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{role.desc}</div>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={handleNext}
                disabled={!selectedRole}
                className={`w-full flex items-center justify-center gap-2.5 text-white py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  selectedRole
                    ? 'shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ background: 'linear-gradient(135deg,#4f46e5,#9333ea)' }}
              >
                Continue as {selectedRoleData?.title ?? '...'}
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Placeholder for roles not built yet ─────────────────────────────────────
function ComingSoon({ role, onBack }: { role: string; onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(155deg, #f8f7ff 0%, #f0f4ff 40%, #faf5ff 100%)' }}>
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-12 text-center max-w-sm">
        <div className="text-4xl mb-4">🚧</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{role} Registration</h2>
        <p className="text-slate-500 text-sm mb-6">This form is coming soon!</p>
        <button onClick={onBack}
          className="text-indigo-600 font-semibold text-sm hover:underline">
          ← Back to role selection
        </button>
      </div>
    </div>
  )
}