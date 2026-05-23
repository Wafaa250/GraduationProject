import { ArrowRight } from 'lucide-react'
import { GhostButton, PrimaryButton } from './States'

type Props = {
  step: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  loading?: boolean
  isLastStep?: boolean
  backLabel?: string
}

export function RegistrationStepFooter({
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel,
  loading,
  isLastStep,
  backLabel = 'Back',
}: Props) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 mt-6 border-t border-border">
      <GhostButton type="button" onClick={onBack} className="w-full sm:w-auto">
        {backLabel}
      </GhostButton>
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="text-xs text-muted-foreground sm:hidden">
          Step {step + 1} of {totalSteps}
        </span>
        <PrimaryButton
          type="button"
          onClick={onNext}
          loading={loading}
          className="w-full sm:w-auto min-w-[180px]"
        >
          {nextLabel ?? (isLastStep ? 'Create account' : 'Continue')}
          {!isLastStep && !loading ? <ArrowRight className="h-4 w-4" /> : null}
        </PrimaryButton>
      </div>
    </div>
  )
}
