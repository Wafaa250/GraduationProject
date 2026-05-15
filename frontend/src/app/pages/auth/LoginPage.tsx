import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Mail, Lock } from 'lucide-react'
import api from '../../../api/axiosInstance'
import { isAssociationRole } from '../../../api/associationApi'

export type LoginPageProps = {
  /** When true, successful login does not navigate — caller refreshes in-place (e.g. embedded doctor dashboard). */
  embedded?: boolean
  /** Called after tokens are written to localStorage. */
  onLoginSuccess?: () => void
}

export default function LoginPage({ embedded = false, onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setApiError(null)

    try {
      const response = await api.post('/auth/login', { email, password })
      const result = response.data

      // ✅ حفظ التوكن والمعلومات
      localStorage.setItem('token', result.token)
      localStorage.setItem('userId', result.userId.toString())
      localStorage.setItem('role', result.role)
      localStorage.setItem('name', result.name)
      localStorage.setItem('email', result.email)

      onLoginSuccess?.()

      if (embedded) {
        return
      }

      const role = (result.role ?? '').toString().toLowerCase()
      if (role === 'doctor') {
        navigate('/doctor-dashboard')
      } else if (role === 'student') {
        navigate('/dashboard')
      } else if (role === 'company') {
        navigate('/company/dashboard')
      } else if (isAssociationRole(role)) {
        navigate('/association/dashboard')
      } else {
        navigate('/dashboard')
      }

    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        'Invalid email or password. Please try again.'
      setApiError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" style={{ fontFamily: 'DM Sans, sans-serif' }}>

      <div className="w-full max-w-md px-8 py-12 bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 relative overflow-hidden mx-4">

        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)' }} />

        <div className="relative">

          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <span className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Skill
              <span
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Swap
              </span>
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Welcome back 👋
            </h1>
            <p className="text-slate-500 text-sm">
              Sign in to continue building your dream team
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* ── API Error ── */}
            {apiError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                ❌ {apiError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#9333ea)' }}
            >
              {isLoading ? '⏳ Signing in...' : (
                <>Sign In <ArrowRight size={16} strokeWidth={2.5}/></>
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200"/>
            <span className="text-xs text-slate-400 font-medium">or continue with</span>
            <div className="flex-1 h-px bg-slate-200"/>
          </div>

          {/* Google */}
          <button className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all hover:-translate-y-0.5 shadow-sm">
            Continue with Google
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-slate-500 mt-7">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Sign up for free
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}