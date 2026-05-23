import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { pageSubtitleClass, pageTitleClass } from '@/shared/styles/typography'
import { cn } from '@/shared/lib/cn'

interface AuthCardProps {
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  const showHeader = Boolean(title || description)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn('w-full', className)}
    >
      {showHeader && (
        <div className="mb-7 sm:mb-8">
          {title && <h1 className={pageTitleClass}>{title}</h1>}
          {description && <p className={pageSubtitleClass}>{description}</p>}
        </div>
      )}
      {children}
      {footer && <div className="mt-8 border-t border-border pt-6">{footer}</div>}
    </motion.div>
  )
}
