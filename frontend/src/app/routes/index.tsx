import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { LandingPage } from '@/features/landing/LandingPage'
import { MarketingLayout } from './MarketingLayout'
import { AuthLayout } from '@/features/auth/layouts/AuthLayout'
import { GuestGuard } from './guards/GuestGuard'
import { AuthGuard } from './guards/AuthGuard'
import { RoleGuard } from './guards/RoleGuard'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { RegisterHubPage } from '@/features/auth/pages/RegisterHubPage'
import { RegisterStudentPage } from '@/features/auth/pages/RegisterStudentPage'
import { RegisterDoctorPage } from '@/features/auth/pages/RegisterDoctorPage'
import { RegisterCompanyPage } from '@/features/auth/pages/RegisterCompanyPage'
import { RegisterOrganizationPage } from '@/features/auth/pages/RegisterOrganizationPage'
import { RoleHomePlaceholder } from '@/app/pages/RoleHomePlaceholder'
import { StudentAppLayout } from '@/features/student/layouts/StudentAppLayout'
import { StudentDashboardPage } from '@/features/student/pages/StudentDashboardPage'

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [{ path: ROUTES.home, element: <LandingPage /> }],
  },
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.login, element: <LoginPage /> },
          { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
          { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
          { path: ROUTES.register, element: <RegisterHubPage /> },
          { path: ROUTES.registerStudent, element: <RegisterStudentPage /> },
          { path: ROUTES.registerDoctor, element: <RegisterDoctorPage /> },
          { path: ROUTES.registerCompany, element: <RegisterCompanyPage /> },
          { path: ROUTES.registerOrganization, element: <RegisterOrganizationPage /> },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard allowedRoles={['student']} />,
        children: [
          {
            path: ROUTES.app,
            element: <StudentAppLayout />,
            children: [{ index: true, element: <StudentDashboardPage /> }],
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['doctor']} />,
        children: [
          {
            path: ROUTES.doctor,
            element: (
              <RoleHomePlaceholder
                title="Faculty workspace"
                description="Doctor dashboard coming soon. Supervision and course tools will appear here."
              />
            ),
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['company']} />,
        children: [
          {
            path: ROUTES.company,
            element: (
              <RoleHomePlaceholder
                title="Company workspace"
                description="Talent search workspace coming soon."
              />
            ),
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['studentassociation', 'association']} />,
        children: [
          {
            path: ROUTES.org,
            element: (
              <RoleHomePlaceholder
                title="Organization workspace"
                description="Events and recruitment admin coming soon."
              />
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.home} replace /> },
])
