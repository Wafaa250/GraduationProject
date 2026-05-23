import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { authBackLinkClass } from '@/shared/styles/layout'

interface AuthBackLinkProps {
  to: string
  children?: React.ReactNode
}

export function AuthBackLink({ to, children = 'All account types' }: AuthBackLinkProps) {
  return (
    <Link to={to} className={authBackLinkClass}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  )
}
