import { LayoutGroup, motion } from 'framer-motion'
import { normalizeSkillLabel, isDuplicateSkill } from '@/shared/lib/skillListUtils'
import { ChoiceChip } from './ChoiceChip'
import { ChoiceChipAdd } from './ChoiceChipAdd'
import type { ChoiceChipSize } from './choiceChipStyles'

interface ChoiceChipGroupProps {
  items: readonly string[]
  selected: string[]
  onToggle: (item: string) => void
  onAddCustom: (item: string) => void
  size?: ChoiceChipSize
  'aria-label'?: string
}

export function ChoiceChipGroup({
  items,
  selected,
  onToggle,
  onAddCustom,
  size = 'md',
  'aria-label': ariaLabel,
}: ChoiceChipGroupProps) {
  return (
    <LayoutGroup>
      <motion.div
        layout
        role="group"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-2"
      >
        {items.map((item) => (
          <ChoiceChip
            key={item}
            label={item}
            size={size}
            selected={selected.includes(item)}
            onToggle={() => onToggle(item)}
          />
        ))}
        <ChoiceChipAdd
          existingItems={items}
          onAdd={onAddCustom}
          normalize={normalizeSkillLabel}
          isDuplicate={isDuplicateSkill}
          size={size}
        />
      </motion.div>
    </LayoutGroup>
  )
}
