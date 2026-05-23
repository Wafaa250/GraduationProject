import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { LandingLogo } from './LandingLogo'

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'AI matching', href: '#ai' },
  ],
  Account: [
    { label: 'Sign in', to: ROUTES.login },
    { label: 'Register', to: ROUTES.register },
    { label: 'Student', to: ROUTES.registerStudent },
    { label: 'Doctor', to: ROUTES.registerDoctor },
  ],
} as const

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <LandingLogo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              SkillSwap is an AI-powered academic collaboration platform for team formation,
              supervision, and talent discovery—not a learning management system.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Product
            </p>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.Product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Account
            </p>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.Account.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SkillSwap. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Not affiliated with Moodle, Zajel, or any LMS.
          </p>
        </div>
      </div>
    </footer>
  )
}
