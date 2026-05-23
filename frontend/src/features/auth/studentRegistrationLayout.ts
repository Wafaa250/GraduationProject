/** Per-step width shells — each step optimizes for its task, not one global auth width. */
export function getStudentStepShellClass(step: number): string {
  switch (step) {
    case 0:
      // Account: focused single-column form (Stripe/Notion-style credentials step)
      return 'mx-auto w-full max-w-[400px]'
    case 1:
      // Academic: moderate width; paired related fields on sm+
      return 'mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl'
    case 2:
      // Skills: comfortable reading width; pills wrap naturally (not ultra-wide dashboard)
      return 'mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl'
    default:
      return 'mx-auto w-full max-w-[400px]'
  }
}
