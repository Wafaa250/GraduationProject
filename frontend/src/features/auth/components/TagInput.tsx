import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import {
  controlInputClass,
  fieldErrorClass,
  fieldGroupClass,
  fieldHintClass,
  fieldLabelClass,
} from '@/shared/styles/formControls'
import { cn } from '@/shared/lib/cn'

interface TagInputProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  error?: string
  hint?: string
}

export function TagInput({ label, values, onChange, placeholder, error, hint }: TagInputProps) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const tag = raw.trim()
    if (!tag || values.some((v) => v.toLowerCase() === tag.toLowerCase())) return
    onChange([...values, tag])
    setDraft('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    }
    if (e.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className={fieldGroupClass}>
      <label className={fieldLabelClass}>{label}</label>
      <div
        className={cn(
          controlInputClass({ error: Boolean(error) }),
          'h-auto min-h-10 flex-wrap gap-1.5 py-2',
        )}
      >
        <div className="flex w-full flex-wrap gap-1.5">
          {values.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== tag))}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => add(draft)}
            placeholder={values.length === 0 ? placeholder : ''}
            className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
      </div>
      {hint && !error && <p className={fieldHintClass}>{hint}</p>}
      {error && <p className={fieldErrorClass}>{error}</p>}
    </div>
  )
}
