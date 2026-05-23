import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import {
  controlInputClass,
  controlSearchInputClass,
  fieldErrorClass,
  fieldGroupClass,
  fieldHintClass,
  fieldLabelClass,
} from '@/shared/styles/formControls'
import { cn } from '@/shared/lib/cn'

export interface SearchableSelectOption {
  value: string
  label: string
}

export interface SearchableSelectProps {
  label: string
  placeholder?: string
  searchPlaceholder?: string
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  hint?: string
  emptyMessage?: string
  /** When true, search box is hidden (useful for short lists). */
  disableSearch?: boolean
}

export function SearchableSelect({
  label,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  options,
  value,
  onChange,
  disabled = false,
  error,
  hint,
  emptyMessage = 'No results found.',
  disableSearch = false,
}: SearchableSelectProps) {
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (open && !disableSearch) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
    if (!open) setQuery('')
  }, [open, disableSearch])

  useEffect(() => {
    setHighlightIndex(0)
  }, [query, open])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const selectOption = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (filtered[highlightIndex]) selectOption(filtered[highlightIndex].value)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    }
  }

  return (
    <div ref={containerRef} className={cn(fieldGroupClass, 'relative')}>
      <label className={fieldLabelClass}>{label}</label>

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={cn(
          controlInputClass({ error: Boolean(error) }),
          'items-center justify-between text-left',
          open && !error && 'border-primary/40 ring-2 ring-ring/30',
        )}
      >
        <span className={cn('truncate', selected ? 'text-foreground' : 'text-muted-foreground/80')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/8"
          >
            {!disableSearch && options.length > 4 && (
              <div className="border-b border-border p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className={controlSearchInputClass()}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <ul
              id={listboxId}
              role="listbox"
              className="max-h-[min(240px,50vh)] overflow-y-auto p-1.5"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</li>
              ) : (
                filtered.map((option, index) => {
                  const isSelected = option.value === value
                  const isHighlighted = index === highlightIndex
                  return (
                    <li key={option.value} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => selectOption(option.value)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                          isHighlighted && 'bg-muted',
                          isSelected && 'bg-primary/8 text-primary',
                        )}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {hint && !error && <p className={fieldHintClass}>{hint}</p>}
      {error && <p className={fieldErrorClass}>{error}</p>}
    </div>
  )
}
