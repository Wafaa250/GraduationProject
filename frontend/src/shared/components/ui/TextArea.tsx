import { forwardRef, type TextareaHTMLAttributes } from 'react'
import {
  controlTextareaClass,
  fieldErrorClass,
  fieldGroupClass,
  fieldHintClass,
  fieldLabelClass,
} from '@/shared/styles/formControls'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className, id, rows = 3, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={fieldGroupClass}>
        <label htmlFor={fieldId} className={fieldLabelClass}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          className={controlTextareaClass({ error: Boolean(error), className })}
          {...props}
        />
        {hint && !error && <p className={fieldHintClass}>{hint}</p>}
        {error && <p className={fieldErrorClass}>{error}</p>}
      </div>
    )
  },
)
TextArea.displayName = 'TextArea'
