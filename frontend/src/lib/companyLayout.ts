/**
 * Company Workspace layout tokens.
 * Dashboard (`CompanyDashboardPage`) is the reference — all pages inherit these values.
 */
export const CW_MAX_WIDTH = "max-w-[1500px]" as const;

export const cwLayout = {
  /** Outer page shell — padding, max width, vertical rhythm */
  page: "p-6 md:p-8 max-w-[1500px] mx-auto w-full space-y-6",
  /** Vertical stack between major page blocks */
  section: "space-y-6",
  /** Standard grid gap for layouts and cards */
  grid: "gap-6",
  /** Dense grid for metrics and compact card rows */
  gridDense: "gap-4",
  /** Standard elevated card body padding */
  cardPadding: "p-6",
  /** Primary content card padding (forms, wizards, detail views) */
  cardPaddingLg: "p-6 md:p-8",
  /** Loading, error, and empty state vertical padding */
  statePadding: "py-16 px-6",
  /** Page hero — matches Dashboard */
  hero: "relative overflow-hidden rounded-3xl border bg-card cw-hero-bg p-8 md:p-10 shadow-sm",
  /** Settings / sidebar layouts */
  sidebarGrid: "grid lg:grid-cols-[260px_1fr] gap-6 items-start",
  /** Two-column form layout within full-width pages */
  formGrid: "grid sm:grid-cols-2 gap-6",
} as const;
