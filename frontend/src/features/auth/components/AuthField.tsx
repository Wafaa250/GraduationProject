import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import {
  controlInputClass,
  fieldErrorClass,
  fieldGroupClass,
  fieldHintClass,
  fieldLabelClass,
} from '@/shared/styles/formControls'

export interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  /** Renders beside the label (e.g. “Forgot password?”) */
  labelAction?: ReactNode
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, hint, labelAction, className, id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={fieldGroupClass}>
        {labelAction ? (
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={fieldId} className={fieldLabelClass}>
              {label}
            </label>
            {labelAction}
          </div>
        ) : (
          <label htmlFor={fieldId} className={fieldLabelClass}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          className={controlInputClass({ error: Boolean(error), className })}
          {...props}
        />
        {hint && !error && <p className={fieldHintClass}>{hint}</p>}
        {error && <p className={fieldErrorClass}>{error}</p>}
      </div>
    )
  },
)
AuthField.displayName = 'AuthField'
