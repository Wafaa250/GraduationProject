/**
 * Company Workspace layout tokens.
 * Dashboard (`CompanyDashboardPage`) is the reference — all pages inherit these values.
 */
export const CW_MAX_WIDTH = "max-w-[1280px]" as const;

export const cwLayout = {
  /** Outer page shell — padding, max width, vertical rhythm */
  page: "p-6 md:p-8 max-w-[1280px] mx-auto w-full space-y-7",
  /** Vertical stack between major page blocks */
  section: "space-y-5",
  /** Standard grid gap for layouts and cards */
  grid: "gap-5",
  /** Dense grid for metrics and compact card rows */
  gridDense: "gap-3",
  /** Standard elevated card body padding */
  cardPadding: "p-5",
  /** Primary content card padding (forms, wizards, detail views) */
  cardPaddingLg: "p-6 md:p-7",
  /** Loading, error, and empty state vertical padding */
  statePadding: "py-16 px-6",
  /** Card grid — recommendations, discovery */
  cardGrid: "grid md:grid-cols-2 xl:grid-cols-3 gap-4",
  /** Inner card grid (saved recommendations, etc.) */
  innerCardGrid: "grid sm:grid-cols-2 gap-3",
  /** Page hero — executive dashboard */
  hero: "cw-dashboard-hero relative overflow-hidden p-6 md:p-8",
  /** Settings / sidebar layouts */
  sidebarGrid: "grid lg:grid-cols-[260px_1fr] gap-6 items-start",
  /** Two-column form layout within full-width pages */
  formGrid: "grid sm:grid-cols-2 gap-6",
} as const;
