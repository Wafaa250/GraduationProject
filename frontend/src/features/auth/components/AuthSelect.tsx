import { forwardRef, type SelectHTMLAttributes } from 'react'
import {
  controlInputClass,
  fieldErrorClass,
  fieldGroupClass,
  fieldLabelClass,
} from '@/shared/styles/formControls'

export interface AuthSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export const AuthSelect = forwardRef<HTMLSelectElement, AuthSelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={fieldGroupClass}>
        <label htmlFor={fieldId} className={fieldLabelClass}>
          {label}
        </label>
        <select
          ref={ref}
          id={fieldId}
          className={controlInputClass({ error: Boolean(error), className })}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className={fieldErrorClass}>{error}</p>}
      </div>
    )
  },
)
AuthSelect.displayName = 'AuthSelect'
