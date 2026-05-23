import { Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

/** Shared sparkles icon — used on “Get started” and navbar logo for consistency. */
export function BrandSparklesIcon({ className }: { className?: string }) {
  return <Sparkles className={cn('h-3.5 w-3.5', className)} />
}
