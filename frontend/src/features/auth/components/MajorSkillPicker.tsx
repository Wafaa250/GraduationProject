import { motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSkillsForMajor } from '@/shared/constants/skillsByMajor'
import { mergeSkillItems } from '@/shared/lib/skillListUtils'
import { ChoiceChipGroup } from '@/shared/components/ui/ChoiceChipGroup'
import {
  pageTitleClass,
  sectionTitleClass,
  sectionTitleLgClass,
  sectionTitleMutedClass,
} from '@/shared/styles/typography'
import { cn } from '@/shared/lib/cn'

interface MajorSkillPickerProps {
  major: string
  roles: string[]
  technicalSkills: string[]
  tools: string[]
  onRolesChange: (next: string[]) => void
  onTechnicalChange: (next: string[]) => void
  onToolsChange: (next: string[]) => void
  roleError?: string
  technicalError?: string
}

function toggleInList(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

function addCustomSkill(
  custom: string[],
  setCustom: (next: string[]) => void,
  selected: string[],
  onSelectedChange: (next: string[]) => void,
  skill: string,
  allItems: string[],
) {
  if (allItems.some((i) => i.toLowerCase() === skill.toLowerCase())) {
    if (!selected.includes(skill)) onSelectedChange([...selected, skill])
    return
  }
  setCustom([...custom, skill])
  onSelectedChange([...selected, skill])
}

function SectionHeading({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode
  variant?: 'default' | 'muted' | 'lg'
  className?: string
}) {
  const base =
    variant === 'lg'
      ? sectionTitleLgClass
      : variant === 'muted'
        ? sectionTitleMutedClass
        : sectionTitleClass
  return <h3 className={cn(base, className)}>{children}</h3>
}

export function MajorSkillPicker({
  major,
  roles,
  technicalSkills,
  tools,
  onRolesChange,
  onTechnicalChange,
  onToolsChange,
  roleError,
  technicalError,
}: MajorSkillPickerProps) {
  const catalog = useMemo(() => getSkillsForMajor(major), [major])

  const [customRoles, setCustomRoles] = useState<string[]>([])
  const [customTechnical, setCustomTechnical] = useState<string[]>([])
  const [customTools, setCustomTools] = useState<string[]>([])

  useEffect(() => {
    setCustomRoles([])
    setCustomTechnical([])
    setCustomTools([])
  }, [major])

  const roleItems = useMemo(
    () => mergeSkillItems(catalog.roles, customRoles),
    [catalog.roles, customRoles],
  )
  const technicalItems = useMemo(
    () => mergeSkillItems(catalog.technicalSkills, customTechnical),
    [catalog.technicalSkills, customTechnical],
  )
  const toolItems = useMemo(
    () => mergeSkillItems(catalog.tools, customTools),
    [catalog.tools, customTools],
  )

  return (
    <motion.div
      key={major}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="relative mb-8 sm:mb-10">
        <div
          className="pointer-events-none absolute -inset-x-4 -top-6 h-28 bg-[radial-gradient(ellipse_80%_70%_at_50%_0%,hsl(245_72%_56%/_0.1),transparent)] sm:-inset-x-8"
          aria-hidden
        />
        <h2 className={cn('relative', pageTitleClass)}>What are you skilled in?</h2>
      </header>

      <div className="space-y-10 sm:space-y-12">
        <section>
          <SectionHeading variant="lg" className="mb-4">
            Technical skills
          </SectionHeading>
          <ChoiceChipGroup
            aria-label="Technical skills"
            items={technicalItems}
            selected={technicalSkills}
            onToggle={(item) => onTechnicalChange(toggleInList(technicalSkills, item))}
            onAddCustom={(skill) =>
              addCustomSkill(
                customTechnical,
                setCustomTechnical,
                technicalSkills,
                onTechnicalChange,
                skill,
                technicalItems,
              )
            }
          />
          {technicalError && (
            <p className="mt-2 text-xs font-medium text-red-600">{technicalError}</p>
          )}
        </section>

        <section>
          <SectionHeading variant="muted" className="mb-4">
            Roles
          </SectionHeading>
          <ChoiceChipGroup
            aria-label="Roles"
            items={roleItems}
            selected={roles}
            onToggle={(item) => onRolesChange(toggleInList(roles, item))}
            onAddCustom={(skill) =>
              addCustomSkill(
                customRoles,
                setCustomRoles,
                roles,
                onRolesChange,
                skill,
                roleItems,
              )
            }
          />
          {roleError && (
            <p className="mt-2 text-xs font-medium text-red-600">{roleError}</p>
          )}
        </section>

        <section>
          <SectionHeading variant="muted" className="mb-4">
            Tools & technologies
          </SectionHeading>
          <ChoiceChipGroup
            aria-label="Tools and technologies"
            items={toolItems}
            selected={tools}
            onToggle={(item) => onToolsChange(toggleInList(tools, item))}
            onAddCustom={(skill) =>
              addCustomSkill(
                customTools,
                setCustomTools,
                tools,
                onToolsChange,
                skill,
                toolItems,
              )
            }
          />
        </section>
      </div>
    </motion.div>
  )
}
