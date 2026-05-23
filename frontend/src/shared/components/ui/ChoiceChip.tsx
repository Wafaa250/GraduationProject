import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { choiceChipClassName, type ChoiceChipSize } from './choiceChipStyles'

interface ChoiceChipProps {
  label: string
  selected: boolean
  onToggle: () => void
  size?: ChoiceChipSize
}

export function ChoiceChip({ label, selected, onToggle, size = 'md' }: ChoiceChipProps) {
  return (
    <motion.button
      type="button"
      layout
      initial={false}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 480, damping: 32 }}
      onClick={onToggle}
      aria-pressed={selected}
      className={choiceChipClassName(selected, size)}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          aria-hidden
        >
          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
        </motion.span>
      )}
      <span>{label}</span>
    </motion.button>
  )
}
