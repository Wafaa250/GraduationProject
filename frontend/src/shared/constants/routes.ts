export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  registerStudent: '/register/student',
  registerDoctor: '/register/doctor',
  registerCompany: '/register/company',
  registerOrganization: '/register/organization',
  app: '/app',
  doctor: '/doctor',
  company: '/company',
  org: '/org',
} as const

export function getHomeForRole(role: string): string {
  const r = role.toLowerCase()
  if (r === 'student') return ROUTES.app
  if (r === 'doctor') return ROUTES.doctor
  if (r === 'company') return ROUTES.company
  if (r === 'studentassociation' || r === 'association') return ROUTES.org
  return ROUTES.app
}
