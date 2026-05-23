import type { ReactNode } from 'react'
import { cn } from '../ui/utils'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

export function TextInput({ invalid, leading, trailing, className, ...rest }: InputProps) {
  return (
    <div
      className={cn(
        'flex items-center h-11 rounded-lg border bg-background px-3 transition focus-within:ring-2 focus-within:ring-primary/25',
        invalid
          ? 'border-destructive focus-within:border-destructive'
          : 'border-border focus-within:border-primary',
        className
      )}
    >
      {leading ? <span className="mr-2 text-muted-foreground shrink-0">{leading}</span> : null}
      <input
        {...rest}
        className="w-full min-w-0 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
      />
      {trailing ? <span className="ml-2 text-muted-foreground shrink-0">{trailing}</span> : null}
    </div>
  )
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={cn(
        'w-full min-h-[110px] rounded-lg border border-border bg-background p-3 text-sm placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25 resize-y',
        className
      )}
    />
  )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }

export function RegSelect({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <select
      {...rest}
      className={cn(
        'w-full h-11 rounded-lg border bg-background px-3 text-sm outline-none transition appearance-none',
        invalid ? 'border-destructive' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/25',
        className
      )}
    >
      {children}
    </select>
  )
}
