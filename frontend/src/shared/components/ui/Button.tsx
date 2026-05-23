import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from 'react'
import { cn } from '@/shared/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-[hsl(245_58%_46%)] active:scale-[0.98]',
  secondary:
    'bg-muted text-foreground hover:bg-[hsl(240_5%_92%)] active:scale-[0.98]',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  outline:
    'border border-border bg-card text-foreground hover:bg-muted active:scale-[0.98]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
}

const baseStyles =
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      type = 'button',
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(baseStyles, variants[variant], sizes[size], className)

    if (asChild && isValidElement(children)) {
      return cloneElement(children as ReactElement<{ className?: string }>, {
        className: cn(classes, (children as ReactElement<{ className?: string }>).props.className),
      })
    }

    return (
      <button ref={ref} type={type} className={classes} {...props}>
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
