import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import {
  choiceChipAddInputClassName,
  choiceChipAddTriggerClassName,
  type ChoiceChipSize,
} from './choiceChipStyles'

interface ChoiceChipAddProps {
  existingItems: readonly string[]
  onAdd: (value: string) => void
  normalize?: (value: string) => string
  isDuplicate?: (value: string, existing: readonly string[]) => boolean
  size?: ChoiceChipSize
  className?: string
}

function defaultNormalize(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function defaultIsDuplicate(value: string, existing: readonly string[]) {
  const key = defaultNormalize(value).toLowerCase()
  if (!key) return true
  return existing.some((item) => item.toLowerCase() === key)
}

export function ChoiceChipAdd({
  existingItems,
  onAdd,
  normalize = defaultNormalize,
  isDuplicate = defaultIsDuplicate,
  size = 'md',
  className,
}: ChoiceChipAddProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const close = () => {
    setOpen(false)
    setValue('')
  }

  const submit = () => {
    const label = normalize(value)
    if (!label || isDuplicate(label, existingItems)) {
      close()
      return
    }
    onAdd(label)
    close()
  }

  return (
    <div className={cn('inline-flex', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          <motion.button
            key="trigger"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => {
              setOpen(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
            className={choiceChipAddTriggerClassName(size)}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>Add your own</span>
          </motion.button>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <label htmlFor={inputId} className="sr-only">
              Add custom item
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={value}
              maxLength={60}
              placeholder="Type and press Enter"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                }
                if (e.key === 'Escape') close()
              }}
              onBlur={submit}
              className={choiceChipAddInputClassName(size)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
